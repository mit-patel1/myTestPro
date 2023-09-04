from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core import serializers
from base.util import Util
from base.models import AppResponse, SysParameter
from base.forms import *
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Sum, F, FloatField
from django.db import transaction
from auditlog.models import AuditAction
from django.db import connection
from django.utils.timezone import datetime
from django.utils.dateformat import DateFormat
from django.template.loader import render_to_string
from django.template import RequestContext
import datetime
import json
import unicodedata
from datetime import timedelta
import decimal
from exception_log import manager
from sparrow.decorators import check_view_permission
import logging
from io import StringIO
import xlwt
from django.contrib.contenttypes.models import ContentType
from uuid import uuid4
from django.conf import settings
import os
from os import path
import mimetypes
import ast
from decimal import *
from base import choices
from io import BytesIO
from django.db.models import DateTimeField, Expression, ExpressionWrapper
from datetime import date


def report_query(request, report_id):
    try:
        with connection.cursor() as cursor:
            report_query = DMI_queries.objects.filter(Q(Q(id=report_id))).first()
            date = datetime.datetime.now()
            cur_year = str(date.year)
            query = report_query.report_sql
            query = query.replace("#year$", cur_year)
            para = report_query.report_para
            date_query_value = {}
            date_module = False
            if para:
                para_values = [x for x in para.split(",")]
                for para_value in para_values:
                    para_element = para_value.split(":")
                    date_query_value[para_element[0]] = para_element[1]
            conditions = get_conditions(query)

            for condition in conditions:
                if "date" in condition:
                    date_module = True
            length = len(conditions)
            if length == 0:
                data = execute_query(query)
                return render(
                    request,
                    "base/report.html",
                    {
                        "id": report_query.id,
                        "date_module": date_module,
                        "title": report_query.title,
                        "code": report_query.report_code,
                        "is_table": True,
                        "rows": data[0],
                        "columns": json.dumps(data[1]),
                        "conditions": conditions,
                        "date_query_value": json.dumps(date_query_value),
                    },
                )
            else:
                if "worker_id" in conditions:
                    query = get_plain_query(conditions, query, True).rsplit("where", 1)[0].strip()
                    data = execute_query(query)
                else:
                    query = get_plain_query(conditions, query, True)
                    data = execute_query(query + " limit 1")
                return render(
                    request,
                    "base/report.html",
                    {
                        "id": report_query.id,
                        "date_module": date_module,
                        "title": report_query.title,
                        "code": report_query.report_code,
                        "is_table": True,
                        "conditions": conditions,
                        "columns": json.dumps(data[1]),
                        "date_query_value": json.dumps(date_query_value),
                    },
                )

    except Exception as e:
        manager.create_from_exception(e)
        logging.exception("SOmething wemt wrong.")
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def get_conditions(query):
    conditions = []
    if query.find("$") != -1 and query.find("#") != -1:
        doller_count = query.count("$")
        hash_count = query.count("#")
        date_condition = []
        for i in range(0, doller_count):
            condition = str((query.split("#"))[i + 1].split("$")[0])
            conditions.append(condition)
    return conditions


def get_plain_query(conditions, query, is_blank, conditions_values=""):
    date = datetime.datetime.now()
    cur_year = str(date.year)

    if is_blank:
        for i in range(0, len(conditions)):
            text = "#" + conditions[i] + "$"

            if text.find("date") != -1:
                replace_text = DateFormat(datetime.datetime.now()).format("Y-m-d")

            else:
                if conditions[i] == "year":
                    replace_text = cur_year
                else:
                    replace_text = ""

            query = query.replace(text, replace_text)
    else:
        for i in range(0, len(conditions)):
            text = "#" + conditions[i] + "$"
            replace_text = ""
            if text.find("date") != -1:
                replace_text = DateFormat(datetime.datetime.strptime(str(conditions_values[conditions[i]].strip()), "%m/%d/%Y")).format("Y-m-d")
            else:
                if "worker_id" in conditions:
                    replace_text = conditions_values[conditions[i]] if conditions[i] in conditions_values else ""
                else:
                    replace_text = conditions_values[conditions[i]]
            query = query.replace(text, str(replace_text))
        worker_id = conditions_values["worker_id"] if "worker_id" in conditions_values else ""
        # if worker_id:
        #     query = query + ' where lab.id = ' + str(conditions_values['worker_id'])
    return query


