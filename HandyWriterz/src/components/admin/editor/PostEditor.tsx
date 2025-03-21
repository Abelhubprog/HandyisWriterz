import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Calendar, 
  Tag, 
  HelpCircle, 
  Image, 
  Grid, 
  Plus,
  X,
  Check,
  Eye,
  Clock,
  Upload,
  FileText,
  Link2,
  Check as CheckIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import RichTextEditor from '../RichTextEditor';
import MediaLibrary from '../MediaLibrary';

// Service options
const SERVICE_OPTIONS = [
  { id: 'adult-health-nursing', name: 'Adult Health Nursing' },
  { id: 'child-nursing', name: 'Child Nursing' },
  { id: 'mental-health-nursing', name: 'Mental Health Nursing' },
  { id: 'crypto', name: 'Cryptocurrency Analysis' }
];

// Post status options
const STATUS_OPTIONS = [
  { id: 'draft', name: 'Draft' },
  { id: 'published', name: 'Published' },
  { id: 'scheduled', name: 'Scheduled' },
  { id: 'archived', name: 'Archived' }
];

// Post interface
interface Post {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  service: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at: string | null;
  scheduled_for: string | null;
  featured: boolean;
  featured_image: string;
  media_type?: 'image' | 'video' | 'audio';
  media_url?: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  created_at?: string;
  updated_at?: string;
}

// Initial post state
const initialPostState: Post = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  service: SERVICE_OPTIONS[0].id,
  category: '',
  tags: [],
  status: 'draft',
  published_at: null,
  scheduled_for: null,
  featured: false,
  featured_image: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: []
};

// Slug generator
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .trim();
};

// Excerpt generator (150 chars)
const generateExcerpt = (text: string): string => {
  const plainText = text.replace(/<[^>]+>/g, '');
  return plainText.length > 150 ? `${plainText.substring(0, 150)}...` : plainText;
};

