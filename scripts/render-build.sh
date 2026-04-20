#!/usr/bin/env bash
set -euxo pipefail

cd backend
npm install --include=dev

cd ../frontend
npm install --include=dev
npm run build
