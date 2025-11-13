/* ============================================
   TMDB API 설정
   ============================================ */
const API_KEY = 'f325a6979b2e26db0c5ee2420d0f3138';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

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
   사용자 프로필 저장용 객체
   ============================================ */
let userProfile = {
  favoriteMovie: null,
  genres: [],
  mood: null,
  dislikes: [],
  sortBy: null,
  ratings: []
};

/* ============================================
   팝업 초기화
   ============================================ */
function initSurveyPopup() {
  const popup = document.getElementById('surveyPopup');

  if (!popup) {
    console.error('Survey popup element not found!');
    return;
  }

  // 무조건 팝업 표시
  popup.style.display = 'flex';
  setupFirstPopupHandlers();

  // 기존 프로필이 있으면 로드
  loadUserProfile();
}

/* ============================================
   1단계 (첫 번째 팝업) 핸들러 설정
   ============================================ */
function setupFirstPopupHandlers() {
  const movieInput = document.getElementById('favoriteMovie');
  const searchResults = document.getElementById('movieSearchResults');
  const btnNext = document.getElementById('btnNextToRating');

  if (!movieInput || !searchResults || !btnNext) {
    console.error('First popup elements not found');
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
        // 한국어와 영어 검색 결과 모두 가져오기
        const [koResponse, enResponse] = await Promise.all([
          fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`),
          fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`)
        ]);

        const [koData, enData] = await Promise.all([
          koResponse.json(),
          enResponse.json()
        ]);

        // 중복 제거 (ID 기준)
        const allMovies = [...koData.results];
        enData.results.forEach(movie => {
          if (!allMovies.find(m => m.id === movie.id)) {
            allMovies.push(movie);
          }
        });

        searchResults.innerHTML = '';

        if (allMovies.length === 0) {
          searchResults.innerHTML = '<div style="padding: 12px; color: var(--text-muted);">검색 결과가 없습니다.</div>';
          return;
        }

        allMovies.slice(0, 10).forEach(movie => {
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
        searchResults.innerHTML = '<div style="padding: 12px; color: var(--text-muted);">검색 중 오류가 발생했습니다.</div>';
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
    const selectedMood = document.querySelector('input[name="mood"]:checked');
    if (!selectedMood) {
      alert('선호하는 무드를 선택해주세요.');
      return;
    }

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
    userProfile.mood = selectedMood.value;
    userProfile.dislikes = selectedDislikes;
    userProfile.sortBy = selectedExploration.value;

    // 2단계 (별점 평가 팝업)로 이동
    document.getElementById('firstPopup').classList.add('hidden');
    document.getElementById('secondPopup').classList.remove('hidden');

    await loadSecondPopupMovies();
  });
}

/* ============================================
   2단계 (별점 평가 팝업): 영화 로드
   ============================================ */
