"""
URLs for Export API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.ExportTemplateViewSet, basename='export-template')
router.register(r'history', views.ExportHistoryViewSet, basename='export-history')
router.register(r'schedules', views.ReportScheduleViewSet, basename='report-schedule')

urlpatterns = [
    path('', include(router.urls)),
    path('excel/', views.ExportDataViewSet.as_view({'get': 'excel'}), name='export-excel'),
    path('pdf/', views.ExportDataViewSet.as_view({'get': 'pdf'}), name='export-pdf'),
    path('report/', views.ExportDataViewSet.as_view({'get': 'report'}), name='export-report'),
]
