import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Share2, MessageSquare } from 'lucide-react';
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

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  published: boolean;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  created_at: string;
  updated_at: string;
}

export default function Services() {
  const { supabase, isConnected } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadServices();
    }
  }, [isConnected]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error("Failed to load services. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToggle = async (serviceId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ published: !currentState })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(services.map(service => 
        service.id === serviceId 
          ? { ...service, published: !currentState }
          : service
      ));

      toast.success(`Service ${currentState ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Error toggling service publish state:', error);
      toast.error("Failed to update service. Please try again.");
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setServices(services.filter(service => service.id !== serviceId));
      toast.success("Service deleted successfully");
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error("Failed to delete service. Please try again.");
    }
  };

  const handleSave = async (service: Partial<Service>) => {
    try {
      const isEditing = !!service.id;
      const { data, error } = isEditing
        ? await supabase
            .from('services')
            .update({
              title: service.title,
              description: service.description,
              content: service.content,
              updated_at: new Date().toISOString()
            })
            .eq('id', service.id)
            .select()
        : await supabase
            .from('services')
            .insert({
              ...service,
              slug: service.title?.toLowerCase().replace(/\s+/g, '-'),
              published: false,
              views: 0,
              likes: 0,
              shares: 0,
              comments: 0
            })
            .select();

      if (error) throw error;

      if (isEditing) {
        setServices(services.map(s => 
          s.id === service.id ? { ...s, ...data[0] } : s
        ));
      } else {
        setServices([data[0], ...services]);
      }

      setIsDialogOpen(false);
      toast.success(`Service ${isEditing ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error("Failed to save service. Please try again.");
    }
  };

  const columns: DataTableColumn<Service>[] = [
    {
      header: 'Title',
      key: 'title',
      render: (service) => (
        <div>
          <div className="font-medium">{service.title}</div>
          <div className="text-sm text-gray-500">{service.slug}</div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (service) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={service.published}
            onCheckedChange={() => handlePublishToggle(service.id, service.published)}
          />
          <Badge variant={service.published ? "success" : "secondary"}>
            {service.published ? 'Published' : 'Draft'}
          </Badge>
        </div>
      )
    },
    {
      header: 'Engagement',
      key: 'engagement',
      render: (service) => (
        <div className="space-y-1">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {service.views}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              {service.shares}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {service.comments}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Last Updated',
      key: 'updated_at',
      render: (service) => new Date(service.updated_at).toLocaleDateString()
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (service) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedService(service);
              setIsDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(service.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  const filteredServices = services.filter(service =>
    Object.values(service).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <FormLayout
      title="Service Management"
      description="Create and manage service pages"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div className="flex justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setSelectedService(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        <DataTable
          data={filteredServices}
          columns={columns}
          pagination={{
            currentPage: 1,
            totalPages: Math.ceil(filteredServices.length / 10),
            totalItems: filteredServices.length,
            pageSize: 10,
            onPageChange: () => {}
          }}
          emptyMessage="No services found"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Edit Service' : 'Create Service'}
            </DialogTitle>
            <DialogDescription>
              {selectedService
                ? 'Make changes to your service page here.'
                : 'Add a new service page to your website.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave({
                id: selectedService?.id,
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                content: formData.get('content') as string,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={selectedService?.title}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={selectedService?.description}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={selectedService?.content}
                required
                className="min-h-[200px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedService ? 'Save Changes' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FormLayout>
  );
}
