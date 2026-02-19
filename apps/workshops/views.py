"""
Workshop API Views
"""
import secrets
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    WorkshopSession, WorkshopParticipant, RealTimeProgress,
    GroupConsensusResult, SurveyTemplate, SurveyResponse
)
from .serializers import (
    WorkshopSessionSerializer, WorkshopSessionListSerializer,
    WorkshopParticipantSerializer, RealTimeProgressSerializer,
    GroupConsensusResultSerializer, SurveyTemplateSerializer,
    SurveyResponseSerializer
)

class WorkshopSessionViewSet(viewsets.ModelViewSet):
    """워크숍 세션 관리"""
    filterset_fields = ['project', 'status', 'facilitator']

    def get_permissions(self):
        # join 액션은 워크숍 코드를 가진 외부 참여자도 접근 가능
        if self.action == 'join':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkshopSessionListSerializer
        return WorkshopSessionSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return WorkshopSession.objects.none()
        return WorkshopSession.objects.filter(
            facilitator=self.request.user
        ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """워크숍 시작"""
        workshop = self.get_object()
        if workshop.status != 'preparation':
            return Response(
                {'error': f'준비 상태의 워크숍만 시작할 수 있습니다. 현재 상태: {workshop.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        workshop.status = 'in_progress'
        workshop.started_at = timezone.now()
        workshop.save()
        return Response(WorkshopSessionSerializer(workshop).data)
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """워크숍 완료"""
        workshop = self.get_object()
        if workshop.status != 'in_progress':
            return Response(
                {'error': '진행 중인 워크숍만 완료할 수 있습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        workshop.status = 'completed'
        workshop.ended_at = timezone.now()
        if workshop.started_at:
            delta = workshop.ended_at - workshop.started_at
            workshop.duration_minutes = int(delta.total_seconds() / 60)
        workshop.save()
        return Response(WorkshopSessionSerializer(workshop).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """워크숍 취소"""
        workshop = self.get_object()
        if workshop.status in ('completed', 'cancelled'):
            return Response(
                {'error': '이미 완료되거나 취소된 워크숍입니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        workshop.status = 'cancelled'
        workshop.save()
        return Response(WorkshopSessionSerializer(workshop).data)
    @action(detail=False, methods=['post'])
    def join(self, request):
        """워크숍 코드로 참여"""
        code = request.data.get('workshop_code', '').upper()
        if not code:
            return Response({'error': '워크숍 코드가 필요합니다.'}, status=400)

        try:
            workshop = WorkshopSession.objects.get(workshop_code=code)
        except WorkshopSession.DoesNotExist:
            return Response({'error': '유효하지 않은 워크숍 코드입니다.'}, status=404)

        if workshop.status not in ('preparation', 'in_progress'):
            return Response({'error': '참여 불가능한 워크숍입니다.'}, status=400)

        return Response({
            'workshop': WorkshopSessionSerializer(workshop).data,
            'message': '워크숍에 참여했습니다.'
        })
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """워크숍 참여자 목록"""
        workshop = self.get_object()
        participants = WorkshopParticipant.objects.filter(workshop=workshop)
        return Response(WorkshopParticipantSerializer(participants, many=True).data)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """워크숍 전체 진행 현황"""
        workshop = self.get_object()
        progress_qs = RealTimeProgress.objects.filter(workshop=workshop)
        return Response({
            'workshop_id': str(workshop.id),
            'workshop_status': workshop.status,
            'total_participants': WorkshopParticipant.objects.filter(
                workshop=workshop, role='evaluator'
            ).count(),
            'active_participants': progress_qs.filter(is_active=True).count(),
            'completed_participants': WorkshopParticipant.objects.filter(
                workshop=workshop, status='completed'
            ).count(),
            'progress': RealTimeProgressSerializer(progress_qs, many=True).data
        })

class WorkshopParticipantViewSet(viewsets.ModelViewSet):
    """워크숍 참여자 관리"""
    serializer_class = WorkshopParticipantSerializer
    filterset_fields = ['workshop', 'role', 'status']

    def get_permissions(self):
        # by_token 액션은 액세스 토큰을 가진 외부 참여자도 접근 가능
        if self.action == 'by_token':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return WorkshopParticipant.objects.none()
        return WorkshopParticipant.objects.filter(
            workshop__facilitator=self.request.user
        ).order_by('created_at')

    @action(detail=False, methods=['get'])
    def by_token(self, request):
        """액세스 토큰으로 참여자 조회"""
        token = request.query_params.get('token')
        if not token:
            return Response({'error': '토큰이 필요합니다.'}, status=400)
        try:
            participant = WorkshopParticipant.objects.get(access_token=token)
            return Response(WorkshopParticipantSerializer(participant).data)
        except WorkshopParticipant.DoesNotExist:
            return Response({'error': '유효하지 않은 토큰입니다.'}, status=404)

class RealTimeProgressViewSet(viewsets.ModelViewSet):
    """실시간 진행 현황"""
    serializer_class = RealTimeProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['workshop', 'is_active']

    def get_queryset(self):
        return RealTimeProgress.objects.filter(
            workshop__facilitator=self.request.user
        ).order_by('-last_updated')


class GroupConsensusResultViewSet(viewsets.ReadOnlyModelViewSet):
    """그룹 합의 결과 (읽기 전용)"""
    serializer_class = GroupConsensusResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['workshop']

    def get_queryset(self):
        return GroupConsensusResult.objects.filter(
            workshop__facilitator=self.request.user
        ).order_by('-created_at')


class SurveyTemplateViewSet(viewsets.ModelViewSet):
    """설문 템플릿 관리"""
    serializer_class = SurveyTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['type', 'is_active']

    def get_queryset(self):
        return SurveyTemplate.objects.filter(is_active=True).order_by('-created_at')


class SurveyResponseViewSet(viewsets.ModelViewSet):
    """설문 응답 관리"""
    serializer_class = SurveyResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['workshop', 'participant', 'template']

    def get_queryset(self):
        return SurveyResponse.objects.filter(
            workshop__facilitator=self.request.user
        ).order_by('-submitted_at')
