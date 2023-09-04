from __future__ import unicode_literals

from django.db import models
from base.choices import mail_type
from django.contrib.contenttypes.models import ContentType

# Create your models here.
class MailHistory(models.Model):
    entity_id = models.IntegerField(null=True, blank=True)
    content_type = models.ForeignKey(ContentType, null=True, on_delete=models.PROTECT)
    mail_type =  models.CharField(choices= mail_type, max_length=50)
    to_email = models.EmailField()
    sent_on = models.DateTimeField(auto_now_add=True)