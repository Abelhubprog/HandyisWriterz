import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart2,
  Users,
  Settings as SettingsIcon,
  PlusCircle,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Grid,
  List,
  Edit,
  Trash2,
  Eye,
  Upload,
  Image,
  Film,
  Music,
  Clock,
  Calendar,
  Tag,
  Filter,
  MoreVertical,
  Save,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  HelpCircle,
  Layout,
  Star,
  BookOpen,
  Shield,
  RefreshCw,
  Zap,
  AlertTriangle,
  Check,
  CircleUserRound
} from 'lucide-react';
import { adminAuthService } from '@/services/adminAuthService';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  service: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  readTime: number;
  featuredImage: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
  service: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface Media {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  usedIn: {
    posts: number;
    pages: number;
  };
}

interface Analytics {
  timeRange: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
  overview: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    averageReadTime: number;
    viewsChange: number;
    likesChange: number;
    commentsChange: number;
    sharesChange: number;
  };
  topPosts: {
    id: string;
    title: string;
    views: number;
    service: string;
  }[];
  topServices: {
    service: string;
    views: number;
    percentage: number;
  }[];
  viewsByDay: {
    date: string;
    views: number;
  }[];
  engagementByService: {
    service: string;
    likes: number;
    comments: number;
    shares: number;
  }[];
}

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'mention' | 'system' | 'alert';
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

// Main Dashboard Component
interface AdminDashboardProps {
  onLogout?: () => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    // In a real app, you would check if the user has admin rights
    // For now, we'll just redirect if no user is logged in
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Mock notifications
  useEffect(() => {
    setNotifications([
      {
        id: '1',
        type: 'comment',
        message: 'New comment on "Adult Health Nursing Best Practices"',
        time: '5 minutes ago',
        read: false,
        link: '/admin/content/posts/edit/1'
      },
      {
        id: '2',
        type: 'like',
        message: '15 new likes on your recent post',
        time: '1 hour ago',
        read: false,
        link: '/admin/analytics'
      },
      {
        id: '3',
        type: 'system',
        message: 'System update completed successfully',
        time: '2 hours ago',
        read: true
      },
      {
        id: '4',
        type: 'alert',
        message: 'Your storage is almost full (85%)',
        time: '1 day ago',
        read: true,
        link: '/admin/media'
      }
    ]);
  }, []);

