// Mock unit data
export const mockUnits = [
  {
    id: '1',
    name: 'Kilogram',
    abbreviation: 'kg',
    type: 'WEIGHT',
    isBaseUnit: true,
    conversionFactor: 1,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Gram',
    abbreviation: 'gr',
    type: 'WEIGHT',
    isBaseUnit: false,
    baseUnitId: '1',
    conversionFactor: 0.001, // 1 gram = 0.001 kg
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Litre',
    abbreviation: 'lt',
    type: 'VOLUME',
    isBaseUnit: true,
    conversionFactor: 1,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Mililitre',
    abbreviation: 'ml',
    type: 'VOLUME',
    isBaseUnit: false,
    baseUnitId: '3',
    conversionFactor: 0.001, // 1 ml = 0.001 lt
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Adet',
    abbreviation: 'adet',
    type: 'PIECE',
    isBaseUnit: true,
    conversionFactor: 1,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'Paket',
    abbreviation: 'paket',
    type: 'PIECE',
    isBaseUnit: false,
    baseUnitId: '5',
    conversionFactor: 1, // Will be defined per material
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '7',
    name: 'Ton',
    abbreviation: 'ton',
    type: 'WEIGHT',
    isBaseUnit: false,
    baseUnitId: '1',
    conversionFactor: 1000, // 1 ton = 1000 kg
    createdAt: new Date('2024-01-01'),
  },
];