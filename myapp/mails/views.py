#from __future__ import absolute_import, unicode_literals
from django.shortcuts import render
from django.http import HttpResponse
from django.template import Context, loader, Template
from django.template.loader import render_to_string, get_template
from post_office import mail
from django.conf import settings
from base.util import Util
import logging, threading
from django.db import transaction
from base.models import AppResponse, SysParameter
import smtplib
from exception_log import manager
from post_office.models import EmailTemplate
from django.core.mail import send_mail
from messaging.models import SMSTemplate
import urllib.request,urllib
from stronghold.decorators import public
from django.db import connection
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import time
from django.db import close_old_connections
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart

def send_email_by_tmpl(use_thread, tenant_schema, to_emails, template_id, context):
    mail_config = get_mail_config()
    email_template = EmailTemplate.objects.filter(id = template_id).values('subject','html_content').first()
    mail_context = Context(context)
    subject = Template(email_template['subject']).render(mail_context)
    message = Template(email_template['html_content']).render(mail_context)

    if use_thread:
        thread = threading.Thread(target=_send_mail ,args=(mail_config, to_emails, subject, message, []))
        thread.start()
    else:
        _send_mail(mail_config, to_emails, subject, message, [])

def send_mail(use_thread, tenant_schema, to_emails, subject, message, attachments, cc_mails = [], bcc_mails = [], headers = []):
    mail_config = get_mail_config()

    bcc_mails = bcc_mails + mail_config['bcc_mails']
    if use_thread:
        thread = threading.Thread(target=_send_mail ,args=(mail_config, to_emails, subject, message, attachments, cc_mails, bcc_mails, headers))
        thread.start()
    else:
        _send_mail(mail_config, to_emails, subject, message, attachments, cc_mails, bcc_mails, headers)

def get_mail_config():
    mail_config = {}
    para_codes = ['email_backend', 'email_host', 'email_host_user', 'email_host_password', 'email_port', 'email_use_ssl', 'email_from', 'email_bcc','email_from_name']
    sys_parms = SysParameter.objects.filter(para_code__in = para_codes)
    email_from = ''
    bcc_mails = []
    for sys_parm in sys_parms:
        if sys_parm.para_code == 'email_backend':
            mail_config['email_backend'] = sys_parm.para_value
        elif sys_parm.para_code == 'email_host':
            mail_config['email_host'] = sys_parm.para_value
        elif sys_parm.para_code == 'email_host_user':
            mail_config['email_host_user'] = sys_parm.para_value
        elif sys_parm.para_code == 'email_host_password':
            mail_config['email_host_password'] = sys_parm.para_value
        elif sys_parm.para_code == 'email_port':
            mail_config['email_port'] = int(sys_parm.para_value)
        elif sys_parm.para_code == 'email_use_ssl':
            mail_config['email_use_ssl'] = sys_parm.para_value
        elif sys_parm.para_code == 'email_from_name':
            email_from += sys_parm.para_value
        elif sys_parm.para_code == 'email_from':
            email_from += '<'+ sys_parm.para_value + '>'
        elif sys_parm.para_code == 'email_bcc':
            if sys_parm.para_value.strip() != "" and sys_parm.para_value.lower() != "false":
                bcc_mails = sys_parm.para_value.split(",")

    mail_config['default_from_email'] = email_from
    mail_config['bcc_mails'] = bcc_mails
    return mail_config

