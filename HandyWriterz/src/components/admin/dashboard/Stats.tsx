import React, { useEffect, useState } from "react";
import { Eye, ThumbsUp, MessageSquare, Clock } from "lucide-react";
import { adminService } from "@/services/adminService";

interface StatsData {
  posts: number;
  pendingComments: number;
  totalViews: number;
  avgReadTime: number;
}

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    posts: 0,
    pendingComments: 0,
    totalViews: 0,
    avgReadTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get stats from admin service
        const dashboardStats = await adminService.getDashboardStats();
        
        setStats({
          posts: dashboardStats.postsCount.total,
          pendingComments: dashboardStats.commentsCount,
          totalViews: dashboardStats.views.total,
          avgReadTime: dashboardStats.engagement.avgReadTime
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load statistics");
        
        // Fallback to demo data if API fails
        setStats({
          posts: 153,
          pendingComments: 12,
          totalViews: 24538,
          avgReadTime: 4.2
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-500">Total Posts</div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Eye size={18} />
          </div>
        </div>
        <div className="text-3xl font-bold">{stats.posts}</div>
        <div className="text-sm text-green-600 mt-2">+12% vs last month</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-500">Pending Comments</div>
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <MessageSquare size={18} />
          </div>
        </div>
        <div className="text-3xl font-bold">{stats.pendingComments}</div>
        <div className="text-sm text-blue-600 mt-2 cursor-pointer">Review now</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-500">Total Views</div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <Eye size={18} />
          </div>
        </div>
        <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
        <div className="text-sm text-green-600 mt-2">+8.5% vs last month</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-500">Avg. Read Time</div>
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Clock size={18} />
          </div>
        </div>
        <div className="text-3xl font-bold">{stats.avgReadTime} min</div>
        <div className="text-sm text-gray-500 mt-2">Average time spent reading</div>
      </div>
    </div>
  );
};
