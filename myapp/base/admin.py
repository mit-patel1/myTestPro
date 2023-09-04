from django.contrib import admin
from base.models import ReleaseNotes

# class DocNumberAdmin(admin.ModelAdmin):
#     list_display = ('code', 'desc', 'prefix', 'length', 'increment', 'nextint', 'nextnum')

# class DMI_queriesAdmin(admin.ModelAdmin):
#     list_display = ('title', 'descr', 'report_code', 'is_active')


class ReleaseNotesAdmin(admin.ModelAdmin):
    list_display = ("version", "note", "created_by")


# class AppReportAdmin(admin.ModelAdmin):
#     list_display = ('report', 'app')

# admin.site.register(DocNumber, DocNumberAdmin)
# admin.site.register(DMI_queries, DMI_queriesAdmin)
admin.site.register(ReleaseNotes, ReleaseNotesAdmin)
# admin.site.register(AppReport, AppReportAdmin)

# Register your models here.
