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
    comedy: '코미디',
    horror: '다큐멘터리',
    romance: '로맨스',
    thriller: '스릴러',
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
   설문조사 팝업 로직
   ============================================ */

// 사용자 프로필 저장용 객체
let userProfile = {
  favoriteMovie: null,
  genres: [],
  mood: null,
  dislikes: [],
  sortBy: null,
  ratings: []
};

// 팝업 초기화
function initSurveyPopup() {
  const popup = document.getElementById('preferencePopup');

  if (!popup) {
    console.error('Popup element not found!');
    return;
  }

  // 무조건 팝업 표시
  popup.style.display = 'flex';
  setupStep1Handlers();

  // 기존 프로필이 있으면 로드
  loadUserProfile();
}

// 1단계 핸들러 설정
function setupStep1Handlers() {
  const movieInput = document.getElementById('favoriteMovie');
  const searchResults = document.getElementById('movieSearchResults');
  const btnNext = document.getElementById('btnNext');

  if (!movieInput || !searchResults || !btnNext) {
    console.error('Step1 elements not found');
    return;
  }

  // Q1: 영화 검색 자동완성
  let searchTimeout;
  movieInput.addEventListener('input', async (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`
        );
        const data = await response.json();

        searchResults.innerHTML = '';
        data.results.slice(0, 5).forEach(movie => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          resultItem.innerHTML = `
            <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/50x75'}" alt="${movie.title}">
            <div>
              <div class="result-title">${movie.title}</div>
              <div class="result-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</div>
            </div>
          `;
          resultItem.addEventListener('click', () => {
            movieInput.value = movie.title;
            userProfile.favoriteMovie = {
              id: movie.id,
              title: movie.title,
              genre_ids: movie.genre_ids
            };
            searchResults.innerHTML = '';
          });
          searchResults.appendChild(resultItem);
        });
      } catch (error) {
        console.error('영화 검색 실패:', error);
      }
    }, 300);
  });

  // 다음 단계 버튼
  btnNext.addEventListener('click', async () => {
    // Q2: 선호 장르 수집
    const selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked'))
      .map(input => parseInt(input.value));

    if (selectedGenres.length === 0) {
      alert('선호하는 장르를 최소 1개 이상 선택해주세요.');
      return;
    }

    // Q3: 선호 무드 수집
    // const selectedMood = document.querySelector('input[name="mood"]:checked');
    // if (!selectedMood) {
    //   alert('선호하는 무드를 선택해주세요.');
    //   return;
    // }

    // Q4: 불호 요소 수집
    const selectedDislikes = Array.from(document.querySelectorAll('input[name="dislike"]:checked'))
      .map(input => input.value);

    // Q5: 탐색 스타일 수집
    const selectedExploration = document.querySelector('input[name="exploration"]:checked');
    if (!selectedExploration) {
      alert('탐색 스타일을 선택해주세요.');
      return;
    }

    // 프로필에 저장
    userProfile.genres = selectedGenres;
    userProfile.dislikes = selectedDislikes;
    userProfile.sortBy = selectedExploration.value;

    // 2단계로 이동
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');

    await loadStep2Movies();
  });
}

// 2단계: 별점 평가 영화 로드
async function loadStep2Movies() {
  try {
    // 1단계에서 선택한 장르 기반으로 유명하고 평점 높은 영화 가져오기
    const genreIds = userProfile.genres.join(',');
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=ko-KR&sort_by=popularity.desc&with_genres=${genreIds}&vote_count.gte=1000&vote_average.gte=7.0&page=1`
    );
    const data = await response.json();

    const ratingGrid = document.getElementById('ratingGrid');
    ratingGrid.innerHTML = '';

    // 상위 10개 영화 표시
    data.results.slice(0, 10).forEach((movie, index) => {
      const ratingCard = document.createElement('div');
      ratingCard.className = 'rating-card';
      ratingCard.dataset.movieId = movie.id;
      ratingCard.innerHTML = `
        <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/200x300'}" alt="${movie.title}">
        <div class="rating-info">
          <div class="rating-title">${movie.title}</div>
          <div class="rating-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'} · ★ ${movie.vote_average.toFixed(1)}</div>
          <div class="star-rating-input" data-movie-id="${movie.id}">
            ${[1, 2, 3, 4, 5].map(star => `<span class="star" data-rating="${star}">☆</span>`).join('')}
          </div>
          <button class="btn-pass" data-movie-id="${movie.id}">Pass</button>
        </div>
      `;

      // 별점 클릭 이벤트
      const stars = ratingCard.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', function() {
          const rating = parseInt(this.dataset.rating);
          const movieId = movie.id;

          // 별점 표시 업데이트
          stars.forEach((s, i) => {
            s.textContent = i < rating ? '★' : '☆';
          });

          // 프로필에 저장
          const existingIndex = userProfile.ratings.findIndex(r => r.movieId === movieId);
          if (existingIndex >= 0) {
            userProfile.ratings[existingIndex].rating = rating;
            userProfile.ratings[existingIndex].passed = false;
          } else {
            userProfile.ratings.push({
              movieId: movie.id,
              rating: rating,
              genre_ids: movie.genre_ids,
              passed: false
            });
          }

          // Pass 버튼 비활성화 스타일 제거
          const passBtn = ratingCard.querySelector('.btn-pass');
          passBtn.classList.remove('passed');
          passBtn.textContent = 'Pass';
        });
      });

      // Pass 버튼 클릭 이벤트
      const passBtn = ratingCard.querySelector('.btn-pass');
      passBtn.addEventListener('click', function() {
        const movieId = parseInt(this.dataset.movieId);

        // Pass 상태 토글
        const existingIndex = userProfile.ratings.findIndex(r => r.movieId === movieId);

        if (this.classList.contains('passed')) {
          // Pass 취소
          this.classList.remove('passed');
          this.textContent = 'Pass';

          // 프로필에서 제거
          if (existingIndex >= 0) {
            userProfile.ratings.splice(existingIndex, 1);
          }

          // 별점 초기화
          stars.forEach(s => s.textContent = '☆');
        } else {
          // Pass 처리
          this.classList.add('passed');
          this.textContent = 'Passed';

          // 별점 초기화
          stars.forEach(s => s.textContent = '☆');

          // 프로필에 저장 (별점 0으로)
          if (existingIndex >= 0) {
            userProfile.ratings[existingIndex].rating = 0;
            userProfile.ratings[existingIndex].passed = true;
          } else {
            userProfile.ratings.push({
              movieId: movie.id,
              rating: 0,
              genre_ids: movie.genre_ids,
              passed: true
            });
          }
        }
      });

      ratingGrid.appendChild(ratingCard);
    });

    // 분석 완료 버튼
    const btnAnalyze = document.getElementById('btnAnalyze');
    btnAnalyze.onclick = async () => {
      // Pass하지 않은 평가만 카운트
      const validRatings = userProfile.ratings.filter(r => !r.passed);

      if (validRatings.length < 5) {
        alert('최소 5개 이상의 영화에 별점을 매겨주세요. (Pass는 제외)');
        return;
      }

      // 3단계로 이동
      document.getElementById('step2').classList.add('hidden');
      document.getElementById('step3').classList.remove('hidden');

      await showResults();
    };
  } catch (error) {
    console.error('2단계 영화 로드 실패:', error);
  }
}

