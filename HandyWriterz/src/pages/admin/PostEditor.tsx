import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Editor } from '@tinymce/tinymce-react';
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon, 
  Tag, 
  Calendar, 
  Check, 
  Trash2,
  Upload,
  AlertCircle,
  Eye,
  Clock,
  Loader2,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

// Define type for post data
interface PostData {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image?: string;
  category_id?: number;
  author_id?: string;
  service_type: string;
  status: string;
  tags?: string[];
  published_at?: string | null;
  scheduled_at?: string | null;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
}

// Define type for category
interface Category {
  id: number;
  name: string;
  slug: string;
}

/**
 * PostEditor Component
 * 
 * Admin component for creating and editing posts
 * Features:
 * - Rich text editor with TinyMCE
 * - Image upload with preview
 * - Category and tag management
 * - Post metadata editor for SEO
 * - Draft saving and publishing options
 * - Scheduled publishing
 */
const PostEditor: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const editorRef = useRef<any>(null);
  const isNewPost = postId === 'new';
  
  // Post data state
  const [post, setPost] = useState<PostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    service_type: 'adult-health-nursing', // Default service type
    status: 'draft',
    tags: [],
    meta_title: '',
    meta_description: '',
    keywords: '',
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(!isNewPost);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState<string>('');
  const [showMetadata, setShowMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Service types for selection
  const serviceTypes = [
    { value: 'adult-health-nursing', label: 'Adult Health Nursing' },
    { value: 'child-nursing', label: 'Child Nursing' },
    { value: 'mental-health-nursing', label: 'Mental Health Nursing' },
    { value: 'social-work', label: 'Social Work' },
    { value: 'ai', label: 'AI' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'advanced-practice-nursing', label: 'Advanced Practice Nursing' },
  ];
  
  // Post status options
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'archived', label: 'Archived' },
  ];
  
  // Fetch post data if editing
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };
    
    const fetchPost = async () => {
      if (isNewPost) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            category:category_id (id, name, slug)
          `)
          .eq('id', parseInt(postId || '0'))
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setPost({
            id: data.id,
            title: data.title || '',
            slug: data.slug || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            cover_image: data.cover_image || '',
            category_id: data.category_id || undefined,
            author_id: data.author_id || user?.id || '',
            service_type: data.service_type || 'adult-health-nursing',
            status: data.status || 'draft',
            tags: data.tags || [],
            published_at: data.published_at || null,
            scheduled_at: data.scheduled_at || null,
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
            keywords: data.keywords || '',
          });
          
          if (data.cover_image) {
            setImagePreview(data.cover_image);
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
    fetchPost();
  }, [postId, isNewPost, user]);
  
  // Generate slug from title
  useEffect(() => {
    if (isNewPost && post.title && !post.slug) {
      const generatedSlug = post.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      setPost(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [post.title, isNewPost, post.slug]);
  
  // Handle image file change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const tagExists = post.tags?.includes(newTag.trim());
    if (tagExists) {
      toast.error('This tag already exists');
      return;
    }
    
    setPost(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()],
    }));
    setNewTag('');
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove),
    }));
  };
  
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPost(prev => ({ ...prev, [name]: value }));
  };
  
  // Upload image to storage
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `covers/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);
    
    if (uploadError) {
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };
  
  // Save post mutation
  const savePostMutation = useMutation({
    mutationFn: async (postData: PostData) => {
      let coverImageUrl = post.cover_image;
      
      // Upload image if there's a new one
      if (imageFile) {
        coverImageUrl = await uploadImage(imageFile);
      }
      
      const timestamp = new Date().toISOString();
      const finalData = {
        ...postData,
        cover_image: coverImageUrl,
        author_id: user?.id || postData.author_id,
        updated_at: timestamp,
        ...(postData.status === 'published' && !postData.published_at 
          ? { published_at: timestamp } 
          : {}),
      };
      
      if (isNewPost) {
        const { data, error } = await supabase
          .from('posts')
          .insert(finalData)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        return data;
      } else {
        const { data, error } = await supabase
          .from('posts')
          .update(finalData)
          .eq('id', postData.id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        return data;
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries(['posts']);
      
      toast.success(`Post ${isNewPost ? 'created' : 'updated'} successfully`);
      
      // Redirect to edit page if it was a new post
      if (isNewPost && data.id) {
        navigate(`/admin/posts/edit/${data.id}`, { replace: true });
      }
    },
    onError: (error) => {
      console.error('Error saving post:', error);
      toast.error(`Failed to ${isNewPost ? 'create' : 'update'} post`);
    },
  });
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!post.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!post.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    
    if (!post.service_type) {
      toast.error('Service type is required');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Get content from editor
      const content = editorRef.current?.getContent() || post.content;
      
      savePostMutation.mutate({
        ...post,
        content,
      });
    } catch (err) {
      console.error('Error in form submission:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Preview post
  const handlePreview = () => {
    // Save current state to local storage for preview
    const previewData = {
      ...post,
      content: editorRef.current?.getContent() || post.content,
      cover_image: imagePreview || post.cover_image,
    };
    
    localStorage.setItem('post_preview', JSON.stringify(previewData));
    window.open(`/preview/${post.service_type}/post/${post.slug}`, '_blank');
  };
  
  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd\'T\'HH:mm');
    } catch (err) {
      return '';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md max-w-7xl mx-auto my-6 p-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mr-4 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewPost ? 'Create New Post' : 'Edit Post'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content - 2/3 width */}
          <div className="md:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={post.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter post title"
              />
            </div>
            
            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={post.slug}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="enter-post-slug"
              />
              <p className="mt-1 text-sm text-gray-500">
                URL-friendly version of the title (auto-generated, can be edited)
              </p>
            </div>
            
            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={post.excerpt}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary of the post (used in listings and search results)"
              />
            </div>
            
            {/* Content Editor */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <Editor
                onInit={(evt, editor) => (editorRef.current = editor)}
                initialValue={post.content}
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                  ],
                  toolbar:
                    'undo redo | formatselect | ' +
                    'bold italic backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 16px }'
                }}
              />
            </div>
            
            {/* SEO Metadata */}
            <div>
              <button
                type="button"
                onClick={() => setShowMetadata(!showMetadata)}
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mb-2"
              >
                {showMetadata ? 'Hide' : 'Show'} SEO Metadata
              </button>
              
              {showMetadata && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <div>
                    <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      id="meta_title"
                      name="meta_title"
                      value={post.meta_title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SEO Title (defaults to post title if empty)"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      id="meta_description"
                      name="meta_description"
                      value={post.meta_description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description for search engines (max 160 characters recommended)"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords
                    </label>
                    <input
                      type="text"
                      id="keywords"
                      name="keywords"
                      value={post.keywords}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Comma-separated keywords"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar - 1/3 width */}
          <div className="md:col-span-1 space-y-6">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={post.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Scheduled publishing */}
            {post.status === 'scheduled' && (
              <div>
                <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-1">
                  Publish Date & Time
                </label>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="datetime-local"
                    id="scheduled_at"
                    name="scheduled_at"
                    value={formatDate(post.scheduled_at)}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            {/* Service Type */}
            <div>
              <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                id="service_type"
                name="service_type"
                value={post.service_type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {serviceTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={post.category_id || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Featured Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                {imagePreview ? (
                  <div className="space-y-1 text-center">
                    <img
                      src={imagePreview}
                      alt="Image preview"
                      className="mx-auto h-32 object-cover rounded-md"
                    />
                    <div className="flex justify-center mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setPost(prev => ({ ...prev, cover_image: undefined }));
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                      <label
                        htmlFor="image-upload"
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Change
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <ImageIcon
                      className="mx-auto h-12 w-12 text-gray-400"
                      aria-hidden="true"
                    />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload an image</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Publishing Info */}
            {!isNewPost && post.published_at && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Publishing Information
                </h3>
                <div className="text-xs text-gray-500">
                  <p className="flex items-center mb-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    Published: {formatDate(post.published_at)}
                  </p>
                  <p className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Last Updated: {formatDate(post.updated_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostEditor; 