export interface Establishment {
  id: number;
  name: string;
  horario_funcionamento: string;
  description: string;
  owner_id: number;
  image: string;
  primary_color: string;
  secondary_color: string;
  lat?: number;
  long?: number;
  location_string?: string;
  max_distance_delivery?: number;
  establishment_type_id?: number;
  establishment_type?: EstablishmentType;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  google_business_url?: string;
  open_data?: string;
}

export interface EstablishmentType {
  id: number;
  name: string;
  description?: string;
  requires_delivery: boolean;
  requires_location: boolean;
  requires_menu: boolean;
  requires_hours: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  establishment_id?: number;
}

export interface DeliveryMan {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface CreateEstablishmentInput {
  name: string;
  horario_funcionamento: string;
  description: string;
  owner_id: number;
  image: string;
  primary_color: string;
  secondary_color: string;
  lat?: number;
  long?: number;
  location_string?: string;
  max_distance_delivery?: number;
  establishment_type_id?: number;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  google_business_url?: string;
  open_data?: string;
}

export interface CreateEstablishmentTypeInput {
  name: string;
  description?: string;
  requires_delivery: boolean;
  requires_location: boolean;
  requires_menu: boolean;
  requires_hours: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  establishment_id?: number;
}

export interface CreateDeliveryManInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

// Service Provider Types
export interface ServiceProviderCategory {
  id: number;
  name: string;
  description?: string;
}

export interface ServiceProvider {
  id: number;
  name: string;
  email: string;
  phone: string;
  category_id: number;
  category?: ServiceProviderCategory;
  document: string; // CPF/CNPJ
  address: string;
  city: string;
  state: string;
  zip_code: string;
  available: boolean;
  rating?: number;
}

export interface ServiceCatalogItem {
  id: number;
  provider_id: number;
  name: string;
  description: string;
  price: number;
  estimated_duration: number; // in minutes
  active: boolean;
  image?: string;
  stock?: number;
}

export interface ServiceProviderOrder {
  id: number;
  provider_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  catalog_item_id: number;
  catalog_item?: ServiceCatalogItem;
  scheduled_date: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface CreateServiceProviderInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  category_id: number;
  document: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  available: boolean;
}

export interface CreateServiceCategoryInput {
  name: string;
  description?: string;
}

export interface CreateCatalogItemInput {
  provider_id: number;
  name: string;
  description: string;
  price: number;
  estimated_duration: number;
  active: boolean;
  image?: string;
  stock?: number;
}

// Establishment Orders (from MongoDB)
export interface EstablishmentOrder {
  id?: string;
  user?: {
    name?: string;
    phone?: string;
  };
  establishmentid: number;
  order_date?: string;
  status: string; // AWAIT_APPROVE, PREPARING, DELIVERY, DELIVERED, CANCELLED
  created_at?: string;
  updated_at?: string;
}

export interface UpdateOrderStatusRequest {
  id: string;
  status: string;
}

// Onboarding Lead Types
export type OnboardingLeadStatus = 'new' | 'contacted' | 'converted' | 'rejected';
export type OnboardingLeadUserType = 'provider' | 'company';

export interface OnboardingLead {
  id: number;
  user_type: OnboardingLeadUserType;
  category_id?: number;
  category?: ServiceProviderCategory;
  category_name?: string;
  establishment_type_id?: number;
  establishment_type?: EstablishmentType;
  establishment_type_name?: string;
  document: string;
  email: string;
  name?: string;
  phone: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  status: OnboardingLeadStatus;
  contacted_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateOnboardingLeadInput {
  status?: OnboardingLeadStatus;
  notes?: string;
  contacted_at?: string;
}