// 3단계: 결과 표시
async function showResults() {
  try {
    // 사용자 프로필 분석
    analyzeUserProfile();

    // 프로필 요약 표시
    const resultProfile = document.getElementById('resultProfile');
    resultProfile.innerHTML = `
      <div class="profile-summary">
        <h4>당신의 영화 취향 프로필</h4>
        <p><strong>선호 장르:</strong> ${userProfile.genres.map(id => GENRE_MAP[id]).join(', ')}</p>
        <p><strong>탐색 스타일:</strong> ${getExplorationLabel(userProfile.sortBy)}</p>
      </div>
    `;

    // 추천 영화 가져오기
    const recommendations = await getRecommendations();

    // 추천 영화 표시
    const resultMovies = document.getElementById('resultMovies');
    resultMovies.innerHTML = '';

    recommendations.slice(0, 5).forEach(movie => {
      const movieCard = document.createElement('div');
      movieCard.className = 'result-movie-card';
      movieCard.innerHTML = `
        <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/200x300'}" alt="${movie.title}">
        <div class="result-movie-info">
          <div class="result-movie-title">${movie.title}</div>
          <div class="result-movie-rating">★ ${movie.vote_average.toFixed(1)}</div>
        </div>
      `;
      resultMovies.appendChild(movieCard);
    });

    // 저장 및 팝업 닫기
    const btnStart = document.getElementById('btnStart');
    btnStart.onclick = () => {
      saveUserProfile();
      document.getElementById('preferencePopup').style.display = 'none';

      // 히어로 캐러셀 새로고침
      loadHeroCarousel();
    };
  } catch (error) {
    console.error('결과 표시 실패:', error);
  }
}

