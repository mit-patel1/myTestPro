import ast
import csv
import datetime
# from Crypto.Cipher import AES
import json
import logging
import random
from uuid import uuid4
from accounts.models import MainMenu, User, UserProfile
from accounts.services import CompanyService, UserService
from attachment import views as attachment_views
from auditlog.models import AuditAction
from base.forms import SysParameterForm
from base.models import AppResponse, FavoriteView, Remark, Remark_Attachment, SysParameter, UISettings
from base.util import Util
from django.conf import settings as project_settings
from django.contrib.auth.decorators import user_passes_test
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.views.decorators.clickjacking import xframe_options_exempt
from exception_log import manager
from mails.views import send_email_by_tmpl, send_sms
from messaging.models import Notification, NotificationEvent, SubscribeNotification
from post_office.models import EmailTemplate
from stronghold.decorators import public
from task.models import Task
from sparrow.decorators import check_view_permission
import os
from PIL import Image
from urllib import request as urllib_request
def index(request):
    try:
        if "username" not in request.session:
            return redirect("/accounts/signin/")

        username = request.session["username"]
        user_full_name = request.session["display_name"]
        profile_image = request.session["profile_image"]
        bg_image = request.session["bg_image"]
        mob_mode = request.session["mob_mode"] if "mob_mode" in request.session else ""
        company = CompanyService.get_root_compnay()

        user = UserProfile.objects.filter(user_id=request.user.id).values("menu_launcher").first()
        theme_info = UserService.get_theme_info(request.session.get("color_scheme", None))
        perm_menu_str = Util.get_permitted_menu(request.user.id)
        vertical_menu = []
        horizontal_menu = []
        horizontal_launcher = False

        if str(mob_mode) == "True":
            user["menu_launcher"] = True

        if user["menu_launcher"] == True:
            horizontal_menu = horizontal_menu_context(username, perm_menu_str)
            horizontal_launcher = True
        else:
            vertical_menu = vertical_menu_context(username, perm_menu_str, False)

        favoriteViews = FavoriteView.objects.filter(created_by_id=request.user.id)

        task_count = Task.objects.filter(assign_to_id=request.user.id).count()
        general_notification_count = Notification.objects.filter(is_read=False, user_id__isnull=True).count()
        user_notification_count = Notification.objects.filter(is_read=False, user_id=request.user.id).count()

        context = {}
        context["username"] = username
        context["user_full_name"] = user_full_name
        context["profile_image"] = Util.get_resource_url("profile", str(profile_image)) if profile_image else ""
        context["bg_color"] = theme_info["bg_color"]
        context["button_color"] = theme_info["button_color"]
        context["link_color"] = theme_info["link_color"]
        context["bg_image"] = bg_image
        context["bg_image_url"] = Util.get_sys_paramter("AWS_S3_HANDLER").para_value + str(bg_image) if bg_image is not None else None
        context["company_img"] = company["company_img"] if company["company_img"] != "" else ""
        context["is_white_bg_image"] = True if bg_image and "w" in bg_image else False
        context["favoriteViews"] = favoriteViews
        context["task_count"] = task_count
        context["general_notification_count"] = general_notification_count
        context["user_notification_count"] = user_notification_count
        context["menu_context"] = horizontal_menu
        context["total_count"] = general_notification_count + user_notification_count
        context["vertical_menu"] = vertical_menu
        context["launcher"] = horizontal_launcher

        return render(request, "base/index.html", context)

    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def dashboard(request):
    if Util.get_cache("public", "quotes") is None:
        with open(project_settings.BASE_DIR + "/base/quotes_data.csv") as f:
            reader = csv.reader(f, doublequote=True)
            all_quotes = []
            for row in reader:
                all_quotes.append(list(row))
            chosen_row = random.choice(all_quotes)
            Util.set_cache("public", "quotes", chosen_row, 86400)

    cache_quotes_data = Util.get_cache("public", "quotes")
    quote_info = {"author": cache_quotes_data[0], "quote": cache_quotes_data[1]}
    context = {}
    context["quote_info"] = quote_info
    return render(request, "base/dashboard.html", context)


