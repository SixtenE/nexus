// src/types/property.ts

export interface Price {
  amount: number;
  currency: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface MonthlyFee {
  amount: number;
  currency: string;
}

export interface Property {
  id: string;
  broker: string;
  coordinates: Coordinates;
  housingForm: number;
  isPreOwned: boolean;
  price: Price;
  isPublic: boolean;
  soldAt: string; // ISO date string
  tenure: string; // e.g., "TENANT_OWNERSHIP"
  apartmentNumber: string;
  floor: number;
  livingArea: number; // m²
  monthlyFee: MonthlyFee;
  numberOfRooms: number;
  postCode: string;
  postalArea: string;
  streetAddress: string;
  constructionSpan: string; // e.g., "2011-1975"
  cooperativeRegistrationNumber: string;
}
