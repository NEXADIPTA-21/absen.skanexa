import fs from 'fs';
import path from 'path';
import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  User,
  ClassItem,
  Student,
  AttendanceRecord,
  AttendanceSettings,
  AuditLog,
  UserStatus,
  AttendanceStatus,
} from './types';
import { generateQrToken } from './qr';
import { determineAttendanceStatus, getTimeWIB, getTodayDateWIB } from './time';

const LOCAL_DB_PATH = path.join(process.cwd(), '.local-db.json');

// Default initial state for local fallback and testing
interface LocalDatabase {
  users: User[];
  classes: ClassItem[];
  students: Student[];
  attendance: AttendanceRecord[];
  settings: AttendanceSettings;
  audit_logs: AuditLog[];
}

function getInitialData(): LocalDatabase {
  const now = new Date().toISOString();
  return {
    settings: {
      id: 1,
      check_in_start: '06:00:00',
      late_threshold: '07:15:00',
      check_in_end: '08:00:00',
      check_out_start: '15:00:00',
      check_out_end: '17:30:00',
      timezone: 'Asia/Jakarta',
      created_at: now,
      updated_at: now,
    },
    users: [
      {
        id: 'u-admin-1',
        username: 'admin',
        // bcrypt hash of 'admin123'
        password_hash: '$2a$10$iI0ZlUeYp10hQG1W3h34s.eXk4912JgA1jR6hM7l.F47Y10c2Z3yS',
        role: 'admin',
        status: 'active',
        name: 'Administrator SKANEXA',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-sec-1',
        username: 'security01',
        // bcrypt hash of 'security123'
        password_hash: '$2a$10$vN4.tXyV61Q5r0uF9r4F8.U8hD55lY.d6j6J7N.m5L2L8n7P9q8q2',
        role: 'security',
        status: 'active',
        name: 'Pak Bambang (Sie Keamanan)',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-1',
        username: 'ahmad.fauzan',
        // bcrypt hash of 'student123'
        password_hash: '$2a$10$wT0vV2U7Y1v1u8p4E2K4I.XyVb76y7w8q2l0n6K4L8n7P9q8q2s1.',
        role: 'student',
        status: 'active',
        name: 'Ahmad Fauzan',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-2',
        username: 'budi.santoso',
        password_hash: '$2a$10$wT0vV2U7Y1v1u8p4E2K4I.XyVb76y7w8q2l0n6K4L8n7P9q8q2s1.',
        role: 'student',
        status: 'active',
        name: 'Budi Santoso',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-3',
        username: 'citra.lestari',
        password_hash: '$2a$10$wT0vV2U7Y1v1u8p4E2K4I.XyVb76y7w8q2l0n6K4L8n7P9q8q2s1.',
        role: 'student',
        status: 'active',
        name: 'Citra Lestari',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-4',
        username: 'dedi.kurniawan',
        password_hash: '$2a$10$wT0vV2U7Y1v1u8p4E2K4I.XyVb76y7w8q2l0n6K4L8n7P9q8q2s1.',
        role: 'student',
        status: 'active',
        name: 'Dedi Kurniawan',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'u-std-5',
        username: 'eka.putri',
        password_hash: '$2a$10$wT0vV2U7Y1v1u8p4E2K4I.XyVb76y7w8q2l0n6K4L8n7P9q8q2s1.',
        role: 'student',
        status: 'active',
        name: 'Eka Putri',
        created_at: now,
        updated_at: now,
      },
    ],
    classes: [
      { id: 'c-1', name: 'X RPL 1', status: 'active', created_at: now, updated_at: now },
      { id: 'c-2', name: 'X RPL 2', status: 'active', created_at: now, updated_at: now },
      { id: 'c-3', name: 'XI RPL 1', status: 'active', created_at: now, updated_at: now },
      { id: 'c-4', name: 'XI RPL 2', status: 'active', created_at: now, updated_at: now },
      { id: 'c-5', name: 'XII RPL 1', status: 'active', created_at: now, updated_at: now },
      { id: 'c-6', name: 'XII RPL 2', status: 'active', created_at: now, updated_at: now },
    ],
    students: [
      {
        id: 's-1',
        user_id: 'u-std-1',
        class_id: 'c-5',
        name: 'Ahmad Fauzan',
        qr_token: 'SKNX-ATT-8891AF2491CB8821',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        id: 's-2',
        user_id: 'u-std-2',
        class_id: 'c-5',
        name: 'Budi Santoso',
        qr_token: 'SKNX-ATT-7729BD4812EF9012',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        id: 's-3',
        user_id: 'u-std-3',
        class_id: 'c-6',
        name: 'Citra Lestari',
        qr_token: 'SKNX-ATT-6618CD7933FA1145',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        id: 's-4',
        user_id: 'u-std-4',
        class_id: 'c-3',
        name: 'Dedi Kurniawan',
        qr_token: 'SKNX-ATT-5507DE8844BC2236',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        id: 's-5',
        user_id: 'u-std-5',
        class_id: 'c-1',
        name: 'Eka Putri',
        qr_token: 'SKNX-ATT-4496EF9955DE3327',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ],
    attendance: [],
    audit_logs: [
      {
        id: 'log-init-1',
        user_id: 'u-admin-1',
        action: 'system.initialized',
        entity_type: 'system',
        entity_id: 'SKANEXA-v1.0',
        metadata: { info: 'Sistem Absen SKANEXA berhasil diinisialisasi' },
        created_at: now,
      },
    ],
  };
}

function readLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial = getInitialData();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local db:', err);
    return getInitialData();
  }
}

