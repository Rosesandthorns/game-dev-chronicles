import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById } from '@/services/postService';
import { getPostComments, createComment, deleteComment } from '@/services/commentService';
import { Post } from '@/lib/types';
import { Comment } from '@/services/commentService';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import CategoryTag from '@/components/CategoryTag';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/sonner';
import { CalendarIcon, MessageSquare, Trash2 } from 'lucide-react';

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    async function loadPostAndComments() {
      if (!postId) return;
      
      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([
          getPostById(postId),
          getPostComments(postId)
        ]);
        
        if (!postData) {
          toast.error("Post not found", {
            description: "The post you're looking for may not exist or you don't have permission to view it."
          });
          navigate('/');
          return;
        }
        
        setPost(postData);
        setComments(commentsData);
      } catch (error) {
        console.error("Error loading post:", error);
        toast.error("Failed to load post", {
          description: "Please try again later."
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadPostAndComments();
  }, [postId, navigate]);
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !commentContent.trim()) return;
    
    try {
      setSubmitting(true);
      const { success, error } = await createComment(postId, commentContent);
      
      if (success) {
        toast.success("Comment added", {
          description: "Your comment has been published."
        });
        setCommentContent('');
        
        // Refresh comments
        const commentsData = await getPostComments(postId);
        setComments(commentsData);
      } else {
        toast.error("Failed to add comment", {
          description: error?.message || "Please try again later."
        });
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to add comment", {
        description: "Please try again later."
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    
    try {
      const { success, error } = await deleteComment(commentId);
      
      if (success) {
        toast.success("Comment deleted", {
          description: "The comment has been removed."
        });
        
        // Update comments list
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        toast.error("Failed to delete comment", {
          description: error?.message || "Please try again later."
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment", {
        description: "Please try again later."
      });
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-3/4 bg-gamedev-muted/30 rounded"></div>
            <div className="h-64 w-full bg-gamedev-muted/30 rounded"></div>
            <div className="h-32 w-full bg-gamedev-muted/30 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!post) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
          <p className="text-gamedev-muted mb-6">The post you're looking for may not exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Post Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CategoryTag category={post.category} />
            <div className="flex items-center text-gamedev-muted text-sm">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {formatDistanceToNow(new Date(post.date), { addSuffix: true })}
            </div>
            {post.publish_at && new Date(post.publish_at) > new Date() && (
              <span className="text-sm text-orange-500 font-medium">
                Scheduled for {new Date(post.publish_at).toLocaleDateString()}
              </span>
            )}
            {post.access_level && post.access_level !== 'user' && (
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                post.access_level === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : post.access_level === 'patreon_supporter' || post.access_level === 'patreon_founder'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {post.access_level.replace('_', ' ')}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gamedev-primary">{post.title}</h1>
          
          {post.image && (
            <div className="w-full h-64 md:h-80 overflow-hidden rounded-lg mb-8">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-8">
            {post.author.avatar && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gamedev-primary/30">
                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-gamedev-muted">{post.author.role}</p>
            </div>
          </div>
        </div>
        
        {/* Post Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-lg font-medium text-gamedev-text/90 mb-6">{post.excerpt}</p>
          <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />
        </div>
        
        {/* Comments Section */}
        <div className="border-t border-gamedev-muted/30 pt-8">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Comments ({comments.length})
          </h3>
          
          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="mb-3 min-h-[100px]"
                required
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </form>
          ) : (
            <Card className="mb-8">
              <CardContent className="py-4 text-center">
                <p className="mb-2">Sign in to leave a comment</p>
                <Button onClick={() => navigate('/auth')}>Sign In</Button>
              </CardContent>
            </Card>
          )}
          
          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gamedev-muted text-center py-8">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {comment.author?.avatar_url && (
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img 
                              src={comment.author.avatar_url} 
                              alt={comment.author.username} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{comment.author?.username || 'Anonymous'}</p>
                          <p className="text-xs text-gamedev-muted">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Delete button - show for admins or comment owner */}
                      {(user && (user.id === comment.user_id)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 p-0 h-auto"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gamedev-text whitespace-pre-wrap">{comment.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostDetail;
