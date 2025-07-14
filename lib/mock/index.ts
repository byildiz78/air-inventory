// Re-export all mock data
export * from './users';
export * from './categories';
export * from './units';
export * from './suppliers';
export * from './materials';
export * from './recipes';
export * from './taxes';
export * from './warehouses';
export * from './stock';
export * from './sales';
export * from './invoices';

// Helper functions for mock data operations
export const getMockDataById = <T extends { id: string }>(data: T[], id: string): T | undefined => {
  return data.find(item => item.id === id);
};

export const getMockDataByField = <T, K extends keyof T>(
  data: T[], 
  field: K, 
  value: T[K]
): T[] => {
  return data.filter(item => item[field] === value);
};

export const updateMockData = <T extends { id: string }>(
  data: T[], 
  id: string, 
  updates: Partial<T>
): T[] => {
  return data.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
};

export const deleteMockData = <T extends { id: string }>(data: T[], id: string): T[] => {
  return data.filter(item => item.id !== id);
};

export const addMockData = <T extends { id: string }>(data: T[], newItem: T): T[] => {
  return [...data, newItem];
};