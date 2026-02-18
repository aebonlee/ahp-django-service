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

echo "Running database migrations..."
python manage.py migrate --fake-initial --no-input

echo "Build completed successfully!"