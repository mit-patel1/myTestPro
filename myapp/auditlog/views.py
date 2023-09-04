import datetime

from auditlog.models import AuditAction, Auditlog
from base.models import AppResponse
from base.util import Util
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import render
from exception_log import manager


def logs(request, model = None,ids = None):
    return render(request, 'auditlog/logs.html')

def logs_search(request,model=None,ids=None):
    try:
        request.POST = Util.get_post_data(request)
        start = int(request.POST['start'])
        length = int(request.POST['length'])
        sort_col = Util.get_sort_column(request.POST)
        q_objects = Q();

        if ids != None and ids !='':
            obejct_ids = [int(x) for x in ids.split("-")]
            q_objects.add(Q(object_id__in = obejct_ids), q_objects.connector)
        if model != None:
            q_objects.add(Q(content_type_id__model__in = [str(model)]), q_objects.connector)

        recordsTotal = Auditlog.objects.filter(q_objects).count()

        logs = Auditlog.objects.filter(q_objects).order_by(sort_col)[start: (start+length)]

        response = {
            'code': 1,
            'draw': request.POST['draw'],
            'recordsTotal': recordsTotal,
            'recordsFiltered': recordsTotal,
            'data': [],
        }

        for log in logs:
            action_on = Util.get_local_time(log.action_on, '%d/%m/%Y%H:%M:%S')
            response['data'].append({'id': log.id, 'action_by__username': log.action_by.username, 'ip_addr': log.ip_addr, 'action__name': log.action.name, 'descr': log.descr, 'object_id': log.object_id, 'action_on':action_on});

        return HttpResponse(AppResponse.get(response), content_type='json')
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')

def insert(app_name, model_name, object_ids, action_id, action_by_id, ip_addr, descr):
    app_name = app_name.lower()
    model_name = model_name.lower()
    model_id = ContentType.objects.filter(app_label = app_name, model = model_name)[0].id
    for object_id in object_ids:
        log = Auditlog(content_type_id = model_id, object_id = object_id, action_id = action_id, action_by_id = action_by_id, ip_addr = ip_addr, descr = descr)
        log.save()

def getLogDesc(entity, action_id):
    if action_id == AuditAction.INSERT:
        return entity + ' created'
    elif action_id == AuditAction.UPDATE:
        return entity + ' updated'
    elif action_id == AuditAction.DELETE:
        return entity + ' deleted'
    else:
        return ''
