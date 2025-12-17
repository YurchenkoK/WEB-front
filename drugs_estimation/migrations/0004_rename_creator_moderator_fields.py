# Generated migration to rename creator to doctor and moderator to laboratory_worker

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('drugs_estimation', '0003_rename_models_to_estimation'),
    ]

    operations = [
        migrations.RenameField(
            model_name='estimationrequest',
            old_name='creator',
            new_name='doctor',
        ),
        migrations.RenameField(
            model_name='estimationrequest',
            old_name='moderator',
            new_name='laboratory_worker',
        ),
    ]
