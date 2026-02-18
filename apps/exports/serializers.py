from rest_framework import serializers
from .models import ExportTemplate, ExportHistory, ReportSchedule


class ExportTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportTemplate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ExportHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'completed_at', 'exported_by',
                           'file_size', 'status', 'error_message']

    def create(self, validated_data):
        validated_data['exported_by'] = self.context['request'].user
        return super().create(validated_data)


class ReportScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSchedule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by',
                           'last_run']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
