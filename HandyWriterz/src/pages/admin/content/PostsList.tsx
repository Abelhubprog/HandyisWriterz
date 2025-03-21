import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Edit, Trash2, Eye, Search, 
  Filter, ArrowUpDown, Plus, RefreshCw 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Post } from '@/types/admin';
import DatabaseService from '@/services/databaseService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import PostStatusBadge from '@/components/Admin/PostStatusBadge';
import Pagination from '@/components/Common/Pagination';
import TableSkeleton from '@/components/Skeletons/TableSkeleton';

/**
 * PostsList Component
 * 
 * Displays a list of all posts with advanced filtering, sorting, and real-time updates.
 * Provides actions for creating, editing, viewing, and deleting posts.
 */
const PostsList: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Post; direction: 'asc' | 'desc' }>({
    key: 'updatedAt',
    direction: 'desc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data fetching with pagination
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, total } = await DatabaseService.fetchPosts({
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction
      });
      setPosts(data);
      setFilteredPosts(data);
      setTotalPages(Math.ceil(total / 10));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, statusFilter, searchTerm, sortConfig]);

  // Initial data load
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          // Only refresh if the change affects the current view
          if (payload.eventType === 'INSERT') {
            fetchPosts();
          } else if (payload.eventType === 'UPDATE') {
            // Update in-place if the post is in the current view
            setPosts(prev => 
              prev.map(post => post.id === payload.new.id ? payload.new as Post : post)
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove from current view if deleted
            setPosts(prev => 
              prev.filter(post => post.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel);
    };
  }, [user, fetchPosts]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPosts();
  };

  // Sorting handler
  const handleSort = (key: keyof Post) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Delete post with confirmation
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      await DatabaseService.deletePost(id);
      toast.success('Post deleted successfully');
      
      // Update local state to remove deleted post
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error('Failed to delete post');
    }
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof Post) => {
    if (sortConfig.key !== key) return null;
    
    return (
      <span className={`inline-block ml-1 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`}>
        ▼
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Posts</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              className="px-3 py-2 border rounded-md bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-gray-900 bg-white border rounded-md"
              aria-label="Refresh posts"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <Link
              to="/admin/content/posts/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>New Post</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-4">
          <TableSkeleton rows={5} columns={6} />
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mb-4 text-gray-400">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No posts found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first post'}
          </p>
          <Link
            to="/admin/content/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Post
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Title {getSortIndicator('title')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('author')}
                  >
                    <div className="flex items-center">
                      Author {getSortIndicator('author')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Created {getSortIndicator('createdAt')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center">
                      Updated {getSortIndicator('updatedAt')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {post.featuredImage && (
                          <img
                            src={post.featuredImage}
                            alt=""
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div className="truncate max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{post.title}</div>
                          <div className="text-sm text-gray-500 truncate">/blog/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PostStatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {post.author.avatar && (
                          <img 
                            src={post.author.avatar} 
                            alt="" 
                            className="h-6 w-6 rounded-full mr-2"
                          />
                        )}
                        <span className="text-sm text-gray-900">{post.author.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          to={`/admin/content/posts/edit/${post.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          aria-label={`Edit ${post.title}`}
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={`Delete ${post.title}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                          aria-label={`View ${post.title}`}
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostsList;
