from __future__ import unicode_literals

from django.db import models
from django.contrib.contenttypes.models import ContentType
from uuid import uuid4
import os
import datetime
from django.contrib.auth.models import User
from base.choices import *
from django.db import connection

def get_uid():
    return str(uuid4())

def update_filename(instance, filename):        
    rootFolderName =  str(instance._meta.app_label) +'/'+ instance._meta.object_name.replace('_Attachment', '').lower()
    path = Attachment.get_file_rootpath(rootFolderName)
    newfilename = instance.uid + "_" + filename    
    print("----------------")
    print(os.path.join(path, newfilename))
    return os.path.join(path, newfilename)

class FileType(models.Model):
    name = models.CharField(max_length=100, null=False, verbose_name='File type name')
    code = models.CharField(max_length=30, null=False, verbose_name='File type code')
    description = models.CharField(max_length=200, default='', verbose_name='Description')
    is_active = models.BooleanField(default=True)    

class Attachment(models.Model):    
    name = models.CharField(default='',max_length=150)
    uid = models.CharField(default=get_uid, max_length=50)    
    object_id = models.IntegerField(null=False)
    url = models.FileField(upload_to=update_filename)
    title = models.CharField(default='',max_length=50)
    subject = models.CharField(default='',max_length=50)
    description = models.TextField(default='')
    size = models.IntegerField(default=0)    
    ip_addr = models.CharField(default='',max_length=45)
    deleted = models.BooleanField(default=False)
    checksum = models.CharField(default='',max_length=45)
    user = models.ForeignKey(User, on_delete=models.PROTECT, null = True)
    create_date = models.DateTimeField(auto_now=True)
    doc_type = models.CharField(choices = doc_type, verbose_name='Doc Type', max_length=20, default='gen')
    file_type = models.ForeignKey(FileType, on_delete=models.PROTECT, default='',null=True, verbose_name='File type')
    is_public = models.BooleanField(default=False)  

    class Meta:
        abstract = True

    @staticmethod
    def get_file_rootpath(rootFolderName):        
        path = "/{}/{}/{}/{}/".format(rootFolderName,str(datetime.date.today().year),str(datetime.date.today().month),str(datetime.date.today().day))
        return path