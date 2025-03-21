import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Heart, Share2, MessageSquare } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { FormLayout } from '@/components/ui/FormLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Content {
  id: string;
  title: string;
  type: 'post' | 'article' | 'tutorial';
  description: string;
  content: string;
  service_id: string | null;
  published: boolean;
  featured: boolean;
  allow_comments: boolean;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
  };
  service?: {
    id: string;
    name: string;
  };
}

interface Service {
  id: string;
  name: string;
}

export default function Content() {
  const { supabase, isConnected } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [content, setContent] = useState<Content[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadContent();
      loadServices();
    }
  }, [isConnected]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          author:user_profiles(id, name),
          service:services(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContent(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error("Failed to load content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .order('name');

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handlePublishToggle = async (contentId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('content')
        .update({ published: !currentState })
        .eq('id', contentId);

      if (error) throw error;

      setContent(content.map(item => 
        item.id === contentId 
          ? { ...item, published: !currentState }
          : item
      ));

      toast.success(`Content ${currentState ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Error toggling content publish state:', error);
      toast.error("Failed to update content. Please try again.");
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      setContent(content.filter(item => item.id !== contentId));
      toast.success("Content deleted successfully");
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error("Failed to delete content. Please try again.");
    }
  };

  const handleSave = async (data: Partial<Content>) => {
    try {
      const isEditing = !!data.id;
      const { data: savedContent, error } = isEditing
        ? await supabase
            .from('content')
            .update({
              title: data.title,
              type: data.type,
              description: data.description,
              content: data.content,
              service_id: data.service_id,
              allow_comments: data.allow_comments,
              featured: data.featured,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.id)
            .select()
        : await supabase
            .from('content')
            .insert({
              ...data,
              published: false,
              views: 0,
              likes: 0,
              shares: 0,
              comments: 0
            })
            .select();

      if (error) throw error;

      if (isEditing) {
        setContent(content.map(item => 
          item.id === data.id ? { ...item, ...savedContent[0] } : item
        ));
      } else {
        setContent([savedContent[0], ...content]);
      }

      setIsDialogOpen(false);
      toast.success(`Content ${isEditing ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error("Failed to save content. Please try again.");
    }
  };

  const columns: DataTableColumn<Content>[] = [
    {
      header: 'Title',
      key: 'title',
      render: (item) => (
        <div>
          <div className="font-medium">{item.title}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline">{item.type}</Badge>
            {item.service && (
              <Badge variant="secondary">{item.service.name}</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Author',
      key: 'author',
      render: (item) => (
        <div className="text-sm">
          {item.author?.name || 'Unknown'}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={item.published}
            onCheckedChange={() => handlePublishToggle(item.id, item.published)}
          />
          <Badge variant={item.published ? "success" : "secondary"}>
            {item.published ? 'Published' : 'Draft'}
          </Badge>
          {item.featured && (
            <Badge variant="default">Featured</Badge>
          )}
        </div>
      )
    },
    {
      header: 'Engagement',
      key: 'engagement',
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {item.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {item.likes}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              {item.shares}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {item.comments}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Last Updated',
      key: 'updated_at',
      render: (item) => new Date(item.updated_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedContent(item);
              setIsDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  const filteredContent = content.filter(item =>
    (activeTab === 'all' || item.type === activeTab) &&
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <FormLayout
      title="Content Management"
      description="Create and manage all content across your platform"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setSelectedContent(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="post">Posts</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="tutorial">Tutorials</TabsTrigger>
          </TabsList>
        </Tabs>

        <DataTable
          data={filteredContent}
          columns={columns}
          pagination={{
            currentPage: 1,
            totalPages: Math.ceil(filteredContent.length / 10),
            totalItems: filteredContent.length,
            pageSize: 10,
            onPageChange: () => {}
          }}
          emptyMessage="No content found"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>
              {selectedContent ? 'Edit Content' : 'Create Content'}
            </DialogTitle>
            <DialogDescription>
              {selectedContent
                ? 'Make changes to your content here.'
                : 'Add new content to your platform.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave({
                id: selectedContent?.id,
                title: formData.get('title') as string,
                type: formData.get('type') as Content['type'],
                description: formData.get('description') as string,
                content: formData.get('content') as string,
                service_id: formData.get('service_id') as string || null,
                allow_comments: formData.get('allow_comments') === 'true',
                featured: formData.get('featured') === 'true',
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={selectedContent?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={selectedContent?.type || 'post'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_id">Service (Optional)</Label>
              <Select 
                name="service_id" 
                defaultValue={selectedContent?.service_id || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={selectedContent?.description}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={selectedContent?.content}
                required
                className="min-h-[200px]"
              />
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="allow_comments"
                  name="allow_comments"
                  defaultChecked={selectedContent?.allow_comments ?? true}
                />
                <Label htmlFor="allow_comments">Allow Comments</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  name="featured"
                  defaultChecked={selectedContent?.featured ?? false}
                />
                <Label htmlFor="featured">Featured Content</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedContent ? 'Save Changes' : 'Create Content'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FormLayout>
  );
}
