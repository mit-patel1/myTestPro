# Generated by Django 3.2.20 on 2023-08-15 12:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exception_log', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='errorbase',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]
