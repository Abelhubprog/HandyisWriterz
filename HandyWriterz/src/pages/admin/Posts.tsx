import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Pencil, Trash2, Eye, Plus, Filter, Search, ChevronDown, RefreshCw } from 'lucide-react';
import { FormLayout } from '@/components/ui/FormLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from 'react-hot-toast';
import { adminContentService, AdminContentFilter, type Post } from '@/services/adminContentService';

/**
 * Posts Management Component
 * Provides a comprehensive interface to manage all posts with filtering, search, and CRUD operations
 */
const Posts = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<AdminContentFilter>({
    status: undefined,
    service: undefined,
    category: undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  
  // Fetch posts with current filters
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        // Add pagination to filters
        const paginatedFilters = {
          ...filters,
          limit,
          offset: (page - 1) * limit
        };
        
        if (searchTerm) {
          paginatedFilters.search = searchTerm;
        }
        
        const response = await adminContentService.getPosts(paginatedFilters);
        setPosts(response.posts);
        setTotalPosts(response.total);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  }, [filters, page, limit, searchTerm]);

  // Status variations for the UI
  const statusVariants: Record<string, Parameters<typeof StatusBadge>[0]['variant']> = {
    published: 'success',
    draft: 'warning',
    scheduled: 'info',
    archived: 'default'
  };

  // Table columns configuration
  const columns: DataTableColumn<Post>[] = [
    {
      header: 'Title',
      key: 'title',
      render: (post) => (
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-400" />
          <div>
            <div className="font-medium">{post.title}</div>
            <div className="text-sm text-gray-500 line-clamp-1">
              {post.excerpt}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Author',
      key: 'author',
      render: (post) => (
        <div>
          <div className="font-medium">{post.author.name}</div>
          <div className="text-sm text-gray-500 truncate max-w-[150px]">
            {post.author.id}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (post) => (
        <StatusBadge variant={statusVariants[post.status] || 'default'}>
          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </StatusBadge>
      )
    },
    {
      header: 'Service',
      key: 'service',
      render: (post) => (
        <span className="text-sm font-medium">{post.service}</span>
      )
    },
    {
      header: 'Date',
      key: 'date',
      render: (post) => (
        <div className="space-y-1 text-sm">
          {post.publishedAt ? (
            <div>
              Published:
              <span className="ml-1 text-gray-900">
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            </div>
          ) : post.scheduledFor ? (
            <div>
              Scheduled:
              <span className="ml-1 text-blue-600">
                {new Date(post.scheduledFor).toLocaleDateString()}
              </span>
            </div>
          ) : null}
          <div>
            Updated:
            <span className="ml-1 text-gray-900">
              {new Date(post.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Stats',
      key: 'stats',
      align: 'right',
      render: (post) => (
        <div className="text-right">
        <div className="font-medium">
            {post.stats?.views?.toLocaleString() || 0} views
          </div>
          <div className="text-sm text-gray-500">
            {post.stats?.likes?.toLocaleString() || 0} likes · {post.stats?.comments?.toLocaleString() || 0} comments
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (post) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(post)}
            title="View post"
            aria-label={`View ${post.title}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(post)}
            title="Edit post"
            aria-label={`Edit ${post.title}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(post.id)}
            title="Delete post"
            aria-label={`Delete ${post.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  const handleDeleteClick = (postId: string) => {
    setSelectedPostId(postId);
    setIsDeleteDialogOpen(true);
  };

  const handleView = (post: Post) => {
    // Open the post in a new tab using the post URL
    window.open(`/services/${post.service.toLowerCase()}/${post.slug}`, '_blank');
  };

  const handleEdit = (post: Post) => {
    navigate(`/admin/content/posts/edit/${post.id}`);
  };

  const handleDelete = async () => {
    if (!selectedPostId) return;
    
    try {
      await adminContentService.deletePost(selectedPostId);
      setPosts(posts.filter(post => post.id !== selectedPostId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedPostId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (key: keyof AdminContentFilter, value: any) => {
    setFilters({
      ...filters,
      [key]: value === 'all' ? undefined : value
    });
    setPage(1); // Reset to first page when filter changes
  };

  const handleCreatePost = () => {
    navigate('/admin/content/posts/new');
  };

  const handleRefresh = () => {
    // Reset search but keep filters
    setSearchTerm('');
    
    // Re-fetch with current filters
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const paginatedFilters = {
          ...filters,
          limit,
          offset: (page - 1) * limit
        };
        
        const response = await adminContentService.getPosts(paginatedFilters);
        setPosts(response.posts);
        setTotalPosts(response.total);
        toast.success('Posts refreshed');
      } catch (error) {
        console.error('Error refreshing posts:', error);
        toast.error('Failed to refresh posts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  };

  return (
    <FormLayout
      title="Posts"
      description="Manage all content posts"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
            />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Status</label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Service</label>
                    <Select
                      value={filters.service || 'all'}
                      onValueChange={(value) => handleFilterChange('service', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All services</SelectItem>
                        <SelectItem value="adult-health-nursing">Adult Health</SelectItem>
                        <SelectItem value="mental-health-nursing">Mental Health</SelectItem>
                        <SelectItem value="child-nursing">Child Nursing</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Sort by</label>
                    <Select
                      value={`${filters.sortBy || 'updatedAt'}-${filters.sortOrder || 'desc'}`}
                      onValueChange={(value) => {
                        const [sortBy, sortOrder] = value.split('-');
                        setFilters({
                          ...filters,
                          sortBy,
                          sortOrder: sortOrder as 'asc' | 'desc'
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updatedAt-desc">Last updated (newest)</SelectItem>
                        <SelectItem value="updatedAt-asc">Last updated (oldest)</SelectItem>
                        <SelectItem value="publishedAt-desc">Publish date (newest)</SelectItem>
                        <SelectItem value="publishedAt-asc">Publish date (oldest)</SelectItem>
                        <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                        <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              title="Refresh posts"
              aria-label="Refresh posts"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleCreatePost} className="gap-1">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={posts}
          isLoading={isLoading}
          pagination={{
            page,
            pageSize: limit,
            totalItems: totalPosts,
            onPageChange: setPage,
            onPageSizeChange: setLimit,
          }}
          emptyState={{
            title: 'No posts found',
            description: 'Create your first post to get started.',
            action: {
              label: 'Create Post',
              onClick: handleCreatePost,
            },
          }}
        />
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormLayout>
  );
};

export default Posts;