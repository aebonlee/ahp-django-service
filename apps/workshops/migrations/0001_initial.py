from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


def create_tables_if_not_exist(apps, schema_editor):
    """Create workshop tables only if they don't already exist.
    Handles the case where tables were created before migrations were added (e.g. via syncdb).
    """
    with schema_editor.connection.cursor() as cursor:
        existing_tables = {
            table.name
            for table in schema_editor.connection.introspection.get_table_list(cursor)
        }

    # Create in dependency order: referenced models before referencing models
    model_names = [
        'WorkshopSession',      # depends on: AUTH_USER_MODEL, Project
        'SurveyTemplate',       # depends on: AUTH_USER_MODEL
        'WorkshopParticipant',  # depends on: AUTH_USER_MODEL, WorkshopSession
        'RealTimeProgress',     # depends on: WorkshopParticipant, WorkshopSession
        'GroupConsensusResult', # depends on: WorkshopSession
        'SurveyResponse',       # depends on: WorkshopParticipant, SurveyTemplate, WorkshopSession
    ]

    for model_name in model_names:
        model = apps.get_model('workshops', model_name)
        if model._meta.db_table not in existing_tables:
            schema_editor.create_model(model)


def drop_tables(apps, schema_editor):
    """Reverse migration: drop workshop tables in reverse dependency order."""
    model_names = [
        'SurveyResponse',
        'GroupConsensusResult',
        'RealTimeProgress',
        'WorkshopParticipant',
        'SurveyTemplate',
        'WorkshopSession',
    ]
    for model_name in model_names:
        model = apps.get_model('workshops', model_name)
        schema_editor.delete_model(model)


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(create_tables_if_not_exist, drop_tables),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='WorkshopSession',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('title', models.CharField(max_length=200)),
                        ('description', models.TextField()),
                        ('max_participants', models.IntegerField(default=30)),
                        ('workshop_code', models.CharField(max_length=10, unique=True)),
                        ('scheduled_at', models.DateTimeField()),
                        ('started_at', models.DateTimeField(blank=True, null=True)),
                        ('ended_at', models.DateTimeField(blank=True, null=True)),
                        ('duration_minutes', models.IntegerField(default=120)),
                        ('status', models.CharField(choices=[('preparation', '준비중'), ('in_progress', '진행중'), ('analyzing', '분석중'), ('completed', '완료'), ('cancelled', '취소')], default='preparation', max_length=20)),
                        ('is_anonymous', models.BooleanField(default=False)),
                        ('allow_late_join', models.BooleanField(default=True)),
                        ('consensus_method', models.CharField(default='geometric_mean', max_length=50)),
                        ('consensus_achieved', models.BooleanField(default=False)),
                        ('meeting_minutes', models.TextField(blank=True)),
                        ('recording_url', models.URLField(blank=True)),
                        ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('facilitator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='facilitated_workshops', to=settings.AUTH_USER_MODEL)),
                        ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workshops', to='projects.project')),
                    ],
                    options={'db_table': 'workshop_sessions', 'ordering': ['-scheduled_at']},
                ),
                migrations.CreateModel(
                    name='SurveyTemplate',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('name', models.CharField(max_length=200)),
                        ('description', models.TextField()),
                        ('type', models.CharField(choices=[('demographic', '인구통계'), ('pre_evaluation', '사전평가'), ('post_evaluation', '사후평가'), ('custom', '사용자정의')], max_length=20)),
                        ('questions', models.JSONField()),
                        ('settings', models.JSONField(default=dict)),
                        ('is_active', models.BooleanField(default=True)),
                        ('usage_count', models.IntegerField(default=0)),
                        ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                        ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'db_table': 'survey_templates'},
                ),
                migrations.CreateModel(
                    name='WorkshopParticipant',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('email', models.EmailField(max_length=254)),
                        ('name', models.CharField(max_length=100)),
                        ('organization', models.CharField(blank=True, max_length=200)),
                        ('department', models.CharField(blank=True, max_length=100)),
                        ('role', models.CharField(choices=[('evaluator', '평가자'), ('observer', '관찰자'), ('facilitator', '진행자')], default='evaluator', max_length=20)),
                        ('status', models.CharField(choices=[('invited', '초대됨'), ('registered', '등록됨'), ('active', '참여중'), ('completed', '완료'), ('absent', '불참')], default='invited', max_length=20)),
                        ('joined_at', models.DateTimeField(blank=True, null=True)),
                        ('left_at', models.DateTimeField(blank=True, null=True)),
                        ('completion_rate', models.FloatField(default=0.0)),
                        ('last_activity', models.DateTimeField(blank=True, null=True)),
                        ('access_token', models.UUIDField(default=uuid.uuid4, unique=True)),
                        ('invitation_sent_at', models.DateTimeField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                        ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                        ('workshop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participants', to='workshops.workshopsession')),
                    ],
                    options={'db_table': 'workshop_participants', 'unique_together': {('workshop', 'email')}},
                ),
                migrations.CreateModel(
                    name='RealTimeProgress',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('current_comparison', models.CharField(max_length=200)),
                        ('comparisons_completed', models.IntegerField(default=0)),
                        ('total_comparisons', models.IntegerField()),
                        ('started_at', models.DateTimeField(default=django.utils.timezone.now)),
                        ('last_updated', models.DateTimeField(auto_now=True)),
                        ('estimated_completion', models.DateTimeField(blank=True, null=True)),
                        ('is_active', models.BooleanField(default=True)),
                        ('is_stuck', models.BooleanField(default=False)),
                        ('participant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='workshops.workshopparticipant')),
                        ('workshop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progress_updates', to='workshops.workshopsession')),
                    ],
                    options={'db_table': 'realtime_progress', 'unique_together': {('workshop', 'participant')}},
                ),
                migrations.CreateModel(
                    name='GroupConsensusResult',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('kendalls_w', models.FloatField(blank=True, null=True)),
                        ('consensus_indicator', models.FloatField(blank=True, null=True)),
                        ('disagreement_index', models.FloatField(blank=True, null=True)),
                        ('aggregated_weights', models.JSONField()),
                        ('individual_weights', models.JSONField()),
                        ('mean_weights', models.JSONField()),
                        ('std_deviation', models.JSONField()),
                        ('confidence_intervals', models.JSONField()),
                        ('outlier_participants', models.JSONField(default=list)),
                        ('consensus_clusters', models.JSONField(default=dict)),
                        ('calculated_at', models.DateTimeField(default=django.utils.timezone.now)),
                        ('workshop', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='consensus_result', to='workshops.workshopsession')),
                    ],
                    options={'db_table': 'group_consensus_results'},
                ),
                migrations.CreateModel(
                    name='SurveyResponse',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('responses', models.JSONField()),
                        ('submitted_at', models.DateTimeField(default=django.utils.timezone.now)),
                        ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                        ('user_agent', models.TextField(blank=True)),
                        ('participant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='workshops.workshopparticipant')),
                        ('template', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='workshops.surveytemplate')),
                        ('workshop', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='survey_responses', to='workshops.workshopsession')),
                    ],
                    options={'db_table': 'survey_responses', 'unique_together': {('workshop', 'participant', 'template')}},
                ),
            ],
        ),
    ]
