import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BarChart2, 
  PieChart,
  LineChart,
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Share2,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { databases, DATABASE_ID, POSTS_COLLECTION_ID, VIEWS_COLLECTION_ID, Query } from '@/lib/appwriteClient';

// Types
interface AnalyticsOverview {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  viewsChange: number;
  likesChange: number;
  commentsChange: number;
  sharesChange: number;
}

interface TopPost {
  id: string;
  title: string;
  views: number;
  service: string;
}

interface ServiceEngagement {
  service: string;
  views: number;
  percentage: number;
}

interface DailyViews {
  date: string;
  views: number;
}

// Time range selector type
type TimeRange = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

// Analytics Dashboard
const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('last30days');
  const [customDateRange, setCustomDateRange] = useState<{start: string; end: string}>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [overview, setOverview] = useState<AnalyticsOverview>({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    viewsChange: 0,
    likesChange: 0,
    commentsChange: 0,
    sharesChange: 0
  });
  
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [serviceEngagement, setServiceEngagement] = useState<ServiceEngagement[]>([]);
  const [dailyViews, setDailyViews] = useState<DailyViews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Service options - should match your services
  const SERVICE_OPTIONS = [
    { id: 'adult-health-nursing', name: 'Adult Health Nursing' },
    { id: 'child-nursing', name: 'Child Nursing' },
    { id: 'mental-health-nursing', name: 'Mental Health Nursing' },
    { id: 'crypto', name: 'Cryptocurrency' }
  ];
  
  // Get date range based on selected time range
  const getDateRange = (range: TimeRange): {start: Date; end: Date} => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    switch(range) {
      case 'today':
        return { start: today, end: now };
      case 'yesterday':
        return { start: yesterday, end: today };
      case 'last7days':
        const last7days = new Date(today);
        last7days.setDate(last7days.getDate() - 7);
        return { start: last7days, end: now };
      case 'last30days':
        const last30days = new Date(today);
        last30days.setDate(last30days.getDate() - 30);
        return { start: last30days, end: now };
      case 'thisMonth':
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: thisMonthStart, end: now };
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'custom':
        return {
          start: new Date(customDateRange.start),
          end: new Date(customDateRange.end + 'T23:59:59')
        };
      default:
        return { start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
    }
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      
      try {
        const dateRange = getDateRange(timeRange);
        
        // Convert dates to ISO strings for queries
        const startDateIso = dateRange.start.toISOString();
        const endDateIso = dateRange.end.toISOString();
        
        // For comparison, get previous period of same length
        const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
        const previousPeriodStart = new Date(dateRange.start.getTime() - periodLength);
        const previousPeriodEnd = new Date(dateRange.start.getTime() - 1);
        
        // 1. Fetch overall stats for current period
        const viewsResponse = await databases.listDocuments(
          DATABASE_ID,
          VIEWS_COLLECTION_ID,
          [
            Query.greaterThanEqual('timestamp', startDateIso),
            Query.lessThanEqual('timestamp', endDateIso)
          ]
        );
        
        // 2. Fetch previous period stats for comparison
        const previousViewsResponse = await databases.listDocuments(
          DATABASE_ID,
          VIEWS_COLLECTION_ID,
          [
            Query.greaterThanEqual('timestamp', previousPeriodStart.toISOString()),
            Query.lessThanEqual('timestamp', previousPeriodEnd.toISOString())
          ]
        );
        
        // 3. Fetch top posts by views
        const topPostsResponse = await databases.listDocuments(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          [
            Query.orderDesc('viewsCount'),
            Query.limit(10)
          ]
        );
        
        // 4. Fetch posts by service for service engagement
        const serviceStatsPromises = SERVICE_OPTIONS.map(async service => {
          const response = await databases.listDocuments(
            DATABASE_ID,
            POSTS_COLLECTION_ID,
            [
              Query.equal('service', service.id)
            ]
          );
          
          const totalViews = response.documents.reduce((sum, post) => sum + (post.viewsCount || 0), 0);
          
          return {
            service: service.name,
            views: totalViews,
            percentage: 0 // Will calculate after all services fetched
          };
        });
        
        const serviceStats = await Promise.all(serviceStatsPromises);
        
        // Calculate percentages
        const totalServiceViews = serviceStats.reduce((sum, stat) => sum + stat.views, 0);
        const serviceStatsWithPercentage = serviceStats.map(stat => ({
          ...stat,
          percentage: totalServiceViews > 0 ? (stat.views / totalServiceViews) * 100 : 0
        }));
        
        // 5. Generate daily views data for chart
        // Create a map of dates with initialized zero counts
        const datesMap = new Map<string, number>();
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          datesMap.set(dateStr, 0);
        }
        
        // Aggregate views by date
        viewsResponse.documents.forEach(view => {
          const viewDate = new Date(view.timestamp).toISOString().split('T')[0];
          if (datesMap.has(viewDate)) {
            datesMap.set(viewDate, (datesMap.get(viewDate) || 0) + (view.count || 1));
          }
        });
        
        // Convert map to array
        const dailyViewsData = Array.from(datesMap.entries()).map(([date, views]) => ({
          date,
          views
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        // Calculate period comparisons
        const currentTotalViews = viewsResponse.documents.reduce((sum, doc) => sum + (doc.count || 1), 0);
        const previousTotalViews = previousViewsResponse.documents.reduce((sum, doc) => sum + (doc.count || 1), 0);
        
        const viewsChange = previousTotalViews > 0 
          ? ((currentTotalViews - previousTotalViews) / previousTotalViews) * 100 
          : 100;
        
        // Create mock data for likes, comments, shares since we don't have actual tables
        // In a real application, you'd fetch these from your database
        const totalLikes = Math.floor(currentTotalViews * 0.15);
        const totalComments = Math.floor(currentTotalViews * 0.05);
        const totalShares = Math.floor(currentTotalViews * 0.02);
        
        const likesChange = Math.random() * 30 - 15; // Random between -15% and +15%
        const commentsChange = Math.random() * 20 - 10; // Random between -10% and +10%
        const sharesChange = Math.random() * 25 - 5; // Random between -5% and +20%
        
        // Update state with all the data
        setOverview({
          totalViews: currentTotalViews,
          totalLikes,
          totalComments,
          totalShares,
          viewsChange,
          likesChange,
          commentsChange,
          sharesChange
        });
        
        setTopPosts(topPostsResponse.documents.map(post => ({
          id: post.$id,
          title: post.title,
          views: post.viewsCount || 0,
          service: post.service
        })));
        
        setServiceEngagement(serviceStatsWithPercentage);
        setDailyViews(dailyViewsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeRange, customDateRange]);
  
  // Format percentage display
  const formatPercentage = (value: number): string => {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded >= 0 ? '+' : ''}${rounded.toFixed(1)}%`;
  };
  
  // Export data as CSV
  const exportData = () => {
    setIsExporting(true);
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add overview
    csvContent += "Overview\r\n";
    csvContent += `Metric,Value,Change\r\n`;
    csvContent += `Views,${overview.totalViews},${formatPercentage(overview.viewsChange)}\r\n`;
    csvContent += `Likes,${overview.totalLikes},${formatPercentage(overview.likesChange)}\r\n`;
    csvContent += `Comments,${overview.totalComments},${formatPercentage(overview.commentsChange)}\r\n`;
    csvContent += `Shares,${overview.totalShares},${formatPercentage(overview.sharesChange)}\r\n\r\n`;
    
    // Add top posts
    csvContent += "Top Posts\r\n";
    csvContent += `Title,Service,Views\r\n`;
    topPosts.forEach(post => {
      csvContent += `"${post.title}",${post.service},${post.views}\r\n`;
    });
    csvContent += "\r\n";
    
    // Add service engagement
    csvContent += "Service Engagement\r\n";
    csvContent += `Service,Views,Percentage\r\n`;
    serviceEngagement.forEach(service => {
      csvContent += `${service.service},${service.views},${service.percentage.toFixed(1)}%\r\n`;
    });
    csvContent += "\r\n";
    
    // Add daily views
    csvContent += "Daily Views\r\n";
    csvContent += `Date,Views\r\n`;
    dailyViews.forEach(day => {
      csvContent += `${day.date},${day.views}\r\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Download
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    setIsExporting(false);
  };
  
  // Get time range display name
  const getTimeRangeDisplayName = (range: TimeRange): string => {
    switch(range) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last7days': return 'Last 7 Days';
      case 'last30days': return 'Last 30 Days';
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'custom': return `${formatDate(new Date(customDateRange.start))} - ${formatDate(new Date(customDateRange.end))}`;
      default: return 'Last 30 Days';
    }
  };
  
  // Render the service color dot
  const renderServiceDot = (serviceName: string) => {
    const colors: Record<string, string> = {
      'Adult Health Nursing': 'bg-blue-500',
      'Child Nursing': 'bg-green-500',
      'Mental Health Nursing': 'bg-purple-500',
      'Cryptocurrency': 'bg-yellow-500'
    };
    
    return (
      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${colors[serviceName] || 'bg-gray-500'}`}></span>
    );
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time range selector */}
          <div className="relative inline-block">
            <button
              type="button"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              onClick={() => {
                const dropdown = document.getElementById('timeRangeDropdown');
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              }}
            >
              <Calendar size={16} />
              <span>{getTimeRangeDisplayName(timeRange)}</span>
              <ChevronDown size={16} />
            </button>
            
            <div id="timeRangeDropdown" className="hidden absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('today');
                    document.getElementById('timeRangeDropdown')?.classList.add('hidden');
                  }}
                  className={`w-full px-4 py-2 text-left rounded-md ${timeRange === 'today' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('yesterday');
                    document.getElementById('timeRangeDropdown')?.classList.add('hidden');
                  }}
                  className={`w-full px-4 py-2 text-left rounded-md ${timeRange === 'yesterday' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('last7days');
                    document.getElementById('timeRangeDropdown')?.classList.add('hidden');
                  }}
                  className={`w-full px-4 py-2 text-left rounded-md ${timeRange === 'last7days' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('last30days');
                    document.getElementById('timeRangeDropdown')?.classList.add('hidden');
                  }}
                  className={`w-full px-4 py-2 text-left rounded-md ${timeRange === 'last30days' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('thisMonth');
                    document.getElementById('timeRangeDropdown')?.classList.add('hidden');
                  }}
                  className={`w-full px-4 py-2 text-left rounded-md ${timeRange === 'thisMonth' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('lastMonth');
                    document.getElementById('timeRangeDropdown')?.classList.add('hidden');
                  }}
                  className={`w-full px-4 py-2 text-left rounded-md ${timeRange === 'lastMonth' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  Last Month
                </button>
                <div className="border-t border-gray-200 my-2 pt-2">
                  <p className="px-4 py-1 text-sm text-gray-500">Custom Range</p>
                  <div className="px-4 py-2 space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" htmlFor="startDate">Start Date</label>
                      <input
                        id="startDate"
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange(prev => ({...prev, start: e.target.value}))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        title="Start date for custom range"
                        aria-label="Start date for custom range"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1" htmlFor="endDate">End Date</label>
                      <input
                        id="endDate"
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange(prev => ({...prev, end: e.target.value}))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        max={new Date().toISOString().split('T')[0]}
                        title="End date for custom range"
                        aria-label="End date for custom range"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeRange('custom');
                        document.getElementById('timeRangeDropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Apply Custom Range
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Export button */}
          <button
            type="button"
            onClick={exportData}
            disabled={isExporting || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between mb-2">
                <div className="text-gray-500 text-sm">Total Views</div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                  <Eye size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{overview.totalViews.toLocaleString()}</div>
              <div className={`text-sm flex items-center ${overview.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.viewsChange >= 0 ? (
                  <ArrowUpRight size={14} className="mr-1" />
                ) : (
                  <ArrowDownRight size={14} className="mr-1" />
                )}
                <span>{formatPercentage(overview.viewsChange)}</span>
                <span className="text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between mb-2">
                <div className="text-gray-500 text-sm">Total Likes</div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
                  <ThumbsUp size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{overview.totalLikes.toLocaleString()}</div>
              <div className={`text-sm flex items-center ${overview.likesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.likesChange >= 0 ? (
                  <ArrowUpRight size={14} className="mr-1" />
                ) : (
                  <ArrowDownRight size={14} className="mr-1" />
                )}
                <span>{formatPercentage(overview.likesChange)}</span>
                <span className="text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between mb-2">
                <div className="text-gray-500 text-sm">Total Comments</div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600">
                  <MessageSquare size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{overview.totalComments.toLocaleString()}</div>
              <div className={`text-sm flex items-center ${overview.commentsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.commentsChange >= 0 ? (
                  <ArrowUpRight size={14} className="mr-1" />
                ) : (
                  <ArrowDownRight size={14} className="mr-1" />
                )}
                <span>{formatPercentage(overview.commentsChange)}</span>
                <span className="text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between mb-2">
                <div className="text-gray-500 text-sm">Total Shares</div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600">
                  <Share2 size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{overview.totalShares.toLocaleString()}</div>
              <div className={`text-sm flex items-center ${overview.sharesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.sharesChange >= 0 ? (
                  <ArrowUpRight size={14} className="mr-1" />
                ) : (
                  <ArrowDownRight size={14} className="mr-1" />
                )}
                <span>{formatPercentage(overview.sharesChange)}</span>
                <span className="text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
          </div>
          
          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Views Over Time Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-medium mb-4">Views Over Time</h2>
              
              <div className="h-80 w-full">
                {/* In a real app, use a chart library like Chart.js or Recharts here */}
                {/* For now, we'll show a mockup */}
                <div className="h-full flex items-end gap-1">
                  {dailyViews.map((day, index) => {
                    const height = (day.views / Math.max(...dailyViews.map(d => d.views), 1)) * 100;
                    return (
                      <div 
                        key={day.date} 
                        className="group relative flex-grow"
                        style={{ height: '100%' }}
                      >
                        <div 
                          className="bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-200 absolute bottom-0 w-full cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${day.date}: ${day.views} views`}
                        ></div>
                        
                        {/* Tooltip */}
                        <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.views} views
                        </div>
                        
                        {/* Only show some x-axis labels to prevent overcrowding */}
                        {(index === 0 || index === dailyViews.length - 1 || index % Math.ceil(dailyViews.length / 10) === 0) && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="h-8">
                  {/* Space for x-axis labels */}
                </div>
              </div>
            </div>
            
            {/* Service Engagement Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-medium mb-4">Service Engagement</h2>
              
              <div className="h-48 w-full mb-6">
                {/* In a real app, use a chart library to render a pie chart */}
                {/* For now, we'll show service stats in a visual way */}
                <div className="h-full flex items-center justify-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden">
                    {serviceEngagement.map((service, index, array) => {
                      // Calculate cumulativePct for the beginning rotation
                      const previousPct = array
                        .slice(0, index)
                        .reduce((sum, s) => sum + s.percentage, 0);
                      
                      return (
                        <div 
                          key={service.service}
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            clipPath: `conic-gradient(from ${previousPct * 3.6}deg, transparent ${service.percentage * 3.6}deg, transparent 0)`
                          }}
                        >
                          <div className={`absolute inset-0 ${
                            service.service === 'Adult Health Nursing' ? 'bg-blue-500' :
                            service.service === 'Child Nursing' ? 'bg-green-500' :
                            service.service === 'Mental Health Nursing' ? 'bg-purple-500' :
                            service.service === 'Cryptocurrency' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                        </div>
                      );
                    })}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white w-20 h-20 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Service Legend */}
              <div className="space-y-2">
                {serviceEngagement.map(service => (
                  <div key={service.service} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {renderServiceDot(service.service)}
                      <span className="text-sm">{service.service}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{service.views.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-1">({service.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Posts Table */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium">Top Performing Content</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topPosts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      topPosts.map((post, index) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {index < 3 && (
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs text-white font-bold ${
                                    index === 0 ? 'bg-yellow-500' : 
                                    index === 1 ? 'bg-gray-400' : 
                                    'bg-amber-700'
                                  }`}>
                                    {index + 1}
                                  </span>
                                )}
                                <div className="flex items-center">
                                  <FileText size={16} className="mr-2 text-gray-400" />
                                  {post.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              {renderServiceDot(
                                SERVICE_OPTIONS.find(s => s.id === post.service)?.name || post.service
                              )}
                              {SERVICE_OPTIONS.find(s => s.id === post.service)?.name || post.service}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Eye size={14} className="mr-1 text-gray-400" />
                              {post.views.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (post.views / (topPosts[0]?.views || 1)) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 