  // Handle navigation active state
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Handlers
  const handleLogout = async () => {
    try {
      await adminAuthService.logout();
      toast.success('Logged out successfully');
      navigate('/auth/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile top navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100"
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="relative"
            >
              <img 
                src={user?.avatar || `/api/placeholder/32/32`} 
                alt={user?.name || 'User'} 
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-gray-800 bg-opacity-50">
          <div className="absolute top-16 left-0 bottom-0 w-64 bg-white shadow-lg">
            <div className="p-4">
              <Link to="/admin" className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  H
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  HandyWriterz
                </span>
              </Link>
              
              <nav className="space-y-1">
                <Link 
                  to="/admin" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    isActive('/admin') && location.pathname === '/admin' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart2 size={20} />
                  Dashboard
                </Link>
                
                <div>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
                    isActive('/admin/content') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} />
                      Content
                    </div>
                    <ChevronDown size={16} />
                  </div>
                  
                  <div className="ml-8 mt-2 space-y-1">
                    <Link 
                      to="/admin/content/posts" 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        location.pathname.includes('/admin/content/posts') 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      Posts
                    </Link>
                    <Link 
                      to="/admin/content/categories" 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        location.pathname.includes('/admin/content/categories') 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      Categories
                    </Link>
                    <Link 
                      to="/admin/content/tags" 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        location.pathname.includes('/admin/content/tags') 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      Tags
                    </Link>
                  </div>
                </div>
                
                <Link 
                  to="/admin/media" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    isActive('/admin/media') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Image size={20} />
                  Media
                </Link>
                
                <Link 
                  to="/admin/users" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    isActive('/admin/users') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users size={20} />
                  Users
                </Link>
                
                <Link 
                  to="/admin/analytics" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    isActive('/admin/analytics') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart2 size={20} />
                  Analytics
                </Link>
                
                <Link 
                  to="/admin/settings" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    isActive('/admin/settings') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <SettingsIcon size={20} />
                  Settings
                </Link>
              </nav>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 w-full"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-20 transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } hidden md:block`}>
        <div className="h-full flex flex-col">
          <div className="p-4">
            <Link to="/admin" className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                H
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                HandyWriterz
              </span>
            </Link>
            
            <nav className="space-y-1">
              <Link 
                to="/admin" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  isActive('/admin') && location.pathname === '/admin' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart2 size={20} />
                Dashboard
              </Link>
              
              <div>
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
                  isActive('/admin/content') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <FileText size={20} />
                    Content
                  </div>
                  <ChevronDown size={16} />
                </div>
                
                <div className="ml-8 mt-2 space-y-1">
                  <Link 
                    to="/admin/content/posts" 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      location.pathname.includes('/admin/content/posts') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                    Posts
                  </Link>
                  <Link 
                    to="/admin/content/categories" 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      location.pathname.includes('/admin/content/categories') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                    Categories
                  </Link>
                  <Link 
                    to="/admin/content/tags" 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      location.pathname.includes('/admin/content/tags') 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                    Tags
                  </Link>
                </div>
              </div>
              
              <Link 
                to="/admin/media" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  isActive('/admin/media') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Image size={20} />
                Media
              </Link>
              
              <Link 
                to="/admin/users" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  isActive('/admin/users') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users size={20} />
                Users
              </Link>
              
              <Link 
                to="/admin/analytics" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  isActive('/admin/analytics') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart2 size={20} />
                Analytics
              </Link>
              
              <Link 
                to="/admin/settings" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  isActive('/admin/settings') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SettingsIcon size={20} />
                Settings
              </Link>
            </nav>
          </div>
          
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={user?.avatar || `/api/placeholder/32/32`} 
                alt={user?.name || 'User'} 
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user?.name || 'Admin User'}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className={`transition-all duration-300 ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-0'
      }`}>
        {/* Top navigation */}
        <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>
              
              <div className="relative max-w-md w-96">
                <input 
                  type="text" 
                  placeholder="Search content, users, or settings..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100"
                >
                  <Bell size={20} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Notifications</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Mark all as read
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                notification.type === 'comment' ? 'bg-green-100 text-green-600' :
                                notification.type === 'like' ? 'bg-red-100 text-red-600' :
                                notification.type === 'mention' ? 'bg-blue-100 text-blue-600' :
                                notification.type === 'alert' ? 'bg-orange-100 text-orange-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {notification.type === 'comment' ? <MessageSquare size={16} /> :
                                 notification.type === 'like' ? <ThumbsUp size={16} /> :
                                 notification.type === 'mention' ? <Users size={16} /> :
                                 notification.type === 'alert' ? <AlertTriangle size={16} /> :
                                 <Bell size={16} />}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm">{notification.message}</div>
                                <div className="text-xs text-gray-500 mt-1">{notification.time}</div>
                              </div>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-600 rounded-full self-start mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-200">
                      <Link to="/admin/notifications" className="text-sm text-blue-600 hover:text-blue-800 block text-center">
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100"
                >
                  <img 
                    src={user?.avatar || `/api/placeholder/32/32`} 
                    alt={user?.name || 'User'} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                
                {/* User dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-3 border-b border-gray-200">
                      <div className="font-medium">{user?.name || 'Admin User'}</div>
                      <div className="text-sm text-gray-500">{user?.email || 'admin@example.com'}</div>
                    </div>
                    
                    <div className="p-2">
                      <Link 
                        to="/admin/profile" 
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                      >
                        <CircleUserRound size={16} />
                        Your Profile
                      </Link>
                      <Link 
                        to="/admin/settings" 
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                      >
                        <SettingsIcon size={16} />
                        Settings
                      </Link>
                      <Link 
                        to="/admin/help" 
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                      >
                        <HelpCircle size={16} />
                        Help & Support
                      </Link>
                      <Link 
                        to="/" 
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                      >
                        <ExternalLink size={16} />
                        View Site
                      </Link>
                    </div>
                    
                    <div className="p-2 border-t border-gray-200">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700 w-full text-left"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="pt-16 md:pt-0 pb-20">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/posts" element={<PostsList />} />
            <Route path="/posts/new" element={<PostEditor />} />
            <Route path="/posts/edit/:id" element={<PostEditor />} />
            <Route path="/categories" element={<CategoriesList />} />
            <Route path="/tags" element={<TagsList />} />
            <Route path="/media" element={<MediaLibrary />} />
            <Route path="/media/upload" element={<MediaUpload />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/settings" element={<SettingsPanel />} />
            <Route path="*" element={<div className="p-6">Page not found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Dashboard Home Component
const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    posts: 153,
    pendingComments: 12,
    totalViews: 24538,
    monthlyViews: 5321,
    recentPosts: [
      { id: '1', title: 'The Impact of Evidence-Based Practice in Adult Nursing', service: 'Adult Health Nursing', status: 'published', publishedAt: '2023-03-01T10:30:00Z', views: 432 },
      { id: '2', title: 'Cognitive Behavioral Therapy: A Comprehensive Guide', service: 'Mental Health Nursing', status: 'published', publishedAt: '2023-02-28T14:25:00Z', views: 356 },
      { id: '3', title: 'Machine Learning Applications in Healthcare', service: 'AI Services', status: 'draft', updatedAt: '2023-02-27T09:15:00Z', views: 0 },
      { id: '4', title: 'Pediatric Nursing Essentials: Current Research Overview', service: 'Child Nursing', status: 'scheduled', scheduledFor: '2023-03-05T08:00:00Z', views: 0 }
    ],
    recentComments: [
      { id: '1', author: 'Jane Smith', content: 'Great article, very informative!', post: 'The Impact of Evidence-Based Practice in Adult Nursing', createdAt: '2023-03-01T15:45:00Z', approved: true },
      { id: '2', author: 'John Doe', content: 'Could you provide more examples related to this?', post: 'Cognitive Behavioral Therapy: A Comprehensive Guide', createdAt: '2023-03-01T12:30:00Z', approved: false },
      { id: '3', author: 'Emma Wilson', content: 'I found a typo in the third paragraph.', post: 'The Impact of Evidence-Based Practice in Adult Nursing', createdAt: '2023-02-28T19:20:00Z', approved: false }
    ]
  });

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link 
            to="/admin/content/posts/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusCircle size={16} />
            New Post
          </Link>
          <Link 
            to="/admin/media/upload" 
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload size={16} />
            Upload Media
          </Link>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">Total Posts</div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.posts}</div>
          <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <span>+12%</span>
            <span>vs last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">Pending Comments</div>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.pendingComments}</div>
          <Link to="/admin/comments" className="text-sm text-blue-600 mt-2 flex items-center gap-1">
            <span>Review now</span>
            <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">Total Views</div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
          <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <span>+8.5%</span>
            <span>vs last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">This Month</div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <BarChart2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.monthlyViews.toLocaleString()}</div>
          <Link to="/admin/analytics" className="text-sm text-blue-600 mt-2 flex items-center gap-1">
            <span>View analytics</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent posts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent Posts</h2>
              <Link to="/admin/content/posts" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="flex items-center p-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <Link to={`/admin/content/posts/edit/${post.id}`} className="font-medium hover:text-blue-600 truncate block">
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-500">{post.service}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' :
                      post.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    {post.publishedAt && (
                      <span className="text-gray-500">
                        Published {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    {post.scheduledFor && (
                      <span className="text-gray-500">
                        Scheduled for {new Date(post.scheduledFor).toLocaleDateString()}
                      </span>
                    )}
                    {post.updatedAt && post.status === 'draft' && (
                      <span className="text-gray-500">
                        Updated {new Date(post.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {post.status === 'published' && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Eye size={14} />
                      <span>{post.views}</span>
                    </div>
                  )}
                  <Link 
                    to={`/admin/content/posts/edit/${post.id}`} 
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                  >
                    <Edit size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent comments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent Comments</h2>
              <Link to="/admin/comments" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {stats.recentComments.map((comment) => (
              <div key={comment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-medium">{comment.author}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                  </div>
                  {!comment.approved && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      Pending
                    </span>
                  )}
                </div>
                
                <div className="text-gray-700 mb-2">{comment.content}</div>
                
                <div className="flex items-center justify-between">
                  <Link to="#" className="text-sm text-gray-500 hover:text-blue-600">
                    On: {comment.post}
                  </Link>
                  
                  {!comment.approved ? (
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check size={16} />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Posts List Component
const PostsList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Simulate fetching posts
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate mock posts data
      const mockPosts: Post[] = Array(30).fill(null).map((_, index) => ({
        id: `post-${index + 1}`,
        title: [
          "The Impact of Evidence-Based Practice in Adult Nursing",
          "Cognitive Behavioral Therapy: A Comprehensive Guide",
          "Machine Learning Applications in Healthcare",
          "Pediatric Nursing Essentials: Current Research Overview",
          "Social Work Interventions in Community Health",
          "Mental Health Assessment Techniques for Nurses",
          "Blockchain Technology in Healthcare Records",
          "Nursing Ethics: Current Challenges and Solutions",
          "Special Education Strategies for Inclusive Classrooms",
          "AI-Powered Diagnostic Tools in Modern Medicine"
        ][Math.floor(Math.random() * 10)],
        slug: `post-slug-${index + 1}`,
        excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        content: "Full content would go here...",
        author: {
          id: `user-${Math.floor(Math.random() * 5) + 1}`,
          name: [`Dr. Smith`, `Sarah Johnson`, `Michael Brown`, `Emma Wilson`, `David Lee`][Math.floor(Math.random() * 5)],
          avatar: `/api/placeholder/32/32`
        },
        service: [`Adult Health Nursing`, `Mental Health Nursing`, `Child Nursing`, `Special Education`, `Social Work`, `AI Services`, `Crypto`][Math.floor(Math.random() * 7)],
        category: [`Research`, `Case Studies`, `Best Practices`, `Education`, `Professional Development`][Math.floor(Math.random() * 5)],
        tags: [
          "Academic Writing", "Research Methods", "Clinical Practice", "Healthcare", 
          "Evidence-Based", "Student Resources", "Nursing", "AI", "Technology"
        ].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3)),
        status: [`published`, `draft`, `scheduled`, `archived`][Math.floor(Math.random() * 4)] as any,
        publishedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString() : null,
        scheduledFor: Math.random() > 0.8 ? new Date(Date.now() + Math.floor(Math.random() * 10000000000)).toISOString() : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000)).toISOString(),
        featured: Math.random() > 0.8,
        readTime: 5 + Math.floor(Math.random() * 15),
        featuredImage: `/api/placeholder/800/400`,
        mediaType: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'video' : 'audio') : 'image',
        stats: {
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 30),
          shares: Math.floor(Math.random() * 50)
        }
      }));

      setPosts(mockPosts);
      setIsLoading(false);
    };

    fetchPosts();
  }, []);

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesService = serviceFilter === 'all' || post.service === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  // Paginate posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Get unique services for filter
  const services = ['all', ...new Set(posts.map(post => post.service))];

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link 
          to="/admin/content/posts/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusCircle size={16} />
          New Post
        </Link>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 md:w-1/4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 md:w-1/4">
            <select 
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg"
            >
              <option value="all">All Services</option>
              {services.filter(s => s !== 'all').map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search posts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          <div className="flex md:w-auto">
            <button 
              onClick={() => setCurrentView('list')} 
              className={`p-2 rounded-l-lg border border-gray-200 ${
                currentView === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'
              }`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setCurrentView('grid')} 
              className={`p-2 rounded-r-lg border-t border-r border-b border-gray-200 ${
                currentView === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'
              }`}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Posts list */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {Array(5).fill(null).map((_, index) => (
            <div key={index} className="p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : currentPosts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No posts found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setServiceFilter('all');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reset filters
          </button>
        </div>
      ) : currentView === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {currentPosts.map(post => (
            <div key={post.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <Link to={`/admin/content/posts/edit/${post.id}`} className="text-lg font-medium hover:text-blue-600">
                    {post.title}
                    {post.featured && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Featured
                      </span>
                    )}
                  </Link>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                    <span className="text-gray-500">{post.service}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' :
                      post.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    
                    {post.publishedAt && (
                      <span className="text-gray-500">
                        Published {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    
                    {post.scheduledFor && (
                      <span className="text-gray-500">
                        Scheduled for {new Date(post.scheduledFor).toLocaleDateString()}
                      </span>
                    )}
                    
                    {!post.publishedAt && !post.scheduledFor && (
                      <span className="text-gray-500">
                        Updated {new Date(post.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                    
                    <span className="text-gray-500">
                      by {post.author.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Eye size={14} />
                    <span>{post.stats.views}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MessageSquare size={14} />
                    <span>{post.stats.comments}</span>
                  </div>
                  
                  <div className="ml-2 flex">
                    <Link 
                      to={`/services/${post.service.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`}
                      target="_blank"
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <ExternalLink size={16} />
                    </Link>
                    
                    <Link 
                      to={`/admin/content/posts/edit/${post.id}`} 
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </Link>
                    
                    <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="relative h-48">
                <img 
                  src={post.featuredImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${
                    post.status === 'published' ? 'bg-green-600' :
                    post.status === 'draft' ? 'bg-gray-600' :
                    post.status === 'scheduled' ? 'bg-blue-600' :
                    'bg-red-600'
                  }`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  
                  {post.featured && (
                    <span className="px-2 py-1 bg-yellow-500 text-white rounded-full text-xs">
                      Featured
                    </span>
                  )}
                </div>
                
                {post.mediaType === 'video' && (
                  <div className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded">
                    <Film size={14} />
                  </div>
                )}
                
                {post.mediaType === 'audio' && (
                  <div className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded">
                    <Music size={14} />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <Link to={`/admin/content/posts/edit/${post.id}`} className="font-medium hover:text-blue-600 line-clamp-2">
                  {post.title}
                </Link>
                
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="text-gray-500">{post.service}</span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name} 
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <span className="text-sm">{post.author.name}</span>
                  </div>
                  
                  <div className="flex">
                    <Link 
                      to={`/services/${post.service.toLowerCase().replace(/\s+/g, '-')}/${post.slug}`}
                      target="_blank"
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    
                    <Link 
                      to={`/admin/content/posts/edit/${post.id}`} 
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Edit size={14} />
                    </Link>
                    
                    <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    currentPage === pageNum 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

// Post Editor Component
const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(id ? true : false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  
  // Form state
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    service: '',
    category: '',
    tags: [],
    status: 'draft',
    featuredImage: '',
    mediaType: 'image',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    featured: false
  });

  // Options
  const [services] = useState([
    'Adult Health Nursing',
    'Mental Health Nursing',
    'Child Nursing',
    'Special Education',
    'Social Work',
    'AI Services',
    'Crypto'
  ]);
  
  const [categories] = useState([
    'Research',
    'Case Studies',
    'Best Practices',
    'Education',
    'Professional Development'
  ]);

  // Load post data if editing
  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        setIsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock post data
        const mockPost: Partial<Post> = {
          title: "The Impact of Evidence-Based Practice in Adult Nursing",
          slug: "impact-evidence-based-practice-adult-nursing",
          excerpt: "Exploring how evidence-based practices are revolutionizing adult nursing care and improving patient outcomes across healthcare settings.",
          content: `<p>Evidence-based practice (EBP) has become the gold standard in nursing care, particularly in adult health settings. This approach integrates the best available research evidence with clinical expertise and patient values to guide decision-making in patient care.</p>
          
          <h2>Key Benefits of Evidence-Based Practice</h2>
          
          <p>Implementation of EBP in adult nursing has led to numerous benefits:</p>
          
          <ul>
            <li>Improved patient outcomes and safety</li>
            <li>Reduced healthcare costs</li>
            <li>Standardization of care practices</li>
            <li>Enhanced nursing professional development</li>
            <li>Greater patient satisfaction</li>
          </ul>
          
          <h2>Challenges in Implementation</h2>
          
          <p>Despite its benefits, healthcare organizations face several challenges when implementing EBP:</p>
          
          <ol>
            <li>Resistance to change among healthcare professionals</li>
            <li>Limited resources and time constraints</li>
            <li>Lack of knowledge and skills in research evaluation</li>
            <li>Organizational culture and leadership barriers</li>
          </ol>
          
          <h2>Best Practices for Implementation</h2>
          
          <p>Successful implementation of EBP requires a systematic approach:</p>
          
          <ol>
            <li>Cultivate a culture that values and prioritizes evidence-based care</li>
            <li>Provide ongoing education and training in research methods and critical appraisal</li>
            <li>Develop mentorship programs and EBP champions</li>
            <li>Allocate dedicated time and resources for research and implementation</li>
            <li>Create clear policies and guidelines based on current best evidence</li>
            <li>Establish metrics to measure outcomes and success</li>
          </ol>
          
          <h2>Case Study: EBP in Pressure Ulcer Prevention</h2>
          
          <p>A notable example of EBP success is in pressure ulcer prevention. Through implementation of evidence-based protocols including regular repositioning, specialized support surfaces, and comprehensive risk assessment, many facilities have seen up to 70% reduction in hospital-acquired pressure injuries.</p>
          
          <h2>The Future of EBP in Adult Nursing</h2>
          
          <p>The future of evidence-based nursing practice looks promising with advancements in technology and data analytics. Emerging trends include:</p>
          
          <ul>
            <li>Integration of big data and predictive analytics</li>
            <li>Personalized medicine and care protocols</li>
            <li>Enhanced patient engagement through technology</li>
            <li>Global collaboration and knowledge sharing</li>
          </ul>
          
          <h2>Conclusion</h2>
          
          <p>Evidence-based practice continues to evolve and shape the future of adult nursing. By embracing EBP principles, nurses can ensure they are providing the highest quality, most current care to their patients while advancing the nursing profession.</p>`,
          service: "Adult Health Nursing",
          category: "Research",
          tags: ["Evidence-Based Practice", "Nursing Research", "Healthcare Quality", "Patient Outcomes", "Clinical Guidelines"],
          status: "published",
          publishedAt: new Date(Date.now() - 3000000000).toISOString(),
          featuredImage: "/api/placeholder/800/400",
          seoTitle: "Evidence-Based Practice in Adult Nursing | Impact & Implementation",
          seoDescription: "Learn how evidence-based practice is transforming adult nursing care, improving patient outcomes, and advancing healthcare quality standards.",
          seoKeywords: ["evidence-based practice", "nursing research", "adult nursing", "healthcare quality", "nursing education"],
          featured: true
        };

        setPost(mockPost);
        setIsLoading(false);
      };

      fetchPost();
    }
  }, [id]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle title change and update slug if slug is empty
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPost(prev => ({
      ...prev,
      title: newTitle,
      slug: prev.slug ? prev.slug : generateSlug(newTitle),
      seoTitle: prev.seoTitle || newTitle
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add success message logic here
    
    setIsSaving(false);
    
    // Redirect to posts list
    navigate('/admin/content/posts');
  };

  // Handle tag input
  const [tagInput, setTagInput] = useState('');
  
  const addTag = () => {
    if (tagInput.trim() && !post.tags?.includes(tagInput.trim())) {
      setPost(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  // Handle SEO keyword input
  const [keywordInput, setKeywordInput] = useState('');
  
  const addKeyword = () => {
    if (keywordInput.trim() && !post.seoKeywords?.includes(keywordInput.trim())) {
      setPost(prev => ({
        ...prev,
        seoKeywords: [...(prev.seoKeywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };
  
  const removeKeyword = (keyword: string) => {
    setPost(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords?.filter(k => k !== keyword) || []
    }));
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          
          <div className="space-y-6">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link 
                to="/admin/content/posts" 
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={18} />
                <span>Back to posts</span>
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-semibold">{id ? 'Edit Post' : 'New Post'}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={post.status}
                onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value as any }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
              
              <button 
                type="submit"
                disabled={isSaving}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block mb-2 font-medium">Title</label>
                <input 
                  type="text" 
                  value={post.title}
                  onChange={handleTitleChange}
                  placeholder="Enter post title"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              {/* Content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block mb-2 font-medium">Content</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2">
                    <button 
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      B
                    </button>
                    <button 
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded italic"
                    >
                      I
                    </button>
                    <button 
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded underline"
                    >
                      U
                    </button>
                    <span className="h-4 w-px bg-gray-300 mx-1"></span>
                    <button 
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ListIcon size={16} />
                    </button>
                    <button 
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <OrderedList size={16} />
                    </button>
                    <span className="h-4 w-px bg-gray-300 mx-1"></span>
                    <button 
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Link2Icon size={16} />
                    </button>
                    <button 
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded"
                      onClick={() => setShowMediaLibrary(true)}
                    >
                      <Image size={16} />
                    </button>
                  </div>
                  <textarea 
                    value={post.content}
                    onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter post content..."
                    className="w-full px-4 py-3 resize-y min-h-[300px] focus:outline-none focus:ring-0 border-0"
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Rich text editor</span>
                  <span>You can use HTML tags</span>
                </div>
              </div>
              
              {/* Excerpt */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <label className="block mb-2 font-medium">Excerpt</label>
                <textarea 
                  value={post.excerpt}
                  onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Enter post excerpt..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                ></textarea>
                <p className="mt-2 text-sm text-gray-500">
                  A short summary of the post. If left empty, it will be automatically generated from the content.
                </p>
              </div>
              
              {/* SEO */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <span>SEO Settings</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    Recommended
                  </span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm">SEO Title</label>
                    <input 
                      type="text" 
                      value={post.seoTitle}
                      onChange={(e) => setPost(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="Enter SEO title"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended length: 50-60 characters
                    </p>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm">Meta Description</label>
                    <textarea 
                      value={post.seoDescription}
                      onChange={(e) => setPost(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="Enter meta description"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended length: 120-160 characters
                    </p>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm">Keywords</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.seoKeywords?.map(keyword => (
                        <span 
                          key={keyword} 
                          className="px-2 py-1 bg-gray-100 rounded-lg text-sm flex items-center gap-1"
                        >
                          {keyword}
                          <button 
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        placeholder="Add keyword"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button 
                        type="button"
                        onClick={addKeyword}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Publish settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-medium mb-4">Publish Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm">Status</label>
                    <select 
                      value={post.status}
                      onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  {post.status === 'scheduled' && (
                    <div>
                      <label className="block mb-2 text-sm">Scheduled Date</label>
                      <input 
                        type="datetime-local" 
                        value={post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setPost(prev => ({ ...prev, scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="featured" 
                      checked={post.featured}
                      onChange={(e) => setPost(prev => ({ ...prev, featured: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                      Featured post
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Categories and tags */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-medium mb-4">Categories and Tags</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm">Service</label>
                    <select 
                      value={post.service}
                      onChange={(e) => setPost(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="" disabled>Select a service</option>
                      {services.map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm">Category</label>
                    <select 
                      value={post.category}
                      onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags?.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 bg-gray-100 rounded-lg text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button 
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add tag"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button 
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Featured image */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-medium mb-4">Featured Image</h3>
                
                {post.featuredImage ? (
                  <div className="relative">
                    <img 
                      src={post.featuredImage} 
                      alt="Featured" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button 
                      type="button"
                      onClick={() => setPost(prev => ({ ...prev, featuredImage: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
                    onClick={() => setShowMediaLibrary(true)}
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-gray-100 rounded-full mb-3">
                        <Upload size={20} className="text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">Click to select image</p>
                      <p className="text-xs text-gray-400">
                        Recommended size: 1200 x 630 pixels
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block mb-2 text-sm">Media Type</label>
                    <select 
                      value={post.mediaType || 'image'}
                      onChange={(e) => setPost(prev => ({ ...prev, mediaType: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                    </select>
                  </div>
                  
                  {post.mediaType && post.mediaType !== 'image' && (
                    <div>
                      <label className="block mb-2 text-sm">Media URL</label>
                      <input 
                        type="text" 
                        value={post.mediaUrl || ''}
                        onChange={(e) => setPost(prev => ({ ...prev, mediaUrl: e.target.value }))}
                        placeholder="Enter media URL"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {post.mediaType === 'video' ? 'YouTube, Vimeo, or direct video URL' : 'SoundCloud, Spotify, or direct audio URL'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Permalink */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-medium mb-4">Permalink</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm">Slug</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                        /services/{post.service?.toLowerCase().replace(/\s+/g, '-') || 'service'}/
                      </span>
                      <input 
                        type="text" 
                        value={post.slug}
                        onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="post-slug"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      {/* Media library modal (simplified for this example) */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold">Media Library</h3>
              <button 
                type="button"
                onClick={() => setShowMediaLibrary(false)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {Array(12).fill(null).map((_, index) => (
                  <div 
                    key={index}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setPost(prev => ({ ...prev, featuredImage: `/api/placeholder/${800 + index}/${400 + index}` }));
                      setShowMediaLibrary(false);
                    }}
                  >
                    <img 
                      src={`/api/placeholder/${800 + index}/${400 + index}`} 
                      alt={`Media ${index}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button 
                type="button"
                onClick={() => setShowMediaLibrary(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button 
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom icons
const ListIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const OrderedList: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6"></line>
    <line x1="10" y1="12" x2="21" y2="12"></line>
    <line x1="10" y1="18" x2="21" y2="18"></line>
    <path d="M4 6h1v4"></path>
    <path d="M4 10h2"></path>
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
  </svg>
);

const Link2Icon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

// Categories List Component
const CategoriesList: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', service: '' });
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [services] = useState([
    'Adult Health Nursing',
    'Mental Health Nursing',
    'Child Nursing',
    'Special Education',
    'Social Work',
    'AI Services',
    'Crypto'
  ]);

  // Simulate fetching categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock categories
      const mockCategories: ServiceCategory[] = [
        { id: '1', name: 'Research', slug: 'research', count: 15, service: 'Adult Health Nursing' },
        { id: '2', name: 'Case Studies', slug: 'case-studies', count: 8, service: 'Adult Health Nursing' },
        { id: '3', name: 'Best Practices', slug: 'best-practices', count: 12, service: 'Adult Health Nursing' },
        { id: '4', name: 'Education', slug: 'education', count: 10, service: 'Adult Health Nursing' },
        { id: '5', name: 'Professional Development', slug: 'professional-development', count: 6, service: 'Adult Health Nursing' },
        { id: '6', name: 'Research', slug: 'research', count: 9, service: 'Mental Health Nursing' },
        { id: '7', name: 'Case Studies', slug: 'case-studies', count: 7, service: 'Mental Health Nursing' },
        { id: '8', name: 'Techniques', slug: 'techniques', count: 11, service: 'Mental Health Nursing' },
        { id: '9', name: 'Technology', slug: 'technology', count: 14, service: 'AI Services' },
        { id: '10', name: 'Innovations', slug: 'innovations', count: 5, service: 'AI Services' }
      ];
      
      setCategories(mockCategories);
      setIsLoading(false);
    };
    
    fetchCategories();
  }, []);

  // Group categories by service
  const categoriesByService = categories.reduce((acc, category) => {
    if (!acc[category.service]) {
      acc[category.service] = [];
    }
    acc[category.service].push(category);
    return acc;
  }, {} as Record<string, ServiceCategory[]>);

  // Handle add new category
  const handleAddCategory = () => {
    if (newCategory.name.trim() && newCategory.service) {
      const newCategoryObj: ServiceCategory = {
        id: `new-${Math.random().toString(36).substr(2, 9)}`,
        name: newCategory.name.trim(),
        slug: newCategory.name.trim().toLowerCase().replace(/\s+/g, '-'),
        count: 0,
        service: newCategory.service
      };
      
      setCategories(prev => [...prev, newCategoryObj]);
      setNewCategory({ name: '', service: '' });
    }
  };

  // Handle delete category
  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id));
  };

  // Handle edit category
  const handleUpdateCategory = () => {
    if (editingCategory && editingCategory.name.trim()) {
      setCategories(prev => prev.map(category => 
        category.id === editingCategory.id 
          ? { 
              ...editingCategory, 
              slug: editingCategory.name.trim().toLowerCase().replace(/\s+/g, '-') 
            } 
          : category
      ));
      setEditingCategory(null);
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>
      
      {/* Add new category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold mb-4">Add New Category</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block mb-2 text-sm">Name</label>
            <input 
              type="text" 
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter category name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex-1">
            <label className="block mb-2 text-sm">Service</label>
            <select 
              value={newCategory.service}
              onChange={(e) => setNewCategory(prev => ({ ...prev, service: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Select a service</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim() || !newCategory.service}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                !newCategory.name.trim() || !newCategory.service 
                  ? 'opacity-70 cursor-not-allowed' 
                  : ''
              }`}
            >
              Add Category
            </button>
          </div>
        </div>
      </div>
      
      {/* Categories list */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {Array(3).fill(null).map((_, index) => (
                <div key={index}>
                  <div className="h-5 bg-gray-200 rounded w-1/6 mb-3"></div>
                  <div className="h-12 bg-gray-200 rounded mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categoriesByService).map(([service, serviceCategories]) => (
            <div key={service} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold">{service}</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {serviceCategories.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No categories for this service
                  </div>
                ) : (
                  serviceCategories.map(category => (
                    <div key={category.id} className="p-4 hover:bg-gray-50">
                      {editingCategory && editingCategory.id === category.id ? (
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input 
                              type="text" 
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              autoFocus
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={handleUpdateCategory}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingCategory(null)}
                              className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">
                              Slug: {category.slug} | Posts: {category.count}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setEditingCategory(category)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Tags List Component
const TagsList: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Simulate fetching tags
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock tags
      const mockTags: Tag[] = [
        { id: '1', name: 'Evidence-Based Practice', slug: 'evidence-based-practice', count: 18 },
        { id: '2', name: 'Nursing Research', slug: 'nursing-research', count: 14 },
        { id: '3', name: 'Healthcare Quality', slug: 'healthcare-quality', count: 12 },
        { id: '4', name: 'Patient Outcomes', slug: 'patient-outcomes', count: 9 },
        { id: '5', name: 'Clinical Guidelines', slug: 'clinical-guidelines', count: 7 },
        { id: '6', name: 'Mental Health', slug: 'mental-health', count: 15 },
        { id: '7', name: 'Cognitive Therapy', slug: 'cognitive-therapy', count: 8 },
        { id: '8', name: 'Pediatric Care', slug: 'pediatric-care', count: 6 },
        { id: '9', name: 'Special Education', slug: 'special-education', count: 11 },
        { id: '10', name: 'Social Work', slug: 'social-work', count: 9 },
        { id: '11', name: 'Machine Learning', slug: 'machine-learning', count: 13 },
        { id: '12', name: 'Artificial Intelligence', slug: 'artificial-intelligence', count: 10 },
        { id: '13', name: 'Blockchain', slug: 'blockchain', count: 5 },
        { id: '14', name: 'Cryptocurrency', slug: 'cryptocurrency', count: 4 },
        { id: '15', name: 'Academic Writing', slug: 'academic-writing', count: 20 },
      ];
      
      mockTags.sort((a, b) => b.count - a.count);
      
      setTags(mockTags);
      setIsLoading(false);
    };
    
    fetchTags();
  }, []);

  // Handle add new tag
  const handleAddTag = () => {
    if (newTag.trim()) {
      const newTagObj: Tag = {
        id: `new-${Math.random().toString(36).substr(2, 9)}`,
        name: newTag.trim(),
        slug: newTag.trim().toLowerCase().replace(/\s+/g, '-'),
        count: 0
      };
      
      setTags(prev => [...prev, newTagObj].sort((a, b) => b.count - a.count));
      setNewTag('');
    }
  };

  // Handle delete tag
  const handleDeleteTag = (id: string) => {
    setTags(prev => prev.filter(tag => tag.id !== id));
  };

  // Handle edit tag
  const handleUpdateTag = () => {
    if (editingTag && editingTag.name.trim()) {
      setTags(prev => prev.map(tag => 
        tag.id === editingTag.id 
          ? { 
              ...editingTag, 
              slug: editingTag.name.trim().toLowerCase().replace(/\s+/g, '-') 
            } 
          : tag
      ));
      setEditingTag(null);
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tags</h1>
      </div>
      
      {/* Add new tag */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold mb-4">Add New Tag</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <button 
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                !newTag.trim() ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              Add Tag
            </button>
          </div>
        </div>
      </div>
      
      {/* Tags list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold">All Tags</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(12).fill(null).map((_, index) => (
                  <div key={index} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.length === 0 ? (
                <div className="col-span-3 text-center text-gray-500 py-8">
                  No tags found
                </div>
              ) : (
                tags.map(tag => (
                  <div 
                    key={tag.id} 
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                  >
                    {editingTag && editingTag.id === tag.id ? (
                      <div className="p-3 flex items-center gap-3">
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={editingTag.name}
                            onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={handleUpdateTag}
                            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={() => setEditingTag(null)}
                            className="p-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tag.name}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                            {tag.count}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <button 
                            onClick={() => setEditingTag(tag)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Media Library Component
const MediaLibrary: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Simulate fetching media
  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock media
      const mockMedia: Media[] = Array(50).fill(null).map((_, index) => {
        const types = ['image', 'video', 'audio', 'document'] as const;
        const type = types[Math.floor(Math.random() * types.length)];
        
        return {
          id: `media-${index + 1}`,
          title: [
            'Feature Image', 'Blog Header', 'Case Study Diagram', 
            'Research Graph', 'Patient Chart', 'Educational Video',
            'Lecture Audio', 'Research Paper', 'Tutorial PDF'
          ][Math.floor(Math.random() * 9)],
          type,
          url: `/api/placeholder/${800 + index}/${600 + index}`,
          thumbnailUrl: type !== 'image' ? `/api/placeholder/${400 + index}/${300 + index}` : undefined,
          fileSize: Math.floor(Math.random() * 10000000),
          dimensions: type === 'image' || type === 'video' 
            ? { width: 800 + index, height: 600 + index } 
            : undefined,
          duration: type === 'video' || type === 'audio' 
            ? Math.floor(Math.random() * 600) 
            : undefined,
          uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
          uploadedBy: {
            id: `user-${Math.floor(Math.random() * 5) + 1}`,
            name: [`Dr. Smith`, `Sarah Johnson`, `Michael Brown`, `Emma Wilson`, `David Lee`][Math.floor(Math.random() * 5)]
          },
          usedIn: {
            posts: Math.floor(Math.random() * 10),
            pages: Math.floor(Math.random() * 5)
          }
        };
      });
      
      // Sort by upload date (newest first)
      mockMedia.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      setMedia(mockMedia);
      setIsLoading(false);
    };
    
    fetchMedia();
  }, []);

  // Filter media
  const filteredMedia = media.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Paginate media
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMedia.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Toggle select item
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  // Select all visible items
  const selectAllVisible = () => {
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentItems.map(item => item.id));
    }
  };

  // Delete selected items
  const deleteSelectedItems = () => {
    setMedia(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <Link 
          to="/admin/media/upload" 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Upload size={16} />
          Upload New
        </Link>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 md:w-1/5">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-200 rounded-lg"
            >
              <option value="all">All Media</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>
          </div>
          
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search media..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          <div className="flex md:w-auto">
            <button 
              onClick={() => setView('grid')} 
              className={`p-2 rounded-l-lg border border-gray-200 ${
                view === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'
              }`}
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setView('list')} 
              className={`p-2 rounded-r-lg border-t border-r border-b border-gray-200 ${
                view === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
        
        {/* Actions when items are selected */}
        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedItems([])}
                className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={deleteSelectedItems}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Media display */}
      {isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(20).fill(null).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">File</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Size</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Dimensions</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Uploaded</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Used In</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(10).fill(null).map((_, index) => (
                    <tr key={index} className="animate-pulse border-b border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No media found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setFilter('all');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reset filters
          </button>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === currentItems.length && currentItems.length > 0}
                  onChange={selectAllVisible}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">
                  Select all
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMedia.length)} of {filteredMedia.length} items
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {currentItems.map(item => (
              <div 
                key={item.id} 
                className={`group relative rounded-lg overflow-hidden border ${
                  selectedItems.includes(item.id) 
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="aspect-square bg-gray-100 relative">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === 'video' ? (
                    <div className="relative h-full">
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
                          <Film size={24} className="text-white" />
                        </div>
                      </div>
                    </div>
                  ) : item.type === 'audio' ? (
                    <div className="h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Music size={40} className="text-white" />
                    </div>
                  ) : (
                    <div className="h-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                      <FileText size={40} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-white">
                  <div className="font-medium truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                    <span>{formatFileSize(item.fileSize)}</span>
                    <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600">
                    <Eye size={18} />
                  </button>
                  <button className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600">
                    <Edit size={18} />
                  </button>
                  <button className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.length === currentItems.length && currentItems.length > 0}
                        onChange={selectAllVisible}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-600">File</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Dimensions</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Uploaded</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Used In</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        
                        <div className="h-10 w-10 rounded overflow-hidden flex items-center justify-center bg-gray-100">
                          {item.type === 'image' ? (
                            <img 
                              src={item.url} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === 'video' ? (
                            <Film size={20} className="text-gray-500" />
                          ) : item.type === 'audio' ? (
                            <Music size={20} className="text-gray-500" />
                          ) : (
                            <FileText size={20} className="text-gray-500" />
                          )}
                        </div>
                        
                        <div className="font-medium">{item.title}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{item.type}</td>
                    <td className="px-4 py-3">{formatFileSize(item.fileSize)}</td>
                    <td className="px-4 py-3">
                      {item.dimensions 
                        ? `${item.dimensions.width} × ${item.dimensions.height}` 
                        : item.duration 
                          ? formatDuration(item.duration)
                          : '—'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{new Date(item.uploadedAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">by {item.uploadedBy.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{item.usedIn.posts} posts</div>
                      <div>{item.usedIn.pages} pages</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    currentPage === pageNum 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

// Media Upload Component (simplified)
const MediaUpload: React.FC = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      
      // Generate preview URLs
      const newPreviewUrls = selectedFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });
      
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle upload
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Simulate API delay
        setTimeout(() => {
          setIsUploading(false);
          navigate('/admin/media');
        }, 500);
      }
    }, 200);
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link 
          to="/admin/media" 
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={18} />
          <span>Back to media</span>
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold">Upload Media</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isUploading ? (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Uploading Files</h2>
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-500">{uploadProgress}% complete</div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-8 text-center border-b border-gray-100">
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-12 cursor-pointer hover:bg-gray-50"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-blue-100 rounded-full mb-4">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Drag and drop or click to upload</h3>
                  <p className="text-gray-500 mb-4 max-w-md">
                    Upload images, videos, audio files, or documents.
                    Max file size: 10MB for images, 50MB for videos and audio, 20MB for documents.
                  </p>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Browse Files
                  </button>
                </div>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="p-6">
                <h3 className="font-semibold mb-4">Selected Files ({files.length})</h3>
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          {file.type.startsWith('image/') && previewUrls[index] ? (
                            <img 
                              src={previewUrls[index]} 
                              alt={file.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <Film size={24} className="text-gray-500" />
                          ) : file.type.startsWith('audio/') ? (
                            <Music size={24} className="text-gray-500" />
                          ) : (
                            <FileText size={24} className="text-gray-500" />
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium truncate max-w-md" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB • {file.type || 'Unknown type'}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeFile(index)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={handleUpload}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Users List Component (simplified)
const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Simulate fetching users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock users
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@example.com',
          role: 'admin',
          avatar: '/api/placeholder/100/100',
          status: 'active',
          lastLogin: new Date(Date.now() - 1000000).toISOString()
        },
        {
          id: '2',
          name: 'Michael Brown',
          email: 'michael.brown@example.com',
          role: 'editor',
          avatar: '/api/placeholder/101/101',
          status: 'active',
          lastLogin: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          name: 'Emma Wilson',
          email: 'emma.wilson@example.com',
          role: 'editor',
          avatar: '/api/placeholder/102/102',
          status: 'active',
          lastLogin: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '4',
          name: 'David Lee',
          email: 'david.lee@example.com',
          role: 'viewer',
          avatar: '/api/placeholder/103/103',
          status: 'inactive',
          lastLogin: new Date(Date.now() - 1209600000).toISOString()
        },
        {
          id: '5',
          name: 'Jennifer Smith',
          email: 'jennifer.smith@example.com',
          role: 'viewer',
          avatar: '/api/placeholder/104/104',
          status: 'pending',
          lastLogin: ''
        }
      ];
      
      setUsers(mockUsers);
      setIsLoading(false);
    };
    
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <PlusCircle size={16} />
          Add User
        </button>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 md:w-1/4">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 md:w-1/4">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
      </div>
      
      {/* Users list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array(5).fill(null).map((_, index) => (
              <div key={index} className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map(user => (
              <div key={user.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {user.lastLogin 
                      ? `Last login: ${new Date(user.lastLogin).toLocaleDateString()}`
                      : 'Never logged in'
                    }
                  </div>
                  
                  <div className="flex items-center">
                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Dashboard Component (simplified)
const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<Analytics['timeRange']>('last30days');

  // Simulate fetching analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock analytics data
      const mockAnalytics: Analytics = {
        timeRange,
        overview: {
          totalViews: 24538,
          totalLikes: 1256,
          totalComments: 348,
          totalShares: 502,
          averageReadTime: 4.2,
          viewsChange: 12.5,
          likesChange: 8.3,
          commentsChange: 5.1,
          sharesChange: 15.7
        },
        topPosts: [
          { id: '1', title: 'The Impact of Evidence-Based Practice in Adult Nursing', views: 1245, service: 'Adult Health Nursing' },
          { id: '2', title: 'Cognitive Behavioral Therapy: A Comprehensive Guide', views: 987, service: 'Mental Health Nursing' },
          { id: '3', title: 'Special Education Strategies for Inclusive Classrooms', views: 872, service: 'Special Education' },
          { id: '4', title: 'AI-Powered Diagnostic Tools in Modern Medicine', views: 745, service: 'AI Services' },
          { id: '5', title: 'Social Work Interventions in Community Health', views: 683, service: 'Social Work' }
        ],
        topServices: [
          { service: 'Adult Health Nursing', views: 7845, percentage: 32 },
          { service: 'Mental Health Nursing', views: 5632, percentage: 23 },
          { service: 'Special Education', views: 4521, percentage: 18 },
          { service: 'AI Services', views: 3256, percentage: 13 },
          { service: 'Social Work', views: 2154, percentage: 9 },
          { service: 'Child Nursing', views: 1020, percentage: 4 },
          { service: 'Crypto', views: 110, percentage: 1 }
        ],
        viewsByDay: Array(30).fill(null).map((_, index) => ({
          date: new Date(Date.now() - (29 - index) * 86400000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 500) + 300
        })),
        engagementByService: [
          { service: 'Adult Health Nursing', likes: 420, comments: 120, shares: 180 },
          { service: 'Mental Health Nursing', likes: 350, comments: 98, shares: 145 },
          { service: 'Special Education', likes: 280, comments: 75, shares: 110 },
          { service: 'AI Services', likes: 150, comments: 40, shares: 60 },
          { service: 'Social Work', likes: 56, comments: 15, shares: 7 }
        ]
      };
      
      setAnalytics(mockAnalytics);
      setIsLoading(false);
    };
    
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as Analytics['timeRange'])}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7days">Last 7 days</option>
          <option value="last30days">Last 30 days</option>
          <option value="thisMonth">This month</option>
          <option value="lastMonth">Last month</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          {/* Overview stats loading */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(null).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
          
          {/* Charts loading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-500">Total Views</div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Eye size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold">{analytics.overview.totalViews.toLocaleString()}</div>
              <div className={`text-sm ${
                analytics.overview.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'
              } mt-2 flex items-center gap-1`}>
                <span>{analytics.overview.viewsChange >= 0 ? '+' : ''}{analytics.overview.viewsChange}%</span>
                <span>vs previous period</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-500">Total Likes</div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <ThumbsUp size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold">{analytics.overview.totalLikes.toLocaleString()}</div>
              <div className={`text-sm ${
                analytics.overview.likesChange >= 0 ? 'text-green-600' : 'text-red-600'
              } mt-2 flex items-center gap-1`}>
                <span>{analytics.overview.likesChange >= 0 ? '+' : ''}{analytics.overview.likesChange}%</span>
                <span>vs previous period</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-500">Total Comments</div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <MessageSquare size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold">{analytics.overview.totalComments.toLocaleString()}</div>
              <div className={`text-sm ${
                analytics.overview.commentsChange >= 0 ? 'text-green-600' : 'text-red-600'
              } mt-2 flex items-center gap-1`}>
                <span>{analytics.overview.commentsChange >= 0 ? '+' : ''}{analytics.overview.commentsChange}%</span>
                <span>vs previous period</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-500">Avg. Read Time</div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Clock size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold">{analytics.overview.averageReadTime} min</div>
              <div className="text-sm text-gray-500 mt-2">
                Average time spent reading
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Views by day chart (placeholder) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="font-semibold mb-6">Views by Day</h2>
              <div className="h-60 bg-gray-50 rounded-lg flex items-center justify-center">
                {/* This would be a real chart in a production app */}
                <div className="text-gray-500">Chart visualization would appear here</div>
              </div>
            </div>
            
            {/* Top services chart (placeholder) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="font-semibold mb-6">Views by Service</h2>
              <div className="h-60 bg-gray-50 rounded-lg flex items-center justify-center">
                {/* This would be a real chart in a production app */}
                <div className="text-gray-500">Chart visualization would appear here</div>
              </div>
            </div>
          </div>
          
          {/* Top posts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold">Top Posts</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {analytics.topPosts.map((post, index) => (
                <div key={post.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-200 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div>
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-gray-500">{post.service}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye size={16} />
                        <span>{post.views.toLocaleString()}</span>
                      </div>
                      
                      <Link 
                        to={`/admin/content/posts/edit/${post.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Engagement by service */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold">Engagement by Service</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Likes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Engagement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {analytics.engagementByService.map((service) => (
                    <tr key={service.service} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {service.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.likes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.comments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.shares.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(service.likes + service.comments + service.shares).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// Settings Component (simplified)
const SettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'HandyWriterz',
    siteDescription: 'Expert assistance for nursing, social work, and special education students.',
    contactEmail: 'support@handywriterz.com',
    phoneNumber: '+1 (555) 123-4567',
    address: '123 Academic St, Education City, EC 12345'
  });
  
  // SEO settings
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: 'HandyWriterz - Academic Success Partner',
    metaDescription: 'Expert assistance for nursing, social work, and special education students. Get professional support for your academic journey.',
    googleAnalyticsId: 'UA-123456789-1',
    enableSitemap: true,
    enableRobotsTxt: true
  });
  
  // API settings
  const [apiSettings, setApiSettings] = useState({
    turnitinApiKey: '••••••••••••••••',
    googleApiKey: '••••••••••••••••',
    openaiApiKey: '••••••••••••••••',
    enableExternalApis: true
  });
  
  // Social media settings
  const [socialSettings, setSocialSettings] = useState({
    facebook: 'https://facebook.com/handywriterz',
    twitter: 'https://twitter.com/handywriterz',
    instagram: 'https://instagram.com/handywriterz',
    linkedin: 'https://linkedin.com/company/handywriterz',
    youtube: ''
  });

  // Handle save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    
    // Show success message (would be implemented with a toast notification in a real app)
    alert('Settings saved successfully');
  };

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
            isSaving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Settings
            </>
          )}
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'general' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('seo')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'seo' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SEO
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'api' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            API Keys
          </button>
          <button 
            onClick={() => setActiveTab('social')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'social' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Social Media
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'notifications' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notifications
          </button>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {/* General settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">General Settings</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium">Site Name</label>
                  <input 
                    type="text" 
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Site Description</label>
                  <textarea 
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Contact Email</label>
                  <input 
                    type="email" 
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Phone Number</label>
                  <input 
                    type="text" 
                    value={generalSettings.phoneNumber}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Address</label>
                  <textarea 
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          )}
          
          {/* SEO settings */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">SEO Settings</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium">Meta Title</label>
                  <input 
                    type="text" 
                    value={seoSettings.metaTitle}
                    onChange={(e) => setSeoSettings(prev => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended length: 50-60 characters
                  </p>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Meta Description</label>
                  <textarea 
                    value={seoSettings.metaDescription}
                    onChange={(e) => setSeoSettings(prev => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  ></textarea>
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended length: 120-160 characters
                  </p>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Google Analytics ID</label>
                  <input 
                    type="text" 
                    value={seoSettings.googleAnalyticsId}
                    onChange={(e) => setSeoSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="enableSitemap" 
                      checked={seoSettings.enableSitemap}
                      onChange={(e) => setSeoSettings(prev => ({ ...prev, enableSitemap: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableSitemap" className="ml-2 text-sm text-gray-700">
                      Enable XML Sitemap
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="enableRobotsTxt" 
                      checked={seoSettings.enableRobotsTxt}
                      onChange={(e) => setSeoSettings(prev => ({ ...prev, enableRobotsTxt: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableRobotsTxt" className="ml-2 text-sm text-gray-700">
                      Enable robots.txt
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* API settings */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">API Keys</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium">Turnitin API Key</label>
                  <div className="flex">
                    <input 
                      type="password" 
                      value={apiSettings.turnitinApiKey}
                      onChange={(e) => setApiSettings(prev => ({ ...prev, turnitinApiKey: e.target.value }))}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-200 rounded-r-lg hover:bg-gray-200">
                      Show
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Google API Key</label>
                  <div className="flex">
                    <input 
                      type="password" 
                      value={apiSettings.googleApiKey}
                      onChange={(e) => setApiSettings(prev => ({ ...prev, googleApiKey: e.target.value }))}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-200 rounded-r-lg hover:bg-gray-200">
                      Show
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">OpenAI API Key</label>
                  <div className="flex">
                    <input 
                      type="password" 
                      value={apiSettings.openaiApiKey}
                      onChange={(e) => setApiSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-200 rounded-r-lg hover:bg-gray-200">
                      Show
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="enableExternalApis" 
                    checked={apiSettings.enableExternalApis}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, enableExternalApis: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableExternalApis" className="ml-2 text-sm text-gray-700">
                    Enable external API integrations
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Social media settings */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Social Media</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium">Facebook</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      https://facebook.com/
                    </span>
                    <input 
                      type="text" 
                      value={socialSettings.facebook.replace('https://facebook.com/', '')}
                      onChange={(e) => setSocialSettings(prev => ({ ...prev, facebook: `https://facebook.com/${e.target.value}` }))}
                      placeholder="yourpage"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Twitter</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      https://twitter.com/
                    </span>
                    <input 
                      type="text" 
                      value={socialSettings.twitter.replace('https://twitter.com/', '')}
                      onChange={(e) => setSocialSettings(prev => ({ ...prev, twitter: `https://twitter.com/${e.target.value}` }))}
                      placeholder="username"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">Instagram</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      https://instagram.com/
                    </span>
                    <input 
                      type="text" 
                      value={socialSettings.instagram.replace('https://instagram.com/', '')}
                      onChange={(e) => setSocialSettings(prev => ({ ...prev, instagram: `https://instagram.com/${e.target.value}` }))}
                      placeholder="username"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">LinkedIn</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      https://linkedin.com/company/
                    </span>
                    <input 
                      type="text" 
                      value={socialSettings.linkedin.replace('https://linkedin.com/company/', '')}
                      onChange={(e) => setSocialSettings(prev => ({ ...prev, linkedin: `https://linkedin.com/company/${e.target.value}` }))}
                      placeholder="companyname"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium">YouTube</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      https://youtube.com/c/
                    </span>
                    <input 
                      type="text" 
                      value={socialSettings.youtube.replace('https://youtube.com/c/', '')}
                      onChange={(e) => setSocialSettings(prev => ({ ...prev, youtube: e.target.value ? `https://youtube.com/c/${e.target.value}` : '' }))}
                      placeholder="channelname"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Notifications settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">New Comment Notifications</div>
                    <div className="text-sm text-gray-500">Receive notifications when a new comment is posted</div>
                  </div>
                  <div className="h-6 w-12 bg-blue-600 rounded-full p-1 flex">
                    <div className="h-4 w-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">New User Registrations</div>
                    <div className="text-sm text-gray-500">Receive notifications when a new user registers</div>
                  </div>
                  <div className="h-6 w-12 bg-blue-600 rounded-full p-1 flex">
                    <div className="h-4 w-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">Post Publications</div>
                    <div className="text-sm text-gray-500">Receive notifications when a post is published</div>
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded-full p-1 flex">
                    <div className="h-4 w-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">System Updates</div>
                    <div className="text-sm text-gray-500">Receive notifications about system updates</div>
                  </div>
                  <div className="h-6 w-12 bg-blue-600 rounded-full p-1 flex">
                    <div className="h-4 w-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive notifications via email</div>
                  </div>
                  <div className="h-6 w-12 bg-blue-600 rounded-full p-1 flex">
                    <div className="h-4 w-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
