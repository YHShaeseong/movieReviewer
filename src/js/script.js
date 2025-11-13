/* ============================================
   TMDB API 설정
   ============================================ */
const API_KEY = 'f325a6979b2e26db0c5ee2420d0f3138';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMzI1YTY5NzliMmUyNmRiMGM1ZWUyNDIwZDBmMzEzOCIsIm5iZiI6MTc2MjE1NTY0MC4wMDcsInN1YiI6IjY5MDg1Yzc4NGQ0ZDdkYzlhYTU5ODg4ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.tXYlaIIml1lr3ZoFa6CqWtKkXTgyWTVdSjAS6wjDv5I';

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
    // 영화 카드 HTML 생성
    const movieCard = `
      <div class="movie_item">
        <span class="rank-badge">#${index + 1}</span>
        <span class="rating-badge">★ ${movie.rating}</span>
        <img src="${movie.image}" alt="${movie.title}">
        <div class="movie-info">
          <div class="title">${movie.title}</div>
          <div class="movie-meta">${movie.year} · ${getGenreName(movie.genre)}</div>
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
   TMDB API에서 영화 데이터 가져오기
   ============================================ */
async function fetchMovies() {
  try {
    const response = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ko-KR&page=1`);
    const data = await response.json();

    // TMDB 데이터를 기존 형식으로 변환
    movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
      genre: 'drama', // 기본값 (장르 ID 매핑 필요 시 추가 가능)
      rating: movie.vote_average.toFixed(1),
      likes: `${(movie.vote_count / 1000).toFixed(1)}K`,
      image: movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450'
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
      // 프로필이 있으면 추천 영화 가져오기
      const profile = JSON.parse(savedProfile);

      const withoutGenres = [];
      if (profile.dislikes) {
        profile.dislikes.forEach(dislike => {
          const mapping = DISLIKE_MAPPING[dislike];
          if (mapping && mapping.genres) {
            withoutGenres.push(...mapping.genres);
          }
        });
      }

      const params = new URLSearchParams({
        api_key: API_KEY,
        language: 'ko-KR',
        sort_by: profile.sortBy || 'popularity.desc',
        with_genres: profile.genres.join(','),
        page: 1,
        vote_count_gte: 500
      });

      if (withoutGenres.length > 0) {
        params.append('without_genres', withoutGenres.join(','));
      }

      const response = await fetch(`${BASE_URL}/discover/movie?${params}`);
      const data = await response.json();
      movies = data.results.slice(0, 5);
    } else {
      // 프로필이 없으면 인기 영화 가져오기
      const response = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR&page=1`
      );
      const data = await response.json();
      movies = data.results.slice(0, 5);
    }

    heroMovies = movies;
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
    const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '';

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
          <button class="btn-play">예고편 보기</button>
          <button class="btn-info">상세 정보</button>
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
  // 동적으로 생성된 히어로 버튼에 이벤트 추가
  document.querySelectorAll('.btn-play').forEach(btn => {
    btn.addEventListener('click', function() {
      alert('예고편 재생 기능은 준비 중입니다.');
    });
  });

  document.querySelectorAll('.btn-info').forEach(btn => {
    btn.addEventListener('click', function() {
      alert('상세 정보 페이지로 이동합니다.');
    });
  });
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
   페이지 로드 시 초기 렌더링
   - TMDB API에서 영화 데이터를 가져와 표시
   ============================================ */
// 즉시 실행 (script 태그가 body 끝에 있으므로)
loadHeroCarousel();
fetchMovies();
setupMainPageEvents();

/* ============================================
   팝업 iframe 제어
   ============================================ */

// 페이지 로드 시 팝업 표시
window.addEventListener('DOMContentLoaded', () => {
  const popupFrame = document.getElementById('popupFrame');
  if (popupFrame) {
    // 항상 팝업을 표시
    popupFrame.style.display = 'block';
  }
});

// 팝업에서 메시지 받기 (닫기 이벤트)
window.addEventListener('message', (event) => {
  if (event.data.action === 'closePopup') {
    const popupFrame = document.getElementById('popupFrame');
    if (popupFrame) {
      popupFrame.style.display = 'none';
    }
    // 히어로 캐러셀 새로고침
    loadHeroCarousel();
  }
});
