#!/usr/bin/env bash
# Rubric Flows live tracker for the cinematic-sites-v2 workflow.
# Emits progress events to the Rubric dashboard so the Flows tab animates in real time.
# Silently no-ops if the dashboard isn't running — the skill still works standalone.
#
# Usage:
#   flows-track.sh start
#   flows-track.sh step   <index> <skillId>
#   flows-track.sh action <index> "<text>"
#   flows-track.sh done   <index>
#   flows-track.sh error  <index> "<text>"
#   flows-track.sh complete
#   flows-track.sh reset

URL="${RUBRIC_URL:-http://localhost:5050}/api/workflow-events"
WF="cinematic-sites-v2"

esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

emit() {
  curl -s --max-time 2 -X POST "$URL" \
    -H 'Content-Type: application/json' \
    -d "$1" >/dev/null 2>&1 || true
}

cmd="$1"; shift 2>/dev/null || true
case "$cmd" in
  start)    emit "{\"event\":\"workflow:start\",\"workflowId\":\"$WF\"}" ;;
  step)     emit "{\"event\":\"step:start\",\"stepIndex\":${1:-0},\"skillId\":\"${2:-}\"}" ;;
  action)   emit "{\"event\":\"step:action\",\"stepIndex\":${1:-0},\"text\":\"$(esc "${2:-}")\"}" ;;
  done)     emit "{\"event\":\"step:complete\",\"stepIndex\":${1:-0}}" ;;
  error)    emit "{\"event\":\"step:error\",\"stepIndex\":${1:-0},\"text\":\"$(esc "${2:-Step failed}")\"}" ;;
  complete) emit "{\"event\":\"workflow:complete\",\"workflowId\":\"$WF\"}" ;;
  reset)    emit "{\"event\":\"workflow:reset\"}" ;;
  *) echo "usage: flows-track.sh {start|step <i> <skillId>|action <i> <text>|done <i>|error <i> <text>|complete|reset}" >&2; exit 1 ;;
esac
