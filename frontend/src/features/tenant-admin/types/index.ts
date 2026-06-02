export interface OfficeRealm {
  _id: string;
  name: string;
  city: string;
  address: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'receptionist' | 'security' | 'employee';
  phone?: string;
  office_id?: string | OfficeRealm;
  telegram_id?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorRecord {
  _id: string;
  name: string;
  phone: string;
  id_number: string;
  photo_url?: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitLog {
  _id: string;
  visitor_id: string | VisitorRecord;
  host_id: string | UserProfile;
  office_id: string | OfficeRealm;
  purpose: string;
  check_in: string;
  check_out?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'exited';
  createdAt: string;
  updatedAt: string;
}

export interface CustomMasterDataItem {
  _id: string;
  type: 'purpose' | 'department';
  name: string;
  sortOrder: number;
  is_active: boolean;
  createdAt: string;
}
