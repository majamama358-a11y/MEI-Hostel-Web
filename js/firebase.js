// =====================================================
// MAHENDRA HOSTEL - FIREBASE CONFIGURATION
// =====================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDEMO_REPLACE_WITH_YOUR_FIREBASE_KEY",
  authDomain: "mahendra-hostel.firebaseapp.com",
  databaseURL: "https://mahendra-hostel-default-rtdb.firebaseio.com",
  projectId: "mahendra-hostel",
  storageBucket: "mahendra-hostel.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// =====================================================
// FIREBASE INITIALIZATION
// =====================================================
let app, auth, db, storage;

function isFirebaseConfigured() {
  return typeof FIREBASE_CONFIG !== 'undefined' &&
         FIREBASE_CONFIG.apiKey &&
         !FIREBASE_CONFIG.apiKey.startsWith('AIzaSyDEMO');
}

function initFirebase() {
  try {
    if (typeof firebase === 'undefined' || !isFirebaseConfigured()) {
      return false;
    }

    if (firebase.apps.length === 0) {
      app = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      app = firebase.apps[0];
    }

    auth = firebase.auth();
    db = firebase.database();

    if (firebase.storage) {
      storage = firebase.storage();
    }

    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    return true;
  } catch (e) {
    console.warn('Firebase init error:', e.message);
    return false;
  }
}

// =====================================================
// DATABASE REFERENCE HELPERS
// =====================================================
const DB = {
  // Users
  users: () => db ? db.ref('users') : null,
  user: (uid) => db ? db.ref(`users/${uid}`) : null,

  // Requests
  requests: () => db ? db.ref('requests') : null,
  request: (id) => db ? db.ref(`requests/${id}`) : null,

  // Attendance
  attendance: () => db ? db.ref('attendance') : null,
  dateAttendance: (date) => db ? db.ref(`attendance/${date}`) : null,
  userAttendance: (date, uid) => db ? db.ref(`attendance/${date}/${uid}`) : null,

  // Food
  food: () => db ? db.ref('food') : null,
  foodItem: (id) => db ? db.ref(`food/${id}`) : null,
  foodSelections: () => db ? db.ref('foodSelections') : null,
  userFoodSelection: (uid, foodId) => db ? db.ref(`foodSelections/${uid}_${foodId}`) : null,

  // Settings
  passSettings: () => db ? db.ref('passSettings') : null,

  // Emergency
  emergency: () => db ? db.ref('emergency') : null,

  // Parcels
  parcels: () => db ? db.ref('parcels') : null,
  parcel: (id) => db ? db.ref(`parcels/${id}`) : null,

  // Activity Logs
  activityLogs: () => db ? db.ref('activityLogs') : null,
  activityLog: (id) => db ? db.ref(`activityLogs/${id}`) : null
};

// =====================================================
// LOCAL PERSISTENT STORAGE AUTH SYSTEM
// =====================================================

const LOCAL_AUTH_DB_KEY = 'mei_users_db';
const LOCAL_SESSION_KEY = 'mei_auth_session';
const LOCAL_LOGS_KEY = 'mei_activity_logs';

/**
 * Hash function for passwords
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

/**
 * Get the local users database
 */
