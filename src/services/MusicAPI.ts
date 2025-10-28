import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { spotifyApi } from "./SpotifyAPI";
import { ITrack } from "@/types";
import { getMockData, shouldUseMockData, getMockTrackById } from "@/data/mockMusicData";
import { performEnhancedSearch } from "@/utils/searchAlgorithm";

// Content strategy constants
const ADVANCED_SEARCH_STRATEGY = 'ADVANCED_SEARCH';

// Playlist ID mappings (legacy support)
const PLAYLIST_IDS = {
  TRACKS_POPULAR: '37i9dQZF1DXcBWIGoYBM5M',     // Today's Top Hits (31M+ followers)
  PLAYLISTS_TOPLISTS: '37i9dQZF1DX4o1BcGBQzKt', // Electronic Rising
} as const;

// Content strategies for different sections
const CONTENT_STRATEGIES: Record<string, string> = {
  // Primary sections using advanced search
  'tracks-latest': ADVANCED_SEARCH_STRATEGY,        // Year-based search strategy

  // Legacy playlist mappings (kept for compatibility)
  'tracks-popular': PLAYLIST_IDS.TRACKS_POPULAR,
  'playlists-toplists': PLAYLIST_IDS.PLAYLISTS_TOPLISTS,

  // Album-specific strategies using advanced search
  'albums-new_releases': ADVANCED_SEARCH_STRATEGY,  // Latest album releases
  'albums-popular': ADVANCED_SEARCH_STRATEGY,       // Popular album search
  'albums-classic': ADVANCED_SEARCH_STRATEGY,       // Classic album search
  'albums-indie': ADVANCED_SEARCH_STRATEGY,         // Independent album search

  // Additional genre expansions
  'tracks-throwback': ADVANCED_SEARCH_STRATEGY,     // Year-based throwback search
  'tracks-classic': ADVANCED_SEARCH_STRATEGY,       // Classic hits search
  'tracks-rnb-classic': ADVANCED_SEARCH_STRATEGY,   // R&B classics search
  'tracks-chill': ADVANCED_SEARCH_STRATEGY,         // Chill music search
} as const;

// Create a unified API that wraps Spotify functionality
export const musicApi = createApi({
  reducerPath: "musicApi",
  baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Dummy base query since we're using manual queries
  
  endpoints: (builder) => ({
    // This is just a placeholder - we'll use the Spotify API directly
    getTracks: builder.query<{results: ITrack[]}, {
      category: string | undefined;
      type?: string;
      page?: number;
      searchQuery?: string;
      showSimilarTracks?: boolean;
      id?: number;
    }>({
      query: () => '', // Dummy query since we handle this manually
    }),

    getTrack: builder.query<ITrack, { category: string; id: number }>({
      query: () => '', // Dummy query since we handle this manually
    }),
  }),
});

