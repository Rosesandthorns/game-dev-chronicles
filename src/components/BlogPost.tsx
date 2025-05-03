
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import CategoryTag from './CategoryTag';
import { Post } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface BlogPostProps {
  post: Post;
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  const formattedDate = formatDistanceToNow(new Date(post.date), { addSuffix: true });
  
  return (
    <Card className="game-card overflow-hidden">
      {post.image && (
        <Link to={`/post/${post.id}`} className="w-full h-48 overflow-hidden block">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>
      )}
      <CardHeader className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <CategoryTag category={post.category} />
          <span className="text-xs text-gamedev-muted">{formattedDate}</span>
        </div>
        <Link to={`/post/${post.id}`}>
          <h3 className="text-xl font-bold hover:text-gamedev-primary transition-colors cursor-pointer">
            {post.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent>
        <p className="text-gamedev-text/80">{post.excerpt}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2 border-t border-gamedev-muted/30">
        <div className="flex items-center gap-2">
          {post.author.avatar && (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{post.author.name}</span>
            <span className="text-xs text-gamedev-muted">{post.author.role}</span>
          </div>
        </div>
        <Link to={`/post/${post.id}`} className="text-sm text-gamedev-primary hover:text-gamedev-accent transition-colors">
          Read More
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BlogPost;
