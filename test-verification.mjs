// Automated test verification script for Absen SKANEXA
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING ABSEN SKANEXA SYSTEM TESTS ---');

  // Test 1: Health check / Homepage
  const resHome = await fetch(`${BASE_URL}/login`);
  console.log('Test 1 (Homepage/Login reachable):', resHome.status === 200 ? 'PASS' : 'FAIL');

  // Test 2: Security Login
  const resSecLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'security01', password: 'security123' }),
  });
  const secCookie = resSecLogin.headers.get('set-cookie');
  const secData = await resSecLogin.json();
  console.log('Test 2 (Security Officer Login):', secData.success === true ? 'PASS' : 'FAIL');

  // Test 3: Scan Valid Check In (Ahmad Fauzan)
  const ahmadToken = 'SKNX-ATT-8891AF2491CB8821';
  const resScan1 = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: secCookie,
    },
    body: JSON.stringify({ token: ahmadToken, action: 'check_in' }),
  });
  const scan1Data = await resScan1.json();
  console.log('Test 3 (Valid Check In):', scan1Data.success === true && scan1Data.name === 'Ahmad Fauzan' ? 'PASS' : 'FAIL', scan1Data);

  // Test 4: Duplicate Check In prevention
  const resScanDup = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: secCookie,
    },
    body: JSON.stringify({ token: ahmadToken, action: 'check_in' }),
  });
  const scanDupData = await resScanDup.json();
  console.log('Test 4 (Duplicate Check In Rejected):', scanDupData.code === 'ALREADY_CHECKED_IN' ? 'PASS' : 'FAIL', scanDupData.code);

  // Test 5: Check Out before Check In rejected (Budi Santoso)
  const budiToken = 'SKNX-ATT-7729BD4812EF9012';
  const resBudiOut = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: secCookie,
    },
    body: JSON.stringify({ token: budiToken, action: 'check_out' }),
  });
  const budiOutData = await resBudiOut.json();
  console.log('Test 5 (Check Out Without Check In Rejected):', budiOutData.code === 'NOT_CHECKED_IN' ? 'PASS' : 'FAIL', budiOutData.code);

  // Test 6: Invalid QR token rejected
  const resInvalid = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: secCookie,
    },
    body: JSON.stringify({ token: 'SKNX-ATT-0000000000000000', action: 'check_in' }),
  });
  const invalidData = await resInvalid.json();
  console.log('Test 6 (Invalid QR Rejected):', invalidData.code === 'INVALID_QR' ? 'PASS' : 'FAIL', invalidData.code);

  // Test 7: Valid Check Out for Ahmad Fauzan
  const resAhmadOut = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: secCookie,
    },
    body: JSON.stringify({ token: ahmadToken, action: 'check_out' }),
  });
  const ahmadOutData = await resAhmadOut.json();
  console.log('Test 7 (Valid Check Out):', ahmadOutData.success === true ? 'PASS' : 'FAIL', ahmadOutData);

  // Test 8: Admin Login & Dashboard Metrics
  const resAdminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const adminCookie = resAdminLogin.headers.get('set-cookie');
  const resDashboard = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Cookie: adminCookie },
  });
  const dashData = await resDashboard.json();
  console.log('Test 8 (Admin Dashboard Stats):', dashData.success === true ? 'PASS' : 'FAIL', dashData.stats);

  // Test 9: CSV Report Export
  const resCsv = await fetch(`${BASE_URL}/api/admin/reports?format=csv`, {
    headers: { Cookie: adminCookie },
  });
  const csvText = await resCsv.text();
  console.log('Test 9 (CSV Export Generated):', csvText.includes('Tanggal,Nama Siswa') ? 'PASS' : 'FAIL', 'Length:', csvText.length);

  // Test 10: Student Self-Me Status
  const resStdLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ahmad.fauzan', password: 'student123' }),
  });
  const stdCookie = resStdLogin.headers.get('set-cookie');
  const resStdMe = await fetch(`${BASE_URL}/api/student/me`, {
    headers: { Cookie: stdCookie },
  });
  const stdData = await resStdMe.json();
  console.log('Test 10 (Student QR & Status):', stdData.success === true ? 'PASS' : 'FAIL', stdData.attendance);

  console.log('--- ALL SYSTEM VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
