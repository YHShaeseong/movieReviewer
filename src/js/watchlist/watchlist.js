/* ============================================
   워치리스트 관리 모듈 (Watchlist Manager)

   역할:
   - 사용자별 영화 워치리스트 저장/조회/삭제
   - 로컬 스토리지 기반 워치리스트 관리
   - 워치리스트 아이콘 상태 업데이트
   ============================================ */

import { getCurrentUser } from '../auth/auth.js';

/* ============================================
   워치리스트 CRUD (Watchlist CRUD Operations)
   ============================================ */

/**
 * 워치리스트 조회 (Get Watchlist)
 * 현재 사용자 또는 게스트의 워치리스트 반환
 * @returns {Array} 워치리스트 영화 배열
 */
export function getWatchlist() {
  const currentUser = getCurrentUser();
  const key = currentUser ? `watchlist_${currentUser.username}` : 'watchlist_guest';
  return JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * 워치리스트 저장 (Save Watchlist)
 * @param {Array} watchlist - 저장할 워치리스트 배열
 */
export function saveWatchlist(watchlist) {
  const currentUser = getCurrentUser();
  const key = currentUser ? `watchlist_${currentUser.username}` : 'watchlist_guest';
  localStorage.setItem(key, JSON.stringify(watchlist));
}

/**
 * 영화가 워치리스트에 있는지 확인 (Check if in Watchlist)
 * @param {number} movieId - 영화 ID
 * @returns {boolean} 워치리스트 포함 여부
 */
export function isInWatchlist(movieId) {
  return getWatchlist().some(m => m.id === movieId);
}

/* ============================================
   워치리스트 토글 (Toggle Watchlist)
   ============================================ */

/**
 * 워치리스트 추가/제거 토글
 * @param {Object} movie - 영화 객체
 * @param {Event} event - 클릭 이벤트 (전파 방지용)
 */
export function toggleWatchlist(movie, event) {
  event.stopPropagation(); // 카드 클릭 이벤트 전파 방지 (Prevent card click event)

  const watchlist = getWatchlist();
  const index = watchlist.findIndex(m => m.id === movie.id);
  const MAX_WATCHLIST_SIZE = 10;

  if (index > -1) {
    // 워치리스트에서 제거 (Remove from watchlist)
    watchlist.splice(index, 1);
    alert(`"${movie.title}"이(가) 워치리스트에서 제거되었습니다.`);
  } else {
    // 최대 개수 확인 (Check maximum limit)
    if (watchlist.length >= MAX_WATCHLIST_SIZE) {
      alert(`워치리스트는 최대 ${MAX_WATCHLIST_SIZE}개까지만 저장할 수 있습니다.`);
      return;
    }

    // 워치리스트에 추가 (Add to watchlist)
    watchlist.push({
      id: movie.id,
      title: movie.title,
      image: movie.image,
      rating: movie.rating,
      year: movie.year,
      addedAt: new Date().toISOString()
    });
    alert(`"${movie.title}"이(가) 워치리스트에 추가되었습니다.`);
  }

  saveWatchlist(watchlist);
  updateWatchlistIcons(); // 아이콘 상태 업데이트 (Update icon states)
}

/**
 * 워치리스트에서 특정 영화 제거
 * @param {number} movieId - 영화 ID
 * @param {string} encodedTitle - URL 인코딩된 영화 제목
 */
export function removeFromWatchlist(movieId, encodedTitle) {
  const title = decodeURIComponent(encodedTitle);
  const watchlist = getWatchlist();
  const index = watchlist.findIndex(m => m.id === movieId);

  if (index > -1) {
    watchlist.splice(index, 1);
    saveWatchlist(watchlist);
    updateWatchlistIcons();
  }
}

/* ============================================
   UI 업데이트 (UI Update)
   ============================================ */

/**
 * 모든 워치리스트 아이콘 상태 업데이트
 * Update all watchlist icon states
 */
export function updateWatchlistIcons() {
  document.querySelectorAll('.watchlist-btn-icon').forEach(btn => {
    const movieId = parseInt(btn.dataset.movieId);
    if (isInWatchlist(movieId)) {
      btn.classList.add('active');
      btn.innerHTML = '🔖'; // 북마크 아이콘 (Bookmarked)
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '🏷️'; // 일반 태그 아이콘 (Normal tag)
    }
  });
}
