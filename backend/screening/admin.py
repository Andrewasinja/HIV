from django.contrib import admin

from .models import Screening


@admin.register(Screening)
class ScreeningAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'risk_level', 'score', 'age_band', 'place', 'std', 'language')
    list_filter = ('risk_level', 'age_band', 'place', 'std', 'tested_past_year', 'aids_education', 'language')
    date_hierarchy = 'created_at'
    readonly_fields = [f.name for f in Screening._meta.fields]

    def has_add_permission(self, request):
        return False
