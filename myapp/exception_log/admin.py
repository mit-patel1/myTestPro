from django.contrib import admin
from exception_log.models import ErrorBase

class ErrorBaseAdmin(admin.ModelAdmin):
    def time_seconds(self, obj):
        return obj.created_on.strftime("%d-%b-%Y %H:%M:%S")
    
    list_per_page = 50
    list_display = ('class_name', 'message', 'level', 'traceback', 'time_seconds')

admin.site.register(ErrorBase, ErrorBaseAdmin)
