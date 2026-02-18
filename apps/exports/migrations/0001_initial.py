from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ExportTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('format', models.CharField(choices=[('excel', 'Excel'), ('pdf', 'PDF'), ('word', 'Word'), ('csv', 'CSV'), ('json', 'JSON')], max_length=10)),
                ('template_type', models.CharField(choices=[('executive_summary', '경영진 요약'), ('detailed_analysis', '상세 분석'), ('comparison_report', '비교 보고서'), ('sensitivity_report', '민감도 보고서'), ('workshop_report', '워크숍 보고서')], max_length=30)),
                ('include_sections', models.JSONField(default=dict)),
                ('styling_options', models.JSONField(default=dict)),
                ('logo_url', models.URLField(blank=True)),
                ('header_text', models.CharField(blank=True, max_length=200)),
                ('footer_text', models.CharField(blank=True, max_length=200)),
                ('is_default', models.BooleanField(default=False)),
                ('is_public', models.BooleanField(default=False)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'export_templates'},
        ),
        migrations.CreateModel(
            name='ExportHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('format', models.CharField(max_length=10)),
                ('file_name', models.CharField(max_length=255)),
                ('file_path', models.CharField(blank=True, max_length=500)),
                ('file_size', models.IntegerField(blank=True, null=True)),
                ('status', models.CharField(choices=[('pending', '대기중'), ('processing', '처리중'), ('completed', '완료'), ('failed', '실패')], default='pending', max_length=20)),
                ('error_message', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('download_count', models.IntegerField(default=0)),
                ('last_downloaded_at', models.DateTimeField(blank=True, null=True)),
                ('exported_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exports', to='projects.project')),
                ('template', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='exports.exporttemplate')),
            ],
            options={'db_table': 'export_history', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='ReportSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('frequency', models.CharField(choices=[('once', '한번'), ('daily', '매일'), ('weekly', '매주'), ('monthly', '매월')], max_length=10)),
                ('next_run', models.DateTimeField()),
                ('last_run', models.DateTimeField(blank=True, null=True)),
                ('recipients', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='report_schedules', to='projects.project')),
                ('template', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='exports.exporttemplate')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'report_schedules'},
        ),
    ]
