import supabase from './supabaseClient';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// Get user's profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile exists yet, return null
        return null;
      }
      throw error;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Update user's profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url' | 'bio'>>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Create user's profile
export const createUserProfile = async (
  userId: string,
  displayName: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        display_name: displayName,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

