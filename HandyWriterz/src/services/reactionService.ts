import { supabase } from '@/lib/supabaseClient';
import { UserReaction } from '@/types/blog';

/**
 * Get all reactions for a specific post
 * @param postId - The ID of the post to get reactions for
 * @returns Promise with an array of reactions
 */
export async function getPostReactions(postId: string): Promise<UserReaction[]> {
  try {
    const { data, error } = await supabase
      .from('user_reactions')
      .select('*')
      .eq('post_id', postId);

    if (error) {
      console.error('Error fetching post reactions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPostReactions:', error);
    throw error;
  }
}

/**
 * Get all reactions for a specific user
 * @param userId - The ID of the user to get reactions for
 * @returns Promise with an array of reactions
 */
export async function getUserReactions(userId: string): Promise<UserReaction[]> {
  try {
    const { data, error } = await supabase
      .from('user_reactions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user reactions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserReactions:', error);
    throw error;
  }
}

/**
 * Get a specific reaction by user for a post
 * @param userId - The ID of the user
 * @param postId - The ID of the post
 * @param type - The type of reaction (like, dislike, bookmark)
 * @returns Promise with the reaction or null if not found
 */
export async function getUserReactionForPost(
  userId: string,
  postId: string,
  type: 'like' | 'dislike' | 'bookmark'
): Promise<UserReaction | null> {
  try {
    const { data, error } = await supabase
      .from('user_reactions')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('type', type)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, which is fine
        return null;
      }
      console.error('Error fetching user reaction for post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserReactionForPost:', error);
    throw error;
  }
}

/**
 * Get all reactions by a user for a specific post
 * @param userId - The ID of the user
 * @param postId - The ID of the post
 * @returns Promise with an array of reactions
 */
export async function getUserReactionsForPost(
  userId: string,
  postId: string
): Promise<UserReaction[]> {
  try {
    const { data, error } = await supabase
      .from('user_reactions')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) {
      console.error('Error fetching user reactions for post:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserReactionsForPost:', error);
    throw error;
  }
}

/**
 * Add a reaction to a post
 * @param userId - The ID of the user adding the reaction
 * @param postId - The ID of the post being reacted to
 * @param type - The type of reaction (like, dislike, bookmark)
 * @returns Promise with the newly created reaction
 */
export async function addReaction(
  userId: string,
  postId: string,
  type: 'like' | 'dislike' | 'bookmark'
): Promise<UserReaction> {
  try {
    // Check if reaction already exists
    const existingReaction = await getUserReactionForPost(userId, postId, type);
    if (existingReaction) {
      return existingReaction;
    }

    // Add the reaction
    const { data, error } = await supabase
      .from('user_reactions')
      .insert({
        user_id: userId,
        post_id: postId,
        type
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addReaction:', error);
    throw error;
  }
}

/**
 * Remove a reaction from a post
 * @param userId - The ID of the user removing the reaction
 * @param postId - The ID of the post
 * @param type - The type of reaction to remove
 * @returns Promise with success status
 */
export async function removeReaction(
  userId: string,
  postId: string,
  type: 'like' | 'dislike' | 'bookmark'
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('user_reactions')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('type', type);

    if (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeReaction:', error);
    throw error;
  }
}

/**
 * Toggle a reaction on a post (add if it doesn't exist, remove if it does)
 * @param userId - The ID of the user toggling the reaction
 * @param postId - The ID of the post
 * @param type - The type of reaction to toggle
 * @returns Promise with status indicating if reaction was added or removed
 */
export async function toggleReaction(
  userId: string,
  postId: string,
  type: 'like' | 'dislike' | 'bookmark'
): Promise<{ added: boolean; reaction?: UserReaction }> {
  try {
    // Check if reaction already exists
    const existingReaction = await getUserReactionForPost(userId, postId, type);

    if (existingReaction) {
      // Remove the reaction
      await removeReaction(userId, postId, type);
      return { added: false };
    } else {
      // Add the reaction
      const reaction = await addReaction(userId, postId, type);
      return { added: true, reaction };
    }
  } catch (error) {
    console.error('Error in toggleReaction:', error);
    throw error;
  }
}

/**
 * Get reaction counts for a post
 * @param postId - The ID of the post
 * @returns Promise with counts of likes, dislikes, and bookmarks
 */
export async function getReactionCounts(
  postId: string
): Promise<{ likes: number; dislikes: number; bookmarks: number }> {
  try {
    // Get the post with reaction counts
    const { data, error } = await supabase
      .from('blog_posts')
      .select('likes, dislikes, bookmarks')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching reaction counts:', error);
      throw error;
    }

    return {
      likes: data.likes || 0,
      dislikes: data.dislikes || 0,
      bookmarks: data.bookmarks || 0
    };
  } catch (error) {
    console.error('Error in getReactionCounts:', error);
    throw error;
  }
} 