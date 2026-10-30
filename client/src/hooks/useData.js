import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getArticle,
  getCompetitionData,
  getCompetitions,
  getFavouritesData,
  getHeadToHead,
  getLiveMatches,
  getMatch,
  getMatches,
  getNews,
  getPlayer,
  getPlayers,
  getStandings,
  getTeamDetail,
  getTeams,
  getTopScorers,
  searchAll,
} from '../services/api'
import { siteConfig } from '../config'

export const queryKeys = {
  matches: (filters = {}) => ['matches', filters],
  live: () => ['matches', 'live'],
  match: (id) => ['match', id],
  headToHead: (teamAId, teamBId) => ['head-to-head', teamAId, teamBId],
  competitions: () => ['competitions'],
  competitionData: (id) => ['competition', id],
  standings: (competitionId) => ['standings', competitionId],
  topScorers: (competitionId, limit) => ['top-scorers', competitionId, limit],
  teams: (filters = {}) => ['teams', filters],
  team: (id) => ['team', id],
  players: (filters = {}) => ['players', filters],
  player: (id) => ['player', id],
  news: (filters = {}) => ['news', filters],
  article: (slug) => ['article', slug],
  search: (query) => ['search', query],
  favourites: (teamIds, playerIds) => ['favourites', teamIds, playerIds],
}

export function useMatches(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.matches(filters),
    queryFn: () => getMatches(filters),
    placeholderData: keepPreviousData,
    ...options,
  })
}

export function useLiveMatches(options = {}) {
  return useQuery({
    queryKey: queryKeys.live(),
    queryFn: getLiveMatches,
    refetchInterval: siteConfig.livePollingMs,
    ...options,
  })
}

export function useMatch(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.match(id),
    queryFn: () => getMatch(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'LIVE' || status === 'HT' ? siteConfig.livePollingMs : false
    },
    ...options,
  })
}

export function useHeadToHead(teamAId, teamBId, options = {}) {
  return useQuery({
    queryKey: queryKeys.headToHead(teamAId, teamBId),
    queryFn: () => getHeadToHead(teamAId, teamBId),
    enabled: Boolean(teamAId && teamBId),
    ...options,
  })
}

export function useCompetitions(options = {}) {
  return useQuery({
    queryKey: queryKeys.competitions(),
    queryFn: getCompetitions,
    ...options,
  })
}

export function useCompetitionData(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.competitionData(id),
    queryFn: () => getCompetitionData(id),
    enabled: Boolean(id),
    refetchInterval: siteConfig.livePollingMs,
    ...options,
  })
}

export function useStandings(competitionId = 'rwanda-premier-league', options = {}) {
  return useQuery({
    queryKey: queryKeys.standings(competitionId),
    queryFn: () => getStandings(competitionId),
    refetchInterval: siteConfig.livePollingMs,
    ...options,
  })
}

export function useTopScorers(competitionId = 'rwanda-premier-league', limit = 10, options = {}) {
  return useQuery({
    queryKey: queryKeys.topScorers(competitionId, limit),
    queryFn: () => getTopScorers(competitionId, limit),
    refetchInterval: siteConfig.livePollingMs,
    ...options,
  })
}

export function useTeams(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.teams(filters),
    queryFn: () => getTeams(filters),
    placeholderData: keepPreviousData,
    ...options,
  })
}

export function useTeamDetail(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.team(id),
    queryFn: () => getTeamDetail(id),
    enabled: Boolean(id),
    ...options,
  })
}

export function usePlayers(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.players(filters),
    queryFn: () => getPlayers(filters),
    placeholderData: keepPreviousData,
    ...options,
  })
}

export function useAllPlayers(filters = {}, options = {}) {
  return useQuery({
    queryKey: ['players', 'all', filters],
    queryFn: async () => {
      const firstPage = await getPlayers({ ...filters, page: 1, pageSize: 100 })
      if (firstPage.totalPages <= 1) return firstPage
      const otherPages = await Promise.all(Array.from(
        { length: firstPage.totalPages - 1 },
        (_, index) => getPlayers({ ...filters, page: index + 2, pageSize: 100 }),
      ))
      return {
        ...firstPage,
        items: [firstPage, ...otherPages].flatMap((page) => page.items || []),
        page: 1,
        pageSize: firstPage.total,
        totalPages: 1,
      }
    },
    ...options,
  })
}

export function usePlayer(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.player(id),
    queryFn: () => getPlayer(id),
    enabled: Boolean(id),
    ...options,
  })
}

export function useNews(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.news(filters),
    queryFn: () => getNews(filters),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
    ...options,
  })
}

export function useArticle(slug, options = {}) {
  return useQuery({
    queryKey: queryKeys.article(slug),
    queryFn: () => getArticle(slug),
    enabled: Boolean(slug),
    refetchInterval: 60000,
    ...options,
  })
}

export function useSearch(query, options = {}) {
  const normalized = query.trim()
  return useQuery({
    queryKey: queryKeys.search(normalized),
    queryFn: () => searchAll(normalized),
    enabled: normalized.length >= 2,
    ...options,
  })
}

export function useFavouritesData(teamIds = [], playerIds = [], options = {}) {
  const sortedTeams = [...teamIds].sort()
  const sortedPlayers = [...playerIds].sort()
  return useQuery({
    queryKey: queryKeys.favourites(sortedTeams, sortedPlayers),
    queryFn: () => getFavouritesData({ teamIds: sortedTeams, playerIds: sortedPlayers }),
    ...options,
  })
}
