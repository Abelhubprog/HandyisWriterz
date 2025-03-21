import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X, 
  Filter,
  AlertCircle,
  CheckCircle,
  BarChart2
} from 'lucide-react';
import { databases, DATABASE_ID, CATEGORIES_COLLECTION_ID, Query } from '@/lib/appwriteClient';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ID } from 'appwrite';

// Category interface
interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  service: string;
  count: number;
  description?: string;
  parentCategory?: string | null;
}

// CategoriesList component
const CategoriesList: React.FC = () => {
  const { checkRole } = useAdminAuth();
  const canEdit = checkRole('editor');
  
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  
  // Form values for create/edit
  const [formValues, setFormValues] = useState({
    name: '',
    slug: '',
    service: 'adult-health-nursing',
    description: '',
    parentCategory: ''
  });
  
  // Service options
  const SERVICE_OPTIONS = [
    { id: 'adult-health-nursing', name: 'Adult Health Nursing' },
    { id: 'child-nursing', name: 'Child Nursing' },
    { id: 'mental-health-nursing', name: 'Mental Health Nursing' },
    { id: 'crypto', name: 'Cryptocurrency' }
  ];
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch categories from the database
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        []
      );
      
      const formattedCategories: ServiceCategory[] = response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        service: doc.service,
        count: doc.count || 0,
        description: doc.description || '',
        parentCategory: doc.parentCategory || null
      }));
      
      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  
  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'name' && !isEditing) {
      // Auto-generate slug when name changes (only for new categories)
      setFormValues(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Open create category form
  const handleAddCategory = () => {
    setFormValues({
      name: '',
      slug: '',
      service: SERVICE_OPTIONS[0].id,
      description: '',
      parentCategory: ''
    });
    setIsCreating(true);
    setIsEditing(false);
    setEditingCategory(null);
  };
  
  // Open edit category form
  const handleEditCategory = (category: ServiceCategory) => {
    setFormValues({
      name: category.name,
      slug: category.slug,
      service: category.service,
      description: category.description || '',
      parentCategory: category.parentCategory || ''
    });
    setIsEditing(true);
    setIsCreating(false);
    setEditingCategory(category);
  };
  
  // Delete category handler
  const handleDeleteCategory = async (categoryId: string) => {
    if (!canEdit) return;
    
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        categoryId
      );
      
      // Refresh categories
      fetchCategories();
      setSuccess('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category. Please try again.');
    }
  };
  
  // Handle form submit for create/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!formValues.name.trim()) {
      setError('Category name is required');
      return;
    }
    
    if (!formValues.slug.trim()) {
      setError('Category slug is required');
      return;
    }
    
    if (!formValues.service) {
      setError('Service is required');
      return;
    }
    
    try {
      if (isCreating) {
        // Create new category
        await databases.createDocument(
          DATABASE_ID,
          CATEGORIES_COLLECTION_ID,
          ID.unique(),
          {
            name: formValues.name,
            slug: formValues.slug,
            service: formValues.service,
            description: formValues.description,
            parentCategory: formValues.parentCategory || null,
            count: 0,
            createdAt: new Date().toISOString()
          }
        );
        
        setSuccess('Category created successfully');
      } else if (isEditing && editingCategory) {
        // Update existing category
        await databases.updateDocument(
          DATABASE_ID,
          CATEGORIES_COLLECTION_ID,
          editingCategory.id,
          {
            name: formValues.name,
            slug: formValues.slug,
            service: formValues.service,
            description: formValues.description,
            parentCategory: formValues.parentCategory || null,
            updatedAt: new Date().toISOString()
          }
        );
        
        setSuccess('Category updated successfully');
      }
      
      // Refresh categories
      fetchCategories();
      
      // Close forms
      setIsCreating(false);
      setIsEditing(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Failed to save category. Please try again.');
    }
  };
  
  // Cancel form
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingCategory(null);
    setError(null);
  };
  
  // Filter categories based on search and service filter
  const filteredCategories = categories.filter(category => {
    // Search filter
    const matchesSearch = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Service filter
    const matchesService = serviceFilter === 'all' || category.service === serviceFilter;
    
    return matchesSearch && matchesService;
  });
  
  // Get service name from ID
  const getServiceName = (serviceId: string) => {
    const service = SERVICE_OPTIONS.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };
  
  // Get parent category name from ID
  const getParentCategoryName = (parentId: string | null | undefined) => {
    if (!parentId) return null;
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : null;
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        {canEdit && (
          <button
            type="button"
            onClick={handleAddCategory}
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FolderPlus size={16} />
            Add New Category
          </button>
        )}
      </div>
      
      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start">
          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          <p className="ml-2 text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-start">
          <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
          <p className="ml-2 text-green-700">{success}</p>
        </div>
      )}
      
      {/* Create/Edit Category Form */}
      {(isCreating || isEditing) && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {isCreating ? 'Create New Category' : 'Edit Category'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Clinical Studies"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formValues.slug}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. clinical-studies"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in URLs. Only lowercase letters, numbers, and hyphens.
                </p>
              </div>
              
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                  Service *
                </label>
                <select
                  id="service"
                  name="service"
                  value={formValues.service}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {SERVICE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  id="parentCategory"
                  name="parentCategory"
                  value={formValues.parentCategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter(cat => cat.service === formValues.service && (!editingCategory || cat.id !== editingCategory.id))
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formValues.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the category"
                  rows={3}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isCreating ? 'Create Category' : 'Update Category'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="md:w-1/4">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by service"
            >
              <option value="all">All Services</option>
              {SERVICE_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Categories list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getServiceName(category.service)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getParentCategoryName(category.parentCategory) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BarChart2 size={14} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-700">{category.count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditCategory(category)}
                              className="text-blue-600 hover:text-blue-900"
                              aria-label={`Edit ${category.name}`}
                              title={`Edit ${category.name}`}
                            >
                              <Edit size={18} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900"
                              aria-label={`Delete ${category.name}`}
                              title={`Delete ${category.name}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoriesList; 