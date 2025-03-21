import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Tag,
  Loader2,
  AlertCircle,
  Send,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
// Import React Query hooks
import { usePost, usePostBySlug, useIncrementPostView, usePostLike } from '@/hooks/usePostQueries';
import { useComments, useAddComment, useDeleteComment, Comment } from '@/hooks/useCommentQueries';

// BlogPostDetail component using React Query
const BlogPostDetail: React.FC = () => {
  const { postId, serviceType } = useParams<{ postId: string; serviceType: string }>();
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [anonymousLikes, setAnonymousLikes] = useLocalStorage<string[]>('anonymousLikes', []);
  
  // Fetch post data with React Query
  const {
    data: post,
    isLoading,
    isError,
    error,
  } = usePost(postId);
  
  // Fetch comments with React Query
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
  } = useComments(Number(postId));
  
  // Mutation hooks
  const { mutate: incrementView } = useIncrementPostView();
  const { mutate: likePost } = usePostLike();
  const { mutate: addComment, isLoading: isSubmittingComment } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();
  
  // Check if post is liked
  const isLiked = user 
    ? comments.some(c => c.author_id === user.id)
    : anonymousLikes.includes(postId || '');
  
  // Increment view count when component mounts
  React.useEffect(() => {
    if (postId) {
      // Check if this post has been viewed in this session
      const viewKey = `viewed_${postId}`;
      if (!localStorage.getItem(viewKey)) {
        incrementView(Number(postId));
        localStorage.setItem(viewKey, 'true');
      }
    }
  }, [postId, incrementView]);
  
  // Scroll to comments
  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle social sharing
  const handleShare = () => {
    if (navigator.share && post) {
      navigator
        .share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('Link copied to clipboard');
      });
    }
  };
  
  // Handle like
  const handleLike = async () => {
    if (!postId || isLiked) return;
    
    try {
      // Update local storage for anonymous users
      if (!user) {
        setAnonymousLikes(prev => [...prev, postId]);
      }
      
      // Call the API using React Query mutation
      likePost({ 
        postId: Number(postId), 
        isAnonymous: !user 
      });
      
    } catch (err) {
      console.error('Error liking post:', err);
      toast.error('Failed to like the post');
    }
  };
  
  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    try {
      // Call the API using React Query mutation
      addComment({ 
        postId: Number(postId), 
        content: newComment.trim() 
      }, {
        onSuccess: () => {
          setNewComment('');
          toast.success('Comment added successfully');
        },
        onError: (error) => {
          toast.error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    }
  };
  
  // Handle comment deletion
  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    
    try {
      // Call the API using React Query mutation
      deleteComment({ 
        commentId, 
        postId: Number(postId) 
      }, {
        onSuccess: () => {
          toast.success('Comment deleted successfully');
        },
        onError: (error) => {
          toast.error(`Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }
  
  // Error state
  if (isError || !post) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 w-full max-w-2xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Post not found</h3>
              <p className="mt-2 text-red-700">
                {error instanceof Error ? error.message : 'The post you are looking for does not exist or has been removed.'}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* SEO Metadata */}
      <Helmet>
        <title>{post.seo_title || post.title} | HandyWriterz</title>
        <meta name="description" content={post.seo_description || post.excerpt} />
        {post.seo_keywords && (
          <meta name="keywords" content={post.seo_keywords.join(', ')} />
        )}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to={`/services/${serviceType}/blog`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {serviceType?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Blog
        </Link>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cover Image */}
          {post.cover_image && (
            <div className="w-full h-64 md:h-96 overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6 md:p-8">
            {/* Category */}
            {post.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  {post.category?.name}
                </span>
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            
            {/* Post Meta */}
            <div className="flex flex-wrap items-center text-sm text-gray-600 mb-6">
              {/* Author */}
              {post.author && (
                <div className="flex items-center mr-6 mb-2">
                  <User className="h-4 w-4 mr-1" />
                  <span>By {post.author.full_name}</span>
                </div>
              )}
              
              {/* Date */}
              <div className="flex items-center mr-6 mb-2">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(post.created_at)}</span>
              </div>
              
              {/* Read Time */}
              <div className="flex items-center mr-6 mb-2">
                <Clock className="h-4 w-4 mr-1" />
                <span>{post.read_time || 5} min read</span>
              </div>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center mb-2">
                  <Tag className="h-4 w-4 mr-1" />
                  <span className="flex flex-wrap">
                    {post.tags.map((tag, index) => (
                      <span key={tag} className="mr-2">
                        {tag}{index < post.tags.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div 
              className="prose prose-lg max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            />
            
            {/* Engagement Actions */}
            <div className="flex justify-between items-center border-t border-b border-gray-200 py-4 my-8">
              <div className="flex items-center space-x-6">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1 ${isLiked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                  aria-label={isLiked ? 'Post liked' : 'Like this post'}
                >
                  <ThumbsUp className={isLiked ? 'fill-current' : ''} />
                  <span>{post.likes_count || 0}</span>
                </button>
                
                {/* Comment Button */}
                <button
                  onClick={scrollToComments}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                  aria-label="View comments"
                >
                  <MessageSquare />
                  <span>{post.comments_count || 0}</span>
                </button>
              </div>
              
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                aria-label="Share this post"
              >
                <Share2 />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
            
            {/* Comments Section */}
            <div ref={commentsRef}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
              
              {/* Comment Form */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  <div className="flex">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="px-4 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-600">
                    Please <Link to="/login" className="text-blue-600 hover:underline">log in</Link> to add a comment.
                  </p>
                </div>
              )}
              
              {/* Comments List */}
              <div className="space-y-6">
                {isCommentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-gray-50 p-4 rounded-md"
                      >
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            {comment.author?.avatar_url ? (
                              <img
                                src={comment.author.avatar_url}
                                alt={comment.author.full_name}
                                className="w-8 h-8 rounded-full mr-2"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">
                                {comment.author?.full_name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-900">
                                {comment.author?.full_name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Comment Actions (Delete) - Only for author or admin */}
                          {user && (user.id === comment.author_id || user.app_metadata?.roles?.includes('admin')) && (
                            <div className="relative group">
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Comment options"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Comment
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-gray-700 whitespace-pre-line">
                          {comment.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPostDetail; 