def horizontal_menu_context(username, perm_menu_str):
    all_menu = []
    child_menu = []
    user = User.objects.get(username=username)
    if user.is_superuser == True:
        perm_menu_ids = MainMenu.objects.filter(parent_id_id__isnull=False).values_list("id", flat=True)
    else:
        perm_menu_ids = [int(x) for x in perm_menu_str.split(",")]
    parent_menus = (
        MainMenu.objects.filter(parent_id_id__isnull=True, is_active=True, is_external=False)
        .values("id", "name", "parent_id_id", "icon", "url", "menu_code", "is_master")
        .order_by("sequence")
    )

    def add_menu(menu_id, all_menus):
        menus = (
            MainMenu.objects.filter(id__in=perm_menu_ids, parent_id_id=menu_id, is_active=True, is_external=False)
            .values("id", "name", "parent_id_id", "url", "is_master")
            .order_by("sequence")
        )
        for menu in menus:
            sub_parent_menus = (
                MainMenu.objects.filter(parent_id_id=menu["id"], is_active=True, is_external=False).values("id", "name", "parent_id_id", "url", "is_master").order_by("sequence")
            )
            if len(sub_parent_menus) > 0:
                for sub_parent_menu in sub_parent_menus:
                    menu_name = menu["name"] + " - " + sub_parent_menu["name"]
                    all_menus.append(
                        {
                            "id": sub_parent_menu["id"],
                            "name": menu_name,
                            "parent_id_id": menu["parent_id_id"],
                            "url": sub_parent_menu["url"],
                            "is_master": sub_parent_menu["is_master"],
                        }
                    )
            else:
                all_menus.append({"id": menu["id"], "name": menu["name"], "parent_id_id": menu["parent_id_id"], "url": menu["url"], "is_master": menu["is_master"]})
        return all_menus

    for parent_menu in parent_menus:
        menus = MainMenu.objects.filter(parent_id_id=parent_menu["id"]).order_by("sequence")
        if len(menus) > 0:
            child_menu = add_menu(parent_menu["id"], [])
        else:
            child_menu = []
        all_menu.append(
            {
                "id": parent_menu["id"],
                "name": parent_menu["name"],
                "parent_id_id": parent_menu["parent_id_id"],
                "url": parent_menu["url"],
                "icon": parent_menu["icon"],
                "menu_code": parent_menu["menu_code"],
                "child_menus": child_menu,
            }
        )
    return all_menu


def vertical_menu_context(username, perm_menu_str, exculde_menu):
    child_menus = Util.get_main_child_menu(username, perm_menu_str)
    query = Q()
    query.add(Q(parent_id_id__isnull=True), query.connector)
    user = User.objects.filter(username=username).first()
    if user.is_superuser is False:
        if perm_menu_str != "":
            perm_menu_ids = [int(x) for x in perm_menu_str.split(",")]
            query.add(Q(id__in=perm_menu_ids), query.connector)
    parent_menu = (
        MainMenu.objects.filter(query)
        .values("id", "url", "company_code", "name", "parent_id_id", "icon", "sequence", "on_click", "is_active", "is_external", "menu_code", "is_master")
        .order_by("sequence")
    )
    hierarchy_menu_list = Util.get_menu_obj([parent_menu, child_menus], exculde_menu)
    if user.is_superuser is False:
        if perm_menu_str == "":
            hierarchy_menu_list = []

    return json.dumps(hierarchy_menu_list)


@xframe_options_exempt
def iframe_index(request):
    if "username" not in request.session and "client_user" not in request.session:
        return redirect("/accounts/signin/")

    color_scheme = request.session.get("color_scheme", False)
    color_scheme = color_scheme if color_scheme else ""
    color_scheme_data = {}
    if color_scheme:
        for param in color_scheme.split(","):
            scheme_data = param.split(":")
            if scheme_data != "":
                color_scheme_data[scheme_data[0].strip()] = scheme_data[1].strip()

    button_color = color_scheme_data["button_color"] if color_scheme else "#337ab7"
    link_color = color_scheme_data["link_color"] if color_scheme else "#266EBB"

    context = {}
    context["button_color"] = button_color
    context["link_color"] = link_color
    context["client_user"] = True if "client_user" in request.session and request.session["client_user"] else False

    return render(request, "base/iframe_index.html", context)


@public
@xframe_options_exempt
def open_iframe_index(request):
    return render(request, "base/open_iframe_index.html", {})


def getCurrentUser(request):
    user = User.objects.get(id=request.session["userid"])
    return user


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


@public
def get_app_data(request):
    display_row = 10
    decimal_point = 3
    user_col_settings = []
    user_email = request.session["username"] if "client_user" not in request.session else request.session["client_username"]
    theme_info = UserService.get_theme_info(request.session.get("color_scheme", None))

    if "user_id" in request.session:
        user_profile_obj = UserProfile.objects.get(user_id=request.user.id)
        display_row = user_profile_obj.display_row if user_profile_obj.display_row else 10
        decimal_point = Util.get_sys_paramter("decimalpoint").para_value
        user_col_settings = Util.get_ui_settings(request.user.id)

    return HttpResponse(
        json.dumps(
            {
                "button_color": theme_info["button_color"],
                "row_color": theme_info["row_color"],
                "user_col_settings": list(user_col_settings),
                "decimal_point": decimal_point,
                "display_row": display_row,
                "user_name": user_email,
            }
        ),
        content_type="json",
    )


