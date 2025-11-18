/* ============================================
   TMDB API 모듈 사용
   - tmdbApi.js에서 제공하는 API 서비스 사용
   ============================================ */

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
  violence: { genres: [28, 80], keywords: [] },  // 액션, 범죄
  horror: { genres: [27], keywords: [] },  // 공포
  sad: { genres: [], keywords: [] },
  slow: { genres: [99, 36], keywords: [] },  // 다큐, 역사
  complex: { genres: [9648, 878], keywords: [] }  // 미스터리, SF
};

/* ============================================
   장르 ID 매핑 (TMDB 공식)
   ============================================ */
const GENRE_MAP = {
  28: '액션',
  12: '모험',
  16: '애니메이션',
  35: '코미디',
  80: '범죄',
  99: '다큐멘터리',
  18: '드라마',
  10751: '가족',
  14: '판타지',
  36: '역사',
  27: '공포',
  10402: '음악',
  9648: '미스터리',
  10749: '로맨스',
  878: 'SF',
  53: '스릴러',
  10752: '전쟁',
  37: '서부'
};

/* ============================================
   영화 데이터 배열
   수정 포인트: TMDB API에서 자동으로 가져옴
   ============================================ */
let movies = [];

/* ============================================
   함수: 영화 목록을 화면에 표시
   - movieList: 표시할 영화 배열
   - 영화 카드 HTML을 생성하여 #movies에 추가
   ============================================ */
