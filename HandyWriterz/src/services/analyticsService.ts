import { supabase } from '../lib/supabaseClient';

export type TimeFrame = 'day' | 'week' | 'month' | 'year';

export interface MetricData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

export interface ContentPerformance {
  id: string;
  title: string;
  views: number;
  engagement: number;
  change: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalUsers: number;
  contentCount: number;
  engagementRate: number;
  changes: {
    views: number;
    users: number;
    content: number;
    engagement: number;
  };
}

export const analyticsService = {
  /**
   * Get summary metrics for the dashboard
   */
  async getSummaryMetrics(): Promise<AnalyticsSummary> {
    // Get total views
    const { data: viewsData, error: viewsError } = await supabase
      .from('post_views')
      .select('count', { count: 'exact' });
    
    if (viewsError) {
      console.error('Error fetching view count:', viewsError);
      throw viewsError;
    }
    
    // Get total users
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' });
    
    if (userError) {
      console.error('Error fetching user count:', userError);
      throw userError;
    }
    
    // Get content count
    const { data: contentData, error: contentError } = await supabase
      .from('posts')
      .select('count', { count: 'exact' });
    
    if (contentError) {
      console.error('Error fetching content count:', contentError);
      throw contentError;
    }
    
    // Get engagement stats (likes, comments, shares)
    const { data: likesData, error: likesError } = await supabase
      .from('post_likes')
      .select('count', { count: 'exact' });
    
    if (likesError) {
      console.error('Error fetching likes count:', likesError);
      throw likesError;
    }
    
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('count', { count: 'exact' });
    
    if (commentsError) {
      console.error('Error fetching comments count:', commentsError);
      throw commentsError;
    }
    
    const { data: sharesData, error: sharesError } = await supabase
      .from('post_shares')
      .select('count', { count: 'exact' });
    
    if (sharesError) {
      console.error('Error fetching shares count:', sharesError);
      throw sharesError;
    }
    
    // Calculate engagement rate (likes + comments + shares) / views * 100
    const totalEngagements = (likesData.count || 0) + (commentsData.count || 0) + (sharesData.count || 0);
    const engagementRate = viewsData.count ? (totalEngagements / viewsData.count) * 100 : 0;
    
    // Get previous period metrics for change calculation
    // This would typically compare to previous month/week/etc.
    // For simplicity, we're using mock change percentages here
    
    return {
      totalViews: viewsData.count || 0,
      totalUsers: userData.count || 0,
      contentCount: contentData.count || 0,
      engagementRate: parseFloat(engagementRate.toFixed(1)),
      changes: {
        views: 8, // Mock data, would be calculated from previous period
        users: 12,
        content: 5,
        engagement: -2
      }
    };
  },
  
  /**
   * Get traffic data for the specified timeframe
   */
  async getTrafficData(timeframe: TimeFrame): Promise<MetricData> {
    // Get date range based on timeframe
    const { startDate, endDate, interval, format } = this.getTimeframeParams(timeframe);
    
    // Execute a database function that aggregates views by timeframe
    // This is a simplified example - in a real app, you would use more sophisticated SQL
    const { data, error } = await supabase.rpc('get_traffic_data', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      interval_type: interval
    });
    
    if (error) {
      console.error('Error fetching traffic data:', error);
      throw error;
    }
    
    // Format the data for charts
    // The data would be an array of objects with date and count properties
    
    // For simplicity, we'll use mock data structured for our timeframe
    // In a real implementation, you would transform the database results
    
    // Create labels based on timeframe
    const labels = this.generateLabels(timeframe);
    
    // Use the real data or fallback to mock data for demo
    const visits = data?.map((d: any) => d.count) || this.getMockDataForTimeframe(timeframe);
    
    return {
      labels,
      datasets: [
        {
          label: 'Visits',
          data: visits,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        }
      ]
    };
  },
  
  /**
   * Get engagement data (likes, comments, shares) for the specified timeframe
   */
  async getEngagementData(timeframe: TimeFrame): Promise<MetricData> {
    // Get date range based on timeframe
    const { startDate, endDate, interval } = this.getTimeframeParams(timeframe);
    
    // In a real app, you would query the database for likes, comments, and shares
    // For simplicity, we'll use mock data
    
    // Create labels based on timeframe
    const labels = this.generateLabels(timeframe);
    
    return {
      labels,
      datasets: [
        {
          label: 'Likes',
          data: this.getMockDataForTimeframe(timeframe, 'likes'),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)'
        },
        {
          label: 'Comments',
          data: this.getMockDataForTimeframe(timeframe, 'comments'),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
          label: 'Shares',
          data: this.getMockDataForTimeframe(timeframe, 'shares'),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)'
        }
      ]
    };
  },
  
  /**
   * Get top performing content
   */
  async getTopContent(): Promise<ContentPerformance[]> {
    // In a real app, you would query the database for top content by views
    
    // Execute a database function that calculates top content
    const { data, error } = await supabase.rpc('get_top_content', {
      limit_num: 5
    });
    
    if (error) {
      console.error('Error fetching top content:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      // Transform data to match our interface
      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        views: item.views_count,
        engagement: item.engagement_count,
        change: item.change_percent
      }));
    }
    
    // Fallback to mock data if no results
    return [
      { id: '1', title: 'Managing Acute Respiratory Conditions in Children', views: 12400, engagement: 520, change: 12 },
      { id: '2', title: 'Developmental Milestones: Assessment and Nursing Interventions', views: 8700, engagement: 350, change: -3 },
      { id: '3', title: 'Addressing Nutritional Needs in Growing Children', views: 6200, engagement: 280, change: 5 },
      { id: '4', title: 'Ethical Considerations in Pediatric Nursing Care', views: 5800, engagement: 210, change: 8 },
      { id: '5', title: 'Pain Assessment and Management in Pediatric Patients', views: 4500, engagement: 180, change: -2 }
    ];
  },
  
  /**
   * Get content breakdown by category
   */
  async getCategoryBreakdown() {
    const { data, error } = await supabase.rpc('get_category_breakdown');
    
    if (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      return data;
    }
    
    // Fallback to mock data
    return [
      { category: 'Clinical Practice', percentage: 45 },
      { category: 'Family-Centered Care', percentage: 28 },
      { category: 'Research', percentage: 15 },
      { category: 'Developmental Care', percentage: 8 },
      { category: 'Advocacy', percentage: 4 }
    ];
  },
  
  /**
   * Get recent user activity for the activity feed
   */
  async getRecentActivity(limit = 5) {
    // In a real app, you would query various activity tables
    // and combine the results in chronological order
    
    // Mock data for demonstration
    return [
      { 
        id: '1', 
        type: 'post_created', 
        user: { id: '1', name: 'Emma Rodriguez', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
        content: 'Managing Acute Respiratory Conditions in Children',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      { 
        id: '2', 
        type: 'user_joined', 
        user: { id: '2', name: 'David Thompson', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      { 
        id: '3', 
        type: 'post_updated', 
        user: { id: '3', name: 'Sarah Johnson', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
        content: 'Developmental Milestones: Assessment and Nursing Interventions',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      { 
        id: '4', 
        type: 'analytics_report', 
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
      }
    ];
  },
  
  // Helper methods for generating data
  
  /**
   * Get timeframe parameters for queries
   */
  getTimeframeParams(timeframe: TimeFrame) {
    const endDate = new Date();
    let startDate = new Date();
    let interval: string;
    let format: string;
    
    switch (timeframe) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        interval = 'hour';
        format = 'ha'; // 1pm, 2pm, etc.
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        interval = 'day';
        format = 'ddd'; // Mon, Tue, etc.
        break;
      case 'month':
        startDate.setDate(1); // First day of current month
        interval = 'day';
        format = 'Do'; // 1st, 2nd, etc.
        break;
      case 'year':
        startDate.setMonth(0, 1); // January 1st of current year
        interval = 'month';
        format = 'MMM'; // Jan, Feb, etc.
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
        interval = 'day';
        format = 'Do';
    }
    
    return { startDate, endDate, interval, format };
  },
  
  /**
   * Generate labels for the specified timeframe
   */
  generateLabels(timeframe: TimeFrame): string[] {
    switch (timeframe) {
      case 'day':
        return ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'];
      case 'week':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'month':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'year':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      default:
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    }
  },
  
  /**
   * Get mock data for a specific timeframe and dataset
   */
  getMockDataForTimeframe(timeframe: TimeFrame, datasetType = 'visits'): number[] {
    // Scale factors for different dataset types
    const scaleFactor = {
      visits: 1,
      likes: 0.1,
      comments: 0.05,
      shares: 0.02
    };
    
    const scale = scaleFactor[datasetType as keyof typeof scaleFactor];
    
    switch (timeframe) {
      case 'day':
        return [120, 90, 70, 240, 350, 460, 380, 290].map(v => Math.round(v * scale));
      case 'week':
        return [1200, 1900, 1700, 2400, 2500, 1800, 1200].map(v => Math.round(v * scale));
      case 'month':
        return [8500, 11000, 9500, 12300].map(v => Math.round(v * scale));
      case 'year':
        return [
          25000, 27000, 30000, 35000, 42000, 46000, 48000, 45000, 43000, 47000, 50000, 52000
        ].map(v => Math.round(v * scale));
      default:
        return [8500, 11000, 9500, 12300].map(v => Math.round(v * scale));
    }
  }
}; 