function writeLocalDb(data: LocalDatabase): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db:', err);
  }
}

// -----------------------------------------------------------------------------
// USER OPERATIONS
// -----------------------------------------------------------------------------
export async function getUserByUsername(username: string): Promise<User | null> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('users').select('*').eq('username', username.trim()).single();
    return data || null;
  }
  const db = readLocalDb();
  return db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('users').select('*').eq('id', id).single();
    return data || null;
  }
  const db = readLocalDb();
  return db.users.find((u) => u.id === id) || null;
}

export async function createUser(
  user: Omit<User, 'id' | 'created_at' | 'updated_at'>
): Promise<User> {
  const now = new Date().toISOString();
  const id = `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newUser: User = {
    ...user,
    id,
    created_at: now,
    updated_at: now,
  };

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('users').insert({
      username: user.username,
      password_hash: user.password_hash,
      role: user.role,
      status: user.status,
    }).select().single();
    if (error) throw error;
    return data;
  }

  const db = readLocalDb();
  db.users.push(newUser);
  writeLocalDb(db);
  return newUser;
}

export async function updateUserPassword(id: string, password_hash: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('users').update({ password_hash, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  }
  const db = readLocalDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;
  user.password_hash = password_hash;
  user.updated_at = new Date().toISOString();
  writeLocalDb(db);
  return true;
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('users').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  }
  const db = readLocalDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;
  user.status = status;
  user.updated_at = new Date().toISOString();
  writeLocalDb(db);
  return true;
}

export async function getSecurityOfficers(): Promise<User[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.from('users').select('*').eq('role', 'security').order('created_at', { ascending: false });
    return data || [];
  }
  const db = readLocalDb();
  return db.users.filter((u) => u.role === 'security');
}

// -----------------------------------------------------------------------------
// CLASS OPERATIONS
// -----------------------------------------------------------------------------
export async function getClasses(): Promise<ClassItem[]> {
  const sb = getSupabase();
  if (sb) {
    const { data: classesData } = await sb.from('classes').select('*').order('name');
    const { data: studentsData } = await sb.from('students').select('class_id');
    const counts: Record<string, number> = {};
    (studentsData || []).forEach((s) => {
      if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1;
    });
    return (classesData || []).map((c) => ({
      ...c,
      student_count: counts[c.id] || 0,
    }));
  }

  const db = readLocalDb();
  return db.classes.map((c) => {
    const count = db.students.filter((s) => s.class_id === c.id).length;
    return { ...c, student_count: count };
  });
}

export async function createClass(name: string): Promise<ClassItem> {
  const now = new Date().toISOString();
  const id = `c-${Date.now()}`;
  const newClass: ClassItem = {
    id,
    name: name.trim(),
    status: 'active',
    created_at: now,
    updated_at: now,
    student_count: 0,
  };

  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('classes').insert({ name: name.trim() }).select().single();
    if (error) throw error;
    return { ...data, student_count: 0 };
  }

  const db = readLocalDb();
  db.classes.push(newClass);
  writeLocalDb(db);
  return newClass;
}

export async function updateClass(id: string, name: string, status: UserStatus): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('classes').update({ name: name.trim(), status, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  }
  const db = readLocalDb();
  const c = db.classes.find((item) => item.id === id);
  if (!c) return false;
  c.name = name.trim();
  c.status = status;
  c.updated_at = new Date().toISOString();
  writeLocalDb(db);
  return true;
}

// -----------------------------------------------------------------------------
// STUDENT OPERATIONS
// -----------------------------------------------------------------------------
export async function getStudents(filters?: { classId?: string; search?: string }): Promise<Student[]> {
  const sb = getSupabase();
  if (sb) {
    let query = sb
      .from('students')
      .select('id, user_id, class_id, name, qr_token, status, created_at, updated_at, classes(name), users(username)')
      .order('created_at', { ascending: false });

    if (filters?.classId && filters.classId !== 'all') {
      query = query.eq('class_id', filters.classId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Gagal mengambil data siswa: ${error.message}`);

    let students: Student[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      class_id: row.class_id,
      name: row.name,
      qr_token: row.qr_token,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      class_name: row.classes?.name || 'Belum ada kelas',
      username: row.users?.username || '',
    }));

    if (filters?.search?.trim()) {
      const queryText = filters.search.trim().toLowerCase();
      students = students.filter((student) =>
        student.name.toLowerCase().includes(queryText) ||
        (student.username || '').toLowerCase().includes(queryText) ||
        student.qr_token.toLowerCase().includes(queryText)
      );
    }

    return students;
  }

  const db = readLocalDb();
  let students: Student[] = db.students.map((s) => {
    const c = db.classes.find((cl) => cl.id === s.class_id);
    const u = db.users.find((usr) => usr.id === s.user_id);
    return {
      ...s,
      class_name: c?.name || 'Belum ada kelas',
      username: u?.username || '',
    };
  });

  if (filters?.classId && filters.classId !== 'all') {
    students = students.filter((s) => s.class_id === filters.classId);
  }
  if (filters?.search?.trim()) {
    const query = filters.search.trim().toLowerCase();
    students = students.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      (s.username || '').toLowerCase().includes(query) ||
      s.qr_token.toLowerCase().includes(query)
    );
  }
  return students;
}