function renderMovies(movieList) {
  const container = document.getElementById('movies');
  container.innerHTML = ''; // 기존 내용 초기화

  movieList.forEach((movie, index) => {
    // 장르 이름 가져오기
    const genreNames = movie.genre_ids
      ? movie.genre_ids.map(id => GENRE_MAP[id] || '').filter(Boolean).join(', ')
      : getGenreName(movie.genre);

    // 영화 카드 HTML 생성
    const movieCard = `
      <div class="movie_item" data-movie-id="${movie.id}">
        <span class="rank-badge">#${index + 1}</span>
        <span class="rating-badge">★ ${movie.rating}</span>
        <img src="${movie.image}" alt="${movie.title}">
        <div class="movie-info">
          <div class="title">${movie.title}</div>
          <div class="movie-meta">${movie.year} · ${genreNames}</div>
          <div class="movie-stats">
            <span class="likes">좋아요 ${movie.likes}</span>
            <span class="star-rating">★ ${movie.rating}</span>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += movieCard;
  });
}

/* ============================================
   함수: 장르 코드를 한글로 변환
   - genre: 영어 장르 코드 (예: 'action')
   - 반환값: 한글 장르명 (예: '액션')
   수정 포인트: 새로운 장르 추가
   ============================================ */
function getGenreName(genre) {
  const genreMap = {
    action: '액션',
    drama: '드라마',
    comedy: '코미디',
    horror: '공포',
    sf: 'SF',
    romance: '로맨스',
    thriller: '스릴러',
    animation: '애니메이션'
  };
  return genreMap[genre] || genre; // 매칭되는 장르가 없으면 원본 반환
}

/* ============================================
   메인 페이지 이벤트 핸들러 설정
   ============================================ */
function setupMainPageEvents() {
  // 장르 필터링
  const genreBtns = document.querySelectorAll('.genre-btn');
  if (genreBtns.length > 0) {
    genreBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const genre = this.dataset.genre;
        const filtered = movies.filter(movie => movie.genre === genre);
        renderMovies(filtered.length > 0 ? filtered : movies);
        document.querySelectorAll('.genre-btn').forEach(b => b.style.backgroundColor = 'white');
        this.style.backgroundColor = '#eff6ff';
      });
    });
  }

  // 영화 검색
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const keyword = e.target.value.toLowerCase();
      const filtered = movies.filter(movie =>
        movie.title.toLowerCase().includes(keyword)
      );
      renderMovies(filtered.length > 0 ? filtered : movies);
    });
  }

  // 로그인 버튼
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      alert('로그인 페이지로 이동합니다.');
    });
  }
}

/* ============================================
   TMDB API에서 영화 데이터 가져오기 (새로운 API 모듈 사용)
   ============================================ */
async function fetchMovies() {
  try {
    // tmdbApi 모듈의 getTopRatedMovies 메서드 사용
    const data = await tmdbApi.getTopRatedMovies(1);

    // TMDB 데이터를 화면 표시 형식으로 변환
    movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      genre_ids: movie.genre_ids,
      rating: movie.vote_average.toFixed(1),
      likes: `${(movie.vote_count / 1000).toFixed(1)}K`,
      image: tmdbApi.getImageUrl(movie.poster_path, 'w500')
    }));

    renderMovies(movies);
  } catch (error) {
    console.error('영화 데이터 로딩 실패:', error);
  }
}

/* ============================================
   히어로 캐러셀 로드
   ============================================ */
let heroMovies = [];
let currentHeroIndex = 0;

async function loadHeroCarousel() {
  try {
    const savedProfile = localStorage.getItem('userProfile');

    let movies = [];

    if (savedProfile) {
      // 프로필이 있으면 개인화된 추천 영화 가져오기 (새 API 모듈 사용)
      const profile = JSON.parse(savedProfile);

      // 불호 장르 계산
      const withoutGenres = [];
      if (profile.dislikes) {
        profile.dislikes.forEach(dislike => {
          const mapping = DISLIKE_MAPPING[dislike];
          if (mapping && mapping.genres) {
            withoutGenres.push(...mapping.genres);
          }
        });
      }

      // dislikedGenres에 추가
      profile.dislikedGenres = withoutGenres;

      // tmdbApi의 getPersonalizedRecommendations 사용
      const data = await tmdbApi.getPersonalizedRecommendations(profile);
      movies = data.results.slice(0, 5);
    } else {
      // 프로필이 없으면 인기 영화 가져오기
      const data = await tmdbApi.getPopularMovies(1);
      movies = data.results.slice(0, 5);
    }

    // 각 영화의 비디오 정보 가져오기 (예고편 확인)
    const moviesWithVideos = await Promise.all(
      movies.map(async (movie) => {
        try {
          const videos = await tmdbApi.getMovieVideos(movie.id);

          // 우선순위로 예고편 선택
          // 1순위: 공식 한국어 예고편
          let trailer = videos.results.find(v =>
            v.type === 'Trailer' &&
            v.site === 'YouTube' &&
            v.official === true &&
            v.iso_639_1 === 'ko'
          );

          // 2순위: 공식 영어 예고편
          if (!trailer) {
            trailer = videos.results.find(v =>
              v.type === 'Trailer' &&
              v.site === 'YouTube' &&
              v.official === true &&
              v.iso_639_1 === 'en'
            );
          }

          // 3순위: 공식 예고편 (언어 무관)
          if (!trailer) {
            trailer = videos.results.find(v =>
              v.type === 'Trailer' &&
              v.site === 'YouTube' &&
              v.official === true
            );
          }

          // 4순위: 아무 예고편
          if (!trailer) {
            trailer = videos.results.find(v =>
              v.type === 'Trailer' &&
              v.site === 'YouTube'
            );
          }

          return { ...movie, trailer };
        } catch (error) {
          console.error(`비디오 로드 실패 (영화 ID: ${movie.id}):`, error);
          return { ...movie, trailer: null };
        }
      })
    );

    heroMovies = moviesWithVideos;
    renderHeroCarousel();
    setupHeroCarouselEvents();
  } catch (error) {
    console.error('히어로 캐러셀 로딩 실패:', error);
  }
}

function renderHeroCarousel() {
  const track = document.getElementById('heroCarouselTrack');
  const dotsContainer = document.getElementById('heroCarouselDots');

  if (!track || !dotsContainer) {
    console.error('Carousel elements not found!');
    return;
  }

  track.innerHTML = '';
  dotsContainer.innerHTML = '';

  heroMovies.forEach((movie, index) => {
    const genreNames = movie.genre_ids.map(id => GENRE_MAP[id] || '').filter(Boolean).join(', ');
    // tmdbApi 모듈의 getImageUrl 사용
    const backdropUrl = movie.backdrop_path ? tmdbApi.getImageUrl(movie.backdrop_path, 'original') : '';

    // 예고편 있는지 확인
    const hasTrailer = movie.trailer && movie.trailer.key;

    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    slide.style.backgroundImage = backdropUrl ?
      `linear-gradient(rgba(15, 23, 42, 0.7), rgba(26, 35, 50, 0.9)), url(${backdropUrl})` :
      'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e293b 100%)';

    slide.innerHTML = `
      <div class="hero-content">
        <span class="badge">${index === 0 ? '추천 영화' : `추천 #${index + 1}`}</span>
        <h1 class="hero-title">${movie.title}</h1>
        <p class="hero-info">평점 ${movie.vote_average.toFixed(1)} | ${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'} | ${genreNames}</p>
        <p class="hero-desc">${movie.overview || '영화 설명이 없습니다.'}</p>
        <div class="hero-buttons">
          <button class="btn-play ${!hasTrailer ? 'disabled' : ''}" data-movie-id="${movie.id}" data-trailer-key="${hasTrailer ? movie.trailer.key : ''}">
            ▶ 예고편 보기
          </button>
        </div>
      </div>
      <div class="hero-rating">평점 ${movie.vote_average.toFixed(1)}</div>
    `;

    track.appendChild(slide);

    // 도트 생성
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToHeroSlide(index));
    dotsContainer.appendChild(dot);
  });

  updateHeroCarousel();
  setupHeroButtonEvents();
}

function setupHeroButtonEvents() {
  // 플레이 버튼 이벤트 추가
  document.querySelectorAll('.btn-play').forEach(btn => {
    btn.addEventListener('click', function() {
      // disabled 버튼은 클릭 무시
      if (this.classList.contains('disabled')) {
        alert('이 영화의 예고편이 없습니다.');
        return;
      }

      const trailerKey = this.dataset.trailerKey;
      if (trailerKey) {
        openTrailerModal(trailerKey);
      }
    });
  });
}

/* ============================================
   예고편 모달 열기/닫기
   ============================================ */
function openTrailerModal(trailerKey) {
  // 모달이 없으면 생성
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

    // 닫기 버튼 이벤트
    const closeBtn = modal.querySelector('.trailer-modal-close');
    closeBtn.addEventListener('click', closeTrailerModal);

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeTrailerModal();
      }
    });
  }

  // YouTube 임베드 URL 설정
  const iframe = document.getElementById('trailerIframe');
  iframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1`;

  // 모달 표시
  modal.style.display = 'flex';
}

function closeTrailerModal() {
  const modal = document.getElementById('trailerModal');
  const iframe = document.getElementById('trailerIframe');

  // 비디오 중지 (iframe src 초기화)
  iframe.src = '';

  // 모달 숨김
  modal.style.display = 'none';
}

function updateHeroCarousel() {
  const track = document.getElementById('heroCarouselTrack');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');

  if (!track) return;

  track.style.transform = `translateX(-${currentHeroIndex * 100}%)`;

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentHeroIndex);
  });

  // 버튼 비활성화
  if (prevBtn) prevBtn.disabled = currentHeroIndex === 0;
  if (nextBtn) nextBtn.disabled = currentHeroIndex >= heroMovies.length - 1;
}

