# Generated manually for evaluator assignment system
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('evaluations', '0001_initial'),
        ('projects', '0001_initial'),
    ]

    operations = [
        # Add metadata field to EvaluationInvitation
        migrations.AddField(
            model_name='evaluationinvitation',
            name='metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        
        # Add indexes to EvaluationInvitation
        migrations.AddIndex(
            model_name='evaluationinvitation',
            index=models.Index(fields=['token'], name='evaluation__token_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='evaluationinvitation',
            index=models.Index(fields=['project', 'status'], name='evaluation__project_status_idx'),
        ),
        migrations.AddIndex(
            model_name='evaluationinvitation',
            index=models.Index(fields=['expires_at'], name='evaluation__expires_idx'),
        ),
        
        # Create BulkInvitation model
        migrations.CreateModel(
            name='BulkInvitation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('total_count', models.IntegerField(default=0)),
                ('sent_count', models.IntegerField(default=0)),
                ('failed_count', models.IntegerField(default=0)),
                ('accepted_count', models.IntegerField(default=0)),
                ('status', models.CharField(choices=[('pending', '대기중'), ('processing', '처리중'), ('completed', '완료'), ('failed', '실패')], default='pending', max_length=20)),
                ('celery_task_id', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('results', models.JSONField(default=dict)),
                ('error_log', models.TextField(blank=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bulk_invitations_created', to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bulk_invitations', to='projects.project')),
            ],
            options={
                'db_table': 'bulk_invitations',
                'ordering': ['-created_at'],
            },
        ),
        
        # Create EvaluationTemplate model
        migrations.CreateModel(
            name='EvaluationTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('instructions', models.TextField()),
                ('email_subject', models.CharField(default='AHP 평가 요청', max_length=200)),
                ('email_body', models.TextField()),
                ('reminder_subject', models.CharField(blank=True, max_length=200)),
                ('reminder_body', models.TextField(blank=True)),
                ('auto_reminder', models.BooleanField(default=True)),
                ('reminder_days', models.IntegerField(default=3)),
                ('expiry_days', models.IntegerField(default=30)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_default', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='evaluation_templates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'evaluation_templates',
                'ordering': ['name'],
            },
        ),
        
        # Create EvaluationAccessLog model
        migrations.CreateModel(
            name='EvaluationAccessLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('session_started', '세션 시작'), ('comparison_saved', '비교 저장'), ('evaluation_completed', '평가 완료'), ('token_validated', '토큰 검증'), ('access_denied', '접근 거부')], max_length=50)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('metadata', models.JSONField(default=dict)),
                ('evaluation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='access_logs', to='evaluations.evaluation')),
            ],
            options={
                'db_table': 'evaluation_access_logs',
                'ordering': ['-timestamp'],
            },
        ),
        
        # Add indexes to EvaluationAccessLog
        migrations.AddIndex(
            model_name='evaluationaccesslog',
            index=models.Index(fields=['evaluation', 'timestamp'], name='eval_access_eval_time_idx'),
        ),
        migrations.AddIndex(
            model_name='evaluationaccesslog',
            index=models.Index(fields=['action'], name='eval_access_action_idx'),
        ),
        
        # Create EmailDeliveryStatus model
        migrations.CreateModel(
            name='EmailDeliveryStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', '대기중'), ('sent', '발송됨'), ('delivered', '전달됨'), ('opened', '열람됨'), ('clicked', '클릭됨'), ('bounced', '반송됨'), ('failed', '실패')], default='pending', max_length=20)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('delivered_at', models.DateTimeField(blank=True, null=True)),
                ('opened_at', models.DateTimeField(blank=True, null=True)),
                ('clicked_at', models.DateTimeField(blank=True, null=True)),
                ('error_message', models.TextField(blank=True)),
                ('retry_count', models.IntegerField(default=0)),
                ('metadata', models.JSONField(default=dict)),
                ('bulk_invitation', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='email_statuses', to='evaluations.bulkinvitation')),
                ('invitation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='email_status', to='evaluations.evaluationinvitation')),
            ],
            options={
                'db_table': 'email_delivery_status',
                'ordering': ['-sent_at'],
            },
        ),
    ]