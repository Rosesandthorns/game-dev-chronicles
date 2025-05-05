
import { supabase } from "@/integrations/supabase/client";
import { Post, PostCategory, UserRole } from "@/lib/types";

export async function getFeaturedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('featured', true)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching featured posts:', error);
    return [];
  }
  
  return data.map(transformPostData);
}

export async function getRecentPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching recent posts:', error);
    return [];
  }
  
  return data.map(transformPostData);
}

export async function getPostsByCategory(category: PostCategory): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('category', category)
    .order('date', { ascending: false });
  
  if (error) {
    console.error(`Error fetching ${category} posts:`, error);
    return [];
  }
  
  return data.map(transformPostData);
}

export async function getPostById(id: string): Promise<Post | null> {
  // Convert id to number for database compatibility
  const numericId = parseInt(id, 10);
  
  // Validate if conversion was successful
  if (isNaN(numericId)) {
    console.error(`Invalid post ID format: ${id}`);
    return null;
  }
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', numericId)
    .single();
  
  if (error) {
    console.error(`Error fetching post with ID ${id}:`, error);
    return null;
  }
  
  return transformPostData(data);
}

export async function createPost(post: Omit<Post, 'id' | 'date'>): Promise<{ success: boolean; error?: any; data?: any }> {
  if (!post || !post.title || !post.content) {
    return { success: false, error: "Post must include title and content" };
  }

  // Convert UserRole to string to ensure database compatibility
  const accessLevel = post.access_level || 'user';
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author_name: post.author.name,
      author_role: post.author.role,
      author_avatar: post.author.avatar,
      category: post.category,
      image: post.image,
      featured: post.featured,
      access_level: accessLevel,
      publish_at: post.publish_at
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error };
  }
  
  return { success: true, data: transformPostData(data) };
}

export async function updatePost(id: string, post: Partial<Post>): Promise<{ success: boolean; error?: any }> {
  // Convert id to number for database compatibility
  const numericId = parseInt(id, 10);
  
  // Validate if conversion was successful
  if (isNaN(numericId)) {
    return { success: false, error: 'Invalid post ID format' };
  }
  
  const updateData: any = {};
  
  if (post.title) updateData.title = post.title;
  if (post.excerpt) updateData.excerpt = post.excerpt;
  if (post.content) updateData.content = post.content;
  if (post.category) updateData.category = post.category;
  if (post.image !== undefined) updateData.image = post.image;
  if (post.featured !== undefined) updateData.featured = post.featured;
  if (post.access_level) updateData.access_level = post.access_level;
  if (post.publish_at !== undefined) updateData.publish_at = post.publish_at;
  
  if (post.author) {
    if (post.author.name) updateData.author_name = post.author.name;
    if (post.author.role) updateData.author_role = post.author.role;
    if (post.author.avatar !== undefined) updateData.author_avatar = post.author.avatar;
  }
  
  const { error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', numericId);
  
  if (error) {
    return { success: false, error };
  }
  
  return { success: true };
}

export async function deletePost(id: string): Promise<{ success: boolean; error?: any }> {
  // Convert id to number for database compatibility
  const numericId = parseInt(id, 10);
  
  // Validate if conversion was successful
  if (isNaN(numericId)) {
    return { success: false, error: 'Invalid post ID format' };
  }
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', numericId);
  
  if (error) {
    return { success: false, error };
  }
  
  return { success: true };
}

// Helper function to transform database posts to our Post type
function transformPostData(post: any): Post {
  return {
    id: post.id.toString(),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    author: {
      name: post.author_name,
      role: post.author_role,
      avatar: post.author_avatar,
    },
    date: post.date,
    category: post.category as PostCategory,
    image: post.image,
    featured: post.featured,
    access_level: post.access_level as UserRole || 'user',
    publish_at: post.publish_at
  };
}
