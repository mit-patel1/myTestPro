from django import template
import logging
from base.util import Util

register = template.Library()

@register.filter
def get_formatted_decimal(value, arg):
    decimal_place = 4
    if 'decimal_point' in arg.session:
        decimal_place = int(arg.session.get('decimal_point'))
    format = "%."+str(decimal_place)+"f"
    if value==None:
        value = 0.0000
    try:
        value = float(value)
    except ValueError:
        value = 0.0000
    new_decimal = format % value
    return new_decimal

@register.filter
def get_number_value(value, arg):
    if value==None:
        value = 0.00
    new_decimal = "%.0f" % value
    return new_decimal

@register.filter
def get_two_decimal_value(value, arg):
    if value==None or value == '':
        value = 0.00
    new_decimal = "%.2f" % value
    return new_decimal

@register.filter
def get_four_decimal_value(value, arg):
    if value==None:
        value = 0.0000
    new_decimal = "%.4f" % value
    return new_decimal    

@register.filter
def get_formatted_decimal_pdf(value, arg):
    decimal_place = 4
    if arg != '':
        decimal_place = int(arg)
    format = "%."+str(decimal_place)+"f"
    if value==None:
        value = 0.0000
    try:
        value = float(value)
    except ValueError:
        value = 0.0000
    new_decimal = format % value
    return new_decimal

@register.filter
def get_range(value):
    return range(0,value)

@register.filter
def get_formatted_string(value, arg):
    if isinstance(value, str):
        return value.lower().replace(" ", "_")
    return value

@register.filter
def get_multiply_value(value, multiply_value):
    if value != None:
        return value*multiply_value
    return ''

@register.filter
def get_two_factor_date(date):
    if date != None:
        return date.strftime('%d %b')    

@register.filter
def get_local_time(utctime,showtime=False,time_format=None):
    new_time = Util.get_local_time(utctime,showtime,time_format)
    return new_time

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)  

@register.filter
def get_short_string(arg, limit):
    if len(arg) >= limit:
        return arg[0:limit-2] + ".."
    return arg

@register.filter
def get_division(value, arg):
    division_value = value / arg
    if not isinstance(division_value, int) or division_value == 0:
        return 1
    return division_value

@register.filter
def get_name_string(value):
    return(value.replace("'",""))

@register.filter
def get_float_value(value, arg):
    if value==None:
        value = 0.00
    new_decimal =  float(value)
    return new_decimal

@register.filter
def replace(value, args):
    replace_data = args.split(",")
    return value.replace(replace_data[0][1:-1], replace_data[1][1:-1])