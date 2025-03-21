import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiEye, 
  FiUsers, 
  FiFileText, 
  FiHeart, 
  FiMessageSquare, 
  FiBarChart2, 
  FiEdit3, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiPlusCircle
} from 'react-icons/fi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { contentService } from '@/services/contentService';
import { supabase } from '@/lib/supabase';
import { formatServiceName, formatDate } from '../../utils/formatters';

// Service types
const serviceTypes = [
  { id: 'adult-health-nursing', name: 'Adult Health Nursing' },
  { id: 'mental-health-nursing', name: 'Mental Health Nursing' },
  { id: 'child-nursing', name: 'Child Nursing' },
  { id: 'crypto', name: 'Cryptocurrency' },
  { id: 'ai', name: 'AI' }
];

// Stats interface
interface StatsData {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalCategories: number;
  totalUsers: number;
  totalViews: number;
}

// Service stats
interface ServiceStats {
  id: string;
  name: string;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  views: number;
}

// Recent content interface
interface RecentPost {
  id: string;
  title: string;
  author: string;
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  date: string;
  category: string;
  service: string;
  views?: number;
  comments?: number;
}

// Recent comment interface
interface RecentComment {
  id: string;
  user: string;
  content: string;
  contentTitle: string;
  postId: string;
  date: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [recentContent, setRecentContent] = useState<RecentPost[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch overall statistics
      await Promise.all([
        fetchOverallStats(),
        fetchServiceStats(),
        fetchRecentContent(),
        fetchRecentComments()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStats = async () => {
    try {
      // Fetch posts count by status
      const { data: postsData } = await supabase
        .from('posts')
        .select('status');

      const totalPosts = postsData?.length || 0;
      const publishedPosts = postsData?.filter(post => post.status === 'published').length || 0;
      const draftPosts = postsData?.filter(post => post.status === 'draft').length || 0;
      const scheduledPosts = postsData?.filter(post => post.status === 'scheduled').length || 0;

      // Fetch categories count
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // Fetch users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total views - avoid using the status column
      const { data: viewsData } = await supabase
        .from('views')
        .select('view_count');

      const totalViews = viewsData?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0;

      setStats({
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        totalCategories: totalCategories || 0,
        totalUsers: totalUsers || 0,
        totalViews
      });
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    }
  };

  const fetchServiceStats = async () => {
    try {
      const servicesWithStats = await Promise.all(
        serviceTypes.map(async (service) => {
          try {
            // For each service, get relevant stats
            const { data: postsData } = await supabase
              .from('posts')
              .select('status')
              .eq('service_type', service.id);

            const totalPosts = postsData?.length || 0;
            const publishedPosts = postsData?.filter(post => post.status === 'published').length || 0;
            const draftPosts = postsData?.filter(post => post.status === 'draft').length || 0;

            // Fetch views using a safer query that doesn't assume column existence
            let views = 0;
            try {
              const { data: viewsData } = await supabase
                .from('views')
                .select('view_count')
                .eq('service_type', service.id);
              
              views = viewsData?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0;
            } catch (viewError) {
              console.error(`Error fetching views for service ${service.id}:`, viewError);
              // Continue with zero views if there's an error
            }

            return {
              id: service.id,
              name: service.name,
              totalPosts,
              publishedPosts,
              draftPosts,
              views
            };
          } catch (error) {
            console.error(`Error fetching stats for service ${service.id}:`, error);
            return {
              id: service.id,
              name: service.name,
              totalPosts: 0,
              publishedPosts: 0,
              draftPosts: 0,
              views: 0
            };
          }
        })
      );

      setServiceStats(servicesWithStats);
    } catch (error) {
      console.error('Error fetching service stats:', error);
    }
  };

  const fetchRecentContent = async () => {
    try {
      // Fetch 5 most recent posts
      const { data } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          published_at,
          scheduled_for,
          category,
          service_type,
          authors:profiles(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        const posts: RecentPost[] = data.map(post => ({
          id: post.id,
          title: post.title,
          author: post.authors && Array.isArray(post.authors) 
            ? ((post.authors[0] as any)?.name || 'Unknown')
            : ((post.authors as any)?.name || 'Unknown'),
          status: post.status,
          date: post.published_at || post.scheduled_for || post.updated_at || post.created_at,
          category: post.category,
          service: post.service_type,
          views: 0, // We'd get this from analytics in a real app
          comments: 0 // We'd get this from analytics in a real app
        }));

        setRecentContent(posts);
      }
    } catch (error) {
      console.error('Error fetching recent content:', error);
    }
  };

  const fetchRecentComments = async () => {
    try {
      // Fetch 3 most recent comments (if we have a comments table)
      const { data } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          users:profiles(name),
          posts(title)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) {
        const comments: RecentComment[] = data.map(comment => ({
          id: comment.id,
          user: comment.users && Array.isArray(comment.users) 
            ? ((comment.users[0] as any)?.name || 'Anonymous')
            : ((comment.users as any)?.name || 'Anonymous'),
          content: comment.content,
          contentTitle: comment.posts && Array.isArray(comment.posts) 
            ? ((comment.posts[0] as any)?.title || 'Unknown Post')
            : ((comment.posts as any)?.title || 'Unknown Post'),
          postId: comment.post_id,
          date: comment.created_at
        }));

        setRecentComments(comments);
      } else {
        // If no comments table or no data, use mock data
        setRecentComments([
  { 
    id: '1', 
            user: 'John Practitioner',
            content: 'Great article! I\'ve been using these techniques in my practice for years and can confirm they are highly effective.',
            contentTitle: 'Managing Acute Respiratory Conditions in Children',
            postId: '1',
            date: new Date().toISOString()
  },
  { 
    id: '2', 
            user: 'Emily Nurse',
            content: 'Could you provide more information about the assessment tools mentioned in the third section?',
            contentTitle: 'Developmental Milestones: Assessment and Nursing Interventions',
            postId: '2',
            date: new Date(Date.now() - 86400000).toISOString() // Yesterday
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching recent comments:', error);
      
      // Use mock data on error
      setRecentComments([
  {
    id: '1',
    user: 'John Practitioner',
    content: 'Great article! I\'ve been using these techniques in my practice for years and can confirm they are highly effective.',
    contentTitle: 'Managing Acute Respiratory Conditions in Children',
          postId: '1',
          date: new Date().toISOString()
  },
  {
    id: '2',
    user: 'Emily Nurse',
    content: 'Could you provide more information about the assessment tools mentioned in the third section?',
    contentTitle: 'Developmental Milestones: Assessment and Nursing Interventions',
          postId: '2',
          date: new Date(Date.now() - 86400000).toISOString() // Yesterday
        }
      ]);
    }
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let backgroundColor = '';
    let textColor = '';
    let icon = null;
    
    switch (status) {
      case 'published':
        backgroundColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = <FiCheckCircle className="h-4 w-4 mr-1" />;
        break;
      case 'draft':
        backgroundColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        icon = <FiEdit3 className="h-4 w-4 mr-1" />;
        break;
      case 'review':
        backgroundColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        icon = <FiAlertCircle className="h-4 w-4 mr-1" />;
        break;
      case 'scheduled':
        backgroundColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        icon = <FiClock className="h-4 w-4 mr-1" />;
        break;
      default:
        backgroundColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${backgroundColor} ${textColor}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your admin dashboard. Here's what's happening with your content.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiBarChart2 className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            View Analytics
          </Link>
          <Link
            to="/admin/content/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFileText className="-ml-1 mr-2 h-5 w-5" />
            Create Content
          </Link>
        </div>
      </div>
      
      {/* Main stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                <FiFileText className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Content</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-medium text-gray-900">{stats.totalPosts}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-gray-500">items</span>
                    </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
              <Link to="/admin/content" className="font-medium text-blue-600 hover:text-blue-500">
                View all content
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Published</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-medium text-gray-900">{stats.publishedPosts}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-gray-500">posts</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/admin/content?status=published" className="font-medium text-blue-600 hover:text-blue-500">
                View published
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiEdit3 className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Drafts</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-medium text-gray-900">{stats.draftPosts}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-gray-500">in progress</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/admin/content?status=draft" className="font-medium text-blue-600 hover:text-blue-500">
                View drafts
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
                <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiUsers className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="flex items-baseline">
                    <div className="text-lg font-medium text-gray-900">{stats.totalUsers}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-gray-500">accounts</span>
                </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/admin/users" className="font-medium text-blue-600 hover:text-blue-500">
                View all users
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Services Overview */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Service Overview</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Content statistics by service</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drafts
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceStats.map((service) => (
                <tr key={service.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{service.publishedPosts}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{service.draftPosts}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{service.totalPosts}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/services/${service.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View Content
                    </Link>
                    <Link
                      to={`/admin/services/${service.id}/new`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Add New
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Content</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest articles and resources</p>
            </div>
            <Link
              to="/admin/content"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {recentContent.map((content) => (
                <li key={content.id}>
                  <Link to={`/admin/content/${content.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <p className="text-sm font-medium text-blue-600 truncate">{content.title}</p>
                          <div className="flex mt-1">
                            <p className="text-xs text-gray-500">{content.category}</p>
                            <p className="text-xs text-gray-500 ml-4">By {content.author}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <StatusBadge status={content.status} />
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          {content.status === 'published' && content.views !== undefined && (
                            <div className="flex items-center text-sm text-gray-500 mr-6">
                              <FiEye className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{content.views.toLocaleString()} views</span>
                            </div>
                          )}
                          {content.status === 'published' && content.comments !== undefined && (
                            <div className="flex items-center text-sm text-gray-500">
                              <FiMessageSquare className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{content.comments} comments</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {content.status === 'scheduled' ? 'Scheduled for' : 'Last updated'}{' '}
                            {formatDate(content.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}

              {recentContent.length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center">
                  <p className="text-sm text-gray-500">No content found</p>
                  <Link
                    to="/admin/content/new"
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    <FiPlusCircle className="mr-1 h-4 w-4" />
                    Create your first content
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Recent Comments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Comments</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest feedback from your readers</p>
            </div>
            <Link
              to="/admin/comments"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {recentComments.map((comment) => (
                <li key={comment.id} className="px-4 py-4 sm:px-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {comment.user.charAt(0)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {comment.user}
                      </p>
                      <p className="text-sm text-gray-500">
                        On <span className="text-blue-600">{comment.contentTitle}</span>
                      </p>
                      <div className="mt-2 text-sm text-gray-700">
                        <p>{comment.content}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {formatDate(comment.date)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 self-center flex">
                      <button
                        type="button"
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Reply to comment"
                        aria-label="Reply to comment"
                      >
                        <FiMessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}

              {recentComments.length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center">
                  <p className="text-sm text-gray-500">No comments yet</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 