
import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth';

const Header = () => {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <header className="bg-gamedev-bg border-b border-gamedev-primary/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-gamedev-primary">Mirage Park</span>
            <span className="hidden sm:inline-block text-gamedev-text">Community Portal</span>
          </Link>
          
          <nav>
            <ul className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gamedev-text hover:text-gamedev-primary transition-colors">
                  Updates
                </Link>
              </li>
              
              {user ? (
                <>
                  <li>
                    <Button variant="ghost" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </li>
                </>
              ) : (
                <li>
                  <Button asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
