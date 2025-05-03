
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
}

export async function createComment(postId: string, content: string): Promise<{ success: boolean; error?: any; data?: Comment }> {
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
  
  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: numericPostId,
      content,
      user_id: user.data.user.id
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error };
  }
  
  if (!data) {
    return { success: false, error: 'Failed to create comment' };
  }
  
  return { 
    success: true, 
    data: {
      id: data.id,
      post_id: String(data.post_id), // Convert to string to match our interface
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as Comment 
  };
}

export async function updateComment(id: string, content: string): Promise<{ success: boolean; error?: any }> {
  if (!id || typeof content !== 'string') {
    return { success: false, error: 'Invalid parameters for comment update' };
  }

  const { error } = await supabase
    .from('post_comments')
    .update({ 
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) {
    return { success: false, error };
  }
  
  return { success: true };
}

export async function deleteComment(id: string): Promise<{ success: boolean; error?: any }> {
  if (!id) {
    return { success: false, error: 'Invalid comment ID' };
  }

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', id);
  
  if (error) {
    return { success: false, error };
  }
  
  return { success: true };
}
