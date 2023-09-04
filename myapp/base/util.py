# import xlwt
import base64
import collections
import datetime
import json
import os
import urllib.request
from datetime import date
from decimal import *
from io import BytesIO

from base.models import AppResponse, SysParameter, UISettings
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.http import HttpResponse, response
from exception_log import manager

# from sqlalchemy import create_engine


class Util(object):
    DBENGINE = None

    @staticmethod
    def get_permission_role(user,perms):
        permissions = {}
        for perm in perms:
            permissions[perm] = Util.has_perm(perm, user)

        return permissions

    @staticmethod
    def fulltext_str_to_words(content):
        words = set()
        #words = []
        for word in content.lower().split(" "):
            word = word.strip("'")
            if len(word) >= 2:
                words.add(word)
        return words
        #return words - Util.STOP_WORDS

    user_perm_msg = 'You do not have permission to perform this action'
    sys_param_key = 'sys_parameters'

    import_model_fields = {
        "tasks": [
            {"col_label": "Title name", "col_name": "name", "keywords": "	Title name,title", "data_type": "string", "is_required": "true"},
            {"col_label": "Assigned user firstname", "col_name": "assigned_user_firstname", "keywords": "Assigned user firstname", "data_type": "string", "is_required": "false"},
            {"col_label": "Assigned user lastname", "col_name": "assigned_user_lastname", "keywords": "Assigned user lastname", "data_type": "string", "is_required": "false"},
            {"col_label": "Due date", "col_name": "due_date", "keywords": "due date,due", "data_type": "string", "is_required": "true"},
            {"col_label": "Priority", "col_name": "priority", "keywords": "priority", "data_type": "string", "is_required": "true"},
            {"col_label": "Description", "col_name": "description", "keywords": "description", "data_type": "string", "is_required": "true"},
        ],
        "escalations": [
            {"col_label": "Title name", "col_name": "titlename", "keywords": "	Title name,titlename", "data_type": "string", "is_required": "true"},
            {"col_label": "User firstname", "col_name": "user_firstname", "keywords": "user firstname", "data_type": "string", "is_required": "false"},
            {"col_label": "User lastname", "col_name": "user_lastname", "keywords": "user lastname", "data_type": "string", "is_required": "false"},
            {"col_label": "Customer name", "col_name": "customername", "keywords": "	Customer name,customername", "data_type": "string", "is_required": "true"},
            {"col_label": "Order nr", "col_name": "order_no", "keywords": "	Order nr,order_no", "data_type": "string", "is_required": "true"},
            {"col_label": "Source", "col_name": "source", "keywords": "	Source,source", "data_type": "string", "is_required": "true"},
            {"col_label": "Priority", "col_name": "priority", "keywords": "priority", "data_type": "string", "is_required": "true"},
            {"col_label": "Issue", "col_name": "issue", "keywords": "	Issue,issue", "data_type": "string", "is_required": "false"},
            {"col_label": "Frt", "col_name": "frt", "keywords": "	Frt,frt", "data_type": "string", "is_required": "false"},
            {"col_label": "Comment", "col_name": "comment", "keywords": "	Comment,comment", "data_type": "string", "is_required": "false"},
            {"col_label": "Team responsible", "col_name": "teamresponsible", "keywords": "	Team responsible,teamresponsible", "data_type": "string", "is_required": "true"},
            {"col_label": "Ticket nr", "col_name": "ticketnr", "keywords": "	Ticket nr,ticketnr", "data_type": "string", "is_required": "false"},
        ],
        "internal_requests": [
            {"col_label": "Title name", "col_name": "titlename", "keywords": "	Title name,titlename", "data_type": "string", "is_required": "true"},
            {"col_label": "User firstname", "col_name": "user_firstname", "keywords": "user firstname", "data_type": "string", "is_required": "false"},
            {"col_label": "User lastname", "col_name": "user_lastname", "keywords": "user lastname", "data_type": "string", "is_required": "false"},
            {"col_label": "Customer name", "col_name": "customername", "keywords": "	Customer name,customername", "data_type": "string", "is_required": "true"},
            {"col_label": "Order nr", "col_name": "order_no", "keywords": "	Order nr,order_no", "data_type": "string", "is_required": "true"},
            {"col_label": "Priority", "col_name": "priority", "keywords": "priority", "data_type": "string", "is_required": "true"},
            {"col_label": "Issue", "col_name": "issue", "keywords": "	Issue,issue", "data_type": "string", "is_required": "false"},
            {"col_label": "Comment", "col_name": "comment", "keywords": "	Comment,comment", "data_type": "string", "is_required": "false"},
            {"col_label": "Ticket nr", "col_name": "ticketnr", "keywords": "	Ticket nr,ticketnr", "data_type": "string", "is_required": "false"},
        ],
    }

    import_dropdown_field = {
        "tasks": [
            {"col_label": "Title name", "col_name": "name"},
            {"col_label": "Assigned user firstname", "col_name": "assigned_user_firstname"},
            {"col_label": "Assigned user lastname", "col_name": "assigned_user_lastname"},
            {"col_label": "Due date", "col_name": "due_date"},
            {"col_label": "Priority", "col_name": "priority"},
            {"col_label": "Description", "col_name": "description"},
        ],
        "escalations": [
            {"col_label": "Title name", "col_name": "titlename"},
            {"col_label": "User firstname", "col_name": "user_firstname"},
            {"col_label": "User lastname", "col_name": "user_lastname"},
            {"col_label": "Customer name", "col_name": "customername"},
            {"col_label": "Order nr", "col_name": "order_no"},
            {"col_label": "Source", "col_name": "source"},
            {"col_label": "Priority", "col_name": "priority"},
            {"col_label": "Issue", "col_name": "issue"},
            {"col_label": "Frt", "col_name": "frt"},
            {"col_label": "Comment", "col_name": "comment"},
            {"col_label": "Team responsible", "col_name": "teamresponsible"},
            {"col_label": "Ticket nr", "col_name": "ticketnr"},
        ],
        "internal_requests": [
            {"col_label": "Title name", "col_name": "titlename"},
            {"col_label": "User firstname", "col_name": "user_firstname"},
            {"col_label": "User lastname", "col_name": "user_lastname"},
            {"col_label": "Customer name", "col_name": "customername"},
            {"col_label": "Order nr", "col_name": "order_no"},
            {"col_label": "Priority", "col_name": "priority"},
            {"col_label": "Issue", "col_name": "issue"},
            {"col_label": "Comment", "col_name": "comment"},
            {"col_label": "Ticket nr", "col_name": "ticketnr"},
        ]
    }

    @staticmethod
    def get_clean_string(string):
        return "".join(e for e in string if e.isalnum())

    @staticmethod
    def get_public_ip_address():
        my_ip_address = json.loads(urllib.request.urlopen('http://jsonip.com').read())['ip']
        return my_ip_address

    @staticmethod
    def get_post_data(request):
        if request.POST.get('postData'):
            json_data = json.loads(request.POST['postData'])
            data = {}
            for d in json_data:
                data[d['name']] = d['value'] if "value" in d else ""
            return data
        else:
            return request.POST

    @staticmethod
    def get_sort_column(data,default_col='id'):
        if data['order']:
            sort_col_index = int(data['order'][0]['column']) if data['order'] else 0
            sort_dir = data['order'][0]['dir'] if data['order'] else 'desc'
            sort_col = data['columns'][sort_col_index]['data'] if data['columns'] else None
            sort_dir = sort_dir if sort_col is not None else 'desc'
            sort_col = default_col if sort_col is None else sort_col
            sort_col = '-'+sort_col if sort_dir == 'desc' else sort_col
            return sort_col
        else:
            return '-'+default_col

    @staticmethod
    def get_permitted_url(urls, request):
        permitted_models = request.session.get('permitted_model', False)
        permitted_urls = []
        if urls and permitted_models:
            for url in urls:
                if url[1] in permitted_models:
                    permitted_urls.append(url)
            return permitted_urls
        else:
            return urls

    @staticmethod
    def is_integer(s):
        try:
            int(s)
            return True
        except ValueError:
            return False

    @staticmethod
    def decimal_to_str(request, value):
        if value != None:
            decimal_place = 4
            if request != None and 'decimal_point' in request.session:
                decimal_place = int(request.session.get('decimal_point'))
            format = "%."+str(decimal_place)+"f"
            new_decimal = format % value
            return new_decimal
        else:
            return ''

    @staticmethod
    def decimal_to_float(decimal_place, value):
        try:
            format = "%."+str(decimal_place)+"f"
            new_decimal = format % value
            return round(float(new_decimal), decimal_place)
        except ValueError:
            return 0.00

    @staticmethod
    def str_to_int(value):
        try:
            return int(value)
        except ValueError:
            return 0

    @staticmethod
    def str_to_float(decimal_place, value):
        try:
            return round(float(value), decimal_place)
        except ValueError:
            return 0.00

    @staticmethod
    def rreplace(s, old, new, occurrence):
        li = s.rsplit(old, occurrence)
        return new.join(li)

    @staticmethod
    def convert_unicode_dict_to_str_dict(data):
        if isinstance(data, (str, bytes)):
            return str(data)
        elif isinstance(data, collections.Mapping):
            return dict(map(Util.convert_unicode_dict_to_str_dict, data.items()))
        elif isinstance(data, collections.Iterable):
            return type(data)(map(Util.convert_unicode_dict_to_str_dict, data))
        else:
            return data

    @staticmethod
    def get_choice_key_by_value(data, value):
        for item in data:
            if str(item[1]).lower() == value.strip().lower():
                return item[0]
        return None

    @staticmethod
    def get_menu_obj(obj, exclude_menu = False):
        all_items = []

        ExcludeMenuCode = ['customer_invoices_cancelled', 'customer_invoices_closed', 'customer_invoices_pending',
                            'financial_out_cancel','financial_out_closed','supplier_invoices_pending','sales_orders_cancelled',
                            'sales_orders_pending','sales_orders_shipped','purchase_orders_cancelled','purchase_orders_received',
                            'purchase_orders_pending','purchase_plans_pending','purchase_plans_finished','mo_pending','mo_finished','mo_cancelled',
                            'logistics_shipments_cancelled','logistics_receipts_cancelled','logistics_shipments_pending','logistics_receipts_pending',
                            'logistics_shipments_shipped','logistics_receipts_received']

        def add_menu(menu):
            if menu['parent_id_id'] == None:
                menu['parent_id_id'] = 0
            menu_data = {
                'id': menu['id'],
                'name': menu['name'],
                'parent_id_id': menu['parent_id_id'],
                'url': menu['url'],
                'icon': menu['icon'],
                'sequence': menu['sequence'],
                'on_click': menu['on_click'],
                'menu_code': menu['menu_code'],
                'is_master': menu['is_master'],
                menu['id'] : []
            }
            all_items.append(menu_data)

        def append_child(item):
            for i, parent in enumerate(all_items):
                if item['parent_id_id'] in parent:
                    obj = all_items[i][item['parent_id_id']]
                    obj.append(item)
                    obj = sorted(obj, key=lambda x:x['sequence'])
                    all_items[i][item['parent_id_id']] = obj
                    all_items.remove(item)

        for menus in obj:
            for menu in menus:
                if exclude_menu and menu['menu_code'] in ExcludeMenuCode:
                    continue
                add_menu(menu)

        all_items = sorted(all_items, key=lambda x:x['parent_id_id'])
        for item in all_items[::-1]:
            append_child(item)

        return all_items

    @staticmethod
    def get_hierarchy_menu_obj(menu, obj):
        if menu.parent_id == None:
            return obj
        else:
            obj.insert(0, menu.parent_id)
            return Util.get_hierarchy_menu_obj(menu.parent_id, obj)

    @staticmethod
    def get_receipt_series_ordernum(receipt, transfer_num):
        if receipt.backorder_id == None:
            return transfer_num
        else:
            transfer_num = receipt.backorder.transfer_num + "/" + transfer_num
            return Util.get_receipt_series_ordernum(receipt.backorder, transfer_num)

    @staticmethod
    def get_sys_paramter(key):
        new_sys_parameter = {
            'decimalpoint': ['3', 'Default decimal point of the system'],
            'decimalpoint_grid' : ['2','To show decimal point in grid-list'],
            'email_backend': ['', 'Backend system for sending an email'],
            'email_host': ['', 'Gateway provider for sending an email'],
            'email_host_user': ['', 'Username for sending an email'],
            'email_host_password': ['', 'Password for sending an email'],
            'email_port': ['', 'Port of the mail gateway'],
            'email_use_ssl': ['', 'SSL setting for the email'],
            'email_from': ['', 'From email address for of the email'],
            'email_bcc': ['', 'BCC mail address for the mail'],
            'LAUNCHER_VIEW':['False','Launcher view of website'],
            'COMPANY_LOGO':['logo1-w.png','Set company logo.'],
            'Default_role_id':[2, 'Default role id for sales app if'],
            "AWS_S3_HANDLER": ["https://sparrow-bg.s3.us-east-2.amazonaws.com/", "AWS S3 bucket url", False],
        }

        sys_parameters = None
        if Util.get_cache('public', Util.sys_param_key) == None:
            sys_parameters = SysParameter.objects.all()
            Util.set_cache('public', Util.sys_param_key, sys_parameters, 3600)
        else:
            sys_parameters = Util.get_cache('public', Util.sys_param_key)
        sys_param = None
        for param in sys_parameters:
            if param.para_code == key:
                sys_param = param
                break

        if sys_param == None and key in new_sys_parameter.keys():
            sys_parameter = None
            sys_parameter = SysParameter.objects.create(para_code = key, para_value = new_sys_parameter[key][0], descr = new_sys_parameter[key][1])
            Util.clear_cache('public', Util.sys_param_key)
            sys_parameters = SysParameter.objects.all()
            Util.set_cache('public', Util.sys_param_key, sys_parameters, 3600)
            sys_param = sys_parameter
        return sys_param

    @staticmethod
    def set_cache(schemas, key, value, time = 3600):
        schemas_key = schemas + key
        cache.set(schemas_key, value, time)

    @staticmethod
    def get_cache(schemas, key):
        schemas_key = schemas + key
        if schemas_key in cache:
            return cache.get(schemas_key)
        return None

    @staticmethod
    def clear_cache(schemas, key):
        schemas_key = schemas + key
        if schemas_key in cache:
            cache.delete(schemas_key)

    @staticmethod
    def get_main_parent_menu(perm_menu_ids):
        parent_menus = None
        if Util.get_cache('public', 'main_parent_menu') is None:
            parent_menus = MainMenu.objects.filter(parent_id__isnull=True, is_active = True).order_by('sequence')
            Util.set_cache('public', 'main_parent_menu', parent_menus, 3600)
        else:
            parent_menus = Util.get_cache('public', 'main_parent_menu')
        permitted_menus = []
        for menu in parent_menus:
            for perm in perm_menu_ids:
                if perm.parent_id.id == menu.id:
                    permitted_menus.append(menu)
                    break
        return permitted_menus

    @staticmethod
    def get_main_child_menu(username,perm_menu_str):
        user = User.objects.filter(username =username ).first()
        user_profile = UserProfile.objects.filter(user_id = user.id).first()

        child_menus = None
        if Util.get_cache('public', 'get_main_child_menu') is None:
            child_menus = (MainMenu.objects.filter(is_active = True, is_external = False)
                            .values('id', 'url', 'company_code', 'name', 'parent_id_id', 'icon', 'sequence', 'on_click','menu_code','is_master')
                            .exclude(parent_id__isnull=True).order_by('sequence'))
            Util.set_cache('public', 'get_main_child_menu', child_menus, 3600)
        else:
            child_menus = Util.get_cache('public', 'get_main_child_menu')

        permitted_menus = []
        if perm_menu_str != '' or user.is_superuser:
            perms = []
            if user.is_superuser == False:
                perms = [int(x) for x in perm_menu_str.split(',')]

            for menu in child_menus:
                if menu['id'] in perms or user.is_superuser:
                    permitted_menus.append(menu)
        return permitted_menus

    @staticmethod
    def get_resource_path(resource, resource_name):
        resource_path = os.path.join(settings.RESOURCES_ROOT, 'public', 'resources')
        if resource == 'profile':
            resource_path = os.path.join(resource_path, 'profile_image')

        if resource_name:
            resource_path = os.path.join(resource_path, resource_name)

        return resource_path

    @staticmethod
    def get_resource_url(resource , resource_name):
        resource_url = settings.RESOURCES_URL + 'public' + '/resources/'

        if resource == 'profile':
            resource_url += 'profile_image/'
        resource_url += resource_name
        return resource_url

    @staticmethod
    def export_to_xls(headers, records, file_name):
        f = BytesIO()
        try:
            wb = xlwt.Workbook()
            ws = wb.add_sheet('Customers')

            for col_index, value in enumerate(headers):
                ws.write(0, col_index, value["title"])

            row_number = 1
            for record in records:
                for col_index, (key, value) in enumerate(record.items()):
                    if "type" in headers[col_index]:
                        if headers[col_index]["type"] == "date":
                            value = Util.get_display_date(value)

                    ws.write(row_number, col_index, value)
                row_number = row_number + 1

            wb.save(f)

            response = HttpResponse(content_type="application/ms-excel")
            response['Content-Disposition'] = 'attachment; filename=%s' % file_name
            wb.save(response)
            return response
        finally:
            f.close()

    @staticmethod
    def get_local_time_obj(utctime):
        if Util.get_cache('public', 'local_datetime') is None:
            company = CompanyService.get_root_compnay()
            offset = company['timezone_offset'] if company['timezone_offset'] != None else 0
            Util.set_cache('public', 'local_datetime', offset, 3600)
        else:
            offset = Util.get_cache('public', 'local_datetime')

        if utctime == '' or utctime == None:
            return ''
        if offset == 0:
            new_time =  utctime
        else:
            new_time = utctime + datetime.timedelta(minutes = offset)

        return new_time

    @staticmethod
    def get_offset_info():
        if Util.get_cache('public', 'offset_info') is None:
            company = CompanyService.get_root_compnay()
            today = date.today()
            offset_info = {
                'offset' : company['timezone_offset'] if company['timezone_offset'] != None else 0,
                'daylight_offset' : company['daylight_offset'] if company['daylight_offset'] != None else 0,
                'daylight_start' : datetime.datetime.strptime(company['daylight_start'], "%d-%m").date().replace(year=today.year) if company['daylight_start'] not in [None, ''] else '',
                'daylight_end' : datetime.datetime.strptime(company['daylight_end'], "%d-%m").date().replace(year=today.year) if company['daylight_end'] not in [None, ''] else ''
            }

            Util.set_cache('public', 'offset_info', offset_info, 3600)
        else:
            offset_info = Util.get_cache('public', 'offset_info')

        return offset_info

    @staticmethod
    def get_display_date(utctime, showtime = False, date_format = None):
        if utctime is None or utctime == "":
            return ""

        if type(utctime) == str:
            utctime = datetime.datetime.strptime(utctime, "%Y-%m-%dT%H:%M:%S")

        if date_format == None:
            date_format = '%d/%m/%Y'

        if showtime:
            date_format = '%d/%m/%Y %H:%M %p'

        return utctime.strftime(date_format)

    @staticmethod
    def get_local_time(utctime, showtime=False, time_format=None):
        offset_info = Util.get_offset_info()

        if utctime == '' or utctime == None:
            return ''
        #Add extra offset in daylight saving period
        if (offset_info['daylight_start'] != '' and offset_info['daylight_end'] != '' and
            offset_info['daylight_start'] < utctime.date() and utctime.date() < offset_info['daylight_end']):
            utctime = utctime + datetime.timedelta(minutes = offset_info['daylight_offset'])

        if offset_info['offset'] == 0:
            new_time =  utctime
        else:
            new_time = utctime + datetime.timedelta(minutes = offset_info['offset'])

        if showtime:
            if time_format == None:
                time_format = '%d/%m/%Y %H:%M'
            return new_time.strftime(time_format)
        else:
            return new_time.strftime('%d/%m/%Y')

    @staticmethod
    def get_utc_datetime(local_datetime, has_time = True):
        offset_info = Util.get_offset_info()

        local_date = local_datetime
        if isinstance(local_datetime, (str, bytes)):
            local_datetime = local_datetime.replace("-","/").replace("\\","/")
            today = datetime.datetime.today()
            if len(local_datetime.split("/")) == 2:
                local_datetime = str(local_datetime) + "/" + str(today.year)
            if ":" in str(local_datetime):
                has_time = True
            if has_time:
                local_date = datetime.datetime.strptime(local_datetime, "%d/%m/%Y %H:%M")
            else :
                local_date = datetime.datetime.strptime(local_datetime, "%d/%m/%Y")
        #Substract extra offset in daylight saving period
        if (offset_info['daylight_start'] != '' and offset_info['daylight_end'] != '' and
            offset_info['daylight_start'] < local_date.date() and local_date.date() < offset_info['daylight_end']):
            local_date = local_date - datetime.timedelta(minutes = offset_info['daylight_offset'])

        utc_datetime = local_date - datetime.timedelta(minutes = offset_info['offset'])
        return utc_datetime

    @staticmethod
    def get_ui_settings(user_id):
        col_settings = []
        if Util.get_cache('public', 'columns_ui_settings' + str(user_id)) is None:
            col_settings = UISettings.objects.filter(user_id = user_id).values('url','table_index','col_settings')
            Util.set_cache('public', 'columns_ui_settings' + str(user_id), col_settings, 3600)
        else:
            col_settings = Util.get_cache('public', 'columns_ui_settings'+ str(user_id))

        return col_settings


    @staticmethod
    def get_user_permissions(user_id):
        groups = UserGroup.objects.filter(user_id = user_id).values_list('group_id', flat = True)
        menu_perm_ids = []

        for group_id in groups:
            if Util.get_cache('public', 'ROLES' + str(group_id)) is None:
                menu_perms = GroupPermission.objects.filter(group_id = group_id).values('page_permission__menu_id','page_permission__menu__menu_code','page_permission__act_code')
                Util.set_cache('public', 'ROLES' + str(group_id), menu_perms, 3600)
            else:
                menu_perms = Util.get_cache('public', 'ROLES' + str(group_id))
            menu_perm_ids += menu_perms
        return menu_perm_ids

    @staticmethod
    def has_perm(act_code, user):
        has_permission = False
        if user.is_superuser == True:
            has_permission = True

        user_perms_objs = Util.get_user_permissions(user.id)

        for user_perms_obj in user_perms_objs:
            if user_perms_obj['page_permission__act_code'] == act_code:
                has_permission = True
                break
            else:
                has_permission = False
        return has_permission

    @staticmethod
    def listing_has_perm(menu_code, user):
        has_permission = False
        if user.is_superuser == True:
            return True

        user_perms_objs = Util.get_user_permissions(user.id)

        for user_perms_obj in user_perms_objs:
            if user_perms_obj['page_permission__act_code'] == "view" and user_perms_obj['page_permission__menu__menu_code'] == menu_code:
                has_permission = True
                break

        return has_permission

    @staticmethod
    def get_permitted_menu(user_id):
        menu_ids = []

        user_perms_objs = Util.get_user_permissions(user_id)
        for user_perms_obj in user_perms_objs:
            if user_perms_obj['page_permission__act_code'] == 'view':
                menu_ids.append(user_perms_obj['page_permission__menu_id'])

        child_menus = MainMenu.objects.filter(parent_id_id__in = menu_ids).values_list("id", flat = True)
        menu_ids += child_menus
        sub_parent_menus = MainMenu.objects.filter(id__in = menu_ids, parent_id_id__isnull=False).values_list("parent_id_id", flat = True).distinct()
        menu_ids += sub_parent_menus
        return  ','.join(map(str, menu_ids))

    @staticmethod
    def get_key(key):
        try:
            if key == None:
                return 0
            return float(key)
        except ValueError:
            return key

    @staticmethod
    def get_human_readable_time(minutes):
        time = ''
        cal_hrs = int(minutes/60)
        days = int(cal_hrs/24)
        hrs = cal_hrs - days *24
        mins = int(minutes - (cal_hrs * 60))
        sec = (minutes * 60)

        if days != 0:
            days = "%02d" % (days)
            time += str(days) + ' days '
        if hrs != 0:
            spent_hours = "%02d" % (hrs)
            time += str(spent_hours) + ' hrs '
        if mins != 0:
            mins = "%02d" % round(mins)
            time += str(mins) + ' mins '
        if sec != 0 and  hrs == 0 and mins == 0:
            sec = "%02d" % round(sec)
            time += str(sec) + ' sec '
        return time

    @staticmethod
    def db_engine():

        SQLSERVER_CONN = settings.SQL_SERVER  # r"mssql+pyodbc://sa:sa_2022@WINSERVER1\SQL2014/pcbpower_db?driver=SQL+Server"
        if Util.DBENGINE is None:
            Util.DBENGINE = create_engine(SQLSERVER_CONN)

        return Util.DBENGINE

    def db_execute_sp(sp_name, sp_param, fetch_type):
        db_engine = Util.db_engine()
        filtered_data = None
        with db_engine.begin() as conn:
            if fetch_type == "fetch_all":
                filtered_data = conn.execute(sp_name, sp_param).fetchall()
            elif fetch_type == "fetch_one":
                filtered_data = conn.execute(sp_name, sp_param).fetchone()
            elif fetch_type == "multi_execute":
                if sp_param:
                    filtered_data = conn.execute(sp_name, sp_param, multi=True).fetchall()
                else:
                    filtered_data = conn.execute(sp_name).fetchall()
            else:
                conn.execute(sp_name, sp_param)

        return filtered_data

    @staticmethod
    def get_sort_col_key_from_col_name(col_name):
        col_key = "CreatedDate"
        order_by = "DESC"
        sort_columns_info = {
            "id": "RID",
            "name": "sCodeName",
            "sCreatedOn": "sCreatedOn",
            "action_on": "CreatedDate",
            "created_on" : "sCreatedOn",
            "fullname" : "sFirstName",
            "email" : "sEmail",
            "lead_value":"sLeadValue",
            "cust_comp_name":"sCompName",
            "escno":"sEscNr",
            "due_date":"sDueDate",
            "holiday_date":"sHolidayDate",
            "city":"sName",
        }

        if col_name.split('-')[-1] in sort_columns_info:
            col_key = sort_columns_info[col_name.split('-')[-1]]
            order_by = "DESC" if "-" in col_name else "ASC"

        return col_key, order_by

    @staticmethod
    def xls_to_response(xls, fname):
        response = HttpResponse(content_type="application/ms-excel")
        response["Content-Disposition"] = "attachment; filename=%s" % fname
        xls.save(response)
        return response

    @staticmethod
    def get_and_increase_doc_number(doc_type):
        try:
            doc_number = None
            with transaction.atomic():
                db_engine = Util.db_engine()
                with db_engine.begin() as conn:
                    if doc_type == "Escalation" or doc_type == "Internal request" or doc_type == "Lead" or doc_type == "Corrective action report":
                        doc_number_data = conn.execute("set nocount on; exec sales_get_or_increase_doc_number ?,?,?,?",['get', doc_type, None, None]).fetchone()
                        prefix = doc_number_data['sPrefix']
                        nextint = doc_number_data['sNextInt']
                        increment = doc_number_data['sIncrement']
                        length = doc_number_data['sLength']
                        doc_number = doc_number_data['sNextNum']
                        increased_doc_number = prefix + str(nextint+increment).zfill(length)
                        conn.execute('set nocount on; exec sales_get_or_increase_doc_number ?,?,?,?',['increase', doc_type, nextint+increment, increased_doc_number])
                return doc_number
        except Exception as e:
            manager.create_from_exception(e)
            return None

    @staticmethod
    def run_bulk_query(connection, query, parameters, number_of_resultset):
        result = {}
        try:
            cursor = connection.cursor()
            cursor.execute(query, parameters)
            for resultset in number_of_resultset:
                result[resultset] = []
                names = []
                for c in cursor.description:
                    if cursor.description is not None:
                        names.append(c[0])
                for row in cursor.fetchall():
                    result[resultset].append(dict(zip(names, row)))
                cursor.nextset()
            return result
        except Exception as e:
            print(str(e))

    @staticmethod
    def get_current_and_end_date_for_reports(start_date, end_date, addEx_days:int=0 ,with_time:bool=False):
        if start_date == "":
            start_date = (datetime.datetime.today()).date().strftime("%Y%m%d%H%M%S" if with_time else "%Y%m%d")
        else:
            start_date = datetime.datetime.strptime(str(start_date), "%d/%m/%Y").strftime("%Y%m%d%H%M%S" if with_time else "%Y%m%d")

        if end_date == "":
            end_date = datetime.datetime.today()+datetime.timedelta(days=addEx_days)
            end_date = end_date.date().strftime("%Y%m%d%H%M%S" if with_time else "%Y%m%d")
        else:
            end_date = datetime.datetime.strptime(str(end_date), "%d/%m/%Y")+datetime.timedelta(days=addEx_days)
            end_date = end_date.date().strftime("%Y%m%d%H%M%S" if with_time else "%Y%m%d")
        return start_date, end_date

    @staticmethod
    def holiday_date_logic():
        date = datetime.datetime.today()
        current_date =  datetime.datetime.strftime(date,"%d/%m/%Y %H:%M:%S")
        current_date =  datetime.datetime.strptime(str(current_date),"%d/%m/%Y %H:%M:%S")
        # current_date =  datetime.datetime.strptime('20/08/2022 18:30:34',"%d/%m/%Y %H:%M:%S")

        #open and close time set 8:AM to 8:PM
        open_time = 8
        close_time = datetime.time(20, 00, 0)
        current_weekday = current_date.isoweekday()
        add_3_hour = current_date+datetime.timedelta(hours=3)

        #find different between current time to close time..
        time_1 = datetime.datetime.strptime(str(close_time),"%H:%M:%S")
        time_2 = datetime.datetime.strptime(str(add_3_hour.time()),"%H:%M:%S")
        time_interval = time_2 - time_1
        second =  time_interval.total_seconds()
        hour = int(second // 3600)
        # minute = int(second // 60)
        minute = int((second % 3600) // 60)

        #add a hour and days for current datetime
        if hour > 0 or second > 0:
            current_date = current_date.replace(hour=(hour+open_time),minute=minute)
            if current_weekday == 6:
                current_date = current_date+datetime.timedelta(days=2)
            elif current_weekday == 7:
                current_date = current_date+datetime.timedelta(days=1)
            elif current_weekday < 6:
                current_date = current_date+datetime.timedelta(days=1)
        else:
            current_date = current_date+datetime.timedelta(hours=3)
            if current_weekday == 7:
                current_date = current_date+datetime.timedelta(days=1)

        # check holiday date for up comeing date
        db_engine = Util.db_engine()
        with db_engine.begin() as conn:
            while True:
                holiday_nextday_check = conn.execute("set nocount on; exec sales_holidays ?,?,?,?,?,?,?,?,?,?", ["existing_date",None,str(current_date.date()),None,None,None,None, None, None, None]).fetchone()
                if holiday_nextday_check:
                    current_date = current_date+datetime.timedelta(days=1)
                    current_weekday = current_date.isoweekday()
                    if current_weekday == 7:
                        current_date = current_date+datetime.timedelta(days=1)
                        if hour < 0 or second < 0:
                            current_date = current_date.replace(hour=(3+open_time),minute=0,second=0)
                else:
                    break
        return current_date


    @staticmethod
    def insert_history(request,entity_type, entity_id, action_id,history_msg:str):
        from base import views as base_views
        user = request.user
        pcb_user = UserProfile.objects.filter(user_id=user.id).values('pcb_power_user_id').first() if user.id else User.objects.filter(email='admin@admin.com').values("userprofile__pcb_power_user_id").first()
        pcb_user_id = pcb_user['pcb_power_user_id'] if 'pcb_power_user_id' in pcb_user else pcb_user['userprofile__pcb_power_user_id']
        ipaddress = base_views.get_client_ip(request)
        code_for_history ={
            'INSERT':7306,
            'UPDATE':9849,
            'DELETE':7431,
        }
        Util.db_execute_sp("set nocount on; exec uhistory_Insert_v3 ?,?,?,?,?,?",[pcb_user_id,entity_type,entity_id,code_for_history[action_id],ipaddress, history_msg],'insert_query')


    @staticmethod
    def encrypt(value):
        BLOCK_SIZE = 32  # Bytes
        cipher = AES.new(settings.SECRET_KEY[:32].encode("utf8"), AES.MODE_ECB)
        msg = cipher.encrypt(pad(value.encode("utf-8"), BLOCK_SIZE))
        b64_encoded = base64.b64encode(msg)
        return b64_encoded.decode("utf-8")


    @staticmethod
    def decrypt(value):
            BLOCK_SIZE = 32  # Bytes
            decipher = AES.new(settings.SECRET_KEY[:32].encode("utf8"), AES.MODE_ECB)
            b64_decoded = base64.b64decode(value.encode("utf-8"))
            msg_dec = decipher.decrypt(b64_decoded)
            return unpad(msg_dec, BLOCK_SIZE)