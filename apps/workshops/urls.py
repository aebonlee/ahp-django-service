"""
URLs for Workshops API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.WorkshopSessionViewSet, basename='workshop-session')
router.register(r'participants', views.WorkshopParticipantViewSet, basename='workshop-participant')
router.register(r'progress', views.RealTimeProgressViewSet, basename='realtime-progress')
router.register(r'consensus', views.GroupConsensusResultViewSet, basename='group-consensus')
router.register(r'survey-templates', views.SurveyTemplateViewSet, basename='survey-template')
router.register(r'survey-responses', views.SurveyResponseViewSet, basename='survey-response')

urlpatterns = [
    path('', include(router.urls)),
]