@check_view_permission({"admin_tools": "system_parameters"})
def sysparameters(request):
    return render(request, "base/sysparameters.html")


def sysparameter_search(request, q=None):
    request.POST = Util.get_post_data(request)
    start = int(request.POST["start"])
    length = int(request.POST["length"])
    sort_col = Util.get_sort_column(request.POST)

    query = Q()

    if request.POST.get("para_code__icontains") != None:
        query.add(Q(para_code__icontains=str(request.POST.get("para_code__icontains"))), query.connector)
    if request.POST.get("descr__icontains") != None:
        query.add(Q(descr__icontains=str(request.POST.get("descr__icontains"))), query.connector)
    if request.POST.get("para_value__icontains") != None:
        query.add(Q(para_value__icontains=str(request.POST.get("para_value__icontains"))), query.connector)
    if request.POST.get("para_group__icontains") != None:
        query.add(Q(para_group__icontains=str(request.POST.get("para_group__icontains"))), query.connector)
    if q != None:
        query.add(Q(type__in=[q]), query.connector)
    recordsTotal = SysParameter.objects.filter(query).count()
    sysparameters = SysParameter.objects.filter(query).order_by(sort_col)[start : (start + length)]

    response = {
        "draw": request.POST["draw"],
        "recordsTotal": recordsTotal,
        "recordsFiltered": recordsTotal,
        "data": [],
    }

    for sysparameter in sysparameters:
        response["data"].append(
            {"id": sysparameter.id, "para_code": sysparameter.para_code, "descr": sysparameter.descr, "para_value": sysparameter.para_value, "para_group": sysparameter.para_group}
        )

    return HttpResponse(AppResponse.get(response), content_type="json")


