import React, { useState, useEffect } from 'react';
import { 
  Tag as TagIcon, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X, 
  Filter,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Hash
} from 'lucide-react';
import { databases, DATABASE_ID, TAGS_COLLECTION_ID, Query } from '@/lib/appwriteClient';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ID } from 'appwrite';

// Tag interface
interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
  description?: string;
}

// TagsList component
const TagsList: React.FC = () => {
  const { checkRole } = useAdminAuth();
  const canEdit = checkRole('editor');
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  
  // Form values for create/edit
  const [formValues, setFormValues] = useState({
    name: '',
    slug: '',
    description: ''
  });
  
  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);
  
  // Fetch tags from the database
  const fetchTags = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        TAGS_COLLECTION_ID,
        []
      );
      
      const formattedTags: Tag[] = response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        slug: doc.slug,
        count: doc.count || 0,
        description: doc.description || ''
      }));
      
      setTags(formattedTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('Failed to load tags. Please try again.');
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'name' && !isEditing) {
      // Auto-generate slug when name changes (only for new tags)
      setFormValues(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Open create tag form
  const handleAddTag = () => {
    setFormValues({
      name: '',
      slug: '',
      description: ''
    });
    setIsCreating(true);
    setIsEditing(false);
    setEditingTag(null);
  };
  
  // Open edit tag form
  const handleEditTag = (tag: Tag) => {
    setFormValues({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || ''
    });
    setIsEditing(true);
    setIsCreating(false);
    setEditingTag(tag);
  };
  
  // Delete tag handler
  const handleDeleteTag = async (tagId: string) => {
    if (!canEdit) return;
    
    if (!window.confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      return;
    }
    
    setError(null);
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        TAGS_COLLECTION_ID,
        tagId
      );
      
      // Refresh tags
      fetchTags();
      setSuccess('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('Failed to delete tag. Please try again.');
    }
  };
  
  // Handle form submit for create/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!formValues.name.trim()) {
      setError('Tag name is required');
      return;
    }
    
    if (!formValues.slug.trim()) {
      setError('Tag slug is required');
      return;
    }
    
    try {
      if (isCreating) {
        // Create new tag
        await databases.createDocument(
          DATABASE_ID,
          TAGS_COLLECTION_ID,
          ID.unique(),
          {
            name: formValues.name,
            slug: formValues.slug,
            description: formValues.description,
            count: 0,
            createdAt: new Date().toISOString()
          }
        );
        
        setSuccess('Tag created successfully');
      } else if (isEditing && editingTag) {
        // Update existing tag
        await databases.updateDocument(
          DATABASE_ID,
          TAGS_COLLECTION_ID,
          editingTag.id,
          {
            name: formValues.name,
            slug: formValues.slug,
            description: formValues.description,
            updatedAt: new Date().toISOString()
          }
        );
        
        setSuccess('Tag updated successfully');
      }
      
      // Refresh tags
      fetchTags();
      
      // Close forms
      setIsCreating(false);
      setIsEditing(false);
      setEditingTag(null);
    } catch (error) {
      console.error('Error saving tag:', error);
      setError('Failed to save tag. Please try again.');
    }
  };
  
  // Cancel form
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingTag(null);
    setError(null);
  };
  
  // Filter tags based on search
  const filteredTags = tags.filter(tag => {
    return tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Tags</h1>
        {canEdit && (
          <button
            type="button"
            onClick={handleAddTag}
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Add New Tag
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
      
      {/* Create/Edit Tag Form */}
      {(isCreating || isEditing) && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {isCreating ? 'Create New Tag' : 'Edit Tag'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Research Papers"
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
                  placeholder="e.g. research-papers"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in URLs. Only lowercase letters, numbers, and hyphens.
                </p>
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
                  placeholder="Brief description of the tag"
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
                {isCreating ? 'Create Tag' : 'Update Tag'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Search */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Tags Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-gray-500">Loading tags...</p>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">No tags found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No tags matching "${searchQuery}"`
                : 'Get started by adding your first tag'
              }
            </p>
            {!searchQuery && canEdit && (
              <button
                type="button"
                onClick={handleAddTag}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add Tag
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-700">Tags</h2>
              <div className="text-sm text-gray-500">
                {filteredTags.length} {filteredTags.length === 1 ? 'tag' : 'tags'} found
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTags.map(tag => (
                <div 
                  key={tag.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <Hash className="text-blue-500 h-5 w-5 mr-2" />
                      <h3 className="font-medium text-gray-800">{tag.name}</h3>
                    </div>
                    <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {tag.count} posts
                    </div>
                  </div>
                  
                  {tag.description && (
                    <p className="mt-2 text-sm text-gray-600">{tag.description}</p>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Slug: {tag.slug}
                  </div>
                  
                  {canEdit && (
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditTag(tag)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        aria-label={`Edit ${tag.name}`}
                        title={`Edit ${tag.name}`}
                      >
                        <Edit size={16} />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        aria-label={`Delete ${tag.name}`}
                        title={`Delete ${tag.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsList; 