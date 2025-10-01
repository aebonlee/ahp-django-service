"""
Admin configuration for Analysis models
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
import json
from .models import AnalysisResult, WeightVector, ConsensusMetrics

@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    """분석 결과 관리 어드민"""
    list_display = [
        'title_display', 
        'project_link', 
        'type_badge', 
        'status_badge', 
        'progress_bar',
        'created_by_display', 
        'created_at_display'
    ]
    list_filter = ['type', 'status', 'created_at', 'project']
    search_fields = ['title', 'description', 'project__title', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'description', 'project', 'created_by')
        }),
        ('분석 설정', {
            'fields': ('type', 'status', 'parameters'),
            'description': '분석 유형과 매개변수 설정'
        }),
        ('결과 데이터', {
            'fields': ('results', 'summary'),
            'classes': ('collapse',),
            'description': 'JSON 형태의 분석 결과 데이터'
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def title_display(self, obj):
        """제목 표시"""
        return format_html(
            '<strong style="color: #007bff;">{}</strong><br><small style="color: #6c757d;">{}</small>',
            obj.title,
            obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        )
    title_display.short_description = '제목'
    
    def project_link(self, obj):
        """프로젝트 링크"""
        return format_html(
            '<a href="/admin/projects/project/{}/change/" style="color: #007bff;">🔗 {}</a>',
            obj.project.id, obj.project.title
        )
    project_link.short_description = '프로젝트'
    
    def type_badge(self, obj):
        """분석 유형 뱃지"""
        colors = {
            'ahp': '#007bff',          # 파랑
            'sensitivity': '#ffc107',   # 노랑
            'consensus': '#28a745',     # 초록
            'ranking': '#6f42c1',       # 보라
        }
        icons = {
            'ahp': '📊',
            'sensitivity': '📈',
            'consensus': '🤝',
            'ranking': '🏆',
        }
        color = colors.get(obj.type, '#6c757d')
        icon = icons.get(obj.type, '📋')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{} {}</span>',
            color, icon, obj.get_type_display()
        )
    type_badge.short_description = '분석 유형'
    
    def status_badge(self, obj):
        """상태 뱃지"""
        colors = {
            'pending': '#6c757d',      # 회색
            'running': '#007bff',      # 파랑
            'completed': '#28a745',    # 초록
            'failed': '#dc3545',       # 빨강
        }
        icons = {
            'pending': '⏳',
            'running': '🔄',
            'completed': '✅',
            'failed': '❌',
        }
        color = colors.get(obj.status, '#6c757d')
        icon = icons.get(obj.status, '❓')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">{} {}</span>',
            color, icon, obj.get_status_display()
        )
    status_badge.short_description = '상태'
    
    def progress_bar(self, obj):
        """진행률 표시"""
        # results 데이터에서 진행률 추출 (예시)
        progress = 0
        if obj.results:
            try:
                if isinstance(obj.results, dict):
                    progress = obj.results.get('progress', 0)
                elif isinstance(obj.results, str):
                    data = json.loads(obj.results)
                    progress = data.get('progress', 0)
            except:
                progress = 100 if obj.status == 'completed' else 0
        
        color = '#28a745' if progress >= 100 else '#007bff' if progress >= 50 else '#ffc107'
        return format_html(
            '''
            <div style="width: 80px; background-color: #e9ecef; border-radius: 3px; overflow: hidden;">
                <div style="width: {}%; height: 16px; background-color: {}; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
                    {}%
                </div>
            </div>
            ''',
            progress, color, int(progress)
        )
    progress_bar.short_description = '진행률'
    
    def created_by_display(self, obj):
        """생성자 표시"""
        if obj.created_by:
            return format_html(
                '👤 {}',
                obj.created_by.username or obj.created_by.email
            )
        return '시스템'
    created_by_display.short_description = '생성자'
    
    def created_at_display(self, obj):
        """생성일 표시"""
        return obj.created_at.strftime('%m/%d %H:%M') if obj.created_at else '-'
    created_at_display.short_description = '생성일'


@admin.register(WeightVector)
class WeightVectorAdmin(admin.ModelAdmin):
    """가중치 벡터 관리 어드민"""
    list_display = [
        'criteria_display', 
        'project_link', 
        'weight_bar', 
        'rank_display', 
        'method_badge',
        'final_badge'
    ]
    list_filter = ['method', 'is_final', 'project', 'criteria__level']
    search_fields = ['criteria__name', 'project__title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('project', 'criteria', 'weight', 'rank')
        }),
        ('계산 방법', {
            'fields': ('method', 'is_final', 'eigenvalue'),
            'description': '가중치 계산 방법과 최종 결과 여부'
        }),
        ('추가 정보', {
            'fields': ('metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def criteria_display(self, obj):
        """기준 표시"""
        level_icons = {1: '🥇', 2: '🥈', 3: '🥉'}
        icon = level_icons.get(obj.criteria.level, '📍')
        return format_html(
            '{} <strong>{}</strong><br><small style="color: #6c757d;">Level {}</small>',
            icon, obj.criteria.name, obj.criteria.level
        )
    criteria_display.short_description = '기준'
    
    def project_link(self, obj):
        """프로젝트 링크"""
        return format_html(
            '<a href="/admin/projects/project/{}/change/" style="color: #007bff;">{}</a>',
            obj.project.id, obj.project.title
        )
    project_link.short_description = '프로젝트'
    
    def weight_bar(self, obj):
        """가중치 바"""
        weight_percent = (obj.weight or 0) * 100
        color = '#28a745' if weight_percent >= 30 else '#007bff' if weight_percent >= 10 else '#ffc107'
        return format_html(
            '''
            <div style="width: 120px; background-color: #e9ecef; border-radius: 3px; overflow: hidden;">
                <div style="width: {}%; height: 18px; background-color: {}; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
                    {:.1f}%
                </div>
            </div>
            ''',
            weight_percent, color, weight_percent
        )
    weight_bar.short_description = '가중치'
    
    def rank_display(self, obj):
        """순위 표시"""
        if obj.rank:
            rank_icons = {1: '🥇', 2: '🥈', 3: '🥉'}
            icon = rank_icons.get(obj.rank, f'#{obj.rank}')
            return format_html('<span style="font-size: 16px;">{}</span>', icon)
        return '-'
    rank_display.short_description = '순위'
    
    def method_badge(self, obj):
        """계산 방법 뱃지"""
        colors = {
            'eigenvalue': '#007bff',
            'geometric_mean': '#28a745',
            'arithmetic_mean': '#ffc107',
        }
        color = colors.get(obj.method, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.method
        )
    method_badge.short_description = '계산 방법'
    
    def final_badge(self, obj):
        """최종 결과 뱃지"""
        if obj.is_final:
            return format_html('<span style="color: #28a745; font-weight: bold;">⭐ 최종</span>')
        return format_html('<span style="color: #6c757d;">📝 임시</span>')
    final_badge.short_description = '상태'


@admin.register(ConsensusMetrics)
class ConsensusMetricsAdmin(admin.ModelAdmin):
    """합의 지표 관리 어드민"""
    list_display = [
        'project_link', 
        'consensus_gauge', 
        'evaluators_display', 
        'metrics_summary',
        'calculated_at_display'
    ]
    list_filter = ['consensus_level', 'calculated_at', 'project']
    search_fields = ['project__title']
    readonly_fields = ['calculated_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('project', 'total_evaluators', 'participating_evaluators')
        }),
        ('합의 지표', {
            'fields': ('consensus_level', 'kendall_w', 'average_correlation'),
            'description': '켄달의 W, 평균 상관계수 등 합의도 측정 지표'
        }),
        ('상세 메트릭', {
            'fields': ('detailed_metrics',),
            'classes': ('collapse',),
            'description': 'JSON 형태의 상세 합의 지표'
        }),
        ('계산 정보', {
            'fields': ('calculated_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def project_link(self, obj):
        """프로젝트 링크"""
        return format_html(
            '<a href="/admin/projects/project/{}/change/" style="color: #007bff;">🔗 {}</a>',
            obj.project.id, obj.project.title
        )
    project_link.short_description = '프로젝트'
    
    def consensus_gauge(self, obj):
        """합의도 게이지"""
        level = obj.consensus_level or 0
        color = '#28a745' if level >= 0.7 else '#ffc107' if level >= 0.5 else '#dc3545'
        return format_html(
            '''
            <div style="position: relative; width: 100px; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden;">
                <div style="width: {}%; height: 100%; background-color: {}; border-radius: 10px;"></div>
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: black; font-size: 11px; font-weight: bold;">
                    {:.1%}
                </div>
            </div>
            ''',
            level * 100, color, level
        )
    consensus_gauge.short_description = '합의도'
    
    def evaluators_display(self, obj):
        """평가자 수 표시"""
        return format_html(
            '👥 {}/{}<br><small style="color: #6c757d;">참여/전체</small>',
            obj.participating_evaluators or 0,
            obj.total_evaluators or 0
        )
    evaluators_display.short_description = '평가자'
    
    def metrics_summary(self, obj):
        """지표 요약"""
        kendall = obj.kendall_w or 0
        correlation = obj.average_correlation or 0
        return format_html(
            'W: <strong>{:.3f}</strong><br>r: <strong>{:.3f}</strong>',
            kendall, correlation
        )
    metrics_summary.short_description = '지표 요약'
    
    def calculated_at_display(self, obj):
        """계산일 표시"""
        return obj.calculated_at.strftime('%m/%d %H:%M') if obj.calculated_at else '-'
    calculated_at_display.short_description = '계산일'