function goToHeroSlide(index) {
  currentHeroIndex = index;
  updateHeroCarousel();
}

function setupHeroCarouselEvents() {
  // 이전 슬라이드
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentHeroIndex > 0) {
        currentHeroIndex--;
        updateHeroCarousel();
      }
    });

    // 다음 슬라이드
    nextBtn.addEventListener('click', () => {
      if (currentHeroIndex < heroMovies.length - 1) {
        currentHeroIndex++;
        updateHeroCarousel();
      }
    });
  }
}

/* ============================================
   오늘 이건 어떤데? 섹션 로드
   ============================================ */
async function loadDailyRecommendations() {
  try {
    const savedProfile = localStorage.getItem('userProfile');
    const container = document.getElementById('dailyMovieScroll');

    if (!container) return;

    let movies = [];

    if (savedProfile) {
      // 사용자 취향 기반 추천
      const profile = JSON.parse(savedProfile);

      // 불호 장르 계산
      const withoutGenres = [];
      if (profile.dislikes) {
        profile.dislikes.forEach(dislike => {
          const mapping = DISLIKE_MAPPING[dislike];
          if (mapping && mapping.genres) {
            withoutGenres.push(...mapping.genres);
          }
        });
      }

      profile.dislikedGenres = withoutGenres;

      // 개인화 추천 (페이지 2-3 랜덤)
      const randomPage = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const data = await tmdbApi.getPersonalizedRecommendations({
        ...profile,
        page: randomPage
      });
      movies = data.results.slice(0, 20); // 20개 영화
    } else {
      // 프로필 없으면 트렌딩 영화
      const data = await tmdbApi.getTrending('movie', 'week');
      movies = data.results.slice(0, 20);
    }

    // 영화 카드 렌더링
    container.innerHTML = '';
    movies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'daily-movie-card';
      card.innerHTML = `
        <img src="${tmdbApi.getImageUrl(movie.poster_path, 'w342')}" alt="${movie.title}">
        <div class="daily-movie-info">
          <div class="daily-movie-title">${movie.title}</div>
          <div class="daily-movie-rating">★ ${movie.vote_average.toFixed(1)}</div>
        </div>
      `;
      container.appendChild(card);
    });

    // 스크롤 버튼 이벤트 설정
    setupDailyScrollButtons();
  } catch (error) {
    console.error('일일 추천 로딩 실패:', error);
  }
}

