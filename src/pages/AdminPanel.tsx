
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

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const navigate = useNavigate();

  // Form for creating/editing posts
  const form = useForm<{
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
        
        // Load posts
        await fetchPosts();
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
  
  const handleEdit = (post: Post) => {
    setEditingPost(post);
    form.reset({
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
  
  const handleDelete = async (postId: string) => {
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
  
  const handleCreateNew = () => {
    setEditingPost(null);
    form.reset({
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
  
  const onSubmit = async (data: any) => {
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
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="posts">Manage Posts</TabsTrigger>
            <TabsTrigger value="editor">Post Editor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts">
            <div className="bg-white rounded-md shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[300px]" title={post.title}>
                          {post.title}
                        </div>
                      </TableCell>
                      <TableCell>{post.category}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.access_level === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : post.access_level === 'patreon_premium'
                            ? 'bg-purple-100 text-purple-800'
                            : post.access_level === 'patreon_basic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {post.access_level || 'user'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {post.publish_at && new Date(post.publish_at) > new Date() ? (
                          <span className="text-orange-500">
                            Scheduled: {new Date(post.publish_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className={post.featured ? "text-emerald-600" : "text-slate-600"}>
                            {post.featured ? "Featured" : "Published"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
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
                            onClick={() => handleEdit(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {posts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No posts found. Create a new one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="editor">
            <div className="bg-white rounded-md shadow p-6">
              <h2 className="text-xl font-bold mb-6">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Post title" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
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
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="access_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Level</FormLabel>
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
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
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
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
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
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Featured Post</FormLabel>
                            <p className="text-sm text-muted-foreground">
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
                      control={form.control}
                      name="publish_at"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Schedule Publication (Optional)</FormLabel>
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPanel;
