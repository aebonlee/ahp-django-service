from django.db import migrations


def create_missing_workshop_tables(apps, schema_editor):
    """Create any workshop tables that are missing from the database.

    Handles the case where 0001_initial was fake-applied (because survey_responses
    already existed), but other tables like workshop_sessions were never created.
    On a fresh DB where 0001_initial ran normally, all tables exist and this is a no-op.
    """
    with schema_editor.connection.cursor() as cursor:
        existing_tables = {
            table.name
            for table in schema_editor.connection.introspection.get_table_list(cursor)
        }

    # Dependency order: parent tables before child tables
    model_names = [
        'WorkshopSession',       # referenced by: WorkshopParticipant, RealTimeProgress, GroupConsensusResult, SurveyResponse
        'SurveyTemplate',        # referenced by: SurveyResponse
        'WorkshopParticipant',   # depends on: WorkshopSession
        'RealTimeProgress',      # depends on: WorkshopParticipant, WorkshopSession
        'GroupConsensusResult',  # depends on: WorkshopSession (OneToOne)
        'SurveyResponse',        # depends on: WorkshopParticipant, SurveyTemplate, WorkshopSession
    ]

    for model_name in model_names:
        model = apps.get_model('workshops', model_name)
        if model._meta.db_table not in existing_tables:
            schema_editor.create_model(model)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('workshops', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_missing_workshop_tables, noop),
    ]
