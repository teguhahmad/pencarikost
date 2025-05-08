import React from 'react';
import { Tenant, Room } from '../../types';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatters';
import { Plus, Search, Edit, Trash, Loader2 } from 'lucide-react';

interface TenantsListProps {
  tenants: Tenant[];
  rooms: Room[];
  onAddTenant: () => void;
  onEditTenant: (id: string) => void;
  onDeleteTenant: (id: string) => void;
  isLoading?: boolean;
}

const TenantsList: React.FC<TenantsListProps> = ({
  tenants,
  rooms,
  onAddTenant,
  onEditTenant,
  onDeleteTenant,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.phone.includes(searchQuery)
  );

  const getRoomName = (roomId: string | null): string => {
    if (!roomId) return '-';
    const room = rooms.find(r => r.id === roomId);
    return room ? `Kamar ${room.name}` : '-';
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Daftar Penyewa</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari penyewa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <Button 
            icon={<Plus size={16} />} 
            onClick={onAddTenant}
            disabled={isLoading}
          >
            Tambah Penyewa
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kamar
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Periode Sewa
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pembayaran
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && tenants.length > 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-2" />
                    <span className="text-gray-500">Memperbarui data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredTenants.length > 0 ? (
              filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{tenant.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{tenant.phone}</div>
                    <div className="text-gray-500 text-sm">{tenant.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {getRoomName(tenant.room_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{formatDate(tenant.start_date)}</div>
                    <div className="text-gray-500 text-sm">sampai {formatDate(tenant.end_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {tenant.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      className={
                        tenant.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : tenant.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {tenant.payment_status === 'paid' ? 'Lunas' :
                       tenant.payment_status === 'pending' ? 'Menunggu' : 'Terlambat'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      icon={<Edit size={14} />}
                      onClick={() => onEditTenant(tenant.id)}
                      disabled={isLoading}
                    >
                      Ubah
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash size={14} />}
                      onClick={() => onDeleteTenant(tenant.id)}
                      disabled={isLoading}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery
                    ? 'Tidak ada penyewa yang sesuai dengan pencarian Anda.'
                    : 'Belum ada penyewa yang ditambahkan.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default TenantsList;