from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from accounts.models import User
from django.core import serializers
from base.util import Util
from base.models import AppResponse
from django.views.decorators.csrf import csrf_exempt
from django.apps import apps
from django.db.models import Q
import ast
import datetime

@csrf_exempt
def pagers(request):
    app_name = request.POST['app_name']
    model_name = request.POST['model_name']
    current_id = request.POST['id']
    mode = request.POST['mode']
    query = request.POST.get('query', False)
    model = apps.get_model(app_name, model_name)
    #current_object = model.objects.filter(id=int(current_id)).first()
    next_object = None
    kwargs = {}

    if query and query !='':
        serach_params = ast.literal_eval(query)
        for key, value in serach_params.items():
            kwargs[key] = cast_value(value)
    
    if mode == 'next':
        gt_conditions = kwargs.copy()
        gt_conditions.update({'{0}__{1}'.format('id', 'gt'): int(current_id)})
        next_object = model.objects.filter(**gt_conditions).order_by('id').first()
        next_object = next_object if next_object != None else model.objects.filter(**kwargs).order_by("id").first()
    else:
        lt_conditions = kwargs.copy()
        lt_conditions.update({'{0}__{1}'.format('id', 'lt'): int(current_id)})
        next_object = model.objects.filter(**lt_conditions).order_by('-id').first()
        next_object = next_object if next_object != None else model.objects.filter(**kwargs).order_by("-id").first()
    return HttpResponse(AppResponse.get({'id':next_object.id}), content_type='json')

def cast_value(value):
    try:
        new_value = int(value)
        return new_value
    except Exception as e:
        pass
    try:
        new_value = decimal(value)
        return new_value
    except Exception as e:
        pass
    try:
        new_value = datetime.datetime.strptime(str(value), '%d/%m/%Y').strftime('%Y-%m-%d')
        return new_value
    except Exception as e:
        pass
    try:
        if value.strip().lower() == 'true':
            return True
        if value.strip().lower() == 'false':
            return False
    except Exception as e:
        pass
    return value