/* ============================================
   가로 스크롤 버튼 이벤트
   ============================================ */
function setupDailyScrollButtons() {
  const container = document.getElementById('dailyMovieScroll');
  const prevBtn = document.getElementById('dailyPrev');
  const nextBtn = document.getElementById('dailyNext');

  if (!container || !prevBtn || !nextBtn) return;

  // 이전 버튼
  prevBtn.addEventListener('click', () => {
    container.scrollBy({
      left: -440, // 카드 2개 너비 (200px * 2 + gap)
      behavior: 'smooth'
    });
  });

  // 다음 버튼
  nextBtn.addEventListener('click', () => {
    container.scrollBy({
      left: 440,
      behavior: 'smooth'
    });
  });
}

/* ============================================
   메인 콘텐츠 초기화 함수
   - 히어로 캐러셀, 일일 추천, TOP100 영화 로드
   ============================================ */
function initializeMainContent() {
  loadHeroCarousel();
  loadDailyRecommendations();
  fetchMovies();
  setupMainPageEvents();
}

/* ============================================
   인증 (로그인/회원가입) 관련 변수 및 상태
   ============================================ */
// 간단한 사용자 데이터베이스 (실제로는 서버 DB 사용)
// 구조: [{ username: '아이디', password: '비밀번호' }]
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isLoginMode = true;

/* ============================================
   팝업 iframe 제어
   ============================================ */