@user_passes_test(lambda u: u.has_perm("base.add_sysparameter"), login_url="/accounts/signin/")
def sysparameter(request, sysparameterid=None):
    try:
        with transaction.atomic():
            if request.method == "POST":
                form = None
                action = AuditAction.UPDATE
                id_fv = request.POST.get("id")
                name_fv = str(request.POST.get("name")).strip()
                user_id = request.user.id
                user = User.objects.get(id=user_id)

                if id_fv is None or (Util.is_integer(id_fv) and int(id_fv) in [0, -1]):
                    action = AuditAction.INSERT
                    if Util.has_perm("can_add_system_parameters", user) == False:
                        return HttpResponse(AppResponse.msg(0, Util.user_perm_msg), content_type="json")
                    form = SysParameterForm(request.POST)
                else:
                    if Util.has_perm("can_update_system_parameters", user) == False:
                        return HttpResponse(AppResponse.msg(0, Util.user_perm_msg), content_type="json")
                    sysparameter = SysParameter.objects.get(id=int(id_fv))
                    form = SysParameterForm(request.POST, instance=sysparameter)

                if form.is_valid():
                    sysparameter = form.save()
                    Util.clear_cache("public", Util.sys_param_key)
                    if action == AuditAction.INSERT:
                        return HttpResponse(json.dumps({"code": 1, "msg": "System parameter saved.", "id": sysparameter.id}), content_type="json")
                    else:
                        return HttpResponse(AppResponse.msg(1, "System parameter saved."), content_type="json")
                else:
                    return HttpResponse(AppResponse.msg(0, form.errors), content_type="json")
            else:
                sysparameterdata = SysParameter.objects.filter(id=sysparameterid).first()
                is_edit = True
                if sysparameterdata is None:
                    is_edit = False

                return render(request, "base/sysparameter.html", {"sysparameterdata": sysparameterdata, "is_edit": is_edit})
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def sysparameter_del(request):
    try:
        user_id = request.user.id
        user = User.objects.get(id=user_id)
        post_ids = request.POST.get("ids")
        if Util.has_perm("can_update_system_parameters", user) == False:
            return HttpResponse(AppResponse.msg(0, Util.user_perm_msg), content_type="json")
        if not post_ids:
            return HttpResponse(AppResponse.msg(0, "Please select atleast one record."), content_type="json")

        ids = [int(x) for x in post_ids.split(",")]

        SysParameter.objects.filter(pk__in=ids).delete()
        Util.clear_cache("public", Util.sys_param_key)
        return HttpResponse(AppResponse.msg(1, "Data removed"), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def add_page_favorite(request):
    try:
        name = request.POST.get("name")
        url = request.POST.get("url")
        url_without_domain = url.split("/#")[1]
        url_without_domain = "/b/#" + url_without_domain
        favoriteView = FavoriteView.objects.create(name=name, url=url_without_domain, created_by_id=request.user.id)
        return HttpResponse(json.dumps({"favorite_view_id": favoriteView.id, "url": url_without_domain}), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def delete_page_favorite(request):
    try:
        url = request.POST.get("url")
        favorite_view_id = request.POST.get("favorite_view_id")
        if favorite_view_id:
            favoriteView = FavoriteView.objects.filter(id=favorite_view_id, created_by_id=request.user.id).first()
        else:
            url_without_domain = url.split("/#")[1]
            url_without_domain = "/b/#" + url_without_domain
            favoriteView = FavoriteView.objects.filter(url=url_without_domain, created_by_id=request.user.id).first()
        favorite_view_id = favoriteView.id
        favoriteView.delete()
        return HttpResponse(json.dumps({"favorite_view_id": favorite_view_id}), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def release_note(request):
    release_notes = ReleaseNotes.objects.filter().order_by("-id")[:100]
    latest_version_id = release_notes.first().id if release_notes != None else 0
    request.session["has_release"] = False
    return render(request, "base/release_note.html", {"release_notes": release_notes, "latest_version_id": latest_version_id})


def create_remark(app_name, model_name, entity_id, remark, remark_type, created_by_id, model_remark_field):
    try:
        content_type = ContentType.objects.filter(app_label=app_name, model=model_name).first()
        base_remark = Remark.objects.create(entity_id=entity_id, content_type_id=content_type.id, remark=remark, remark_type=remark_type, created_by_id=created_by_id)
        if model_remark_field != None and model_remark_field != "":
            update_model_field_value(app_name, model_name, entity_id, model_remark_field)
        # notification_view.subscribe_notifications(created_by_id, model_name, 'remark', entity_id, remarks=remark)
        base_remark.save()
        return base_remark

    except Exception as e:
        raise e


def create_remark_view(request):
    try:
        with transaction.atomic():
            entity_id = request.POST.get("entity_id")
            app_name = request.POST.get("app_name").lower()
            model_name = request.POST.get("model_name").lower()
            model_remark_field = request.POST.get("model_remark_field")
            remarks = request.POST.get("remark")
            stageName = request.POST.get("stageName")
            mentioned_in = request.POST.get("mentioned_in")
            file_count = int(request.POST.get("fileCount"))
            c_ip = get_client_ip(request)
            if model_name == "deal":
                user = request.user
                pcb_user = UserProfile.objects.filter(user_id=user.id).values("pcb_power_user_id").first()
                response = {}
                added_deal_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_deals ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "set_deal_note",
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        stageName,
                        None,
                        entity_id,
                        None,
                        remarks,
                        pcb_user["pcb_power_user_id"],
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    ],
                    "fetch_one",
                )
                get_deal_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_deals ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "get_deal_note_by_id",
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        int(added_deal_note_data["RID"]),
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    ],
                    "fetch_one",
                )
                Util.insert_history(request, "Deals", entity_id, "INSERT", 'Note added. "' + remarks + '"')
                if get_deal_note_data:
                    profile = UserProfile.objects.filter(pcb_power_user_id=get_deal_note_data["user_id"]).values("profile_image", "user__first_name", "user__last_name").first()
                    response = {
                        "code": 1,
                        "data": [
                            {
                                "remark": get_deal_note_data["Note"],
                                "display_name": profile["user__first_name"] + " " + profile["user__last_name"],
                                "display_img": Util.get_resource_url("profile", str(profile["profile_image"])) if profile else "",
                                "date": str(datetime.datetime.strptime(get_deal_note_data["CreatedOn"].strftime("%d/%m/%Y %H:%M:%S"), "%d/%m/%Y %H:%M:%S")),
                                "user_id": get_deal_note_data["user_id"],
                                "id": get_deal_note_data["RID"],
                                "attachments": [],
                                "stageName": "({})".format(get_deal_note_data["StageName"]) if get_deal_note_data["StageName"] else "",
                            }
                        ],
                    }
                    return HttpResponse(AppResponse.get(response), content_type="json")
            elif model_name == "lead":
                user = request.user
                pcb_user = UserProfile.objects.filter(user_id=user.id).values("pcb_power_user_id").first()
                response = {}
                added_lead_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_leads ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "set_lead_note",
                        entity_id,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        pcb_user["pcb_power_user_id"],
                        None,
                        None,
                        None,
                        None,
                        None,
                        remarks,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,                        
                    ],
                    "fetch_one",
                )
                get_lead_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_leads ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "get_lead_note_by_id",
                        int(added_lead_note_data["RID"]),
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    ],
                    "fetch_one",
                )
                Util.insert_history(request, "Lead", entity_id, "INSERT", 'Note added. "' + remarks + '"')
                if get_lead_note_data:
                    profile = UserProfile.objects.filter(pcb_power_user_id=get_lead_note_data["user_id"]).values("profile_image", "user__first_name", "user__last_name").first()
                    response = {
                        "code": 1,
                        "data": [
                            {
                                "remark": get_lead_note_data["Note"],
                                "display_name": profile["user__first_name"] + " " + profile["user__last_name"],
                                "display_img": Util.get_resource_url("profile", str(profile["profile_image"])) if profile else "",
                                "date": str(datetime.datetime.strptime(get_lead_note_data["CreatedOn"].strftime("%d/%m/%Y %H:%M:%S"), "%d/%m/%Y %H:%M:%S")),
                                "user_id": get_lead_note_data["user_id"],
                                "id": get_lead_note_data["RID"],
                                "attachments": [],
                            }
                        ],
                    }
                    return HttpResponse(AppResponse.get(response), content_type="json") 
            elif model_name == "sales_task":
                user = request.user
                pcb_user = UserProfile.objects.filter(user_id=user.id).values('pcb_power_user_id').first()
                response={}
                added_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_task_data ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "set_task_note",
                        entity_id,
                        None,
                        None,
                        None,
                        None,
                        None,
                        pcb_user["pcb_power_user_id"],
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        remarks,
                    ],
                    "fetch_one",
                )
                get_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_task_data ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "get_task_note_by_id",
                        int(added_note_data["RID"]),
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    ],
                    "fetch_one",
                )
                Util.insert_history(request,'Task', entity_id, 'INSERT','Note added. "'+remarks+'"')
                if get_note_data:
                    profile = UserProfile.objects.filter(pcb_power_user_id=get_note_data["user_id"]).values('profile_image','user__first_name','user__last_name').first()
                    response = {
                    'code': 1,
                    'data': [{
                            'remark': get_note_data["Note"],
                            'display_name': profile['user__first_name']+ ' ' + profile['user__last_name'],
                            'display_img': Util.get_resource_url("profile", str(profile["profile_image"])) if profile else "",
                            'date': str(datetime.datetime.strptime(get_note_data["CreatedOn"].strftime('%d/%m/%Y %H:%M:%S'), '%d/%m/%Y %H:%M:%S')),
                            'user_id': get_note_data["user_id"],
                            'id': get_note_data["RID"],
                            'attachments': []
                            }]
                    }
                    return HttpResponse(AppResponse.get(response), content_type="json")            
            remark = create_remark(app_name, model_name, entity_id, remarks, "", request.user.id, model_remark_field)
            mentionedUsersIds = request.POST.get("mentionedUsers")
            event = NotificationEvent.objects.filter(group="others", model__model="notification", action="remark").first()
            if mentionedUsersIds != "" and event != None:
                commentor_user = User.objects.get(id=request.user.id)
                commentor_user_name = commentor_user.first_name + " " + commentor_user.last_name
                template_id = EmailTemplate.objects.filter(name__iexact="comment_mension").first().id
                mentionedUsers = [int(x) for x in request.POST.get("mentionedUsers").split(",")]

                if len(mentionedUsers) > 0:
                    for user in mentionedUsers:
                        kwargs = {"user_name": User.objects.get(id=user).first_name, "comment_user_name": commentor_user_name, "mentioned_in": mentioned_in}
                        sub_notifications = SubscribeNotification.objects.filter(event_id=event.id, in_system=True, user_id=user).first()
                        if sub_notifications != None:
                            Notification.objects.create(
                                subject="You are mentioned in comment by " + commentor_user_name + " in the " + mentioned_in,
                                user_id=user,
                                type="comment_mension",
                                entity_id=entity_id,
                            )

                        sub_notifications = SubscribeNotification.objects.filter(event_id=event.id, by_email=True, user_id=user).first()
                        if sub_notifications != None:
                            notification_email = UserProfile.objects.get(user_id=user).notification_email
                            send_email_by_tmpl(True, "public", [notification_email], event.template_id, kwargs)

                        sub_notifications = SubscribeNotification.objects.filter(event_id=event.id, by_sms=True, user_id=user).first()
                        if sub_notifications != None and event.sms_template != None:
                            notification_mob = UserProfile.objects.get(user_id=user).notification_mob
                            send_sms([notification_mob], event.sms_template, kwargs)

            attachments = []
            if file_count != 0:
                for i in range(file_count):
                    attachment = attachment_views.upload("base", "Remark_Attachment", remark.id, request.FILES.get("file" + str(i)), None, c_ip, "-", request.user.id, False)
                    attachments.append(attachment)

            remark_obj = get_remark_obj(remark, attachments)
            response = {"code": 1, "data": [remark_obj]}

            return HttpResponse(AppResponse.get(response), content_type="json")

    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def get_remarks(request):
    entity_id = request.POST.get("entity_id")
    app_name = request.POST.get("app_name").lower()
    model_name = request.POST.get("model_name").lower()
    content_type = ContentType.objects.filter(app_label=app_name, model=model_name).first()

    if model_name == "deal":
        user = request.user
        pcb_user = UserProfile.objects.filter(user_id=user.id).values("pcb_power_user_id").first()
        get_deal_note_data = Util.db_execute_sp(
            "set nocount on; exec sales_deals ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
            ["get_deal_notes", None, None, None, None, None, None, None, None, None, None, None, None, None, entity_id, None, None, None, None, None, None, None, None, None, None],
            "fetch_all",
        )
        response = {}
        data = []
        if get_deal_note_data:
            for note_data in get_deal_note_data:
                profile = UserProfile.objects.filter(pcb_power_user_id=note_data["user_id"]).values("profile_image", "user__first_name", "user__last_name").first()
                note = {
                    "remark": note_data["Note"],
                    "display_name": profile["user__first_name"] + " " + profile["user__last_name"],
                    "display_img": Util.get_resource_url("profile", str(profile["profile_image"])) if profile else "",
                    "date": str(datetime.datetime.strptime(note_data["CreatedOn"].strftime("%d/%m/%Y %H:%M:%S"), "%d/%m/%Y %H:%M:%S")),
                    "user_id": note_data["user_id"],
                    "id": note_data["RID"],
                    "attachments": [],
                    "stageName": "({})".format(note_data["StageName"]) if note_data["StageName"] else "",
                }
                data.append(note)
        response = {"count": len(get_deal_note_data), "data": data, "user": pcb_user["pcb_power_user_id"]}
        return HttpResponse(AppResponse.get(response), content_type="json")
    elif model_name == "lead":
        user = request.user
        pcb_user = UserProfile.objects.filter(user_id=user.id).values("pcb_power_user_id").first()
        get_lead_note_data = Util.db_execute_sp(
            "set nocount on; exec sales_leads ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
            [
                "get_lead_notes",
                entity_id,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
            ],
            "fetch_all",
        )
        response = {}
        data = []
        if get_lead_note_data:
            for note_data in get_lead_note_data:
                profile = UserProfile.objects.filter(pcb_power_user_id=note_data["user_id"]).values("profile_image", "user__first_name", "user__last_name").first()
                note = {
                    "remark": note_data["Note"],
                    "display_name": profile["user__first_name"] + " " + profile["user__last_name"],
                    "display_img": Util.get_resource_url("profile", str(profile["profile_image"])) if profile else "",
                    "date": str(datetime.datetime.strptime(note_data["CreatedOn"].strftime("%d/%m/%Y %H:%M:%S"), "%d/%m/%Y %H:%M:%S")),
                    "user_id": note_data["user_id"],
                    "id": note_data["RID"],
                    "attachments": [],
                }
                data.append(note)
    elif model_name == "sales_task":
        user = request.user
        pcb_user = UserProfile.objects.filter(user_id=user.id).values('pcb_power_user_id').first()
        get_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_task_data ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "get_task_notes",
                        entity_id,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    ],
                    "fetch_all",
                )        
        response={}
        data=[]
        if get_note_data:
            for note_data in get_note_data:
                profile = UserProfile.objects.filter(pcb_power_user_id=int(note_data["user_id"])).values('profile_image','user__first_name','user__last_name').first()
                note={
                'remark': note_data["Note"],
                'display_name': profile['user__first_name']+ ' ' + profile['user__last_name'],
                'display_img': Util.get_resource_url("profile", str(profile["profile_image"])) if profile else "",
                'date': str(datetime.datetime.strptime(note_data["CreatedOn"].strftime('%d/%m/%Y %H:%M:%S'), '%d/%m/%Y %H:%M:%S')),
                'user_id': note_data["user_id"],
                'id': note_data["RID"],
                'attachments': []
                }
                data.append(note)
        response = {
        'count': len(get_note_data),
        'data': data,
        'user': pcb_user["pcb_power_user_id"]
        }
        return HttpResponse(AppResponse.get(response), content_type="json")            
    remarks = Remark.objects.filter(entity_id=int(entity_id), content_type=content_type).order_by("id")
    response = {"data": [], "count": remarks.count(), "user": request.user.id}

    for remark in remarks:
        remark_attach = Remark_Attachment.objects.filter(object_id=remark.id, deleted=False)

        remark_obj = get_remark_obj(remark, remark_attach)
        response["data"].append(remark_obj)

    return HttpResponse(AppResponse.get(response), content_type="json")


