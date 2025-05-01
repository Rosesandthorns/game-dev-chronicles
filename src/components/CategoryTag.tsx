
import React from 'react';
import { cn } from '@/lib/utils';
import { PostCategory } from '@/lib/types';

interface CategoryTagProps {
  category: PostCategory;
  className?: string;
}

const CategoryTag: React.FC<CategoryTagProps> = ({ category, className }) => {
  const getTagStyle = (category: PostCategory) => {
    switch (category) {
      case 'gameplay':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'art':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'technical':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'announcement':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gamedev-secondary/20 text-gamedev-text border-gamedev-secondary/30';
    }
  };

  return (
    <span 
      className={cn(
        'text-xs px-2 py-1 rounded-full border',
        getTagStyle(category),
        className
      )}
    >
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
};

export default CategoryTag;
