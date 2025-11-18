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

// 영화 목록 렌더링 (DocumentFragment 사용)
function renderMovies(movieList) {
  const container = document.getElementById('movies');
  if (!container) return;

  const fragment = document.createDocumentFragment();

  movieList.forEach((movie, index) => {
    const card = document.createElement('div');
    card.className = 'movie_item';
    card.dataset.movieId = movie.id;
    card.innerHTML = `
      <span class="rank-badge">#${index + 1}</span>
      <span class="rating-badge">★ ${movie.rating}</span>
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
      card.innerHTML = `
        <img src="${tmdbApi.getImageUrl(movie.poster_path, 'w342')}" alt="${movie.title}">
        <div class="daily-movie-info">
          <div class="daily-movie-title">${movie.title}</div>
          <div class="daily-movie-rating">★ ${movie.vote_average.toFixed(1)}</div>
        </div>
      `;
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
   프로필 표시
   ============================================ */

function displayProfileData(profile) {
  const containers = {
    genres: document.getElementById('profileGenres'),
    mood: document.getElementById('profileMood'),
    dislikes: document.getElementById('profileDislikes')
  };

  containers.genres.innerHTML = profile.genres?.length
    ? profile.genres.map(g => `<span class="profile-tag">${getKoreanName('genre', g)}</span>`).join('')
    : '<span class="profile-empty">선호 장르 정보가 없습니다.</span>';

  containers.mood.innerHTML = profile.mood
    ? `<span class="profile-tag">${getKoreanName('mood', profile.mood)}</span>`
    : '<span class="profile-empty">무드 정보가 없습니다.</span>';

  containers.dislikes.innerHTML = profile.dislikes?.length
    ? profile.dislikes.map(d => `<span class="profile-tag">${getKoreanName('dislike', d)}</span>`).join('')
    : '<span class="profile-empty">불호 요소 정보가 없습니다.</span>';
}

function displayEmptyProfile() {
  ['profileGenres', 'profileMood', 'profileDislikes'].forEach(id => {
    const messages = {
      profileGenres: '선호 장르 정보가 없습니다.',
      profileMood: '무드 정보가 없습니다.',
      profileDislikes: '불호 요소 정보가 없습니다.'
    };
    document.getElementById(id).innerHTML = `<span class="profile-empty">${messages[id]}</span>`;
  });
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

  usersDB.push({ username, password });
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
    searchInput.oninput = (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = movies.filter(m => m.title.toLowerCase().includes(keyword));
      renderMovies(filtered.length > 0 ? filtered : movies);
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
    let shouldShowPopup = false;

    if (currentUser) {
      const serverData = localStorage.getItem(`server_${currentUser.username}_profile`);
      if (!serverData) {
        shouldShowPopup = true;
      } else {
        localStorage.setItem('userProfile', serverData);
      }
    } else {
      if (!sessionStorage.getItem('popup_shown')) {
        shouldShowPopup = true;
        sessionStorage.setItem('popup_shown', 'true');
      }
    }

    if (shouldShowPopup) {
      popupFrame.style.display = 'block';
    } else {
      initializeMainContent();
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

  // 모달 외부 클릭
  window.addEventListener('click', (e) => {
    const modals = {
      authModal: closeAuthModal,
      watchlistLoginModal: closeWatchlistLoginModal,
      profileModal: closeProfileModal
    };

    Object.entries(modals).forEach(([id, closeFn]) => {
      if (e.target === document.getElementById(id)) closeFn();
    });
  });
}
