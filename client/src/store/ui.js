import { create } from 'zustand'

let toastCounter = 0

export const useUiStore = create((set) => ({
  settingsOpen: false,
  mobileMoreOpen: false,
  mobileMenuOpen: false,
  toasts: [],
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openMobileMore: () => set({ mobileMoreOpen: true }),
  closeMobileMore: () => set({ mobileMoreOpen: false }),
  toggleMobileMore: () => set((state) => ({ mobileMoreOpen: !state.mobileMoreOpen })),
  setMobileMoreOpen: (mobileMoreOpen) => set({ mobileMoreOpen }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  pushToast: (message, type = 'success') => {
    toastCounter += 1
    const id = `toast-${Date.now()}-${toastCounter}`
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    return id
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
