import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { siteConfig } from '../config'
import { isMockMode } from '../services/api'
import { subscribeToDbChanges } from '../services/mockBackend'

export function useDataSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const publicQueryRoots = new Set([
      'matches', 'match', 'competition', 'standings', 'top-scorers',
      'teams', 'team', 'players', 'player', 'news', 'article',
    ])
    const refreshPublicData = () => queryClient.invalidateQueries({
      predicate: (query) => publicQueryRoots.has(query.queryKey[0]),
    })
    const unsubscribeDb = subscribeToDbChanges(() => {
      queryClient.invalidateQueries()
    })

    if (isMockMode || !siteConfig.enableWebSocket || typeof WebSocket === 'undefined') {
      return unsubscribeDb
    }

    let closed = false
    let socket
    let reconnectTimer
    let retryMs = 1000

    const connect = () => {
      if (closed) return
      socket = new WebSocket(siteConfig.websocketUrl)
      socket.onopen = () => {
        retryMs = 1000
        refreshPublicData()
      }
      socket.onmessage = ({ data }) => {
        try {
          const message = JSON.parse(data)
          if (['match:update', 'match:event', 'match:removed', 'standings:update', 'news:published'].includes(message.type)) {
            refreshPublicData()
          }
        } catch {
          // Ignore malformed messages and keep the live connection available.
        }
      }
      socket.onclose = () => {
        if (closed) return
        reconnectTimer = window.setTimeout(connect, retryMs)
        retryMs = Math.min(retryMs * 2, 30_000)
      }
      socket.onerror = () => socket.close()
    }

    connect()
    return () => {
      closed = true
      window.clearTimeout(reconnectTimer)
      socket?.close()
      unsubscribeDb()
    }
  }, [queryClient])
}
