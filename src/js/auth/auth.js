/* ============================================
   사용자 인증 관리 모듈 (Authentication Manager)

   역할:
   - 로그인/로그아웃/회원가입 처리
   - 사용자 세션 관리
   - 로컬 스토리지 기반 사용자 DB 관리
   ============================================ */

/* ============================================
   전역 상태 (Global State)
   ============================================ */

// 사용자 데이터베이스 (Users Database)
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];

// 현재 로그인한 사용자 (Current Logged-in User)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

/* ============================================
   사용자 정보 조회 (User Info Getters)
   ============================================ */

/**
 * 현재 로그인한 사용자 정보 반환
 * @returns {Object|null} 사용자 객체 또는 null
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * 사용자 DB 반환
 * @returns {Array} 전체 사용자 배열
 */
export function getUsersDB() {
  return usersDB;
}

/* ============================================
   [발표 9단계] 회원 인증
   설명: localStorage 기반 인증, 사용자별 데이터 분리 및 마이그레이션
   ============================================ */
/* ============================================
   로그인 처리 (Login Handler)
   ============================================ */

/**
 * 사용자 로그인 처리
 * @param {string} username - 사용자 아이디
 * @param {string} password - 비밀번호
 * @returns {boolean} 로그인 성공 여부
 */
export function login(username, password) {
  const user = usersDB.find(u => u.username === username && u.password === password);

  if (!user) {
    alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    return false;
  }

  // 현재 사용자 설정 (Set current user)
  currentUser = { username: user.username };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  alert('로그인 성공!');

  // 로컬 데이터를 서버로 업로드 (Upload local data to server)
  uploadLocalDataToServer();

  // 서버에 저장된 프로필 불러오기 (Load server profile)
  const serverKey = `server_${currentUser.username}_profile`;
  const serverData = localStorage.getItem(serverKey);

  if (serverData) {
    localStorage.setItem('userProfile', serverData);
  }

  return true;
}

/* ============================================
   로그아웃 처리 (Logout Handler)
   ============================================ */

/**
 * 사용자 로그아웃 처리
 */
export function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  alert('로그아웃되었습니다.');
}

/* ============================================
   회원가입 처리 (Signup Handler)
   ============================================ */

/**
 * 새 사용자 회원가입 처리
 * @param {string} username - 사용자 아이디
 * @param {string} password - 비밀번호
 * @returns {boolean} 회원가입 성공 여부
 */
export function signup(username, password) {
  // 중복 아이디 체크 (Check duplicate username)
  if (usersDB.find(u => u.username === username)) {
    alert('이미 사용 중인 아이디입니다.');
    return false;
  }

  // 아이디 길이 검증 (Validate username length)
  if (username.length < 4) {
    alert('아이디는 4자 이상이어야 합니다.');
    return false;
  }

  // 비밀번호 길이 검증 (Validate password length)
  if (password.length < 6) {
    alert('비밀번호는 6자 이상이어야 합니다.');
    return false;
  }

  // 새 사용자 추가 (Add new user)
  usersDB.push({
    username,
    password,
    joinDate: new Date().toISOString()
  });

  localStorage.setItem('usersDB', JSON.stringify(usersDB));

  alert('회원가입 성공! 로그인해주세요.');
  return true;
}

/* ============================================
   데이터 동기화 (Data Synchronization)
   ============================================ */

/**
 * 로컬 데이터를 서버로 업로드 (실제로는 localStorage에 저장)
 * Upload local user data to server storage
 */
export function uploadLocalDataToServer() {
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile && currentUser) {
    localStorage.setItem(`server_${currentUser.username}_profile`, userProfile);
  }
}

/**
 * 현재 사용자 정보 업데이트
 * @param {Object} user - 새로운 사용자 객체
 */
export function updateCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
}