// PostEditor component
const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const isEditMode = !!id;
  
  // State
  const [post, setPost] = useState<Post>(initialPostState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch post data on edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchPost();
    } else {
      // Focus title input on new post
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
    
    // Fetch categories and tags
    fetchCategories();
    fetchTags();
  }, [id]);
  
  // Fetch post data
  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setPost({
        id: data.id,
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        service: data.service || SERVICE_OPTIONS[0].id,
        category: data.category || '',
        tags: data.tags || [],
        status: data.status || 'draft',
        published_at: data.published_at || null,
        scheduled_for: data.scheduled_for || null,
        featured: data.featured || false,
        featured_image: data.featured_image || '',
        media_type: data.media_type,
        media_url: data.media_url,
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        seo_keywords: data.seo_keywords || [],
        created_at: data.created_at,
        updated_at: data.updated_at
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/admin/content/posts', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch categories based on selected service
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('service', post.service);
      
      if (error) throw error;
      
      setCategories(data.map(cat => ({
        id: cat.id,
        name: cat.name
      })));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  // Fetch all tags
  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*');
      
      if (error) throw error;
      
      setAllTags(data.map(tag => ({
        id: tag.id,
        name: tag.name
      })));
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  
  // Update categories when service changes
  useEffect(() => {
    fetchCategories();
  }, [post.service]);
  
  // Handle title change and generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPost(prev => ({ ...prev, title: newTitle }));
    
    // Only auto-generate slug if it's empty or matches the previous auto-generated slug
    if (!post.slug || post.slug === generateSlug(post.title)) {
      setPost(prev => ({ ...prev, slug: generateSlug(newTitle) }));
    }
  };
  
  // Handle rich text editor content change
  const handleContentChange = (content: string) => {
    setPost(prev => ({
      ...prev,
      content,
      excerpt: generateExcerpt(content) // Auto-generate excerpt
    }));
  };
  
  // Add a tag
  const addTag = () => {
    if (currentTag.trim() && !post.tags.includes(currentTag.trim())) {
      setPost(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };
  
  // Remove a tag
  const removeTag = (tag: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  // Add a keyword
  const addKeyword = () => {
    if (currentKeyword.trim() && !post.seo_keywords.includes(currentKeyword.trim())) {
      setPost(prev => ({
        ...prev,
        seo_keywords: [...prev.seo_keywords, currentKeyword.trim()]
      }));
      setCurrentKeyword('');
    }
  };
  
  // Remove a keyword
  const removeKeyword = (keyword: string) => {
    setPost(prev => ({
      ...prev,
      seo_keywords: prev.seo_keywords.filter(k => k !== keyword)
    }));
  };
  
  // Handle media selection
  const handleMediaSelect = (media: { url: string; type: string; id: string }) => {
    setPost(prev => ({
      ...prev,
      featured_image: media.url,
      media_type: media.type as 'image' | 'video' | 'audio',
      media_url: media.url
    }));
    setShowMediaLibrary(false);
  };
  
  // Validate post data
  const validatePost = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!post.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!post.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }
    
    if (!post.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (post.status === 'scheduled' && !post.scheduled_for) {
      newErrors.scheduled_for = 'Scheduled date is required for scheduled posts';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Save post
  const savePost = async (publish = false): Promise<string | null> => {
    if (!validatePost()) return null;
    
    setIsSaving(true);
    try {
      const postData = {
        ...post,
        status: publish ? 'published' : post.status,
        published_at: publish ? new Date().toISOString() : post.published_at,
        updated_at: new Date().toISOString()
      };
      
      if (isEditMode) {
        const { data, error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        return data.id;
      } else {
        const { data, error } = await supabase
          .from('posts')
          .insert([{ ...postData, created_at: new Date().toISOString() }])
          .select()
          .single();
          
        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('Error saving post:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle save
  const handleSave = async () => {
    const savedId = await savePost(false);
    if (savedId) {
      navigate(`/admin/content/posts/${savedId}`);
    }
  };
  
  // Handle publish
  const handlePublish = async () => {
    const savedId = await savePost(true);
    if (savedId) {
      navigate(`/admin/content/posts/${savedId}`);
    }
  };
  
  // File upload component
  const FileUpload: React.FC = () => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        handleMediaSelect({
          url: publicUrl,
          type: file.type.split('/')[0],
          id: fileName
        });
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    };
    
    return (
      <div className="flex items-center space-x-2">
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          accept="image/*,video/*,audio/*"
        />
        <label
          htmlFor="file-upload"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200"
        >
          Upload File
        </label>
      </div>
    );
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/content/posts"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
      
      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={post.title}
            onChange={handleTitleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter post title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={post.slug}
            onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter URL slug"
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
          )}
        </div>
        
        {/* Service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service
          </label>
          <select
            value={post.service}
            onChange={(e) => setPost(prev => ({ ...prev, service: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SERVICE_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={post.category}
            onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 rounded-lg text-sm flex items-center"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag"
            />
            <button
              onClick={addTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Featured Image
          </label>
          <div className="flex items-center space-x-4">
            {post.featured_image ? (
              <div className="relative">
                <img
                  src={post.featured_image}
                  alt="Featured"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => setPost(prev => ({ ...prev, featured_image: '' }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Image size={24} className="text-gray-400" />
              </div>
            )}
            <div className="flex space-x-2">
              <FileUpload />
              <button
                onClick={() => setShowMediaLibrary(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Media Library
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <RichTextEditor
            content={post.content}
            onChange={handleContentChange}
            placeholder="Write your post content here..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
        </div>
        
        {/* SEO */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">SEO Settings</h3>
          
          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Title
            </label>
            <input
              type="text"
              value={post.seo_title}
              onChange={(e) => setPost(prev => ({ ...prev, seo_title: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SEO title"
            />
          </div>
          
          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Description
            </label>
            <textarea
              value={post.seo_description}
              onChange={(e) => setPost(prev => ({ ...prev, seo_description: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter SEO description"
            />
          </div>
          
          {/* SEO Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {post.seo_keywords.map(keyword => (
                <span
                  key={keyword}
                  className="px-2 py-1 bg-gray-100 rounded-lg text-sm flex items-center"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a keyword"
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-4/5 h-4/5 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Media Library</h2>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <MediaLibrary
              onSelect={handleMediaSelect}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostEditor; 