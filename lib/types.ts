export type UserRole = 'admin' | 'student' | 'security';
export type UserStatus = 'active' | 'disabled';
export type AttendanceAction = 'check_in' | 'check_out';
export type AttendanceStatus = 'present' | 'late' | 'checked_out' | 'absent';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassItem {
  id: string;
  name: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  student_count?: number;
}

export interface Student {
  id: string;
  user_id: string;
  class_id: string | null;
  name: string;
  qr_token: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  // joined fields
  class_name?: string;
  username?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string; // YYYY-MM-DD
  check_in_at: string | null; // ISO timestamp
  check_out_at: string | null; // ISO timestamp
  check_in_by: string | null; // user id
  check_out_by: string | null; // user id
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  // joined fields
  student_name?: string;
  class_name?: string;
  student_qr?: string;
  check_in_by_name?: string;
  check_out_by_name?: string;
}

export interface AttendanceSettings {
  id: number;
  check_in_start: string; // "06:00:00"
  late_threshold: string; // "07:15:00"
  check_in_end: string;   // "08:00:00"
  check_out_start: string; // "15:00:00"
  check_out_end: string;   // "17:30:00"
  timezone: string;       // "Asia/Jakarta"
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  user_name?: string;
}

export interface ScanRequest {
  token: string;
  action: AttendanceAction;
}

export interface ScanResponseSuccess {
  success: true;
  name: string;
  class: string;
  action: AttendanceAction;
  time: string; // "06:52:31 WIB"
  status: AttendanceStatus;
  message?: string;
}

export interface ScanResponseError {
  success: false;
  code:
    | 'INVALID_QR'
    | 'STUDENT_DISABLED'
    | 'ALREADY_CHECKED_IN'
    | 'NOT_CHECKED_IN'
    | 'ALREADY_CHECKED_OUT'
    | 'OUT_OF_SCHEDULE'
    | 'UNAUTHORIZED'
    | 'SERVER_ERROR';
  message: string;
  details?: {
    name?: string;
    class?: string;
    time?: string;
  };
}

export type ScanResponse = ScanResponseSuccess | ScanResponseError;
