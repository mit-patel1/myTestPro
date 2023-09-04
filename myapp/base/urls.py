from django.conf.urls import url
from . import views, report_views
from base import lookups as lookups_view
from base import pagers as pagers_view
from base import search_view

app_name = "base"
urlpatterns = [
    url(r"^$", views.index, name="index"),
    url(r"^dashboard/$", views.dashboard, name="dashboard"),
    url(r"^iframe_index/$", views.iframe_index, name="iframe_index"),
    url(r"^release_note/$", views.release_note, name="release_note"),
    url(r"^lookups/([^/]+)/$", lookups_view.lookups, name="lookups"),
    url(r"^pagers/$", pagers_view.pagers, name="pagers"),
    url(r"^get_app_data/$", views.get_app_data, name="get_app_data"),
    url(r"^sysparameters/$", views.sysparameters, name="sysparameters"),
    url(r"^sysparameter_search/$", views.sysparameter_search, name="sysparameter_search"),
    url(r"^sysparameter/$", views.sysparameter, name="sysparameter_add"),
    url(r"^sysparameter/(\d+)/$", views.sysparameter, name="sysparameter_edit"),
    url(r"^sysparameter_del/$", views.sysparameter_del, name="sysparameter_delete"),
    url(r"^reports/(\d+)/$", report_views.report_query, name="report_query"),
    url(r"^reports_search/(\d+)/$", report_views.reports_search, name="reports_search"),
    url(r"^add_page_favorite/$", views.add_page_favorite, name="add_page_favorite"),
    url(r"^delete_page_favorite/$", views.delete_page_favorite, name="delete_page_favorite"),
    url(r"^create_remark/$", views.create_remark_view, name="create_remark"),
    url(r"^get_remarks/$", views.get_remarks, name="get_remarks"),
    url(r"^delete_remark/$", views.delete_remark, name="delete_remark"),
    url(r"^check_subscription/$", views.check_subscription, name="check_subscription"),
    url(r"^subscribe_item/$", views.subscribe_item, name="subscribe_item"),
    url(r"^unsubscribe_item/$", views.unsubscribe_item, name="unsubscribe_item"),
    url(r"^create_export_file/$", report_views.create_export_file, name="create_export_file"),
    url(r"^export_reports/([^/]+)/$", report_views.export_reports, name="export_reports"),
    url(r"^add_favorite_report/$", report_views.add_favorite_report, name="add_favorite_report"),
    url(r"^delete_favorite_report/$", report_views.delete_favorite_report, name="delete_favorite_report"),
    url(r"^set_col_order/$", views.set_col_order, name="set_col_order"),
    url(r"^get_all_user_list/$", views.get_all_user_list, name="get_all_user_list"),
    url(r"^search/$", search_view.search, name="app_search"),
    url(r"^settings/$", views.settings, name="settings"),
    url(r"^upload_wysiwyg_media/$", views.upload_wysiwyg_media, name="upload_wysiwyg_media"),
]
