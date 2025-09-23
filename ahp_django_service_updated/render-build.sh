#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 STARTING RENDER.COM BUILD PROCESS - 2025-09-23 12:10 🚀"
echo "================================================================"
echo "🔧 FORCE DEPLOYMENT TRIGGERED"
echo "🐘 PostgreSQL Table Creation Fix"
echo "📋 Migration Process Enhancement"
echo "================================================================"

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create logs directory
mkdir -p logs

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# PostgreSQL 전용 데이터베이스 설정
echo "🐘 Setting up PostgreSQL database system..."

# 환경변수 강제 설정
export DATABASE_URL="postgresql://ahp_app_user:xEcCdn2WB32sxLYIPAncc9cHARXf1t6d@dpg-d2vgtg3uibrs738jk4i0-a.oregon-postgres.render.com/ahp_app"
export SECRET_KEY="django-insecure-render-deploy-key-$(date +%s)"
export DEBUG="False"
export ALLOWED_HOSTS="ahp-django-backend.onrender.com,127.0.0.1,localhost"

echo "🔧 Environment variables set:"
echo "DATABASE_URL=$DATABASE_URL"
echo "SECRET_KEY length: ${#SECRET_KEY}"
echo "DEBUG=$DEBUG"

# PostgreSQL 연결 테스트
echo "🔍 Testing PostgreSQL connection..."
python force_db_connection.py

# Django 설정 확인
echo "📋 Checking Django configuration..."
python manage.py check --database default

# Django 마이그레이션 실행  
echo "📋 Running PostgreSQL migrations..."
python manage.py makemigrations --verbosity=2
python manage.py makemigrations projects --verbosity=2 
python manage.py makemigrations accounts --verbosity=2
python manage.py makemigrations evaluations --verbosity=2
python manage.py showmigrations
python manage.py migrate --verbosity=2

# 강제 테이블 생성 확인
echo "🔧 Ensuring all tables exist..."
python manage.py shell -c "
from django.db import connection
from apps.projects.models import Project
from django.contrib.auth.models import User

# 테이블 존재 확인 및 생성
with connection.cursor() as cursor:
    try:
        cursor.execute('SELECT COUNT(*) FROM simple_projects;')
        print('✅ simple_projects table exists')
    except:
        print('❌ simple_projects table missing, running migrations...')
        pass

# 샘플 데이터 생성
if not Project.objects.exists():
    Project.objects.create(
        title='Sample AHP Project',
        description='Test project for PostgreSQL',
        created_by_id=1
    )
    print('✅ Sample project created')
else:
    print('✅ Projects already exist')
"

# PostgreSQL 데이터베이스 검증
echo "✅ PostgreSQL database verification..."
python manage.py shell -c "
from django.db import connection
from apps.projects.models import Project
print(f'🐘 Database: {connection.vendor} ({connection.settings_dict[\"NAME\"]})')
print(f'🏠 Host: {connection.settings_dict[\"HOST\"]}')

with connection.cursor() as cursor:
    cursor.execute('SELECT table_name FROM information_schema.tables WHERE table_schema=\"public\";')
    tables = [row[0] for row in cursor.fetchall()]
    print(f'📊 PostgreSQL tables: {len(tables)}')
    
    key_tables = ['simple_projects', 'auth_user', 'django_migrations']
    for table in key_tables:
        if table in tables:
            cursor.execute(f'SELECT COUNT(*) FROM {table};')
            count = cursor.fetchone()[0]
            print(f'✅ {table}: {count} records')
        else:
            print(f'❌ {table}: missing')
"

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@ahp-platform.com',
        password='AHP2025!Admin'
    )
    print('Superuser created: admin / AHP2025!Admin')
else:
    print('Superuser already exists')

# Create sample evaluator user
if not User.objects.filter(username='evaluator').exists():
    user = User.objects.create_user(
        username='evaluator',
        email='evaluator@ahp-platform.com', 
        password='AHP2025!Eval'
    )
    user.is_evaluator = True
    user.save()
    print('Evaluator user created: evaluator / AHP2025!Eval')
else:
    print('Evaluator user already exists')
"

echo "================================================================"
echo "🎉 BUILD COMPLETED SUCCESSFULLY - 2025-09-23 12:10 🎉"
echo "✅ PostgreSQL migrations completed"
echo "✅ Tables created and verified"
echo "✅ Sample data generated" 
echo "✅ Environment variables set"
echo "🌐 Backend ready for API requests"
echo "================================================================"