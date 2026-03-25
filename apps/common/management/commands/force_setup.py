"""
Force database setup management command
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = 'Force complete database setup including migrations and superuser'

    def handle(self, *args, **options):
        self.stdout.write("🚀 Starting forced database setup...")
        
        try:
            # Skip if already in production with working DB
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                count = cursor.fetchone()[0]
                if count > 0:
                    self.stdout.write(self.style.SUCCESS("✅ Database already initialized"))
                    return
        except:
            pass  # Continue with setup if check fails
        
        try:
            # Test database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS("✅ Database connection successful"))
            
            # Force create tables with SQL
            self.stdout.write("🔧 Creating tables with SQL...")
            from django.conf import settings
            base_dir = settings.BASE_DIR
            sql_file_path = os.path.join(base_dir, 'create_tables.sql')
            
            if os.path.exists(sql_file_path):
                try:
                    with open(sql_file_path, 'r', encoding='utf-8') as f:
                        sql_content = f.read()
                    
                    # Split SQL commands and execute separately
                    sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
                    
                    with connection.cursor() as cursor:
                        for sql_cmd in sql_commands:
                            if sql_cmd:
                                cursor.execute(sql_cmd)
                    
                    self.stdout.write(self.style.SUCCESS("✅ Tables created with SQL"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"⚠️ SQL execution failed: {e}"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ SQL file not found at: {sql_file_path}"))
            
            # Create migrations
            self.stdout.write("📝 Creating migrations...")
            call_command('makemigrations', verbosity=1)
            self.stdout.write(self.style.SUCCESS("✅ Migrations created"))
            
            # Apply migrations
            self.stdout.write("🔄 Applying migrations...")
            call_command('migrate', verbosity=1)
            self.stdout.write(self.style.SUCCESS("✅ Migrations applied"))
            
            # Create superuser
            self.stdout.write("👤 Creating superuser...")
            User = get_user_model()
            
            if not User.objects.filter(is_superuser=True).exists():
                superuser_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
                if not superuser_password:
                    self.stdout.write(self.style.WARNING("⚠️ DJANGO_SUPERUSER_PASSWORD not set, skipping superuser creation"))
                else:
                    User.objects.create_superuser(
                        username=os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin'),
                        email=os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@ahp.com'),
                        password=superuser_password
                    )
                    self.stdout.write(self.style.SUCCESS("✅ Superuser created"))
            else:
                self.stdout.write(self.style.WARNING("ℹ️ Superuser already exists"))
                
            # Test table existence
            with connection.cursor() as cursor:
                if connection.vendor == 'postgresql':
                    cursor.execute("""
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'simple_projects'
                    """)
                else:
                    cursor.execute("""
                        SELECT name FROM sqlite_master 
                        WHERE type='table' AND name='simple_projects'
                    """)
                
                tables = cursor.fetchall()
                if tables:
                    self.stdout.write(self.style.SUCCESS("✅ simple_projects table exists"))
                else:
                    self.stdout.write(self.style.ERROR("❌ simple_projects table not found"))
            
            self.stdout.write(self.style.SUCCESS("🎉 Database setup completed successfully!"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Setup failed: {str(e)}"))
            raise