// 페이지 로드 시 팝업 표시 및 인증 상태 확인
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔥 DOMContentLoaded 이벤트 실행됨');

  // URL 파라미터로 초기화 기능 추가 (개발자 모드)
  // 사용법: index.html?reset=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === 'true') {
    console.log('🔄 개발자 모드: localStorage 및 sessionStorage 초기화');
    localStorage.removeItem('survey_completed');
    localStorage.removeItem('userProfile');
    sessionStorage.removeItem('popup_shown');
    // 서버 데이터도 초기화 (개발 모드)
    if (currentUser) {
      const serverKey = `server_${currentUser.username}_profile`;
      localStorage.removeItem(serverKey);
    }
    // URL에서 reset 파라미터 제거하고 리로드
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const popupFrame = document.getElementById('popupFrame');

  console.log('📌 popupFrame:', popupFrame);
  console.log('📌 currentUser:', currentUser);

  // 로그인 상태 확인 및 UI 업데이트
  updateAuthUI();

  if (popupFrame) {
    let shouldShowPopup = false;

    if (currentUser) {
      // 로그인한 사용자: 서버에 저장된 프로필 확인
      console.log('✅ 로그인 사용자: 서버 데이터 확인');
      const serverKey = `server_${currentUser.username}_profile`;
      const serverData = localStorage.getItem(serverKey);

      console.log('📌 서버 프로필 데이터:', serverData);

      if (!serverData) {
        // 서버에 프로필이 없으면 팝업 표시
        shouldShowPopup = true;
        console.log('✅ 팝업 표시: 서버에 프로필 없음');
      } else {
        // 서버에 프로필이 있으면 로드하고 메인 콘텐츠 표시
        localStorage.setItem('userProfile', serverData);
        console.log('✅ 메인 콘텐츠 로드: 서버 프로필 있음');
      }
    } else {
      // 비로그인 사용자: 세션당 한 번씩 무조건 팝업 표시
      console.log('✅ 비로그인 사용자: 세션 기반 팝업 확인');
      const sessionPopupShown = sessionStorage.getItem('popup_shown');

      console.log('📌 sessionStorage popup_shown:', sessionPopupShown);

      if (!sessionPopupShown) {
        // 이번 세션에 팝업을 표시하지 않았으면 무조건 표시
        shouldShowPopup = true;
        sessionStorage.setItem('popup_shown', 'true');
        console.log('✅ 팝업 표시: 세션 첫 방문');
      } else {
        // 이미 이번 세션에 팝업을 표시했으면 메인 콘텐츠 로드
        console.log('✅ 메인 콘텐츠 로드: 세션 내 재방문');
      }
    }

    // 팝업 표시 여부 결정
    if (shouldShowPopup) {
      popupFrame.style.display = 'block';
    } else {
      initializeMainContent();
    }
  } else {
    console.error('❌ popupFrame 요소를 찾을 수 없음!');
  }
});

// 팝업에서 메시지 받기 (닫기 이벤트)
window.addEventListener('message', (event) => {
  console.log('📨 메시지 수신:', event.data);

  if (event.data.action === 'closePopup') {
    console.log('✅ closePopup 액션 수신됨');
    const popupFrame = document.getElementById('popupFrame');
    if (popupFrame) {
      popupFrame.style.display = 'none';
      console.log('✅ 팝업 숨김 처리 완료');
    }
    // 메인 콘텐츠 초기화 (히어로 캐러셀, 일일 추천, TOP100)
    initializeMainContent();
  }
});

/* ============================================
   인증 UI 업데이트
   - 로그인 상태에 따라 버튼 표시/숨김
   ============================================ */
function updateAuthUI() {
  const loginBtn = document.querySelector('.login-btn');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');

  if (currentUser) {
    // 로그인 상태: 사용자 정보 표시
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = currentUser.username;
  } else {
    // 비로그인 상태: 로그인 버튼 표시
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

/* ============================================
   인증 모달 이벤트 핸들러
   ============================================ */
// 로그인 버튼 클릭
const loginBtn = document.querySelector('.login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    openAuthModal('login');
  });
}

// 로그아웃 버튼 클릭
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  });
}

/* ============================================
   인증 모달 열기/닫기
   - mode: 'login' 또는 'signup'
   ============================================ */