// 사용자 프로필 분석 (별점 기반 취향 세분화)
function analyzeUserProfile() {
  const highRatings = userProfile.ratings.filter(r => r.rating >= 4);
  const lowRatings = userProfile.ratings.filter(r => r.rating <= 2);

  // 높은 별점 영화의 장르를 liked로 추가
  const likedGenres = new Set();
  highRatings.forEach(rating => {
    rating.genre_ids.forEach(id => likedGenres.add(id));
  });

  // 낮은 별점 영화의 장르를 disliked로 추가
  const dislikedGenres = new Set();
  lowRatings.forEach(rating => {
    rating.genre_ids.forEach(id => dislikedGenres.add(id));
  });

  // 프로필 업데이트
  userProfile.likedGenres = Array.from(likedGenres);
  userProfile.dislikedGenres = Array.from(dislikedGenres);
}

// 추천 영화 가져오기
async function getRecommendations() {
  try {
    // 불호 장르 계산
    const withoutGenres = [];
    userProfile.dislikes.forEach(dislike => {
      const mapping = DISLIKE_MAPPING[dislike];
      if (mapping && mapping.genres) {
        withoutGenres.push(...mapping.genres);
      }
    });

    // API 파라미터 구성
    const params = new URLSearchParams({
      api_key: API_KEY,
      language: 'ko-KR',
      sort_by: userProfile.sortBy,
      with_genres: userProfile.genres.join(','),
      page: 1
    });

    if (withoutGenres.length > 0) {
      params.append('without_genres', withoutGenres.join(','));
    }

    const response = await fetch(`${BASE_URL}/discover/movie?${params}`);
    const data = await response.json();

    return data.results;
  } catch (error) {
    console.error('추천 영화 로드 실패:', error);
    return [];
  }
}

// 프로필 저장
function saveUserProfile() {
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  localStorage.setItem('survey_completed', 'true');
}

// 프로필 로드
function loadUserProfile() {
  const saved = localStorage.getItem('userProfile');
  if (saved) {
    userProfile = JSON.parse(saved);
  }
}

// 유틸리티 함수
function getMoodLabel(mood) {
  const labels = {
    happy: '밝고 경쾌한',
    dark: '어둡고 무거운',
    emotional: '감성적이고 따뜻한',
    intense: '긴장감 넘치는',
    thoughtful: '철학적이고 성찰적인'
  };
  return labels[mood] || mood;
}

function getExplorationLabel(sortBy) {
  const labels = {
    'popularity.desc': '인기도',
    'vote_average.desc': '평점',
    'release_date.desc': '최신성',
    'revenue.desc': '흥행성'
  };
  return labels[sortBy] || sortBy;
}

// 팝업 버튼 이벤트 설정
function setupPopupEvents() {
  // 건너뛰기 버튼
  const btnSkip = document.getElementById('btnSkip');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      if (confirm('설문을 건너뛰면 맞춤 추천을 받을 수 없습니다. 계속하시겠습니까?')) {
        document.getElementById('preferencePopup').style.display = 'none';
      }
    });
  }

  // 팝업 닫기 버튼
  const popupClose = document.getElementById('popupClose');
  if (popupClose) {
    popupClose.addEventListener('click', () => {
      if (confirm('설문을 종료하시겠습니까?')) {
        document.getElementById('preferencePopup').style.display = 'none';
      }
    });
  }
}

// 페이지 로드 시 팝업 초기화 (즉시 실행)
initSurveyPopup();
setupPopupEvents();
