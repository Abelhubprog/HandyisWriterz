import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ThumbsUp, 
  MessageSquare, 
  Calendar, 
  Clock, 
  ChevronDown,
  Loader2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Helmet } from 'react-helmet-async';
// Import the React Query hooks
import { usePosts, useCategories, usePostLike, Post } from '@/hooks/usePostQueries';

interface BlogPostsListProps {
  serviceType?: string;
  limit?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showHeader?: boolean;
  className?: string;
}

const BlogPostsList: React.FC<BlogPostsListProps> = ({
  serviceType: propServiceType,
  limit = 12,
  showFilters = true,
  showSearch = true,
  showHeader = true,
  className = ''
}) => {
  const { serviceType: paramServiceType } = useParams<{ serviceType: string }>();
  const serviceType = propServiceType || paramServiceType;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'created_at' | 'likes_count' | 'views_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [anonymousLikes, setAnonymousLikes] = useLocalStorage<string[]>('anonymousLikes', []);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  // Format service type for display
  const formatServiceType = (type: string) => {
    if (!type) return '';
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Use React Query to fetch posts
  const { 
    data: posts = [], 
    isLoading, 
    isError, 
    error, 
    isFetching,
    isPreviousData,
    refetch
  } = usePosts({
    limit,
    offset: (page - 1) * limit,
    serviceType,
    searchQuery: debouncedSearchQuery,
    categoryId,
    sortBy,
    sortOrder
  });
  
  // Use React Query to fetch categories
  const { 
    data: categories = [], 
    isLoading: categoriesLoading 
  } = useCategories();
  
  // Use React Query to handle post likes
  const { mutate: likePost } = usePostLike();
  
  // Filter categories by service type
  const filteredCategories = categories.filter(
    cat => !serviceType || cat.service_type === serviceType
  );
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to first page on new search
      setAllPosts([]); // Clear posts for new search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Accumulate posts for infinite scrolling
  useEffect(() => {
    if (posts && posts.length > 0) {
      if (page === 1) {
        setAllPosts(posts);
      } else {
        // Avoid duplicates by checking IDs
        setAllPosts(prev => {
          const newPosts = posts.filter(
            post => !prev.some(p => p.id === post.id)
          );
          return [...prev, ...newPosts];
        });
      }
    }
  }, [posts, page]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (isFetching) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isPreviousData && posts.length === limit) {
        setPage(prev => prev + 1);
      }
    });
    
    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [isFetching, isPreviousData, posts, limit]);
  
  // Handle filter changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategoryId(value === 'all' ? undefined : Number(value));
    setPage(1);
    setAllPosts([]);
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === 'newest') {
      setSortBy('created_at');
      setSortOrder('desc');
    } else if (value === 'oldest') {
      setSortBy('created_at');
      setSortOrder('asc');
    } else if (value === 'popular') {
      setSortBy('views_count');
      setSortOrder('desc');
    } else if (value === 'most_liked') {
      setSortBy('likes_count');
      setSortOrder('desc');
    }
    
    setPage(1);
    setAllPosts([]);
  };
  
  // Handle anonymous likes
  const handleLike = (postId: number) => {
    const postIdString = postId.toString();
    const isLiked = anonymousLikes.includes(postIdString);
    
    if (isLiked) {
      // Currently not supporting unlike for anonymous users
      return;
    }
    
    // Update local storage
    setAnonymousLikes(prev => [...prev, postIdString]);
    
    // Call the API
    likePost({ postId, isAnonymous: true });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };
  
  return (
    <div className={`w-full ${className}`}>
      {showHeader && (
        <Helmet>
          <title>{formatServiceType(serviceType || '')} Blog | HandyWriterz</title>
          <meta 
            name="description" 
            content={`Explore our ${formatServiceType(serviceType || '')} blog posts and articles. Get insights, tips, and expert advice.`} 
          />
        </Helmet>
      )}
      
      {showHeader && (
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {formatServiceType(serviceType || '')} Blog
          </h1>
          <p className="text-gray-600">
            Explore our latest articles, insights, and resources
          </p>
        </div>
      )}
      
      {/* Filters and Search */}
      {(showFilters || showSearch) && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {showSearch && (
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          )}
          
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={categoryId || 'all'}
                  onChange={handleCategoryChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-label="Filter by category"
                  disabled={categoriesLoading}
                >
                  <option value="all">All Categories</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={sortBy === 'created_at' 
                    ? (sortOrder === 'desc' ? 'newest' : 'oldest') 
                    : (sortBy === 'views_count' ? 'popular' : 'most_liked')}
                  onChange={handleSortChange}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-label="Sort posts by"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Viewed</option>
                  <option value="most_liked">Most Liked</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Error Message */}
      {isError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'Failed to load posts. Please try again later.'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {allPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full"
            >
              {/* Post Image */}
              {post.cover_image && (
                <Link to={`/services/${serviceType}/post/${post.id}`} className="block h-48 overflow-hidden">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </Link>
              )}
              
              {/* Post Content */}
              <div className="p-5 flex-grow flex flex-col">
                {/* Category */}
                {post.category && (
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-2">
                    {post.category.name}
                  </span>
                )}
                
                {/* Title */}
                <Link to={`/services/${serviceType}/post/${post.id}`} className="block">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors duration-200">
                    {post.title}
                  </h2>
                </Link>
                
                {/* Excerpt */}
                <p className="text-gray-600 mb-4 flex-grow">
                  {post.excerpt || post.title}
                </p>
                
                {/* Post Meta */}
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <div className="flex items-center mr-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{5} min read</span>
                  </div>
                </div>
                
                {/* Engagement Stats */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center focus:outline-none"
                      aria-label={`Like this post (${post.likes_count} likes)`}
                    >
                      <ThumbsUp 
                        className={`h-4 w-4 mr-1 ${
                          anonymousLikes.includes(post.id.toString()) 
                            ? 'text-blue-600 fill-current' 
                            : 'text-gray-500'
                        }`} 
                      />
                      <span className="text-sm text-gray-500">{post.likes_count || 0}</span>
                    </button>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-500">{post.comments_count || 0}</span>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/services/${serviceType}/post/${post.id}`}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Read more
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Loading Indicator */}
      {(isLoading || isFetching) && (
        <div className="flex justify-center mt-8">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}
      
      {/* No Results */}
      {!isLoading && !isFetching && allPosts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <AlertCircle className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">No posts found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {debouncedSearchQuery 
              ? `No posts matching "${debouncedSearchQuery}" were found.` 
              : 'No posts are available for this category.'}
          </p>
          {debouncedSearchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear search
            </button>
          )}
        </div>
      )}
      
      {/* Infinite Scroll Trigger */}
      {!isLoading && !isFetching && posts.length === limit && <div ref={loadingRef} className="h-10" />}
    </div>
  );
};

export default BlogPostsList; 