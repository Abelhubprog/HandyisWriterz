import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { contentService } from '@/services/contentService';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  service: string;
  description?: string;
  count?: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    slug: '',
    service: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    loadServices();
  }, [serviceFilter]);

  const loadServices = async () => {
    try {
      // Get available service types from our database
      const { data: serviceData, error } = await supabase
        .from('posts')
        .select('service_type')
        .is('service_type', 'not.null');
        
      if (error) throw error;
      
      if (serviceData) {
        // Extract unique service types
        const uniqueServices = Array.from(
          new Set(serviceData.map(item => item.service_type))
        ).filter(Boolean) as string[];
        
        // Add predefined services if they don't exist in the data
        const defaultServices = [
          'adult-health-nursing', 
          'mental-health-nursing', 
          'child-nursing', 
          'crypto', 
          'ai'
        ];
        
        const combinedServices = Array.from(
          new Set([...uniqueServices, ...defaultServices])
        ).sort();
        
        setServices(combinedServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await contentService.getCategories(serviceFilter || undefined);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name' && formMode === 'create') {
      // Auto-generate slug from name
      const slug = contentService.createSlug(value);
      setFormData(prev => ({ ...prev, [name]: value, slug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      service: '',
      description: ''
    });
    setSelectedCategory(null);
    setFormMode('create');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.service) {
      toast({
        title: 'Validation Error',
        description: 'Name, slug, and service are required fields.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      if (formMode === 'create') {
        await contentService.createCategory(formData);
        toast({
          title: 'Category created',
          description: 'The category has been successfully created.'
        });
      } else if (formMode === 'edit' && selectedCategory) {
        await contentService.updateCategory(selectedCategory.id, formData);
        toast({
          title: 'Category updated',
          description: 'The category has been successfully updated.'
        });
      }
      
      // Refresh the category list
      fetchCategories();
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      service: category.service,
      description: category.description || ''
    });
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? Any content assigned to this category will be affected.')) {
      try {
        await contentService.deleteCategory(id);
        toast({
          title: 'Category deleted',
          description: 'The category has been successfully deleted.'
        });
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete category. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage content categories and organization
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
              setFormMode('create');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Add Category
          </button>
        </div>
      </div>
      
      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">
            {formMode === 'create' ? 'Add New Category' : 'Edit Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL-friendly version of the name. Use only lowercase letters, numbers, and hyphens.
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700">
                Service
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleFormChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                aria-label="Select service"
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {formMode === 'create' ? 'Create Category' : 'Update Category'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search categories
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search categories..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="sm:w-64">
            <label htmlFor="service-filter" className="sr-only">
              Filter by service
            </label>
            <select
              id="service-filter"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              aria-label="Filter by service"
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Categories List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {searchFilter || serviceFilter
                ? 'No categories found matching your filters.'
                : 'No categories found. Create your first category to get started.'}
            </p>
          </div>
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.slug}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.service}
                    </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit category"
                        aria-label={`Edit category ${category.name}`}
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-900"
                        title="Delete category"
                        aria-label={`Delete category ${category.name}`}
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default Categories; 