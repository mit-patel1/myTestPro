from django.conf.urls import url

from . import views

app_name = 'attachment'
urlpatterns = [
    url(r'^get_attachments', views.get_attachments, name='get_attachments'),
    url(r'^upload_attachment/([^/]+)/$', views.upload_attachment, name='upload_attachment'),
    url(r'^del_attachment', views.delete_attachment, name='delete_attachment'),
    url(r'^dwn_attachment', views.download_attachment, name='attachment_download'),    
    url(r'^dialog_template/$', views.dialog_template, name='dialog_template'),
    url(r'^attachment_change_access/$', views.attachment_change_access, name='attachment_change_access'),
    url(r'^attachment_properties/$', views.attachment_properties, name='attachment_properties'),
]