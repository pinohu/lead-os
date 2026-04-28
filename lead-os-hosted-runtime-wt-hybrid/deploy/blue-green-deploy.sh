#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Lead OS — Blue/Green Deployment Script
# Deploys new version as "green", verifies health, switches traffic, then
# optionally tears down the old "blue" deployment.
# ---------------------------------------------------------------------------
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────
NAMESPACE="${NAMESPACE:-lead-os}"
RELEASE="${RELEASE:-lead-os}"
CHART_DIR="${CHART_DIR:-deploy/kubernetes}"
VALUES_FILE="${VALUES_FILE:-deploy/kubernetes/values.yaml}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
APP_LABEL="${APP_LABEL:-lead-os}"
SERVICE_PORT="${SERVICE_PORT:-3000}"
SERVICE_TARGET_PORT="${SERVICE_TARGET_PORT:-3000}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health/deep}"
MAX_WAIT="${MAX_WAIT:-300}"          # seconds to wait for readiness
POLL_INTERVAL="${POLL_INTERVAL:-5}"  # seconds between health checks
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# ── Helpers ────────────────────────────────────────────────────────────────
log()  { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
die()  { log "FATAL: $*"; exit 1; }

current_slot() {
  local slot
  slot="$(kubectl get svc "${RELEASE}" -n "${NAMESPACE}" -o jsonpath='{.spec.selector.slot}' 2>/dev/null || true)"
  if [[ -z "${slot}" ]]; then
    echo "blue"
  else
    echo "${slot}"
  fi
}

other_slot() {
  [[ "$(current_slot)" == "blue" ]] && echo "green" || echo "blue"
}

# The Helm chart adds a slot label when --set-string slot=... is passed.
# This stable service selects app name + slot so traffic can switch across
# per-slot Helm releases without relying on their per-release instance labels.
ensure_traffic_service() {
  local slot="$1"

  if kubectl get svc "${RELEASE}" -n "${NAMESPACE}" >/dev/null 2>&1; then
    log "Reconciling stable service ${RELEASE} selector to app=${APP_LABEL},slot=${slot} ..."
    kubectl patch svc "${RELEASE}" -n "${NAMESPACE}" \
      --type='merge' \
      -p="{\"spec\":{\"selector\":{\"app.kubernetes.io/name\":\"${APP_LABEL}\",\"slot\":\"${slot}\"}}}"
    return
  fi

  log "Creating stable traffic service ${RELEASE} selecting app=${APP_LABEL},slot=${slot} ..."
  kubectl apply -n "${NAMESPACE}" -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: ${RELEASE}
  labels:
    app.kubernetes.io/name: ${APP_LABEL}
    app.kubernetes.io/managed-by: blue-green-deploy
spec:
  type: ClusterIP
  ports:
    - port: ${SERVICE_PORT}
      targetPort: ${SERVICE_TARGET_PORT}
      protocol: TCP
      name: http
  selector:
    app.kubernetes.io/name: ${APP_LABEL}
    slot: ${slot}
EOF
}

# ── Pre-flight checks ─────────────────────────────────────────────────────
command -v kubectl >/dev/null || die "kubectl not found"
command -v helm    >/dev/null || die "helm not found"

kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1 || kubectl create namespace "${NAMESPACE}"

ACTIVE_SLOT="$(current_slot)"
TARGET_SLOT="$(other_slot)"
ensure_traffic_service "${ACTIVE_SLOT}"

log "Active slot : ${ACTIVE_SLOT}"
log "Target slot : ${TARGET_SLOT}"
log "Image tag   : ${IMAGE_TAG}"

# ── Step 1: Deploy to target (green) slot ──────────────────────────────────
log "Deploying ${IMAGE_TAG} to slot=${TARGET_SLOT} ..."

helm upgrade --install "${RELEASE}-${TARGET_SLOT}" "${CHART_DIR}" \
  --namespace "${NAMESPACE}" --create-namespace \
  -f "${VALUES_FILE}" \
  --set-string image.tag="${IMAGE_TAG}" \
  --set-string nameOverride="${APP_LABEL}" \
  --set-string fullnameOverride="${RELEASE}-${TARGET_SLOT}" \
  --set-string slot="${TARGET_SLOT}" \
  --wait --timeout "${MAX_WAIT}s"

log "Helm release ${RELEASE}-${TARGET_SLOT} deployed."

# ── Step 2: Wait for readiness ─────────────────────────────────────────────
log "Waiting for readiness on slot=${TARGET_SLOT} (max ${MAX_WAIT}s) ..."

READY=false
ELAPSED=0

# Port-forward the target deployment for local health checks
TARGET_POD="$(kubectl get pods -n "${NAMESPACE}" \
  -l "app.kubernetes.io/instance=${RELEASE}-${TARGET_SLOT},slot=${TARGET_SLOT}" \
  -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"

if [[ -z "${TARGET_POD}" ]]; then
  die "No pod found for slot=${TARGET_SLOT}"
fi

kubectl port-forward -n "${NAMESPACE}" "pod/${TARGET_POD}" 3000:3000 &
PF_PID=$!
trap 'kill ${PF_PID} 2>/dev/null || true' EXIT
sleep 3

while [[ ${ELAPSED} -lt ${MAX_WAIT} ]]; do
  HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "${HEALTH_URL}" 2>/dev/null || echo "000")"
  if [[ "${HTTP_CODE}" == "200" ]]; then
    READY=true
    break
  fi
  log "  health check returned ${HTTP_CODE}, retrying in ${POLL_INTERVAL}s ..."
  sleep "${POLL_INTERVAL}"
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

