import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServicePage } from '@/types/admin';
import DatabaseService from '@/services/databaseService';
import TableSkeleton from '@/components/Skeletons/TableSkeleton';
import ErrorBoundary from '@/components/Common/ErrorBoundary';
import { useDebounce } from '@/hooks/useDebounce';

const ServicePagesManager: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<ServicePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Memoized load pages function with debounce
  const debouncedLoadPages = useDebounce(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DatabaseService.fetchServicePages();
      setPages(data);
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to load service pages:', error);
      setError('Failed to load service pages');
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          debouncedLoadPages();
        }, Math.pow(2, retryCount) * 1000);
      }
    } finally {
      setLoading(false);
    }
  }, 500);

  // Memoize the subscription callback
  const handleRealtimeUpdate = useCallback((payload: any) => {
    // Handle different real-time events
    if (payload.eventType === 'INSERT') {
      setPages(prev => [...prev, payload.new as ServicePage]);
    } else if (payload.eventType === 'UPDATE') {
      setPages(prev => prev.map(page => 
        page.id === payload.new.id ? payload.new as ServicePage : page
      ));
    } else if (payload.eventType === 'DELETE') {
      setPages(prev => prev.filter(page => page.id !== payload.old.id));
    }
  }, []);

  useEffect(() => {
    debouncedLoadPages();

    const channel = DatabaseService.supabase
      .channel('service_pages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_pages'
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      DatabaseService.supabase.removeChannel(channel);
    };
  }, [debouncedLoadPages, handleRealtimeUpdate]);

  // Memoized handlers
  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service page? This action cannot be undone.')) {
      return;
    }

    try {
      await DatabaseService.deleteServicePage(id);
      toast.success('Service page deleted successfully');
    } catch (error) {
      console.error('Failed to delete service page:', error);
      toast.error('Failed to delete service page');
    }
  }, []);

  const handleReorder = useCallback(async (id: string, direction: 'up' | 'down') => {
    if (reordering) return;

    setReordering(true);
    try {
      const currentIndex = pages.findIndex(page => page.id === id);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= pages.length) return;

      const updatedPages = [...pages];
      const [movedPage] = updatedPages.splice(currentIndex, 1);
      updatedPages.splice(newIndex, 0, movedPage);

      await DatabaseService.updateServicePagesOrder(
        updatedPages.map((page, index) => ({
          id: page.id,
          order: index
        }))
      );

      setPages(updatedPages);
      toast.success('Page order updated successfully');
    } catch (error) {
      console.error('Failed to reorder pages:', error);
      toast.error('Failed to update page order');
    } finally {
      setReordering(false);
    }
  }, [pages, reordering]);

  const handleTogglePublish = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      await DatabaseService.updateServicePage(id, {
        published: !currentStatus
      });
      toast.success(`Page ${currentStatus ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Failed to update page status:', error);
      toast.error('Failed to update page status');
    }
  }, []);

  // Memoized empty state
  const EmptyState = useMemo(() => (
    <div className="text-center py-12">
      <h3 className="mt-2 text-sm font-medium text-gray-900">No service pages</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by creating your first service page.</p>
      <div className="mt-6">
        <button
          onClick={() => navigate('/admin/services/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add New Page
        </button>
      </div>
    </div>
  ), [navigate]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading service pages">
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Pages</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              {retryCount < 3 && (
                <button
                  onClick={debouncedLoadPages}
                  className="mt-2 text-red-800 underline hover:text-red-900"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
      <div className="bg-white rounded-lg shadow" role="region" aria-label="Service Pages Manager">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900" id="service-pages-title">Service Pages</h2>
              <p className="mt-1 text-sm text-gray-500" id="service-pages-description">
                Manage your service pages, their order, and publication status
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/services/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Add new service page"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add New Page
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table 
            className="min-w-full divide-y divide-gray-200"
            aria-labelledby="service-pages-title service-pages-description"
          >
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page, index) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReorder(page.id, 'up')}
                        disabled={index === 0 || reordering}
                        className={`p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                        }`}
                        aria-label={`Move ${page.title} up`}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleReorder(page.id, 'down')}
                        disabled={index === pages.length - 1 || reordering}
                        className={`p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          index === pages.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                        }`}
                        aria-label={`Move ${page.title} down`}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{page.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublish(page.id, page.published)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        page.published
                          ? 'bg-green-100 text-green-800 focus:ring-green-500'
                          : 'bg-gray-100 text-gray-800 focus:ring-gray-500'
                      }`}
                      aria-label={`${page.published ? 'Unpublish' : 'Publish'} ${page.title}`}
                    >
                      {page.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/admin/services/edit/${page.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label={`Edit ${page.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        aria-label={`Delete ${page.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages.length === 0 && EmptyState}
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(ServicePagesManager);
