import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateManagedMatchLineup } from '../services/api'

export function useUpdateManagedMatchLineup() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ matchId, version, lineup }) => updateManagedMatchLineup(matchId, version, lineup),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['manager', 'matches'] })
      client.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}