export async function getStudentById(id: string): Promise<Student | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('students')
      .select('id, user_id, class_id, name, qr_token, status, created_at, updated_at, classes(name), users(username)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Gagal mengambil siswa: ${error.message}`);
    if (!data) return null;

    return {
      ...(data as any),
      class_name: (data as any).classes?.name || 'Belum ada kelas',
      username: (data as any).users?.username || '',
    } as Student;
  }

  const db = readLocalDb();
  const s = db.students.find((item) => item.id === id);
  if (!s) return null;
  const c = db.classes.find((cl) => cl.id === s.class_id);
  const u = db.users.find((usr) => usr.id === s.user_id);
  return {
    ...s,
    class_name: c?.name || 'Belum ada kelas',
    username: u?.username || '',
  };
}


export async function getStudentByUserId(userId: string): Promise<Student | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('students')
      .select('id, user_id, class_id, name, qr_token, status, created_at, updated_at, classes(name), users(username)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(`Gagal mengambil data siswa: ${error.message}`);
    if (!data) return null;

    return {
      ...(data as any),
      class_name: (data as any).classes?.name || 'Belum ada kelas',
      username: (data as any).users?.username || '',
    } as Student;
  }

  const db = readLocalDb();
  const s = db.students.find((item) => item.user_id === userId);
  if (!s) return null;
  const c = db.classes.find((cl) => cl.id === s.class_id);
  const u = db.users.find((usr) => usr.id === s.user_id);
  return {
    ...s,
    class_name: c?.name || 'Belum ada kelas',
    username: u?.username || '',
  };
}


