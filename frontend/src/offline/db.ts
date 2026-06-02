import Dexie, { type Table } from 'dexie';

export interface LocalVisitor {
  id?: string;             // Auto-generated string for offline UUIDs
  _id?: string;            // Server MongoDB Object ID
  name: string;
  phone: string;
  id_number: string;
  photo_url?: string;
  face_data?: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  email?: string;
  company_name?: string;
  id_type?: string;
  address?: string;
  localOnly?: number;      // 1 = created offline and not synced, 0 = synced/remote
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalVisit {
  id?: string;             // Auto-generated string for offline UUIDs
  _id?: string;            // Server MongoDB Object ID
  visitor_id: string;      // ID reference to visitor (could be local ID or server ID)
  host_id: string;         // ID reference to host employee
  office_id: string;       // ID reference to office
  purpose: string;
  notes?: string;
  reason?: string;
  check_in: string;        // Date ISO string
  check_out?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'exited';
  localOnly?: number;      // 1 = created offline, 0 = synced
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalEmployee {
  _id: string;             // Server MongoDB Object ID
  name: string;
  email: string;
  phone?: string;
  telegram_id?: string;
  department?: string;
  role: 'admin' | 'receptionist' | 'employee' | 'security' | 'manager' | 'super_admin' | 'support_admin' | 'auditor';
  office_id?: string;
}

export interface LocalOffice {
  _id: string;             // Server MongoDB Object ID
  name: string;
  city: string;
  address: string;
  is_active: boolean;
}

export interface SyncOperation {
  id?: number;             // Auto-increment primary key
  timestamp: number;
  action: 'CREATE_VISITOR' | 'CHECK_IN' | 'CHECK_OUT';
  payload: any;            // Request body payload
  attempts: number;
}

class VisitorDatabase extends Dexie {
  visitors!: Table<LocalVisitor, string>;
  visits!: Table<LocalVisit, string>;
  employees!: Table<LocalEmployee, string>;
  offices!: Table<LocalOffice, string>;
  syncOutbox!: Table<SyncOperation, number>;

  constructor() {
    super('VisitorManagementDB');
    this.version(1).stores({
      visitors: 'id, _id, phone, id_number, is_blacklisted, localOnly',
      visits: 'id, _id, visitor_id, host_id, office_id, status, check_in, localOnly',
      employees: '_id, name, email, department, role, office_id',
      offices: '_id, name, city, is_active',
      syncOutbox: '++id, timestamp, action, attempts',
    });
  }
}

export const db = new VisitorDatabase();
