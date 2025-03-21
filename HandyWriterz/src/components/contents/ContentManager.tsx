import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  PlusCircle, 
  Search,
  BookOpen,
  Settings,
  Users,
  Layout,
  FileText,
  BarChart,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  service_type: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  resource_links?: string[];
  views?: number;
  likes?: number;
  comments?: number;
}

interface ContentManagerProps {
  serviceType: string;
  serviceName: string;
  serviceDescription: string;
}

const ContentManager: React.FC<ContentManagerProps> = ({
  serviceType,
  serviceName,
  serviceDescription
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('content');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '',
    resource_links: [] as string[]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [serviceType]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('service_type', serviceType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      
      // Calculate stats
      const totalViews = data?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
      const totalLikes = data?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
      const totalComments = data?.reduce((sum, post) => sum + (post.comments || 0), 0) || 0;

      setStats({
        total: data?.length || 0,
        published: data?.filter(post => post.status === 'published').length || 0,
        drafts: data?.filter(post => post.status === 'draft').length || 0,
        archived: data?.filter(post => post.status === 'archived').length || 0,
        totalViews,
        totalLikes,
        totalComments
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('category')
        .eq('service_type', serviceType);

      if (error) throw error;
      const uniqueCategories = [...new Set(data.map(post => post.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const handleCreatePost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            ...newPost,
            service_type: serviceType,
            author: user.email,
            status: 'draft'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setPosts(prev => [data, ...prev]);
      setShowAddDialog(false);
      setNewPost({ title: '', content: '', category: '', resource_links: [] });
      toast.success('Post created successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleUpdatePost = async (post: Post, newStatus?: 'draft' | 'published' | 'archived') => {
    try {
      const updates = {
        ...(editingPost ? {
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          resource_links: newPost.resource_links
        } : {}),
        ...(newStatus ? { status: newStatus } : {}),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', post.id);

      if (error) throw error;
      
      if (editingPost) {
        setEditingPost(null);
        setNewPost({ title: '', content: '', category: '', resource_links: [] });
        setShowAddDialog(false);
      }
      
      fetchPosts();
      toast.success('Post updated successfully');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      content: post.content,
      category: post.category,
      resource_links: post.resource_links || []
    });
    setShowAddDialog(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{serviceName}</h1>
        <p className="text-gray-600">{serviceDescription}</p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex-1 w-full md:max-w-md">
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
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Button onClick={() => {
                setEditingPost(null);
                setNewPost({ title: '', content: '', category: '', resource_links: [] });
                setShowAddDialog(true);
              }}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add New Content
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{stats.published}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Drafts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{stats.drafts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Tag className="w-4 h-4 mr-1" />
                            {post.category}
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {post.views || 0} views
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdatePost(post, post.status === 'draft' ? 'published' : 'draft')}
                      >
                        {post.status === 'draft' ? 'Publish' : 'Unpublish'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                  />
                  {post.resource_links && post.resource_links.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Resources:</h4>
                      <div className="flex flex-wrap gap-2">
                        {post.resource_links.map((link, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            {link}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-600" />
                  <p className="text-3xl font-bold text-blue-600">{stats.totalViews}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Likes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ThumbsUp className="w-6 h-6 mr-2 text-green-600" />
                  <p className="text-3xl font-bold text-green-600">{stats.totalLikes}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2 text-purple-600" />
                  <p className="text-3xl font-bold text-purple-600">{stats.totalComments}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Most Viewed Posts</h3>
                  <div className="space-y-4">
                    {posts
                      .sort((a, b) => (b.views || 0) - (a.views || 0))
                      .slice(0, 5)
                      .map(post => (
                        <div key={post.id} className="flex items-center justify-between">
                          <span className="font-medium">{post.title}</span>
                          <span className="text-gray-600">{post.views || 0} views</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4">Most Engaged Posts</h3>
                  <div className="space-y-4">
                    {posts
                      .sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)))
                      .slice(0, 5)
                      .map(post => (
                        <div key={post.id} className="flex items-center justify-between">
                          <span className="font-medium">{post.title}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                              <ThumbsUp className="w-4 h-4 inline mr-1" />
                              {post.likes || 0}
                            </span>
                            <span className="text-gray-600">
                              <MessageSquare className="w-4 h-4 inline mr-1" />
                              {post.comments || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Manage content categories for {serviceName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => (
                    <div key={category} className="flex items-center justify-between">
                      <span>{category}</span>
                      <span className="text-gray-500">
                        {posts.filter(post => post.category === category).length} posts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
                <CardDescription>Manage access control for content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Administrators</span>
                    <span className="text-green-600">Full access</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Content Editors</span>
                    <span className="text-blue-600">Edit & publish</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Authors</span>
                    <span className="text-orange-600">Create & edit own</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Content' : 'Add New Content'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Enter title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                placeholder="Enter category"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Resource Links (comma-separated)</label>
              <Input
                value={newPost.resource_links.join(', ')}
                onChange={(e) => setNewPost({
                  ...newPost,
                  resource_links: e.target.value.split(',').map(link => link.trim())
                })}
                placeholder="Enter resource links"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <ReactQuill
                value={newPost.content}
                onChange={(content) => setNewPost({ ...newPost, content })}
                className="h-64 mb-12"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{'list': 'ordered'}, {'list': 'bullet'}],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingPost(null);
              setNewPost({ title: '', content: '', category: '', resource_links: [] });
            }}>
              Cancel
            </Button>
            <Button onClick={() => editingPost ? handleUpdatePost(editingPost) : handleCreatePost()}>
              {editingPost ? 'Update' : 'Create'} Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManager;