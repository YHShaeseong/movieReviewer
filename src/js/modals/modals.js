/* ============================================
   모달 관리 모듈 (Modal Manager)

   역할:
   - 각종 모달 창 열기/닫기 관리
   - 인증 모달, 프로필 모달, 영화 상세 모달, 워치리스트 모달 등
   - 모달 내용 렌더링 및 이벤트 처리
   ============================================ */

import { GENRE_MAP, KOREAN_NAMES, STREAMING_URLS } from '../config/constants.js';
import { getGenreNames, findBestTrailer, getKoreanName } from '../utils/utils.js';
import { getCurrentUser } from '../auth/auth.js';
import { getWatchlist, removeFromWatchlist } from '../watchlist/watchlist.js';

/* ============================================
   모달 상태 (Modal State)
   ============================================ */

// 로그인 모드 여부 (Login mode flag)
let isLoginMode = true;

/* ============================================
   인증 모달 (Authentication Modal)
   ============================================ */

/**
 * 인증 모달 열기 (로그인/회원가입)
 * @param {string} mode - 'login' 또는 'signup'
 */
export function openAuthModal(mode) {
  const modal = document.getElementById('authModal');
  const elements = {
    title: document.getElementById('authTitle'),
    submit: document.getElementById('authSubmitBtn'),
    switchText: document.getElementById('authSwitchText'),
    switchLink: document.getElementById('authSwitchLink')
  };

  isLoginMode = mode === 'login';

  // 모드에 따른 텍스트 설정 (Set text based on mode)
  const text = isLoginMode
    ? { title: '로그인', submit: '로그인', switch: '계정이 없으신가요?', link: '회원가입' }
    : { title: '회원가입', submit: '회원가입', switch: '이미 계정이 있으신가요?', link: '로그인' };

  elements.title.textContent = text.title;
  elements.submit.textContent = text.submit;
  elements.switchText.textContent = text.switch;
  elements.switchLink.textContent = text.link;

  modal.style.display = 'flex';
}

/**
 * 인증 모달 닫기
 */
export function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('authForm').reset();
}

/**
 * 로그인 모드 여부 반환
 * @returns {boolean} 로그인 모드 여부
 */
export function getIsLoginMode() {
  return isLoginMode;
}

/* ============================================
   워치리스트 로그인 필요 모달
   ============================================ */

/**
 * 워치리스트 로그인 필요 모달 열기
 */
export function openWatchlistLoginModal() {
  document.getElementById('watchlistLoginModal').style.display = 'flex';
}

/**
 * 워치리스트 로그인 필요 모달 닫기
 */
export function closeWatchlistLoginModal() {
  document.getElementById('watchlistLoginModal').style.display = 'none';
}

/* ============================================
   프로필 모달 (Profile Modal)
   ============================================ */

/**
 * 프로필 모달 열기
 */
export function openProfileModal() {
  const userProfile = localStorage.getItem('userProfile');

  if (userProfile) {
    displayProfileData(JSON.parse(userProfile));
  } else {
    displayEmptyProfile();
  }

  document.getElementById('profileModal').style.display = 'flex';
}

/**
 * 프로필 모달 닫기
 */
export function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

/**
 * 프로필 데이터 표시
 * @param {Object} profile - 사용자 프로필 객체
 */
