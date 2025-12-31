#!/bin/sh

# Start backend in background
cd /app && node server.js &

# Start Nginx in foreground
exec nginx -g 'daemon off;'

