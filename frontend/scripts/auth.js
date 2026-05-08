import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCpkRkf4LIdAWbKTCt95Oa4XuuN6C8b1g",
  authDomain: "pharmacy-info-portal.firebaseapp.com",
  projectId: "pharmacy-info-portal",
  storageBucket: "pharmacy-info-portal.firebasestorage.app",
  messagingSenderId: "952402604771",
  appId: "1:952402604771:web:6e3a10ae7c1701255f8bd6",
  measurementId: "G-RX0XW330HY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/**
 * 구글 로그인 팝업 실행
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Logged in as:", user.displayName);
    return user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
}

/**
 * 로그아웃 실행
 */
export async function logout() {
  try {
    await signOut(auth);
    console.log("Logged out");
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
}

/**
 * 로그인 상태 감지 및 콜백 실행
 */
export function watchAuthState(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      // 토큰을 세션이나 로컬스토리지에 저장하여 API 요청 시 사용
      localStorage.setItem('firebaseToken', token);
      callback(user);
    } else {
      localStorage.removeItem('firebaseToken');
      callback(null);
    }
  });
}

/**
 * 현재 유효한 ID 토큰 가져오기
 */
export async function getValidToken() {
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken(true);
  }
  return null;
}