export async function getStudentByQrToken(qrToken: string): Promise<Student | null> {
  const trimmedToken = qrToken.trim();
  const sb = getSupabase();
  if (sb) {
    const { data: student } = await sb
      .from('students')
      .select('id, user_id, class_id, name, qr_token, status, created_at, updated_at, classes(name)')
      .eq('qr_token', trimmedToken)
      .limit(1)
      .single();

    if (!student) return null;
    return {
      ...(student as any),
      class_name: (student as any).classes?.name || 'Tanpa Kelas',
    } as Student;
  }

  const db = readLocalDb();
  const s = db.students.find((item) => item.qr_token === trimmedToken);
  if (!s) return null;
  const c = db.classes.find((cl) => cl.id === s.class_id);
  return {
    ...s,
    class_name: c?.name || 'Tanpa Kelas',
  };
}

export async function createStudent(data: {
  name: string;
  username: string;
  password_hash: string;
  class_id: string;
}): Promise<Student> {
  const now = new Date().toISOString();
  const userId = `u-std-${Date.now()}`;
  const studentId = `s-${Date.now()}`;
  const qrToken = generateQrToken();

  const newUser: User = {
    id: userId,
    username: data.username.trim().toLowerCase(),
    password_hash: data.password_hash,
    role: 'student',
    status: 'active',
    name: data.name.trim(),
    created_at: now,
    updated_at: now,
  };

  const newStudent: Student = {
    id: studentId,
    user_id: userId,
    class_id: data.class_id,
    name: data.name.trim(),
    qr_token: qrToken,
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  const sb = getSupabase();
  if (sb) {
    const { data: createdUser, error: userErr } = await sb.from('users').insert({
      username: newUser.username,
      password_hash: newUser.password_hash,
      role: 'student',
      status: 'active',
    }).select().single();
    if (userErr) throw userErr;

    const { data: createdStudent, error: stdErr } = await sb.from('students').insert({
      user_id: createdUser.id,
      class_id: data.class_id,
      name: data.name.trim(),
      qr_token: qrToken,
      status: 'active',
    }).select().single();
    if (stdErr) throw stdErr;

    return createdStudent;
  }

  const db = readLocalDb();
  db.users.push(newUser);
  db.students.push(newStudent);
  writeLocalDb(db);
  return newStudent;
}

export async function updateStudent(
  id: string,
  data: { name: string; class_id: string; status: UserStatus }
): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('students').update({
      name: data.name.trim(),
      class_id: data.class_id,
      status: data.status,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return !error;
  }

  const db = readLocalDb();
  const s = db.students.find((item) => item.id === id);
  if (!s) return false;
  s.name = data.name.trim();
  s.class_id = data.class_id;
  s.status = data.status;
  s.updated_at = new Date().toISOString();

  // Also update user status if student is disabled
  const u = db.users.find((usr) => usr.id === s.user_id);
  if (u) {
    u.status = data.status;
    u.name = data.name.trim();
  }
  writeLocalDb(db);
  return true;
}

export async function regenerateStudentQr(studentId: string): Promise<string> {
  const newQr = generateQrToken();
  const now = new Date().toISOString();

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('students').update({
      qr_token: newQr,
      updated_at: now,
    }).eq('id', studentId);
    if (error) throw error;
    return newQr;
  }

  const db = readLocalDb();
  const s = db.students.find((item) => item.id === studentId);
  if (!s) throw new Error('Student not found');
  s.qr_token = newQr;
  s.updated_at = now;
  writeLocalDb(db);
  return newQr;
}

// -----------------------------------------------------------------------------
// ATTENDANCE OPERATIONS
// -----------------------------------------------------------------------------
export async function getTodayAttendance(studentId: string, dateStr: string): Promise<AttendanceRecord | null> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('attendance_date', dateStr)
      .single();
    return data || null;
  }

  const db = readLocalDb();
  return db.attendance.find((a) => a.student_id === studentId && a.attendance_date === dateStr) || null;
}

