
import React from 'react';
import { useAuth } from '@/lib/auth';
import Header from './Header';

type LayoutProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

const Layout: React.FC<LayoutProps> = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth();

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
    window.location.href = '/auth';
    return null;
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
            © 2025 Mirage Park Community Portal. All development updates and assets belong to their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
