import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Loader,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Types
interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_image?: string;
  features: string[];
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  post_count?: number;
}

/**
 * ServicesList - Admin component for listing and managing service pages
 * 
 * This component allows admins to:
 * 1. View all service pages
 * 2. Create new service pages
 * 3. Edit existing service pages
 * 4. Delete service pages
 * 5. Toggle service visibility
 * 6. View service statistics
 * 
 * Accessibility features:
 * - ARIA labels on all interactive elements
 * - Proper heading hierarchy
 * - Enhanced keyboard navigation
 * - Focus management
 * - Semantic HTML
 * - Proper table semantics
 */
const ServicesList: React.FC = () => {
  const navigate = useNavigate();
  const modalCancelRef = useRef<HTMLButtonElement>(null);
  
  // State
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  
  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);
  
  // Focus management for modal
  useEffect(() => {
    if (isDeleteModalOpen && modalCancelRef.current) {
      modalCancelRef.current.focus();
    }
  }, [isDeleteModalOpen]);
  
  // Fetch services from Supabase
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (servicesError) throw servicesError;
      
      // Fetch post counts for each service
      const serviceIds = servicesData?.map(service => service.id) || [];
      const { data: postCountsData, error: postCountsError } = await supabase
        .from('posts')
        .select('service, count')
        .in('service', serviceIds)
        .group('service');
      
      if (postCountsError) throw postCountsError;
      
      // Combine data
      const servicesWithCounts = servicesData?.map(service => {
        const postCount = postCountsData?.find(pc => pc.service === service.id)?.count || 0;
        return { ...service, post_count: postCount };
      }) || [];
      
      setServices(servicesWithCounts);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to mock data for development
      generateMockServices();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate mock services for development
  const generateMockServices = () => {
    const mockServices: Service[] = [
      {
        id: '1',
        slug: 'adult-health-nursing',
        title: 'Adult Health Nursing',
        description: 'Expert writing services for adult health nursing students and professionals.',
        features: ['Research papers', 'Case studies', 'Evidence-based practice'],
        benefits: ['Save time', 'Improve grades', 'Learn from examples'],
        is_active: true,
        created_at: '2023-01-15T12:00:00Z',
        updated_at: '2023-06-20T15:30:00Z',
        post_count: 24
      },
      {
        id: '2',
        slug: 'mental-health-nursing',
        title: 'Mental Health Nursing',
        description: 'Specialized writing services for mental health nursing topics.',
        features: ['Literature reviews', 'Treatment plans', 'Theoretical frameworks'],
        benefits: ['Expert knowledge', 'Current research', 'APA formatting'],
        is_active: true,
        created_at: '2023-02-10T09:15:00Z',
        updated_at: '2023-07-05T11:45:00Z',
        post_count: 18
      },
      {
        id: '3',
        slug: 'social-work',
        title: 'Social Work',
        description: 'Professional writing services for social work students and practitioners.',
        features: ['Case analyses', 'Intervention strategies', 'Policy reviews'],
        benefits: ['Practical insights', 'Ethical considerations', 'Field-specific knowledge'],
        is_active: false,
        created_at: '2023-03-22T14:30:00Z',
        updated_at: '2023-05-18T10:20:00Z',
        post_count: 12
      },
      {
        id: '4',
        slug: 'nursing-education',
        title: 'Nursing Education',
        description: 'Academic writing services focused on nursing education and pedagogy.',
        features: ['Curriculum development', 'Teaching strategies', 'Assessment methods'],
        benefits: ['Educational theory', 'Practical applications', 'Current trends'],
        is_active: true,
        created_at: '2023-04-05T08:45:00Z',
        updated_at: '2023-08-12T16:10:00Z',
        post_count: 9
      }
    ];
    
    setServices(mockServices);
  };
  
  // Handle sort change
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Re-sort services
    const sortedServices = [...services].sort((a, b) => {
      const aValue = a[field as keyof Service];
      const bValue = b[field as keyof Service];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortDirection === 'asc' 
          ? (aValue === bValue ? 0 : aValue ? -1 : 1)
          : (aValue === bValue ? 0 : aValue ? 1 : -1);
      }
      
      return 0;
    });
    
    setServices(sortedServices);
  };
  
  // Handle keyboard events for sort buttons
  const handleSortKeyDown = (e: KeyboardEvent<HTMLButtonElement>, field: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort(field);
    }
  };
  
  // Toggle service active status
  const toggleServiceStatus = async (service: Service) => {
    try {
      const updatedService = { ...service, is_active: !service.is_active };
      
      // Update in Supabase
      const { error } = await supabase
        .from('services')
        .update({ is_active: updatedService.is_active })
        .eq('id', service.id);
      
      if (error) throw error;
      
      // Update local state
      setServices(prev => 
        prev.map(s => s.id === service.id ? updatedService : s)
      );
    } catch (error) {
      console.error('Error toggling service status:', error);
      alert('Failed to update service status. Please try again.');
    }
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };
  
  // Delete service
  const deleteService = async () => {
    if (!serviceToDelete) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete.id);
      
      if (error) throw error;
      
      // Update local state
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };
  
  // Filter services based on search query
  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-live="polite">
        <Loader className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
        <span className="ml-2 text-lg">Loading services...</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" role="region" aria-labelledby="services-heading">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 id="services-heading" className="text-2xl font-bold text-gray-900">Service Pages</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <label htmlFor="service-search" className="sr-only">Search services</label>
            <input
              id="service-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              aria-label="Search services"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          
          <button
            onClick={() => navigate('/admin/services/new')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Create new service"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Service
          </button>
        </div>
      </div>
      
      {filteredServices.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center" role="alert">
          <p className="text-gray-500 mb-4">No services found.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" aria-label="Services list">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('title')}
                    onKeyDown={(e) => handleSortKeyDown(e, 'title')}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                    aria-label={`Sort by title, currently ${sortField === 'title' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    Title
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" /> : 
                        <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('slug')}
                    onKeyDown={(e) => handleSortKeyDown(e, 'slug')}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                    aria-label={`Sort by slug, currently ${sortField === 'slug' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    Slug
                    {sortField === 'slug' && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" /> : 
                        <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('post_count')}
                    onKeyDown={(e) => handleSortKeyDown(e, 'post_count')}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                    aria-label={`Sort by posts, currently ${sortField === 'post_count' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    Posts
                    {sortField === 'post_count' && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" /> : 
                        <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('updated_at')}
                    onKeyDown={(e) => handleSortKeyDown(e, 'updated_at')}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                    aria-label={`Sort by last updated, currently ${sortField === 'updated_at' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    Last Updated
                    {sortField === 'updated_at' && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" /> : 
                        <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('is_active')}
                    onKeyDown={(e) => handleSortKeyDown(e, 'is_active')}
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                    aria-label={`Sort by status, currently ${sortField === 'is_active' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                  >
                    Status
                    {sortField === 'is_active' && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" /> : 
                        <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{service.title}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{service.slug}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{service.post_count || 0}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <time dateTime={service.updated_at}>{formatDate(service.updated_at)}</time>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleServiceStatus(service)}
                      className={`flex items-center text-sm font-medium ${
                        service.is_active ? 'text-green-600' : 'text-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                      aria-label={`${service.is_active ? 'Deactivate' : 'Activate'} service: ${service.title}`}
                    >
                      {service.is_active ? (
                        <>
                          <ToggleRight className="h-5 w-5 mr-1" aria-hidden="true" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 mr-1" aria-hidden="true" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => window.open(`/services/${service.slug}`, '_blank')}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`View ${service.title} service page (opens in new tab)`}
                      >
                        <Eye className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">View</span>
                      </button>
                      <button
                        onClick={() => navigate(`/admin/services/edit/${service.id}`)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Edit ${service.title} service`}
                      >
                        <Edit className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(service)}
                        className="text-red-600 hover:text-red-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={`Delete ${service.title} service`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && serviceToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-description"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="delete-modal-title" className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
            <p id="delete-modal-description" className="text-gray-600 mb-6">
              Are you sure you want to delete the service "{serviceToDelete.title}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                ref={modalCancelRef}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setServiceToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={deleteService}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesList; 