import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiCalendar,
  FiClock,
  FiCheck, 
  FiAlertCircle,
  FiFileText
} from 'react-icons/fi';
import { contentService } from '@/services/contentService';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast/use-toast';
import { formatServiceName } from '@/utils/formatters';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  contentBlocks?: Array<{
    type: string;
    content: string;
    language?: string;
    level?: number;
    caption?: string;
    url?: string;
  }>;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  service: string;
  category: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  featuredImage: string | null;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  featured?: boolean;
  stats?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

const ContentList: React.FC = () => {
  const { service } = useParams<{ service?: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState(service || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [services, setServices] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string; name: string; service: string}[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const limit = 10;

  useEffect(() => {
    // If we have a service from the URL params, set it as the filter
    if (service) {
      setServiceFilter(service);
    }
    
    fetchPosts();
    fetchFilters();
  }, [page, serviceFilter, categoryFilter, statusFilter, search, service]);

  const fetchFilters = async () => {
    try {
      // Get available service types from our user's database
      const { data: serviceData } = await supabase
        .from('posts')
        .select('service_type')
        .is('service_type', 'not.null');
      
      if (serviceData) {
        // Include default service types
        const defaultServices = [
          'adult-health-nursing',
          'mental-health-nursing',
          'child-nursing',
          'crypto',
          'ai'
        ];
        
        const dbServices = Array.from(
          new Set(serviceData.map(item => item.service_type))
        ).filter(Boolean) as string[];
        
        const combinedServices = Array.from(
          new Set([...dbServices, ...defaultServices])
        ).sort();
        
        setServices(combinedServices);
      }

      // Get categories, filtered by service if a service is selected
      const categoryData = await contentService.getCategories(serviceFilter);
      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await contentService.getPosts({
        page,
        limit,
        service: serviceFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined
      });
      
      setPosts(result.posts);
      setTotalPages(Math.ceil(result.total / limit));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      try {
        await contentService.deletePost(id);
        toast({
          title: 'Content deleted',
          description: 'The content has been successfully deleted.',
        });
        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete content. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleClearFilters = () => {
    setSearch('');
    // Don't clear service filter if we're on a service-specific page
    if (!service) {
    setServiceFilter('');
    }
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheck className="mr-1 h-3 w-3" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FiFileText className="mr-1 h-3 w-3" />
            Draft
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FiClock className="mr-1 h-3 w-3" />
            Scheduled
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiAlertCircle className="mr-1 h-3 w-3" />
            Archived
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Determine the appropriate "create new" link based on context
  const getCreateNewLink = () => {
    if (service) {
      return `/admin/services/${service}/new`;
    }
    return "/admin/content/new";
  };

  // Get the appropriate title based on context
  const getTitle = () => {
    if (service) {
      return `${formatServiceName(service)} Content`;
    }
    return "Content Management";
  };

  // Get the appropriate description based on context
  const getDescription = () => {
    if (service) {
      return `Manage, edit, and create content for ${formatServiceName(service)}`;
    }
    return "Manage, edit, and create new content";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {getDescription()}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to={getCreateNewLink()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Create New
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Filters</h2>
          <button
            onClick={handleClearFilters}
            className="mt-2 sm:mt-0 text-sm text-blue-600 hover:text-blue-800"
            aria-label="Clear all filters"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Only show service filter if not on a service-specific page */}
          {!service && (
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                id="service"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={serviceFilter}
                onChange={(e) => {
                  setServiceFilter(e.target.value);
                  setCategoryFilter(''); // Reset category when service changes
                  setPage(1);
                }}
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {formatServiceName(service)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
              </label>
              <select
              id="category"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              >
                <option value="">All Categories</option>
                {categories
                  .filter(cat => !serviceFilter || cat.service === serviceFilter)
                  .map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
              </label>
              <select
              id="status"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
                      </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <form onSubmit={handleSearchSubmit}>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
            </div>

      {/* Content Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service/Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                    </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading content...</p>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center">
                    <p className="text-sm text-gray-500">No content found.</p>
                    <p className="mt-1 text-sm text-gray-500">
                      <Link to={getCreateNewLink()} className="text-blue-600 hover:text-blue-800">
                        Create your first content
                      </Link>
                    </p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  // Determine the correct edit link based on context
                  const editLink = service 
                    ? `/admin/services/${service}/${post.id}`
                    : `/admin/content/${post.id}`;

                  return (
                  <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {post.excerpt}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatServiceName(post.service)}</div>
                        <div className="text-sm text-gray-500">{post.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {post.author.avatar ? (
                              <img className="h-8 w-8 rounded-full" src={post.author.avatar} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {post.author.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{post.author.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(post.status)}
                        {post.status === 'scheduled' && post.scheduledFor && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <FiCalendar className="mr-1 h-3 w-3" />
                            {formatDate(post.scheduledFor)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.status === 'published' 
                          ? formatDate(post.publishedAt) 
                          : formatDate(post.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {post.status === 'published' && (
                            <Link
                              to={`/${post.service}/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900"
                            title="View on site"
                          >
                            <FiEye className="h-5 w-5" />
                            </Link>
                          )}
                          <Link
                            to={editLink}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                  </tr>
                  );
                })
              )}
              </tbody>
            </table>
        </div>

        {/* Pagination */}
            {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                  page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                  page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> pages
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    // Show pages around the current page
                    let pageNum = page - 2 + i;
                    if (pageNum <= 0) pageNum = i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentList; 