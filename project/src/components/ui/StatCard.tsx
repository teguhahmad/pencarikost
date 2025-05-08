import React from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, className = '' }) => {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card className={`transition-transform duration-200 hover:transform hover:scale-105 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          {icon && (
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              {icon}
            </div>
          )}
        </div>
        
        {change && (
          <div className="mt-4">
            <span className={`text-sm font-medium ${changeColors[change.type]}`}>
              {change.type === 'increase' ? '↑' : change.type === 'decrease' ? '↓' : '•'} {change.value}
            </span>
            <span className="text-sm text-gray-500 ml-1">dari bulan lalu</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;