function displayProfileData(profile) {
  const currentUser = getCurrentUser();
  const containers = {
    genres: document.getElementById('profileGenres'),
    mood: document.getElementById('profileMood'),
    dislikes: document.getElementById('profileDislikes'),
    exploration: document.getElementById('profileExploration'),
    ratedMovies: document.getElementById('profileRatedMovies'),
    username: document.getElementById('profileUsername'),
    joinDate: document.getElementById('profileJoinDate'),
    genreCount: document.getElementById('profileGenreCount'),
    ratingCount: document.getElementById('profileRatingCount'),
    avgRating: document.getElementById('profileAvgRating')
  };

  // 사용자 정보 표시 (Display user info)
  if (containers.username && currentUser) {
    containers.username.textContent = currentUser.username;
  }
  if (containers.joinDate && currentUser?.joinDate) {
    containers.joinDate.textContent = `가입일: ${new Date(currentUser.joinDate).toLocaleDateString('ko-KR')}`;
  } else if (containers.joinDate) {
    containers.joinDate.textContent = '가입일: -';
  }

  // 통계 표시 (Display statistics)
  if (containers.genreCount) {
    containers.genreCount.textContent = profile.genres?.length || 0;
  }

  const ratings = profile.ratings || [];
  if (containers.ratingCount) {
    containers.ratingCount.textContent = ratings.length;
  }
  if (containers.avgRating) {
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      containers.avgRating.textContent = avg.toFixed(1);
    } else {
      containers.avgRating.textContent = '-';
    }
  }

  // 선호 장르 (Favorite genres)
  containers.genres.innerHTML = profile.genres?.length
    ? profile.genres.map(g => {
        const name = typeof g === 'number' ? GENRE_MAP[g] : getKoreanName('genre', g);
        return `<span class="tag">${name || g}</span>`;
      }).join('')
    : '<span class="profile-empty">선호 장르 정보가 없습니다.</span>';

  // 무드 (Mood)
  containers.mood.innerHTML = profile.mood
    ? `<span class="tag highlight">${getKoreanName('mood', profile.mood)}</span>`
    : '<span class="profile-empty">설정되지 않음</span>';

  // 탐색 스타일 (Exploration style)
  if (containers.exploration) {
    const explorationNames = {
      'popularity.desc': '인기도 (많은 사람들이 본 영화)',
      'vote_average.desc': '평점 (평가가 좋은 영화)',
      'release_date.desc': '최신성 (최근 개봉한 영화)',
      'revenue.desc': '흥행성 (박스오피스 성공작)'
    };
    containers.exploration.innerHTML = profile.exploration
      ? `<span class="tag highlight">${explorationNames[profile.exploration] || profile.exploration}</span>`
      : '<span class="profile-empty">탐색 기준 정보가 없습니다.</span>';
  }

  // 불호 요소 (Dislikes)
  containers.dislikes.innerHTML = profile.dislikes?.length
    ? profile.dislikes.map(d => `<span class="tag">${getKoreanName('dislike', d)}</span>`).join('')
    : '<span class="profile-empty">피하고 싶은 장르 정보가 없습니다.</span>';

  // 평가한 영화 (Rated movies)
  if (containers.ratedMovies) {
    if (ratings.length > 0) {
      const recentRatings = ratings.slice(-5).reverse();
      containers.ratedMovies.innerHTML = recentRatings.map(r => `
        <div class="rated-movie-item">
          <img class="rated-movie-poster" src="https://image.tmdb.org/t/p/w92${r.poster_path || ''}"
               alt="${r.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 60%22><rect fill=%22%23333%22 width=%2240%22 height=%2260%22/></svg>'">
          <div class="rated-movie-info">
            <div class="rated-movie-title">${r.title}</div>
            <div class="rated-movie-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          </div>
        </div>
      `).join('');
    } else {
      containers.ratedMovies.innerHTML = '<span class="profile-empty">평가한 영화가 없습니다.</span>';
    }
  }
}

/**
 * 빈 프로필 표시
 */
