from django.shortcuts import render, render_to_response
from base.impersonate import FileServerImpersonate
from .models import Attachment ,get_uid
from django.apps import apps
from django.db.models import Q
from django.http import HttpResponseRedirect, HttpResponse, response, StreamingHttpResponse
from base.models import AppResponse
from attachment.models import FileType
# from base import views as base_views
from django.conf import settings
from django.core.files import File
from wsgiref.util import FileWrapper
import os
import mimetypes
from auditlog.models import AuditAction
from auditlog import views as log_views
from django.core.files.storage import default_storage
from base.util import Util
from django.contrib.auth.models import User
from exception_log import manager
from stronghold.decorators import public
from django.views.decorators.csrf import csrf_exempt
from random import randint
from os.path import dirname, abspath
import urllib
import logging
from accounts.models import UserProfile
import urllib.parse
from datetime import datetime
from sales import views as sales_views
from base.impersonate import Impersonate, FileServerImpersonate


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def delete_attachment(request):
    try:
        app_name = request.POST['app']
        model_name = request.POST['model']
        user_id = request.user.id
        user = User.objects.get(id = user_id)
        id = int(request.POST['id'])    

        # if Util.has_perm("can_delete_attachment",user) == False:
        #     return HttpResponse(AppResponse.msg(0, Util.user_perm_msg), content_type='json')
        if str(app_name).lower() == 'sales':
            Util.db_execute_sp("set nocount on; exec sales_app_filepath_sp ?,?,?,?,?,?,?,?,?,?,?,?,?,?", ["delete",id,None,None,None,None,None,None,None,None,None,None,None,None],'delete_query')
        else:
            c_ip = get_client_ip(request)
            u_id = request.session['userid']

            model = apps.get_model(app_name, model_name)
            attachment = model.objects.filter(id = id).first()
            attachment.deleted = True
            attachment.is_public = False
            attachment.save()

            log_views.insert(app_name, model_name, [attachment.id], AuditAction.INSERT, u_id, c_ip, attachment.name + ' deleted.')

        return HttpResponse(AppResponse.msg(1, "Data removed"), content_type='json')
    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')

def dialog_template(request):
    file_types = FileType.objects.filter(is_active = True)
    return render(request, 'attachment/dialog.html', {'file_types': file_types })

"""
download: Responds with download stream, todo: This needs improvement, may not work.
"""

@csrf_exempt
@public
def download_attachment(request):
    if 'uid' in request.GET and request.GET['uid']:
        return download_file_from_winserver(request,request.GET['uid'])
    else:
        app_name =  request.GET['app'] if request.GET.get('a') == None else request.GET.get('a')
        model_name =  request.GET['model'] if request.GET.get('m') == None else request.GET.get('m')

        uid = request.GET['uid']
        user_id = request.user.id if request.user else None
        return download_attachment_uid(app_name, model_name, uid, user_id)

def download_attachment_uid(app_name, model_name, uid, user_id):
    model = apps.get_model(app_name, model_name)

    attachment = model.objects.get(uid = uid)
    file_path = str(settings.MEDIA_ROOT) + str(attachment.url)       
    contenttype = mimetypes.guess_type(file_path)[0]
    file_name =  attachment.name
    
    if("s3.amazonaws.com" in settings.MEDIA_ROOT):           
        key = default_storage.bucket.lookup(str(attachment.url))        
        response = HttpResponse(key)        
        response['Content-Length'] = key.size
    else:
        fp = open(file_path, 'rb')
        response = HttpResponse(fp.read())
        fp.close()        
        response['Content-Length'] = os.path.getsize(file_path)                  
    
    response['Content-Type'] = contenttype

    if contenttype != None and contenttype.split('/')[-1] in ['pdf', 'png', 'jpg', 'jpeg', 'bmp', 'gif']:
            response['Content-Disposition'] = 'inline'
    else:
        response['Content-Disposition'] = "attachment; filename=%s" % urllib.parse.quote(file_name)
    
    if user_id != None:
        return response
    if user_id == None: 
        if attachment.is_public == True:
            return response
        else:
            return HttpResponse("You don't have permission to access this document.")  
            

def get_attachments(request):
    try:
        app_name = request.POST['app']
        model_name = request.POST['model']
        object_id = int(request.POST['object_id'])    
        if str(app_name).lower() == 'sales':
           response = get_attchments_object_from_power(request,app_name,model_name,object_id)
        else:
            attachments = model.objects.filter(object_id = object_id, deleted=False).order_by("id")
            file_types = list(FileType.objects.all().values('id','name'))
            model = apps.get_model(app_name, model_name)
            response = {
                'data': [],
                'count': attachments.count()
            }    
            response['file_types'] = file_types
            for attachment in attachments:
                response['data'].append(get_attchment_object(attachment))

        return HttpResponse(AppResponse.get(response), content_type='json')

    except Exception as e:
        logging.exception(e)
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')



