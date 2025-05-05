
export type PostCategory = 'gameplay' | 'art' | 'technical' | 'announcement';
export type UserRole = 'user' | 'admin' | 'patreon_basic' | 'patreon_supporter' | 'patreon_founder';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  date: string;
  category: PostCategory;
  image?: string;
  featured: boolean;
  access_level?: UserRole;
  publish_at?: string | null;
}