kill "${PF_PID}" 2>/dev/null || true

if [[ "${READY}" != "true" ]]; then
  log "Health check failed after ${MAX_WAIT}s."
  if [[ "${ROLLBACK_ON_FAILURE}" == "true" ]]; then
    log "Rolling back — uninstalling ${RELEASE}-${TARGET_SLOT} ..."
    helm uninstall "${RELEASE}-${TARGET_SLOT}" -n "${NAMESPACE}" || true
    die "Deployment rolled back. Target slot ${TARGET_SLOT} removed."
  fi
  die "Deployment unhealthy and rollback disabled."
fi

log "Slot ${TARGET_SLOT} is healthy."

# ── Step 3: Switch traffic ─────────────────────────────────────────────────
log "Switching service selector from slot=${ACTIVE_SLOT} to slot=${TARGET_SLOT} ..."

kubectl patch svc "${RELEASE}" -n "${NAMESPACE}" \
  --type='merge' \
  -p="{\"spec\":{\"selector\":{\"app.kubernetes.io/name\":\"${APP_LABEL}\",\"slot\":\"${TARGET_SLOT}\"}}}"

log "Traffic now routed to slot=${TARGET_SLOT}."

# ── Step 4: Verify live traffic ────────────────────────────────────────────
sleep 5
LIVE_CODE="$(curl -s -o /dev/null -w '%{http_code}' "${HEALTH_URL}" 2>/dev/null || echo "000")"
if [[ "${LIVE_CODE}" != "200" ]]; then
  log "WARNING: Live health check returned ${LIVE_CODE} — reverting selector ..."
  kubectl patch svc "${RELEASE}" -n "${NAMESPACE}" \
    --type='merge' \
    -p="{\"spec\":{\"selector\":{\"app.kubernetes.io/name\":\"${APP_LABEL}\",\"slot\":\"${ACTIVE_SLOT}\"}}}"
  die "Reverted to slot=${ACTIVE_SLOT}. Investigate ${TARGET_SLOT} manually."
fi

log "Live verification passed."

# ── Step 5: Clean up old slot ──────────────────────────────────────────────
log "Scaling down old slot=${ACTIVE_SLOT} (keeping release for quick rollback) ..."
kubectl scale deployment "${RELEASE}-${ACTIVE_SLOT}" \
  -n "${NAMESPACE}" --replicas=0 2>/dev/null || true

log "======================================"
log "Blue/green deployment complete."
log "  Active slot : ${TARGET_SLOT}"
log "  Image tag   : ${IMAGE_TAG}"
log "======================================"
