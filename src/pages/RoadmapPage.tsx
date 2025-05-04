
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';

// Define milestone types
type Milestone = {
  amount: number;
  title: string;
  description: string;
  completed: boolean;
};

const RoadmapPage = () => {
  const [currentFunding, setCurrentFunding] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  
  // Define funding goal milestones
  const fundingGoal = 20000;
  const milestones: Milestone[] = [
    { 
      amount: 1500, 
      title: "Early Beta / Proof of Concept", 
      description: "Access to the early beta version of Mirage Park to test core gameplay mechanics.",
      completed: false
    },
    { 
      amount: 3000, 
      title: "Complete Soundtrack for Free",
      description: "Release of the full game soundtrack for all supporters.",
      completed: false 
    },
    { 
      amount: 5000, 
      title: "Behind the Scenes Videos",
      description: "Access to exclusive development videos and insights into the creative process.",
      completed: false 
    },
    { 
      amount: 7500, 
      title: "Guarantee of Project Completion",
      description: "Commitment to finishing the game regardless of future funding challenges.",
      completed: false 
    },
    { 
      amount: 10000, 
      title: "Project Completion",
      description: "Full game release with all core features and content.",
      completed: false 
    },
    { 
      amount: 12500, 
      title: "Steam Port, More Holos, Maps, and Content",
      description: "Game available on Steam platform with additional characters, locations and gameplay content.",
      completed: false 
    },
    { 
      amount: 15000, 
      title: "More Content and Merchandise",
      description: "Expanded game content and physical merchandise for supporters.",
      completed: false 
    },
    { 
      amount: 20000, 
      title: "Full Voice Acting",
      description: "Professional voice acting for all characters in the game.",
      completed: false 
    }
  ];

  // Check if user is admin
  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
    fetchCurrentFunding();
  }, [user]);
  
  const checkAdminRole = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user!.id)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };
  
  const fetchCurrentFunding = async () => {
    try {
      const { data, error } = await supabase
        .from('roadmap')
        .select('current_funding')
        .single();
      
      if (error) {
        // Table or row might not exist yet, initialize if admin
        if (isAdmin) {
          await supabase
            .from('roadmap')
            .insert({ id: 1, current_funding: 0 });
          setCurrentFunding(0);
        }
        return;
      }
      
      setCurrentFunding(data.current_funding);
    } catch (error) {
      console.error("Error fetching funding:", error);
    }
  };
  
  const updateFunding = async () => {
    if (!isAdmin) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid funding amount");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('roadmap')
        .update({ current_funding: amount })
        .eq('id', 1);
      
      if (error) throw error;
      
      setCurrentFunding(amount);
      setEditMode(false);
      toast.success("Funding amount updated successfully");
    } catch (error) {
      console.error("Error updating funding:", error);
      toast.error("Failed to update funding amount");
    }
  };
  
  // Update milestone completion status
  useEffect(() => {
    milestones.forEach(milestone => {
      milestone.completed = currentFunding >= milestone.amount;
    });
  }, [currentFunding]);
  
  // Calculate progress percentage
  const progressPercentage = Math.min((currentFunding / fundingGoal) * 100, 100);

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-gamedev-primary mb-8">Mirage Park Roadmap</h1>
        
        <div className="mb-12 bg-black p-6 rounded-lg border border-gamedev-primary/20">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-white">Development Progress</h2>
            <div className="text-right">
              {editMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-32"
                    placeholder="Amount"
                  />
                  <Button onClick={updateFunding} size="sm">Save</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)} size="sm">Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-white">
                    ${currentFunding.toLocaleString()} / ${fundingGoal.toLocaleString()}
                  </span>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditMode(true);
                      setEditAmount(currentFunding.toString());
                    }}>Edit</Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative mb-4 h-8">
            <Progress value={progressPercentage} className="h-full" />
            
            {/* Milestone markers on the progress bar */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              {milestones.map((milestone) => (
                <div 
                  key={milestone.amount} 
                  className={`absolute h-full w-1 ${milestone.completed ? 'bg-green-500' : 'bg-white/30'}`} 
                  style={{ left: `${(milestone.amount / fundingGoal) * 100}%` }}
                />
              ))}
            </div>
          </div>
          
          <p className="text-gamedev-muted text-center mb-8">
            Help us reach our funding goals to unlock more features and content for Mirage Park!
          </p>
          
          <Button asChild className="mx-auto block">
            <a href="https://www.patreon.com/miragepark" target="_blank" rel="noopener noreferrer">
              Support on Patreon
            </a>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {milestones.map((milestone) => (
            <Card key={milestone.amount} className={`${milestone.completed ? 'bg-black border-green-700' : 'bg-black border-gray-800'} text-white hover:shadow-md transition-all duration-300`}>
              <CardHeader>
                <CardTitle className={milestone.completed ? 'text-green-400' : 'text-white'}>
                  ${milestone.amount.toLocaleString()}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {milestone.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">{milestone.description}</p>
                {milestone.completed && (
                  <div className="mt-4 text-green-500 font-medium">✓ Achieved!</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default RoadmapPage;
