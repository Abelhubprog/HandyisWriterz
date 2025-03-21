import React, { useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiFileText, FiEye, FiShare2, FiHeart, FiMessageSquare } from 'react-icons/fi';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }[];
}

const Analytics: React.FC = () => {
  // In a real app, these would be fetched from an API
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Mock data for demonstrations
  const trafficData: Record<string, ChartData> = {
    day: {
      labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
      datasets: [
        {
          label: 'Visits',
          data: [120, 90, 70, 240, 350, 460, 380, 290],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        }
      ]
    },
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Visits',
          data: [1200, 1900, 1700, 2400, 2500, 1800, 1200],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        }
      ]
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Visits',
          data: [8500, 11000, 9500, 12300],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        }
      ]
    },
    year: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Visits',
          data: [25000, 27000, 30000, 35000, 42000, 46000, 48000, 45000, 43000, 47000, 50000, 52000],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        }
      ]
    }
  };
  
  const engagementData: Record<string, ChartData> = {
    day: {
      labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
      datasets: [
        {
          label: 'Likes',
          data: [10, 5, 7, 24, 35, 46, 38, 29],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
        {
          label: 'Comments',
          data: [5, 3, 2, 12, 18, 22, 19, 15],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
        {
          label: 'Shares',
          data: [2, 1, 0, 5, 8, 10, 7, 6],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        }
      ]
    },
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Likes',
          data: [120, 190, 170, 240, 250, 180, 120],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
        {
          label: 'Comments',
          data: [60, 95, 85, 120, 125, 90, 60],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
        {
          label: 'Shares',
          data: [20, 30, 25, 40, 45, 30, 20],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        }
      ]
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Likes',
          data: [850, 1100, 950, 1230],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
        {
          label: 'Comments',
          data: [425, 550, 475, 615],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
        {
          label: 'Shares',
          data: [170, 220, 190, 245],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        }
      ]
    },
    year: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Likes',
          data: [2500, 2700, 3000, 3500, 4200, 4600, 4800, 4500, 4300, 4700, 5000, 5200],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
        {
          label: 'Comments',
          data: [1250, 1350, 1500, 1750, 2100, 2300, 2400, 2250, 2150, 2350, 2500, 2600],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
        {
          label: 'Shares',
          data: [500, 540, 600, 700, 840, 920, 960, 900, 860, 940, 1000, 1040],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        }
      ]
    }
  };
  
  const topContentData = [
    { id: '1', title: 'Managing Acute Respiratory Conditions in Children', views: 12400, engagement: 520, change: 12 },
    { id: '2', title: 'Developmental Milestones: Assessment and Nursing Interventions', views: 8700, engagement: 350, change: -3 },
    { id: '3', title: 'Addressing Nutritional Needs in Growing Children', views: 6200, engagement: 280, change: 5 },
    { id: '4', title: 'Ethical Considerations in Pediatric Nursing Care', views: 5800, engagement: 210, change: 8 },
    { id: '5', title: 'Pain Assessment and Management in Pediatric Patients', views: 4500, engagement: 180, change: -2 },
  ];
  
  const currentData = {
    traffic: trafficData[timeframe],
    engagement: engagementData[timeframe]
  };
  
  // Stat cards data
  const stats = [
    { title: 'Total Views', value: '112.5K', change: 8, icon: <FiEye className="h-6 w-6 text-purple-500" /> },
    { title: 'Total Users', value: '2,815', change: 12, icon: <FiUsers className="h-6 w-6 text-blue-500" /> },
    { title: 'Content Pieces', value: '124', change: 5, icon: <FiFileText className="h-6 w-6 text-green-500" /> },
    { title: 'Engagement Rate', value: '24.8%', change: -2, icon: <FiHeart className="h-6 w-6 text-red-500" /> },
  ];
  
  // In a real implementation, we would render actual chart components
  // For this placeholder, we'll render mock chart representations
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            View metrics and statistics for your content
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="inline-flex shadow-sm rounded-md">
            {(['day', 'week', 'month', 'year'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  timeframe === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${
                  value === 'day' ? 'rounded-l-md' : ''
                } ${
                  value === 'year' ? 'rounded-r-md' : ''
                } border ${value !== 'day' ? 'border-l-0' : ''} border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                onClick={() => setTimeframe(value)}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {stat.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <div className="flex items-center">
                  {stat.change >= 0 ? (
                    <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Traffic graph */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Traffic Overview</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Views and visitor statistics over time</p>
        </div>
        <div className="p-6">
          {/* This would be a real chart component in a real implementation */}
          <div className="h-72 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Line chart showing traffic data</p>
              <div className="flex justify-center items-center space-x-2">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Visits: {currentData.traffic.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Engagement graph */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Engagement Metrics</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Likes, comments, and shares over time</p>
        </div>
        <div className="p-6">
          {/* This would be a real chart component in a real implementation */}
          <div className="h-72 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Line chart showing engagement data</p>
              <div className="flex justify-center items-center space-x-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Likes: {currentData.engagement.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Comments: {currentData.engagement.datasets[1].data.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-1"></div>
                  <span className="text-xs text-gray-600">Shares: {currentData.engagement.datasets[2].data.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top content table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Top Performing Content</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Most viewed and engaged with content</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topContentData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiEye className="h-4 w-4 text-gray-400 mr-1" />
                      {item.views.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <FiHeart className="h-4 w-4 text-red-400" />
                        <FiMessageSquare className="h-4 w-4 text-green-400" />
                        <FiShare2 className="h-4 w-4 text-purple-400" />
                        <span>{item.engagement}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      {item.change >= 0 ? (
                        <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(item.change)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 