def update_model_field_value(app_name, model_name, entity_id, model_remark_field):
    if model_remark_field != None:
        model_type = ContentType.objects.get(app_label=app_name, model=model_name)
        last_remark = Remark.objects.filter(entity_id=int(entity_id), content_type_id=model_type.id).order_by("-id").first()
        model_type.model_class().objects.filter(id=int(entity_id)).update(**{model_remark_field: last_remark.remark if last_remark != None else ""})


def get_remark_obj(remark, remark_attach):
    attachments = []
    profile = UserProfile.objects.filter(user_id=remark.created_by_id).values("profile_image").first()
    for attachment in remark_attach:
        attachments.append({"attach_id": attachment.id, "uid": attachment.uid, "name": attachment.name})

    return {
        "id": remark.id,
        "remark": remark.remark if remark.remark is not None else "",
        "date": Util.get_local_time(remark.created_on, True),
        "user_id": remark.created_by_id,
        "display_name": remark.created_by.first_name + " " + remark.created_by.last_name,
        "display_img": Util.get_resource_url("profile", str(profile["profile_image"])) if profile["profile_image"] else "",
        "attachments": attachments,
    }


def delete_remark(request):
    try:
        remark_id = request.POST.get("remark_id")
        Remark.objects.filter(id=int(remark_id)).delete()

        model_remark_field = request.POST.get("model_remark_field")
        entity_id = request.POST.get("entity_id")
        app_name = request.POST.get("app_name").lower()
        model_name = request.POST.get("model_name").lower()
        if model_name == "deal":
            get_deal_note_data = Util.db_execute_sp(
                "set nocount on; exec sales_deals ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                ["get_deal_note_by_id", None, None, None, None, None, None, None, None, None, None, None, None, None, remark_id, None, None, None, None, None, None, None, None, None,None],
                "fetch_one",
            )
            Util.db_execute_sp(
                "set nocount on; exec sales_deals ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                ["delete_deal_note", None, None, None, None, None, None, None, None, None, None, None, None, None, remark_id, None, None, None, None, None, None, None, None, None, None, None,None],
                "delete_query",
            )
            Util.insert_history(request, "Deals", entity_id, "DELETE", 'Note deleted. "' + get_deal_note_data["Note"] + '"')
        elif model_name == "lead":
            get_lead_note_data = Util.db_execute_sp("set nocount on; exec sales_leads ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",['get_lead_note_by_id',remark_id,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None, None, None, None,None],'fetch_one')
            Util.db_execute_sp("set nocount on; exec sales_leads ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",['delete_lead_note',remark_id,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None, None, None, None,None],'delete_query')
            Util.insert_history(request,'Lead', entity_id, 'DELETE','Note deleted. "'+get_lead_note_data["Note"]+'"')
        elif model_name == "sales_task":
            get_note_data = Util.db_execute_sp(
                    "set nocount on; exec sales_task_data ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "get_task_note_by_id",
                        remark_id,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    ],
                    "fetch_one",
                )
            Util.db_execute_sp(
                    "set nocount on; exec sales_task_data ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                    [
                        "delete_task_note",
                        remark_id,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    ],
                    "delete_query",
                )            
            Util.insert_history(request,'Task', entity_id, 'DELETE','Note deleted. "'+get_note_data["Note"]+'"')    
        else:
            update_model_field_value(app_name, model_name, entity_id, model_remark_field)

        return HttpResponse(AppResponse.msg(1, "Data removed"), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def check_subscription(request):
    entity_id = request.POST.get("entity_id")
    app_name = request.POST.get("app_name").lower()
    model_name = request.POST.get("model_name").lower()
    model_type = ContentType.objects.get(app_label=app_name, model=model_name)

    if SubscribeNotification.objects.filter(entity_id=int(entity_id), event__model_id=model_type.id, user_id=request.user.id).count() > 0:
        return HttpResponse(AppResponse.get({"subscription": "true"}), content_type="json")
    else:
        return HttpResponse(AppResponse.get({"subscription": "false"}), content_type="json")


def subscribe_item(request):
    try:
        entity_id = request.POST.get("entity_id")
        app_name = request.POST.get("app_name").lower()
        model_name = request.POST.get("model_name").lower()
        group_name = request.POST.get("group_name").lower()
        model_type = ContentType.objects.get(app_label=app_name, model=model_name)
        user = UserProfile.objects.filter(user_id=request.user.id).first()
        if user.notification_email == None or user.notification_email == "":
            return HttpResponse(AppResponse.msg(0, "Notification email address is not available. You can add it in your profile setting."), content_type="json")

        events = NotificationEvent.objects.filter(model_id=model_type.id, group=group_name, is_active=True)
        for event in events:
            SubscribeNotification.objects.create(event_id=event.id, user_id=request.user.id, by_email=True, in_system=True, entity_id=int(entity_id), created_by_id=request.user.id)
        return HttpResponse(AppResponse.msg(1, "Subscribed item."), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def unsubscribe_item(request):
    try:
        entity_id = request.POST.get("entity_id")
        app_name = request.POST.get("app_name").lower()
        model_name = request.POST.get("model_name").lower()
        group_name = request.POST.get("group_name").lower()
        model_type = ContentType.objects.get(app_label=app_name, model=model_name)
        events = NotificationEvent.objects.filter(model_id=model_type.id, group=group_name, is_active=True)

        SubscribeNotification.objects.filter(entity_id=int(entity_id), event_id__in=events.values_list("id", flat=True).distinct(), user_id=request.user.id).delete()
        return HttpResponse(AppResponse.msg(1, "Unsubscribed item."), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


@transaction.atomic
def set_col_order(request):
    try:
        if request.method == "POST":
            col_settings = {}
            check_col = []
            url = request.POST["url"]
            col_order = [x for x in request.POST["colOrder"].split(",")]
            if len(request.POST["checkOrder"]) > 0:
                check_col = [x for x in request.POST["checkOrder"].split(",")]
            table_index = request.POST["tableColIndex"]
            user_id = request.user.id
            col_settings["col_order"] = col_order
            col_settings["hide_col"] = check_col

            col_order_obj = UISettings.objects.filter(url=url, table_index=table_index, user_id=user_id).first()

            if col_order_obj:
                user_col_order = json.loads(col_order_obj.col_settings)
                if col_order != user_col_order["col_order"] or check_col != user_col_order["hide_col"]:
                    col_order_obj.col_settings = json.dumps(col_settings)
                    col_order_obj.save()

            else:
                UISettings.objects.create(
                    url=url,
                    table_index=table_index,
                    col_settings=json.dumps(col_settings),
                    user_id=user_id,
                )
            Util.clear_cache("public", "columns_ui_settings" + str(user_id))

            return HttpResponse(AppResponse.msg(1, "s"), content_type="json")

    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def get_all_user_list(request):
    try:
        keyword = request.POST["keyword"]
        existUsers = ast.literal_eval(request.POST["existUsers"])
        existUsers.append(request.user.id)
        query = Q()

        query.add(Q(first_name__icontains=keyword) | (Q(last_name__icontains=keyword)), query.connector)
        query.add(Q(is_active=True), query.connector)
        query.add(~Q(id__in=existUsers), query.connector)

        all_users = User.objects.filter(query, id__in=UserProfile.objects.filter(user_type=1).values_list("user_id")).values("id", "first_name", "last_name")[:10]

        response = []

        for user in all_users:
            user_name = '<span class="usr-ref" ref = "' + str(user["id"]) + '">' + user["first_name"] + " " + user["last_name"] + "</span>"
            response.append(user_name)

        return HttpResponse(AppResponse.get(response), content_type="json")

    except Exception as e:
        logging.exception("hi")
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")


def settings(request):
    perm_menu_str = Util.get_permitted_menu(request.user.id)
    perm_menu_ids = [int(x) for x in perm_menu_str.split(",")]
    master_menu_dict = {}
    master_menus = (
        MainMenu.objects.filter(is_master=True, id__in=perm_menu_ids).values("name", "url", "parent_id", "menu_code", "parent_id__name").order_by("parent_id", "sequence")
    )
    for master_menu in master_menus:
        if master_menu["parent_id__name"] in master_menu_dict:
            master_menu_dict[master_menu["parent_id__name"]].append({"name": master_menu["name"], "url": master_menu["url"]})
        else:
            master_menu_dict[master_menu["parent_id__name"]] = [{"name": master_menu["name"], "url": master_menu["url"]}]

    return render(request, "base/settings.html", {"master_menus": master_menu_dict})


def allowed_file(filename):
    ALLOWED_EXTENSIONS = set(["png", "jpg", "jpeg", "gif"])
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_wysiwyg_media(request):
    try:
        if request.method == "POST":
            uid = str(uuid4())
            image_src = request.POST['image_src'] if 'image_src' in request.POST  and request.POST['image_src'] else None
            blog_id = request.POST['blog_id'] if 'blog_id' in request.POST  and request.POST['blog_id'] else None
            image_name = blog_id + "_" + uid+".jpeg"
            blog_root_path = "img/blog/contant/"+blog_id+"/" 
            rootpath = project_settings.MEDIA_ROOT + blog_root_path           
            if image_src and image_name:
                if not os.path.exists(rootpath):
                    os.makedirs(rootpath)
                with urllib_request.urlopen(image_src)  as response:
                    convert_image_src = response.read()
                with open(rootpath + image_name, "wb") as fp:
                    fp.write(convert_image_src)
                    file_size = os.path.getsize(rootpath + image_name)
                    if (file_size /1024 > 512):
                        image = Image.open(rootpath + image_name)
                        image.save(rootpath + image_name, 'JPEG', optimize = True, quality = 25)
                return HttpResponse(json.dumps({"code": 1, "filepath": (project_settings.DOMAIN_NAME + project_settings.MEDIA_URL + blog_root_path + image_name),"image_name":image_name}), content_type="json")
    except Exception as e:
        manager.create_from_exception(e)
        logging.exception("Something went wrong.")
        return HttpResponse(AppResponse.msg(0, str(e)), content_type="json")