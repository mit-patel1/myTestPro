from django import forms
from base.models import SysParameter

class SysParameterForm(forms.ModelForm):

    class Meta:
        model = SysParameter
        fields = [ 'para_code', 'descr', 'para_value', 'para_group']