function openAuthModal(mode) {
  const modal = document.getElementById('authModal');
  const authTitle = document.getElementById('authTitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authSwitchText = document.getElementById('authSwitchText');
  const authSwitchLink = document.getElementById('authSwitchLink');

  isLoginMode = mode === 'login';

  if (isLoginMode) {
    authTitle.textContent = '로그인';
    authSubmitBtn.textContent = '로그인';
    authSwitchText.textContent = '계정이 없으신가요?';
    authSwitchLink.textContent = '회원가입';
  } else {
    authTitle.textContent = '회원가입';
    authSubmitBtn.textContent = '회원가입';
    authSwitchText.textContent = '이미 계정이 있으신가요?';
    authSwitchLink.textContent = '로그인';
  }

  modal.style.display = 'flex';
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'none';
  document.getElementById('authForm').reset();
}

// 모달 닫기 버튼 이벤트
const authModalClose = document.querySelector('#authModal .modal-close');
if (authModalClose) {
  authModalClose.addEventListener('click', closeAuthModal);
}

// 로그인/회원가입 전환 링크
const authSwitchLink = document.getElementById('authSwitchLink');
if (authSwitchLink) {
  authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(isLoginMode ? 'signup' : 'login');
  });
}

// 인증 폼 제출
const authForm = document.getElementById('authForm');
if (authForm) {
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;

    if (isLoginMode) {
      // 로그인 처리
      login(username, password);
    } else {
      // 회원가입 처리
      signup(username, password);
    }
  });
}

/* ============================================
   로그인 처리
   - localStorage의 사용자 데이터 확인
   - 성공 시 서버 데이터 확인 후 프로필 로드 또는 팝업 표시
   ============================================ */
function login(username, password) {
  // 아이디와 비밀번호로 사용자 찾기
  const user = usersDB.find(u => u.username === username && u.password === password);

  if (user) {
    // 로그인 성공: 현재 사용자 정보 저장
    currentUser = { username: user.username };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    alert('로그인 성공!');
    closeAuthModal();
    updateAuthUI();

    // LocalStorage 데이터를 서버로 업로드 (로그인 전 작성한 데이터가 있을 경우)
    uploadLocalDataToServer();

    // 서버에 저장된 프로필 확인
    const serverKey = `server_${currentUser.username}_profile`;
    const serverData = localStorage.getItem(serverKey);

    if (serverData) {
      // 서버에 프로필이 있으면 로드하고 메인 콘텐츠 표시
      localStorage.setItem('userProfile', serverData);
      console.log('✅ 서버 프로필 로드 완료');

      // 메인 콘텐츠가 이미 로드되어 있으면 새로고침
      if (document.querySelector('#heroCarouselTrack').children.length > 0) {
        loadHeroCarousel();
        loadDailyRecommendations();
      } else {
        initializeMainContent();
      }
    } else {
      // 서버에 프로필이 없으면 팝업 표시
      console.log('✅ 서버 프로필 없음: 팝업 표시');
      const popupFrame = document.getElementById('popupFrame');
      if (popupFrame) {
        popupFrame.style.display = 'block';
      }
    }
  } else {
    alert('아이디 또는 비밀번호가 일치하지 않습니다.');
  }
}

/* ============================================
   회원가입 처리
   - 새 사용자를 usersDB에 추가
   ============================================ */
function signup(username, password) {
  // 아이디 중복 확인
  const existingUser = usersDB.find(u => u.username === username);

  if (existingUser) {
    alert('이미 사용 중인 아이디입니다.');
    return;
  }

  // 아이디 유효성 검사
  if (username.length < 4) {
    alert('아이디는 4자 이상이어야 합니다.');
    return;
  }

  // 비밀번호 유효성 검사
  if (password.length < 6) {
    alert('비밀번호는 6자 이상이어야 합니다.');
    return;
  }

  // 새 사용자 추가
  usersDB.push({ username, password });
  localStorage.setItem('usersDB', JSON.stringify(usersDB));

  alert('회원가입 성공! 로그인해주세요.');
  openAuthModal('login');
}

/* ============================================
   로그아웃 처리
   ============================================ */
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');

  alert('로그아웃되었습니다.');
  updateAuthUI();

  // 히어로 캐러셀 새로고침
  loadHeroCarousel();
}

