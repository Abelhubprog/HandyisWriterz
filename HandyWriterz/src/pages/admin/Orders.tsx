import { useState, useEffect, useMemo } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Download, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Filter,
  Search,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { FormLayout } from '@/components/ui/FormLayout';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  order_number: string;
  service_type: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'revision';
  created_at: string;
  updated_at: string;
  due_date: string;
  total_amount: number;
  payment_status: 'paid' | 'unpaid' | 'partial';
  user_id: string;
  writer_id?: string;
  files?: string[];
  customer?: {
    id: string;
    full_name?: string;
    email: string;
  };
  writer?: {
    id: string;
    full_name?: string;
    email: string;
  };
}

interface OrderDetailsProps {
  order: Order | null;
  onClose: () => void;
  isOpen: boolean;
  onStatusChange: (orderId: string, status: Order['status']) => Promise<void>;
  onAssignWriter: (orderId: string, writerId: string) => Promise<void>;
}

interface Writer {
  id: string;
  full_name?: string;
  email: string;
  role: string;
  expertise?: string[];
  current_orders?: number;
}

const statusOptions: { value: Order['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  { value: 'revision', label: 'Revision', color: 'bg-purple-500' }
];

const paymentStatusOptions: { value: Order['payment_status']; label: string; color: string }[] = [
  { value: 'paid', label: 'Paid', color: 'bg-green-500' },
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-500' },
  { value: 'partial', label: 'Partial', color: 'bg-yellow-500' }
];

const OrderDetails: React.FC<OrderDetailsProps> = ({ 
  order, 
  onClose, 
  isOpen, 
  onStatusChange,
  onAssignWriter
}) => {
  const { supabase } = useSupabase();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [selectedWriter, setSelectedWriter] = useState<string | undefined>(order?.writer_id);
  const [statusLoading, setStatusLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWriters();
      setSelectedWriter(order?.writer_id);
    }
  }, [isOpen, order]);

  const fetchWriters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'writer');

      if (error) throw error;
      setWriters(data || []);
    } catch (error: any) {
      console.error('Error fetching writers:', error.message);
      toast.error('Failed to load writers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: Order['status']) => {
    if (!order) return;
    
    try {
      setStatusLoading(true);
      await onStatusChange(order.id, status);
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssignWriter = async () => {
    if (!order || !selectedWriter) return;
    
    try {
      setAssignLoading(true);
      await onAssignWriter(order.id, selectedWriter);
      toast.success('Writer assigned successfully');
    } catch (error) {
      console.error('Error assigning writer:', error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!order || !message.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Check if conversation exists
      const { data: existingConversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('order_id', order.id)
        .single();
      
      let conversationId = existingConversation?.id;
      
      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: order.user_id,
            admin_id: 'system', // Replace with actual admin ID if available
            subject: `Order #${order.order_number}`,
            status: 'active',
            order_id: order.id,
            order_number: order.order_number,
            unread_count: 1,
            last_message: message,
            last_message_time: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (createError) throw createError;
        conversationId = newConversation.id;
      } else {
        // Update existing conversation
        await supabase
          .from('conversations')
          .update({
            status: 'active',
            unread_count: supabase.rpc('increment', { row_id: conversationId }),
            last_message: message,
            last_message_time: new Date().toISOString()
          })
          .eq('id', conversationId);
      }
      
      // Add message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: 'system', // Replace with actual admin ID if available
          receiver_id: order.user_id,
          content: message,
          is_read: false,
          created_at: new Date().toISOString()
        });
      
      setMessage('');
      toast.success('Message sent successfully');
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order #{order.order_number}</span>
            <div className="flex items-center space-x-2">
              {statusOptions.find(s => s.value === order.status) && (
                <Badge className={statusOptions.find(s => s.value === order.status)?.color}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
              {paymentStatusOptions.find(s => s.value === order.payment_status) && (
                <Badge className={paymentStatusOptions.find(s => s.value === order.payment_status)?.color}>
                  {order.payment_status.toUpperCase()}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Created on {format(new Date(order.created_at), 'PPP')} • Due on {format(new Date(order.due_date), 'PPP')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label>Title</Label>
                    <p className="text-sm">{order.title}</p>
                  </div>
                  <div>
                    <Label>Service Type</Label>
                    <p className="text-sm">{order.service_type}</p>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <p className="text-sm font-semibold">${order.total_amount.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm">{order.customer?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{order.customer?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Customer ID</Label>
                    <p className="text-sm">{order.user_id}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="writer">Assigned Writer</Label>
                    <Select 
                      value={selectedWriter} 
                      onValueChange={setSelectedWriter}
                      disabled={loading}
                    >
                      <SelectTrigger id="writer">
                        <SelectValue placeholder="Select a writer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {writers.map(writer => (
                          <SelectItem key={writer.id} value={writer.id}>
                            {writer.full_name || writer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Order Status</Label>
                    <Select 
                      value={order.status} 
                      onValueChange={handleStatusChange}
                      disabled={statusLoading}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAssignWriter} 
                  disabled={!selectedWriter || selectedWriter === order.writer_id || assignLoading}
                  className="w-full"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Writer'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="files" className="space-y-4">
            {order.files && order.files.length > 0 ? (
              <div className="space-y-2">
                {order.files.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        <span>{file.split('/').pop()}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No files attached to this order</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Message to Customer</CardTitle>
                <CardDescription>
                  This message will be sent to the customer and added to the order conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Type your message here..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!message.trim() || sendingMessage}
                  className="w-full"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Button>
              </CardFooter>
            </Card>
            
            <Button variant="outline" className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              View Full Conversation
            </Button>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
                <CardDescription>
                  Manage this order with the following actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Order Details
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Order
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Update Payment Status
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled={order.status === 'cancelled'}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default function Orders() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  useEffect(() => {
    loadOrders();
  }, []);
  
  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:user_id(id, full_name, email),
          writer:writer_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error loading orders:', error.message);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      );
      
      // Update selected order if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      
    } catch (error: any) {
      console.error('Error updating order status:', error.message);
      throw error;
    }
  };
  
  const handleAssignWriter = async (orderId: string, writerId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          writer_id: writerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, writer_id: writerId } : order
        )
      );
      
      // Update selected order if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, writer_id: writerId });
      }
      
    } catch (error: any) {
      console.error('Error assigning writer:', error.message);
      throw error;
    }
  };
  
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };
  
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };
  
  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer?.email && order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer?.full_name && order.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);
  
  const columns: DataTableColumn<Order>[] = [
    {
      header: 'Order #',
      accessorKey: 'order_number',
      cell: ({ row }) => (
        <Button variant="link" onClick={() => handleViewOrder(row.original)}>
          {row.original.order_number}
        </Button>
      ),
    },
    {
      header: 'Title',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.title}>
          {row.original.title}
        </div>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customer.email',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customer?.full_name || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{row.original.customer?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      header: 'Service',
      accessorKey: 'service_type',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = statusOptions.find(s => s.value === row.original.status);
        return (
          <Badge className={status?.color}>
            {status?.label || row.original.status}
          </Badge>
        );
      },
    },
    {
      header: 'Payment',
      accessorKey: 'payment_status',
      cell: ({ row }) => {
        const status = paymentStatusOptions.find(s => s.value === row.original.payment_status);
        return (
          <Badge className={status?.color}>
            {status?.label || row.original.payment_status}
          </Badge>
        );
      },
    },
    {
      header: 'Due Date',
      accessorKey: 'due_date',
      cell: ({ row }) => format(new Date(row.original.due_date), 'MMM dd, yyyy'),
    },
    {
      header: 'Amount',
      accessorKey: 'total_amount',
      cell: ({ row }) => `$${row.original.total_amount.toFixed(2)}`,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleViewOrder(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <FormLayout
      title="Orders Management"
      description="View and manage all customer orders"
      loading={loading}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center w-full md:w-auto space-x-2">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full md:w-[300px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/orders/export')}>
            <Download className="mr-2 h-4 w-4" />
            Export Orders
          </Button>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={filteredOrders}
        searchKey="order_number"
        searchPlaceholder="Search orders..."
      />
      
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          onStatusChange={handleStatusChange}
          onAssignWriter={handleAssignWriter}
        />
      )}
    </FormLayout>
  );
} 