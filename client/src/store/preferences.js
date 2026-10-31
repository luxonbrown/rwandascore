import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LANGUAGE, isLanguage } from '../i18n'

function toggleInList(list, id) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

export const usePreferencesStore = create(
  persist(
    (set, get) => ({
      language: DEFAULT_LANGUAGE,
      soundEnabled: false,
      crowdSoundEnabled: true,
      favouriteTeams: [],
      favouritePlayers: [],
      setLanguage: (language) => {
        if (isLanguage(language)) set({ language })
      },
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setCrowdSoundEnabled: (crowdSoundEnabled) => set({ crowdSoundEnabled }),
      toggleCrowdSound: () => set((state) => ({ crowdSoundEnabled: !state.crowdSoundEnabled })),
      toggleFavouriteTeam: (teamId) =>
        set((state) => ({ favouriteTeams: toggleInList(state.favouriteTeams, teamId) })),
      toggleFavouritePlayer: (playerId) =>
        set((state) => ({ favouritePlayers: toggleInList(state.favouritePlayers, playerId) })),
      isTeamFavourite: (teamId) => get().favouriteTeams.includes(teamId),
      isPlayerFavourite: (playerId) => get().favouritePlayers.includes(playerId),
      clearFavourites: () => set({ favouriteTeams: [], favouritePlayers: [] }),
    }),
    {
      name: 'rwandascore_preferences_v1',
      partialize: ({ language, soundEnabled, crowdSoundEnabled, favouriteTeams, favouritePlayers }) => ({
        language,
        soundEnabled,
        crowdSoundEnabled,
        favouriteTeams,
        favouritePlayers,
      }),
    },
  ),
)
