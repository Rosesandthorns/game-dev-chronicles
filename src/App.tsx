
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import PostDetail from '@/pages/PostDetail';
import QnaPage from '@/pages/QnaPage';
import RoadmapPage from '@/pages/RoadmapPage';
import Auth from '@/pages/Auth';
import AdminPanel from '@/pages/AdminPanel';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/sonner';
import ProfilePage from '@/pages/ProfilePage';
import { AuthProvider } from '@/lib/auth';

// Add a redirect component to handle OAuth redirects
const PatreonRedirect = () => {
  // This component acts as a redirect handler for Patreon OAuth
  React.useEffect(() => {
    // Redirect to profile page with the URL parameters preserved
    window.location.href = `/profile${window.location.search}`;
  }, []);
  
  return <div className="min-h-screen bg-gamedev-bg text-gamedev-text flex justify-center items-center">
    Connecting to Patreon...
  </div>;
};

function App() {
  return (
    <div className="min-h-screen bg-gamedev-bg text-gamedev-text">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/qna" element={<QnaPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/api/patreon/connect" element={<PatreonRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;
