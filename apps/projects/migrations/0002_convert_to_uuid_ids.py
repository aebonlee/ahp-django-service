# Generated to convert Criteria and ProjectMember models to use UUID primary keys

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        # Convert Criteria model to use UUID
        migrations.AlterField(
            model_name='criteria',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        
        # Convert ProjectMember model to use UUID
        migrations.AlterField(
            model_name='projectmember',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        
        # Also convert ProjectTemplate to UUID for consistency
        migrations.AlterField(
            model_name='projecttemplate',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]