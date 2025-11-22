/* ============================================
   메인 애플리케이션 파일 (Main Application)

   역할:
   - 애플리케이션 초기화 및 진입점
   - 각 모듈에서 필요한 기능 import 및 통합
   - 이벤트 리스너 설정 및 전역 함수 노출
   ============================================ */

import { CONFIG } from './config/constants.js';
import { transformMovieData } from './utils/utils.js';
import { getCurrentUser, login, logout, signup, updateCurrentUser } from './auth/auth.js';
import { updateWatchlistIcons } from './watchlist/watchlist.js';
import {
  openAuthModal,
  closeAuthModal,
  getIsLoginMode,
  openWatchlistLoginModal,
  closeWatchlistLoginModal,
  openProfileModal,
  closeProfileModal,
  openTrailerModal,
  closeTrailerModal,
  openMovieDetailModal,
  closeMovieDetailModal,
  toggleReview,
  openWatchProvidersModal,
  closeWatchProvidersModal,
  openWatchlistModal,
  closeWatchlistModal,
  removeFromWatchlistModal
} from './modals/modals.js';
import {
  renderMovies,
  loadHeroCarousel,
  loadDailyRecommendations
} from './renderer/movieRenderer.js';

/* ============================================
   전역 상태 (Global State)
   ============================================ */

// 전체 영화 목록 (All movies list)
let movies = [];

// 전체 보기 여부 (Show all flag)
let isShowingAll = false;

/* ============================================
   전역 함수 노출 (Expose Global Functions)
   모달에서 HTML onclick으로 호출하기 위해 window 객체에 추가
   ============================================ */

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.openWatchlistLoginModal = openWatchlistLoginModal;
window.closeWatchlistLoginModal = closeWatchlistLoginModal;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.openTrailerModal = openTrailerModal;
window.closeTrailerModal = closeTrailerModal;
window.openMovieDetailModal = openMovieDetailModal;
window.closeMovieDetailModal = closeMovieDetailModal;
window.toggleReview = toggleReview;
window.openWatchProvidersModal = openWatchProvidersModal;
window.closeWatchProvidersModal = closeWatchProvidersModal;
window.openWatchlistModal = openWatchlistModal;
window.closeWatchlistModal = closeWatchlistModal;
window.removeFromWatchlistModal = removeFromWatchlistModal;

/* ============================================
   데이터 로딩 함수 (Data Loading Functions)
   ============================================ */

/**
 * 인기 영화 100개 가져오기
 * Fetch top 100 popular movies
 */
async function fetchMovies() {
  try {
    const pagePromises = Array.from(
      { length: CONFIG.TOTAL_PAGES },
      (_, i) => window.tmdbApi.getPopularMovies(i + 1)
    );

    const results = await Promise.all(pagePromises);
    movies = results.flatMap(data => data.results).map(transformMovieData);

    renderMovies(movies.slice(0, CONFIG.INITIAL_MOVIES_COUNT));

    const viewMoreBtn = document.getElementById('viewMoreBtn');
    if (viewMoreBtn && !isShowingAll) {
      viewMoreBtn.style.display = 'block';
    }
  } catch (error) {
    console.error('영화 데이터 로딩 실패:', error);
  }
}

/* ============================================
   UI 업데이트 함수 (UI Update Functions)
   ============================================ */

/**
 * 인증 UI 업데이트
 * Update authentication UI based on login state
 */
function updateAuthUI() {
  const loginBtn = document.querySelector('.login-btn');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const currentUser = getCurrentUser();

  if (currentUser) {
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = currentUser.username;
  } else {
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

/* ============================================
   메인 초기화 (Main Initialization)
   ============================================ */

/**
 * 메인 컨텐츠 초기화
 * Initialize main content (carousel, recommendations, movies)
 */
function initializeMainContent() {
  loadHeroCarousel();
  loadDailyRecommendations();
  fetchMovies();
  setupMainPageEvents();
}

/**
 * 메인 페이지 이벤트 설정
 * Setup main page event listeners
 */
function setupMainPageEvents() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.oninput = async (e) => {
      clearTimeout(searchTimeout);
      const keyword = e.target.value.trim();

      // 검색어가 비어있으면 원래 목록 표시 (Show original list if empty)
      if (keyword.length === 0) {
        renderMovies(movies.slice(0, isShowingAll ? movies.length : CONFIG.INITIAL_MOVIES_COUNT));
        return;
      }

      // 2글자 미만이면 로컬 필터링만 (Local filtering for < 2 chars)
      if (keyword.length < 2) {
        const filtered = movies.filter(m => m.title.toLowerCase().includes(keyword.toLowerCase()));
        renderMovies(filtered.length > 0 ? filtered : movies);
        return;
      }

      // 2글자 이상이면 TMDB API 검색 (TMDB API search for >= 2 chars)
      searchTimeout = setTimeout(async () => {
        try {
          const [koData, enData] = await Promise.all([
            window.tmdbApi.searchMovies(keyword, 1, { language: 'ko-KR' }),
            window.tmdbApi.searchMovies(keyword, 1, { language: 'en-US' })
          ]);

          // 중복 제거 (Remove duplicates)
          const allMovies = [...koData.results];
          enData.results.forEach(movie => {
            if (!allMovies.find(m => m.id === movie.id)) {
              allMovies.push(movie);
            }
          });

          if (allMovies.length === 0) {
            const container = document.getElementById('movies');
            if (container) {
              container.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            }
            return;
          }

          const searchResults = allMovies.slice(0, 20).map(transformMovieData);
          renderMovies(searchResults);
        } catch (error) {
          console.error('영화 검색 실패:', error);
          const filtered = movies.filter(m => m.title.toLowerCase().includes(keyword.toLowerCase()));
          renderMovies(filtered.length > 0 ? filtered : movies);
        }
      }, 300);
    };
  }
}