// Create hooks that provide music data through Spotify API integration
export const useGetTracksQuery = (
  args: {
    category: string | undefined;
    type?: string;
    page?: number;
    searchQuery?: string;
    showSimilarTracks?: boolean;
    id?: number;
    cacheKey?: string; // Add unique cache key
  },
  options?: { skip?: boolean }
) => {
  const { category, type, searchQuery, showSimilarTracks } = args;
  const { skip = false } = options || {};

  // Check if we should use mock data
  const useMockData = shouldUseMockData();
  
  console.log('🔍 MusicAPI Debug:', { useMockData, hasCredentials: !!(import.meta.env.VITE_SPOTIFY_CLIENT_ID && import.meta.env.VITE_SPOTIFY_CLIENT_SECRET) });

  // Always return mock data if no credentials (for Netlify deployment without Spotify API)
  if (useMockData) {
    console.log('📦 Using mock data - no credentials available');
    
    if (!searchQuery && !showSimilarTracks) {
      const mockData = getMockData(category || 'tracks', type || 'popular');
      return {
        data: mockData,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined
      } as any;
    }
  
    // Handle search queries with mock data
    if (searchQuery) {
      // Get comprehensive mock data from all sources
      const latestHits = getMockData('tracks', 'latest');
      const popularTracks = getMockData('tracks', 'popular');
      const allTracks = [...latestHits.results, ...popularTracks.results];

      // Enhanced search algorithm (now using shared utility)
      const searchResults = performEnhancedSearch(allTracks, searchQuery).map(result => result.track);

      return {
        data: { results: searchResults },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined
      } as any;
    }
    
    // Similar tracks with mock data
    if (showSimilarTracks) {
      const mockData = getMockData('tracks', 'popular');
      return {
        data: { results: mockData.results.slice(0, 10) },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined
      } as any;
    }
    
    // Default mock data
    const mockData = getMockData(category || 'tracks', type || 'popular');
    return {
      data: mockData,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined
    } as any;
  }

  // Handle search queries with real API
  if (searchQuery) {
    if (category === 'tracks') {
      return spotifyApi.useSearchMusicQuery({
        query: searchQuery,
        type: 'track',
        limit: 20
      }, { skip });
    } else if (category === 'albums') {
      return spotifyApi.useSearchMusicQuery({
        query: searchQuery,
        type: 'album',
        limit: 20
      }, { skip });
    }
  }

  // Handle similar tracks
  if (showSimilarTracks) {
    return spotifyApi.useSearchMusicQuery({
      query: 'recommended',
      type: 'track',
      limit: 10
    }, { skip });
  }

  // Fallback for sections with mock data
  console.log('⚠️ No Spotify credentials, returning empty results. Use mock data flag.');
  return {
    data: { results: [] },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined
  } as any;
};

export const useGetTrackQuery = (
  args: { category: string; id: number | string },
  options?: { skip?: boolean }
) => {
  const { category, id } = args;
  const { skip = false } = options || {};

  // Check if we should use mock data
  const useMockData = shouldUseMockData();

  // Handle both string and number IDs properly
  let stringId: string;
  if (typeof id === 'number') {
    stringId = String(id);
  } else {
    stringId = id;
  }

  // Validate that we have a proper ID
  if (!stringId || stringId.trim() === '' || stringId === 'undefined' || stringId === 'null') {
    console.error('Invalid ID provided to useGetShowQuery:', id);
    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { status: 400, message: 'Invalid ID provided' }
    } as any;
  }

  // In mock mode, try to find track by ID in mock data
  if (useMockData) {
    const mockTrack = getMockTrackById(stringId);
    if (mockTrack) {
      return {
        data: mockTrack,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined
      } as any;
    } else {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: { status: 404, message: 'Track not found in mock data' }
      } as any;
    }
  }
  
  if (category === 'tracks') {
    return spotifyApi.useGetTrackQuery({ id: stringId }, { skip });
  } else if (category === 'albums') {
    // Transform album response to track format for compatibility
    const albumQuery = spotifyApi.useGetAlbumQuery({ id: stringId }, { skip });
    return {
      ...albumQuery,
      data: albumQuery.data ? {
        ...albumQuery.data,
        artist: albumQuery.data.artists?.[0] || '',
        album: albumQuery.data.name,
        duration: 0,
        preview_url: null,
        title: albumQuery.data.name,
        genres: []
      } : undefined
    };
  } else if (category === 'artists') {
    // Handle artist details
    const artistQuery = spotifyApi.useGetArtistQuery({ id: stringId }, { skip });
    return {
      ...artistQuery,
      data: artistQuery.data ? {
        ...artistQuery.data,
        artist: artistQuery.data.name,
        album: '',
        duration: 0,
        preview_url: null,
        title: artistQuery.data.name,
        genres: artistQuery.data.genres || []
      } : undefined
    };
  }

  // Fallback: try to search for the ID (for unknown categories or legacy support)
  const searchQuery = spotifyApi.useSearchMusicQuery({
    query: stringId,
    type: 'track',
    limit: 50
  }, { skip });
  return {
    ...searchQuery,
    data: searchQuery.data?.results.find(track => track.id === stringId) || undefined
  };
};