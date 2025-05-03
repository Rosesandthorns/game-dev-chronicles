
import { supabase } from "@/integrations/supabase/client";

export interface Comment {
  id: string;
  post_id: string;
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
  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      *,
      profiles:user_id(
        username,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching post comments:', error);
    return [];
  }
  
  // Transform and properly type the data
  const comments = data.map(comment => {
    // Extract the profiles data safely
    const profileData = comment.profiles as any;
    
    return {
      id: comment.id,
      post_id: comment.post_id,
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
  
  // Convert postId to the correct type if necessary for database compatibility
  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      content,
      user_id: user.data.user.id
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error };
  }
  
  return { 
    success: true, 
    data: {
      id: data.id,
      post_id: data.post_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as Comment 
  };
}

export async function updateComment(id: string, content: string): Promise<{ success: boolean; error?: any }> {
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
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', id);
  
  if (error) {
    return { success: false, error };
  }
  
  return { success: true };
}
