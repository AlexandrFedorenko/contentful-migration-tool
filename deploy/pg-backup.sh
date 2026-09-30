#!/bin/sh
# Nightly logical backup of the application database, keeping the last 14 days.
set -eu
while true; do
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  pg_dump --format=custom --file="/backups/db-$ts.dump" && echo "backup db-$ts.dump done"
  find /backups -name 'db-*.dump' -mtime +14 -delete
  sleep 86400
done
