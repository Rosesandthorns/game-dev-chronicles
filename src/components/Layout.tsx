
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import Header from './Header';
import { toast } from '@/components/ui/sonner';

type LayoutProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

const Layout: React.FC<LayoutProps> = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      toast.error("Authentication required", {
        description: "Please sign in to access this page."
      });
      navigate('/auth');
    }
  }, [loading, requireAuth, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-gamedev-text">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        {children}
      </main>
      <footer className="bg-gamedev-bg border-t border-gamedev-primary/20 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gamedev-muted">
            © 2025 Mirage Park Community Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
