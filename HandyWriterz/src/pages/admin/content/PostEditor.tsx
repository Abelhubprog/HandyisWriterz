import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminContentService, PostUpdateInput } from '@/services/adminContentService';
import { 
  Save, 
  ArrowLeft, 
  Calendar, 
  Image, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Trash, 
  Upload, 
  X,
  Eye
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import RichTextEditor from '@/components/admin/RichTextEditor';
import MediaLibrary from '@/components/admin/MediaLibrary';
import toast from 'react-hot-toast';

/**
 * PostEditor Component
 * 
 * A comprehensive post editor for creating and editing content
 * Features:
 * - Rich text editing with markdown support
 * - Media library integration
 * - SEO optimization fields
 * - Publishing options (draft, publish, schedule)
 * - Category and tag management
 */
const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(id ? true : false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Post data state
  const [post, setPost] = useState<PostUpdateInput>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    service: '',
    category: '',
    tags: [],
    status: 'draft',
    scheduledFor: null,
    featured: false,
    featuredImage: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
  });
  
  // Form input states
  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  
  // Options for select elements
  const [services] = useState([
    'adult-health-nursing',
    'mental-health-nursing',
    'child-nursing',
    'crypto',
    'special-education',
    'social-work',
    'ai-services'
  ]);
  
  const [categories, setCategories] = useState<{id: string, name: string, service: string}[]>([]);
  
  // Load post data if editing existing post
  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        setIsLoading(true);
        try {
          const postData = await adminContentService.getPostById(id);
          if (postData) {
            setPost({
              title: postData.title || '',
              slug: postData.slug || '',
              content: postData.content || '',
              excerpt: postData.excerpt || '',
              service: postData.service || '',
              category: postData.category || '',
              tags: postData.tags || [],
              status: postData.status || 'draft',
              scheduledFor: postData.scheduledFor || null,
              featured: postData.featured || false,
              featuredImage: postData.featuredImage || '',
              mediaType: postData.mediaType,
              mediaUrl: postData.mediaUrl,
              seoTitle: postData.seoTitle || '',
              seoDescription: postData.seoDescription || '',
              seoKeywords: postData.seoKeywords || [],
            });
          } else {
            toast.error('Post not found');
            navigate('/admin/content/posts');
          }
        } catch (error) {
          console.error('Error fetching post:', error);
          toast.error('Failed to load post');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPost();
    }
  }, [id, navigate]);
  
  // Load categories when service changes
  useEffect(() => {
    if (post.service) {
      const fetchCategories = async () => {
        try {
          const categoriesData = await adminContentService.getCategories(post.service);
          setCategories(categoriesData);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      
      fetchCategories();
    }
  }, [post.service]);
  
  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };
  
  // Handle title change and auto-generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPost(prev => ({
      ...prev,
      title: newTitle,
      slug: prev.slug || generateSlug(newTitle), // Only auto-generate if slug is empty
      seoTitle: prev.seoTitle || newTitle // Auto-fill SEO title if empty
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const errors = adminContentService.validatePostData(post);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix the errors before saving');
      return;
    }
    
    setIsSaving(true);
    setValidationErrors([]);
    
    try {
      if (id) {
        // Update existing post
        await adminContentService.updatePost(id, post);
        toast.success('Post updated successfully');
      } else {
        // Create new post
        const newPost = await adminContentService.createPost(post);
        toast.success('Post created successfully');
        // Navigate to edit page for the new post
        navigate(`/admin/content/posts/edit/${newPost.id}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle tag management
  const addTag = () => {
    if (newTag && !post.tags?.includes(newTag)) {
      setPost(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
      setNewTag('');
    }
  };
  
  const removeTag = (tag: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };
  
  // Handle SEO keyword management
  const addKeyword = () => {
    if (newKeyword && !post.seoKeywords?.includes(newKeyword)) {
      setPost(prev => ({
        ...prev,
        seoKeywords: [...(prev.seoKeywords || []), newKeyword]
      }));
      setNewKeyword('');
    }
  };
  
  const removeKeyword = (keyword: string) => {
    setPost(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords?.filter(k => k !== keyword) || []
    }));
  };
  
  // Handle media selection from library
  const handleMediaSelect = (mediaUrl: string) => {
    setPost(prev => ({
      ...prev,
      featuredImage: mediaUrl
    }));
    setShowMediaLibrary(false);
  };
  
  // Format the service name for display
  const formatServiceName = (service: string) => {
    return service
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{id ? 'Edit Post' : 'Create Post'} | HandyWriterz Admin</title>
      </Helmet>
      
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/content/posts')}
              aria-label="Back to posts"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to posts
            </Button>
            <h1 className="text-2xl font-bold">
              {id ? 'Edit Post' : 'Create Post'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              aria-label={isPreviewMode ? "Edit mode" : "Preview mode"}
            >
              {isPreviewMode ? 'Edit Mode' : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => formRef.current?.requestSubmit()}
              disabled={isSaving}
              aria-label="Save post"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
        
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-600 font-medium">Please fix the following errors:</h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-red-600">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {isPreviewMode ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <div className="max-w-3xl mx-auto">
              {post.featuredImage && (
                <div className="mb-6">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-auto rounded-lg object-cover max-h-[400px]"
                  />
                </div>
              )}
              
              <h1 className="text-3xl font-bold mb-4">{post.title || 'Untitled Post'}</h1>
              
              {post.excerpt && (
                <div className="text-lg text-gray-600 mb-6 italic">
                  {post.excerpt}
                </div>
              )}
              
              <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content || '<p>No content yet.</p>' }} />
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-6">
                    <div>
                      <Label htmlFor="title">Post Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter a compelling title"
                        value={post.title}
                        onChange={handleTitleChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        placeholder="url-friendly-post-slug"
                        value={post.slug}
                        onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        placeholder="Brief summary of the post"
                        value={post.excerpt}
                        onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                        className="mt-1 h-24"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <div className="mt-1">
                        <RichTextEditor
                          value={post.content}
                          onChange={(value) => setPost(prev => ({ ...prev, content: value }))}
                          placeholder="Write your post content here..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="media" className="space-y-6">
                    <div>
                      <Label>Featured Image</Label>
                      <div className="mt-2">
                        {post.featuredImage ? (
                          <div className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={post.featuredImage}
                              alt="Featured"
                              className="w-full h-auto max-h-[300px] object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => setPost(prev => ({ ...prev, featuredImage: '' }))}
                              aria-label="Remove featured image"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full py-8 border-dashed"
                            onClick={() => setShowMediaLibrary(true)}
                          >
                            <Upload className="h-5 w-5 mr-2" />
                            Select Featured Image
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="mediaType">Media Type</Label>
                      <Select
                        value={post.mediaType || ''}
                        onValueChange={(value) => setPost(prev => ({ ...prev, mediaType: value as any }))}
                      >
                        <SelectTrigger id="mediaType" className="mt-1">
                          <SelectValue placeholder="Select media type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {post.mediaType && (
                      <div>
                        <Label htmlFor="mediaUrl">Media URL</Label>
                        <Input
                          id="mediaUrl"
                          placeholder="Enter media URL"
                          value={post.mediaUrl || ''}
                          onChange={(e) => setPost(prev => ({ ...prev, mediaUrl: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="seo" className="space-y-6">
                    <div>
                      <Label htmlFor="seoTitle">SEO Title</Label>
                      <Input
                        id="seoTitle"
                        placeholder="SEO optimized title (recommended 50-60 characters)"
                        value={post.seoTitle}
                        onChange={(e) => setPost(prev => ({ ...prev, seoTitle: e.target.value }))}
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Characters: {post.seoTitle?.length || 0}/60
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="seoDescription">Meta Description</Label>
                      <Textarea
                        id="seoDescription"
                        placeholder="SEO description (recommended 150-160 characters)"
                        value={post.seoDescription}
                        onChange={(e) => setPost(prev => ({ ...prev, seoDescription: e.target.value }))}
                        className="mt-1 h-24"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Characters: {post.seoDescription?.length || 0}/160
                      </p>
                    </div>
                    
                    <div>
                      <Label>SEO Keywords</Label>
                      <div className="flex mt-1">
                        <Input
                          placeholder="Add SEO keyword"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKeyword();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addKeyword}
                          className="ml-2"
                        >
                          Add
                        </Button>
                      </div>
                      
                      {post.seoKeywords && post.seoKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.seoKeywords.map((keyword, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{keyword}</span>
                              <button
                                type="button"
                                onClick={() => removeKeyword(keyword)}
                                className="text-gray-500 hover:text-red-500"
                                aria-label={`Remove ${keyword}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-medium mb-4">Publish Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={post.status}
                        onValueChange={(value) => setPost(prev => ({ ...prev, status: value as any }))}
                      >
                        <SelectTrigger id="status" className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {post.status === 'scheduled' && (
                      <div>
                        <Label htmlFor="scheduledFor">Schedule Date</Label>
                        <Input
                          id="scheduledFor"
                          type="datetime-local"
                          value={post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setPost(prev => ({
                            ...prev,
                            scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null
                          }))}
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="featured" className="cursor-pointer">Featured Post</Label>
                      <Switch
                        id="featured"
                        checked={post.featured}
                        onCheckedChange={(checked) => setPost(prev => ({ ...prev, featured: checked }))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-medium mb-4">Organization</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="service">Service</Label>
                      <Select
                        value={post.service}
                        onValueChange={(value) => setPost(prev => ({ ...prev, service: value }))}
                      >
                        <SelectTrigger id="service" className="mt-1">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service}>
                              {formatServiceName(service)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={post.category}
                        onValueChange={(value) => setPost(prev => ({ ...prev, category: value }))}
                        disabled={!post.service || categories.length === 0}
                      >
                        <SelectTrigger id="category" className="mt-1">
                          <SelectValue placeholder={
                            !post.service
                              ? "Select a service first"
                              : categories.length === 0
                              ? "No categories available"
                              : "Select category"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Tags</Label>
                      <div className="flex mt-1">
                        <Input
                          placeholder="Add tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addTag}
                          className="ml-2"
                        >
                          Add
                        </Button>
                      </div>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-gray-500 hover:text-red-500"
                                aria-label={`Remove ${tag}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/content/posts')}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save {post.status === 'published' ? 'and Publish' : 'Post'}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        
        {/* Media Library Dialog */}
        {showMediaLibrary && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Media Library</h2>
                <button
                  onClick={() => setShowMediaLibrary(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 h-[calc(80vh-60px)] overflow-y-auto">
                <MediaLibrary onSelect={handleMediaSelect} onClose={() => setShowMediaLibrary(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PostEditor;
