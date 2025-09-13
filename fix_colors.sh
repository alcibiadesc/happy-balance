#!/bin/sh

# Fix dashboard colors
sed -i \
  -e 's/text-green-600/status-success/g' \
  -e 's/text-red-600/status-error/g' \
  -e 's/text-blue-600/status-info/g' \
  -e 's/text-green-800/status-success-text/g' \
  -e 's/text-red-800/status-error-text/g' \
  -e 's/text-blue-800/status-info-text/g' \
  -e 's/text-green-700/status-success-text/g' \
  -e 's/text-red-700/status-error-text/g' \
  -e 's/text-blue-700/status-info-text/g' \
  -e 's/bg-green-50/status-success-bg/g' \
  -e 's/bg-red-50/status-error-bg/g' \
  -e 's/bg-blue-50/status-info-bg/g' \
  -e 's/bg-green-100/status-success-bg/g' \
  -e 's/bg-red-100/status-error-bg/g' \
  -e 's/bg-blue-100/status-info-bg/g' \
  -e 's/border-green-100/status-success-border/g' \
  -e 's/border-red-100/status-error-border/g' \
  -e 's/border-blue-100/status-info-border/g' \
  src/routes/dashboard/+page.svelte

echo "Fixed dashboard colors"