function displayEmptyProfile() {
  const currentUser = getCurrentUser();
  const messages = {
    profileGenres: '선호 장르 정보가 없습니다.',
    profileMood: '무드 정보가 없습니다.',
    profileDislikes: '피하고 싶은 장르 정보가 없습니다.',
    profileExploration: '탐색 기준 정보가 없습니다.',
    profileRatedMovies: '평가한 영화가 없습니다.'
  };

  Object.entries(messages).forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<span class="profile-empty">${msg}</span>`;
  });

  // 통계 초기화 (Reset statistics)
  const stats = { profileGenreCount: '0', profileRatingCount: '0', profileAvgRating: '-' };
  Object.entries(stats).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // 사용자 정보 (User info)
  const usernameEl = document.getElementById('profileUsername');
  const joinDateEl = document.getElementById('profileJoinDate');
  if (usernameEl) usernameEl.textContent = currentUser?.username || '게스트';
  if (joinDateEl) joinDateEl.textContent = '가입일: -';
}

/* ============================================
   예고편 모달 (Trailer Modal)
   ============================================ */

/**
 * 예고편 모달 열기
 * @param {string} trailerKey - YouTube 비디오 키
 */
export function openTrailerModal(trailerKey) {
  let modal = document.getElementById('trailerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trailerModal';
    modal.className = 'trailer-modal';
    modal.innerHTML = `
      <div class="trailer-modal-content">
        <span class="trailer-modal-close">&times;</span>
        <div class="trailer-container">
          <iframe id="trailerIframe" src="" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.trailer-modal-close').onclick = closeTrailerModal;
    modal.onclick = (e) => e.target === modal && closeTrailerModal();
  }

  document.getElementById('trailerIframe').src =
    `https://www.youtube.com/embed/${trailerKey}?autoplay=1`;
  modal.style.display = 'flex';
}

/**
 * 예고편 모달 닫기
 */
export function closeTrailerModal() {
  const modal = document.getElementById('trailerModal');
  const iframe = document.getElementById('trailerIframe');
  if (iframe) iframe.src = '';
  if (modal) modal.style.display = 'none';
}

/* ============================================
   영화 상세 모달 (Movie Detail Modal)
   ============================================ */

/**
 * 영화 상세 모달 열기
 * @param {number} movieId - 영화 ID
 */
export async function openMovieDetailModal(movieId) {
  const modal = document.getElementById('movieDetailModal');
  const content = document.getElementById('movieDetailContent');

  // 로딩 표시 (Show loading)
  content.innerHTML = `
    <div class="movie-detail-loading">
      <div class="spinner"></div>
      <p>영화 정보를 불러오는 중...</p>
    </div>
  `;
  modal.style.display = 'flex';

  try {
    // 영화 정보와 스트리밍 정보 병렬 로드 (Load movie info and streaming in parallel)
    const [movie, watchProviders] = await Promise.all([
      window.tmdbApi.getCompleteMovieInfo(movieId),
      window.tmdbApi.getWatchProviders(movieId)
    ]);

    // 예고편 찾기 (Find trailer)
    const trailer = findBestTrailer(movie.videos || { results: [] });

    // 한국 스트리밍 정보 (Korean streaming providers)
    const krProviders = watchProviders.results?.KR || null;

    // 상세 페이지 렌더링 (Render detail page)
    renderMovieDetail(movie, trailer, krProviders);
  } catch (error) {
    console.error('영화 상세 정보 로딩 실패:', error);
    content.innerHTML = `
      <div class="movie-detail-loading">
        <p>영화 정보를 불러올 수 없습니다.</p>
        <button class="btn-primary" onclick="window.closeMovieDetailModal()">닫기</button>
      </div>
    `;
  }
}

/**
 * 영화 상세 모달 닫기
 */
export function closeMovieDetailModal() {
  document.getElementById('movieDetailModal').style.display = 'none';
}

/**
 * 영화 상세 정보 렌더링
 * @param {Object} movie - 영화 객체
 * @param {Object} trailer - 예고편 객체
 * @param {Object} watchProviders - 스트리밍 제공자 정보
 */
