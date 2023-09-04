from django.contrib import admin
from attachment.models import FileType

class FileTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'description', 'is_active')


admin.site.register(FileType, FileTypeAdmin)