from django.conf.urls import url

from . import views

app_name = 'mails'
urlpatterns = [    
    url(r'^mail_screen', views.mail_screen, name='mail_screen'),    
    url(r'^send_mail', views.send_mail, name='send_mail'),
    url(r'^test_mail', views.test_mail, name='test_mail'),
]