import ast
import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core import serializers
from django.core.cache import cache
from django.db import connection
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import csrf_exempt
from sqlalchemy.sql import text
from stronghold.decorators import public

from accounts.models import User, UserProfile
from base.models import AppResponse
from base.util import Util
from sparrow.dbengine import DBEngine


@public
@csrf_exempt
def lookups(request, model):
    db_engine = Util.db_engine()
    q = request.POST.get("query")
    options = request.POST.get("options[types]")
    bid = request.POST.get("bid")  # base id passed when dropdown is dependent on base field
    multiplebID = request.POST.get("multiplebID")  # base id passed when dropdown is dependent on base field
    selectedId = request.POST.get("id", False)
    selectedIds = []
    if selectedId and selectedId.find(","):
        selectedIds = [int(x) for x in selectedId.split(",")]

    if model == "users":
        from django.contrib.auth.models import User

        response = []
        query = Q()
        query.add(Q(user__is_active=True, is_deleted=False, user_type=1), query.connector)
        query.add(Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q), query.connector)

        if selectedId and selectedId != "":
            selected_record = UserProfile.objects.filter(user_id=selectedId).values("user__first_name", "user__last_name", "user_id").first()
            response.append({"name": selected_record["user__first_name"] + " " + selected_record["user__last_name"], "id": selected_record["user_id"]})
        user_profiles = UserProfile.objects.filter(query).values("user__first_name", "user__last_name", "user_id").order_by("user__first_name")[:10]

        for user_profile in user_profiles:
            response.append({"name": user_profile["user__first_name"] + " " + user_profile["user__last_name"], "id": user_profile["user_id"]})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "group":
        from accounts.models import Group

        user_roles = Group.objects.filter().order_by("name")
        response = []
        for user_role in user_roles:
            response.append({"name": user_role.name, "id": user_role.id})
        if selectedIds:
            selected_records = Group.objects.filter(id__in=selectedIds)
            for selected_record in selected_records:
                response.append({"name": selected_record.name, "id": selected_record.id})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "titles":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "TITLE", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "escalations_titles":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "Escalations_Title", q]).fetchall()
        response = []
        for item in filtered_data_list:
            flag = False
            if item.sCodeName == "Old Title":
                flag = True
            response.append({"name": item.sCodeName, "id": item.RID, "disabled": flag})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "tasks_titles":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "Tasks_Title", q]).fetchall()
        response = []
        for item in filtered_data_list:
            flag = False
            if item.sCodeName == "Old Title":
                flag = True
            response.append({"name": item.sCodeName, "id": item.RID, "disabled": flag})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "internal_requests_titles":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "Internal_requests_Title", q]).fetchall()
        response = []
        for item in filtered_data_list:
            flag = False
            if item.sCodeName == "Old Title":
                flag = True
            response.append({"name": item.sCodeName, "id": item.RID, "disabled": flag})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "status":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "STATUS", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "communication_modes":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "COMMUNICATIONMODE", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "priorities":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "PRIORITY", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "escalations_priorities":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "PRIORITY", q]).fetchall()
        response = []
        for item in filtered_data_list:
            if item.sCodeName == "Low":
                continue
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "department":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "DEPARTMENT", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "pcb_power_users":
        selectedIds = request.POST.get("id", False)
        from django.contrib.auth.models import User
        user_id = request.user.id
        response = []
        query = Q()
        query.add(Q(user__is_active=True, is_deleted=False, pcb_power_user_id__isnull=False), query.connector)
        query.add(Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q), query.connector)

        if selectedIds and selectedIds != "":
            for selectedId in selectedIds.split(','):
                selected_record = UserProfile.objects.filter(pcb_power_user_id=selectedId).values("user_id","user__first_name", "user__last_name", "user_id", "pcb_power_user_id").first()
                if selected_record:
                    response.append({"sales_user_id":selected_record["user_id"],"name": selected_record["user__first_name"] + " " + selected_record["user__last_name"], "id": selected_record["pcb_power_user_id"]})
        user_profiles = UserProfile.objects.filter(query).values("user_id","user__first_name", "user__last_name", "user_id", "pcb_power_user_id").order_by("user__first_name")
        for user_profile in user_profiles:
            if user_profile["user_id"] == user_id:
                response.insert(0,{"sales_user_id":user_profile["user_id"],"name": user_profile["user__first_name"] + " " + user_profile["user__last_name"], "id": user_profile["pcb_power_user_id"]})
            else:
                response.append({"sales_user_id":user_profile["user_id"],"name": user_profile["user__first_name"] + " " + user_profile["user__last_name"], "id": user_profile["pcb_power_user_id"]})
        return HttpResponse(AppResponse.get(response), content_type="json")

    # if model == "pipeline":
    #     with db_engine.begin() as conn:
    #         filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_Pipeline",None,q]).fetchall()
    #     response = []
    #     for item in filtered_data_list:
    #         response.append({"name": item.sName ,"id": item.RID})
    #     return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "lead_pipeline":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_Pipeline", "Lead", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "deal_pipeline":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_Pipeline", "Deal", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "contact":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_Contact", None, q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sFirstName + " " + item.sLastName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "lead":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_Lead", None, q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCompName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "source":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "SOURCE", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "teamresponsible":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "TEAMRESPONSIBLE", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "customer_list":
        response = []
        if selectedId and selectedId != "":
            with db_engine.begin() as conn:
                customer_data = conn.execute("set nocount on; exec sales_get_customer_listing ?,?,?", ["GetCustName", "", selectedId]).fetchone()
                response.append({"name": customer_data["Customer Name"], "id": selectedId})
        else:
            with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_get_customer_listing  ?,?,?", ["CustData", q, None]).fetchall()
            response = []
            for item in filtered_data_list:
                response.append({"name": item.CompanyName, "id": item.ID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "customer_order_no":
        response = []
        if bid != None:
            with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_get_customer_listing ?,?,?", ["CustOrderData", q, bid]).fetchall()
            for item in filtered_data_list:
                response.append({"name": item.Nr, "id": item.Nr})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "customer_order_no_return_RID":
        response = []
        if selectedId and selectedId != "":
            with db_engine.begin() as conn:
                customer_data = conn.execute("set nocount on; exec sales_get_customer_listing ?,?,?", ["GetOrderNr","",selectedId]).fetchone()
                response.append({"name": customer_data['Order nr'], "id": selectedId})
        elif bid != None:
            with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_get_customer_listing ?,?,?", ["CustOrderData",q,bid]).fetchall()
            for item in filtered_data_list:
                response.append({"name": item.Nr,"id": item.ID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "getallorders":
        response = []
        selectedname = "".join(filter(lambda x: x.isdigit(), request.POST.get("selectedname"))) if request.POST.get("selectedname") else ""
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_get_customer_listing ?,?,?", ["Getallorders", q, selectedname]).fetchall()
        for item in filtered_data_list:
            response.append({"name": item.Nr, "id": item.Nr})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "get_customer_byorder_no":
        response = []
        if bid != None:
            with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_get_customer_listing ?,?,?", ["Get_customer_byorder_no", q, bid]).fetchall()
            for item in filtered_data_list:
                response.append({"name": item.Nr, "id": item.Nr})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "zone_for_sales_person":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["zone", None, q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.cShrtDesc, "id": item.kCodeTab})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "state":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["uState", None, q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.cState, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "state_for_sales_person":
        response = []
        with db_engine.begin() as conn:
            if multiplebID:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["state_by_zone", None, multiplebID]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.cState, "id": item.RID})
            elif selectedId:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["selected_state", None, selectedId]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.cState, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "city":
        response = []
        with db_engine.begin() as conn:
            if bid != None:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["city_by_state", None, bid]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.sName, "id": item.RID})
            elif selectedId:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["selected_city", None, selectedId]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.sName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "city_for_sales_person":
        response = []
        with db_engine.begin() as conn:
            if multiplebID != None:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["city_by_state_for_sales_person", None, multiplebID]).fetchall()
                if filtered_data_list:
                    response.append({"name": "All", "id":0})
                    for item in filtered_data_list:
                        response.append({"name": item.cArea, "id": item.cArea})
            elif selectedId:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["selected_city_for_sales_person", None, selectedId]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.cArea, "id": item.cArea})
        return HttpResponse(AppResponse.get(response) , content_type="json")

    if model == "sales_ServiceType":
        response = []
        with db_engine.begin() as conn:
            if selectedId:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["selected_servicetype", None, selectedId]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.sName, "id": item.RID})
            else:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_ServiceType", None, q]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.sName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "sales_person_id_and_name":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_SalesPerson", None, q]).fetchall()
        response = []
        for item in filtered_data_list:
            user_name = None
            if item.sUser:
                user_name = UserProfile.objects.filter(pcb_power_user_id=int(item.sUser)).values("user__first_name","user__last_name").first()
            response.append({"name": user_name["user__first_name"] + " " + user_name["user__last_name"] if user_name else "", "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "sales_person_name":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_SalesPerson", None, q]).fetchall()
        response = []
        for item in filtered_data_list:
            user_name = None
            if item.sUser:
                user_name = UserProfile.objects.filter(pcb_power_user_id=int(item.sUser)).values("user__first_name","user__last_name").first()
            response.append({"name": user_name["user__first_name"] + " " + user_name["user__last_name"] if user_name else "", "id": item.sFirstName + " " + item.sLastName})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "lead_reason":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "LEADREASONS", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "deal_reason":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "DEALREASONS", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "follow_up_status":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "FOLLOWUPSTATUS", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "state":
        response = []
        with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["uState", None, q]).fetchall()
                for item in filtered_data_list:
                    response.append({"name": item.cState, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "city":
        response = []
        if bid != None:
            with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["city_by_state", None, bid]).fetchall()
            for item in filtered_data_list:
                response.append({"name": item.sName, "id": item.RID})
        elif selectedId:
            with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["selected_city", None, selectedId]).fetchall()
            for item in filtered_data_list:
                response.append({"name": item.sName, "id": item.RID})
        else:
            with db_engine.begin() as conn:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["city", None, q]).fetchall()
            for item in filtered_data_list:
                response.append({"name": item.cArea, "id": item.cArea})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "pipeline_apply_for":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "PIPELINE", q]).fetchall()
        response = []
        for item in filtered_data_list:
            flag = False
            if item.sCodeName == "Old Title":
                flag = True
            response.append({"name": item.sCodeName, "id": item.RID, "disabled": flag})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "checklists":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "CHECKLIST", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item.sCodeName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "checklists_rootcause":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "Root cause", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item["sCodeName"], "id": item["sCodeName"]})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "pcb_service":
        response = []
        if options == "pcb_fabrication":
            service = ["PCB Fabrication", "PCB Fabrication (Flex)", "PCB Fabrication (PCB A)"]
        elif options == "pcb_assembly":
            service = ["PCB Assembly (Consigned)", "PCB Assembly (Turnkey)", "PCB Assembly (Combo)", "PCB Assembly (PCB A)"]
        elif options == "pcb_stencil":
            service = ["PCB stencil"]
        elif options == "pcb_layout":
            service = ["PCB Layout"]
        elif options == "component_sourcing":
            service = ["Component sourcing", "Component sourcing (Turnkey)", "Component sourcing (Combo)"]
        else:
            service = []
        for index, item in enumerate(service):
            response.append({"name": item, "id": index})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "checklists_analysis":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "Analysis", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item["sCodeName"], "id": item["sCodeName"]})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "checklists_corrective_action":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MasterCode", "Corrective action", q]).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item["sCodeName"], "id": item["sCodeName"]})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "pcb_layers":
        with db_engine.begin() as conn:
            filtered_data_list = conn.execute(
                "set nocount on; exec sales_deals ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?",
                ["get_all_offer_layers", None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,None],
            ).fetchall()
        response = []
        for item in filtered_data_list:
            response.append({"name": item["cShrtDesc"], "id": item["kCodeTab"]})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "pcb_service":
        response = []
        if options == "pcb_fabrication":
            service = ["PCB Fabrication", "PCB Fabrication (Flex)", "PCB Fabrication (PCB A)"]
        elif options == "pcb_assembly":
            service = ["PCB Assembly (Consigned)", "PCB Assembly (Turnkey)", "PCB Assembly (Combo)", "PCB Assembly (PCB A)"]
        elif options == "pcb_stencil":
            service = ["PCB stencil"]
        elif options == "pcb_layout":
            service = ["PCB Layout"]
        elif options == "component_sourcing":
            service = ["Component sourcing", "Component sourcing(PCB-A)"]
        else:
            service = []
        for index, item in enumerate(service):
            response.append({"name": item, "id": index})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "team_member_name":
        response = []
        with db_engine.begin() as conn:
            if bid != None:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MS_team_member_name", bid, q]).fetchall()
            elif selectedId:
                filtered_data_list = conn.execute("set nocount on; exec sales_lookups_master ?,?,?", ["sales_MS_team_member_name", None, selectedId]).fetchall()
            else:
                filtered_data_list=[]
            if filtered_data_list:
                for item in filtered_data_list:
                    response.append({"name": item.sName, "id": item.RID})
        return HttpResponse(AppResponse.get(response), content_type="json")

    if model == "power_blog_service_type_menual":
        response = []
        blog_services = ["miscellaneous","Layout","Stencil","Assembly","Fabrication","Component"]
        for values in blog_services:
            response.append({"name": values, "id": values})
        return HttpResponse(AppResponse.get(response), content_type="json")
