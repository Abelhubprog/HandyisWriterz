import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface StatCardProps {
  /**
   * The title of the stat card
   */
  title: string;
  
  /**
   * The main value to display
   */
  value: string | number;
  
  /**
   * Icon to display in the top right
   */
  icon: ReactNode;
  
  /**
   * Background color for the icon container
   */
  iconBgColor?: string;
  
  /**
   * Text color for the icon
   */
  iconColor?: string;
  
  /**
   * Optional change percentage to display (e.g., "+8.5%")
   */
  changeText?: string;
  
  /**
   * Color for the change text (e.g., "text-green-600" for positive, "text-red-600" for negative)
   */
  changeColor?: string;
  
  /**
   * Optional link to navigate to when clicking "View more"
   */
  linkTo?: string;
  
  /**
   * Optional link text
   */
  linkText?: string;
}

/**
 * StatCard Component
 * 
 * A reusable card for displaying statistics in the admin dashboard
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  changeText,
  changeColor = 'text-green-600',
  linkTo,
  linkText = 'View more'
}) => {
  // Format the value if it's a number
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500">{title}</div>
        <div className={`h-10 w-10 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
      
      <div className="text-3xl font-bold">{formattedValue}</div>
      
      {changeText && (
        <div className={`text-sm ${changeColor} mt-2 flex items-center gap-1`}>
          <span>{changeText}</span>
        </div>
      )}
      
      {linkTo && (
        <Link to={linkTo} className="text-sm text-blue-600 mt-2 flex items-center gap-1">
          <span>{linkText}</span>
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
};

export default StatCard; 