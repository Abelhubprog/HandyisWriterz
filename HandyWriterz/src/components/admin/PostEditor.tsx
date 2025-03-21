import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { appwriteService, createUniqueId } from '@/lib/appwriteClient';
import { toast } from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import {
  Save,
  ArrowLeft,
  Calendar,
  Clock,
  Image as ImageIcon,
  Tag,
  Settings,
  Eye,
  Info,
  Plus,
  X,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { MediaLibrary } from './MediaLibrary';

// Interfaces
interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  service: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  publishedAt: string | null;
  scheduledFor: string | null;
  featured: boolean;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  $id: string;
  name: string;
  slug: string;
  service: string;
}

interface ServiceOption {
  id: string;
  name: string;
  slug: string;
}

// Available services
const SERVICES: ServiceOption[] = [
  { id: 'adult-health-nursing', name: 'Adult Health Nursing', slug: 'adult-health-nursing' },
  { id: 'mental-health-nursing', name: 'Mental Health Nursing', slug: 'mental-health-nursing' },
  { id: 'child-nursing', name: 'Child Nursing', slug: 'child-nursing' },
  { id: 'crypto', name: 'Cryptocurrency', slug: 'crypto' }
];

const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const isEditMode = !!id;
  
  // Post states
  const [post, setPost] = useState<PostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    service: '',
    category: '',
    tags: [],
    status: 'draft',
    publishedAt: null,
    scheduledFor: null,
    featured: false,
    author: {
      id: user?.id || '',
      name: user?.fullName || user?.username || '',
      avatar: user?.imageUrl || ''
    },
    featuredImage: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Fetch post data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchPost();
    }
  }, [id]);
  
  // Fetch all categories
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Filter available categories based on selected service
  useEffect(() => {
    if (post.service) {
      setAvailableCategories(categories.filter(cat => cat.service === post.service));
    } else {
      setAvailableCategories([]);
    }
  }, [post.service, categories]);
  
  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (post.title && post.content && savingStatus !== 'saving') {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearTimeout(timer);
  }, [post]);
  
  const fetchPost = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const postData = await appwriteService.posts.getPost(id);
      if (postData) {
        setPost(postData);
      } else {
        toast.error('Post not found');
        navigate('/admin/content/posts');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/admin/content/posts');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await appwriteService.categories.getAllCategories();
      setCategories(response.documents);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };
  
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setPost(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      seoTitle: prev.seoTitle || title
    }));
  };
  
  const handleChange = (field: keyof PostData, value: any) => {
    setPost(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
    
    // Clear validation error for this field if it exists
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validatePost = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!post.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!post.content.trim()) {
      errors.content = 'Content is required';
    }
    
    if (!post.service) {
      errors.service = 'Service is required';
    }
    
    if (post.status === 'scheduled' && !post.scheduledFor) {
      errors.scheduledFor = 'Schedule date is required for scheduled posts';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAutoSave = async () => {
    if (!post.title || !post.content || loading) return;
    
    setSavingStatus('saving');
    try {
      const updatedPost = {
        ...post,
        updatedAt: new Date().toISOString()
      };
      
      if (isEditMode) {
        await appwriteService.posts.updatePost(id!, updatedPost);
      } else {
        const newPost = await appwriteService.posts.createPost(updatedPost);
        if (!isEditMode) {
          navigate(`/admin/content/posts/edit/${newPost.$id}`);
        }
      }
      
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) {
      console.error('Error auto-saving post:', error);
      setSavingStatus('error');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent, status?: 'published' | 'draft' | 'scheduled' | 'archived') => {
    e.preventDefault();
    
    if (!validatePost()) {
      toast.error('Please fix the errors before saving');
      return;
    }
    
    setLoading(true);
    setSavingStatus('saving');
    
    try {
      const now = new Date().toISOString();
      const updatedPost = {
        ...post,
        status: status || post.status,
        publishedAt: status === 'published' ? now : post.publishedAt,
        updatedAt: now
      };
      
      if (isEditMode) {
        await appwriteService.posts.updatePost(id!, updatedPost);
        toast.success('Post updated successfully');
      } else {
        const newPost = await appwriteService.posts.createPost(updatedPost);
        toast.success('Post created successfully');
        navigate(`/admin/content/posts/edit/${newPost.$id}`);
      }
      
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
      setSavingStatus('error');
    } finally {
      setLoading(false);
    }
  };
  
  const addTag = () => {
    if (!newTag.trim()) return;
    if (post.tags.includes(newTag.trim())) {
      toast.error('Tag already exists');
      return;
    }
    
    setPost(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag('');
  };
  
  const removeTag = (tag: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    if (post.seoKeywords.includes(newKeyword.trim())) {
      toast.error('Keyword already exists');
      return;
    }
    
    setPost(prev => ({
      ...prev,
      seoKeywords: [...prev.seoKeywords, newKeyword.trim()]
    }));
    setNewKeyword('');
  };
  
  const removeKeyword = (keyword: string) => {
    setPost(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(k => k !== keyword)
    }));
  };
  
  const handleSelectFeaturedImage = (url: string) => {
    setPost(prev => ({
      ...prev,
      featuredImage: url
    }));
    setShowMediaLibrary(false);
  };
  
  const renderSavingStatus = () => {
    switch (savingStatus) {
      case 'saving':
        return (
          <div className="flex items-center text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span className="text-sm">Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span className="text-sm">Failed to save</span>
          </div>
        );
      default:
        return null;
    }
  };
  
  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2">Loading post...</p>
      </div>
    );
  }
  
  // Post preview mode
  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white z-10 border-b shadow-sm p-4">
          <div className="max-w-screen-xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setPreviewMode(false)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Exit Preview</span>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Previewing as: </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-md">
                {post.status === 'published' ? 'Published' : post.status === 'scheduled' ? 'Scheduled' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="max-w-screen-lg mx-auto my-10 p-6 bg-white rounded-lg shadow-sm">
          {post.featuredImage && (
            <div className="mb-6 rounded-lg overflow-hidden -mx-6 -mt-6">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-[400px] object-cover"
              />
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
            </div>
            {post.service && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{SERVICES.find(s => s.id === post.service)?.name || post.service}</span>
              </div>
            )}
          </div>
          
          {post.excerpt && (
            <div className="mb-8 text-gray-600 text-lg italic border-l-4 border-blue-600 pl-4">
              {post.excerpt}
            </div>
          )}
          
          <div 
            className="prose prose-lg max-w-none" 
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          {post.tags.length > 0 && (
            <div className="mt-8 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white z-10 border-b shadow-sm p-4">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/content/posts')}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            
            <h1 className="text-xl font-semibold">
              {isEditMode ? 'Edit Post' : 'Create New Post'}
            </h1>
            
            {renderSavingStatus()}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(true)}
              className="px-3 py-1 border rounded-md hover:bg-gray-50 flex items-center gap-1"
              title="Preview post"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
            
            <button
              onClick={(e) => handleSubmit(e, 'draft')}
              className="px-3 py-1 border rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Save Draft
            </button>
            
            <button
              onClick={(e) => handleSubmit(e, 'published')}
              className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              <span>Publish</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-screen-xl mx-auto py-6 px-4">
        <div className="flex flex-wrap md:flex-nowrap gap-6">
          {/* Main Content Area */}
          <div className="w-full md:w-2/3">
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={post.title}
                onChange={handleTitleChange}
                placeholder="Enter post title"
                className={`w-full p-3 border rounded-lg ${
                  validationErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="slug"
                  value={post.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="post-url-slug"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                URL-friendly version of the title. Leave empty to auto-generate.
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                value={post.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="Brief summary of the post"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <p className="mt-1 text-xs text-gray-500">
                A short summary of the post. Will be displayed in post listings.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={post.content}
                onChange={(value) => handleChange('content', value)}
                height="500px"
              />
              {validationErrors.content && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.content}</p>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex mb-4 border-b">
                <button
                  className={`px-4 py-2 ${
                    activeTab === 'content' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                  }`}
                  onClick={() => setActiveTab('content')}
                >
                  Content
                </button>
                <button
                  className={`px-4 py-2 ${
                    activeTab === 'seo' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                  }`}
                  onClick={() => setActiveTab('seo')}
                >
                  SEO
                </button>
                <button
                  className={`px-4 py-2 ${
                    activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                  }`}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </button>
              </div>
              
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                      Service <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="service"
                      value={post.service}
                      onChange={(e) => handleChange('service', e.target.value)}
                      className={`w-full p-3 border rounded-lg ${
                        validationErrors.service ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Service</option>
                      {SERVICES.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.service && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.service}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      value={post.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      disabled={!post.service}
                    >
                      <option value="">Select Category</option>
                      {availableCategories.map(category => (
                        <option key={category.$id} value={category.$id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-lg text-sm">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-gray-600 hover:text-red-600"
                            aria-label={`Remove tag ${tag}`}
                            title={`Remove tag ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Add a tag"
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Featured Image
                    </label>
                    {post.featuredImage ? (
                      <div className="relative mb-2">
                        <img
                          src={post.featuredImage}
                          alt="Featured"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('featuredImage', '')}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setShowMediaLibrary(true)}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                      >
                        <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to select an image</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      id="seoTitle"
                      value={post.seoTitle}
                      onChange={(e) => handleChange('seoTitle', e.target.value)}
                      placeholder="SEO optimized title"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Defaults to post title if left empty. Aim for 50-60 characters.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      id="seoDescription"
                      value={post.seoDescription}
                      onChange={(e) => handleChange('seoDescription', e.target.value)}
                      placeholder="Brief description for search engines"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      A concise summary for search engines. Aim for 150-160 characters.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Keywords
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.seoKeywords.map(keyword => (
                        <span key={keyword} className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-lg text-sm">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="text-gray-600 hover:text-red-600"
                            aria-label={`Remove keyword ${keyword}`}
                            title={`Remove keyword ${keyword}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                        placeholder="Add a keyword"
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={addKeyword}
                        className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      value={post.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  {post.status === 'scheduled' && (
                    <div>
                      <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-1">
                        Schedule Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="scheduledFor"
                        value={post.scheduledFor || ''}
                        onChange={(e) => handleChange('scheduledFor', e.target.value)}
                        className={`w-full p-3 border rounded-lg ${
                          validationErrors.scheduledFor ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.scheduledFor && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.scheduledFor}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={post.featured}
                      onChange={(e) => handleChange('featured', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                      Featured Post
                    </label>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Post Info</h3>
                    <ul className="space-y-1 text-xs text-gray-500">
                      <li>Created: {new Date(post.createdAt).toLocaleString()}</li>
                      <li>Last Modified: {new Date(post.updatedAt).toLocaleString()}</li>
                      {post.publishedAt && (
                        <li>Published: {new Date(post.publishedAt).toLocaleString()}</li>
                      )}
                      <li>Author: {post.author.name}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">Select Featured Image</h3>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
                aria-label="Close media library"
                title="Close media library"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {/* This would be replaced with the actual media library component */}
                <div
                  onClick={() => handleSelectFeaturedImage('https://example.com/placeholder.jpg')}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
                >
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostEditor;
