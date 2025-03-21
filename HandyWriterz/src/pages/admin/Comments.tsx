import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Check,
  X,
  Clock,
  Calendar
} from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { adminService, DashboardComment } from '@/services/adminService';

interface ExtendedComment extends DashboardComment {
  selected?: boolean;
}

const Comments: React.FC = () => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<ExtendedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [selectedComment, setSelectedComment] = useState<ExtendedComment | null>(null);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, we would get this from the API
        // For now, we're using mock data from fetchPendingComments and adding more variations
        const pendingComments = await adminService.fetchPendingComments(30);
        
        // Create additional mock comments with different statuses
        const mockComments: ExtendedComment[] = [
          ...pendingComments,
          ...pendingComments.map(comment => ({
            ...comment,
            id: `approved-${comment.id}`,
            status: 'approved' as const,
            createdAt: new Date(Date.now() - Math.random() * 10000000).toISOString()
          })),
          ...pendingComments.map(comment => ({
            ...comment,
            id: `rejected-${comment.id}`,
            status: 'rejected' as const,
            createdAt: new Date(Date.now() - Math.random() * 10000000).toISOString()
          }))
        ];
        
        setComments(mockComments);
        // Initial filtering happens in the useEffect below
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, []);

  // Apply filters, search, and sorting
  useEffect(() => {
    let filtered = [...comments];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(comment => comment.status === statusFilter);
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        comment => 
          comment.content.toLowerCase().includes(searchLower) ||
          comment.author.name.toLowerCase().includes(searchLower) ||
          comment.postTitle.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredComments(filtered);
    
    // Calculate pagination
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    
    // Reset to first page if filters change
    if (page > 1) {
      setPage(1);
    }
  }, [comments, statusFilter, searchTerm, sortBy, itemsPerPage]);

  // Get paginated comments
  const paginatedComments = filteredComments.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (status: 'all' | 'pending' | 'approved' | 'rejected') => {
    setStatusFilter(status);
  };

  // Handle sort change
  const handleSortChange = (sort: 'newest' | 'oldest') => {
    setSortBy(sort);
  };

  // Handle single comment selection
  const handleSelectComment = (id: string) => {
    if (selectedComments.includes(id)) {
      setSelectedComments(selectedComments.filter(commentId => commentId !== id));
    } else {
      setSelectedComments([...selectedComments, id]);
    }
  };

  // Handle select all comments
  const handleSelectAll = () => {
    if (selectedComments.length === paginatedComments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(paginatedComments.map(comment => comment.id));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Open action modal
  const openActionModal = (action: 'approve' | 'reject' | 'delete', comment: ExtendedComment) => {
    setSelectedAction(action);
    setSelectedComment(comment);
    setIsActionModalOpen(true);
  };

  // Close action modal
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedAction(null);
    setSelectedComment(null);
  };

  // Execute action
  const executeAction = async () => {
    if (!selectedComment || !selectedAction) return;
    
    try {
      // In a real implementation, we would call the API
      let updatedComments = [...comments];
      
      switch (selectedAction) {
        case 'approve':
          updatedComments = updatedComments.map(comment => 
            comment.id === selectedComment.id 
              ? { ...comment, status: 'approved' as const } 
              : comment
          );
          break;
        case 'reject':
          updatedComments = updatedComments.map(comment => 
            comment.id === selectedComment.id 
              ? { ...comment, status: 'rejected' as const } 
              : comment
          );
          break;
        case 'delete':
          updatedComments = updatedComments.filter(comment => 
            comment.id !== selectedComment.id
          );
          break;
      }
      
      setComments(updatedComments);
      closeActionModal();
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  // Execute bulk action
  const executeBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    try {
      // In a real implementation, we would call the API
      let updatedComments = [...comments];
      
      switch (action) {
        case 'approve':
          updatedComments = updatedComments.map(comment => 
            selectedComments.includes(comment.id) 
              ? { ...comment, status: 'approved' as const } 
              : comment
          );
          break;
        case 'reject':
          updatedComments = updatedComments.map(comment => 
            selectedComments.includes(comment.id) 
              ? { ...comment, status: 'rejected' as const } 
              : comment
          );
          break;
        case 'delete':
          updatedComments = updatedComments.filter(comment => 
            !selectedComments.includes(comment.id)
          );
          break;
      }
      
      setComments(updatedComments);
      setSelectedComments([]);
    } catch (error) {
      console.error('Error executing bulk action:', error);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comments Management</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {selectedComments.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
                onClick={() => executeBulkAction('approve')}
                aria-label={`Approve ${selectedComments.length} comments`}
              >
                <CheckCircle size={14} />
                <span>Approve ({selectedComments.length})</span>
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
                onClick={() => executeBulkAction('reject')}
                aria-label={`Reject ${selectedComments.length} comments`}
              >
                <XCircle size={14} />
                <span>Reject ({selectedComments.length})</span>
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
                onClick={() => executeBulkAction('delete')}
                aria-label={`Delete ${selectedComments.length} comments`}
              >
                <Trash2 size={14} />
                <span>Delete ({selectedComments.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search comments..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <div className="text-gray-500 text-sm font-medium min-w-[60px]">Status:</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('all')}
                aria-label="Show all comments"
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === 'pending' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('pending')}
                aria-label="Show pending comments"
              >
                Pending
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === 'approved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('approved')}
                aria-label="Show approved comments"
              >
                Approved
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === 'rejected' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('rejected')}
                aria-label="Show rejected comments"
              >
                Rejected
              </button>
            </div>
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <div className="text-gray-500 text-sm font-medium min-w-[40px]">Sort:</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'newest' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleSortChange('newest')}
                aria-label="Sort by newest first"
              >
                Newest
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'oldest' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleSortChange('oldest')}
                aria-label="Sort by oldest first"
              >
                Oldest
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No comments found</h3>
            <p className="text-gray-500 max-w-md">
              {searchTerm 
                ? "No comments match your search criteria. Try changing your search or filters."
                : "There are no comments in this category."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={selectedComments.length === paginatedComments.length && paginatedComments.length > 0}
                          onChange={handleSelectAll}
                          aria-label={selectedComments.length === paginatedComments.length ? "Deselect all comments" : "Select all comments"}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedComments.map(comment => (
                    <tr key={comment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={selectedComments.includes(comment.id)}
                            onChange={() => handleSelectComment(comment.id)}
                            aria-label={selectedComments.includes(comment.id) ? `Deselect comment by ${comment.author.name}` : `Select comment by ${comment.author.name}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={comment.author.avatar || 'https://via.placeholder.com/40'}
                            alt={comment.author.name}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{comment.author.name}</div>
                            <p className="text-gray-700 line-clamp-2 text-sm mt-1">{comment.content}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium line-clamp-1">{comment.postTitle}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(comment.status)}`}>
                          {comment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(comment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {comment.status !== 'approved' && (
                            <IconButton
                              icon={<CheckCircle />}
                              label={`Approve comment by ${comment.author.name}`}
                              variant="primary"
                              size="sm"
                              onClick={() => openActionModal('approve', comment)}
                            />
                          )}
                          {comment.status !== 'rejected' && (
                            <IconButton
                              icon={<XCircle />}
                              label={`Reject comment by ${comment.author.name}`}
                              variant="danger"
                              size="sm"
                              onClick={() => openActionModal('reject', comment)}
                            />
                          )}
                          <IconButton
                            icon={<Trash2 />}
                            label={`Delete comment by ${comment.author.name}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => openActionModal('delete', comment)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                <div className="text-sm text-gray-500">
                  Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredComments.length)} of {filteredComments.length} comments
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNumber = idx + 1;
                    // Show limited page numbers with ellipsis for large page counts
                    if (
                      totalPages <= 7 ||
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1)
                    ) {
                      return (
                        <button
                          key={idx}
                          className={`h-8 w-8 rounded-lg text-sm ${
                            page === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                          onClick={() => setPage(pageNumber)}
                          aria-label={`Page ${pageNumber}`}
                          aria-current={page === pageNumber ? 'page' : undefined}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === 2 ||
                      pageNumber === totalPages - 1
                    ) {
                      return <span key={idx} className="text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Action Confirmation Modal */}
      {isActionModalOpen && selectedComment && selectedAction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold mb-4">
              {selectedAction === 'approve' && "Approve Comment"}
              {selectedAction === 'reject' && "Reject Comment"}
              {selectedAction === 'delete' && "Delete Comment"}
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={selectedComment.author.avatar || 'https://via.placeholder.com/40'}
                  alt={selectedComment.author.name}
                  className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <div className="font-medium text-gray-900">{selectedComment.author.name}</div>
                  <div className="text-gray-500 text-sm">{formatDate(selectedComment.createdAt)}</div>
                </div>
              </div>
              <p className="text-gray-700">{selectedComment.content}</p>
            </div>
            
            <p className="mb-6 text-gray-700">
              {selectedAction === 'approve' && "Are you sure you want to approve this comment? It will be visible on the post."}
              {selectedAction === 'reject' && "Are you sure you want to reject this comment? It will not be visible on the post."}
              {selectedAction === 'delete' && "Are you sure you want to delete this comment? This action cannot be undone."}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={closeActionModal}
                aria-label="Cancel action"
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : selectedAction === 'reject'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                onClick={executeAction}
                aria-label={`Confirm ${selectedAction} action`}
              >
                {selectedAction === 'approve' && <CheckCircle size={18} />}
                {selectedAction === 'reject' && <XCircle size={18} />}
                {selectedAction === 'delete' && <Trash2 size={18} />}
                <span>
                  {selectedAction === 'approve' && "Approve"}
                  {selectedAction === 'reject' && "Reject"}
                  {selectedAction === 'delete' && "Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments; 