function renderMovieDetail(movie, trailer, watchProviders = null) {
  const content = document.getElementById('movieDetailContent');
  const backdropUrl = movie.backdrop_path
    ? window.tmdbApi.getImageUrl(movie.backdrop_path, 'w1280')
    : '';
  const posterUrl = movie.poster_path
    ? window.tmdbApi.getImageUrl(movie.poster_path, 'w500')
    : 'https://via.placeholder.com/500x750?text=No+Image';

  // 평점 별 계산 제거됨 (Star rating calculation removed)
  // 러닝타임 포맷 제거됨 (Runtime format removed)

  // 출연진, 리뷰, 비슷한 영화 (Cast, reviews, similar movies)
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const reviews = movie.reviews?.results?.slice(0, 3) || [];
  const similarMovies = movie.similar?.results?.slice(0, 6) || [];

  content.innerHTML = `
    <!-- 배경 이미지 (Background image) -->
    <div class="movie-detail-backdrop" style="background-image: ${backdropUrl ? `url(${backdropUrl})` : 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e293b 100%)'}"></div>

    <!-- 메인 정보 (Main info) -->
    <div class="movie-detail-main">
      <div class="movie-detail-poster-section">
        <div class="movie-detail-poster">
          <img src="${posterUrl}" alt="${movie.title}">
        </div>
        <div class="movie-poster-info">
          ${movie.tagline ? `<p class="movie-tagline">"${movie.tagline}"</p>` : ''}
        </div>
      </div>
      <div class="movie-detail-info">
        <h1 class="movie-detail-title">${movie.title}</h1>
        ${movie.original_title !== movie.title ? `<p class="movie-detail-original-title">${movie.original_title}</p>` : ''}

        <div class="movie-detail-meta">
          <span>📅 ${movie.release_date?.split('-')[0] || 'N/A'}</span>
          ${movie.production_countries?.[0] ? `<span>🌍 ${movie.production_countries[0].name}</span>` : ''}
        </div>

        <div class="movie-detail-genres">
          ${movie.genres?.map(g => `<span class="genre-tag">${g.name}</span>`).join('') || ''}
        </div>

        ${movie.overview ? `
        <div class="movie-inline-overview">
          <h4>줄거리</h4>
          <p>${movie.overview}</p>
        </div>
        ` : ''}

        <div class="movie-detail-actions">
          <button class="btn-trailer ${!trailer ? 'disabled' : ''}"
                  onclick="${trailer ? `window.openTrailerModal('${trailer.key}')` : `alert('예고편이 없습니다.')`}">
            ▶ 예고편 보기
          </button>
          <button class="btn-watch ${!watchProviders ? 'disabled' : ''}"
                  onclick="${watchProviders ? `window.openWatchProvidersModal(${movie.id}, '${encodeURIComponent(movie.title)}')` : `alert('스트리밍 정보가 없습니다.')`}">
            🎬 보러가기
          </button>
        </div>
      </div>
    </div>

    <!-- 출연진 (Cast) -->
    ${cast.length > 0 ? `
    <div class="movie-detail-section">
      <h3>🎭 출연진</h3>
      <div class="cast-list">
        ${cast.map(actor => `
          <div class="cast-item">
            <img src="${actor.profile_path ? window.tmdbApi.getImageUrl(actor.profile_path, 'w185') : 'https://via.placeholder.com/80x80?text=No+Image'}"
                 alt="${actor.name}"
                 onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
            <div class="cast-name">${actor.name}</div>
            <div class="cast-character">${actor.character || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 리뷰 (Reviews) -->
    <div class="movie-detail-section">
      <h3>💬 평점 및 리뷰</h3>
      ${reviews.length > 0 ? `
      <div class="reviews-list">
        ${reviews.map(review => {
          const rating = review.author_details?.rating;
          const date = review.created_at ? new Date(review.created_at).toLocaleDateString('ko-KR') : '';
          const initial = review.author?.charAt(0).toUpperCase() || '?';
          return `
            <div class="review-item">
              <div class="review-header">
                <div class="review-author">
                  <div class="review-avatar">${initial}</div>
                  <div>
                    <div class="review-author-name">${review.author}</div>
                    <div class="review-date">${date}</div>
                  </div>
                </div>
                ${rating ? `<span class="review-rating">★ ${rating.toFixed(1)}</span>` : ''}
              </div>
              <div class="review-content truncated">${review.content}</div>
              <button class="review-toggle" onclick="window.toggleReview(this)">더보기</button>
            </div>
          `;
        }).join('')}
      </div>
      ` : `<p class="no-reviews">아직 등록된 리뷰가 없습니다.</p>`}
    </div>

    <!-- 비슷한 영화 (Similar movies) -->
    ${similarMovies.length > 0 ? `
    <div class="movie-detail-section">
      <h3>🎬 비슷한 영화</h3>
      <div class="similar-movies">
        ${similarMovies.map(m => `
          <div class="similar-movie-item" onclick="window.openMovieDetailModal(${m.id})">
            <img src="${m.poster_path ? window.tmdbApi.getImageUrl(m.poster_path, 'w185') : 'https://via.placeholder.com/120x180?text=No+Image'}"
                 alt="${m.title}"
                 onerror="this.src='https://via.placeholder.com/120x180?text=No+Image'">
            <div class="similar-movie-title">${m.title}</div>
            <div class="similar-movie-rating">★ ${m.vote_average.toFixed(1)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

/**
 * 리뷰 더보기/접기 토글
 * @param {HTMLElement} btn - 토글 버튼 요소
 */
export function toggleReview(btn) {
  const content = btn.previousElementSibling;
  if (content.classList.contains('truncated')) {
    content.classList.remove('truncated');
    btn.textContent = '접기';
  } else {
    content.classList.add('truncated');
    btn.textContent = '더보기';
  }
}

/* ============================================
   스트리밍 서비스 모달 (Streaming Providers Modal)
   ============================================ */

/**
 * 스트리밍 서비스 선택 모달 열기
 * @param {number} movieId - 영화 ID
 * @param {string} encodedTitle - URL 인코딩된 영화 제목
 */
export async function openWatchProvidersModal(movieId, encodedTitle) {
  const title = decodeURIComponent(encodedTitle);

  try {
    const watchData = await window.tmdbApi.getWatchProviders(movieId);
    const krProviders = watchData.results?.KR;

    if (!krProviders) {
      alert('한국에서 이용 가능한 스트리밍 서비스가 없습니다.');
      return;
    }

    // 모든 제공자 합치기 (Combine all providers)
    const allProviders = [
      ...(krProviders.flatrate || []).map(p => ({ ...p, type: '구독' })),
      ...(krProviders.rent || []).map(p => ({ ...p, type: '대여' })),
      ...(krProviders.buy || []).map(p => ({ ...p, type: '구매' }))
    ];

    // 중복 제거 + 알려진 서비스만 필터링 (Remove duplicates + filter known services)
    const uniqueProviders = allProviders
      .filter((provider, index, self) =>
        index === self.findIndex(p => p.provider_id === provider.provider_id)
      )
      .filter(provider => STREAMING_URLS[provider.provider_id]);

    if (uniqueProviders.length === 0) {
      alert('이용 가능한 스트리밍 서비스가 없습니다.');
      return;
    }

    // 플랫폼이 1개만 있으면 바로 해당 플랫폼으로 이동 (If only one platform, go directly)
    if (uniqueProviders.length === 1) {
      const provider = uniqueProviders[0];
      const streamingInfo = STREAMING_URLS[provider.provider_id];
      const searchUrl = streamingInfo
        ? streamingInfo.url + encodeURIComponent(title)
        : krProviders.link;

      window.open(searchUrl, '_blank');
      return;
    }

    // 모달 생성 (Create modal)
    let modal = document.getElementById('watchProvidersModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'watchProvidersModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content watch-providers-modal">
          <span class="modal-close" onclick="window.closeWatchProvidersModal()">&times;</span>
          <h2>🎬 보러가기</h2>
          <p class="watch-providers-subtitle">시청 가능한 서비스를 선택하세요</p>
          <div id="watchProvidersList" class="watch-providers-list"></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.onclick = (e) => e.target === modal && closeWatchProvidersModal();
    }

    // 제공자 목록 렌더링 (Render providers list)
    const listContainer = document.getElementById('watchProvidersList');
    listContainer.innerHTML = uniqueProviders.map(provider => {
      const streamingInfo = STREAMING_URLS[provider.provider_id];
      const searchUrl = streamingInfo
        ? streamingInfo.url + encodeURIComponent(title)
        : krProviders.link;

      return `
        <a href="${searchUrl}" target="_blank" class="watch-provider-item">
          <img src="${window.tmdbApi.getImageUrl(provider.logo_path, 'w92')}"
               alt="${provider.provider_name}"
               onerror="this.src='https://via.placeholder.com/45x45?text=?'">
          <div class="watch-provider-info">
            <span class="watch-provider-name">${provider.provider_name}</span>
            <span class="watch-provider-type">${provider.type}</span>
          </div>
        </a>
      `;
    }).join('');

    document.getElementById('tmdbWatchLink').href = krProviders.link || '#';
    modal.style.display = 'flex';
  } catch (error) {
    console.error('스트리밍 정보 로딩 실패:', error);
    alert('스트리밍 정보를 불러올 수 없습니다.');
  }
}

/**
 * 스트리밍 서비스 모달 닫기
 */
export function closeWatchProvidersModal() {
  const modal = document.getElementById('watchProvidersModal');
  if (modal) modal.style.display = 'none';
}

/* ============================================
   워치리스트 모달 (Watchlist Modal)
   ============================================ */

/**
 * 워치리스트 모달 열기
 */
export function openWatchlistModal() {
  const watchlist = getWatchlist();

  // 모달 생성 (Create modal)
  let modal = document.getElementById('watchlistModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'watchlistModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content watchlist-modal">
        <span class="modal-close" onclick="window.closeWatchlistModal()">&times;</span>
        <h2>🔖 내 워치리스트</h2>
        <div id="watchlistContent" class="watchlist-content"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => e.target === modal && closeWatchlistModal();
  }

  // 워치리스트 내용 렌더링 (Render watchlist content)
  const content = document.getElementById('watchlistContent');

  if (watchlist.length === 0) {
    content.innerHTML = `
      <div class="watchlist-empty">
        <p>🏷️ 아직 저장한 영화가 없습니다.</p>
        <p>영화 카드의 북마크 아이콘을 눌러 추가해보세요!</p>
      </div>
    `;
  } else {
    content.innerHTML = `
      <p class="watchlist-count">총 ${watchlist.length}개의 영화</p>
      <div class="watchlist-items">
        ${watchlist.map(movie => `
          <div class="watchlist-item" data-movie-id="${movie.id}">
            <img src="${movie.image}" alt="${movie.title}"
                 onclick="window.closeWatchlistModal(); window.openMovieDetailModal(${movie.id});"
                 onerror="this.src='https://via.placeholder.com/60x90?text=No+Image'">
            <div class="watchlist-item-info">
              <div class="watchlist-item-title">${movie.title}</div>
              <div class="watchlist-item-meta">${movie.year || ''} · ★ ${movie.rating}</div>
            </div>
            <button class="watchlist-item-remove" onclick="window.removeFromWatchlistModal(${movie.id}, '${encodeURIComponent(movie.title)}')" title="삭제">
              ✕
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  modal.style.display = 'flex';
}

/**
 * 워치리스트 모달 닫기
 */
export function closeWatchlistModal() {
  const modal = document.getElementById('watchlistModal');
  if (modal) modal.style.display = 'none';
}

/**
 * 워치리스트 모달에서 영화 제거
 * @param {number} movieId - 영화 ID
 * @param {string} encodedTitle - URL 인코딩된 영화 제목
 */
export function removeFromWatchlistModal(movieId, encodedTitle) {
  removeFromWatchlist(movieId, encodedTitle);
  openWatchlistModal(); // 모달 갱신 (Refresh modal)
}
