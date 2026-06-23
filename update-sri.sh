#!/bin/bash
# Berechnet den SRI-Hash für ars_data.js und aktualisiert index.html.
# Ausführen wenn ars_data.js auf dem CDN aktualisiert wurde.
set -e

HASH=$(curl -sL https://cdn.ragsource.ai/ars_data.js | openssl dgst -sha384 -binary | base64 -w 0)
SRI="sha384-${HASH}"

sed -i "s|const ARS_DATA_INTEGRITY = 'sha384-[^']*';|const ARS_DATA_INTEGRITY = '${SRI}';|" index.html

echo "SRI aktualisiert: ${SRI}"
