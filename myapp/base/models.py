from __future__ import unicode_literals

from django.db import models
from io import StringIO
import json
from django.contrib.auth.models import User
from base.choices import *
from django.contrib.contenttypes.models import ContentType
from attachment.models import Attachment


class AppResponse(object):
    @staticmethod
    def msg(code, message):
        msg = {"code": code, "msg": message}
        return json.dumps(msg)

    @staticmethod
    def get(object):
        s = StringIO()
        json.dump(object, s)
        s.seek(0)
        return s.read()


class SysParameter(models.Model):
    para_code = models.CharField(max_length=60, verbose_name="Parameter code", null=False)
    descr = models.CharField(max_length=250, verbose_name="Description", null=True, blank=True)
    para_value = models.CharField(max_length=1000, verbose_name="Parameter value", null=False)
    para_group = models.CharField(max_length=30, verbose_name="Parameter Group", null=True, blank=True)

class WhiteListedIp(models.Model):
    ip = models.CharField(max_length=60, verbose_name="IP address", null=False)
    description = models.CharField(max_length=250, verbose_name="Description", blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    
class FavoriteView(models.Model):

    name = models.CharField(max_length=150, verbose_name="View name")
    url = models.CharField(max_length=500, verbose_name="View url")
    created_on = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)


class ReleaseNotes(models.Model):
    version = models.CharField(max_length=12, verbose_name="Release version")
    note = models.TextField(verbose_name="Release note")
    created_on = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)


class Remark(models.Model):
    entity_id = models.IntegerField(null=True, blank=True, verbose_name="ID of the object")
    content_type = models.ForeignKey(ContentType, null=True, on_delete=models.PROTECT)
    remark = models.TextField(null=True, blank=True)
    remark_type = models.CharField(max_length=10, choices=remark_type, verbose_name="Remark type")
    created_on = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)


class UISettings(models.Model):
    url = models.CharField(max_length=300)
    table_index = models.IntegerField()
    col_settings = models.CharField(max_length=500, null=True)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    created_on = models.DateTimeField(auto_now_add=True)


class Remark_Attachment(Attachment):
    pass


class RestrictedIpLog(models.Model):
    username = models.CharField(max_length=300, verbose_name='User name')
    ip = models.CharField(max_length=300, verbose_name='IP Address')
    validation_msg = models.CharField(max_length=1000, verbose_name='Validation message')
    ip_restriction = models.BooleanField(default=True, verbose_name="Ip restriction")
    created_on = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)