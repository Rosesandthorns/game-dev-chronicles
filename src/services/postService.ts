
import { supabase } from "@/integrations/supabase/client";
import { Post, PostCategory } from "@/lib/types";

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
  };
}
