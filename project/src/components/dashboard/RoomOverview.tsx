import React from 'react';
import { Room } from '../../types';
import Card, { CardHeader, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getRoomStatusColor } from '../../utils/formatters';
import { DoorClosed, ChevronRight } from 'lucide-react';

interface RoomOverviewProps {
  rooms: Room[];
  onViewAllClick: () => void;
}

const RoomOverview: React.FC<RoomOverviewProps> = ({ rooms, onViewAllClick }) => {
  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <Card className="h-full">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Ringkasan Kamar</h2>
        <span className="text-sm text-gray-500">{rooms.length} Total Kamar</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {Object.entries(roomsByFloor).map(([floor, roomsOnFloor]) => (
            <div key={floor} className="px-6 py-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Lantai {floor}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {roomsOnFloor.map((room) => (
                  <div 
                    key={room.id}
                    className="border border-gray-200 rounded-md p-2 flex flex-col items-center transition-all hover:shadow-md cursor-pointer"
                  >
                    <DoorClosed 
                      size={20} 
                      className={room.status === 'occupied' ? 'text-blue-500' : room.status === 'vacant' ? 'text-green-500' : 'text-yellow-500'} 
                    />
                    <span className="text-sm font-medium mt-1">Kamar {room.number}</span>
                    <Badge className={`mt-1 ${getRoomStatusColor(room.status)}`}>
                      {room.status === 'occupied' ? 'Terisi' : 
                       room.status === 'vacant' ? 'Kosong' : 'Perbaikan'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full flex justify-center items-center" 
          onClick={onViewAllClick}
        >
          Lihat Semua Kamar
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomOverview;