import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Filter, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Calendar,
  Clock,
  Star,
  MoreHorizontal,
  CheckSquare,
  Copy
} from 'lucide-react';
import { databases, DATABASE_ID, POSTS_COLLECTION_ID } from '@/lib/appwriteClient';
import { Query } from 'appwrite';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { formatDistance } from 'date-fns';

// Post type definition
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  service: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

// Status badge component
const StatusBadge: React.FC<{ status: Post['status'] }> = ({ status }) => {
  const statusStyles = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    archived: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Main PostsList component
const PostsList: React.FC = () => {
  const { user, checkRole } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [serviceFilter, setServiceFilter] = useState(searchParams.get('service') || 'all');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [sortField, setSortField] = useState(searchParams.get('sort') || 'updatedAt');
  const [sortDirection, setSortDirection] = useState(searchParams.get('dir') || 'desc');
  
  const POSTS_PER_PAGE = 10;
  
  // Services list (should be fetched from API in a real app)
  const services = [
    { id: 'adult-health-nursing', name: 'Adult Health Nursing' },
    { id: 'child-nursing', name: 'Child Nursing' },
    { id: 'mental-health-nursing', name: 'Mental Health Nursing' },
    { id: 'crypto', name: 'Cryptocurrency' }
  ];

  // Fetch posts with filters
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = [];
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        filters.push(Query.equal('status', statusFilter));
      }
      
      if (serviceFilter && serviceFilter !== 'all') {
        filters.push(Query.equal('service', serviceFilter));
      }
      
      if (searchQuery) {
        filters.push(Query.search('title', searchQuery));
      }
      
      // Get total count first (without pagination)
      const countResponse = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        filters
      );
      
      setTotalPosts(countResponse.total);
      
      // Add pagination and sorting
      const offset = (currentPage - 1) * POSTS_PER_PAGE;
      filters.push(Query.limit(POSTS_PER_PAGE));
      filters.push(Query.offset(offset));
      
      // Add sorting
      if (sortDirection === 'asc') {
        filters.push(Query.orderAsc(sortField));
      } else {
        filters.push(Query.orderDesc(sortField));
      }
      
      // Fetch posts with all filters
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        filters
      );
      
      // Format posts
      const formattedPosts = response.documents.map(doc => ({
        id: doc.$id,
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt || '',
        service: doc.service,
        category: doc.category,
        tags: doc.tags || [],
        status: doc.status,
        author: {
          id: doc.author?.$id || doc.authorId,
          name: doc.author?.name || 'Unknown',
          avatar: doc.author?.avatar || '/placeholder-avatar.jpg'
        },
        publishedAt: doc.publishedAt,
        scheduledFor: doc.scheduledFor,
        createdAt: doc.createdAt || doc.$createdAt,
        updatedAt: doc.updatedAt || doc.$updatedAt,
        featured: doc.featured || false,
        stats: {
          views: doc.viewsCount || 0,
          likes: doc.likesCount || 0,
          comments: doc.commentsCount || 0,
          shares: doc.sharesCount || 0
        }
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, serviceFilter, sortDirection, sortField, statusFilter]);

  // Update URL when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (serviceFilter !== 'all') params.service = serviceFilter;
    if (currentPage > 1) params.page = currentPage.toString();
    if (sortField !== 'updatedAt') params.sort = sortField;
    if (sortDirection !== 'desc') params.dir = sortDirection;
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, statusFilter, serviceFilter, currentPage, sortField, sortDirection, setSearchParams]);

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (!checkRole('admin') || selectedPosts.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`)) {
      setIsDeleting(true);
      
      try {
        // In a real app, you'd probably want to batch these requests
        for (const postId of selectedPosts) {
          await databases.deleteDocument(
            DATABASE_ID,
            POSTS_COLLECTION_ID,
            postId
          );
        }
        
        // Refresh posts after deletion
        fetchPosts();
        setSelectedPosts([]);
      } catch (error) {
        console.error('Error deleting posts:', error);
        alert('An error occurred while deleting posts. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle bulk status change
  const handleBulkStatusChange = async (newStatus: Post['status']) => {
    if (!checkRole('editor') || selectedPosts.length === 0) return;
    
    try {
      for (const postId of selectedPosts) {
        await databases.updateDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId,
          { status: newStatus }
        );
      }
      
      // Refresh posts after update
      fetchPosts();
      setSelectedPosts([]);
    } catch (error) {
      console.error('Error updating posts:', error);
      alert('An error occurred while updating posts. Please try again.');
    }
  };

  // Toggle post selection
  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  // Select/deselect all posts
  const toggleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  };

  // Delete a single post
  const handleDeletePost = async (postId: string) => {
    if (!checkRole('admin')) return;
    
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          postId
        );
        
        // Refresh posts after deletion
        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('An error occurred while deleting the post. Please try again.');
      }
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold">Posts</h2>
          <Link 
            to="/admin/content/posts/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add New Post
          </Link>
        </div>
        
        {/* Filters and search */}
        <div className="mt-6 flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col md:flex-row gap-4 lg:flex-1">
            <div className="w-full md:w-1/3">
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label htmlFor="serviceFilter" className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                id="serviceFilter"
                value={serviceFilter}
                onChange={(e) => {
                  setServiceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by service"
              >
                <option value="all">All Services</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label htmlFor="sortOptions" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex">
                <select
                  id="sortOptions"
                  value={sortField}
                  onChange={(e) => {
                    setSortField(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Sort field"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Date Created</option>
                  <option value="publishedAt">Date Published</option>
                  <option value="title">Title</option>
                  <option value="viewsCount">Views</option>
                </select>
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100"
                  aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/3">
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <form onSubmit={handleSearch} className="flex">
              <input
                id="searchQuery"
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search posts"
              />
              <button
                type="submit"
                className="p-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100"
                aria-label="Search"
              >
                <Search size={18} className="text-gray-600" />
              </button>
            </form>
          </div>
        </div>
        
        {/* Bulk actions */}
        {selectedPosts.length > 0 && (
          <div className="mt-4 flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">{selectedPosts.length} posts selected</span>
            <div className="flex-grow"></div>
            <div className="flex gap-2">
              {checkRole('editor') && (
                <>
                  <button
                    onClick={() => handleBulkStatusChange('published')}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={isDeleting}
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('draft')}
                    className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    disabled={isDeleting}
                  >
                    Set as Draft
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('archived')}
                    className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                    disabled={isDeleting}
                  >
                    Archive
                  </button>
                </>
              )}
              {checkRole('admin') && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Posts table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length > 0 && selectedPosts.length === posts.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded"
                    aria-label="Select all posts"
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Loading posts...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No posts found. {searchQuery && 'Try a different search term.'}
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="h-4 w-4 text-blue-600 rounded"
                      aria-label={`Select ${post.title}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      to={`/admin/content/posts/edit/${post.id}`} 
                      className="font-medium text-blue-600 hover:text-blue-900"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">{post.excerpt}</p>
                    {post.featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                        <Star size={12} className="mr-1" />
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.name} 
                        className="h-8 w-8 rounded-full mr-2"
                      />
                      <div className="text-sm font-medium text-gray-900">{post.author.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{post.service}</div>
                    <div className="text-xs text-gray-500">{post.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {post.status === 'published' ? (
                        <>
                          <Calendar size={12} className="inline mr-1" />
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                        </>
                      ) : post.status === 'scheduled' ? (
                        <>
                          <Clock size={12} className="inline mr-1" />
                          {new Date(post.scheduledFor || '').toLocaleDateString()}
                        </>
                      ) : (
                        <>
                          <Calendar size={12} className="inline mr-1" />
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistance(new Date(post.updatedAt), new Date(), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span title="Views">
                        <Eye size={14} className="inline mr-1" />
                        {post.stats.views}
                      </span>
                      <span title="Comments">
                        <MessageSquare size={14} className="inline mr-1" />
                        {post.stats.comments}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/services/${post.service}/${post.slug}`}
                        target="_blank"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View post"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/admin/content/posts/edit/${post.id}`}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit post"
                      >
                        <Edit size={16} />
                      </Link>
                      {checkRole('admin') && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{Math.min((currentPage - 1) * POSTS_PER_PAGE + 1, totalPosts)}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * POSTS_PER_PAGE, totalPosts)}</span> of{' '}
            <span className="font-medium">{totalPosts}</span> posts
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Display pages around current page
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }
              
              if (pageToShow <= totalPages) {
                return (
                  <button
                    key={pageToShow}
                    onClick={() => setCurrentPage(pageToShow)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageToShow
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label={`Page ${pageToShow}`}
                  >
                    {pageToShow}
                  </button>
                );
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsList;
