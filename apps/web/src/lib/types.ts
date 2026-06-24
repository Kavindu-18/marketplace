export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type ProviderStatusType = 'REGISTERED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
export type ServiceStatusType = 'DRAFT' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED';
export type DocumentStatusType = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DocumentType = 'BUSINESS_REG' | 'NIC' | 'OTHER';
export type Vertical = 'CONSULTATION' | 'VEHICLE_SERVICE';

export interface Category {
  id: string;
  name: string;
  slug: string;
  vertical: Vertical;
  parentId: string | null;
  children?: Category[];
}

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  fileUrl: string;
  status: DocumentStatusType;
  createdAt: string;
}

export interface ProviderProfile {
  id: string;
  businessName: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  addressLine: string;
  city: string;
  district: string;
  status: ProviderStatusType;
  documents: VerificationDocument[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  priceInfo: string;
  status: ServiceStatusType;
  category: { id: string; name: string };
  providerProfile?: { businessName: string; city: string };
  createdAt: string;
}

export interface SearchServiceResult {
  id: string;
  title: string;
  description: string;
  priceInfo: string;
  distance_m: number;
  distance_km: number;
  providerProfile: {
    businessName: string;
    city: string;
    district: string;
  };
  category: { id: string; name: string };
}

export interface SearchResponse {
  data: SearchServiceResult[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminPendingProvider {
  id: string;
  businessName: string;
  city: string;
  district: string;
  status: ProviderStatusType;
  documents: VerificationDocument[];
  user: { id: string; email: string };
}

export interface AdminPendingService {
  id: string;
  title: string;
  description: string;
  priceInfo: string;
  status: ServiceStatusType;
  category: { id: string; name: string };
  providerProfile: { id: string; businessName: string };
  createdAt: string;
}