function getLocalUsersDB() {
  try {
    const data = localStorage.getItem(LOCAL_AUTH_DB_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save the local users database
 */
function saveLocalUsersDB(usersObj) {
  localStorage.setItem(LOCAL_AUTH_DB_KEY, JSON.stringify(usersObj));
}

/**
 * Seed the master owner account if it doesn't exist
 * Master Owner: username=416K2FRIENDS, password=416K2FRIENDS
 */
function seedMasterOwner() {
  const users = getLocalUsersDB();
  const masterUID = 'owner_master_001';

  if (!users[masterUID] || !users[masterUID].passwordHash) {
    users[masterUID] = {
      uid: masterUID,
      username: '416K2FRIENDS',
      passwordHash: simpleHash('416K2FRIENDS'),
      name: 'MASTER OWNER',
      role: 'owner',
      email: 'owner@mei.edu',
      phone: '',
      department: 'Administration',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      status: 'active',
      isMaster: true
    };
    saveLocalUsersDB(users);

    if (isFirebaseConfigured() && db) {
      DB.user(masterUID).set(users[masterUID]).catch(() => {});
    }
  }

  return users;
}

/**
 * Authenticate a user by username + password
 */
function authenticateUser(username, password) {
  if (!username || !password) return null;
  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  // 1. Guaranteed Master Owner Login (Always works unconditionally)
  // Case-insensitive, trims all whitespace, accepts 416K2FRIENDS or 416K2FRIEND
  const isMasterUser = cleanUser.toUpperCase() === '416K2FRIENDS';
  const isMasterPass = cleanPass.toUpperCase() === '416K2FRIENDS' || cleanPass.toUpperCase() === '416K2FRIEND';

  if (isMasterUser && isMasterPass) {
    seedMasterOwner();
    const users = getLocalUsersDB();
    if (users['owner_master_001']) {
      users['owner_master_001'].status = 'active';
      return { ...users['owner_master_001'] };
    }
    return {
      uid: 'owner_master_001',
      username: '416K2FRIENDS',
      name: 'MASTER OWNER',
      role: 'owner',
      email: 'owner@mei.edu',
      phone: '',
      department: 'Administration',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      status: 'active',
      isMaster: true
    };
  }

  // 2. Regular user authentication from users database
  const users = seedMasterOwner();
  const passHash = simpleHash(cleanPass);
  const passHashUpper = simpleHash(cleanPass.toUpperCase());
  const passHashLower = simpleHash(cleanPass.toLowerCase());

  // Check username match
  for (const uid in users) {
    const u = users[uid];
    if (
      u.username &&
      u.username.trim().toLowerCase() === cleanUser.toLowerCase() &&
      (u.passwordHash === passHash || u.passwordHash === passHashUpper || u.passwordHash === passHashLower || u.password === cleanPass) &&
      u.status !== 'disabled'
    ) {
      return { ...u };
    }
  }

  // Also check rollNumber / registerNumber for student login
  for (const uid in users) {
    const u = users[uid];
    const roll = (u.rollNumber || u.registerNumber || '').trim().toLowerCase();
    if (
      roll &&
      roll === cleanUser.toLowerCase() &&
      (u.passwordHash === passHash || u.passwordHash === passHashUpper || u.passwordHash === passHashLower || u.password === cleanPass) &&
      u.status !== 'disabled'
    ) {
      return { ...u };
    }
  }

  return null;
}

/**
 * Get current session user (Persisted across PWA / browser restarts)
 */
function getSessionUser() {
  try {
    let data = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!data) {
      data = sessionStorage.getItem(LOCAL_SESSION_KEY);
    }
    if (!data) return null;

    const user = JSON.parse(data);
    if (!user || !user.uid) return null;

    // Verify account exists and is not disabled
    const users = getLocalUsersDB();
    if (users[user.uid]) {
      if (users[user.uid].status === 'disabled') {
        clearSession();
        return null;
      }
      return { ...users[user.uid], ...user };
    }
    return user;
  } catch (e) {
    return null;
  }
}

/**
 * Set current session user (Persists in localStorage and sessionStorage)
 */
function setSessionUser(userObj) {
  const safe = { ...userObj };
  delete safe.passwordHash;
  const jsonStr = JSON.stringify(safe);
  localStorage.setItem(LOCAL_SESSION_KEY, jsonStr);
  sessionStorage.setItem(LOCAL_SESSION_KEY, jsonStr);
  localStorage.setItem('mei_auth_token', 'token_' + safe.uid + '_' + Date.now());
}

/**
 * Clear session
 */
function clearSession() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
  sessionStorage.removeItem(LOCAL_SESSION_KEY);
  sessionStorage.removeItem('mei_demo_user');
  localStorage.removeItem('mei_auth_token');
  if (typeof auth !== 'undefined' && auth && auth.signOut) {
    try { auth.signOut().catch(() => {}); } catch (e) {}
  }
}

// =====================================================
// USER MANAGEMENT (CRUD)
// =====================================================

/**
 * Create a new user
 */
function createUser(userData, createdByUID) {
  const users = getLocalUsersDB();
  const uid = `${userData.role}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Check for duplicate username
  for (const existingUID in users) {
    if (users[existingUID].username &&
        users[existingUID].username.toLowerCase() === userData.username.toLowerCase()) {
      return { success: false, message: 'Username already exists' };
    }
    // Check duplicate roll number for students only (if provided)
    const targetRoll = (userData.rollNumber || userData.registerNumber || '').trim().toLowerCase();
    if (userData.role === 'student' && targetRoll) {
      const existingRoll = (users[existingUID].rollNumber || users[existingUID].registerNumber || '').trim().toLowerCase();
      if (existingRoll && existingRoll === targetRoll) {
        return { success: false, message: 'Roll number already exists' };
      }
    }
  }

  const newUser = {
    uid: uid,
    username: userData.username,
    passwordHash: simpleHash(userData.password),
    name: (userData.name || '').toUpperCase(),
    role: userData.role, // 'student', 'admin', 'owner'
    registerNumber: userData.rollNumber || userData.registerNumber || '',
    rollNumber: userData.rollNumber || userData.registerNumber || '',
    room: userData.room || '',
    department: userData.department || '',
    year: userData.year || '',
    college: userData.college || 'Mahendra Engineering College',
    hostel: userData.hostel || 'Boys Hostel',
    phone: userData.phone || '',
    email: userData.email || '',
    profileImage: null,
    createdAt: new Date().toISOString(),
    createdBy: createdByUID,
    status: 'active',
    isMaster: false
  };

  users[uid] = newUser;
  saveLocalUsersDB(users);

  if (isFirebaseConfigured() && db) {
    DB.user(uid).set(newUser).catch(() => {});
  }

  // Log the activity
  logActivity(createdByUID, 'CREATE_USER', `Created ${userData.role}: ${newUser.name} (${userData.username})`);

  return { success: true, message: 'User created successfully', uid: uid };
}

/**
 * Update a user
 */
function updateUser(uid, updates, updatedByUID) {
  const users = getLocalUsersDB();
  if (!users[uid]) return { success: false, message: 'User not found' };

  if (users[uid].isMaster && (updates.role || updates.username)) {
    return { success: false, message: 'Cannot modify master owner role or username' };
  }

  if (updates.username && updates.username.toLowerCase() !== users[uid].username.toLowerCase()) {
    for (const existingUID in users) {
      if (existingUID !== uid &&
          users[existingUID].username &&
          users[existingUID].username.toLowerCase() === updates.username.toLowerCase()) {
        return { success: false, message: 'Username already taken' };
      }
    }
  }

  const newRoll = (updates.rollNumber || updates.registerNumber || '').trim().toLowerCase();
  if (users[uid].role === 'student' && newRoll) {
    for (const existingUID in users) {
      if (existingUID !== uid) {
        const existRoll = (users[existingUID].rollNumber || users[existingUID].registerNumber || '').trim().toLowerCase();
        if (existRoll && existRoll === newRoll) {
          return { success: false, message: 'Roll number already taken' };
        }
      }
    }
    updates.rollNumber = updates.rollNumber || updates.registerNumber;
    updates.registerNumber = updates.rollNumber;
  }

  if (updates.password) {
    updates.passwordHash = simpleHash(updates.password);
    delete updates.password;
  }

  if (updates.name) updates.name = updates.name.toUpperCase();

  Object.assign(users[uid], updates, { updatedAt: new Date().toISOString() });
  saveLocalUsersDB(users);

  if (isFirebaseConfigured() && db) {
    DB.user(uid).update(users[uid]).catch(() => {});
  }

  logActivity(updatedByUID, 'UPDATE_USER', `Updated ${users[uid].role}: ${users[uid].name}`);
  return { success: true, message: 'User updated successfully' };
}

/**
 * Delete a user
 */
function deleteUser(uid, deletedByUID) {
  const users = getLocalUsersDB();
  if (!users[uid]) return { success: false, message: 'User not found' };

  if (users[uid].isMaster) {
    return { success: false, message: 'Cannot delete master owner account' };
  }

  if (users[uid].role === 'owner') {
    const ownerCount = Object.values(users).filter(u => u.role === 'owner' && u.status === 'active').length;
    if (ownerCount <= 1) {
      return { success: false, message: 'Cannot delete the last owner account' };
    }
  }

  const deletedName = users[uid].name;
  const deletedRole = users[uid].role;
  delete users[uid];
  saveLocalUsersDB(users);

  if (isFirebaseConfigured() && db) {
    DB.user(uid).remove().catch(() => {});
  }

  logActivity(deletedByUID, 'DELETE_USER', `Deleted ${deletedRole}: ${deletedName}`);
  return { success: true, message: 'User deleted successfully' };
}

/**
 * Toggle user status (enable/disable)
 */
function toggleUserStatus(uid, toggledByUID) {
  const users = getLocalUsersDB();
  if (!users[uid]) return { success: false, message: 'User not found' };

  if (users[uid].isMaster) {
    return { success: false, message: 'Cannot disable master owner' };
  }

  if (users[uid].role === 'owner' && users[uid].status === 'active') {
    const activeOwners = Object.values(users).filter(u => u.role === 'owner' && u.status === 'active').length;
    if (activeOwners <= 1) {
      return { success: false, message: 'Cannot disable the last active owner' };
    }
  }

  users[uid].status = users[uid].status === 'active' ? 'disabled' : 'active';
  users[uid].updatedAt = new Date().toISOString();
  saveLocalUsersDB(users);

  if (isFirebaseConfigured() && db) {
    DB.user(uid).update({ status: users[uid].status, updatedAt: users[uid].updatedAt }).catch(() => {});
  }

  logActivity(toggledByUID, 'TOGGLE_STATUS', `${users[uid].status === 'active' ? 'Enabled' : 'Disabled'} ${users[uid].role}: ${users[uid].name}`);
  return { success: true, message: `User ${users[uid].status === 'active' ? 'enabled' : 'disabled'}`, status: users[uid].status };
}

/**
 * Get users by role
 */
function getUsersByRole(role) {
  const users = getLocalUsersDB();
  return Object.values(users).filter(u => u.role === role);
}

/**
 * Get all users
 */
function getAllUsers() {
  return Object.values(getLocalUsersDB());
}

/**
 * Get a single user by UID
 */
function getUserByUID(uid) {
  const users = getLocalUsersDB();
  return users[uid] || null;
}

// =====================================================
// ACTIVITY LOGGING
// =====================================================

function logActivity(performedByUID, action, description) {
  try {
    const logs = getActivityLogs();
    const performer = getUserByUID(performedByUID);

    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      performedBy: performedByUID,
      performerName: performer ? performer.name : 'SYSTEM',
      performerRole: performer ? performer.role : 'system',
      action: action,
      description: description,
      timestamp: new Date().toISOString()
    };

    logs.unshift(logEntry);

    if (logs.length > 500) logs.length = 500;

    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));

    if (isFirebaseConfigured() && db) {
      DB.activityLog(logEntry.id).set(logEntry).catch(() => {});
    }
  } catch (e) {
    console.warn('Activity log error:', e);
  }
}

function getActivityLogs() {
  try {
    const data = localStorage.getItem(LOCAL_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function clearActivityLogs(clearedByUID) {
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify([]));
  if (isFirebaseConfigured() && db) {
    DB.activityLogs().remove().catch(() => {});
  }
  logActivity(clearedByUID, 'CLEAR_LOGS', 'Activity logs cleared');
}

// =====================================================
// PASS SETTINGS & OUTING RULES
// =====================================================
const DEFAULT_PASS_SETTINGS = {
  restrictionTime: '10:00 PM',
  allowTime: { from: '05:59 AM', to: '05:59 PM' },
  outingRules: [
    {
      days: 'Monday to Friday',
      outTime: '16:30',
      inTime: '19:00',
      applyTime: 'Allowed after 16:30 (Return strictly 19:00)'
    },
    {
      days: 'Saturday, Sunday (Morning Slot)',
      outTime: '09:00',
      inTime: '16:00',
      applyTime: '09:00 – 16:00'
    },
    {
      days: 'Saturday, Sunday (Evening Slot)',
      outTime: '16:00',
      inTime: '19:00',
      applyTime: '16:00 – 19:00'
    }
  ]
};

/**
 * Strict Outing and General Request Timings Validation
 * - Weekdays (Mon-Fri): Outing only from 4:30 PM onwards. Return Time must be exactly 7:00 PM.
 * - Weekends (Sat-Sun): Morning Slot (9:00 AM - 4:00 PM) or Evening Slot (4:00 PM - 7:00 PM).
 */
function validateRequestTimings(type, fromDateStr, fromTimeStr, toDateStr, toTimeStr) {
  if (!fromDateStr || !fromTimeStr || !toDateStr || !toTimeStr) {
    return { valid: false, message: 'Please select both From and To dates and times.' };
  }

  function timeToMinutes(tStr) {
    if (!tStr) return NaN;
    const clean = String(tStr).trim();
    const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!ampmMatch) {
      const parts = clean.split(':');
      if (parts.length >= 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
      return NaN;
    }
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  function parseDate(dStr) {
    if (!dStr) return null;
    const clean = String(dStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const fromD = parseDate(fromDateStr);
  const toD = parseDate(toDateStr);
  const fromM = timeToMinutes(fromTimeStr);
  const toM = timeToMinutes(toTimeStr);

  if (!fromD || !toD || isNaN(fromM) || isNaN(toM)) {
    return { valid: false, message: 'Invalid date or time format.' };
  }

  // Outing Specific Strict Validation
  if (type === 'Outing') {
    // 1. Must be on the same date
    const sameDay = fromD.getFullYear() === toD.getFullYear() &&
                    fromD.getMonth() === toD.getMonth() &&
                    fromD.getDate() === toD.getDate();
    if (!sameDay) {
      return { valid: false, message: 'Outing must be completed on the same day.' };
    }

    const dayOfWeek = fromD.getDay(); // 0 = Sun, 6 = Sat, 1..5 = Mon..Fri
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    if (!isWeekend) {
      // NORMAL WEEKDAYS (Monday to Friday)
      if (fromM < 990) { // 4:30 PM is 990 minutes
        return { valid: false, message: 'Weekday outing is available only after 4:30 PM.' };
      }
      if (toM !== 1140) { // 7:00 PM is 1140 minutes
        return { valid: false, message: 'Outing return time must be 7:00 PM.' };
      }
      if (fromM >= 1140) {
        return { valid: false, message: 'Outing start time must be before 7:00 PM.' };
      }
      return { valid: true };
    } else {
      // SATURDAY & SUNDAY (Weekend)
      // Allowed overall window: 9:00 AM (540m) to 7:00 PM (1140m)
      if (fromM < 540 || toM < 540 || fromM > 1140 || toM > 1140) {
        return { valid: false, message: 'Weekend outing is available only between 9:00 AM and 7:00 PM.' };
      }
      if (fromM >= toM) {
        return { valid: false, message: 'Return time must be after departure time.' };
      }

      // Slot 1: Morning Slot 09:00 AM (540) to 04:00 PM (960)
      const inMorningSlot = (fromM >= 540 && toM <= 960);
      // Slot 2: Evening Slot 04:00 PM (960) to 07:00 PM (1140)
      const inEveningSlot = (fromM >= 960 && toM <= 1140);

      if (!inMorningSlot && !inEveningSlot) {
        return { valid: false, message: 'Weekend outing is available in two slots: 9:00 AM–4:00 PM and 4:00 PM–7:00 PM.' };
      }
      return { valid: true };
    }
  }

  // Non-Outing Validation (Holiday, Leave, Symposium, etc.)
  const fromTimestamp = fromD.getTime() + fromM * 60000;
  const toTimestamp = toD.getTime() + toM * 60000;
  if (toTimestamp < fromTimestamp) {
    return { valid: false, message: 'Return date & time cannot be earlier than departure date & time.' };
  }

  return { valid: true };
}
