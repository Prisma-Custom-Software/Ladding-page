#!/usr/bin/env bash
# Ensures the shared Vite dev server is running on http://localhost:5173 (one instance for all agents).
# Safe to call concurrently. Logs: tools/visual/dev-server.log
cd "$(dirname "$0")/../.." || exit 1
up() { curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/ | grep -q 200; }
if up; then echo "dev server: up"; exit 0; fi
exec 9>tools/visual/.dev.lock
flock 9
if up; then echo "dev server: up"; exit 0; fi
[ -d node_modules ] || { echo "node_modules missing: run npm install first"; exit 1; }
nohup npx vite --port 5173 --strictPort --host 127.0.0.1 > tools/visual/dev-server.log 2>&1 &
for i in $(seq 1 60); do up && { echo "dev server: started"; exit 0; }; sleep 1; done
echo "dev server failed to start; see tools/visual/dev-server.log"; tail -20 tools/visual/dev-server.log; exit 1