def get_attchment_object(attachment):
    user = attachment.user
    user_name = user.first_name + ' ' + user.last_name
    user_id =  user.id
    users = UserProfile.objects.filter(user_id = user_id).values('user_id', 'profile_image')
    imageurl = {}

    for user in users:
        imageurl[user['user_id']] = user['profile_image']
    img_src = Util.get_resource_url('profile', str(imageurl[attachment.user_id])) if attachment.user_id in imageurl and imageurl[attachment.user_id] else ''
    file_type = ''
    if attachment.file_type != None:
        file_type = attachment.file_type.description
    return {'id': attachment.id,    
            'uid': attachment.uid,  
            'name': attachment.name, 
            'size': str(attachment.size) + ' KB', 
            'user': user_name, 
            'date': Util.get_local_time(attachment.create_date),
            'file_type': file_type,
            'is_public':attachment.is_public,
            'title':attachment.title,
            'subject':attachment.subject,
            'img_src':img_src,
            'isSelected':False,
            'description':attachment.description,
            'workcenter_id': attachment.workcenter_id if hasattr(attachment, 'workcenter_id') and attachment.workcenter_id else 0 ,
            'workcenter_name': attachment.workcenter.name if hasattr(attachment, 'workcenter_id') and attachment.workcenter_id else '' 
            }

def upload_attachment(request,object_id):
    response = {'data' : []}
    try:   
        app_name = request.POST['app']
        model_name = request.POST['model']
        file_type_id = request.POST.get('file_type')
        object_id = int(request.POST['object_id']) if request.POST['object_id'] != '0' else object_id
        c_ip = get_client_ip(request)
        file_name = request.FILES['file']
        public = request.POST.get('makePublic')
        is_public = False
        if public == 'true':
            is_public = True
        # user_id = request.user.id
        # user = User.objects.get(id = user_id)
        
        # if Util.has_perm("can_make_attachment_public",user) == False:
        #     return HttpResponse(AppResponse.msg(0, Util.user_perm_msg), content_type='json')
        
        is_not_valid = str(file_name).lower().endswith(('.bat','.exe','.cmd','.sh','.p','.cgi','.386','.dll','.com','.torrent','.js','.app',
                        '.jar','.pif','.vb','.vbscript','.wsf','.asp','.cer','.csr','.jsp','.drv','.sys','.ade','.adp','.bas','.chm','.cpl',
                        '.crt','.csh','.fxp','.hlp','.hta','.inf','.ins','.isp','.jse','.htaccess','.htpasswd','.ksh','.lnk','.mdb','.mde',
                        '.mdt','.mdw','.msc','.msi','.msp','.mst','.ops','.pcd','.prg','.reg','.scr','.sct','.shb','.shs','.url','.vbe','.vbs',
                        '.wsc','.wsf','.wsh','.php','.php1','.php2','.php3','.php4','.php5'))
        if is_not_valid:
            return HttpResponse(AppResponse.msg(0, "This file type is not allowed to upload."), content_type='json')
        if str(app_name).lower() == 'sales':
            attachment = save_uploaded_file_power_winserver(request,app_name, model_name,object_id)
            response['data'] = [get_attchment_object_from_power(request,app_name,model_name,object_id,attachment['RID'])];        
        else:
            u_id = request.session['userid']
            attachment = upload(app_name, model_name, object_id, request.FILES['file'], file_type_id, c_ip, '-', u_id, is_public)
            response['data'] = [get_attchment_object(attachment)];        
        response['code'] = 1
        response['msg'] = "File uploaded."
    
    except Exception as e:
        response['code'] = 0
        response['msg'] = str(e)
        manager.create_from_exception(e)
    return HttpResponse(AppResponse.get(response), content_type='json')


def attachment_change_access(request):
    try:
        app_name = request.POST['app']
        model_name = request.POST['model']
        user_id = request.user.id
        user = User.objects.get(id = user_id)
        perm = str(app_name) +'.change_'+str(model_name)
        permission = Util.has_perm("can_make_attachment_public",user)
        if permission == False:
            return HttpResponse(AppResponse.msg(0, Util.user_perm_msg), content_type='json')
        attachment_id = int(request.POST['id'])
        model = apps.get_model(app_name, model_name)

        attachment = model.objects.filter(id = int(attachment_id)).first()
        if attachment.is_public == True:
            attachment.is_public = False
        else:
            attachment.is_public = True
        attachment.save()
        response = {'data' : []}         
        response['access'] = attachment.is_public
        response['id'] = attachment.id
        response ['permission'] = permission
        return HttpResponse(AppResponse.get(response), content_type='json')

    except Exception as e:
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')

