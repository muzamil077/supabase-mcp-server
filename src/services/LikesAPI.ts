import supabase from './supabaseClient';

export interface TrackLike {
  id: string;
  track_id: string;
  likes_count: number;
  created_at?: string;
  updated_at?: string;
}

// Get likes count for a track
export const getTrackLikes = async (trackId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('track_likes')
      .select('likes_count')
      .eq('track_id', trackId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return 0
        return 0;
      }
      throw error;
    }

    return data?.likes_count || 0;
  } catch (error) {
    console.error('Error fetching track likes:', error);
    return 0;
  }
};

// Increment likes for a track
export const incrementTrackLikes = async (trackId: string): Promise<number> => {
  try {
    // First, try to get the existing record
    const { data: existingData } = await supabase
      .from('track_likes')
      .select('*')
      .eq('track_id', trackId)
      .single();

    if (existingData) {
      // Update existing record
      const { data, error } = await supabase
        .from('track_likes')
        .update({ likes_count: existingData.likes_count + 1 })
        .eq('track_id', trackId)
        .select('likes_count')
        .single();

      if (error) throw error;
      return data?.likes_count || 0;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('track_likes')
        .insert({ track_id: trackId, likes_count: 1 })
        .select('likes_count')
        .single();

      if (error) throw error;
      return data?.likes_count || 0;
    }
  } catch (error) {
    console.error('Error incrementing track likes:', error);
    throw error;
  }
};

// Get likes for multiple tracks at once
export const getTrackLikesBatch = async (trackIds: string[]): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('track_likes')
      .select('track_id, likes_count')
      .in('track_id', trackIds);

    if (error) throw error;

    const likesMap: Record<string, number> = {};
    
    // Initialize all tracks with 0 likes
    trackIds.forEach(id => {
      likesMap[id] = 0;
    });

    // Update with actual likes
    data?.forEach((item) => {
      likesMap[item.track_id] = item.likes_count;
    });

    return likesMap;
  } catch (error) {
    console.error('Error fetching track likes batch:', error);
    return {};
  }
};

