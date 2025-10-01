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
    """평가(Evaluation) 관리 어드민"""
    inlines = [PairwiseComparisonInline, EvaluationSessionInline]
    
    list_display = [
        'project_link', 
        'evaluator_display', 
        'status_badge', 
        'progress_bar', 
        'consistency_display', 
        'session_time_display',
        'created_at_display'
    ]
    list_filter = ['status', 'is_consistent', 'created_at', 'project']
    search_fields = ['project__title', 'evaluator__username', 'title']
    readonly_fields = ['created_at', 'updated_at', 'consistency_ratio', 'is_consistent']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('project', 'evaluator', 'title', 'instructions')
        }),
        ('진행 상황', {
            'fields': ('status', 'progress', 'started_at', 'completed_at', 'expires_at'),
            'description': '평가 진행 상황과 시간 정보'
        }),
        ('일관성 검사', {
            'fields': ('consistency_ratio', 'is_consistent'),
            'description': '일관성 비율이 0.1 이하이면 일관성이 있다고 판단됩니다.'
        }),
        ('메타데이터', {
            'fields': ('metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def project_link(self, obj):
        """프로젝트 링크"""
        return format_html(
            '<a href="/admin/projects/project/{}/change/" style="color: #007bff;">{}</a>',
            obj.project.id, obj.project.title
        )
    project_link.short_description = '프로젝트'
    
    def evaluator_display(self, obj):
        """평가자 표시"""
        if obj.evaluator:
            return format_html(
                '<span style="font-weight: bold;">👤 {}</span><br><small style="color: #6c757d;">{}</small>',
                obj.evaluator.username or obj.evaluator.email,
                obj.evaluator.email
            )
        return '익명'
    evaluator_display.short_description = '평가자'
    
    def status_badge(self, obj):
        """상태 뱃지"""
        colors = {
            'pending': '#ffc107',     # 노랑
            'in_progress': '#007bff', # 파랑
            'completed': '#28a745',   # 초록
            'expired': '#dc3545',     # 빨강
            'cancelled': '#6c757d',   # 회색
        }
        icons = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'expired': '⏰',
            'cancelled': '❌',
        }
        color = colors.get(obj.status, '#6c757d')
        icon = icons.get(obj.status, '❓')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">{} {}</span>',
            color, icon, obj.get_status_display()
        )
    status_badge.short_description = '상태'
    
    def progress_bar(self, obj):
        """진행률 바"""
        progress = obj.progress or 0
        color = '#28a745' if progress >= 100 else '#007bff' if progress >= 50 else '#ffc107'
        return format_html(
            '''
            <div style="width: 100px; background-color: #e9ecef; border-radius: 3px; overflow: hidden;">
                <div style="width: {}%; height: 20px; background-color: {}; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
                    {}%
                </div>
            </div>
            ''',
            progress, color, int(progress)
        )
    progress_bar.short_description = '진행률'
    
    def consistency_display(self, obj):
        """일관성 표시"""
        if obj.consistency_ratio is not None:
            if obj.is_consistent:
                return format_html(
                    '<span style="color: #28a745; font-weight: bold;">✅ {:.3f}</span>',
                    obj.consistency_ratio
                )
            else:
                return format_html(
                    '<span style="color: #dc3545; font-weight: bold;">❌ {:.3f}</span>',
                    obj.consistency_ratio
                )
        return '미계산'
    consistency_display.short_description = '일관성 비율'
    
    def session_time_display(self, obj):
        """세션 시간 표시"""
        if obj.started_at and obj.completed_at:
            duration = obj.completed_at - obj.started_at
            minutes = int(duration.total_seconds() / 60)
            return f'⏱️ {minutes}분'
        elif obj.started_at:
            return '🔄 진행중'
        return '미시작'
    session_time_display.short_description = '소요시간'
    
    def created_at_display(self, obj):
        """생성일 표시"""
        return obj.created_at.strftime('%m/%d %H:%M') if obj.created_at else '-'
    created_at_display.short_description = '생성일'
    
    # 액션 추가
    actions = ['reset_evaluations', 'extend_deadline', 'recalculate_consistency']
    
    def reset_evaluations(self, request, queryset):
        """선택된 평가 초기화"""
        updated = queryset.update(status='pending', progress=0, started_at=None, completed_at=None)
        self.message_user(request, f'{updated}개의 평가를 초기화했습니다.')
    reset_evaluations.short_description = '선택된 평가 초기화'
    
    def extend_deadline(self, request, queryset):
        """마감일 연장 (7일)"""
        from django.utils import timezone
        from datetime import timedelta
        new_deadline = timezone.now() + timedelta(days=7)
        updated = queryset.update(expires_at=new_deadline)
        self.message_user(request, f'{updated}개의 평가 마감일을 7일 연장했습니다.')
    extend_deadline.short_description = '마감일 7일 연장'
    
    def recalculate_consistency(self, request, queryset):
        """일관성 재계산"""
        count = 0
        for evaluation in queryset:
            # 여기에 일관성 재계산 로직 추가 (향후 구현)
            evaluation.save()  # 모델의 save() 메서드에서 일관성 계산
            count += 1
        self.message_user(request, f'{count}개의 평가 일관성을 재계산했습니다.')
    recalculate_consistency.short_description = '일관성 재계산'


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