
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/sonner";
import { checkPatreonConnection, connectPatreon, disconnectPatreon } from '@/services/patreonService';

const PatreonConnect = () => {
  const [patreonStatus, setPatreonStatus] = useState<{
    connected: boolean;
    tier: string | null;
    loading: boolean;
  }>({
    connected: false,
    tier: null,
    loading: true,
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchPatreonStatus();
  }, [user]);

  const fetchPatreonStatus = async () => {
    if (!user) {
      setPatreonStatus({ connected: false, tier: null, loading: false });
      return;
    }

    try {
      const { connected, tier } = await checkPatreonConnection();
      setPatreonStatus({ connected, tier, loading: false });
    } catch (error) {
      console.error("Error fetching Patreon status:", error);
      setPatreonStatus({ connected: false, tier: null, loading: false });
    }
  };

  const handleConnectPatreon = () => {
    if (!user) {
      toast.error("You must be signed in to connect your Patreon account");
      return;
    }
    connectPatreon();
  };

  const handleDisconnectPatreon = async () => {
    try {
      setPatreonStatus(prev => ({ ...prev, loading: true }));
      const { success, error } = await disconnectPatreon();
      
      if (success) {
        toast.success("Successfully disconnected Patreon account");
        setPatreonStatus({ connected: false, tier: null, loading: false });
      } else {
        toast.error(error || "Failed to disconnect Patreon account");
        setPatreonStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error disconnecting Patreon:", error);
      toast.error("An error occurred while disconnecting your Patreon account");
      setPatreonStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const renderTierBenefits = () => {
    switch (patreonStatus.tier) {
      case 'founder':
        return (
          <div className="text-sm text-purple-300">
            <p className="font-bold text-lg text-purple-200 mb-2">🎭 Founder Tier</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access to large amounts of behind the scene content (updated weekly)</li>
              <li>Access to a detailed roadmap (updated daily)</li>
              <li>Ask the devs Q&A biweekly</li>
              <li>Special role on Discord for additional behind the scenes content</li>
              <li>Weekly Holo & Animatronic full data reveal</li>
            </ul>
          </div>
        );
      case 'supporter':
        return (
          <div className="text-sm text-blue-300">
            <p className="font-bold text-lg text-blue-200 mb-2">🛠 Supporter Tier</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access to behind the scenes content (updated weekly)</li>
              <li>Ask the devs Q&A biweekly</li>
              <li>Support the development of Mirage Park</li>
            </ul>
            <p className="mt-2">Upgrade to Founder tier for more exclusive benefits!</p>
          </div>
        );
      case 'basic':
        return (
          <div className="text-sm text-green-300">
            <p className="font-bold text-lg text-green-200 mb-2">🔎 Basic Tier</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access to behind the scenes content (updated weekly)</li>
              <li>Support the development of Mirage Park</li>
            </ul>
            <p className="mt-2">Upgrade to higher tiers for more exclusive benefits!</p>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-400">
            <p>Your Patreon connection is active but no tier benefits were found.</p>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <Card className="bg-black border-gray-800 text-white">
        <CardHeader>
          <CardTitle>Connect Patreon</CardTitle>
          <CardDescription className="text-gray-300">
            Sign in to connect your Patreon account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-gray-900">
            <AlertDescription>
              You need to sign in before connecting your Patreon account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-gamedev-primary/20 text-white">
      <CardHeader>
        <CardTitle>Patreon Connection</CardTitle>
        <CardDescription className="text-gray-300">
          Connect your Patreon account to unlock premium features
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patreonStatus.loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : patreonStatus.connected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>
                Connected to Patreon as a{' '}
                <span className="font-bold text-purple-400">
                  {patreonStatus.tier === 'founder' ? 'Founder' :
                   patreonStatus.tier === 'supporter' ? 'Supporter' :
                   patreonStatus.tier === 'basic' ? 'Basic' : 'Member'}
                </span>
              </span>
            </div>
            
            {renderTierBenefits()}
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleDisconnectPatreon}
                disabled={patreonStatus.loading}
              >
                Disconnect Patreon
              </Button>
              <Button asChild>
                <a href="https://www.patreon.com/c/arcticroses" target="_blank" rel="noopener noreferrer">
                  Visit Patreon Page
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300">
              Connect your Patreon account to get access to premium features based on your
              membership tier:
            </p>
            
            <div className="grid grid-cols-1 gap-4 my-4">
              <div className="border border-green-800 p-4 rounded-md">
                <h3 className="font-bold text-green-400 mb-2">🔎 Basic Tier</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Access to behind the scenes content (updated weekly)</li>
                  <li>Support the development of Mirage Park</li>
                </ul>
              </div>
              
              <div className="border border-blue-800 p-4 rounded-md">
                <h3 className="font-bold text-blue-400 mb-2">🛠 Supporter Tier</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Access to behind the scenes content (updated weekly)</li>
                  <li>Ask the devs Q&A biweekly</li>
                  <li>Support the development of Mirage Park</li>
                </ul>
              </div>
              
              <div className="border border-purple-800 p-4 rounded-md">
                <h3 className="font-bold text-purple-400 mb-2">🎭 Founder Tier</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Access to large amounts of behind the scene content (updated weekly)</li>
                  <li>Access to a detailed roadmap (updated daily)</li>
                  <li>Ask the devs Q&A biweekly</li>
                  <li>Special role on Discord for additional content</li>
                  <li>Weekly Holo & Animatronic full data reveal</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={handleConnectPatreon} 
              className="w-full bg-[#F96854] hover:bg-[#F96854]/90 text-white"
              disabled={patreonStatus.loading}
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="currentColor" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 512 512"
              >
                <path d="M512 194.8c0 101.3-82.4 183.8-183.8 183.8-101.7 0-184.4-82.4-184.4-183.8 0-101.6 82.7-184.3 184.4-184.3C429.6 10.5 512 93.2 512 194.8zM0 501.5h90v-491H0v491z" />
              </svg>
              Connect with Patreon
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatreonConnect;
