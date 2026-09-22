export interface OrganizationRequest {
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  address?: string | null;
}

export interface OrganizationResponse {
  organizationId: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  address?: string | null;
  isActive: boolean;
  dateCreated: string;
}

export type OrganizationRole = 0 | 1 | 2 | 3 | 4;

export interface UserRequest {
  name: string;
  email: string;
  cpf?: string | null;
  role?: OrganizationRole | null;
}

export interface UserUpdateRequest {
  name: string;
  role?: OrganizationRole | null;
}

export interface UserResponse {
  userId: string;
  organizationId: string;
  name: string;
  email: string;
  cpf?: string | null;
  role: OrganizationRole;
  isActive: boolean;
  dateCreated: string;
}

export interface CondominiumRequest {
  name: string;
  zipCode: string;
  buildTypeId?: number | null;
  description?: string | null;
  address?: string | null;
  number?: string | null;
  borough?: string | null;
  cnpj?: string | null;
}

export interface CondominiumResponse {
  condominiumId: string;
  organizationId: string;
  name: string;
  zipCode: string;
  buildTypeId: number;
  description: string;
  address: string;
  number: string;
  borough: string;
  cnpj: string;
}

export interface DocumentResponse {
  documentId: string;
  condominiumId: string;
  name: string;
  documentTypeId: number;
  documentType: string;
  documentStatusId: number;
  documentStatus: string;
}

export interface DocumentUpdateRequest {
  condominiumId?: string;
  name?: string;
}

export interface AuthenticateRequest {
  userId: string;
  email: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PartnerError {
  errors: Array<{ code: string; message: string }>;
}