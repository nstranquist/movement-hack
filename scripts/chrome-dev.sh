#!/bin/bash
# Start Chrome with remote debugging for Claude Code DevTools MCP
# Opens your app at localhost:3001

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-dev-profile \
  http://localhost:3001 &

echo "Chrome started with remote debugging on port 9222"
echo "App: http://localhost:3001"
