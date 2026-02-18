#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit

echo "Starting build process..."

# Upgrade pip and install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Checking for pre-existing tables (before migrations were added)..."
python manage.py shell -c "
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder

tables = connection.introspection.table_names()
recorder = MigrationRecorder(connection)
applied = {(m.app, m.name) for m in recorder.migration_qs}

# If survey_responses already exists but migration is not recorded,
# mark it as applied to prevent CreateModel conflict
if 'survey_responses' in tables and ('workshops', '0001_initial') not in applied:
    recorder.record_applied('workshops', '0001_initial')
    print('INFO: Marked workshops.0001_initial as applied (tables already exist in DB)')

# Same check for exports
if 'export_templates' in tables and ('exports', '0001_initial') not in applied:
    recorder.record_applied('exports', '0001_initial')
    print('INFO: Marked exports.0001_initial as applied (tables already exist in DB)')
"

echo "Running database migrations..."
python manage.py migrate --no-input

echo "Build completed successfully!"
