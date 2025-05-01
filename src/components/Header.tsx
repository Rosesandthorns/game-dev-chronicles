
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, MessageSquare } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="w-full bg-gamedev-bg border-b border-gamedev-primary/20 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gamedev-primary glow-text mr-2">Game Dev Chronicles</h1>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gamedev-text hover-glow flex items-center gap-2">
            <BookOpen size={18} />
            <span>Updates</span>
          </a>
          <a href="#" className="text-gamedev-text hover-glow flex items-center gap-2">
            <Calendar size={18} />
            <span>Roadmap</span>
          </a>
          <a href="#" className="text-gamedev-text hover-glow flex items-center gap-2">
            <MessageSquare size={18} />
            <span>Community</span>
          </a>
          <Button variant="outline" className="border-gamedev-primary text-gamedev-primary hover:bg-gamedev-primary/10">
            Subscribe
          </Button>
        </nav>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gamedev-text"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-gamedev-bg border-t border-gamedev-primary/20 py-4 animate-fade-in">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <a href="#" className="text-gamedev-text hover-glow flex items-center gap-2 p-2">
              <BookOpen size={18} />
              <span>Updates</span>
            </a>
            <a href="#" className="text-gamedev-text hover-glow flex items-center gap-2 p-2">
              <Calendar size={18} />
              <span>Roadmap</span>
            </a>
            <a href="#" className="text-gamedev-text hover-glow flex items-center gap-2 p-2">
              <MessageSquare size={18} />
              <span>Community</span>
            </a>
            <Button variant="outline" className="border-gamedev-primary text-gamedev-primary hover:bg-gamedev-primary/10 w-full">
              Subscribe
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
