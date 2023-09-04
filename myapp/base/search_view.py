from django.shortcuts import render
from django.http import HttpResponse
from base.util import Util
from base.models import AppResponse
from django.db.models import Q, Sum
from django.db import transaction
from exception_log import manager
from decimal import *
import datetime
import json
import logging
from base import choices
from random import choice
from sparrow.dbengine import DBEngine
from sqlalchemy.sql import text

def search(request):
    try:
        
        if request.method == 'GET':
            return render(request, 'base/app_search.html', {})  
        request.POST = Util.get_post_data(request)    

        result = []
        
        if request.POST.get('document') != None:
            result = search_documents(request.POST.get('document'))            
         
        response = {
            'draw': request.POST['draw'],
            'recordsTotal': 0,
            'recordsFiltered': 0,
            'data': result,
        }
        
        return HttpResponse(AppResponse.get(response), content_type='json')
    except Exception as e:
        manager.create_from_exception(e)
        logging.exception("Something went wrong.")
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')

def search_object(id, line1_info1, line1_info2, line1_info3, line2_info1, line3_info1, app_name , model_name, object_id, transfer_order_type):
    return {
        'id': id,
        'line1_info1': line1_info1,
        'line1_info2': line1_info2,
        'line1_info3': line1_info3,
        'line2_info1': line2_info1,
        'line3_info1': line3_info1,
        'object_id': object_id,
        'app_name': app_name,
        'model_name': model_name,
        'type' : transfer_order_type
        
    }

def search_documents(search_value):
    #TODO: Implement search on documents
    return []

