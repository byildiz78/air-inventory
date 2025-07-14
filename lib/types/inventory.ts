export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  baseUnit: string | null;
  conversionFactor: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  unitId: string;
  currentStock: number;
  minimumStock: number;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
}