from django.core.management.base import BaseCommand
from django.db import connection

from src.real_estate.models.property import Property
from src.real_estate.services.admin.property_geo_services import PropertyGeoService


class Command(BaseCommand):
    help = "Setup optional PostGIS optimizations for real estate geo queries (location_point + GIST index)."

    def handle(self, *args, **options):
        table_name = Property._meta.db_table
        quoted_table = connection.ops.quote_name(table_name)

        with connection.cursor() as cursor:
            cursor.execute("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')")
            has_postgis = bool(cursor.fetchone()[0])

            if not has_postgis:
                self.stdout.write(self.style.ERROR("PostGIS extension is not enabled on this database."))
                self.stdout.write("Run: CREATE EXTENSION IF NOT EXISTS postgis;")
                return

            self.stdout.write(self.style.SUCCESS("PostGIS extension is enabled."))

            cursor.execute(
                f"""
                ALTER TABLE {quoted_table}
                ADD COLUMN IF NOT EXISTS location_point geometry(Point, 4326)
                GENERATED ALWAYS AS (
                    CASE
                        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
                        THEN ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
                        ELSE NULL
                    END
                ) STORED
                """
            )
            self.stdout.write(self.style.SUCCESS("location_point column is ready."))

            cursor.execute(
                f"""
                CREATE INDEX IF NOT EXISTS idx_{table_name}_location_point_gist
                ON {quoted_table}
                USING GIST (location_point)
                """
            )
            self.stdout.write(self.style.SUCCESS("GIST index on location_point is ready."))

        PropertyGeoService._postgis_available = None
        PropertyGeoService._location_point_available = None

        self.stdout.write(self.style.SUCCESS("PostGIS geo optimization setup completed."))
        self.stdout.write(f"Engine status: {PropertyGeoService.engine_status()}")
