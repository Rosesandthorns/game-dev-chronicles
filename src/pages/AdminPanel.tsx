
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';
import { getRecentPosts, deletePost, updatePost, createPost } from '@/services/postService';
import { Post, PostCategory, UserRole } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/sonner';
import { CalendarIcon, Edit, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm, Controller } from 'react-hook-form';
import { fetchQuestionsAdmin, answerQuestion, deleteQuestion } from '@/services/qnaService';
import { updateFundingAmount } from '@/services/roadmapService';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [fundingAmount, setFundingAmount] = useState("");
  const navigate = useNavigate();

  // Form for creating/editing posts
  const postForm = useForm<{
    title: string;
    excerpt: string;
    content: string;
    category: PostCategory;
    featured: boolean;
    image?: string;
    access_level: UserRole;
    publish_at?: Date | null;
  }>({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      category: 'announcement',
      featured: false,
      access_level: 'user',
      publish_at: null
    }
  });

  // Form for answering questions
  const questionForm = useForm<{
    answer: string;
  }>({
    defaultValues: {
      answer: '',
    }
  });

  // Check if user is admin
  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Check if user has admin role in profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        const isUserAdmin = data?.role === 'admin';
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          toast.error("Access denied", {
            description: "You don't have permission to access this page."
          });
          navigate('/');
          return;
        }
        
        // Load posts and questions
        await Promise.all([
          fetchPosts(),
          fetchQuestions()
        ]);
      } catch (error) {
        console.error("Error checking admin role:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminRole();
  }, [user, navigate]);
  
  const fetchPosts = async () => {
    const postsData = await getRecentPosts();
    setPosts(postsData);
  };
  
  const fetchQuestions = async () => {
    const questionsData = await fetchQuestionsAdmin();
    setQuestions(questionsData);
  };
  
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    postForm.reset({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      featured: post.featured,
      image: post.image,
      access_level: (post.access_level as UserRole) || 'user',
      publish_at: post.publish_at ? new Date(post.publish_at) : null
    });
    setActiveTab('editor');
  };
  
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      const { success, error } = await deletePost(postId);
      
      if (success) {
        toast.success("Post deleted", {
          description: "The post has been permanently removed."
        });
        await fetchPosts(); // Refresh posts list
      } else {
        toast.error("Failed to delete post", {
          description: error?.message || "Please try again later."
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post", {
        description: "Please try again later."
      });
    }
  };
  
  const handleCreateNewPost = () => {
    setEditingPost(null);
    postForm.reset({
      title: '',
      excerpt: '',
      content: '',
      category: 'announcement',
      featured: false,
      image: '',
      access_level: 'user',
      publish_at: null
    });
    setActiveTab('editor');
  };
  
  const onSubmitPost = async (data: any) => {
    try {
      const postData = {
        ...data,
        publish_at: data.publish_at ? data.publish_at.toISOString() : null,
        author: {
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin',
          role: 'Administrator',
          avatar: user?.user_metadata?.avatar_url
        }
      };
      
      if (editingPost) {
        // Update existing post
        const { success, error } = await updatePost(editingPost.id, postData);
        
        if (success) {
          toast.success("Post updated", {
            description: "Your changes have been saved."
          });
          await fetchPosts();
          setActiveTab('posts');
        } else {
          toast.error("Failed to update post", {
            description: error?.message || "Please try again later."
          });
        }
      } else {
        // Create new post
        const { success, error } = await createPost(postData);
        
        if (success) {
          toast.success("Post created", {
            description: "Your new post has been published."
          });
          await fetchPosts();
          setActiveTab('posts');
        } else {
          toast.error("Failed to create post", {
            description: error?.message || "Please try again later."
          });
        }
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post", {
        description: "Please try again later."
      });
    }
  };
  
  // Handle answering questions
  const handleAnswerQuestion = (question: any) => {
    setEditingQuestion(question);
    questionForm.reset({
      answer: question.answer || '',
    });
    setActiveTab('answer-question');
  };
  
  const onSubmitQuestionAnswer = async (data: { answer: string }) => {
    if (!editingQuestion) return;
    
    try {
      const { success, error } = await answerQuestion(editingQuestion.id, data.answer);
      
      if (success) {
        toast.success("Answer submitted", {
          description: "Your answer has been published."
        });
        await fetchQuestions();
        setEditingQuestion(null);
        setActiveTab('questions');
      } else {
        toast.error("Failed to submit answer", {
          description: error?.toString() || "Please try again later."
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer", {
        description: "Please try again later."
      });
    }
  };
  
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    
    try {
      const { success, error } = await deleteQuestion(questionId);
      
      if (success) {
        toast.success("Question deleted", {
          description: "The question has been permanently removed."
        });
        await fetchQuestions();
      } else {
        toast.error("Failed to delete question", {
          description: error?.toString() || "Please try again later."
        });
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question", {
        description: "Please try again later."
      });
    }
  };
  
  // Handle roadmap funding updates
  const handleUpdateFunding = async () => {
    const amount = parseFloat(fundingAmount);
    if (isNaN(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      const { success, error } = await updateFundingAmount(amount);
      
      if (success) {
        toast.success("Funding updated", {
          description: "Roadmap funding amount has been updated."
        });
        setFundingAmount("");
      } else {
        toast.error("Failed to update funding", {
          description: error?.toString() || "Please try again later."
        });
      }
    } catch (error) {
      console.error("Error updating funding:", error);
      toast.error("Failed to update funding", {
        description: "Please try again later."
      });
    }
  };
  
  if (loading) {
    return (
      <Layout requireAuth>
        <div className="container flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-xl text-gamedev-text">Loading admin panel...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!isAdmin) {
    return null; // Navigate already triggered
  }
  
  return (
    <Layout requireAuth>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gamedev-primary">Admin Panel</h1>
          <Button onClick={handleCreateNewPost}>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="posts">Manage Posts</TabsTrigger>
            <TabsTrigger value="editor">Post Editor</TabsTrigger>
            <TabsTrigger value="questions">Q&A Management</TabsTrigger>
            <TabsTrigger value="answer-question">Answer Question</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts">
            <div className="bg-black rounded-md shadow border border-gray-800">
              <Table dark>
                <TableHeader dark>
                  <TableRow dark>
                    <TableHead dark>Title</TableHead>
                    <TableHead dark>Category</TableHead>
                    <TableHead dark>Access Level</TableHead>
                    <TableHead dark>Status</TableHead>
                    <TableHead dark className="w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody dark>
                  {posts.map(post => (
                    <TableRow dark key={post.id}>
                      <TableCell dark className="font-medium">
                        <div className="truncate max-w-[300px]" title={post.title}>
                          {post.title}
                        </div>
                      </TableCell>
                      <TableCell dark>{post.category}</TableCell>
                      <TableCell dark>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.access_level === 'admin' 
                            ? 'bg-red-800 text-red-100' 
                            : post.access_level === 'patreon_premium'
                            ? 'bg-purple-800 text-purple-100'
                            : post.access_level === 'patreon_basic'
                            ? 'bg-blue-800 text-blue-100'
                            : 'bg-green-800 text-green-100'
                        }`}>
                          {post.access_level || 'user'}
                        </span>
                      </TableCell>
                      <TableCell dark>
                        {post.publish_at && new Date(post.publish_at) > new Date() ? (
                          <span className="text-amber-400">
                            Scheduled: {new Date(post.publish_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className={post.featured ? "text-emerald-400" : "text-gray-400"}>
                            {post.featured ? "Featured" : "Published"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell dark>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/post/${post.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {posts.length === 0 && (
                    <TableRow dark>
                      <TableCell dark colSpan={5} className="text-center py-8">
                        No posts found. Create a new one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="editor">
            <div className="bg-black rounded-md shadow p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-white">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h2>
              
              <Form {...postForm}>
                <form onSubmit={postForm.handleSubmit(onSubmitPost)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={postForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Post title" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={postForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gameplay">Gameplay</SelectItem>
                              <SelectItem value="art">Art</SelectItem>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="announcement">Announcement</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={postForm.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={postForm.control}
                      name="access_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Access Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select access level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Everyone</SelectItem>
                              <SelectItem value="patreon_basic">Patreon Basic</SelectItem>
                              <SelectItem value="patreon_premium">Patreon Premium</SelectItem>
                              <SelectItem value="admin">Admin Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={postForm.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Excerpt</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief summary of the post" 
                            className="h-20"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={postForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Full post content" 
                            className="h-64"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={postForm.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-white">Featured Post</FormLabel>
                            <p className="text-sm text-gray-400">
                              Display this post prominently on the homepage
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={postForm.control}
                      name="publish_at"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-white">Schedule Publication (Optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={
                                    !field.value ? "text-muted-foreground" : ""
                                  }
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    "Pick a date"
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => field.onChange(date)}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {field.value && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              className="mt-2"
                              onClick={() => field.onChange(null)}
                            >
                              Clear Date
                            </Button>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab('posts')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPost ? 'Update Post' : 'Create Post'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </TabsContent>
          
          <TabsContent value="questions">
            <div className="bg-black rounded-md shadow border border-gray-800">
              <Table dark>
                <TableHeader dark>
                  <TableRow dark>
                    <TableHead dark>User</TableHead>
                    <TableHead dark>Question</TableHead>
                    <TableHead dark>Status</TableHead>
                    <TableHead dark>Date</TableHead>
                    <TableHead dark className="w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody dark>
                  {questions.map(question => (
                    <TableRow dark key={question.id}>
                      <TableCell dark className="font-medium">
                        {question.profiles?.username || 'Anonymous'}
                      </TableCell>
                      <TableCell dark>
                        <div className="truncate max-w-[300px]" title={question.question}>
                          {question.question}
                        </div>
                      </TableCell>
                      <TableCell dark>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          question.answer ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'
                        }`}>
                          {question.answer ? 'Answered' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell dark>
                        {new Date(question.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell dark>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnswerQuestion(question)}
                          >
                            {question.answer ? 'Edit Answer' : 'Answer'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {questions.length === 0 && (
                    <TableRow dark>
                      <TableCell dark colSpan={5} className="text-center py-8">
                        No questions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="answer-question">
            <div className="bg-black rounded-md shadow p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-white">
                {editingQuestion?.answer ? 'Edit Answer' : 'Answer Question'}
              </h2>
              
              {editingQuestion && (
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onSubmitQuestionAnswer)} className="space-y-6">
                    <div className="bg-gray-900 p-4 rounded-md mb-4">
                      <p className="text-sm text-gray-400">
                        Question from {editingQuestion.profiles?.username || 'Anonymous'} - {new Date(editingQuestion.created_at).toLocaleDateString()}:
                      </p>
                      <p className="text-white mt-2">{editingQuestion.question}</p>
                    </div>
                    
                    <FormField
                      control={questionForm.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Your Answer</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Type your answer here..." 
                              className="h-64"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingQuestion(null);
                          setActiveTab('questions');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Submit Answer
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
              
              {!editingQuestion && (
                <div className="text-center py-8 text-gray-400">
                  No question selected. Please select a question to answer.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="roadmap">
            <div className="bg-black rounded-md shadow p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-white">
                Update Roadmap Progress
              </h2>
              
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">Current Funding Amount (USD)</label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Enter amount (e.g. 5000)" 
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                      />
                      <Button onClick={handleUpdateFunding}>Update</Button>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      This will update the progress bar on the roadmap page
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-medium text-white mb-2">Funding Milestones</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>$1,500 - Early Beta / Proof of Concept</li>
                      <li>$3,000 - Complete Soundtrack for Free</li>
                      <li>$5,000 - Behind the Scenes Videos</li>
                      <li>$7,500 - Guarantee of Project Completion</li>
                      <li>$10,000 - Project Completion</li>
                      <li>$12,500 - Steam Port, More Holos, Maps, and Content</li>
                      <li>$15,000 - More Content and Merchandise</li>
                      <li>$20,000 - Full Voice Acting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPanel;
