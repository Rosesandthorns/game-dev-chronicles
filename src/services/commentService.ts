
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
  
  return data.map(comment => ({
    ...comment,
    author: comment.profiles ? {
      username: comment.profiles.username || 'Anonymous',
      avatar_url: comment.profiles.avatar_url
    } : undefined
  })) as Comment[];
}

export async function createComment(postId: string, content: string): Promise<{ success: boolean; error?: any; data?: Comment }> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    return { success: false, error: 'User not authenticated' };
  }
  
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
  
  return { success: true, data: data as unknown as Comment };
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
