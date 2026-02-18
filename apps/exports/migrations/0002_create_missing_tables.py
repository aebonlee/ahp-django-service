from django.db import migrations


def create_missing_export_tables(apps, schema_editor):
    """Create any export tables that are missing from the database.

    Handles the case where 0001_initial was fake-applied (because export_templates
    already existed), but other tables were never created.
    On a fresh DB where 0001_initial ran normally, this is a no-op.
    """
    with schema_editor.connection.cursor() as cursor:
        existing_tables = {
            table.name
            for table in schema_editor.connection.introspection.get_table_list(cursor)
        }

    # Dependency order: ExportTemplate first (referenced by others)
    model_names = [
        'ExportTemplate',   # referenced by: ExportHistory, ReportSchedule
        'ExportHistory',    # depends on: ExportTemplate
        'ReportSchedule',   # depends on: ExportTemplate
    ]

    for model_name in model_names:
        model = apps.get_model('exports', model_name)
        if model._meta.db_table not in existing_tables:
            schema_editor.create_model(model)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('exports', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_missing_export_tables, noop),
    ]
