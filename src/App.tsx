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

function App() {
  return (
    <div className="min-h-screen bg-gamedev-bg text-gamedev-text">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/qna" element={<QnaPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