def upload_and_save_attachment(request,data, app_name, model_name, object_id, u_id, c_ip, code, file_name):
    try:
        domain = request.META['HTTP_HOST']
        file_type = FileType.objects.filter(code = code, is_active = True).first()
        rootFolderName =  app_name +'/'+ model_name.replace('_attachment', '').lower()
        file_rootpath = Attachment.get_file_rootpath(rootFolderName);
        file_path = os.path.join(file_rootpath, file_name)
        full_path = str(settings.MEDIA_ROOT) + file_path
        data_new = full_path.rsplit('/', 1)
        if len(data_new) > 0 and data_new[0]!='':
            parent_dir = str(data_new[0])
            if not os.path.exists(parent_dir):
                os.makedirs(parent_dir)
        if not os.path.isfile(full_path):
            with open(full_path, 'wb') as f:
                    f.write(data) 
            size = os.path.getsize(full_path)/1024
            print('heere', c_ip, u_id)
            upload(app_name, model_name, object_id , file_path, file_type.id, c_ip, '-', u_id, False, file_name, size)
        return full_path
    except Exception as e:
        manager.create_from_exception(e)
        return ''

def upload(_app_name, _model_name, _object_id, _docfile, _file_type,_ip_addr, _checksum, _user_id, is_public, _name = None, _size = None, doc_type = 'gen'):
    try:
        if _name is None:
            _name = _docfile._name
        
        if _size is None:
            _size = _docfile.size / 1024

        model = apps.get_model(_app_name, _model_name)   
        file_type_ref = None
        if _file_type != None and _file_type != '':
            file_type_ref = int(_file_type) 

        print(_docfile)
        attachment = model(
            name = _name,        
            object_id = _object_id,
            url = _docfile, 
            size = _size,         
            ip_addr = _ip_addr,
            checksum = _checksum,
            user_id = _user_id,
            doc_type = doc_type,
            file_type_id = file_type_ref,
            is_public = is_public)    

        attachment.save()

        log_views.insert(_app_name, _model_name, [attachment.id], AuditAction.INSERT, _user_id, _ip_addr, _name + ' uploaded.')

        return attachment
    except Exception as e:
        logging.exception(e)
        return None
        # return HttpResponse(AppResponse.msg(0, str(e)), content_type = 'json')
        
def attachment_properties(request):
    try:
        field_name = request.POST.get('field_name')
        app_name = request.POST.get('app')
        model_name = request.POST.get('model')
        value = request.POST.get('value')
        attachment_id = request.POST['attachment_id']
        object_id = int(request.POST['object_id'])

        if str(app_name).lower() == 'sales':
            response = get_attchments_object_from_power(request,app_name,model_name,object_id)
        else:    
            attachment = apps.get_model(app_name, model_name)   
            attachment_saves=attachment.objects.filter(id = attachment_id).first()

            if str(field_name) == 'title':
                attachment_saves.title = value

            if str(field_name) == 'subject':
                attachment_saves.subject = value

            if str(field_name) == 'description':
                attachment_saves.description = value

            if str(field_name) == 'workcenter_id':
                attachment_saves.workcenter_id = value
            attachment_saves.save()

            attachments =  attachment.objects.filter(object_id = object_id, deleted=False).order_by("id")

            response = {
                'data': [],
            }    
            for attachment in attachments:
                response['data'].append(get_attchment_object(attachment))
        return HttpResponse(AppResponse.get(response), content_type='json')
    except Exception as e:
        logging.exception(e)
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')


def get_attchment_object_from_power(request,app_name,model_name,object_id,attachment_id):
    try:
        attachment = Util.db_execute_sp("set nocount on; exec sales_app_filepath_sp ?,?,?,?,?,?,?,?,?,?,?,?,?,?", ["selectfiles_by_RID",attachment_id,None,None,None,None,None,None,None,None,None,None,None,None],'fetch_one')
        if attachment:    
            return {
                'po_status': True,
                'uid': attachment['sUid'],
                'is_scope': True,
                'file_type': attachment['sFileType'],
                'user': sales_views.get_admindata_by_power_id(attachment['sCreatedBy'])['user__first_name'],
                'date': (attachment['sUploadDate']).strftime("%d/%m/%Y %H:%M:%S") if attachment['sUploadDate'] else '',
                'is_public': False,
                'id': attachment['RID'],
                'size': str(attachment['sFileSize'])+' - KB',
                'name': attachment['sFileName'],
                'object_id': attachment['sEntityId'],
                'file_desc': attachment['sDocType']
            }
    except Exception as e:
        logging.exception(e)
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')
    

