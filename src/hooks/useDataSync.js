import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToDbChanges } from '../services/mockBackend'

export function useDataSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeToDbChanges(() => {
      queryClient.invalidateQueries()
    })
  }, [queryClient])
}
