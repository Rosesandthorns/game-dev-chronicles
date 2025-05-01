
import React, { useState } from 'react';
import BlogPost from './BlogPost';
import { Post, PostCategory } from '@/lib/types';

interface PostListProps {
  posts: Post[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all');
  
  const categories: (PostCategory | 'all')[] = ['all', 'gameplay', 'art', 'technical', 'announcement'];
  
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-gamedev-primary text-white'
                : 'bg-gamedev-muted/30 text-gamedev-text hover:bg-gamedev-muted/50'
            }`}
          >
            {category === 'all' ? 'All Updates' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map(post => (
          <BlogPost key={post.id} post={post} />
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gamedev-muted text-lg">No updates in this category yet.</p>
        </div>
      )}
    </div>
  );
};

export default PostList;
