import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, Eye } from "lucide-react";
import { adminService } from '@/services/adminService';

// Define the Post type
export interface Post {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft" | "scheduled";
  service: string;
  publishedAt?: string;
  scheduledFor?: string;
  updatedAt?: string;
  views: number;
}

interface RecentPostsProps {
  posts?: Post[];
  loading?: boolean;
}

/**
 * RecentPosts Component
 * 
 * Displays a list of recent posts in the admin dashboard
 */
const RecentPosts: React.FC<RecentPostsProps> = ({ posts: propPosts, loading: propLoading }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(propLoading || true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If posts are provided via props, use those
    if (propPosts) {
      setPosts(propPosts);
      setLoading(false);
      return;
    }

    // Otherwise fetch posts
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // Get stats that includes top content
        const dashboardStats = await adminService.getDashboardStats();
        
        // Transform top content to match Post interface
        const recentPosts = dashboardStats.topContent.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.title.toLowerCase().replace(/\s+/g, '-'),
          status: "published",
          service: post.serviceType,
          publishedAt: new Date().toISOString(),  // Use current date as placeholder
          views: post.views
        }));
        
        setPosts(recentPosts);
      } catch (err) {
        console.error("Error fetching recent posts:", err);
        setError("Failed to load recent posts");
        
        // Fallback to empty array if API fails
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [propPosts, propLoading]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent Posts</h2>
          <Link to="/admin/content/posts" className="text-sm text-blue-600 hover:text-blue-800">
            View all
          </Link>
        </div>
      </div>
      
      {posts.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No posts available
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
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
                  aria-label={`Edit post: ${post.title}`}
                >
                  <Edit size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentPosts;
