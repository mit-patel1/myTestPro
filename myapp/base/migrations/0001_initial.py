# Generated by Django 2.2.6 on 2020-03-25 12:19

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import attachment.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("attachment", "0001_initial"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="SysParameter",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("para_code", models.CharField(max_length=60, verbose_name="Parameter code")),
                ("descr", models.CharField(blank=True, max_length=250, null=True, verbose_name="Description")),
                ("para_value", models.CharField(max_length=1000, verbose_name="Parameter value")),
                ("para_group", models.CharField(blank=True, max_length=30, null=True, verbose_name="Parameter Group")),
            ],
        ),
        migrations.CreateModel(
            name="UISettings",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("url", models.CharField(max_length=300)),
                ("table_index", models.IntegerField()),
                ("col_settings", models.CharField(max_length=500, null=True)),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Remark_Attachment",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(default="", max_length=150)),
                ("uid", models.CharField(default=attachment.models.get_uid, max_length=50)),
                ("object_id", models.IntegerField()),
                ("url", models.FileField(upload_to=attachment.models.update_filename)),
                ("title", models.CharField(default="", max_length=50)),
                ("subject", models.CharField(default="", max_length=50)),
                ("description", models.TextField(default="")),
                ("size", models.IntegerField(default=0)),
                ("ip_addr", models.CharField(default="", max_length=45)),
                ("deleted", models.BooleanField(default=False)),
                ("checksum", models.CharField(default="", max_length=45)),
                ("create_date", models.DateTimeField(auto_now=True)),
                ("doc_type", models.CharField(choices=[("general", "General"), ("invoice", "Invoice"), ("order", "Order")], default="gen", max_length=20, verbose_name="Doc Type")),
                ("is_public", models.BooleanField(default=False)),
                ("file_type", models.ForeignKey(default="", null=True, on_delete=django.db.models.deletion.PROTECT, to="attachment.FileType", verbose_name="File type")),
                ("user", models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
            options={"abstract": False,},
        ),
        migrations.CreateModel(
            name="Remark",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("entity_id", models.IntegerField(blank=True, null=True, verbose_name="ID of the object")),
                ("remark", models.TextField(blank=True, null=True)),
                ("remark_type", models.CharField(choices=[("normal", "Normal"), ("rejection", "Rejection")], max_length=10, verbose_name="Remark type")),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("content_type", models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to="contenttypes.ContentType")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="ReleaseNotes",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("version", models.CharField(max_length=12, verbose_name="Release version")),
                ("note", models.TextField(verbose_name="Release note")),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="FavoriteView",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150, verbose_name="View name")),
                ("url", models.CharField(max_length=500, verbose_name="View url")),
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
