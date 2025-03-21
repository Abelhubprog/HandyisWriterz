import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Tag, 
  Share2, 
  Bookmark, 
  ThumbsUp, 
  MessageSquare, 
  ChevronRight, 
  Search,
  ArrowLeft,
  ArrowRight,
  Filter,
  ChevronDown,
  Heart,
  ExternalLink,
  FileText,
  Play,
  Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';
import DatabaseService from '@/services/databaseService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

// Types
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  featuredImage: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  likes: number;
  comments: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  service: string;
}

interface ServiceBlogTemplateProps {
  defaultIcon: React.ReactNode;
  serviceName?: string;
  serviceColor?: string;
  serviceDescription?: string;
}

const ServiceBlogTemplate: React.FC<ServiceBlogTemplateProps> = ({ 
  defaultIcon, 
  serviceName = "Service", 
  serviceColor = "from-blue-600 to-purple-600",
  serviceDescription = "Expert resources, insights, and support for your academic journey."
}) => {
  const { slug } = useParams<{ slug?: string }>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const postsPerPage = 6;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories for this service
        const fetchedCategories = await DatabaseService.fetchCategories();
        const serviceCategories = fetchedCategories.filter(cat => cat.service === serviceName.toLowerCase());
        setCategories(serviceCategories);

        // Fetch posts
        const allPosts = await DatabaseService.fetchPosts();
        const servicePosts = allPosts.filter(post => post.service === serviceName.toLowerCase());
        
        // Sort by date
        servicePosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        setPosts(servicePosts);
        setFeaturedPosts(servicePosts.slice(0, 3));

        // Extract popular tags
        const tagsCount = servicePosts.flatMap(post => post.tags)
          .reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

        const sortedTags = Object.entries(tagsCount)
          .sort((a, b) => b[1] - a[1])
          .map(([tag]) => tag)
          .slice(0, 10);

        setPopularTags(sortedTags);
        setTotalPages(Math.ceil(servicePosts.length / postsPerPage));

        // Handle selected post if slug is present
        if (slug) {
          const post = servicePosts.find(p => p.slug === slug);
          if (post) {
            setSelectedPost(post);
            const related = servicePosts
              .filter(p => p.id !== post.id && (
                p.category === post.category || 
                p.tags.some(tag => post.tags.includes(tag))
              ))
              .sort(() => 0.5 - Math.random())
              .slice(0, 3);
            setRelatedPosts(related);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, serviceName]);

  // Filter posts based on search query and active category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === 'all' || post.category.toLowerCase().replace(/\s+/g, '-') === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Paginated posts
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage, 
    currentPage * postsPerPage
  );

  // Handle category change
  const handleCategoryChange = async (categorySlug: string) => {
    setActiveCategory(categorySlug);
    setCurrentPage(1);
    
    try {
      // If selecting a specific category, update posts
      if (categorySlug !== 'all') {
        const category = categories.find(c => c.slug === categorySlug);
        if (category) {
          const posts = await DatabaseService.fetchPosts();
          const categoryPosts = posts.filter(post => 
            post.service === serviceName.toLowerCase() && 
            post.category === category.name
          );
          setPosts(categoryPosts);
        }
      } else {
        // Reset to all posts for this service
        const allPosts = await DatabaseService.fetchPosts();
        const servicePosts = allPosts.filter(post => 
          post.service === serviceName.toLowerCase()
        );
        setPosts(servicePosts);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Render content based on whether a post is selected or not
  const renderContent = () => {
    if (selectedPost) {
      return (
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-blue-600 transition-colors">{serviceName}</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-700 font-medium">{selectedPost.title}</span>
          </div>
          
          {/* Post header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-xs font-medium bg-gradient-to-r ${serviceColor} text-white rounded-full`}>
                {selectedPost.category}
              </span>
              <div className="flex items-center text-gray-500 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(selectedPost.publishedAt)}
              </div>
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                {selectedPost.readTime} min read
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {selectedPost.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={selectedPost.author.avatar} 
                alt={selectedPost.author.name} 
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <div className="font-medium">{selectedPost.author.name}</div>
                <div className="text-sm text-gray-500">{selectedPost.author.role}</div>
              </div>
            </div>
          </div>
          
          {/* Featured image */}
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            {selectedPost.mediaType === 'video' ? (
              <div className="relative h-96 bg-gray-900 flex items-center justify-center">
                <Play className="h-16 w-16 text-white opacity-80" />
                <img 
                  src={selectedPost.featuredImage} 
                  alt={selectedPost.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
              </div>
            ) : selectedPost.mediaType === 'audio' ? (
              <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center px-6">
                <div className="absolute inset-0 opacity-20 bg-pattern-waveform"></div>
                <Volume2 className="h-12 w-12 text-white absolute left-10" />
                <div className="w-full max-w-xl">
                  <div className="h-16 bg-white/20 rounded-lg backdrop-blur-sm"></div>
                </div>
              </div>
            ) : (
              <img 
                src={selectedPost.featuredImage} 
                alt={selectedPost.title} 
                className="w-full h-auto"
              />
            )}
          </div>
          
          {/* Content */}
          <div className="prose prose-lg max-w-none mb-10" dangerouslySetInnerHTML={{ __html: selectedPost.content }}></div>
          
          {/* Tags */}
          <div className="mb-10">
            <div className="text-sm font-medium mb-3">Tags:</div>
            <div className="flex flex-wrap gap-2">
              {selectedPost.tags.map(tag => (
                <Link 
                  to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}`} 
                  key={tag}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Engagement */}
          <div className="flex justify-between items-center border-t border-b border-gray-200 py-4 mb-10">
            <div className="flex gap-6">
              <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                <ThumbsUp className="h-5 w-5" />
                <span>{selectedPost.likes}</span>
              </button>
              <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
                <MessageSquare className="h-5 w-5" />
                <span>{selectedPost.comments}</span>
              </button>
            </div>
            <div className="flex gap-3">
              <button className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(post => (
                  <Link 
                    to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`} 
                    key={post.id}
                    className="group"
                  >
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="text-sm text-gray-500 mb-2">{formatDate(post.publishedAt)}</div>
                        <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Back button */}
          <div className="mb-10">
            <Link 
              to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all posts
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <>
        {/* Featured posts section */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  key={post.id}
                  className={`relative ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
                >
                  <Link 
                    to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`}
                    className="block relative h-full group"
                  >
                    <div className={`relative rounded-xl overflow-hidden ${
                      index === 0 ? 'aspect-[16/9] lg:aspect-[16/10]' : 'aspect-[4/3]'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10"></div>
                      <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                        <div className={`px-3 py-1 text-xs font-medium bg-gradient-to-r ${serviceColor} text-white rounded-full inline-block mb-3 w-fit`}>
                          {post.category}
                        </div>
                        <h3 className={`font-bold text-white mb-2 ${
                          index === 0 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
                        }`}>
                          {post.title}
                        </h3>
                        {index === 0 && (
                          <p className="text-white/80 mb-3 line-clamp-2">{post.excerpt}</p>
                        )}
                        <div className="flex items-center text-white/70 text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(post.publishedAt)}
                          <span className="mx-2">•</span>
                          <Clock className="h-4 w-4 mr-1" />
                          {post.readTime} min read
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Filtering and search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Category: {activeCategory === 'all' ? 'All' : categories.find(c => c.id === activeCategory)?.name || 'All'}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {/* Dropdown menu */}
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden">
                  <div className="p-2">
                    <button 
                      onClick={() => handleCategoryChange('all')}
                      className={`w-full text-left px-3 py-2 rounded-md ${activeCategory === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                    >
                      All Categories
                    </button>
                    {categories.map(category => (
                      <button 
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${activeCategory === category.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                      >
                        <span>{category.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{category.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentView('grid')} 
                  className={`p-2 rounded-md ${currentView === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setCurrentView('list')} 
                  className={`p-2 rounded-md ${currentView === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSearch} className="relative flex-grow max-w-md">
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </form>
          </div>
        </div>

        {/* Posts grid/list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(null).map((_, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">No posts found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset filters
            </button>
          </div>
        ) : currentView === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((post, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={post.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
              >
                <Link to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`}>
                  <div className="relative h-48 overflow-hidden">
                    {post.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="h-12 w-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                    {post.mediaType === 'audio' && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="h-12 w-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Volume2 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                    <img 
                      src={post.featuredImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 text-xs font-medium bg-gradient-to-r ${serviceColor} text-white rounded-full`}>
                        {post.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-xl mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <img 
                          src={post.author.avatar} 
                          alt={post.author.name} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium">{post.author.name}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime} min
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedPosts.map((post, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={post.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow group"
              >
                <Link 
                  to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`}
                  className="md:w-1/3 relative"
                >
                  <div className="relative aspect-video md:aspect-auto md:h-full overflow-hidden">
                    {post.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="h-12 w-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                    {post.mediaType === 'audio' && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="h-12 w-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Volume2 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                    <img 
                      src={post.featuredImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <div className="p-6 md:w-2/3">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-xs font-medium bg-gradient-to-r ${serviceColor} text-white rounded-full`}>
                      {post.category}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(post.publishedAt)}
                    </div>
                  </div>
                  <Link to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`}>
                    <h3 className="font-bold text-xl mb-3 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.name} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium">{post.author.name}</div>
                        <div className="text-xs text-gray-500">{post.author.role}</div>
                      </div>
                    </div>
                    <Link 
                      to={`/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                    >
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      currentPage === pageNum 
                        ? `bg-gradient-to-r ${serviceColor} text-white` 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <header className={`relative py-16 md:py-24 ${isLoading || (!isLoading && !selectedPost) ? 'mb-12' : 'mb-0'} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className={`h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white`}>
                {defaultIcon}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{serviceName}</h1>
            <p className="text-xl text-white/80">{serviceDescription}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content area */}
          <div className={`w-full ${selectedPost ? 'lg:w-full' : 'lg:w-2/3'}`}>
            {renderContent()}
          </div>

          {/* Sidebar (only shown on blog listing, not on single post) */}
          {!selectedPost && (
            <div className="w-full lg:w-1/3 space-y-6">
              {/* Categories widget */}
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold mb-4">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={() => handleCategoryChange('all')}
                      className={`w-full text-left flex justify-between items-center p-2 rounded-lg ${
                        activeCategory === 'all' 
                          ? `bg-gradient-to-r ${serviceColor} text-white`
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>All Categories</span>
                      <span className={`text-xs ${activeCategory === 'all' ? 'bg-white/20' : 'bg-gray-100'} px-2 py-1 rounded-full`}>
                        {posts.length}
                      </span>
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category.id}>
                      <button 
                        onClick={() => handleCategoryChange(category.id)}
                        className={`w-full text-left flex justify-between items-center p-2 rounded-lg ${
                          activeCategory === category.id 
                            ? `bg-gradient-to-r ${serviceColor} text-white`
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span>{category.name}</span>
                        <span className={`text-xs ${activeCategory === category.id ? 'bg-white/20' : 'bg-gray-100'} px-2 py-1 rounded-full`}>
                          {category.count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular tags widget */}
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resources widget */}
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${serviceColor} flex items-center justify-center text-white`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-blue-600 transition-colors">Free Templates</div>
                        <div className="text-sm text-gray-500">Download study resources</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${serviceColor} flex items-center justify-center text-white`}>
                        <Play className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-blue-600 transition-colors">Video Tutorials</div>
                        <div className="text-sm text-gray-500">Watch helpful guides</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-r ${serviceColor} flex items-center justify-center text-white`}>
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-blue-600 transition-colors">External Resources</div>
                        <div className="text-sm text-gray-500">Useful academic links</div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact widget */}
              <div className={`rounded-xl p-6 bg-gradient-to-r ${serviceColor} text-white`}>
                <h3 className="text-lg font-bold mb-4">Need Help?</h3>
                <p className="mb-4">Our team of experts is ready to assist you with your academic needs.</p>
                <Link 
                  to="/contact"
                  className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                >
                  Contact Us
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ServiceBlogTemplate;