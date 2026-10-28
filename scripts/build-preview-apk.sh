#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Expo identity:"
eas whoami

echo ""
echo "==> Starting Android PREVIEW APK build..."
echo "    owner=vikramsahrawat09s-team projectId=0350eea9-fe5d-4623-b7bd-3d3ddf1ad568"
eas build --platform android --profile preview

echo ""
echo "==> Watch progress:"
echo "    https://expo.dev/accounts/vikramsahrawat09s-team/projects/bajriwala/builds"
