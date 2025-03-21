// src/services/commentService.ts
import { supabase } from '@/lib/supabaseClient';
import { Comment } from '@/types/blog';

/**
 * Get all comments for a specific post
 * @param postId - The ID of the post to get comments for
 * @returns Promise with an array of comments
 */
export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_id,
        replies_count,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getComments:', error);
    throw error;
  }
}

/**
 * Get replies for a specific comment
 * @param commentId - The ID of the parent comment
 * @returns Promise with an array of reply comments
 */
export async function getReplies(commentId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_id,
        replies_count,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReplies:', error);
    throw error;
  }
}

/**
 * Add a new comment to a post
 * @param userId - The ID of the user adding the comment
 * @param postId - The ID of the post being commented on
 * @param content - The content of the comment
 * @param parentId - Optional parent comment ID for replies
 * @returns Promise with the newly created comment
 */
export async function addComment(
  userId: string,
  postId: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  try {
    // Create the comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content,
        parent_id: parentId || null
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_id,
        replies_count,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    // If this is a reply, increment the replies_count on the parent comment
    if (parentId) {
      const { error: updateError } = await supabase.rpc('increment_replies_count', {
        comment_id: parentId
      });

      if (updateError) {
        console.error('Error incrementing replies count:', updateError);
        // Don't throw here, as the comment was still created successfully
      }
    }

    // Increment the comments_count on the blog post
    const { error: postUpdateError } = await supabase.rpc('increment_comments_count', {
      post_id: postId
    });

    if (postUpdateError) {
      console.error('Error incrementing post comments count:', postUpdateError);
      // Don't throw here, as the comment was still created successfully
    }

    return data;
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
}

/**
 * Update an existing comment
 * @param commentId - The ID of the comment to update
 * @param userId - The ID of the user updating the comment (for permission check)
 * @param content - The new content for the comment
 * @returns Promise with the updated comment
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<Comment> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', userId) // Ensure the user owns this comment
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        post_id,
        parent_id,
        replies_count,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateComment:', error);
    throw error;
  }
}

/**
 * Delete a comment
 * @param commentId - The ID of the comment to delete
 * @param userId - The ID of the user deleting the comment (for permission check)
 * @param postId - The ID of the post the comment belongs to
 * @param parentId - Optional parent comment ID if this is a reply
 * @returns Promise with success status
 */
export async function deleteComment(
  commentId: string,
  userId: string,
  postId: string,
  parentId?: string
): Promise<{ success: boolean }> {
  try {
    // Delete the comment
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // Ensure the user owns this comment

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }

    // If this was a reply, decrement the replies_count on the parent comment
    if (parentId) {
      const { error: updateError } = await supabase.rpc('decrement_replies_count', {
        comment_id: parentId
      });

      if (updateError) {
        console.error('Error decrementing replies count:', updateError);
        // Don't throw here, as the comment was still deleted successfully
      }
    }

    // Decrement the comments_count on the blog post
    const { error: postUpdateError } = await supabase.rpc('decrement_comments_count', {
      post_id: postId
    });

    if (postUpdateError) {
      console.error('Error decrementing post comments count:', postUpdateError);
      // Don't throw here, as the comment was still deleted successfully
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteComment:', error);
    throw error;
  }
}

/**
 * Get the total number of comments for a post
 * @param postId - The ID of the post
 * @returns Promise with the comment count
 */
export async function getCommentCount(postId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('Error getting comment count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getCommentCount:', error);
    throw error;
  }
} 