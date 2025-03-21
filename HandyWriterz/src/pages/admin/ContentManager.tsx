import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Editor } from '@tinymce/tinymce-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogPost, ServicePage } from '@/types/blog';
import { 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost,
  updateServicePage
} from '@/services/blogService';
import { Button } from '@/components/ui/button';
import { 
  FileTextIcon, 
  EditIcon, 
  TrashIcon, 
  PlusIcon,
  Image as ImageIcon,
  Calendar,
  Tag,
  Eye,
  LayoutGrid,
  FileText,
  Save
} from 'lucide-react';
import { BlogPostCard } from '@/components/blog/BlogPostCard';

export default function ContentManager() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<ServicePage[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  
  const [serviceContent, setServiceContent] = useState<string>('');
  const [postContent, setPostContent] = useState<string>('');
  const [postData, setPostData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    featured_image: '',
    service_type: '',
    meta_title: '',
    meta_description: '',
    tags: [],
    is_published: false
  });
  
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    
    loadServicePages();
    loadBlogPosts();
  }, [isAdmin, navigate]);

  const loadServicePages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_pages')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading service pages:', error);
      toast.error('Failed to load service pages');
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const loadBlogPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Failed to load blog posts');
    } else {
      setBlogPosts(data || []);
    }
    setLoading(false);
  };

  const handleServiceSelect = async (id: string) => {
    if (id === selectedServiceId) return;
    
    setSelectedServiceId(id);
    setSelectedPostId('');
    
    if (!id) {
      setServiceContent('');
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('service_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading service page:', error);
      toast.error('Failed to load service page');
    } else if (data) {
      setServiceContent(data.content || '');
    }
    setLoading(false);
  };

  const handlePostSelect = async (id: string) => {
    if (id === selectedPostId) return;
    
    setSelectedPostId(id);
    setSelectedServiceId('');
    setIsCreatingPost(false);
    
    if (!id) {
      setPostContent('');
      setPostData({
        title: '',
        slug: '',
        excerpt: '',
        featured_image: '',
        service_type: '',
        meta_title: '',
        meta_description: '',
        tags: [],
        is_published: false
      });
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading blog post:', error);
      toast.error('Failed to load blog post');
    } else if (data) {
      setPostContent(data.content || '');
      setPostData({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        featured_image: data.featured_image || '',
        service_type: data.service_type || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        tags: data.tags || [],
        is_published: data.is_published || false
      });
    }
    setLoading(false);
  };

  const handleNewPost = () => {
    setSelectedPostId('');
    setSelectedServiceId('');
    setIsCreatingPost(true);
    setPostContent('');
    setPostData({
      title: '',
      slug: '',
      excerpt: '',
      featured_image: '',
      service_type: '',
      meta_title: '',
      meta_description: '',
      tags: [],
      is_published: false
    });
  };

  const handleUpdateService = async () => {
    if (!selectedServiceId) return;
    
    setIsSaving(true);
    try {
      await updateServicePage(selectedServiceId, { content: serviceContent });
      toast.success('Service page updated successfully');
      await loadServicePages();
    } catch (err) {
      console.error('Error updating service page:', err);
      toast.error('Failed to update service page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    setIsSaving(true);
    try {
      // Generate slug if not provided
      if (!postData.slug && postData.title) {
        postData.slug = postData.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-');
      }
      
      // Set meta title if not provided
      if (!postData.meta_title && postData.title) {
        postData.meta_title = postData.title;
      }
      
      // Validate required fields
      if (!postData.title || !postData.slug || !postData.service_type) {
        toast.error('Title, slug, and service type are required');
        setIsSaving(false);
        return;
      }
      
      if (isCreatingPost) {
        // Create new post
        const newPost = await createBlogPost({
          ...postData,
          content: postContent,
          published_at: postData.is_published ? new Date().toISOString() : null
        });
        
        setSelectedPostId(newPost.id);
        setIsCreatingPost(false);
        toast.success('Blog post created successfully');
      } else if (selectedPostId) {
        // Update existing post
        await updateBlogPost(selectedPostId, {
          ...postData,
          content: postContent,
          published_at: postData.is_published ? new Date().toISOString() : null
        });
        toast.success('Blog post updated successfully');
      }
      
      await loadBlogPosts();
    } catch (err) {
      console.error('Error saving blog post:', err);
      toast.error('Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPostId || !confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteBlogPost(selectedPostId);
      toast.success('Blog post deleted successfully');
      setSelectedPostId('');
      setPostContent('');
      setPostData({
        title: '',
        slug: '',
        excerpt: '',
        featured_image: '',
        service_type: '',
        meta_title: '',
        meta_description: '',
        tags: [],
        is_published: false
      });
      await loadBlogPosts();
    } catch (err) {
      console.error('Error deleting blog post:', err);
      toast.error('Failed to delete blog post');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for blog post fields
  const handlePostDataChange = (field: string, value: any) => {
    setPostData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !postData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      setPostData(prev => ({ ...prev, slug }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Content Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-8">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Service Pages
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog Posts
          </TabsTrigger>
        </TabsList>
        
        {/* Service Pages Content Management */}
        <TabsContent value="services">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3 space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-4">Service Pages</h2>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {services.map(service => (
                      <button
                        key={service.id}
                        className={`w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors ${
                          selectedServiceId === service.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleServiceSelect(service.id)}
                      >
                        <div className="font-medium truncate">{service.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {service.slug}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-9">
              {selectedServiceId ? (
                <div className="bg-white p-6 rounded-lg shadow space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-medium">
                      Edit Service Page Content
                    </h2>
                    <Button
                      onClick={handleUpdateService}
                      disabled={loading || isSaving}
                      className="flex items-center gap-2"
                    >
                      {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                  
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4">Service Content</h3>
                    <Editor
                      value={serviceContent}
                      onEditorChange={(content) => setServiceContent(content)}
                      init={{
                        height: 500,
                        menubar: true,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                          'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                          'fullscreen', 'insertdatetime', 'media', 'table', 'code',
                          'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image | code'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Page Selected</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Select a service page from the sidebar to edit its content
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Blog Posts Content Management */}
        <TabsContent value="blog">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3 space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Blog Posts</h2>
                  <Button
                    size="sm"
                    onClick={handleNewPost}
                    className="flex items-center gap-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    New
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blogPosts.map(post => (
                      <button
                        key={post.id}
                        className={`w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors ${
                          selectedPostId === post.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handlePostSelect(post.id)}
                      >
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{post.service_type}</span>
                          <span className={`px-1.5 py-0.5 rounded-full ${
                            post.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {post.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-9">
              {selectedPostId || isCreatingPost ? (
                <div className="bg-white p-6 rounded-lg shadow space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-medium">
                      {isCreatingPost ? 'Create New Blog Post' : 'Edit Blog Post'}
                    </h2>
                    <div className="flex items-center gap-2">
                      {!isCreatingPost && (
                        <Button
                          variant="destructive"
                          onClick={handleDeletePost}
                          disabled={loading || isSaving}
                          className="flex items-center gap-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </Button>
                      )}
                      <Button
                        onClick={handleUpdatePost}
                        disabled={loading || isSaving}
                        className="flex items-center gap-2"
                      >
                        {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                        {isSaving ? 'Saving...' : (isCreatingPost ? 'Create Post' : 'Update Post')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Post Title *
                        </label>
                        <input
                          type="text"
                          value={postData.title}
                          onChange={(e) => handlePostDataChange('title', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter post title"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slug *
                        </label>
                        <input
                          type="text"
                          value={postData.slug}
                          onChange={(e) => handlePostDataChange('slug', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          placeholder="post-url-slug"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Service Type *
                        </label>
                        <select
                          value={postData.service_type}
                          onChange={(e) => handlePostDataChange('service_type', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          required
                          aria-label="Select service type"
                        >
                          <option value="">Select a service type</option>
                          {services.map(service => (
                            <option key={service.id} value={service.slug}>
                              {service.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Excerpt
                        </label>
                        <textarea
                          value={postData.excerpt}
                          onChange={(e) => handlePostDataChange('excerpt', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          placeholder="Brief description of the post"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Featured Image URL
                        </label>
                        <input
                          type="url"
                          value={postData.featured_image}
                          onChange={(e) => handlePostDataChange('featured_image', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Title (SEO)
                        </label>
                        <input
                          type="text"
                          value={postData.meta_title}
                          onChange={(e) => handlePostDataChange('meta_title', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          placeholder="SEO Title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Description (SEO)
                        </label>
                        <textarea
                          value={postData.meta_description}
                          onChange={(e) => handlePostDataChange('meta_description', e.target.value)}
                          className="w-full p-2 border rounded-md"
                          placeholder="SEO Description"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags (comma separated)
                        </label>
                        <input
                          type="text"
                          value={postData.tags?.join(', ')}
                          onChange={(e) => handlePostDataChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
                          className="w-full p-2 border rounded-md"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_published"
                          checked={postData.is_published}
                          onChange={(e) => handlePostDataChange('is_published', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                          Publish Post
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4">Post Content</h3>
                    <Editor
                      value={postContent}
                      onEditorChange={(content) => setPostContent(content)}
                      init={{
                        height: 500,
                        menubar: true,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                          'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                          'fullscreen', 'insertdatetime', 'media', 'table', 'code',
                          'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image | code'
                      }}
                    />
                  </div>
                  
                  {/* Preview Section */}
                  {postData.title && (
                    <div className="border p-4 rounded-md">
                      <h3 className="font-medium mb-4">Preview</h3>
                      <div className="max-w-sm">
                        <BlogPostCard 
                          post={{
                            id: selectedPostId || 'preview',
                            title: postData.title,
                            slug: postData.slug || '',
                            content: postContent,
                            excerpt: postData.excerpt || '',
                            featured_image: postData.featured_image || '',
                            service_type: postData.service_type || '',
                            category_id: '',
                            is_published: postData.is_published || false,
                            published_at: new Date().toISOString(),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            author_id: user?.id || '',
                            meta_title: postData.meta_title || '',
                            meta_description: postData.meta_description || '',
                            tags: postData.tags || [],
                            views: 0
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Blog Post Selected</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Select a blog post from the sidebar to edit, or create a new one
                  </p>
                  <Button
                    onClick={handleNewPost}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create New Blog Post
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 