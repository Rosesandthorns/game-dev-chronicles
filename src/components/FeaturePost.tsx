
import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import CategoryTag from './CategoryTag';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface FeaturePostProps {
  post: Post;
}

const FeaturePost: React.FC<FeaturePostProps> = ({ post }) => {
  const formattedDate = formatDistanceToNow(new Date(post.date), { addSuffix: true });
  
  return (
    <Card className="game-card relative overflow-hidden border-gamedev-primary/30 min-h-[400px]">
      {post.image && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-gamedev-bg via-gamedev-bg/90 to-transparent z-10" />
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="relative z-20 flex flex-col h-full p-6 justify-end">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <CategoryTag category={post.category} />
            <span className="text-xs text-gamedev-muted">{formattedDate}</span>
            {post.access_level && post.access_level !== 'user' && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                post.access_level === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : post.access_level === 'patreon_supporter' || post.access_level === 'patreon_founder'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {post.access_level.replace('_', ' ')}
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gamedev-primary glow-text">
            {post.title}
          </h2>
          <p className="text-gamedev-text/90 mb-6">
            {post.excerpt}
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            {post.author.avatar && (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gamedev-primary/30">
                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-gamedev-muted">{post.author.role}</p>
            </div>
          </div>
          
          <Button asChild className="bg-gamedev-primary hover:bg-gamedev-primary/80 text-white">
            <Link to={`/post/${post.id}`}>Read Full Update</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturePost;