/* ============================================
   이벤트 리스너 설정 (Event Listener Setup)
   ============================================ */

/**
 * 모든 이벤트 리스너 설정
 * Setup all event listeners
 */
function setupEventListeners() {
  // 팝업 메시지 수신 (Receive popup messages)
  window.addEventListener('message', (event) => {
    if (event.data.action === 'closePopup') {
      const popupFrame = document.getElementById('popupFrame');
      if (popupFrame) popupFrame.style.display = 'none';
      initializeMainContent();
    }
  });

  // 더보기 버튼 (View more button)
  const viewMoreBtn = document.getElementById('viewMoreBtn');
  if (viewMoreBtn) {
    viewMoreBtn.onclick = () => {
      isShowingAll = true;
      renderMovies(movies);
      viewMoreBtn.style.display = 'none';
    };
  }

  // 로그인 버튼 (Login button)
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.onclick = () => openAuthModal('login');
  }

  // 로그아웃 버튼 (Logout button)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      if (confirm('로그아웃 하시겠습니까?')) {
        logout();
        updateAuthUI();
        loadHeroCarousel();
      }
    };
  }

  // 인증 모달 (Auth modal)
  const authModalClose = document.querySelector('#authModal .modal-close');
  if (authModalClose) authModalClose.onclick = closeAuthModal;

  const authSwitchLink = document.getElementById('authSwitchLink');
  if (authSwitchLink) {
    authSwitchLink.onclick = (e) => {
      e.preventDefault();
      openAuthModal(getIsLoginMode() ? 'signup' : 'login');
    };
  }

  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.onsubmit = (e) => {
      e.preventDefault();
      const username = document.getElementById('authUsername').value;
      const password = document.getElementById('authPassword').value;

      const isLogin = getIsLoginMode();
      const success = isLogin ? login(username, password) : signup(username, password);

      if (success) {
        if (isLogin) {
          closeAuthModal();
          updateAuthUI();

          const currentUser = getCurrentUser();
          const serverKey = `server_${currentUser.username}_profile`;
          const serverData = localStorage.getItem(serverKey);

          if (serverData) {
            localStorage.setItem('userProfile', serverData);
            loadHeroCarousel();
            loadDailyRecommendations();
          } else {
            const popupFrame = document.getElementById('popupFrame');
            if (popupFrame) popupFrame.style.display = 'block';
          }
        } else {
          openAuthModal('login');
        }
      }
    };
  }

  // 워치리스트 (Watchlist)
  const watchlistBtn = document.getElementById('watchlistBtn');
  if (watchlistBtn) {
    watchlistBtn.onclick = () => {
      getCurrentUser() ? openWatchlistModal() : openWatchlistLoginModal();
    };
  }

  const watchlistModalClose = document.querySelector('#watchlistLoginModal .modal-close');
  if (watchlistModalClose) watchlistModalClose.onclick = closeWatchlistLoginModal;

  const goToLoginBtn = document.getElementById('goToLoginBtn');
  if (goToLoginBtn) {
    goToLoginBtn.onclick = () => {
      closeWatchlistLoginModal();
      openAuthModal('login');
    };
  }

  // 프로필 (Profile)
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.onclick = () => {
      if (getCurrentUser()) {
        openProfileModal();
      } else {
        alert('로그인이 필요합니다.');
        openAuthModal('login');
      }
    };
  }

  const profileModalClose = document.querySelector('#profileModal .modal-close');
  if (profileModalClose) profileModalClose.onclick = closeProfileModal;

  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.onclick = () => {
      closeProfileModal();
      const popupFrame = document.getElementById('popupFrame');
      if (popupFrame) popupFrame.style.display = 'block';
    };
  }

  // 영화 상세 모달 (Movie detail modal)
  const movieDetailModalClose = document.querySelector('#movieDetailModal .modal-close');
  if (movieDetailModalClose) {
    movieDetailModalClose.onclick = closeMovieDetailModal;
  }

  // 모달 외부 클릭 (Modal outside click)
  window.addEventListener('click', (e) => {
    const modals = {
      authModal: closeAuthModal,
      watchlistLoginModal: closeWatchlistLoginModal,
      profileModal: closeProfileModal,
      movieDetailModal: closeMovieDetailModal
    };

    Object.entries(modals).forEach(([id, closeFn]) => {
      if (e.target === document.getElementById(id)) closeFn();
    });
  });
}

/* ============================================
   앱 시작 (Application Start)
   ============================================ */

window.addEventListener('DOMContentLoaded', () => {
  // 개발자 모드: 초기화 (Developer mode: reset)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === 'true') {
    localStorage.removeItem('survey_completed');
    localStorage.removeItem('userProfile');
    sessionStorage.removeItem('popup_shown');
    const currentUser = getCurrentUser();
    if (currentUser) {
      localStorage.removeItem(`server_${currentUser.username}_profile`);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const popupFrame = document.getElementById('popupFrame');
  updateAuthUI();

  if (popupFrame) {
    const currentUser = getCurrentUser();
    if (currentUser) {
      // 로그인 상태 (Logged in state)
      const serverData = localStorage.getItem(`server_${currentUser.username}_profile`);
      if (serverData) {
        localStorage.setItem('userProfile', serverData);
      }
      initializeMainContent();
    } else {
      // 비로그인 상태 (Not logged in state)
      popupFrame.style.display = 'block';
    }
  }

  // 이벤트 리스너 등록 (Register event listeners)
  setupEventListeners();
});
