
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import FeaturePost from '@/components/FeaturePost';
import PostList from '@/components/PostList';
import { Post } from '@/lib/types';
import { getFeaturedPosts, getRecentPosts } from '@/services/postService';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        const [featured, recent] = await Promise.all([
          getFeaturedPosts(),
          getRecentPosts()
        ]);
        setFeaturedPosts(featured);
        setRecentPosts(recent);
      } catch (error) {
        console.error("Error loading posts:", error);
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadPosts();
  }, [toast]);
  
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
          
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="game-card animate-pulse h-[400px] bg-gamedev-bg/50 rounded-md"></div>
              ))}
            </div>
          ) : featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map(post => (
                <FeaturePost key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-gamedev-muted">No featured updates available yet.</p>
          )}
        </section>
        
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gamedev-text">
              Latest Updates
            </h2>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gamedev-bg/50 rounded-md"></div>
              ))}
            </div>
          ) : (
            <PostList posts={recentPosts} />
          )}
        </section>
      </main>
      
      <footer className="bg-gamedev-bg border-t border-gamedev-primary/20 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gamedev-muted">
            © 2025 Mirage Park Community Portal. All development updates and assets belong to their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
