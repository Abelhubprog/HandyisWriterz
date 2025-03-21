import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash, 
  Calendar, 
  User, 
  Tag, 
  Settings, 
  Upload, 
  Image, 
  FileUp, 
  Save, 
  Book, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  BookOpen,
  MessageSquare,
  Heart
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

// Import the Rich Text Editor
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Post {
  id: string | number;
  title: string;
  content: string;
  category: string;
  author?: string;
  author_id?: string;
  service_type: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at?: string;
  resource_links?: string[];
  metadata?: {
    views?: number;
    likes?: number;
    comments?: number;
    featured?: boolean;
    reading_time?: string;
    cover_image?: string;
    seo_keywords?: string[];
  };
}

interface Service {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  color: string;
}

const ServiceManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
    views: 0,
    likes: 0,
    comments: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState<Partial<Post>>({
    title: '',
    content: '',
    category: '',
    service_type: '',
    status: 'draft',
    resource_links: []
  });
  const [resourceLink, setResourceLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Quill editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['code-block'],
    ],
  };

  // Quill editor formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background', 'font', 'align',
    'code-block'
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchPostsByService(selectedService);
      fetchCategoriesByService(selectedService);
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;

      console.log('Fetched services:', data);
      setServices(data || []);
      
      if (data && data.length > 0) {
        setSelectedService(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsByService = async (serviceId: string) => {
    try {
      setLoading(true);
      
      // Get service type from service id
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('path')
        .eq('id', serviceId)
        .single();
      
      if (serviceError) throw serviceError;
      
      const serviceType = serviceData?.path;
      
      // Fetch posts for this service type
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('service_type', serviceType)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
      
      // Calculate stats
      const publishedPosts = data?.filter(post => post.status === 'published') || [];
      const drafts = data?.filter(post => post.status === 'draft') || [];
      const archived = data?.filter(post => post.status === 'archived') || [];
      
      const totalViews = data?.reduce((sum, post) => sum + (post.metadata?.views || 0), 0) || 0;
      const totalLikes = data?.reduce((sum, post) => sum + (post.metadata?.likes || 0), 0) || 0;
      const totalComments = data?.reduce((sum, post) => sum + (post.metadata?.comments || 0), 0) || 0;
      
      setStats({
        total: data?.length || 0,
        published: publishedPosts.length,
        drafts: drafts.length,
        archived: archived.length,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments
      });

      // Set formData service_type
      setFormData(prev => ({ ...prev, service_type: serviceType }));
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesByService = async (serviceId: string) => {
    try {
      // Get service type from service id
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('path')
        .eq('id', serviceId)
        .single();
      
      if (serviceError) throw serviceError;
      
      const serviceType = serviceData?.path;
      
      // Fetch categories for this service
      const { data, error } = await supabase
        .from('posts')
        .select('category')
        .eq('service_type', serviceType);

      if (error) throw error;
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(post => post.category))].filter(Boolean);
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      if (!formData.title || !formData.content || !formData.category || !formData.service_type) {
        toast.error('Please fill all required fields');
        return;
      }

      setIsSubmitting(true);

      const { data: userData } = await supabase.auth.getUser();
      
      const newPost: Partial<Post> = {
        ...formData,
        author_id: userData.user?.id || 'unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          views: 0,
          likes: 0,
          comments: 0,
          reading_time: calculateReadingTime(formData.content || ''),
          ...(formData.metadata || {})
        }
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();

      if (error) throw error;

      setPosts(prev => [data, ...prev]);
      resetForm();
      setShowAddDialog(false);
      toast.success('Post created successfully');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        drafts: formData.status === 'draft' ? prev.drafts + 1 : prev.drafts,
        published: formData.status === 'published' ? prev.published + 1 : prev.published,
        archived: formData.status === 'archived' ? prev.archived + 1 : prev.archived
      }));
      
      // Add category to list if new
      if (!categories.includes(formData.category || '')) {
        setCategories(prev => [...prev, formData.category || '']);
      }
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePost = async () => {
    try {
      if (!editingPost?.id) {
        toast.error('No post selected for editing');
        return;
      }
      
      if (!formData.title || !formData.content || !formData.category) {
        toast.error('Please fill all required fields');
        return;
      }

      setIsSubmitting(true);

      const updates = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', editingPost.id)
        .select()
        .single();

      if (error) throw error;

      // Update posts list
      setPosts(prev => prev.map(post => 
        post.id === editingPost.id ? data : post
      ));
      
      resetForm();
      setEditingPost(null);
      setShowAddDialog(false);
      toast.success('Post updated successfully');
      
      // Update stats if status changed
      if (data.status !== editingPost.status) {
        setStats(prev => ({
          ...prev,
          drafts: prev.drafts + (data.status === 'draft' ? 1 : 0) - (editingPost.status === 'draft' ? 1 : 0),
          published: prev.published + (data.status === 'published' ? 1 : 0) - (editingPost.status === 'published' ? 1 : 0),
          archived: prev.archived + (data.status === 'archived' ? 1 : 0) - (editingPost.status === 'archived' ? 1 : 0)
        }));
      }
      
      // Add category to list if new
      if (!categories.includes(formData.category || '')) {
        setCategories(prev => [...prev, formData.category || '']);
      }
      
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    try {
      const postToDelete = posts.find(post => post.id === postId);
      if (!postToDelete) return;
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      // Update posts list
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        drafts: postToDelete.status === 'draft' ? prev.drafts - 1 : prev.drafts,
        published: postToDelete.status === 'published' ? prev.published - 1 : prev.published,
        archived: postToDelete.status === 'archived' ? prev.archived - 1 : prev.archived,
        views: prev.views - (postToDelete.metadata?.views || 0),
        likes: prev.likes - (postToDelete.metadata?.likes || 0),
        comments: prev.comments - (postToDelete.metadata?.comments || 0)
      }));
      
      setConfirmDeleteId(null);
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleUpdateStatus = async (postId: string | number, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const postToUpdate = posts.find(post => post.id === postId);
      if (!postToUpdate) return;
      
      const oldStatus = postToUpdate.status;
      
      if (oldStatus === newStatus) return;

      const { data, error } = await supabase
        .from('posts')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      
      // Update posts list
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: newStatus, updated_at: data.updated_at } : post
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        drafts: prev.drafts + (newStatus === 'draft' ? 1 : 0) - (oldStatus === 'draft' ? 1 : 0),
        published: prev.published + (newStatus === 'published' ? 1 : 0) - (oldStatus === 'published' ? 1 : 0),
        archived: prev.archived + (newStatus === 'archived' ? 1 : 0) - (oldStatus === 'archived' ? 1 : 0)
      }));
      
      toast.success(`Post ${newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'moved to drafts' : 'archived'} successfully`);
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error('Failed to update post status');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    if (categories.includes(newCategory.trim())) {
      toast.error('This category already exists');
      return;
    }
    
    setCategories(prev => [...prev, newCategory.trim()]);
    setNewCategory('');
    toast.success('Category added successfully');
  };

  const handleAddResourceLink = () => {
    if (!resourceLink.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      resource_links: [...(prev.resource_links || []), resourceLink.trim()]
    }));
    
    setResourceLink('');
  };

  const handleRemoveResourceLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resource_links: (prev.resource_links || []).filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      service_type: selectedService ? services.find(s => s.id === selectedService)?.path || '' : '',
      status: 'draft',
      resource_links: []
    });
    setResourceLink('');
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      category: post.category,
      service_type: post.service_type,
      status: post.status,
      resource_links: post.resource_links || [],
      metadata: post.metadata
    });
    setShowAddDialog(true);
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      if (!file) throw new Error('No file selected');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `content-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      throw error;
    }
  };

  const handleImageUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      toast.error('Please select an image to upload');
      return;
    }
    
    try {
      const file = fileInputRef.current.files[0];
      const imageUrl = await uploadImage(file);
      
      // Insert image URL at cursor position in Quill editor
      const editor = document.querySelector('.ql-editor');
      if (editor) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Uploaded image';
        img.style.maxWidth = '100%';
        
        // Append to editor
        editor.appendChild(img);
        
        // Update formData
        setFormData(prev => ({
          ...prev,
          content: prev.content + `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%;" />`
        }));
      }
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error handling image upload:', error);
      toast.error('Failed to upload image');
    }
  };

  const calculateReadingTime = (content: string): string => {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    
    // Average reading speed (words per minute)
    const wordsPerMinute = 200;
    
    // Count words
    const words = text.trim().split(/\s+/).length;
    
    // Calculate reading time in minutes
    const minutes = Math.ceil(words / wordsPerMinute);
    
    return `${minutes} min read`;
  };

  // Filter posts based on search and status
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render loading state
  if (loading && !selectedService) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Render no service selected state
  if (!selectedService) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Service Selected</h3>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          Please select a service to manage its content or create a new service.
        </p>
        <Button onClick={() => navigate('/admin/settings')}>
          Manage Services
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Service Content Management</h1>
          <p className="text-gray-500">Manage content for your academic services</p>
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {services.find(s => s.id === selectedService)?.name || 'Select Service'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Service</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {services.map(service => (
                <DropdownMenuItem 
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={selectedService === service.id ? 'bg-gray-100' : ''}
                >
                  {service.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            onClick={() => {
              resetForm(); 
              setEditingPost(null); 
              setShowAddDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> 
            New Content
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <FileText className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content">
            <Book className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <p className="text-sm text-gray-500">Items in this service</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.published}</div>
                <p className="text-sm text-gray-500">
                  {Math.round((stats.published / stats.total) * 100) || 0}% of total content
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Drafts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.drafts}</div>
                <p className="text-sm text-gray-500">
                  {Math.round((stats.drafts / stats.total) * 100) || 0}% of total content
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{stats.views}</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{stats.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{stats.comments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Content</CardTitle>
                <CardDescription>Latest content updates for this service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.slice(0, 5).map(post => (
                    <div key={post.id} className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{post.title}</div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="mr-3">{getFormattedDate(post.created_at)}</span>
                          <Badge variant={
                            post.status === 'published' ? 'default' : 
                            post.status === 'draft' ? 'secondary' : 'outline'
                          }>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {posts.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No content available</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {posts.length > 0 && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab('content')}
                  >
                    View All Content
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Categories</CardTitle>
                <CardDescription>Content organization for this service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{category}</span>
                      </div>
                      <Badge variant="outline">
                        {posts.filter(post => post.category === category).length} items
                      </Badge>
                    </div>
                  ))}
                  
                  {categories.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No categories available</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {categories.length > 0 && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab('categories')}
                  >
                    Manage Categories
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="content">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300"
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              
              <Button 
                onClick={() => {
                  resetForm(); 
                  setEditingPost(null); 
                  setShowAddDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> 
                New Content
              </Button>
            </div>
          </div>
          
          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No content found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first content for this service'}
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => {
                  resetForm(); 
                  setEditingPost(null); 
                  setShowAddDialog(true);
                }}>
                  Create Content
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{post.title}</CardTitle>
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {getFormattedDate(post.created_at)}
                          </span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {post.author || 'Admin'}
                          </span>
                          <span className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            {post.category}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {post.metadata?.views || 0} views
                          </span>
                          <Badge variant={
                            post.status === 'published' ? 'default' : 
                            post.status === 'draft' ? 'secondary' : 'outline'
                          }>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPost(post)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'published')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'draft')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Move to Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(post.id, 'archived')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setConfirmDeleteId(post.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="line-clamp-2 text-gray-600 mb-3">
                      {post.content.replace(/<[^>]*>?/gm, '')}
                    </div>
                    
                    {post.resource_links && post.resource_links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.resource_links.map((link, index) => (
                          <Badge key={index} variant="outline" className="flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {link}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(
                        `/services/${post.service_type}?preview=${post.id}`, 
                        '_blank'
                      )}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Manage content categories for this service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{category}</span>
                      </div>
                      <Badge variant="outline">
                        {posts.filter(post => post.category === category).length} items
                      </Badge>
                    </div>
                  ))}
                  
                  {categories.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No categories available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
                <CardDescription>Create a new category for this service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button onClick={handleAddCategory}>Add</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Content Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Content' : 'Add New Content'}</DialogTitle>
            <DialogDescription>
              {editingPost 
                ? 'Update content details below' 
                : `Create new content for ${services.find(s => s.id === selectedService)?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <div className="relative">
                    <select
                      id="category"
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Content category"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="new">+ Add new category</option>
                    </select>
                  </div>
                  
                  {formData.category === 'new' && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter new category name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onBlur={() => {
                          if (newCategory.trim()) {
                            setCategories(prev => [...prev, newCategory]);
                            setFormData({ ...formData, category: newCategory });
                            setNewCategory('');
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      status: e.target.value as 'draft' | 'published' | 'archived'
                    })}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Content status"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div>
                  <Label>Resource Links</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add resource link"
                      value={resourceLink}
                      onChange={(e) => setResourceLink(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleAddResourceLink}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.resource_links?.map((link, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center">
                        {link}
                        <button 
                          type="button" 
                          className="ml-1 rounded-full hover:bg-gray-200"
                          onClick={() => handleRemoveResourceLink(index)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="featured">Featured Content</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.metadata?.featured || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          metadata: {
                            ...formData.metadata,
                            featured: checked,
                          },
                        })
                      }
                    />
                    <Label htmlFor="featured">Feature this content on the service page</Label>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Upload Image</Label>
                <div className="flex gap-2 mb-4">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleImageUpload}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  <p>Supported formats: JPG, PNG, GIF, WebP</p>
                  <p>Max file size: 5MB</p>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <div className="mt-2 border rounded-md">
                <ReactQuill
                  theme="snow"
                  value={formData.content || ''}
                  onChange={(content) => setFormData({ ...formData, content })}
                  modules={modules}
                  formats={formats}
                  placeholder="Write your content here..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
                setEditingPost(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingPost ? handleUpdatePost : handleCreatePost}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingPost ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingPost ? 'Update Content' : 'Create Content'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDeleteId && handleDeletePost(confirmDeleteId)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManager; 