/* ============================================
   LocalStorage 데이터를 서버로 업로드 (시뮬레이션)
   - 실제로는 fetch로 서버 API 호출
   - 여기서는 localStorage의 userProfile을 서버 데이터로 복사
   ============================================ */
function uploadLocalDataToServer() {
  const userProfile = localStorage.getItem('userProfile');

  if (userProfile && currentUser) {
    // 서버에 저장 시뮬레이션 (실제로는 fetch 사용)
    const serverKey = `server_${currentUser.username}_profile`;
    localStorage.setItem(serverKey, userProfile);

    console.log('LocalStorage 데이터를 서버로 업로드했습니다.');
  }
}

/* ============================================
   서버에서 사용자 데이터 로드 (시뮬레이션)
   - 로그인 상태일 때 호출
   - 서버 데이터가 있으면 LocalStorage에 덮어쓰기
   ============================================ */
function loadUserDataFromServer() {
  if (!currentUser) return;

  // 서버에서 데이터 로드 시뮬레이션
  const serverKey = `server_${currentUser.username}_profile`;
  const serverData = localStorage.getItem(serverKey);

  if (serverData) {
    // 서버 데이터를 LocalStorage에 복사
    localStorage.setItem('userProfile', serverData);
    console.log('서버에서 사용자 데이터를 로드했습니다.');
  }
}

/* ============================================
   Watchlist 버튼 클릭
   - 로그인 상태 확인
   - 비로그인 시 로그인 필요 모달 표시
   ============================================ */
const watchlistBtn = document.getElementById('watchlistBtn');
if (watchlistBtn) {
  watchlistBtn.addEventListener('click', () => {
    if (!currentUser) {
      // 비로그인 상태: 로그인 필요 모달 표시
      openWatchlistLoginModal();
    } else {
      // 로그인 상태: Watchlist 페이지로 이동 (현재는 알림)
      alert('Watchlist 페이지 기능은 준비 중입니다.');
    }
  });
}

/* ============================================
   Watchlist 로그인 필요 모달 열기/닫기
   ============================================ */
function openWatchlistLoginModal() {
  const modal = document.getElementById('watchlistLoginModal');
  modal.style.display = 'flex';
}

function closeWatchlistLoginModal() {
  const modal = document.getElementById('watchlistLoginModal');
  modal.style.display = 'none';
}

// Watchlist 모달 닫기 버튼
const watchlistModalClose = document.querySelector('#watchlistLoginModal .modal-close');
if (watchlistModalClose) {
  watchlistModalClose.addEventListener('click', closeWatchlistLoginModal);
}

// 로그인하러 가기 버튼
const goToLoginBtn = document.getElementById('goToLoginBtn');
if (goToLoginBtn) {
  goToLoginBtn.addEventListener('click', () => {
    closeWatchlistLoginModal();
    openAuthModal('login');
  });
}

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
  const authModal = document.getElementById('authModal');
  const watchlistModal = document.getElementById('watchlistLoginModal');
  const profileModal = document.getElementById('profileModal');

  if (e.target === authModal) {
    closeAuthModal();
  }
  if (e.target === watchlistModal) {
    closeWatchlistLoginModal();
  }
  if (e.target === profileModal) {
    closeProfileModal();
  }
});

/* ============================================
   프로필 버튼 및 모달 관리
   ============================================ */

// 프로필 버튼 클릭 이벤트
const profileBtn = document.getElementById('profileBtn');
if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      openAuthModal('login');
    } else {
      openProfileModal();
    }
  });
}

/* ============================================
   프로필 모달 열기
   - 사용자 프로필 데이터 표시
   ============================================ */
function openProfileModal() {
  const modal = document.getElementById('profileModal');

  // 프로필 데이터 로드
  const userProfile = localStorage.getItem('userProfile');

  if (userProfile) {
    const profile = JSON.parse(userProfile);
    displayProfileData(profile);
  } else {
    // 프로필이 없으면 빈 상태 표시
    displayEmptyProfile();
  }

  modal.style.display = 'flex';
}

