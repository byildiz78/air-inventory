'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardList, 
  Search, 
  Filter,
  Calendar,
  User,
  Clock,
  FileText,
  Download,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// Mock activity log data
const mockActivityLogs = [
  {
    id: '1',
    userId: '1',
    userName: 'Admin User',
    action: 'create',
    entityType: 'material',
    entityId: '1',
    entityName: 'Dana Kuşbaşı',
    details: JSON.stringify({ name: 'Dana Kuşbaşı', categoryId: '1a', currentStock: 25500 }),
    ipAddress: '192.168.1.1',
    createdAt: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    userId: '1',
    userName: 'Admin User',
    action: 'update',
    entityType: 'material',
    entityId: '1',
    entityName: 'Dana Kuşbaşı',
    details: JSON.stringify({ 
      before: { currentStock: 25500, minStockLevel: 10000 },
      after: { currentStock: 25500, minStockLevel: 15000 }
    }),
    ipAddress: '192.168.1.1',
    createdAt: new Date('2024-01-15T11:45:00'),
  },
  {
    id: '3',
    userId: '2',
    userName: 'Restaurant Manager',
    action: 'create',
    entityType: 'recipe',
    entityId: '1',
    entityName: 'Kuşbaşılı Pilav',
    details: JSON.stringify({ name: 'Kuşbaşılı Pilav', servingSize: 4, totalCost: 85.5 }),
    ipAddress: '192.168.1.2',
    createdAt: new Date('2024-01-16T09:15:00'),
  },
  {
    id: '4',
    userId: '2',
    userName: 'Restaurant Manager',
    action: 'delete',
    entityType: 'recipe',
    entityId: '3',
    entityName: 'Silinmiş Reçete',
    details: null,
    ipAddress: '192.168.1.2',
    createdAt: new Date('2024-01-16T14:20:00'),
  },
  {
    id: '5',
    userId: '1',
    userName: 'Admin User',
    action: 'create',
    entityType: 'invoice',
    entityId: '1',
    entityName: 'ALF-2024-001',
    details: JSON.stringify({ invoiceNumber: 'ALF-2024-001', totalAmount: 1710 }),
    ipAddress: '192.168.1.1',
    createdAt: new Date('2024-01-17T11:30:00'),
  },
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState(mockActivityLogs);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    const matchesUser = userFilter === 'all' || log.userId === userFilter;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(log.createdAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(log.createdAt) <= toDate;
    }

    return matchesSearch && matchesAction && matchesEntity && matchesUser && matchesDate;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return { variant: 'default' as const, text: 'Ekleme', color: 'bg-green-600' };
      case 'update': return { variant: 'secondary' as const, text: 'Güncelleme', color: 'bg-blue-600' };
      case 'delete': return { variant: 'destructive' as const, text: 'Silme', color: 'bg-red-600' };
      default: return { variant: 'outline' as const, text: action, color: 'bg-gray-600' };
    }
  };

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'material': return { text: 'Malzeme', color: 'text-green-600' };
      case 'recipe': return { text: 'Reçete', color: 'text-orange-600' };
      case 'invoice': return { text: 'Fatura', color: 'text-blue-600' };
      case 'user': return { text: 'Kullanıcı', color: 'text-purple-600' };
      default: return { text: entityType, color: 'text-gray-600' };
    }
  };

  // Get unique users from logs
  const uniqueUsers = [...new Set(logs.map(log => log.userId))].map(userId => {
    const user = logs.find(log => log.userId === userId);
    return { id: userId, name: user?.userName || 'Unknown' };
  });

  // Get unique entity types from logs
  const uniqueEntityTypes = [...new Set(logs.map(log => log.entityType))];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kullanıcılar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">İşlem Logları</h1>
              <p className="text-muted-foreground">Sistemde yapılan tüm işlemlerin kayıtları</p>
            </div>
          </div>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Excel'e Aktar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İşlem ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="İşlem Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İşlemler</SelectItem>
                  <SelectItem value="create">Ekleme</SelectItem>
                  <SelectItem value="update">Güncelleme</SelectItem>
                  <SelectItem value="delete">Silme</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Veri Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Veri Tipleri</SelectItem>
                  {uniqueEntityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {getEntityBadge(type).text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Başlangıç Tarihi"
              />

              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Bitiş Tarihi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle>İşlem Geçmişi</CardTitle>
            <CardDescription>
              {filteredLogs.length} işlem gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">İşlem bulunamadı</h3>
                  <p className="text-muted-foreground">
                    Seçilen filtrelere uygun işlem kaydı bulunamadı.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const entityBadge = getEntityBadge(log.entityType);
                  
                  return (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${actionBadge.color}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{log.entityName}</h4>
                            <Badge variant={actionBadge.variant}>
                              {actionBadge.text}
                            </Badge>
                            <Badge variant="outline" className={entityBadge.color}>
                              {entityBadge.text}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <User className="w-3 h-3 inline-block mr-1" />
                            {log.userName}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.createdAt).toLocaleTimeString('tr-TR')}
                            </span>
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Button variant="outline" size="sm">
                          Detay
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}