/* ============================================
   TMDB API 모듈 사용
   - tmdbApi.js에서 제공하는 API 서비스 사용
   ============================================ */

/* ============================================
   상수 정의
   ============================================ */
const CONFIG = {
  HERO_CAROUSEL_COUNT: 5,
  DAILY_MOVIES_COUNT: 20,
  INITIAL_MOVIES_COUNT: 20,
  TOTAL_PAGES: 5,
  SCROLL_AMOUNT: 440
};

/* ============================================
   무드 키워드 매핑 (Q3)
   ============================================ */
const MOOD_KEYWORDS = {
  happy: ['comedy', 'adventure', 'family'],
  dark: ['crime', 'thriller', 'mystery'],
  emotional: ['romance', 'drama', 'music'],
  intense: ['action', 'thriller', 'war'],
  thoughtful: ['documentary', 'history', 'drama']
};

/* ============================================
   불호 요소 매핑 (Q4)
   ============================================ */
const DISLIKE_MAPPING = {
  violence: { genres: [28, 80] },
  horror: { genres: [27] },
  sad: { genres: [] },
  slow: { genres: [99, 36] },
  complex: { genres: [9648, 878] }
};

/* ============================================
   장르 ID 매핑 (TMDB 공식)
   ============================================ */
const GENRE_MAP = {
  28: '액션', 12: '모험', 16: '애니메이션', 35: '코미디',
  80: '범죄', 99: '다큐멘터리', 18: '드라마', 10751: '가족',
  14: '판타지', 36: '역사', 27: '공포', 10402: '음악',
  9648: '미스터리', 10749: '로맨스', 878: 'SF', 53: '스릴러',
  10752: '전쟁', 37: '서부'
};

/* ============================================
   영어-한글 매핑 (통합)
   ============================================ */
const KOREAN_NAMES = {
  genre: {
    action: '액션', adventure: '모험', comedy: '코미디', drama: '드라마',
    horror: '공포', scifi: 'SF', romance: '로맨스', thriller: '스릴러',
    animation: '애니메이션', fantasy: '판타지', mystery: '미스터리',
    crime: '범죄', documentary: '다큐멘터리', family: '가족',
    music: '음악', war: '전쟁', western: '서부'
  },
  mood: {
    happy: '밝고 즐거운', dark: '어둡고 무거운', emotional: '감동적인',
    intense: '긴장감 넘치는', thoughtful: '생각을 자극하는'
  },
  dislike: {
    violence: '폭력적인 장면', horror: '공포 요소', sad: '슬픈 결말',
    slow: '느린 전개', complex: '복잡한 줄거리'
  }
};

/* ============================================
   전역 상태
   ============================================ */
let movies = [];
let heroMovies = [];
let currentHeroIndex = 0;
let isShowingAll = false;
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isLoginMode = true;

/* ============================================
   유틸리티 함수
   ============================================ */

// 불호 장르 계산 (중복 제거)
function getDislikedGenres(dislikes) {
  if (!dislikes) return [];
  return dislikes.flatMap(dislike => DISLIKE_MAPPING[dislike]?.genres || []);
}

// 프로필에 불호 장르 추가
function enrichProfileWithDislikedGenres(profile) {
  return {
    ...profile,
    dislikedGenres: getDislikedGenres(profile.dislikes)
  };
}

// 최적의 예고편 선택 (성능 최적화)
function findBestTrailer(videos) {
  const trailers = videos.results.filter(v =>
    v.type === 'Trailer' && v.site === 'YouTube'
  );

  if (trailers.length === 0) return null;

  // 우선순위 점수 계산 후 정렬
  return trailers
    .map(t => ({
      ...t,
      score: (t.official ? 100 : 0) +
             (t.iso_639_1 === 'ko' ? 50 : t.iso_639_1 === 'en' ? 25 : 0)
    }))
    .sort((a, b) => b.score - a.score)[0];
}

// 장르 이름 가져오기 (통합)
function getGenreNames(genreIds) {
  if (!genreIds) return '';
  return genreIds.map(id => GENRE_MAP[id]).filter(Boolean).join(', ');
}

// 한글 이름 가져오기 (통합)
function getKoreanName(type, key) {
  return KOREAN_NAMES[type]?.[key] || key;
}

// TMDB 영화 데이터 변환
function transformMovieData(movie) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.split('-')[0] || 'N/A',
    genre_ids: movie.genre_ids,
    rating: movie.vote_average.toFixed(1),
    likes: `${(movie.vote_count / 1000).toFixed(1)}K`,
    image: tmdbApi.getImageUrl(movie.poster_path, 'w500')
  };
}

