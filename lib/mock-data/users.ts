import type { User } from '../types/user';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@restaurant.com',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'manager@restaurant.com',
    name: 'Restaurant Manager',
    role: 'MANAGER',
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    email: 'staff@restaurant.com',
    name: 'Kitchen Staff',
    role: 'STAFF',
    createdAt: new Date('2024-01-03'),
  },
];