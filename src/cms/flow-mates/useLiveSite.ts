import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/cms/auth/AuthProvider'
import type { LiveSiteSnapshot } from '@/cms/flow-mates/liveSite'

export function useLiveSite(origin: string) {
  const { session } = useAuth()
  const [data, setData] = useState<LiveSiteSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [speedRunning, setSpeedRunning] = useState(false)
  const [speedError, setSpeedError] = useState<string | null>(null)
  const token = session?.access_token
  const speedBusy = useRef(false)

  const refreshLive = useCallback(
    async (signal?: AbortSignal) => {
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {}
      const params = new URLSearchParams({ origin })
      const response = await fetch(`/api/site-live?${params}`, {
        signal,
        headers,
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Live health kon niet worden geladen.')
      }
      setData(payload as LiveSiteSnapshot)
      setError(null)
      return payload as LiveSiteSnapshot
    },
    [origin, token],
  )

  const runSpeedTest = useCallback(async () => {
    if (!token || speedBusy.current) return
    speedBusy.current = true
    setSpeedRunning(true)
    setSpeedError(null)
    window.sessionStorage.setItem('notype-speed-run', String(Date.now()))
    try {
      const run = await fetch('/api/site-speed', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, action: 'run', force: true }),
      })
      const payload = await run.json().catch(() => null)
      if (!run.ok) {
        throw new Error(payload?.error || 'Speedtest mislukt.')
      }
      await refreshLive()
    } catch (reason) {
      setSpeedError(
        reason instanceof Error ? reason.message : 'Speedtest mislukt.',
      )
    } finally {
      speedBusy.current = false
      setSpeedRunning(false)
    }
  }, [origin, refreshLive, token])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    void refreshLive(controller.signal)
      .then(async (snapshot) => {
        if (!snapshot.speed?.stale || !token || speedBusy.current) return
        const lastRun = Number(window.sessionStorage.getItem('notype-speed-run') || 0)
        if (Date.now() - lastRun < 6 * 60 * 60 * 1000) return
        await runSpeedTest()
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setData(null)
        setError(reason instanceof Error ? reason.message : 'Live health mislukt.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [origin, refreshLive, runSpeedTest, token])

  return { data, loading, error, speedRunning, speedError, runSpeedTest }
}
