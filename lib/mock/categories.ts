// Mock category data
export const mockCategories = [
  {
    id: '1',
    name: 'Et ve Et Ürünleri',
    description: 'Kırmızı et, beyaz et ve işlenmiş et ürünleri',
    color: '#EF4444',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '1a',
    name: 'Kırmızı Et',
    description: 'Dana, kuzu, koyun eti',
    color: '#DC2626',
    parentId: '1',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '1b',
    name: 'Beyaz Et',
    description: 'Tavuk, hindi, balık',
    color: '#F87171',
    parentId: '1',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Sebze ve Meyve',
    description: 'Taze sebzeler ve meyveler',
    color: '#22C55E',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2a',
    name: 'Yapraklı Sebzeler',
    description: 'Marul, ıspanak, roka vb.',
    color: '#16A34A',
    parentId: '2',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2b',
    name: 'Kök Sebzeler',
    description: 'Havuç, patates, soğan vb.',
    color: '#15803D',
    parentId: '2',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Süt Ürünleri',
    description: 'Süt, peynir, yoğurt ve diğer süt ürünleri',
    color: '#3B82F6',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Tahıllar ve Baklagiller',
    description: 'Pirinç, bulgur, mercimek, nohut vb.',
    color: '#F59E0B',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Baharatlar ve Soslar',
    description: 'Baharat, sos ve çeşni malzemeleri',
    color: '#8B5CF6',
    createdAt: new Date('2024-01-01'),
  },
];