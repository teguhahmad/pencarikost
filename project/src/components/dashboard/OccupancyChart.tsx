import React from 'react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import { OccupancySummary } from '../../types';

interface OccupancyChartProps {
  data: OccupancySummary;
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ data }) => {
  const { occupied, vacant, maintenance, total } = data;
  
  // Calculate percentages
  const occupiedPercentage = Math.round((occupied / total) * 100);
  const vacantPercentage = Math.round((vacant / total) * 100);
  const maintenancePercentage = Math.round((maintenance / total) * 100);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-800">Status Hunian</h2>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center py-4">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              {/* Circular background */}
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
              
              {/* Occupied rooms - Blue */}
              <circle 
                cx="18" 
                cy="18" 
                r="15.9" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3.8" 
                strokeDasharray={`${occupiedPercentage} ${100 - occupiedPercentage}`}
                strokeDashoffset="25"
                className="transition-all duration-1000 ease-out"
              />
              
              {/* Vacant rooms - Green */}
              <circle 
                cx="18" 
                cy="18" 
                r="15.9" 
                fill="none" 
                stroke="#22c55e" 
                strokeWidth="3.8" 
                strokeDasharray={`${vacantPercentage} ${100 - vacantPercentage}`}
                strokeDashoffset={`${25 - occupiedPercentage}`}
                className="transition-all duration-1000 ease-out"
              />
              
              {/* Maintenance rooms - Yellow */}
              <circle 
                cx="18" 
                cy="18" 
                r="15.9" 
                fill="none" 
                stroke="#eab308" 
                strokeWidth="3.8" 
                strokeDasharray={`${maintenancePercentage} ${100 - maintenancePercentage}`}
                strokeDashoffset={`${25 - occupiedPercentage - vacantPercentage}`}
                className="transition-all duration-1000 ease-out"
              />
              
              {/* Center text */}
              <text x="18" y="17" textAnchor="middle" fontSize="3.5" className="fill-gray-700 font-bold">
                {data.occupancyRate}%
              </text>
              <text x="18" y="21" textAnchor="middle" fontSize="1.5" className="fill-gray-500">
                Hunian
              </text>
            </svg>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Terisi</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">{occupied}</span>
              <span className="text-sm text-gray-500 ml-1">({occupiedPercentage}%)</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Kosong</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">{vacant}</span>
              <span className="text-sm text-gray-500 ml-1">({vacantPercentage}%)</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm text-gray-600">Perbaikan</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">{maintenance}</span>
              <span className="text-sm text-gray-500 ml-1">({maintenancePercentage}%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OccupancyChart;