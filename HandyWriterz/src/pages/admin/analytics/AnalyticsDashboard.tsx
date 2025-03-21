import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Activity, Users, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import DatabaseService from '@/services/databaseService';
import { Analytics } from '@/types/admin';
import TableSkeleton from '@/components/Skeletons/TableSkeleton';
import ErrorBoundary from '@/components/Common/ErrorBoundary';
import { useDebounce } from '@/hooks/useDebounce';

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Memoize analytics data processing
  const processedStats = useMemo(() => {
    if (!analytics) return [];
    return [
      {
        name: 'Total Users',
        stat: analytics.totalUsers,
        icon: Users,
        change: analytics.userGrowth,
        changeType: analytics.userGrowth >= 0 ? 'increase' : 'decrease',
        ariaLabel: `Total users: ${analytics.totalUsers}, Growth: ${analytics.userGrowth}%`
      },
      {
        name: 'Total Posts',
        stat: analytics.totalPosts,
        icon: FileText,
        change: analytics.postGrowth,
        changeType: analytics.postGrowth >= 0 ? 'increase' : 'decrease',
        ariaLabel: `Total posts: ${analytics.totalPosts}, Growth: ${analytics.postGrowth}%`
      },
      {
        name: 'Page Views',
        stat: analytics.pageViews,
        icon: BarChart,
        change: analytics.viewGrowth,
        changeType: analytics.viewGrowth >= 0 ? 'increase' : 'decrease',
        ariaLabel: `Page views: ${analytics.pageViews}, Growth: ${analytics.viewGrowth}%`
      },
      {
        name: 'Conversion Rate',
        stat: `${analytics.conversionRate}%`,
        icon: TrendingUp,
        change: analytics.conversionGrowth,
        changeType: analytics.conversionGrowth >= 0 ? 'increase' : 'decrease',
        ariaLabel: `Conversion rate: ${analytics.conversionRate}%, Growth: ${analytics.conversionGrowth}%`
      }
    ];
  }, [analytics]);

  // Debounce analytics loading to prevent excessive API calls
  const debouncedLoadAnalytics = useDebounce(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DatabaseService.fetchAnalytics(dateRange);
      setAnalytics(data);
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data');
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          debouncedLoadAnalytics();
        }, Math.pow(2, retryCount) * 1000);
      }
    } finally {
      setLoading(false);
    }
  }, 500);

  // Memoize the subscription callback
  const handleRealtimeUpdate = useCallback(async () => {
    debouncedLoadAnalytics();
  }, [debouncedLoadAnalytics]);

  useEffect(() => {
    debouncedLoadAnalytics();

    const channel = DatabaseService.supabase
      .channel('analytics_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analytics'
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      DatabaseService.supabase.removeChannel(channel);
    };
  }, [dateRange, handleRealtimeUpdate]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading analytics">
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              {retryCount < 3 && (
                <button
                  onClick={debouncedLoadAnalytics}
                  className="mt-2 text-red-800 underline hover:text-red-900"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
      <div className="space-y-6" role="region" aria-label="Analytics Dashboard">
        {/* Date range selector */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2" id="analytics-title">
              <Calendar className="h-5 w-5 text-gray-500" aria-hidden="true" />
              Analytics Overview
            </h2>
            <div className="flex items-center gap-2" role="group" aria-label="Date range selection">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  aria-pressed={dateRange === range}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid with improved accessibility */}
        <div 
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" 
          role="list"
          aria-label="Key metrics"
        >
          {processedStats.map((item) => (
            <div
              key={item.name}
              className="bg-white overflow-hidden shadow rounded-lg"
              role="listitem"
              aria-label={item.ariaLabel}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{item.stat}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <div className="flex items-center">
                    {item.changeType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
                    )}
                    <span
                      className={`ml-2 ${
                        item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.change}% {item.changeType === 'increase' ? 'increase' : 'decrease'}
                    </span>
                    <span className="ml-2 text-gray-500">vs last {dateRange}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed analytics */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Popular posts */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Popular Posts</h3>
              <div className="mt-6 flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {analytics.popularPosts.map((post) => (
                    <li key={post.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                          <p className="text-sm text-gray-500 truncate">{post.views} views</p>
                        </div>
                        <div className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                          {post.engagement}% engagement
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* User activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">User Activity</h3>
              <div className="mt-6 flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {analytics.userActivity.map((activity) => (
                    <li key={activity.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            className="h-8 w-8 rounded-full"
                            src={activity.user.avatar}
                            alt={activity.user.name}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.user.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{activity.action}</p>
                        </div>
                        <div>
                          <div className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic sources */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Traffic Sources</h3>
            <div className="mt-6">
              <div className="relative">
                {analytics.trafficSources.map((source, index) => (
                  <div key={source.name} className="flex items-center mb-4">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{source.name}</span>
                        <span className="ml-auto text-sm text-gray-500">{source.percentage}%</span>
                      </div>
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-indigo-600 rounded-full"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(AnalyticsDashboard);
