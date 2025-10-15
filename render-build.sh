#!/usr/bin/env bash
set -o errexit

echo "=== Root-level render-build.sh script ==="
echo "Current directory: $(pwd)"
echo "Contents:"
ls -la

echo "=== Redirecting to django_backend/render-build.sh ==="
cd django_backend
chmod +x render-build.sh
./render-build.sh