async function loadSecondPopupMovies() {
  try {
    // 1단계에서 선택한 장르 기반으로 영화 가져오기
    const genreIds = userProfile.genres.join(',');

    // 불호 장르 계산
    const withoutGenres = [];
    if (userProfile.dislikes) {
      userProfile.dislikes.forEach(dislike => {
        const mapping = DISLIKE_MAPPING[dislike];
        if (mapping && mapping.genres) {
          withoutGenres.push(...mapping.genres);
        }
      });
    }

    // API 파라미터 구성 - 조건 완화
    const params = new URLSearchParams({
      api_key: API_KEY,
      language: 'ko-KR',
      sort_by: userProfile.sortBy || 'popularity.desc',
      with_genres: genreIds,
      vote_count_gte: 300,  // 1000 → 300으로 완화
      vote_average_gte: 6.0, // 7.0 → 6.0으로 완화
      page: 1
    });

    // 불호 장르 제외
    if (withoutGenres.length > 0) {
      params.append('without_genres', withoutGenres.join(','));
    }

    const response = await fetch(`${BASE_URL}/discover/movie?${params}`);
    const data = await response.json();

    let movies = data.results;

    // 결과가 부족하면 조건 더 완화
    if (movies.length < 10) {
      const fallbackParams = new URLSearchParams({
        api_key: API_KEY,
        language: 'ko-KR',
        sort_by: 'popularity.desc',
        with_genres: genreIds,
        vote_count_gte: 100,  // 더 완화
        page: 1
      });

      if (withoutGenres.length > 0) {
        fallbackParams.append('without_genres', withoutGenres.join(','));
      }

      const fallbackResponse = await fetch(`${BASE_URL}/discover/movie?${fallbackParams}`);
      const fallbackData = await fallbackResponse.json();
      movies = fallbackData.results;
    }

    const ratingGrid = document.getElementById('movieRatingGrid');
    ratingGrid.innerHTML = '';

    // 상위 10개 영화 표시
    movies.slice(0, 10).forEach((movie, index) => {
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
    const btnAnalyze = document.getElementById('btnAnalyzeComplete');
    btnAnalyze.onclick = async () => {
      // Pass하지 않은 평가만 카운트
      const validRatings = userProfile.ratings.filter(r => !r.passed);

      if (validRatings.length < 5) {
        alert('최소 5개 이상의 영화에 별점을 매겨주세요. (Pass는 제외)');
        return;
      }

      // 3단계 (결과 팝업)로 이동
      document.getElementById('secondPopup').classList.add('hidden');
      document.getElementById('resultPopup').classList.remove('hidden');

      await showResultPopup();
    };
  } catch (error) {
    console.error('별점 평가 팝업 영화 로드 실패:', error);
  }
}

/* ============================================
   3단계 (결과 팝업): 추천 결과 표시
   ============================================ */
async function showResultPopup() {
  try {
    // 사용자 프로필 분석
    analyzeUserProfile();

    // 프로필 요약 표시
    const profileSummary = document.getElementById('userProfileSummary');
    profileSummary.innerHTML = `
      <div class="profile-summary">
        <h4>당신의 영화 취향 프로필</h4>
        <p><strong>선호 장르:</strong> ${userProfile.genres.map(id => GENRE_MAP[id]).join(', ')}</p>
        <p><strong>선호 무드:</strong> ${getMoodLabel(userProfile.mood)}</p>
        <p><strong>탐색 스타일:</strong> ${getExplorationLabel(userProfile.sortBy)}</p>
      </div>
    `;

    // 추천 영화 가져오기
    const recommendations = await getRecommendedMovies();

    // 추천 영화 표시
    const moviesList = document.getElementById('recommendedMoviesList');
    moviesList.innerHTML = '';

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
      moviesList.appendChild(movieCard);
    });

    // 저장 및 팝업 닫기
    const btnStart = document.getElementById('btnStartBrowsing');
    btnStart.onclick = () => {
      saveUserProfile();
      // 부모 창(index.html)에 메시지 전달
      window.parent.postMessage({ action: 'closePopup' }, '*');
    };
  } catch (error) {
    console.error('결과 팝업 표시 실패:', error);
  }
}

/* ============================================
   사용자 프로필 분석 (별점 기반 취향 세분화)
   ============================================ */
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

/* ============================================
   추천 영화 가져오기 (결과 팝업용)
   ============================================ */
async function getRecommendedMovies() {
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

/* ============================================
   프로필 저장/로드
   ============================================ */
function saveUserProfile() {
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  localStorage.setItem('survey_completed', 'true');
}

function loadUserProfile() {
  const saved = localStorage.getItem('userProfile');
  if (saved) {
    userProfile = JSON.parse(saved);
  }
}

/* ============================================
   유틸리티 함수
   ============================================ */
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

/* ============================================
   팝업 버튼 이벤트 설정
   ============================================ */
function setupPopupEvents() {
  // 건너뛰기 버튼
  const btnSkip = document.getElementById('btnSkipSurvey');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      if (confirm('설문을 건너뛰면 맞춤 추천을 받을 수 없습니다. 계속하시겠습니까?')) {
        // 부모 창에 메시지 전달
        window.parent.postMessage({ action: 'closePopup' }, '*');
      }
    });
  }

  // 팝업 닫기 버튼
  const popupClose = document.getElementById('popupClose');
  if (popupClose) {
    popupClose.addEventListener('click', () => {
      if (confirm('설문을 종료하시겠습니까?')) {
        // 부모 창에 메시지 전달
        window.parent.postMessage({ action: 'closePopup' }, '*');
      }
    });
  }
}

/* ============================================
   페이지 로드 시 팝업 초기화
   ============================================ */
initSurveyPopup();
setupPopupEvents();