def reports_search(request, report_id):
    try:
        request.POST = Util.get_post_data(request)
        start = int(request.POST["start"])
        length = int(request.POST["length"])
        sort_col = Util.get_sort_column(request.POST)

        is_blank = request.POST["is_blank"]
        response = {
            "draw": request.POST["draw"],
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": [],
        }

        queries = json.loads(request.POST.get("query_value")) if request.POST.get("query_value") != "" else ""

        report_query = DMI_queries.objects.filter(Q(Q(id=report_id))).first()
        query = report_query.report_sql
        conditions = get_conditions(query)

        if is_blank:
            if "worker_id" in conditions:
                query = get_plain_query(conditions, query, True, queries).rsplit("where", 1)[0].strip()
                data = execute_query(query)
            else:
                query = get_plain_query(conditions, query, True, queries)
                data = execute_query(query + " limit 10")
            for row in data[0]:
                row_list = {}
                for index, column in enumerate(data[1]):
                    column = "_".join(column.lower().split(" "))
                    if "Leave Balance" in data[1]:
                        row_list[column] = row[index]
                    else:
                        row_list[column] = ""
                response["data"].append(row_list)
            return HttpResponse(AppResponse.get(response), content_type="json")
        query = get_plain_query(conditions, query, False, queries)
        if "worker_id" in conditions:
            if queries["worker_id"] == "":
                query = query.rsplit("where", 1)[0].strip()

        if report_query.report_code == "generic_pr":
            query = query + " ORDER BY " + sort_col
        if report_query.report_code == "leave_bal":
            query = query + " ORDER BY " + sort_col
        recordsTotal_query = execute_query(query)
        query_data = execute_query(query + " limit " + str(length) + " OFFSET " + str(start))
        for row in query_data[0]:
            row_list = {}
            for index, column in enumerate(query_data[1]):
                column = "_".join(column.lower().split(" "))
                row_list[column] = row[index]
            response["data"].append(row_list)
        response["recordsTotal"] = len(recordsTotal_query[0])
        response["recordsFiltered"] = len(recordsTotal_query[0])
        return HttpResponse(AppResponse.get(response), content_type="json")

    except Exception as e:
        manager.create_from_exception(e)
        logging.exception("Something went wrong")
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def execute_query(query):
    with connection.cursor() as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [col[0].replace("_", " ").title() for col in cursor.description]
        resulted_rows = []
        for row in rows:
            cell_rows = []
            for cell in row:
                cell_rows.append(get_row_value(cell))
            resulted_rows.append(cell_rows)

        return [resulted_rows, columns]


def get_row_value(obj):
    if isinstance(obj, decimal.Decimal):
        return "%.3f" % float(obj)
    if isinstance(obj, datetime.datetime):
        return Util.get_local_time(obj)
    return obj


def create_export_file(request):
    try:
        if request.method == "POST":
            report_id = request.POST["report_id"]
            query_value = json.loads(request.POST.get("query_value")) if request.POST.get("query_value") != "" else ""
            report_query = DMI_queries.objects.filter(Q(Q(id=report_id))).first()
            query = report_query.report_sql
            conditions = get_conditions(query)
            if "worker_id" in conditions:
                if json.loads(request.POST.get("query_value"))["worker_id"] != "":
                    new_query = get_plain_query(conditions, query, False, query_value) + " limit 5000"
                    data = execute_query(new_query)
                else:
                    new_query = get_plain_query(conditions, query, False, query_value).rsplit("where", 1)[0].strip() + " limit 5000"
                    data = execute_query(new_query)
            else:
                data = execute_query(query)

            wb = xlwt.Workbook()
            file_name = report_query.title + ".xls"
            ws = wb.add_sheet("Sheet1")
            row_number = 0
            headers = data[1]
            column_count = 0

            style = xlwt.XFStyle()
            font = xlwt.Font()
            font.bold = True
            style.font = font

            for header in headers:
                ws.write(row_number, column_count, header, style=style)
                column_count = column_count + 1
            row_number = row_number + 1

            all_lines = []

            for line in data[0]:
                column_count = 0
                for datas in line:
                    ws.write(row_number, column_count, datas)
                    column_count = column_count + 1
                row_number = row_number + 1
            if not (path.exists(settings.MEDIA_ROOT)):
                os.makedirs(settings.MEDIA_ROOT)
            wb.save(settings.MEDIA_ROOT + file_name)
            return HttpResponse(json.dumps({"code": 1, "file_name": file_name}), content_type="json")

    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def get_uid():
    return str(uuid4())


def export_reports(request, file_name):
    try:
        file_path = os.path.join(settings.MEDIA_ROOT, file_name)
        if os.path.exists(file_path):
            contenttype = mimetypes.guess_type(file_path)[0]
            fp = open(file_path, "rb")
            response = HttpResponse(fp.read())
            fp.close()
            response["Content-Length"] = os.path.getsize(file_path)
            response["Content-Type"] = contenttype
            response["Content-Disposition"] = "attachment; filename=%s" % file_name
            os.remove(file_path)
            return response

    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def add_favorite_report(request):
    try:
        report_id = request.POST.get("report_id")
        favorite_report = FavoriteReport.objects.create(report_id=report_id, user_id=request.user.id)
        return HttpResponse(json.dumps({"code": 1, "report_id": favorite_report.report_id}), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def delete_favorite_report(request):
    try:
        report_id = request.POST.get("report_id")
        favorite_report = FavoriteReport.objects.filter(report_id=report_id, user_id=request.user.id).first()
        favorite_report.delete()
        return HttpResponse(json.dumps({"code": 1, "report_id": favorite_report.report_id}), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")
