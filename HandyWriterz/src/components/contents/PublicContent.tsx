import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Helmet } from 'react-helmet-async';
import { 
  Loader2, 
  Search,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Eye,
  Clock,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Plus,
  X,
  Book,
  Filter,
  ExternalLink
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { shimmer } from '@/utils/shimmer';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

// Number of posts to fetch per page
const POSTS_PER_PAGE = 10;

interface Post {
  id: string | number;
  title: string;
  content: string;
  author: string;
  author_id?: string;
  category: string;
  created_at: string;
  updated_at?: string;
  status: 'draft' | 'published' | 'archived';
  service_type: string;
  metadata?: {
    views?: number;
    likes?: number;
    comments?: number;
    reading_time?: string;
  };
  resource_links?: string[];
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface PublicContentProps {
  serviceType: string;
  serviceName: string;
  serviceDescription: string;
}

const PublicContent: React.FC<PublicContentProps> = ({
  serviceType,
  serviceName,
  serviceDescription,
}) => {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showPostDetails, setShowPostDetails] = useState<Post | null>(null);
  
  // For infinite scrolling with Intersection Observer
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  const fetchPosts = async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      console.log(`Fetching page ${pageNum} for service type: ${serviceType}`);

      // Fetch posts with pagination
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          author,
          author_id,
          category,
          created_at,
          updated_at,
          status,
          service_type,
          metadata,
          resource_links,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('service_type', serviceType)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * POSTS_PER_PAGE, pageNum * POSTS_PER_PAGE - 1);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      // Fetch categories if initial load
      if (isInitial) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('posts')
          .select('category')
          .eq('service_type', serviceType)
          .eq('status', 'published');

        if (!categoriesError && categoriesData) {
          const uniqueCategories = [...new Set(categoriesData.map(item => item.category))];
          setCategories(uniqueCategories);
        }
      }

      // Update posts state
      if (isInitial) {
        setPosts(postsData || []);
      } else {
        setPosts(prev => [...prev, ...(postsData || [])]);
      }

      // Check if there are more posts to load
      setHasMore((postsData?.length || 0) === POSTS_PER_PAGE);
      
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content. Please try again later.');
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchPosts(1, true);
  }, [serviceType]);

  // Trigger load more when scrolled to bottom
  useEffect(() => {
    if (inView && !loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [inView, loading, loadingMore, hasMore]);

  // Filter posts based on search term and category
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        post.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

  // Get formatted date
  const getFormattedDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Loading state UI
  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              onClick={() => {
                setPage(1);
                fetchPosts(1, true);
              }}
              className="mt-4 w-full"
              variant="destructive"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {/* SEO Optimization */}
      <Helmet>
        <title>{serviceName} | HandyWriterz Academic Services</title>
        <meta name="description" content={serviceDescription} />
        <meta property="og:title" content={`${serviceName} | HandyWriterz`} />
        <meta property="og:description" content={serviceDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${serviceName} | HandyWriterz`} />
        <meta name="twitter:description" content={serviceDescription} />
        <link rel="canonical" href={`https://handywriterz.com/services/${serviceType}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{serviceName}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{serviceDescription}</p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input 
              placeholder="Search content..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search content"
            />
          </div>
          
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* No results message */}
        {filteredPosts.length === 0 && !loading && (
          <div className="text-center py-20">
            <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">No content found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all' ? 
                'Try adjusting your search or filters' : 
                `We're working on adding content for ${serviceName}`}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {getFormattedDate(post.created_at)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {post.metadata?.reading_time || '5 min read'}
                  </span>
                </div>
                
                <CardTitle className="text-xl font-semibold hover:text-blue-600 transition-colors">
                  {post.title}
                </CardTitle>
                
                <CardDescription className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-1" />
                  {post.profiles?.full_name || post.author || 'HandyWriterz Team'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <p className="text-gray-600 line-clamp-3 mb-3">{post.content.replace(/<[^>]*>?/gm, '')}</p>
                
                {post.resource_links && post.resource_links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.resource_links.slice(0, 2).map((resource, index) => (
                      <span key={index} className="inline-flex items-center text-xs text-blue-600">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {resource}
                      </span>
                    ))}
                    {post.resource_links.length > 2 && (
                      <span className="text-xs text-blue-600">+{post.resource_links.length - 2} more</span>
                    )}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex items-center justify-between pt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {post.category}
                </span>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {post.metadata?.views || 0}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {post.metadata?.comments || 0}
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="text-blue-600 p-0 hover:bg-transparent hover:text-blue-800"
                  onClick={() => setShowPostDetails(post)}
                >
                  Read more
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Load more indicator */}
        {hasMore && filteredPosts.length > 0 && (
          <div 
            ref={ref}
            className="flex justify-center items-center py-8 mt-6"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-gray-600">Loading more...</span>
              </div>
            ) : (
              <div className="h-10" />
            )}
          </div>
        )}

        {/* End of content message */}
        {!hasMore && filteredPosts.length > 0 && !loadingMore && (
          <div className="text-center py-10 text-gray-500">
            You've reached the end of the content
          </div>
        )}

        {/* Post details dialog */}
        {showPostDetails && (
          <Dialog open={!!showPostDetails} onOpenChange={() => setShowPostDetails(null)}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{showPostDetails.title}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {getFormattedDate(showPostDetails.created_at)}
                  </span>
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {showPostDetails.profiles?.full_name || showPostDetails.author || 'HandyWriterz Team'}
                  </span>
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    {showPostDetails.category}
                  </span>
                </div>
              </DialogHeader>
              
              <div className="my-4">
                {showPostDetails.content.includes('<') && showPostDetails.content.includes('>') ? (
                  <div dangerouslySetInnerHTML={{ __html: showPostDetails.content }} />
                ) : (
                  <p className="whitespace-pre-line">{showPostDetails.content}</p>
                )}
              </div>
              
              {showPostDetails.resource_links && showPostDetails.resource_links.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Resources
                  </h4>
                  <ul className="space-y-2">
                    {showPostDetails.resource_links.map((resource, index) => (
                      <li key={index} className="flex items-center text-blue-600 hover:text-blue-800">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        <span>{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowPostDetails(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default PublicContent; 