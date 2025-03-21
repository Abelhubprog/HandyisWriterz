import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  Tag,
  Search,
  ArrowUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import useLocalStorage from '@/hooks/useLocalStorage';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  category: string;
  tags: string[];
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  published_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  likes_count: number;
  comments_count: number;
  read_time: number;
}

interface ServicePageProps {
  serviceType: string;
  serviceName: string;
  serviceDescription: string;
}

const ServicePageTemplate: React.FC<ServicePageProps> = ({ 
  serviceType, 
  serviceName,
  serviceDescription 
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { ref: loadMoreRef, inView } = useInView();
  const POSTS_PER_PAGE = 10;
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Local storage for anonymous likes
  const [anonymousLikes, setAnonymousLikes] = useLocalStorage<string[]>('anonymousLikes', []);
  
  // Initialize liked posts from local storage
  useEffect(() => {
    const initLikedPosts: Record<string, boolean> = {};
    anonymousLikes.forEach(postId => {
      initLikedPosts[postId] = true;
    });
    setLikedPosts(initLikedPosts);
  }, [anonymousLikes]);
  
  // Scroll listener for the back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          excerpt,
          cover_image,
          category,
          tags,
          status,
          views,
          created_at,
          updated_at,
          published_at,
          author:profiles(id, full_name, avatar_url),
          likes_count:likes(count),
          comments_count:comments(count),
          read_time
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range((pageNum - 1) * POSTS_PER_PAGE, pageNum * POSTS_PER_PAGE - 1);
      
      // Add service type filter if provided
      if (serviceType) {
        query = query.eq('category', serviceType);
      }
      
      // Add search query if provided
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
        
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Process data to handle nested joins from supabase
      const processedData = data.map(post => {
        // Handle the nested author data
        let authorData = post.author;
        if (Array.isArray(authorData)) {
          authorData = authorData[0] || null;
        }
        
        // Handle counts
        let likesCount = 0;
        if (Array.isArray(post.likes_count)) {
          likesCount = post.likes_count.length;
        } else if (typeof post.likes_count === 'object' && post.likes_count.count) {
          likesCount = post.likes_count.count;
        }
        
        let commentsCount = 0;
        if (Array.isArray(post.comments_count)) {
          commentsCount = post.comments_count.length;
        } else if (typeof post.comments_count === 'object' && post.comments_count.count) {
          commentsCount = post.comments_count.count;
        }
        
        return {
          ...post,
          author: authorData,
          likes_count: likesCount,
          comments_count: commentsCount
        };
      });
      
      // Update post view count
      processedData.forEach(async (post) => {
        await supabase
          .from('posts')
          .update({ views: post.views + 1 })
          .eq('id', post.id);
          
        // Also record the view in the analytics table
        await supabase.rpc('record_post_view', { 
          post_id: post.id,
          is_unique: !localStorage.getItem(`viewed_${post.id}`)
        });
        
        // Mark as viewed in local storage
        localStorage.setItem(`viewed_${post.id}`, 'true');
      });
      
      if (pageNum === 1) {
        setPosts(processedData);
      } else {
        setPosts(prev => [...prev, ...processedData]);
      }
      
      setHasMore(processedData.length === POSTS_PER_PAGE);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [serviceType, searchQuery, POSTS_PER_PAGE]);

  // Initial posts load
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);
  
  // Load more posts when reaching the bottom and inView becomes true
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(prev => prev + 1);
      fetchPosts(page + 1);
    }
  }, [inView, hasMore, isLoading, fetchPosts, page]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(1);
  };
  
  // Handle likes
  const handleLike = async (postId: string) => {
    // If already liked, do nothing
    if (likedPosts[postId]) return;
    
    try {
      // Update UI optimistically
      setLikedPosts(prev => ({ ...prev, [postId]: true }));
      
      // If user is logged in, record the like in the database
      if (user) {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
          
        if (error) {
          // If there's an error, revert the optimistic update
          setLikedPosts(prev => ({ ...prev, [postId]: false }));
          console.error('Error recording like:', error);
          toast.error('Failed to like the post');
          return;
        }
      } else {
        // For anonymous users, store like in local storage
        setAnonymousLikes(prev => [...prev, postId]);
      }
      
      // Update the post's likes count in the UI
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1 } 
            : post
        )
      );
      
      // Always increment the like count in the database for analytics
      await supabase.rpc('increment_likes', { post_id: postId });
      
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert optimistic update
      setLikedPosts(prev => ({ ...prev, [postId]: false }));
      toast.error('Failed to like the post');
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>{serviceName} | HandyWriterz</title>
        <meta name="description" content={serviceDescription} />
        <meta name="keywords" content={`${serviceName}, academic writing, professional services, handywriterz`} />
        <meta property="og:title" content={`${serviceName} | HandyWriterz`} />
        <meta property="og:description" content={serviceDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${serviceName} | HandyWriterz`} />
        <meta name="twitter:description" content={serviceDescription} />
      </Helmet>
      
      <div className="bg-gray-50 min-h-screen pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {serviceName}
              </motion.h1>
              <motion.p 
                className="text-xl text-blue-100 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {serviceDescription}
              </motion.p>
              
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                <form onSubmit={handleSearch} className="flex">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles..."
                      className="w-full px-6 py-4 pl-12 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-800 hover:bg-indigo-900 text-white px-6 py-4 rounded-r-lg font-medium transition duration-200"
                  >
                    Search
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
      </div>

        {/* Content Area */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Post Grid */}
            <div className="space-y-10">
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    {post.cover_image && (
                      <div className="relative h-56 md:h-64 w-full overflow-hidden">
                        <img 
                          src={post.cover_image} 
                          alt={post.title}
                          className="w-full h-full object-cover transition duration-500 hover:scale-105"
          />
        </div>
      )}

                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-center text-sm text-gray-500 mb-3 gap-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className="hidden md:inline">•</span>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{post.read_time || 5} min read</span>
                        </div>
                        <span className="hidden md:inline">•</span>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>{post.author?.full_name || 'HandyWriterz'}</span>
                        </div>
                      </div>
                      
                      <Link to={`/services/${serviceType}/blog/${post.id}`}>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition duration-200">
                          {post.title}
                        </h2>
                      </Link>
                      
                      <p className="text-gray-600 mb-6">
                        {post.excerpt || post.content.substring(0, 180)}...
                      </p>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {post.tags.map(tag => (
                            <span 
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-100 gap-4">
                        <div className="flex space-x-4">
                          <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-1 text-sm ${likedPosts[post.id] ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} transition duration-200`}
                            disabled={likedPosts[post.id]}
                            aria-label={likedPosts[post.id] ? "Already liked" : "Like this post"}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{post.likes_count || 0}</span>
                          </button>
                          
                          <Link 
                            to={`/services/${serviceType}/blog/${post.id}#comments`}
                            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition duration-200"
                            aria-label="View comments"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.comments_count || 0}</span>
                          </Link>
                          
          <button
                            onClick={() => {
                              const url = `${window.location.origin}/services/${serviceType}/blog/${post.id}`;
                              navigator.clipboard.writeText(url);
                              toast.success('Link copied to clipboard!');
                            }}
                            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition duration-200"
                            aria-label="Share this post"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
          </button>
                        </div>
                        
                        <Link 
                          to={`/services/${serviceType}/blog/${post.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Read More
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center my-10">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            )}
            
            {/* Empty state */}
            {!isLoading && posts.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-2xl font-medium text-gray-900 mb-4">No posts found</h3>
                <p className="text-gray-600 mb-8">There are no published posts in this category yet.</p>
              </div>
            )}
            
            {/* Load more trigger */}
            {hasMore && !isLoading && (
              <div ref={loadMoreRef} className="h-10 mt-8" />
            )}
            
            {/* No more posts indicator */}
            {!hasMore && posts.length > 0 && !isLoading && (
              <div className="text-center text-gray-500 mt-10 pb-4">
                <p>No more posts to load</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Back to top button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition duration-200 z-50"
              onClick={scrollToTop}
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
    </div>
    </>
  );
};

export default ServicePageTemplate; 