/* ============================================
   렌더링 함수 (성능 최적화)
   ============================================ */

// 워치리스트 관리
function getWatchlist() {
  const key = currentUser ? `watchlist_${currentUser.username}` : 'watchlist_guest';
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveWatchlist(watchlist) {
  const key = currentUser ? `watchlist_${currentUser.username}` : 'watchlist_guest';
  localStorage.setItem(key, JSON.stringify(watchlist));
}

function isInWatchlist(movieId) {
  return getWatchlist().some(m => m.id === movieId);
}

function toggleWatchlist(movie, event) {
  event.stopPropagation(); // 카드 클릭 이벤트 전파 방지

  const watchlist = getWatchlist();
  const index = watchlist.findIndex(m => m.id === movie.id);

  if (index > -1) {
    watchlist.splice(index, 1);
    alert(`"${movie.title}"이(가) 워치리스트에서 제거되었습니다.`);
  } else {
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
  // 아이콘 상태 업데이트
  updateWatchlistIcons();
}

function updateWatchlistIcons() {
  document.querySelectorAll('.watchlist-btn-icon').forEach(btn => {
    const movieId = parseInt(btn.dataset.movieId);
    if (isInWatchlist(movieId)) {
      btn.classList.add('active');
      btn.innerHTML = '✓';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '+';
    }
  });
}

// 영화 목록 렌더링 (DocumentFragment 사용)
function renderMovies(movieList) {
  const container = document.getElementById('movies');
  if (!container) return;

  const fragment = document.createDocumentFragment();

  movieList.forEach((movie, index) => {
    const inWatchlist = isInWatchlist(movie.id);
    const card = document.createElement('div');
    card.className = 'movie_item';
    card.dataset.movieId = movie.id;
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <span class="rank-badge">#${index + 1}</span>
      <span class="rating-badge">★ ${movie.rating}</span>
      <button class="watchlist-btn-icon ${inWatchlist ? 'active' : ''}"
              data-movie-id="${movie.id}"
              title="${inWatchlist ? '워치리스트에서 제거' : '워치리스트에 추가'}">
        ${inWatchlist ? '✓' : '+'}
      </button>
      <img src="${movie.image}" alt="${movie.title}">
      <div class="movie-info">
        <div class="title">${movie.title}</div>
        <div class="movie-meta">${movie.year} · ${getGenreNames(movie.genre_ids)}</div>
        <div class="movie-stats">
          <span class="likes">좋아요 ${movie.likes}</span>
          <span class="star-rating">★ ${movie.rating}</span>
        </div>
      </div>
    `;
    // 영화 카드 클릭 시 상세 모달 열기
    card.onclick = () => openMovieDetailModal(movie.id);

    // 워치리스트 버튼 클릭
    const watchlistBtn = card.querySelector('.watchlist-btn-icon');
    watchlistBtn.onclick = (e) => toggleWatchlist(movie, e);

    fragment.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

// 히어로 캐러셀 렌더링
function renderHeroCarousel() {
  const track = document.getElementById('heroCarouselTrack');
  const dotsContainer = document.getElementById('heroCarouselDots');

  if (!track || !dotsContainer) return;

  const trackFragment = document.createDocumentFragment();
  const dotsFragment = document.createDocumentFragment();

  heroMovies.forEach((movie, index) => {
    const backdropUrl = movie.backdrop_path
      ? tmdbApi.getImageUrl(movie.backdrop_path, 'original')
      : '';
    const hasTrailer = movie.trailer?.key;

    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    slide.style.backgroundImage = backdropUrl
      ? `linear-gradient(rgba(15, 23, 42, 0.7), rgba(26, 35, 50, 0.9)), url(${backdropUrl})`
      : 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e293b 100%)';

    slide.innerHTML = `
      <div class="hero-content">
        <span class="badge">${index === 0 ? '추천 영화' : `추천 #${index + 1}`}</span>
        <h1 class="hero-title">${movie.title}</h1>
        <p class="hero-info">평점 ${movie.vote_average.toFixed(1)} | ${movie.release_date?.split('-')[0] || 'N/A'} | ${getGenreNames(movie.genre_ids)}</p>
        <p class="hero-desc">${movie.overview || '영화 설명이 없습니다.'}</p>
        <div class="hero-buttons">
          <button class="btn-play ${!hasTrailer ? 'disabled' : ''}"
                  data-movie-id="${movie.id}"
                  data-trailer-key="${hasTrailer || ''}">
            ▶ 예고편 보기
          </button>
        </div>
      </div>
      <div class="hero-rating">평점 ${movie.vote_average.toFixed(1)}</div>
    `;
    trackFragment.appendChild(slide);

    // 도트 생성
    const dot = document.createElement('button');
    dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToHeroSlide(index));
    dotsFragment.appendChild(dot);
  });

  track.innerHTML = '';
  dotsContainer.innerHTML = '';
  track.appendChild(trackFragment);
  dotsContainer.appendChild(dotsFragment);

  updateHeroCarousel();
  setupHeroButtonEvents();
}

/* ============================================
   데이터 로딩 함수
   ============================================ */

// 인기 영화 100개 가져오기
async function fetchMovies() {
  try {
    const pagePromises = Array.from(
      { length: CONFIG.TOTAL_PAGES },
      (_, i) => tmdbApi.getPopularMovies(i + 1)
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

// 히어로 캐러셀 로드
async function loadHeroCarousel() {
  try {
    const savedProfile = localStorage.getItem('userProfile');
    let movieList;

    if (savedProfile) {
      const profile = enrichProfileWithDislikedGenres(JSON.parse(savedProfile));
      const data = await tmdbApi.getPersonalizedRecommendations(profile);
      movieList = data.results.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
    } else {
      const data = await tmdbApi.getPopularMovies(1);
      movieList = data.results.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
    }

    // 예고편 정보 병렬 로드
    heroMovies = await Promise.all(
      movieList.map(async (movie) => {
        try {
          const videos = await tmdbApi.getMovieVideos(movie.id);
          return { ...movie, trailer: findBestTrailer(videos) };
        } catch {
          return { ...movie, trailer: null };
        }
      })
    );

    renderHeroCarousel();
    setupHeroCarouselEvents();
  } catch (error) {
    console.error('히어로 캐러셀 로딩 실패:', error);
  }
}

// 일일 추천 로드
async function loadDailyRecommendations() {
  try {
    const container = document.getElementById('dailyMovieScroll');
    if (!container) return;

    const savedProfile = localStorage.getItem('userProfile');
    let movieList;

    if (savedProfile) {
      const profile = enrichProfileWithDislikedGenres(JSON.parse(savedProfile));
      const randomPage = Math.floor(Math.random() * 2) + 2;
      const data = await tmdbApi.getPersonalizedRecommendations({ ...profile, page: randomPage });
      movieList = data.results.slice(0, CONFIG.DAILY_MOVIES_COUNT);
    } else {
      const data = await tmdbApi.getTrending('movie', 'week');
      movieList = data.results.slice(0, CONFIG.DAILY_MOVIES_COUNT);
    }

    // DocumentFragment로 성능 최적화
    const fragment = document.createDocumentFragment();
    movieList.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'daily-movie-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <img src="${tmdbApi.getImageUrl(movie.poster_path, 'w342')}" alt="${movie.title}">
        <div class="daily-movie-info">
          <div class="daily-movie-title">${movie.title}</div>
          <div class="daily-movie-rating">★ ${movie.vote_average.toFixed(1)}</div>
        </div>
      `;
      // 일일 추천 카드 클릭 시 상세 모달 열기
      card.onclick = () => openMovieDetailModal(movie.id);
      fragment.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    setupDailyScrollButtons();
  } catch (error) {
    console.error('일일 추천 로딩 실패:', error);
  }
}

/* ============================================
   캐러셀 컨트롤
   ============================================ */

function updateHeroCarousel() {
  const track = document.getElementById('heroCarouselTrack');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');

  if (!track) return;

  track.style.transform = `translateX(-${currentHeroIndex * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentHeroIndex));

  if (prevBtn) prevBtn.disabled = currentHeroIndex === 0;
  if (nextBtn) nextBtn.disabled = currentHeroIndex >= heroMovies.length - 1;
}

function goToHeroSlide(index) {
  currentHeroIndex = index;
  updateHeroCarousel();
}

function setupHeroCarouselEvents() {
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');

  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
      if (currentHeroIndex > 0) {
        currentHeroIndex--;
        updateHeroCarousel();
      }
    };

    nextBtn.onclick = () => {
      if (currentHeroIndex < heroMovies.length - 1) {
        currentHeroIndex++;
        updateHeroCarousel();
      }
    };
  }
}

function setupHeroButtonEvents() {
  document.querySelectorAll('.btn-play').forEach(btn => {
    btn.onclick = function() {
      if (this.classList.contains('disabled')) {
        alert('이 영화의 예고편이 없습니다.');
        return;
      }
      const trailerKey = this.dataset.trailerKey;
      if (trailerKey) openTrailerModal(trailerKey);
    };
  });
}

function setupDailyScrollButtons() {
  const container = document.getElementById('dailyMovieScroll');
  const prevBtn = document.getElementById('dailyPrev');
  const nextBtn = document.getElementById('dailyNext');

  if (!container || !prevBtn || !nextBtn) return;

  prevBtn.onclick = () => container.scrollBy({ left: -CONFIG.SCROLL_AMOUNT, behavior: 'smooth' });
  nextBtn.onclick = () => container.scrollBy({ left: CONFIG.SCROLL_AMOUNT, behavior: 'smooth' });
}

/* ============================================
   모달 관리
   ============================================ */

function openTrailerModal(trailerKey) {
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

function closeTrailerModal() {
  const modal = document.getElementById('trailerModal');
  const iframe = document.getElementById('trailerIframe');
  if (iframe) iframe.src = '';
  if (modal) modal.style.display = 'none';
}

function openAuthModal(mode) {
  const modal = document.getElementById('authModal');
  const elements = {
    title: document.getElementById('authTitle'),
    submit: document.getElementById('authSubmitBtn'),
    switchText: document.getElementById('authSwitchText'),
    switchLink: document.getElementById('authSwitchLink')
  };

  isLoginMode = mode === 'login';

  const text = isLoginMode
    ? { title: '로그인', submit: '로그인', switch: '계정이 없으신가요?', link: '회원가입' }
    : { title: '회원가입', submit: '회원가입', switch: '이미 계정이 있으신가요?', link: '로그인' };

  elements.title.textContent = text.title;
  elements.submit.textContent = text.submit;
  elements.switchText.textContent = text.switch;
  elements.switchLink.textContent = text.link;

  modal.style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('authForm').reset();
}

function openWatchlistLoginModal() {
  document.getElementById('watchlistLoginModal').style.display = 'flex';
}

function closeWatchlistLoginModal() {
  document.getElementById('watchlistLoginModal').style.display = 'none';
}

function openProfileModal() {
  const userProfile = localStorage.getItem('userProfile');

  if (userProfile) {
    displayProfileData(JSON.parse(userProfile));
  } else {
    displayEmptyProfile();
  }

  document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

/* ============================================
   영화 상세 모달
   ============================================ */

async function openMovieDetailModal(movieId) {
  const modal = document.getElementById('movieDetailModal');
  const content = document.getElementById('movieDetailContent');

  // 로딩 표시
  content.innerHTML = `
    <div class="movie-detail-loading">
      <div class="spinner"></div>
      <p>영화 정보를 불러오는 중...</p>
    </div>
  `;
  modal.style.display = 'flex';

  try {
    // 영화 전체 정보와 스트리밍 정보 병렬 로드
    const [movie, watchProviders] = await Promise.all([
      tmdbApi.getCompleteMovieInfo(movieId),
      tmdbApi.getWatchProviders(movieId)
    ]);

    // 예고편 찾기
    const trailer = findBestTrailer(movie.videos || { results: [] });

    // 한국 스트리밍 정보 추출
    const krProviders = watchProviders.results?.KR || null;

    // 상세 페이지 렌더링
    renderMovieDetail(movie, trailer, krProviders);
  } catch (error) {
    console.error('영화 상세 정보 로딩 실패:', error);
    content.innerHTML = `
      <div class="movie-detail-loading">
        <p>영화 정보를 불러올 수 없습니다.</p>
        <button class="btn-primary" onclick="closeMovieDetailModal()">닫기</button>
      </div>
    `;
  }
}

function closeMovieDetailModal() {
  document.getElementById('movieDetailModal').style.display = 'none';
}

// 한국에서 실제 사용 가능한 스트리밍 서비스 URL 매핑
const STREAMING_URLS = {
  8: { name: 'Netflix', url: 'https://www.netflix.com/search?q=' },
  337: { name: 'Disney+', url: 'https://www.disneyplus.com/ko-kr/search?q=' },
  356: { name: 'wavve', url: 'https://www.wavve.com/search?searchWord=' },
  97: { name: 'Watcha', url: 'https://watcha.com/search?query=' },
  1796: { name: 'Netflix basic with Ads', url: 'https://www.netflix.com/search?q=' },
  1899: { name: 'Max', url: 'https://www.max.com/search?q=' },
  531: { name: 'Paramount+', url: 'https://www.paramountplus.com/search?q=' },
  350: { name: 'Apple TV+', url: 'https://tv.apple.com/kr/search?term=' },
  2: { name: 'Apple TV', url: 'https://tv.apple.com/kr/search?term=' },
  3: { name: 'Google Play 무비', url: 'https://play.google.com/store/search?q=' },
  68: { name: 'Microsoft Store', url: 'https://www.microsoft.com/ko-kr/search?q=' },
  96: { name: 'Naver Store', url: 'https://series.naver.com/search/search.series?query=' }
};

function renderMovieDetail(movie, trailer, watchProviders = null) {
  const content = document.getElementById('movieDetailContent');
  const backdropUrl = movie.backdrop_path
    ? tmdbApi.getImageUrl(movie.backdrop_path, 'w1280')
    : '';
  const posterUrl = movie.poster_path
    ? tmdbApi.getImageUrl(movie.poster_path, 'w500')
    : 'https://via.placeholder.com/500x750?text=No+Image';

  // 평점 별 계산 (10점 만점 -> 5점 만점)
  const starRating = Math.round(movie.vote_average / 2);
  const stars = '★'.repeat(starRating) + '☆'.repeat(5 - starRating);

  // 러닝타임 포맷
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}시간 ${movie.runtime % 60}분`
    : '정보 없음';

  // 출연진 (상위 8명)
  const cast = movie.credits?.cast?.slice(0, 8) || [];

  // 리뷰 (상위 3개)
  const reviews = movie.reviews?.results?.slice(0, 3) || [];

  // 비슷한 영화 (상위 6개)
  const similarMovies = movie.similar?.results?.slice(0, 6) || [];

  content.innerHTML = `
    <!-- 배경 이미지 -->
    <div class="movie-detail-backdrop" style="background-image: ${backdropUrl ? `url(${backdropUrl})` : 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e293b 100%)'}"></div>

    <!-- 메인 정보 -->
    <div class="movie-detail-main">
      <div class="movie-detail-poster-section">
        <div class="movie-detail-poster">
          <img src="${posterUrl}" alt="${movie.title}">
        </div>
        <!-- 포스터 아래 간단 정보 -->
        <div class="movie-poster-info">
          ${movie.tagline ? `<p class="movie-tagline">"${movie.tagline}"</p>` : ''}
          <div class="movie-quick-stats">
            <div class="quick-stat">
              <span class="quick-stat-value">${movie.vote_average.toFixed(1)}</span>
              <span class="quick-stat-label">평점</span>
            </div>
            <div class="quick-stat">
              <span class="quick-stat-value">${movie.vote_count.toLocaleString()}</span>
              <span class="quick-stat-label">평가수</span>
            </div>
            <div class="quick-stat">
              <span class="quick-stat-value">${movie.runtime || '-'}</span>
              <span class="quick-stat-label">분</span>
            </div>
          </div>
        </div>
      </div>
      <div class="movie-detail-info">
        <h1 class="movie-detail-title">${movie.title}</h1>
        ${movie.original_title !== movie.title ? `<p class="movie-detail-original-title">${movie.original_title}</p>` : ''}

        <div class="movie-detail-meta">
          <span>📅 ${movie.release_date?.split('-')[0] || 'N/A'}</span>
          <span>⏱️ ${runtime}</span>
          ${movie.production_countries?.[0] ? `<span>🌍 ${movie.production_countries[0].name}</span>` : ''}
        </div>

        <div class="movie-detail-rating">
          <span class="rating-score">${movie.vote_average.toFixed(1)}</span>
          <div class="rating-details">
            <span class="rating-stars">${stars}</span>
            <span class="rating-count">${movie.vote_count.toLocaleString()}명 평가</span>
          </div>
        </div>

        <div class="movie-detail-genres">
          ${movie.genres?.map(g => `<span class="genre-tag">${g.name}</span>`).join('') || ''}
        </div>

        <!-- 줄거리를 오른쪽 정보 영역에 배치 -->
        ${movie.overview ? `
        <div class="movie-inline-overview">
          <h4>줄거리</h4>
          <p>${movie.overview}</p>
        </div>
        ` : ''}

        <div class="movie-detail-actions">
          <button class="btn-trailer ${!trailer ? 'disabled' : ''}"
                  onclick="${trailer ? `openTrailerModal('${trailer.key}')` : `alert('예고편이 없습니다.')`}">
            ▶ 예고편 보기
          </button>
          <button class="btn-watch ${!watchProviders ? 'disabled' : ''}"
                  onclick="${watchProviders ? `openWatchProvidersModal(${movie.id}, '${encodeURIComponent(movie.title)}')` : `alert('스트리밍 정보가 없습니다.')`}">
            🎬 보러가기
          </button>
        </div>
      </div>
    </div>

    <!-- 출연진 -->
    ${cast.length > 0 ? `
    <div class="movie-detail-section">
      <h3>🎭 출연진</h3>
      <div class="cast-list">
        ${cast.map(actor => `
          <div class="cast-item">
            <img src="${actor.profile_path ? tmdbApi.getImageUrl(actor.profile_path, 'w185') : 'https://via.placeholder.com/80x80?text=No+Image'}"
                 alt="${actor.name}"
                 onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
            <div class="cast-name">${actor.name}</div>
            <div class="cast-character">${actor.character || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- 리뷰 (서평) -->
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
              <button class="review-toggle" onclick="toggleReview(this)">더보기</button>
            </div>
          `;
        }).join('')}
      </div>
      ` : `<p class="no-reviews">아직 등록된 리뷰가 없습니다.</p>`}
    </div>

    <!-- 비슷한 영화 -->
    ${similarMovies.length > 0 ? `
    <div class="movie-detail-section">
      <h3>🎬 비슷한 영화</h3>
      <div class="similar-movies">
        ${similarMovies.map(m => `
          <div class="similar-movie-item" onclick="openMovieDetailModal(${m.id})">
            <img src="${m.poster_path ? tmdbApi.getImageUrl(m.poster_path, 'w185') : 'https://via.placeholder.com/120x180?text=No+Image'}"
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

function toggleReview(btn) {
  const content = btn.previousElementSibling;
  if (content.classList.contains('truncated')) {
    content.classList.remove('truncated');
    btn.textContent = '접기';
  } else {
    content.classList.add('truncated');
    btn.textContent = '더보기';
  }
}

// 스트리밍 서비스 선택 모달
let currentWatchProviders = null;

async function openWatchProvidersModal(movieId, encodedTitle) {
  const title = decodeURIComponent(encodedTitle);

  try {
    const watchData = await tmdbApi.getWatchProviders(movieId);
    const krProviders = watchData.results?.KR;

    if (!krProviders) {
      alert('한국에서 이용 가능한 스트리밍 서비스가 없습니다.');
      return;
    }

    currentWatchProviders = { providers: krProviders, title, link: krProviders.link };

    // 모든 제공자 합치기 (스트리밍, 대여, 구매)
    const allProviders = [
      ...(krProviders.flatrate || []).map(p => ({ ...p, type: '구독' })),
      ...(krProviders.rent || []).map(p => ({ ...p, type: '대여' })),
      ...(krProviders.buy || []).map(p => ({ ...p, type: '구매' }))
    ];

    // 중복 제거 (provider_id 기준) + 알려진 서비스만 필터링
    const uniqueProviders = allProviders
      .filter((provider, index, self) =>
        index === self.findIndex(p => p.provider_id === provider.provider_id)
      )
      .filter(provider => STREAMING_URLS[provider.provider_id]);

    if (uniqueProviders.length === 0) {
      alert('이용 가능한 스트리밍 서비스가 없습니다.');
      return;
    }

    // 모달 생성
    let modal = document.getElementById('watchProvidersModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'watchProvidersModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content watch-providers-modal">
          <span class="modal-close" onclick="closeWatchProvidersModal()">&times;</span>
          <h2>🎬 보러가기</h2>
          <p class="watch-providers-subtitle">시청 가능한 서비스를 선택하세요</p>
          <div id="watchProvidersList" class="watch-providers-list"></div>
          <a id="tmdbWatchLink" href="#" target="_blank" class="tmdb-watch-link">
            TMDB에서 더 많은 정보 보기 →
          </a>
        </div>
      `;
      document.body.appendChild(modal);
      modal.onclick = (e) => e.target === modal && closeWatchProvidersModal();
    }

    // 제공자 목록 렌더링
    const listContainer = document.getElementById('watchProvidersList');
    listContainer.innerHTML = uniqueProviders.map(provider => {
      const streamingInfo = STREAMING_URLS[provider.provider_id];
      const searchUrl = streamingInfo
        ? streamingInfo.url + encodeURIComponent(title)
        : krProviders.link;

      return `
        <a href="${searchUrl}" target="_blank" class="watch-provider-item">
          <img src="${tmdbApi.getImageUrl(provider.logo_path, 'w92')}"
               alt="${provider.provider_name}"
               onerror="this.src='https://via.placeholder.com/45x45?text=?'">
          <div class="watch-provider-info">
            <span class="watch-provider-name">${provider.provider_name}</span>
            <span class="watch-provider-type">${provider.type}</span>
          </div>
        </a>
      `;
    }).join('');

    // TMDB 링크 설정
    document.getElementById('tmdbWatchLink').href = krProviders.link || '#';

    modal.style.display = 'flex';
  } catch (error) {
    console.error('스트리밍 정보 로딩 실패:', error);
    alert('스트리밍 정보를 불러올 수 없습니다.');
  }
}

function closeWatchProvidersModal() {
  const modal = document.getElementById('watchProvidersModal');
  if (modal) modal.style.display = 'none';
}

/* ============================================
   프로필 표시
   ============================================ */

function displayProfileData(profile) {
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

  // 사용자 정보
  if (containers.username && currentUser) {
    containers.username.textContent = currentUser.username;
  }
  if (containers.joinDate && currentUser?.joinDate) {
    containers.joinDate.textContent = `가입일: ${new Date(currentUser.joinDate).toLocaleDateString('ko-KR')}`;
  } else if (containers.joinDate) {
    containers.joinDate.textContent = '가입일: -';
  }

  // 통계
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

  // 선호 장르 (숫자 ID는 GENRE_MAP, 문자열은 KOREAN_NAMES 사용)
  containers.genres.innerHTML = profile.genres?.length
    ? profile.genres.map(g => {
        const name = typeof g === 'number' ? GENRE_MAP[g] : getKoreanName('genre', g);
        return `<span class="tag">${name || g}</span>`;
      }).join('')
    : '<span class="profile-empty">선호 장르 정보가 없습니다.</span>';

  // 무드
  containers.mood.innerHTML = profile.mood
    ? `<span class="tag highlight">${getKoreanName('mood', profile.mood)}</span>`
    : '<span class="profile-empty">설정되지 않음</span>';

  // 탐색 스타일
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

  // 불호 요소
  containers.dislikes.innerHTML = profile.dislikes?.length
    ? profile.dislikes.map(d => `<span class="tag">${getKoreanName('dislike', d)}</span>`).join('')
    : '<span class="profile-empty">피하고 싶은 장르 정보가 없습니다.</span>';

  // 평가한 영화
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

function displayEmptyProfile() {
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

  // 통계 초기화
  const stats = { profileGenreCount: '0', profileRatingCount: '0', profileAvgRating: '-' };
  Object.entries(stats).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // 사용자 정보
  const usernameEl = document.getElementById('profileUsername');
  const joinDateEl = document.getElementById('profileJoinDate');
  if (usernameEl) usernameEl.textContent = currentUser?.username || '게스트';
  if (joinDateEl) joinDateEl.textContent = '가입일: -';
}

/* ============================================
   인증 관련
   ============================================ */

function updateAuthUI() {
  const loginBtn = document.querySelector('.login-btn');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');

  if (currentUser) {
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = currentUser.username;
  } else {
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

function login(username, password) {
  const user = usersDB.find(u => u.username === username && u.password === password);

  if (!user) {
    alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    return;
  }

  currentUser = { username: user.username };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  alert('로그인 성공!');
  closeAuthModal();
  updateAuthUI();
  uploadLocalDataToServer();

  const serverKey = `server_${currentUser.username}_profile`;
  const serverData = localStorage.getItem(serverKey);

  if (serverData) {
    localStorage.setItem('userProfile', serverData);
    const track = document.querySelector('#heroCarouselTrack');
    if (track?.children.length > 0) {
      loadHeroCarousel();
      loadDailyRecommendations();
    } else {
      initializeMainContent();
    }
  } else {
    const popupFrame = document.getElementById('popupFrame');
    if (popupFrame) popupFrame.style.display = 'block';
  }
}

function signup(username, password) {
  if (usersDB.find(u => u.username === username)) {
    alert('이미 사용 중인 아이디입니다.');
    return;
  }

  if (username.length < 4) {
    alert('아이디는 4자 이상이어야 합니다.');
    return;
  }

  if (password.length < 6) {
    alert('비밀번호는 6자 이상이어야 합니다.');
    return;
  }

  usersDB.push({ username, password, joinDate: new Date().toISOString() });
  localStorage.setItem('usersDB', JSON.stringify(usersDB));

  alert('회원가입 성공! 로그인해주세요.');
  openAuthModal('login');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  alert('로그아웃되었습니다.');
  updateAuthUI();
  loadHeroCarousel();
}

function uploadLocalDataToServer() {
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile && currentUser) {
    localStorage.setItem(`server_${currentUser.username}_profile`, userProfile);
  }
}

/* ============================================
   메인 초기화
   ============================================ */

function initializeMainContent() {
  loadHeroCarousel();
  loadDailyRecommendations();
  fetchMovies();
  setupMainPageEvents();
}

function setupMainPageEvents() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.oninput = async (e) => {
      clearTimeout(searchTimeout);
      const keyword = e.target.value.trim();

      // 검색어가 비어있으면 원래 목록 표시
      if (keyword.length === 0) {
        renderMovies(movies.slice(0, isShowingAll ? movies.length : CONFIG.INITIAL_MOVIES_COUNT));
        return;
      }

      // 2글자 미만이면 로컬 필터링만
      if (keyword.length < 2) {
        const filtered = movies.filter(m => m.title.toLowerCase().includes(keyword.toLowerCase()));
        renderMovies(filtered.length > 0 ? filtered : movies);
        return;
      }

      // 2글자 이상이면 TMDB API 검색 (한국어+영어 병렬)
      searchTimeout = setTimeout(async () => {
        try {
          const [koData, enData] = await Promise.all([
            tmdbApi.searchMovies(keyword, 1, { language: 'ko-KR' }),
            tmdbApi.searchMovies(keyword, 1, { language: 'en-US' })
          ]);

          // 중복 제거 (ID 기준)
          const allMovies = [...koData.results];
          enData.results.forEach(movie => {
            if (!allMovies.find(m => m.id === movie.id)) {
              allMovies.push(movie);
            }
          });

          if (allMovies.length === 0) {
            // 검색 결과 없음 표시
            const container = document.getElementById('movies');
            if (container) {
              container.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            }
            return;
          }

          // 검색 결과를 기존 형식으로 변환하여 렌더링
          const searchResults = allMovies.slice(0, 20).map(transformMovieData);
          renderMovies(searchResults);
        } catch (error) {
          console.error('영화 검색 실패:', error);
          // 오류 시 로컬 필터링으로 폴백
          const filtered = movies.filter(m => m.title.toLowerCase().includes(keyword.toLowerCase()));
          renderMovies(filtered.length > 0 ? filtered : movies);
        }
      }, 300);
    };
  }
}

/* ============================================
   이벤트 리스너 설정 (통합)
   ============================================ */

window.addEventListener('DOMContentLoaded', () => {
  // 개발자 모드: 초기화
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === 'true') {
    localStorage.removeItem('survey_completed');
    localStorage.removeItem('userProfile');
    sessionStorage.removeItem('popup_shown');
    if (currentUser) {
      localStorage.removeItem(`server_${currentUser.username}_profile`);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const popupFrame = document.getElementById('popupFrame');
  updateAuthUI();

  if (popupFrame) {
    if (currentUser) {
      // 로그인 상태: 팝업 표시 안 함, 서버 데이터 있으면 로드
      const serverData = localStorage.getItem(`server_${currentUser.username}_profile`);
      if (serverData) {
        localStorage.setItem('userProfile', serverData);
      }
      initializeMainContent();
    } else {
      // 비로그인 상태: 항상 팝업 표시
      popupFrame.style.display = 'block';
    }
  }

  // 이벤트 리스너 등록
  setupEventListeners();
});

function setupEventListeners() {
  // 팝업 메시지
  window.addEventListener('message', (event) => {
    if (event.data.action === 'closePopup') {
      const popupFrame = document.getElementById('popupFrame');
      if (popupFrame) popupFrame.style.display = 'none';
      initializeMainContent();
    }
  });

  // 더보기 버튼
  const viewMoreBtn = document.getElementById('viewMoreBtn');
  if (viewMoreBtn) {
    viewMoreBtn.onclick = () => {
      isShowingAll = true;
      renderMovies(movies);
      viewMoreBtn.style.display = 'none';
    };
  }

  // 로그인 버튼
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.onclick = () => openAuthModal('login');
  }

  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      if (confirm('로그아웃 하시겠습니까?')) logout();
    };
  }

  // 인증 모달
  const authModalClose = document.querySelector('#authModal .modal-close');
  if (authModalClose) authModalClose.onclick = closeAuthModal;

  const authSwitchLink = document.getElementById('authSwitchLink');
  if (authSwitchLink) {
    authSwitchLink.onclick = (e) => {
      e.preventDefault();
      openAuthModal(isLoginMode ? 'signup' : 'login');
    };
  }

  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.onsubmit = (e) => {
      e.preventDefault();
      const username = document.getElementById('authUsername').value;
      const password = document.getElementById('authPassword').value;
      isLoginMode ? login(username, password) : signup(username, password);
    };
  }

  // Watchlist
  const watchlistBtn = document.getElementById('watchlistBtn');
  if (watchlistBtn) {
    watchlistBtn.onclick = () => {
      currentUser ? alert('Watchlist 페이지 기능은 준비 중입니다.') : openWatchlistLoginModal();
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

  // 프로필
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.onclick = () => {
      currentUser ? openProfileModal() : (alert('로그인이 필요합니다.'), openAuthModal('login'));
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

  // 영화 상세 모달
  const movieDetailModalClose = document.querySelector('#movieDetailModal .modal-close');
  if (movieDetailModalClose) {
    movieDetailModalClose.onclick = closeMovieDetailModal;
  }

  // 모달 외부 클릭
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
