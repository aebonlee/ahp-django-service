"""
Admin configuration for Evaluation models
"""
from django.contrib import admin
from .models import (
    Evaluation, PairwiseComparison, EvaluationSession, 
    EvaluationInvitation, DemographicSurvey
)


class PairwiseComparisonInline(admin.TabularInline):
    model = PairwiseComparison
    extra = 0
    fields = ('criteria_a', 'criteria_b', 'value', 'confidence', 'answered_at')
    readonly_fields = ('answered_at',)


class EvaluationSessionInline(admin.TabularInline):
    model = EvaluationSession
    extra = 0
    fields = ('started_at', 'ended_at', 'duration', 'ip_address')
    readonly_fields = ('started_at', 'ended_at', 'duration')


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    """Evaluation admin"""
    inlines = [PairwiseComparisonInline, EvaluationSessionInline]
    
    list_display = (
        'project', 'evaluator', 'status', 'progress', 'consistency_ratio', 
        'is_consistent', 'created_at'
    )
    list_filter = ('status', 'is_consistent', 'created_at', 'project')
    search_fields = ('project__title', 'evaluator__username', 'title')
    readonly_fields = ('created_at', 'updated_at', 'consistency_ratio', 'is_consistent')
    
    fieldsets = (
        (None, {
            'fields': ('project', 'evaluator', 'title', 'instructions')
        }),
        ('Progress', {
            'fields': ('status', 'progress', 'started_at', 'completed_at', 'expires_at')
        }),
        ('Results', {
            'fields': ('consistency_ratio', 'is_consistent')
        }),
        ('Metadata', {
            'fields': ('metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PairwiseComparison)
class PairwiseComparisonAdmin(admin.ModelAdmin):
    """Pairwise Comparison admin"""
    list_display = ('evaluation', 'criteria_a', 'criteria_b', 'value', 'confidence', 'answered_at')
    list_filter = ('confidence', 'answered_at', 'evaluation__project')
    search_fields = ('evaluation__project__title', 'criteria_a__name', 'criteria_b__name')
    readonly_fields = ('answered_at',)


@admin.register(EvaluationInvitation)
class EvaluationInvitationAdmin(admin.ModelAdmin):
    """Evaluation Invitation admin"""
    list_display = (
        'project', 'evaluator', 'invited_by', 'status', 'sent_at', 'responded_at'
    )
    list_filter = ('status', 'sent_at', 'project')
    search_fields = ('project__title', 'evaluator__username', 'invited_by__username')
    readonly_fields = ('token', 'sent_at', 'responded_at')
    
    fieldsets = (
        (None, {
            'fields': ('project', 'evaluator', 'invited_by', 'message')
        }),
        ('Status', {
            'fields': ('status', 'sent_at', 'responded_at', 'expires_at')
        }),
        ('Security', {
            'fields': ('token',),
            'classes': ('collapse',)
        }),
    )


@admin.register(EvaluationSession)
class EvaluationSessionAdmin(admin.ModelAdmin):
    """Evaluation Session admin"""
    list_display = ('evaluation', 'started_at', 'ended_at', 'duration', 'ip_address')
    list_filter = ('started_at', 'ended_at')
    search_fields = ('evaluation__project__title', 'evaluation__evaluator__username')
    readonly_fields = ('started_at', 'ended_at', 'duration')


@admin.register(DemographicSurvey)
class DemographicSurveyAdmin(admin.ModelAdmin):
    """Demographic Survey admin"""
    list_display = (
        'evaluator', 'project', 'age', 'gender', 'education', 'occupation',
        'is_completed', 'completion_percentage', 'created_at'
    )
    list_filter = ('is_completed', 'age', 'gender', 'education', 'project', 'created_at')
    search_fields = ('evaluator__username', 'project__title', 'occupation', 'department')
    readonly_fields = ('created_at', 'updated_at', 'completion_timestamp', 'completion_percentage')
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('evaluator', 'project')
        }),
        ('인구통계학적 정보', {
            'fields': ('age', 'gender', 'education', 'occupation')
        }),
        ('전문 정보', {
            'fields': ('experience', 'department', 'position', 'project_experience')
        }),
        ('의사결정 역할', {
            'fields': ('decision_role', 'additional_info')
        }),
        ('완료 상태', {
            'fields': ('is_completed', 'completion_timestamp', 'completion_percentage')
        }),
        ('메타데이터', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def completion_percentage(self, obj):
        """완성도 표시"""
        return f"{obj.completion_percentage:.1f}%"
    completion_percentage.short_description = "완성도"