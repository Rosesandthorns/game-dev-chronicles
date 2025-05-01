
export type PostCategory = 'gameplay' | 'art' | 'technical' | 'announcement';

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
}