/* ============================================
   프로필 모달 닫기
   ============================================ */
function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  modal.style.display = 'none';
}

// 프로필 모달 닫기 버튼
const profileModalClose = document.querySelector('#profileModal .modal-close');
if (profileModalClose) {
  profileModalClose.addEventListener('click', closeProfileModal);
}

/* ============================================
   프로필 데이터 표시
   ============================================ */
function displayProfileData(profile) {
  // 장르 정보 표시
  const genresContainer = document.getElementById('profileGenres');
  if (profile.genres && profile.genres.length > 0) {
    genresContainer.innerHTML = profile.genres
      .map(genre => `<span class="profile-tag">${getGenreKoreanName(genre)}</span>`)
      .join('');
  } else {
    genresContainer.innerHTML = '<span class="profile-empty">선호 장르 정보가 없습니다.</span>';
  }

  // 무드 정보 표시
  const moodContainer = document.getElementById('profileMood');
  if (profile.mood) {
    moodContainer.innerHTML = `<span class="profile-tag">${getMoodKoreanName(profile.mood)}</span>`;
  } else {
    moodContainer.innerHTML = '<span class="profile-empty">무드 정보가 없습니다.</span>';
  }

  // 불호 요소 표시
  const dislikesContainer = document.getElementById('profileDislikes');
  if (profile.dislikes && profile.dislikes.length > 0) {
    dislikesContainer.innerHTML = profile.dislikes
      .map(dislike => `<span class="profile-tag">${getDislikeKoreanName(dislike)}</span>`)
      .join('');
  } else {
    dislikesContainer.innerHTML = '<span class="profile-empty">불호 요소 정보가 없습니다.</span>';
  }
}

/* ============================================
   빈 프로필 표시
   ============================================ */
function displayEmptyProfile() {
  document.getElementById('profileGenres').innerHTML = '<span class="profile-empty">선호 장르 정보가 없습니다.</span>';
  document.getElementById('profileMood').innerHTML = '<span class="profile-empty">무드 정보가 없습니다.</span>';
  document.getElementById('profileDislikes').innerHTML = '<span class="profile-empty">불호 요소 정보가 없습니다.</span>';
}

/* ============================================
   장르/무드/불호 한글 이름 매핑
   ============================================ */
function getGenreKoreanName(genre) {
  const genreMap = {
    action: '액션',
    adventure: '모험',
    comedy: '코미디',
    drama: '드라마',
    horror: '공포',
    scifi: 'SF',
    romance: '로맨스',
    thriller: '스릴러',
    animation: '애니메이션',
    fantasy: '판타지',
    mystery: '미스터리',
    crime: '범죄',
    documentary: '다큐멘터리',
    family: '가족',
    music: '음악',
    war: '전쟁',
    western: '서부'
  };
  return genreMap[genre] || genre;
}

function getMoodKoreanName(mood) {
  const moodMap = {
    happy: '밝고 즐거운',
    dark: '어둡고 무거운',
    emotional: '감동적인',
    intense: '긴장감 넘치는',
    thoughtful: '생각을 자극하는'
  };
  return moodMap[mood] || mood;
}

function getDislikeKoreanName(dislike) {
  const dislikeMap = {
    violence: '폭력적인 장면',
    horror: '공포 요소',
    sad: '슬픈 결말',
    slow: '느린 전개',
    complex: '복잡한 줄거리'
  };
  return dislikeMap[dislike] || dislike;
}

/* ============================================
   프로필 수정 버튼 클릭
   - 팝업을 다시 열어서 설문 수정 가능
   ============================================ */
const editProfileBtn = document.getElementById('editProfileBtn');
if (editProfileBtn) {
  editProfileBtn.addEventListener('click', () => {
    closeProfileModal();
    const popupFrame = document.getElementById('popupFrame');
    if (popupFrame) {
      popupFrame.style.display = 'block';
    }
  });
}