export async function recordCheckIn(
  studentId: string,
  dateStr: string,
  officerId: string,
  lateThreshold: string = '07:15:00'
): Promise<{ record: AttendanceRecord; isDuplicate: boolean }> {
  const now = new Date();
  const timeStr = getTimeWIB(now);
  const status = determineAttendanceStatus(timeStr, lateThreshold);
  const nowIso = now.toISOString();

  const sb = getSupabase();
  if (sb) {
    // Check if already checked in
    const existing = await getTodayAttendance(studentId, dateStr);
    if (existing && existing.check_in_at) {
      return { record: existing, isDuplicate: true };
    }

    if (existing) {
      const { data, error } = await sb
        .from('attendance')
        .update({
          check_in_at: nowIso,
          check_in_by: officerId,
          status,
          updated_at: nowIso,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return { record: data, isDuplicate: false };
    } else {
      const { data, error } = await sb
        .from('attendance')
        .insert({
          student_id: studentId,
          attendance_date: dateStr,
          check_in_at: nowIso,
          check_in_by: officerId,
          status,
        })
        .select()
        .single();
      if (error) throw error;
      return { record: data, isDuplicate: false };
    }
  }

  const db = readLocalDb();
  const existing = db.attendance.find((a) => a.student_id === studentId && a.attendance_date === dateStr);
  if (existing && existing.check_in_at) {
    return { record: existing, isDuplicate: true };
  }

  if (existing) {
    existing.check_in_at = nowIso;
    existing.check_in_by = officerId;
    existing.status = status;
    existing.updated_at = nowIso;
    writeLocalDb(db);
    return { record: existing, isDuplicate: false };
  }

  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    student_id: studentId,
    attendance_date: dateStr,
    check_in_at: nowIso,
    check_out_at: null,
    check_in_by: officerId,
    check_out_by: null,
    status,
    created_at: nowIso,
    updated_at: nowIso,
  };
  db.attendance.push(newRecord);
  writeLocalDb(db);
  return { record: newRecord, isDuplicate: false };
}

export async function recordCheckOut(
  studentId: string,
  dateStr: string,
  officerId: string
): Promise<{
  record: AttendanceRecord | null;
  notCheckedIn: boolean;
  alreadyCheckedOut: boolean;
}> {
  const nowIso = new Date().toISOString();

  const sb = getSupabase();
  if (sb) {
    const existing = await getTodayAttendance(studentId, dateStr);
    if (!existing || !existing.check_in_at) {
      return { record: null, notCheckedIn: true, alreadyCheckedOut: false };
    }
    if (existing.check_out_at) {
      return { record: existing, notCheckedIn: false, alreadyCheckedOut: true };
    }

    const { data, error } = await sb
      .from('attendance')
      .update({
        check_out_at: nowIso,
        check_out_by: officerId,
        status: 'checked_out',
        updated_at: nowIso,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { record: data, notCheckedIn: false, alreadyCheckedOut: false };
  }

  const db = readLocalDb();
  const existing = db.attendance.find((a) => a.student_id === studentId && a.attendance_date === dateStr);
  if (!existing || !existing.check_in_at) {
    return { record: null, notCheckedIn: true, alreadyCheckedOut: false };
  }
  if (existing.check_out_at) {
    return { record: existing, notCheckedIn: false, alreadyCheckedOut: true };
  }

  existing.check_out_at = nowIso;
  existing.check_out_by = officerId;
  existing.status = 'checked_out';
  existing.updated_at = nowIso;
  writeLocalDb(db);
  return { record: existing, notCheckedIn: false, alreadyCheckedOut: false };
}

export async function getAttendanceRecords(filters?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  classId?: string;
  status?: string;
  studentId?: string;
}): Promise<AttendanceRecord[]> {
  const sb = getSupabase();
  if (sb) {
    let query = sb
      .from('attendance')
      .select(`
        id,
        student_id,
        attendance_date,
        check_in_at,
        check_out_at,
        check_in_by,
        check_out_by,
        status,
        created_at,
        updated_at,
        students(name, qr_token, class_id, classes(name)),
        check_in_user:users!attendance_check_in_by_fkey(name, username),
        check_out_user:users!attendance_check_out_by_fkey(name, username)
      `)
      .order('check_in_at', { ascending: false, nullsFirst: false });

    if (filters?.date) query = query.eq('attendance_date', filters.date);
    if (filters?.startDate) query = query.gte('attendance_date', filters.startDate);
    if (filters?.endDate) query = query.lte('attendance_date', filters.endDate);
    if (filters?.studentId) query = query.eq('student_id', filters.studentId);
    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) {
      console.error('getAttendanceRecords Supabase error:', error);
      throw new Error(`Gagal mengambil data presensi: ${error.message}`);
    }

    let records: AttendanceRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      student_id: row.student_id,
      attendance_date: row.attendance_date,
      check_in_at: row.check_in_at,
      check_out_at: row.check_out_at,
      check_in_by: row.check_in_by,
      check_out_by: row.check_out_by,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      student_name: (Array.isArray(row.students) ? row.students[0]?.name : row.students?.name) || 'Siswa',
      class_name: (Array.isArray(row.students) ? (Array.isArray(row.students[0]?.classes) ? row.students[0]?.classes[0]?.name : row.students[0]?.classes?.name) : (Array.isArray(row.students?.classes) ? row.students.classes[0]?.name : row.students?.classes?.name)) || '-',
      student_qr: (Array.isArray(row.students) ? row.students[0]?.qr_token : row.students?.qr_token),
      check_in_by_name: row.check_in_user?.name || row.check_in_user?.username || '-',
      check_out_by_name: row.check_out_user?.name || row.check_out_user?.username || '-',
    }));

    if (filters?.classId && filters.classId !== 'all') {
      records = records.filter((r: any) => {
        const row = (data || []).find((item: any) => item.id === r.id);
        const student = Array.isArray(row?.students) ? row.students[0] : row?.students;
        return student?.class_id === filters.classId;
      });
    }

    return records;
  }

  const db = readLocalDb();
  let records = db.attendance.map((a) => {
    const student = db.students.find((s) => s.id === a.student_id);
    const c = student ? db.classes.find((cl) => cl.id === student.class_id) : null;
    const inUser = db.users.find((u) => u.id === a.check_in_by);
    const outUser = db.users.find((u) => u.id === a.check_out_by);
    return {
      ...a,
      student_name: student?.name || 'Siswa',
      class_name: c?.name || '-',
      student_qr: student?.qr_token,
      check_in_by_name: inUser?.name || inUser?.username || '-',
      check_out_by_name: outUser?.name || outUser?.username || '-',
    };
  });

  if (filters?.date) records = records.filter((r) => r.attendance_date === filters.date);
  if (filters?.startDate) records = records.filter((r) => r.attendance_date >= filters.startDate!);
  if (filters?.endDate) records = records.filter((r) => r.attendance_date <= filters.endDate!);
  if (filters?.studentId) records = records.filter((r) => r.student_id === filters.studentId);
  if (filters?.classId && filters.classId !== 'all') {
    const ids = db.students.filter((s) => s.class_id === filters.classId).map((s) => s.id);
    records = records.filter((r) => ids.includes(r.student_id));
  }
  if (filters?.status && filters.status !== 'all') records = records.filter((r) => r.status === filters.status);

  return records.sort((a, b) => (b.check_in_at || b.check_out_at || '').localeCompare(a.check_in_at || a.check_out_at || ''));
}


