
import React from 'react';
import Header from '@/components/Header';
import FeaturePost from '@/components/FeaturePost';
import PostList from '@/components/PostList';
import { getFeaturedPosts, getRecentPosts } from '@/data/posts';

const Index = () => {
  const featuredPosts = getFeaturedPosts();
  const recentPosts = getRecentPosts();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gamedev-text">
              Featured Updates
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredPosts.slice(0, 2).map(post => (
              <FeaturePost key={post.id} post={post} />
            ))}
          </div>
        </section>
        
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gamedev-text">
              Latest Updates
            </h2>
          </div>
          
          <PostList posts={recentPosts} />
        </section>
      </main>
      
      <footer className="bg-gamedev-bg border-t border-gamedev-primary/20 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gamedev-muted">
            © 2025 Game Dev Chronicles. All development updates and assets belong to their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
