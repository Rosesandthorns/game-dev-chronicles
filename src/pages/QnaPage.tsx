
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

// Define types for questions and answers
type QnaItem = {
  id: string;
  user_id: string;
  username: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
  user_tier: string;
};

type UserProfile = {
  user_id: string;
  username: string;
  role: string;
  patreon_tier: string | null;
  questions_asked: number;
  last_question_date: string | null;
};

const QnaPage = () => {
  const [questions, setQuestions] = useState<QnaItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [canAskQuestions, setCanAskQuestions] = useState(false);
  const { user } = useAuth();

  const form = useForm({
    defaultValues: {
      question: '',
    },
  });

  // Check if we're in a Q&A weekend (every second weekend)
  const isQnAWeekend = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const weekNumber = Math.floor(now.getDate() / 7) + 1; // Rough week number in month
    
    // Every second weekend (when week number is even)
    return (dayOfWeek === 0 || dayOfWeek === 6) && weekNumber % 2 === 0;
  };

  useEffect(() => {
    fetchQuestions();
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Fetch all answered questions (public)
      const { data, error } = await supabase
        .from('qna_questions')
        .select(`
          id,
          user_id,
          profiles(username),
          question,
          answer,
          created_at,
          answered_at,
          user_tier
        `)
        .not('answer', 'is', null)
        .order('answered_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        username: item.profiles?.username || 'Anonymous',
        question: item.question,
        answer: item.answer,
        created_at: item.created_at,
        answered_at: item.answered_at,
        user_tier: item.user_tier
      }));
      
      setQuestions(formattedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Get user's profile including Patreon info
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, role, patreon_tier, questions_asked, last_question_date')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      setUserProfile(data);
      
      // Check if user can ask questions
      checkQuestionEligibility(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const checkQuestionEligibility = (profile: UserProfile) => {
    if (!profile) return;
    
    // Check if user is a patreon_premium (tier 2) member
    const isPatreonTier2 = profile.patreon_tier === 'premium';
    
    // Check if it's a Q&A weekend
    const qnaWeekend = isQnAWeekend();
    
    // Check how many questions they've asked this weekend
    const maxQuestions = 5;
    const questionsRemaining = maxQuestions - (profile.questions_asked || 0);
    
    // If they asked questions during this weekend, they can continue
    let canAsk = false;
    
    if (isPatreonTier2 && qnaWeekend && questionsRemaining > 0) {
      canAsk = true;
    }
    
    // Reset question count if it's a new Q&A weekend
    const lastQuestionDate = profile.last_question_date ? new Date(profile.last_question_date) : null;
    const now = new Date();
    
    // If it's been more than 2 weeks since last question, reset counter
    if (lastQuestionDate && qnaWeekend && (now.getTime() - lastQuestionDate.getTime() > 14 * 24 * 60 * 60 * 1000)) {
      // Reset count in database
      supabase
        .from('profiles')
        .update({ questions_asked: 0 })
        .eq('user_id', user!.id)
        .then(() => {
          setUserProfile(prev => prev ? {...prev, questions_asked: 0} : null);
          if (isPatreonTier2) canAsk = true;
        });
    }
    
    setCanAskQuestions(canAsk);
  };

  const onSubmitQuestion = async (data: { question: string }) => {
    if (!user || !userProfile) {
      toast.error('You must be logged in to ask questions');
      return;
    }
    
    if (!canAskQuestions) {
      toast.error('You cannot ask questions at this time');
      return;
    }
    
    try {
      // Insert question
      const { data: newQuestion, error } = await supabase
        .from('qna_questions')
        .insert({
          user_id: user.id,
          question: data.question,
          user_tier: userProfile.patreon_tier || 'free'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update user's question count
      const newCount = (userProfile.questions_asked || 0) + 1;
      await supabase
        .from('profiles')
        .update({ 
          questions_asked: newCount,
          last_question_date: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      setUserProfile(prev => prev ? {
        ...prev,
        questions_asked: newCount,
        last_question_date: new Date().toISOString()
      } : null);
      
      toast.success('Your question has been submitted');
      form.reset();
      
      // Check if user can ask more questions
      checkQuestionEligibility({
        ...userProfile,
        questions_asked: newCount,
        last_question_date: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Failed to submit question');
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-gamedev-primary mb-8">Questions & Answers</h1>
        
        {user && userProfile?.patreon_tier === 'premium' && (
          <Card className="mb-8 bg-black border-purple-800 text-white">
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription className="text-gray-300">
                Premium Patreon members can ask up to 5 questions every second weekend
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isQnAWeekend() ? (
                canAskQuestions ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitQuestion)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="question"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Your Question</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Ask your question here..." 
                                className="h-24"
                                {...field} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">
                          Questions remaining: {5 - (userProfile?.questions_asked || 0)}
                        </span>
                        <Button type="submit">Submit Question</Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>You've used all your questions for this Q&A session</AlertTitle>
                    <AlertDescription>
                      Premium Patreon members can ask up to 5 questions every second weekend.
                    </AlertDescription>
                  </Alert>
                )
              ) : (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Q&A is not active right now</AlertTitle>
                  <AlertDescription>
                    Questions can only be submitted every second weekend. Please check back later!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
        
        {user && !userProfile?.patreon_tier && (
          <Card className="mb-8 bg-black border-purple-800 text-white">
            <CardHeader>
              <CardTitle>Become a Patreon Member</CardTitle>
              <CardDescription className="text-gray-300">
                Premium Patreon members can ask questions during our bi-weekly Q&A sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <p className="text-gray-300">
                  Support Mirage Park development and gain access to exclusive features like Q&A sessions.
                </p>
                <Button asChild>
                  <a href="https://www.patreon.com/miragepark" target="_blank" rel="noopener noreferrer">
                    Join our Patreon
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <h2 className="text-2xl font-bold text-gamedev-primary mb-4">Previous Questions & Answers</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading questions...</div>
        ) : questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map(item => (
              <Card key={item.id} className="bg-black border-gray-800 text-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{item.question}</CardTitle>
                    <Badge variant="outline" className="bg-purple-900 text-white">
                      {item.user_tier === 'premium' ? 'Premium' : 'Basic'} Member
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-400">
                    Asked by {item.username} on {format(new Date(item.created_at), 'PPP')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 p-4 rounded-md">
                    <p className="text-white whitespace-pre-wrap">{item.answer}</p>
                  </div>
                </CardContent>
                <CardFooter className="text-gray-400 text-sm">
                  Answered on {item.answered_at ? format(new Date(item.answered_at), 'PPP') : 'Pending'}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No answered questions yet. Check back soon!
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QnaPage;
