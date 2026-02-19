"""
Serializers for Workshops API
"""
from rest_framework import serializers
from .models import (
    WorkshopSession, WorkshopParticipant, RealTimeProgress,
    GroupConsensusResult, SurveyTemplate, SurveyResponse
)


class WorkshopParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkshopParticipant
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'access_token', 'invitation_sent_at']


class RealTimeProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealTimeProgress
        fields = '__all__'
        read_only_fields = ['id', 'last_updated']


class GroupConsensusResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupConsensusResult
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SurveyTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyTemplate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'usage_count', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SurveyResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyResponse
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at']


class WorkshopSessionSerializer(serializers.ModelSerializer):
    participants = WorkshopParticipantSerializer(
        many=True, read_only=True
    )
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = WorkshopSession
        fields = '__all__'
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'workshop_code',
            'started_at', 'ended_at', 'facilitator'
        ]

    def get_participant_count(self, obj):
        return obj.participants.count()


class WorkshopSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = WorkshopSession
        fields = [
            'id', 'project', 'title', 'description', 'workshop_code', 'status',
            'scheduled_at', 'started_at', 'ended_at', 'duration_minutes',
            'facilitator', 'is_anonymous', 'participant_count',
            'created_at', 'updated_at'
        ]

    def get_participant_count(self, obj):
        return obj.participants.count()