export async function correctAttendance(
  id: string,
  updates: {
    check_in_at?: string | null;
    check_out_at?: string | null;
    status: AttendanceStatus;
  },
  adminId: string,
  reason?: string
): Promise<AttendanceRecord | null> {
  const nowIso = new Date().toISOString();
  const sb = getSupabase();

  if (sb) {
    const { data: previous, error: findError } = await sb
      .from('attendance')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError) throw new Error(`Gagal mengambil presensi: ${findError.message}`);
    if (!previous) return null;

    const { data: updated, error } = await sb
      .from('attendance')
      .update({ ...updates, updated_at: nowIso })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Gagal mengoreksi presensi: ${error.message}`);

    await logAudit(adminId, 'attendance.manual_update', 'attendance', id, {
      previous,
      updated: updates,
      reason,
    });

    return updated as AttendanceRecord;
  }

  const db = readLocalDb();
  const rec = db.attendance.find((a) => a.id === id);
  if (!rec) return null;
  const previous = { ...rec };
  if (updates.check_in_at !== undefined) rec.check_in_at = updates.check_in_at;
  if (updates.check_out_at !== undefined) rec.check_out_at = updates.check_out_at;
  rec.status = updates.status;
  rec.updated_at = nowIso;
  writeLocalDb(db);
  await logAudit(adminId, 'attendance.manual_update', 'attendance', id, { previous, updated: updates, reason });
  return rec;
}


export async function getDashboardStats(dateStr: string): Promise<{
  totalStudents: number;
  checkInCount: number;
  lateCount: number;
  notCheckedInCount: number;
  checkOutCount: number;
}> {
  const sb = getSupabase();
  if (sb) {
    const [studentsResult, attendanceResult] = await Promise.all([
      sb.from('students').select('id, status').eq('status', 'active'),
      sb.from('attendance').select('student_id, check_in_at, check_out_at, status').eq('attendance_date', dateStr),
    ]);

    if (studentsResult.error) {
      throw new Error(`Gagal menghitung total siswa: ${studentsResult.error.message}`);
    }
    if (attendanceResult.error) {
      throw new Error(`Gagal menghitung presensi: ${attendanceResult.error.message}`);
    }

    const totalStudents = (studentsResult.data || []).length;
    const todayRecords = attendanceResult.data || [];
    const checkInCount = todayRecords.filter((a: any) => Boolean(a.check_in_at)).length;
    const lateCount = todayRecords.filter((a: any) => a.status === 'late').length;
    const checkOutCount = todayRecords.filter((a: any) => Boolean(a.check_out_at)).length;

    return {
      totalStudents,
      checkInCount,
      lateCount,
      notCheckedInCount: Math.max(0, totalStudents - checkInCount),
      checkOutCount,
    };
  }

  const db = readLocalDb();
  const totalStudents = db.students.filter((s) => s.status === 'active').length;
  const todayRecords = db.attendance.filter((a) => a.attendance_date === dateStr);
  const checkInCount = todayRecords.filter((a) => a.check_in_at !== null).length;
  const lateCount = todayRecords.filter((a) => a.status === 'late').length;
  const checkOutCount = todayRecords.filter((a) => a.check_out_at !== null).length;
  return { totalStudents, checkInCount, lateCount, notCheckedInCount: Math.max(0, totalStudents - checkInCount), checkOutCount };
}


// -----------------------------------------------------------------------------
// SETTINGS OPERATIONS
// -----------------------------------------------------------------------------
export async function getAttendanceSettings(): Promise<AttendanceSettings> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('attendance_settings').select('*').eq('id', 1).single();
    if (error) throw new Error(`Gagal mengambil pengaturan presensi: ${error.message}`);
    if (data) return data as AttendanceSettings;
  }
  const db = readLocalDb();
  return db.settings;
}


export async function updateAttendanceSettings(
  settings: Partial<AttendanceSettings>,
  adminId?: string
): Promise<AttendanceSettings> {
  const now = new Date().toISOString();
  const sb = getSupabase();

  if (sb) {
    const { data, error } = await sb
      .from('attendance_settings')
      .upsert({ id: 1, ...settings, updated_at: now }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw new Error(`Gagal menyimpan pengaturan presensi: ${error.message}`);
    if (adminId) await logAudit(adminId, 'settings.update', 'attendance_settings', '1', settings);
    return data as AttendanceSettings;
  }

  const db = readLocalDb();
  db.settings = { ...db.settings, ...settings, updated_at: now };
  writeLocalDb(db);
  if (adminId) await logAudit(adminId, 'settings.update', 'attendance_settings', '1', settings);
  return db.settings;
}


// -----------------------------------------------------------------------------
// AUDIT LOG OPERATIONS
// -----------------------------------------------------------------------------
export async function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: any
): Promise<void> {
  const now = new Date().toISOString();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
    created_at: now,
  };

  const sb = getSupabase();
  if (sb) {
    await sb.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
    return;
  }

  const db = readLocalDb();
  db.audit_logs.unshift(log);
  // keep last 500 logs to prevent file bloating
  if (db.audit_logs.length > 500) {
    db.audit_logs = db.audit_logs.slice(0, 500);
  }
  writeLocalDb(db);
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  const db = readLocalDb();
  return db.audit_logs.slice(0, limit).map((log) => {
    const user = db.users.find((u) => u.id === log.user_id);
    return {
      ...log,
      user_name: user?.name || user?.username || (log.user_id ? 'User' : 'System'),
    };
  });
}
