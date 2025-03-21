import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart2,
  MessageSquare,
  Image,
  Tag,
  LogOut,
  ChevronDown,
  ExternalLink,
  ShoppingCart,
  HelpCircle,
  Bell,
  Star,
  Folder,
  PanelLeftOpen,
  PanelLeftClose,
  Upload,
  Database
} from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import { adminAuth } from '@/services/adminAuth';
import AccessibleToggleButton from '@/components/ui/AccessibleToggleButton';

// Navigation item definition with nested items support
interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
  requiredRole?: 'admin' | 'editor' | 'viewer';
  children?: NavItem[];
  isExternal?: boolean;
}

export function AdminNav() {
  const { checkRole } = useAdminAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    content: true, // Default expanded
  });

  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Toggle a navigation group's expanded state
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Check if a route is active
  const isRouteActive = (path: string): boolean => {
    if (path === '/admin/dashboard' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  // Navigation items with nested structure
  const navItems: NavItem[] = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      requiredRole: 'viewer'
    },
    {
      to: '#',
      label: 'Content',
      icon: <FileText size={20} />,
      requiredRole: 'editor',
      children: [
        {
          to: '/admin/content/posts',
          label: 'Posts',
          icon: <FileText size={18} />,
          requiredRole: 'editor'
        },
        {
          to: '/admin/content/categories',
          label: 'Categories',
          icon: <Folder size={18} />,
          requiredRole: 'editor'
        },
        {
          to: '/admin/content/tags',
          label: 'Tags',
          icon: <Tag size={18} />,
          requiredRole: 'editor'
        }
      ]
    },
    {
      to: '/admin/comments',
      label: 'Comments',
      icon: <MessageSquare size={20} />,
      requiredRole: 'editor'
    },
    {
      to: '/admin/media',
      label: 'Media',
      icon: <Image size={20} />,
      requiredRole: 'editor'
    },
    {
      to: '/admin/users',
      label: 'Users',
      icon: <Users size={20} />,
      requiredRole: 'admin'
    },
    {
      to: '/admin/orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      requiredRole: 'admin'
    },
    {
      to: '/admin/analytics',
      label: 'Analytics',
      icon: <BarChart2 size={20} />,
      requiredRole: 'viewer'
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      requiredRole: 'admin'
    },
    {
      to: '/admin/upload-demo',
      label: 'Upload Demo',
      icon: <Upload size={20} />,
      requiredRole: 'editor'
    },
    {
      to: '/admin/database-demo',
      label: 'Database Demo',
      icon: <Database size={20} />,
      requiredRole: 'editor'
    },
    {
      to: '/admin/appwrite-docs',
      label: 'Appwrite Docs',
      icon: <FileText size={20} />,
      requiredRole: 'viewer'
    },
    {
      to: 'https://docs.handywriterz.com/admin',
      label: 'Documentation',
      icon: <HelpCircle size={20} />,
      isExternal: true,
      requiredRole: 'viewer'
    }
  ];

  // Render a navigation item
  const renderNavItem = (item: NavItem, isChild: boolean = false) => {
    // Skip rendering if user doesn't have required permissions
    if (item.requiredRole && !checkRole(item.requiredRole)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups[item.label.toLowerCase()];
    const isActive = isRouteActive(item.to);
    
    const baseClasses = "flex items-center transition-colors rounded-lg";
    const spacingClasses = isChild 
      ? "pl-10 pr-3 py-2 text-sm" 
      : "px-3 py-2.5";
    const colorClasses = isActive
      ? "text-blue-600 bg-blue-50 font-medium"
      : "text-gray-700 hover:bg-gray-100";
    const collapseClasses = isCollapsed && !isChild ? "justify-center px-2" : "";
    
    return (
      <div key={item.to} className={`${isChild ? '' : 'mb-1'}`}>
        {hasChildren ? (
          // Parent item with children
          <>
            <AccessibleToggleButton
              onClick={() => toggleGroup(item.label.toLowerCase())}
              className={`w-full ${baseClasses} ${spacingClasses} ${isExpanded ? 'text-blue-600 font-medium' : 'text-gray-700'} hover:bg-gray-100 justify-between group`}
              isExpanded={isExpanded}
              controlsId={`nav-group-${item.label.toLowerCase()}`}
              label={`${item.label} menu`}
            >
              <span className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </span>
              {!isCollapsed && (
                <ChevronDown 
                  size={16} 
                  className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                />
              )}
            </AccessibleToggleButton>
            
            {/* Render children if expanded and not collapsed */}
            {isExpanded && !isCollapsed && (
              <div id={`nav-group-${item.label.toLowerCase()}`} className="mt-1">
                {item.children?.map(child => renderNavItem(child, true))}
              </div>
            )}
          </>
        ) : (
          // Regular nav item (no children)
          item.isExternal ? (
            <a
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className={`${baseClasses} ${spacingClasses} ${colorClasses} ${collapseClasses} group`}
              aria-label={item.label}
            >
              <span className="mr-3">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span>{item.label}</span>
                  <ExternalLink size={14} className="ml-auto opacity-70" />
                </>
              )}
            </a>
          ) : (
            <NavLink
              to={item.to}
              className={({ isActive }) => `
                ${baseClasses} ${spacingClasses} 
                ${isActive ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-100'} 
                ${collapseClasses} group
              `}
              aria-label={item.label}
            >
              <span className={`${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
          {!isCollapsed && (
            <span className="font-semibold text-lg text-gray-900">Admin Panel</span>
          )}
          {isCollapsed && (
            <span className="font-bold text-xl text-blue-600">HW</span>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
      
      {/* Divider */}
      <div className="mx-4 mb-4 border-t border-gray-200"></div>
      
      {/* Navigation Items */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-1">
        {navItems.map(item => renderNavItem(item))}
      </nav>
      
      {/* Logout at bottom */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <button
          onClick={() => adminAuth.logout()}
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
          aria-label="Log out"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
};
