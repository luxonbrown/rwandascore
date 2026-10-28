import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminAddMatchEvent,
  adminCreateItem,
  adminDeleteItem,
  adminDeleteMatchEvent,
  adminList,
  adminResetDemoData,
  adminUpdateItem,
  adminUpdateLiveMatch,
  getActivity,
  getAdminDashboard,
  getAdminMatchEvents,
} from '../services/api'
import { useAuthStore } from '../store/auth'

function useInvalidateAll() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries()
}

export function useAdminDashboard(options = {}) {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
    ...options,
  })
}

export function useAdminMatchEvents(matchId, options = {}) {
  return useQuery({ queryKey: ['admin', 'match-events', matchId], queryFn: () => getAdminMatchEvents(matchId), enabled: Boolean(matchId), ...options })
}

export function useAdminCollection(collection, options = {}) {
  return useQuery({
    queryKey: ['admin', collection],
    queryFn: () => adminList(collection),
    ...options,
  })
}

export function useAdminActivity(limit = 50, options = {}) {
  return useQuery({
    queryKey: ['admin', 'activity', limit],
    queryFn: () => getActivity(limit),
    ...options,
  })
}

export function useCreateAdminItem(collection) {
  const actor = useAuthStore((state) => state.user)
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (payload) => adminCreateItem(collection, payload, actor),
    onSuccess: invalidate,
  })
}

export function useUpdateAdminItem(collection) {
  const actor = useAuthStore((state) => state.user)
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, ...payload }) => adminUpdateItem(collection, id, payload, actor),
    onSuccess: invalidate,
  })
}

export function useDeleteAdminItem(collection) {
  const actor = useAuthStore((state) => state.user)
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (id) => adminDeleteItem(collection, id, actor),
    onSuccess: invalidate,
  })
}

export function useUpdateLiveMatch() {
  const actor = useAuthStore((state) => state.user)
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ matchId, updates }) => adminUpdateLiveMatch(matchId, updates, actor),
    onSuccess: invalidate,
  })
}

export function useAddMatchEvent() {
  const actor = useAuthStore((state) => state.user)
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ matchId, event }) => adminAddMatchEvent(matchId, event, actor),
    onSuccess: invalidate,
  })
}

export function useDeleteMatchEvent() {
  const actor = useAuthStore((state) => state.user)
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ matchId, index }) => adminDeleteMatchEvent(matchId, index, actor),
    onSuccess: invalidate,
  })
}

export function useResetDemoData() {
  const actor = useAuthStore((state) => state.user)
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: () => adminResetDemoData(actor),
    onSuccess: invalidate,
  })
}