def _send_mail(mail_config, to_emails, subject, message, attachments, cc_mails = [], bcc_mails = [], headers = []):
    server = None
    try:
        if mail_config['email_host_user'] == "" or mail_config['email_host_password'] == "" or mail_config['email_port'] == "":
            return           
        
        from_address = mail_config['default_from_email']
        mail_server = mail_config['email_host']
        port = int(mail_config['email_port'])
        user = mail_config['email_host_user']
        password = mail_config['email_host_password']
        ssl = mail_config['email_use_ssl']
        msg = MIMEMultipart()
        msg['From'] = from_address 
        msg['Subject'] = subject
        msg['To'] = ",".join(to_emails) if to_emails else ''
        msg['Cc'] = ",".join(cc_mails) if cc_mails else ''     
        Cc_Emails = msg['Cc'].split(",")
        for header in headers:
            key = next(iter(header))
            msg[key] = str(header[key])
        recipients = to_emails + Cc_Emails + bcc_mails
        msg.attach(MIMEText(message, 'html'))
        # msg.attach(MIMEText(message.encode('utf-8'), 'html'))
        for attachment in attachments:
            with open(attachments[attachment], "rb") as fil:
                part = MIMEApplication(
                    fil.read(),
                    Name=attachment
                )
            # After the file is closed
            part['Content-Disposition'] = 'attachment; filename="%s"' % attachment
            msg.attach(part)
        
        if ssl == 'True':
            server = smtplib.SMTP_SSL(mail_server, port)
        else:                
            server = smtplib.SMTP(mail_server, port)
            server.starttls()

        server.login(user, password)
        text = msg.as_string()
        server.sendmail(from_address, recipients, text)
      
    except Exception as e:
        logging.exception(e)
        raise e
    
    finally :
        if server != None:
            server.quit()


def mail_screen(request):
    return render(request, 'mails/mail_screen.html')


def send_sms(mobile_numbers, sms_template_id, context):
   #TODO: Implement message sending functionality
   pass

def test_mail(request):
    server = None
    try:
        if request.method == 'POST':            

            from_address = request.POST['from_email_address']
            to_address = request.POST['send_to_email']

            mail_server = request.POST['smtp_server']
            port = int(request.POST['port_number'])
            user = request.POST['username']
            password = request.POST['password']
            ssl = request.POST['enable_ssl']

            msg = MIMEMultipart()
            msg['From'] = from_address 
            msg['To'] = to_address
            msg['Subject'] = 'Sparrow - Test mail works.'
            body = """
                    Hello, 
                    This is a plain email.
                    Kind Regards,
                    Me
                    """

            msg.attach(MIMEText(body, 'plain'))

            if ssl == 'true':
                server = smtplib.SMTP_SSL(mail_server, port)
            else:
                print(mail_server, port)
                server = smtplib.SMTP(mail_server, port)
                server.starttls()

            server.login(user, password)
            text = msg.as_string()
            server.sendmail(from_address, to_address, text)
            server.quit()

            # tenant_schema = Util.get_cache('public'
            # print(request.POST['from_email_address'])
            # print(request.POST['password'])

            # with schema_context(tenant_schema):
            #     settings.EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
            #     settings.EMAIL_HOST = request.POST['smtp_server']
            #     settings.EMAIL_HOST_USER = request.POST['username']
            #     settings.EMAIL_HOST_PASSWORD = request.POST['password']
            #     settings.EMAIL_PORT = int(request.POST['port_number'])  
            #     settings.EMAIL_USE_SSL = request.POST['enable_ssl']
            #     settings.DEFAULT_FROM_EMAIL = request.POST['from_email_address']

            #     subject = 'Sparrow - Test mail works.'
            #     to_emails = request.POST['send_to_email'] 
            #     cc_mails = []
            #     bcc_mails =[]
            #     message = 'Test mail from Sparrow.'
            #     attachments = {}

            #     manager.create_from_text("tenant_schema:"+tenant_schema + "======"+subject)

            #     mail.send(
            #         to_emails,
            #         cc = cc_mails,
            #         bcc = bcc_mails,   
            #         subject = subject,
            #         message = message,
            #         html_message = message,
            #         attachments = attachments,
            #         priority = 'now'
            #     )     
                   
            return HttpResponse(AppResponse.msg(1, 'Sended successfully'), content_type='json')
        return render(request, 'mails/test_mail.html')
    except Exception as e:
      if server != None:
        server.quit()        

      logging.exception("Something")
      manager.create_from_exception(e)      
      return HttpResponse(AppResponse.msg(0, str(e)), content_type='json')
