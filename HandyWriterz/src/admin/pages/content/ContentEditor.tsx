import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiSave, 
  FiTrash2, 
  FiEye,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiImage,
  FiLink,
  FiTag,
  FiAlertCircle,
  FiCode,
  FiVideo,
  FiFileText,
  FiCheckSquare,
  FiList,
  FiUpload
} from 'react-icons/fi';
import { contentService } from '@/services/contentService';
import { Post, ContentBlock } from '@/types/admin';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast/use-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TabProps {
  title: string;
  active: boolean;
  onClick: () => void;
}

interface ContentBlockData {
  type: 'text' | 'image' | 'video' | 'code' | 'heading' | 'list' | 'quote' | 'divider';
  content: string;
  language?: string;
  level?: number;
  caption?: string;
  url?: string;
}

const Tab: React.FC<TabProps> = ({ title, active, onClick }) => (
  <button
    className={`px-4 py-2 font-medium text-sm border-b-2 focus:outline-none ${
      active 
        ? 'border-blue-500 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
    onClick={onClick}
  >
    {title}
  </button>
);

const ContentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    contentBlocks: [],
    status: 'draft',
    service: '',
    category: '',
    tags: [],
    featured: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: []
  });
  const [activeTab, setActiveTab] = useState('content');
  const [editorMode, setEditorMode] = useState<'markdown' | 'blocks'>('markdown');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<{id: string; name: string; slug: string; service: string}[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [newBlock, setNewBlock] = useState<ContentBlockData>({ type: 'text', content: '' });
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
    
    // Fetch categories
    contentService.getCategories()
      .then(data => setCategories(data))
      .catch(error => console.error('Error fetching categories:', error));

    if (id) {
      setLoading(true);
      // Fetch post if editing
      contentService.getPost(id)
        .then(fetchedPost => {
          setPost(fetchedPost);
          if (fetchedPost.scheduledFor) {
            const date = new Date(fetchedPost.scheduledFor);
            setScheduledDate(date.toISOString().slice(0, 10));
            setScheduledTime(date.toTimeString().slice(0, 5));
            setShowSchedule(fetchedPost.status === 'scheduled');
          }
        })
        .catch(error => {
          console.error('Error fetching post:', error);
          setErrors({ form: 'Failed to load post. Please try again.' });
          toast({
            title: 'Error',
            description: 'Failed to load post. Please try again.',
            variant: 'destructive'
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'title' && !post.slug && !id) {
      // Auto-generate slug from title
      const slug = contentService.createSlug(value);
      setPost(prev => ({ ...prev, [name]: value, slug }));
    } else if (name === 'service') {
      // When service changes, reset category if it doesn't belong to the new service
      const categoryBelongsToService = categories.some(
        cat => cat.name === post.category && cat.service === value
      );
      
      if (!categoryBelongsToService) {
        setPost(prev => ({ ...prev, [name]: value, category: '' }));
      } else {
        setPost(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setPost(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation errors
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPost(prev => ({ ...prev, [name]: checked }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tagsArray = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setPost(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleSeoKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const keywordsArray = value.split(',').map(keyword => keyword.trim()).filter(Boolean);
    setPost(prev => ({ ...prev, seoKeywords: keywordsArray }));
  };
  
  const handleContentBlockChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBlock(prev => ({ ...prev, [name]: value }));
  };
  
  const addContentBlock = () => {
    if (!newBlock.content.trim()) {
      toast({
        title: 'Empty content',
        description: 'Please add some content to your block',
        variant: 'destructive'
      });
      return;
    }
    
    setPost(prev => ({
      ...prev,
      contentBlocks: [...(prev.contentBlocks || []), newBlock]
    }));
    
    setNewBlock({ type: 'text', content: '' });
    setShowBlockForm(false);
  };
  
  const removeContentBlock = (index: number) => {
    setPost(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks?.filter((_, i) => i !== index)
    }));
  };
  
  const moveContentBlock = (index: number, direction: 'up' | 'down') => {
    if (!post.contentBlocks) return;
    
    const newBlocks = [...post.contentBlocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    
    setPost(prev => ({ ...prev, contentBlocks: newBlocks }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const file = files[0];
      const result = await contentService.uploadImage(file, post.service || 'general');
      
      // Add image block or update markdown content with image
      if (editorMode === 'blocks') {
        setNewBlock({
          type: 'image',
          content: '',
          url: result.url,
          caption: file.name
        });
        setShowBlockForm(true);
      } else {
        // Insert markdown image syntax at cursor position or at the end of content
        const imageMarkdown = `\n![${file.name}](${result.url})\n`;
        const textArea = document.getElementById('content') as HTMLTextAreaElement;
        
        if (textArea) {
          const cursorPos = textArea.selectionStart;
          const textBefore = textArea.value.substring(0, cursorPos);
          const textAfter = textArea.value.substring(cursorPos);
          
          setPost(prev => ({ 
            ...prev, 
            content: textBefore + imageMarkdown + textAfter 
          }));
          
          // Set cursor position after inserted content
          setTimeout(() => {
            textArea.focus();
            textArea.selectionStart = textArea.selectionEnd = cursorPos + imageMarkdown.length;
          }, 0);
        } else {
          setPost(prev => ({ 
            ...prev, 
            content: (prev.content || '') + imageMarkdown 
          }));
        }
      }
      
      toast({
        title: 'Image uploaded',
        description: 'The image was successfully uploaded and added to your content'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'The image upload failed. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const insertCodeBlock = () => {
    setNewBlock({
      type: 'code',
      content: '',
      language: 'javascript'
    });
    setShowBlockForm(true);
  };
  
  const getLanguageOptions = () => {
    return [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'jsx', label: 'JSX/React' },
      { value: 'tsx', label: 'TSX' },
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
      { value: 'scss', label: 'SCSS' },
      { value: 'python', label: 'Python' },
      { value: 'java', label: 'Java' },
      { value: 'csharp', label: 'C#' },
      { value: 'php', label: 'PHP' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: 'swift', label: 'Swift' },
      { value: 'kotlin', label: 'Kotlin' },
      { value: 'sql', label: 'SQL' },
      { value: 'bash', label: 'Bash/Shell' },
      { value: 'markdown', label: 'Markdown' },
      { value: 'json', label: 'JSON' },
      { value: 'yaml', label: 'YAML' },
      { value: 'plaintext', label: 'Plain Text' }
    ];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!post.title) {
      newErrors.title = 'Title is required';
    }
    
    if (!post.slug) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(post.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers and hyphens';
    }
    
    if (!post.content && (!post.contentBlocks || post.contentBlocks.length === 0)) {
      newErrors.content = 'Content is required';
    }
    
    if (!post.service) {
      newErrors.service = 'Service is required';
    }
    
    if (!post.category) {
      newErrors.category = 'Category is required';
    }
    
    if (post.status === 'scheduled' && !post.scheduledFor) {
      newErrors.scheduledFor = 'Scheduled date and time are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form before saving.',
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);
    
    try {
      if (showSchedule && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        setPost(prev => ({ ...prev, scheduledFor: scheduledDateTime.toISOString(), status: 'scheduled' }));
      }
      
      const updatedPost = {
        ...post, 
        scheduledFor: showSchedule && scheduledDate && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
          : null
      };
      
      if (id) {
        await contentService.updatePost(id, updatedPost);
        toast({
          title: 'Content updated',
          description: 'Your content has been successfully updated.'
        });
      } else {
        const result = await contentService.createPost(updatedPost);
        toast({
          title: 'Content created',
          description: 'Your content has been successfully created.'
        });
        navigate(`/admin/content/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const getBlockPreview = (block: ContentBlockData) => {
    switch (block.type) {
      case 'text':
        return <ReactMarkdown>{block.content}</ReactMarkdown>;
      case 'image':
        return (
          <figure className="my-4">
            <img src={block.url} alt={block.caption || 'Image'} className="max-w-full rounded-lg" />
            {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-2">{block.caption}</figcaption>}
          </figure>
        );
      case 'code':
        return (
          <div className="my-4">
            <SyntaxHighlighter language={block.language || 'javascript'} style={vscDarkPlus}>
              {block.content}
            </SyntaxHighlighter>
            {block.caption && <div className="text-sm text-gray-500 mt-1">{block.caption}</div>}
          </div>
        );
      case 'heading':
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        return <HeadingTag className="font-bold my-4">{block.content}</HeadingTag>;
      case 'video':
        return (
          <figure className="my-4">
            <video 
              src={block.url} 
              controls 
              className="w-full rounded-lg"
              poster={block.caption ? undefined : ""}
            >
              Your browser does not support the video tag.
            </video>
            {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-2">{block.caption}</figcaption>}
          </figure>
        );
      case 'quote':
        return (
          <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 italic">
            {block.content}
            {block.caption && <footer className="text-sm text-gray-600 mt-2 not-italic">— {block.caption}</footer>}
          </blockquote>
        );
      case 'divider':
        return <hr className="my-8 border-t border-gray-300" />;
      default:
        return <p>{block.content}</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
        <span className="ml-2 text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
          <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 mr-3 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              title="Go back"
              aria-label="Go back"
            >
              <FiArrowLeft />
          </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Content' : 'Create New Content'}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
          <button
            type="button"
              onClick={handlePreview}
              className={`inline-flex items-center px-4 py-2 border ${
                previewMode ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700'
              } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <FiEye className="-ml-1 mr-2 h-5 w-5" />
              {previewMode ? 'Edit Mode' : 'Preview'}
          </button>
          
          <button
              type="submit"
              form="content-form"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiSave className="-ml-1 mr-2 h-5 w-5" />
              {saving ? 'Saving...' : 'Save Draft'}
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
              <FiCheckSquare className="-ml-1 mr-2 h-5 w-5" />
              Publish
          </button>
          
          <button
            type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className={`inline-flex items-center px-4 py-2 border ${
                showSchedule ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700'
              } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <FiCalendar className="-ml-1 mr-2 h-5 w-5" />
              Schedule
          </button>
        </div>
      </div>
      
      {showSchedule && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Schedule Publication</h3>
            <div className="flex flex-col sm:flex-row gap-4">
            <div>
                <label htmlFor="scheduled-date" className="block text-sm text-gray-700">
                  Date
                </label>
              <input
                type="date"
                  id="scheduled-date"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                  title="Scheduled publication date"
              />
            </div>
            <div>
                <label htmlFor="scheduled-time" className="block text-sm text-gray-700">
                  Time
                </label>
              <input
                type="time"
                  id="scheduled-time"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                  title="Scheduled publication time"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                  onClick={handleSubmit}
                disabled={saving || !scheduledDate || !scheduledTime}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiClock className="-ml-1 mr-2 h-5 w-5" />
                  Schedule Publication
              </button>
            </div>
          </div>
          {errors.scheduledFor && (
            <p className="mt-2 text-sm text-red-600">{errors.scheduledFor}</p>
          )}
        </div>
      )}
      
        {errors.form && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{errors.form}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Form */}
      <form id="content-form" onSubmit={handleSubmit}>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          {/* Basic Info */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={post.title || ''}
                onChange={handleChange}
                  disabled={previewMode}
                className={`mt-1 block w-full border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                Slug
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  value={post.slug || ''}
                  onChange={handleChange}
                    disabled={previewMode}
                  className={`block w-full border ${errors.slug ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
              </div>
              {errors.slug && (
                <p className="mt-2 text-sm text-red-600">{errors.slug}</p>
              )}
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="service" className="block text-sm font-medium text-gray-700">
                Service
              </label>
              <select
                id="service"
                name="service"
                value={post.service || ''}
                onChange={handleChange}
                  disabled={previewMode}
                className={`mt-1 block w-full ${errors.service ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
              {errors.service && (
                <p className="mt-2 text-sm text-red-600">{errors.service}</p>
              )}
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={post.category || ''}
                onChange={handleChange}
                  disabled={previewMode || !post.service}
                className={`mt-1 block w-full ${errors.category ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select a category</option>
                {categories
                  .filter(category => !post.service || category.service === post.service)
                  .map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
              </select>
              {errors.category && (
                <p className="mt-2 text-sm text-red-600">{errors.category}</p>
              )}
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
                Excerpt
              </label>
              <div className="mt-1">
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  value={post.excerpt || ''}
                  onChange={handleChange}
                    disabled={previewMode}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Brief description or excerpt of the content"
                ></textarea>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                A brief summary that will be displayed in content listings
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
            <nav className="flex">
            <Tab
              title="Content"
              active={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
            />
            <Tab
              title="Featured Image"
              active={activeTab === 'featuredImage'}
              onClick={() => setActiveTab('featuredImage')}
            />
            <Tab
              title="Tags"
              active={activeTab === 'tags'}
              onClick={() => setActiveTab('tags')}
            />
            <Tab
              title="SEO"
              active={activeTab === 'seo'}
              onClick={() => setActiveTab('seo')}
            />
            <Tab
              title="Advanced"
              active={activeTab === 'advanced'}
              onClick={() => setActiveTab('advanced')}
            />
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="px-4 py-5 sm:p-6">
          {/* Content tab */}
          {activeTab === 'content' && (
            <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditorMode('markdown')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        editorMode === 'markdown'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('blocks')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        editorMode === 'blocks'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Content Blocks
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      aria-label="Upload image"
                      title="Upload image"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || previewMode}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Add image"
                      aria-label="Add image"
                    >
                      <FiImage className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={insertCodeBlock}
                      disabled={previewMode || editorMode !== 'markdown'}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Add code block"
                      aria-label="Add code block"
                    >
                      <FiCode className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {!previewMode && (
                  <>
                    {editorMode === 'markdown' ? (
              <div className="mb-5">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          Content (Markdown)
                </label>
                        <div className={`mt-1 ${errors.content ? 'border border-red-300 rounded-md' : ''}`}>
                  <textarea
                    id="content"
                    name="content"
                    rows={20}
                    value={post.content || ''}
                    onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
                            aria-label="Content in markdown format"
                  ></textarea>
                </div>
                {errors.content && (
                  <p className="mt-2 text-sm text-red-600">{errors.content}</p>
                )}
                        <p className="mt-2 text-sm text-gray-500">
                          You can use Markdown syntax for formatting. Use `###` for headings, `*` for italics, `**` for bold,
                          and ` ``` ` for code blocks.
                        </p>
              </div>
                    ) : (
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Content Blocks
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowBlockForm(true)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Add Block
                          </button>
                        </div>
                        
                        {post.contentBlocks && post.contentBlocks.length > 0 ? (
                          <div className="space-y-4 mb-4">
                            {post.contentBlocks.map((block, index) => (
                              <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                                  <span className="text-sm font-medium capitalize">{block.type}</span>
                                  <div className="flex space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => moveContentBlock(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                      title="Move up"
                                      aria-label={`Move block ${index + 1} up`}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveContentBlock(index, 'down')}
                                      disabled={index === post.contentBlocks.length - 1}
                                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                      title="Move down"
                                      aria-label={`Move block ${index + 1} down`}
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeContentBlock(index)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                      title="Remove block"
                                      aria-label={`Remove block ${index + 1}`}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                                <div className="p-4">
                                  {getBlockPreview(block)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-8 text-center rounded-md mb-4">
                            <p className="text-gray-500">No content blocks added yet.</p>
                            <button
                              type="button"
                              onClick={() => setShowBlockForm(true)}
                              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Add Your First Block
                            </button>
            </div>
          )}
          
                        {showBlockForm && (
                          <div className="border border-gray-200 rounded-md p-4 mb-4">
                            <h3 className="font-medium mb-4">Add Content Block</h3>
                            <div className="space-y-4">
            <div>
                                <label htmlFor="block-type" className="block text-sm font-medium text-gray-700 mb-1">
                                  Block Type
                </label>
                                <select
                                  id="block-type"
                                  name="type"
                                  value={newBlock.type}
                                  onChange={handleContentBlockChange}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  aria-label="Select block type"
                                >
                                  <option value="text">Text</option>
                                  <option value="heading">Heading</option>
                                  <option value="image">Image</option>
                                  <option value="video">Video</option>
                                  <option value="code">Code</option>
                                  <option value="quote">Quote</option>
                                  <option value="list">List</option>
                                  <option value="divider">Divider</option>
                                </select>
                              </div>
                              
                              {newBlock.type === 'heading' && (
                                <div>
                                  <label htmlFor="heading-level" className="block text-sm font-medium text-gray-700 mb-1">
                                    Heading Level
                                  </label>
                                  <select
                                    id="heading-level"
                                    name="level"
                                    value={newBlock.level || 2}
                                    onChange={handleContentBlockChange}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    aria-label="Select heading level"
                                  >
                                    <option value={1}>Heading 1</option>
                                    <option value={2}>Heading 2</option>
                                    <option value={3}>Heading 3</option>
                                    <option value={4}>Heading 4</option>
                                  </select>
                                </div>
                              )}
                              
                              {newBlock.type === 'code' && (
                                <div>
                                  <label htmlFor="code-language" className="block text-sm font-medium text-gray-700 mb-1">
                                    Language
                                  </label>
                                  <select
                                    id="code-language"
                                    name="language"
                                    value={newBlock.language || 'javascript'}
                                    onChange={handleContentBlockChange}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    aria-label="Select code language"
                                  >
                                    {getLanguageOptions().map((option, index) => (
                                      <option key={index} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                              {(newBlock.type === 'image' || newBlock.type === 'video') && (
                                <div>
                                  <label htmlFor="media-url" className="block text-sm font-medium text-gray-700 mb-1">
                                    Media URL
                                  </label>
                    <input
                      type="text"
                                    id="media-url"
                                    name="url"
                                    value={newBlock.url || ''}
                                    onChange={handleContentBlockChange}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder={`Enter ${newBlock.type} URL`}
                    />
                  </div>
                              )}
                              
                              {newBlock.type !== 'divider' && (
                                <div>
                                  <label htmlFor="block-content" className="block text-sm font-medium text-gray-700 mb-1">
                                    {newBlock.type === 'image' || newBlock.type === 'video' 
                                      ? 'Caption' 
                                      : newBlock.type === 'quote'
                                        ? 'Attribution'
                                        : 'Content'}
                                  </label>
                                  <textarea
                                    id="block-content"
                                    name="content"
                                    value={newBlock.content}
                                    onChange={handleContentBlockChange}
                                    rows={newBlock.type === 'code' ? 6 : 3}
                                    className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                      newBlock.type === 'code' ? 'font-mono' : ''
                                    }`}
                                    placeholder={`Enter ${newBlock.type === 'image' || newBlock.type === 'video' 
                                      ? 'caption' 
                                      : newBlock.type === 'quote'
                                        ? 'quote text'
                                        : 'content'}`}
                                  ></textarea>
                </div>
                              )}
                              
                              <div className="flex justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setShowBlockForm(false)}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={addContentBlock}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  Add Block
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {previewMode && (
                  <div className="prose max-w-none border p-6 rounded-md bg-white">
                    <h1>{post.title}</h1>
                    {post.content ? (
                      <ReactMarkdown>{post.content}</ReactMarkdown>
                    ) : post.contentBlocks && post.contentBlocks.length > 0 ? (
                      <div>
                        {post.contentBlocks.map((block, index) => (
                          <div key={index}>
                            {getBlockPreview(block)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No content to preview.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Featured Image tab */}
            {activeTab === 'featuredImage' && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image
                  </label>
                  
                  {post.featuredImage ? (
                    <div className="mt-2 relative">
                      <img 
                        src={post.featuredImage} 
                        alt="Featured"
                        className="w-full max-h-96 object-cover rounded-lg"
                      />
                      {!previewMode && (
                        <button 
                          type="button"
                          onClick={() => setPost(prev => ({ ...prev, featuredImage: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                          title="Remove image"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">No featured image</p>
                        </div>
                        {!previewMode && (
                          <div className="mt-4">
                            <input
                              type="file"
                              accept="image/*"
                              id="featured-image"
                              className="hidden"
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (!files || files.length === 0) return;
                                
                                setUploading(true);
                                try {
                                  const file = files[0];
                                  const result = await contentService.uploadImage(file, post.service || 'general');
                                  setPost(prev => ({ ...prev, featuredImage: result.url }));
                                  toast({
                                    title: 'Image uploaded',
                                    description: 'Featured image has been uploaded successfully'
                                  });
                                } catch (error) {
                                  console.error('Error uploading image:', error);
                                  toast({
                                    title: 'Upload failed',
                                    description: 'Failed to upload featured image. Please try again.',
                                    variant: 'destructive'
                                  });
                                } finally {
                                  setUploading(false);
                                }
                              }}
                            />
                            <label
                              htmlFor="featured-image"
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                              <FiUpload className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                              Upload Image
                            </label>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                  <label htmlFor="media-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Media Type
                  </label>
                  <select
                    id="media-type"
                    name="mediaType"
                    value={post.mediaType || 'image'}
                    onChange={(e) => setPost(prev => ({ ...prev, mediaType: e.target.value as any }))}
                    disabled={previewMode}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    aria-label="Select media type"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
                
                {post.mediaType === 'video' || post.mediaType === 'audio' ? (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {post.mediaType === 'video' ? 'Video' : 'Audio'} URL
                    </label>
                    <input
                      type="text"
                      value={post.mediaUrl || ''}
                      onChange={(e) => setPost(prev => ({ ...prev, mediaUrl: e.target.value }))}
                      disabled={previewMode}
                      placeholder={`Enter ${post.mediaType} URL (YouTube, Vimeo, SoundCloud, etc.)`}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                ) : null}
            </div>
          )}
          
          {/* Tags tab */}
          {activeTab === 'tags' && (
            <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                  <div className="relative">
                    <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={post.tags ? post.tags.join(', ') : ''}
                      onChange={handleTagsChange}
                      disabled={previewMode}
                      placeholder="Enter tags separated by commas"
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Tags help users find related content. Separate tags with commas.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Tags
                  </label>
                  {post.tags && post.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tag}
                          {!previewMode && (
                            <button
                              type="button"
                              onClick={() => setPost(prev => ({
                                ...prev,
                                tags: prev.tags ? prev.tags.filter((_, i) => i !== index) : []
                              }))}
                              className="ml-1.5 text-blue-600 hover:text-blue-800"
                            >
                              &times;
                            </button>
                          )}
                      </span>
                    ))}
                  </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tags added yet.</p>
                )}
              </div>
            </div>
          )}
          
          {/* SEO tab */}
          {activeTab === 'seo' && (
            <div>
                <div className="space-y-6">
                  <div>
                <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">
                  SEO Title
                </label>
                <input
                  type="text"
                  id="seoTitle"
                      name="seoTitle"
                  value={post.seoTitle || ''}
                  onChange={handleChange}
                      disabled={previewMode}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter SEO title (defaults to post title if empty)"
                />
                    <p className="mt-1 text-sm text-gray-500">
                      {(post.seoTitle || post.title || '').length}/60 characters
                </p>
              </div>
              
                  <div>
                <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">
                  SEO Description
                </label>
                <textarea
                  id="seoDescription"
                  name="seoDescription"
                  rows={3}
                  value={post.seoDescription || ''}
                  onChange={handleChange}
                      disabled={previewMode}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter SEO description (defaults to excerpt if empty)"
                ></textarea>
                    <p className="mt-1 text-sm text-gray-500">
                      {(post.seoDescription || post.excerpt || '').length}/160 characters
                </p>
              </div>
              
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                  SEO Keywords
                </label>
                    <div className="relative">
                <input
                  type="text"
                        value={post.seoKeywords ? post.seoKeywords.join(', ') : ''}
                  onChange={handleSeoKeywordsChange}
                        disabled={previewMode}
                        placeholder="Enter keywords separated by commas"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {!previewMode && (
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Search Engine Preview
                      </h3>
                      <div className="space-y-1">
                        <p className="text-blue-800 text-lg font-medium truncate">
                          {post.seoTitle || post.title || 'Page Title'}
                        </p>
                        <p className="text-green-700 text-sm">
                          {`https://your-site.com/${post.service}/${post.slug || 'post-slug'}`}
                        </p>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.seoDescription || post.excerpt || 'No description available.'}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
          
          {/* Advanced tab */}
          {activeTab === 'advanced' && (
            <div>
                <div className="space-y-6">
                  <div className="flex items-center">
                  <input
                      type="checkbox"
                      id="featured"
                      name="featured"
                      checked={post.featured || false}
                      onChange={handleCheckboxChange}
                      disabled={previewMode}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                      Feature this content (will appear in featured sections)
                </label>
              </div>
              
                  <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={post.status || 'draft'}
                  onChange={handleChange}
                      disabled={previewMode}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
                  {post.status === 'published' && post.publishedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Published Date
                      </label>
                      <div className="mt-1">
                        <div className="p-2 border border-gray-200 rounded-md bg-gray-50 text-sm">
                          {new Date(post.publishedAt).toLocaleString()}
                        </div>
                  </div>
                </div>
              )}
                </div>
            </div>
          )}
        </div>
      </div>
      </form>
    </div>
  );
};

export default ContentEditor; 