def get_attchments_object_from_power(request,app_name,model_name,object_id):
    try:
        attachments = Util.db_execute_sp("set nocount on; exec sales_app_filepath_sp ?,?,?,?,?,?,?,?,?,?,?,?,?,?", ["selectfiles_by_entityid",None,object_id,None,None,None,None,None,None,None,None,None,None,None],'fetch_all')
        response = {
            'data': [],
            'count': len(attachments) if attachments else 0
        }
        if attachments:    
            for attachment in attachments:
                response['data'].append({
                    'po_status': True,
                    'uid': attachment['sUid'],
                    'is_scope': True,
                    'file_type': attachment['sFileType'],
                    'user': sales_views.get_admindata_by_power_id(attachment['sCreatedBy'])['user__first_name'],
                    'date': (attachment['sUploadDate']).strftime("%d/%m/%Y %H:%M:%S") if attachment['sUploadDate'] else '',
                    'is_public': False,
                    'id': attachment['RID'],
                    'size': str(attachment['sFileSize'])+' - KB',
                    'name': attachment['sFileName'],
                    'object_id': attachment['sEntityId'],
                    'file_desc': attachment['sDocType']
                })
        return response    
    except Exception as e:
        logging.exception(e)
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')
    


def get_root_path(is_customer=False):
        db_engine = Util.db_engine()
        with db_engine.begin() as conn:
            root_path_query = "select * from db_fileserverpath where bActive=1"
            fileserver_obj = conn.execute(root_path_query).fetchall()
        rootpath = fileserver_obj[0]["fileserverpath"]

        if settings.IS_TEST_SITE or settings.IS_LIVE:
            if is_customer:
                return settings.IMPERSONATE_CUSTOMER_SERVER
            return rootpath.replace(str(settings.SERVER_NAME), str(settings.SERVER_IP))
        return rootpath

    
def save_uploaded_file_power_winserver(request, app_name, model_name,object_id):
    try:
        current_time = datetime.now()
        year = current_time.year
        month = current_time.month
        day = current_time.day
        uid = get_uid()

        def get_file_data(file_object):
            file_obj = file_object.file.read()
            extension = file_object.name.split(".")[-1]
            filename =  file_object.name  #str(order_nr) + "." + str(extension)
            return file_obj, filename ,extension

        file_data, filename , doc_type= get_file_data(request.FILES['file'])
        file_path = "SalesAppFile\\" + str(model_name) + "\\" + str(year) + "\\" + str(month) + "\\" + str(day)
        rootpath = get_root_path(False)            
        with Impersonate(True):
            if not os.path.exists(rootpath + "\\" + file_path):
                os.makedirs(rootpath + "\\" + file_path)

            full_path_with_rootpath = rootpath + "\\" + file_path + "\\" + uid +'.'+ doc_type
            save_file_path = file_path + "\\" + uid +'.'+ doc_type
            if not os.path.isfile(full_path_with_rootpath):
                with open(full_path_with_rootpath, "wb") as fp:
                    fp.write(file_data)
                    fp.close()              
                file_size = os.path.getsize(full_path_with_rootpath)
                attachment = Util.db_execute_sp("set nocount on; exec sales_app_filepath_sp ?,?,?,?,?,?,?,?,?,?,?,?,?,?", ["insert",None,object_id,model_name,sales_views.get_pcb_user_id(request),None,0,"OTHER",doc_type,model_name,filename,save_file_path,file_size,uid],'fetch_one')
                return {"code":1,"msg":"True","RID":attachment["RID"]}
            else:
                return {"code":0,"msg":"False"}
    except Exception as e:
        logging.exception(e)
        manager.create_from_exception(e)
        return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')
    

def download_file_from_winserver(request,uid):
    try:
        attachments = Util.db_execute_sp("set nocount on; exec sales_app_filepath_sp ?,?,?,?,?,?,?,?,?,?,?,?,?,?", ["selectfiles_by_uid",None,None,None,None,None,None,None,None,None,None,None,None,uid],'fetch_one')
        rootpath = get_root_path(False)
        quot_file_path = rootpath +"\\"+ attachments['sFilePath']
        file_name = attachments['sFileName']
        if not uid:
            response = render_to_response("base/204.html")
            response.status_code = 404
            return response
        file_server_data = {}
        file_server_data['ImpersonatUsername'] = settings.IMPERSONATE_USERNAME
        file_server_data['ImpersonatPassword'] = settings.IMPERSONATE_PWD
        file_server_data['FileServerPath'] = settings.FILESERVERPATH
        with FileServerImpersonate(file_server_data):
            if os.path.exists(quot_file_path) is False:
                response = render_to_response("base/204.html")
                response.status_code = 404
                return response
            file_data = open(quot_file_path, "rb")
        mime_type = mimetypes.guess_type(file_name)
        response = HttpResponse(file_data, content_type=mime_type)
        response['Content-Disposition'] = "attachment; filename=%s" % file_name
        return response
    except Exception as e:
        manager.create_from_exception(e)
        logging.exception("Something went wrong.")
        return HttpResponse(AppResponse.msg(0, "Something went wrong."), content_type="json")