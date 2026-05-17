export enum LeadStatus {
  NEW = "New",
  CONTACTED = "Contacted",
  QUALIFIED = "Qualified",
  LOST = "Lost",
}

export enum LeadSource {
  WEBSITE = "Website",
  INSTAGRAM = "Instagram",
  REFERRAL = "Referral",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sales";
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  newThisWeek: number;
  lostLeads: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
