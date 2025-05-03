
import { supabase } from "@/integrations/supabase/client";

export interface Comment {
  id: string;
  post_id: string; // Changed from string to match database
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    avatar_url?: string;
  };
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  try {
    // Convert postId to number if needed for database query
    const numericPostId = parseInt(postId, 10);
    
    // Validate if conversion was successful
    if (isNaN(numericPostId)) {
      console.error('Invalid post ID format:', postId);
      return [];
    }
    
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id(
          username,
          avatar_url
        )
      `)
      .eq('post_id', numericPostId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching post comments:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform and properly type the data
    const comments = data.map(comment => {
      // Extract the profiles data safely
      const profileData = comment.profiles as any;
      
      return {
        id: comment.id,
        post_id: String(comment.post_id), // Convert number to string to match our interface
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: profileData ? {
          username: profileData.username || 'Anonymous',
          avatar_url: profileData.avatar_url
        } : undefined
      };
    });
    
    return comments as Comment[];
  } catch (error) {
    console.error('Unexpected error in getPostComments:', error);
    return [];
  }
}

export async function createComment(postId: string, content: string): Promise<{ success: boolean; error?: any; data?: Comment }> {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Convert postId to number for database compatibility
    const numericPostId = parseInt(postId, 10);
    
    // Validate if conversion was successful
    if (isNaN(numericPostId)) {
      return { success: false, error: 'Invalid post ID format' };
    }
    
    // First check if the post exists
    const { data: postExists, error: postCheckError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', numericPostId)
      .single();
      
    if (postCheckError || !postExists) {
      return { 
        success: false, 
        error: postCheckError || { message: 'Post does not exist' } 
      };
    }
    
    // Insert the comment
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: numericPostId,
        content,
        user_id: user.data.user.id
      })
      .select('*, profiles:user_id(username, avatar_url)')
      .single();
    
    if (error) {
      console.error('Error creating comment:', error);
      return { success: false, error };
    }
    
    if (!data) {
      return { success: false, error: 'Failed to create comment' };
    }
    
    // Extract the profiles data safely
    const profileData = data.profiles as any;
    
    // Transform the data to match our interface
    const commentData: Comment = {
      id: data.id,
      post_id: String(data.post_id), // Convert to string to match our interface
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      author: profileData ? {
        username: profileData.username || 'Anonymous',
        avatar_url: profileData.avatar_url
      } : undefined
    };
    
    return { 
      success: true, 
      data: commentData
    };
  } catch (error) {
    console.error('Unexpected error in createComment:', error);
    return { success: false, error };
  }
}

export async function updateComment(id: string, content: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!id || typeof content !== 'string') {
      return { success: false, error: 'Invalid parameters for comment update' };
    }
    
    // Get the current user
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // First check if the comment exists and belongs to the user
    const { data: commentExists, error: commentCheckError } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', id)
      .single();
      
    if (commentCheckError) {
      return { success: false, error: commentCheckError };
    }
    
    if (!commentExists) {
      return { success: false, error: { message: 'Comment does not exist' } };
    }
    
    if (commentExists.user_id !== user.data.user.id) {
      return { success: false, error: { message: 'You can only edit your own comments' } };
    }

    // Update the comment
    const { error } = await supabase
      .from('post_comments')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating comment:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateComment:', error);
    return { success: false, error };
  }
}

export async function deleteComment(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!id) {
      return { success: false, error: 'Invalid comment ID' };
    }
    
    // Get the current user
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // First check if the comment exists and belongs to the user
    const { data: commentExists, error: commentCheckError } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', id)
      .single();
      
    if (commentCheckError) {
      return { success: false, error: commentCheckError };
    }
    
    if (!commentExists) {
      return { success: false, error: { message: 'Comment does not exist' } };
    }
    
    // Allow user to delete their own comments or admin to delete any comment
    const isOwner = commentExists.user_id === user.data.user.id;
    
    // Check if user is admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.data.user.id)
      .single();
      
    const isAdmin = profileData?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return { success: false, error: { message: 'You can only delete your own comments' } };
    }

    // Delete the comment
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteComment:', error);
    return { success: false, error };
  }
}
