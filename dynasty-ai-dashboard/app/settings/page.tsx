"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface SettingsState {
  alerts: {
    costThreshold: number
    costAlertEnabled: boolean
    serviceDownAlertEnabled: boolean
    agentInactivityThreshold: number
  }
  monitoring: {
    enableRealtime: boolean
    updateInterval: number
    retentionDays: number
    logLevel: string
  }
  agents: {
    maxConcurrent: number
    defaultModel: string
    telemetryEnabled: boolean
  }
}

export default function SettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle")

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch {
      // Failed to load
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (status === "authenticated") loadSettings()
  }, [status, router, loadSettings])

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    setSaveStatus("idle")

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      setSaveStatus(res.ok ? "saved" : "error")
    } catch {
      setSaveStatus("error")
    }
    setIsSaving(false)
    if (saveStatus !== "error") setTimeout(() => setSaveStatus("idle"), 3000)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="p-8" role="status" aria-label="Loading settings">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-800 rounded" />
          <div className="h-64 bg-gray-800 rounded-lg" />
          <div className="h-64 bg-gray-800 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Failed to load settings.</p>
      </div>
    )
  }

  return (
    <main className="p-8 max-w-3xl" role="main">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <div className="flex items-center gap-3">
          {saveStatus === "saved" && (
            <span className="text-sm text-green-400" role="status">Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-400" role="alert">Save failed</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-dynasty-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6" aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="text-lg font-semibold text-white mb-4">Alerts</h2>
        <div className="space-y-4">
          <FieldNumber
            label="Cost Threshold ($)"
            value={settings.alerts.costThreshold}
            onChange={(v) => setSettings({ ...settings, alerts: { ...settings.alerts, costThreshold: v } })}
          />
          <FieldToggle
            label="Cost Alerts Enabled"
            checked={settings.alerts.costAlertEnabled}
            onChange={(v) => setSettings({ ...settings, alerts: { ...settings.alerts, costAlertEnabled: v } })}
          />
          <FieldToggle
            label="Service Down Alerts"
            checked={settings.alerts.serviceDownAlertEnabled}
            onChange={(v) => setSettings({ ...settings, alerts: { ...settings.alerts, serviceDownAlertEnabled: v } })}
          />
        </div>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6" aria-labelledby="monitoring-heading">
        <h2 id="monitoring-heading" className="text-lg font-semibold text-white mb-4">Monitoring</h2>
        <div className="space-y-4">
          <FieldToggle
            label="Real-time Updates"
            checked={settings.monitoring.enableRealtime}
            onChange={(v) => setSettings({ ...settings, monitoring: { ...settings.monitoring, enableRealtime: v } })}
          />
          <FieldNumber
            label="Update Interval (ms)"
            value={settings.monitoring.updateInterval}
            onChange={(v) => setSettings({ ...settings, monitoring: { ...settings.monitoring, updateInterval: v } })}
          />
          <FieldNumber
            label="Retention (days)"
            value={settings.monitoring.retentionDays}
            onChange={(v) => setSettings({ ...settings, monitoring: { ...settings.monitoring, retentionDays: v } })}
          />
          <FieldSelect
            label="Log Level"
            value={settings.monitoring.logLevel}
            options={["debug", "info", "warn", "error"]}
            onChange={(v) => setSettings({ ...settings, monitoring: { ...settings.monitoring, logLevel: v } })}
          />
        </div>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6" aria-labelledby="agents-heading">
        <h2 id="agents-heading" className="text-lg font-semibold text-white mb-4">Agents</h2>
        <div className="space-y-4">
          <FieldNumber
            label="Max Concurrent"
            value={settings.agents.maxConcurrent}
            onChange={(v) => setSettings({ ...settings, agents: { ...settings.agents, maxConcurrent: v } })}
          />
          <FieldText
            label="Default Model"
            value={settings.agents.defaultModel}
            onChange={(v) => setSettings({ ...settings, agents: { ...settings.agents, defaultModel: v } })}
          />
          <FieldToggle
            label="Telemetry"
            checked={settings.agents.telemetryEnabled}
            onChange={(v) => setSettings({ ...settings, agents: { ...settings.agents, telemetryEnabled: v } })}
          />
        </div>
      </section>
    </main>
  )
}

function FieldNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
      />
    </div>
  )
}

function FieldText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-56 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
      />
    </div>
  )
}

function FieldToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-300">{label}</label>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${checked ? "bg-green-600" : "bg-gray-700"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  )
}

function FieldSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
