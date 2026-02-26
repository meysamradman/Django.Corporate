from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("real_estate", "0023_listingtype_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="has_elevator",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text="Whether the property/building has an elevator",
                verbose_name="Has Elevator",
            ),
        ),
        migrations.AddIndex(
            model_name="property",
            index=models.Index(
                condition=models.Q(("is_published", True), ("is_public", True), ("parking_spaces__gt", 0)),
                fields=["city", "-created_at"],
                name="idx_public_has_parking",
            ),
        ),
        migrations.AddIndex(
            model_name="property",
            index=models.Index(
                condition=models.Q(("is_published", True), ("is_public", True), ("storage_rooms__gt", 0)),
                fields=["city", "-created_at"],
                name="idx_public_has_storage",
            ),
        ),
        migrations.AddIndex(
            model_name="property",
            index=models.Index(
                condition=models.Q(("is_published", True), ("is_public", True), ("has_elevator", True)),
                fields=["city", "-created_at"],
                name="idx_public_has_elevator",
            ),
        ),
    ]
