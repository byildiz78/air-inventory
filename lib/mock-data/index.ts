// Export all mock data from organized files
export * from './users';
export * from './inventory';
export * from './warehouse';
export * from './recipes';
export * from './sales';
export * from './financial';
export * from './stock';

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