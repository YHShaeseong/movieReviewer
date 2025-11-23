/* ============================================
   취향 설문 팝업 모듈 (Preference Survey Popup)

   역할:
   - 사용자 취향 설문 팝업 UI 관리
   - 3단계 설문 프로세스 (기본 정보 → 별점 평가 → 결과)
   - TMDB API를 활용한 영화 검색 및 추천
   ============================================ */

import { GENRE_MAP, DISLIKE_MAPPING } from './config/constants.js';
import { getKoreanName } from './utils/utils.js';

/* ============================================
   사용자 프로필 객체 (User Profile Object)
   ============================================ */
let userProfile = {
  favoriteMovie: null,   // 좋아하는 영화 (Favorite movie)
  genres: [],            // 선호 장르 (Preferred genres)
  mood: null,            // 선호 무드 (Preferred mood)
  dislikes: [],          // 불호 요소 (Dislikes)
  sortBy: null,          // 탐색 스타일 (Exploration style)
  ratings: []            // 영화 별점 (Movie ratings)
};

/* ============================================
   팝업 초기화 (Popup Initialization)
   ============================================ */

/**
 * 설문 팝업 초기화
 * Initialize survey popup
 */
function initSurveyPopup() {
  const popup = document.getElementById('surveyPopup');

  if (!popup) {
    console.error('Survey popup element not found!');
    return;
  }

  // 팝업 표시 (Show popup)
  popup.style.display = 'flex';
  setupFirstPopupHandlers();

  // 기존 프로필 로드 (Load existing profile)
  loadUserProfile();
}

/* ============================================
   1단계: 기본 정보 설문 (Step 1: Basic Survey)
   ============================================ */

/**
 * 첫 번째 팝업 핸들러 설정
 * Setup first popup handlers
 */
function setupFirstPopupHandlers() {
  const movieInput = document.getElementById('favoriteMovie');
  const searchResults = document.getElementById('movieSearchResults');
  const btnNext = document.getElementById('btnNextToRating');

  if (!movieInput || !searchResults || !btnNext) {
    console.error('First popup elements not found');
    return;
  }

  // Q1: 영화 검색 자동완성 (Movie search autocomplete)
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
        // 한국어와 영어 검색 병렬 처리 (Parallel Korean and English search)
        const [koData, enData] = await Promise.all([
          window.tmdbApi.searchMovies(query, 1, { language: 'ko-KR' }),
          window.tmdbApi.searchMovies(query, 1, { language: 'en-US' })
        ]);

        // 중복 제거 (Remove duplicates)
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
            <img src="${movie.poster_path ? window.tmdbApi.getImageUrl(movie.poster_path, 'w500') : 'https://via.placeholder.com/50x75'}" alt="${movie.title}">
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

  // 다음 단계 버튼 (Next button)
  btnNext.addEventListener('click', async () => {
    // Q2: 선호 장르 수집 (Collect preferred genres)
    const selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked'))
      .map(input => parseInt(input.value));

    if (selectedGenres.length === 0) {
      alert('선호하는 장르를 최소 1개 이상 선택해주세요.');
      return;
    }

    // Q3: 선호 무드 수집 (Collect preferred mood)
    const selectedMood = document.querySelector('input[name="mood"]:checked');
    if (!selectedMood) {
      alert('선호하는 무드를 선택해주세요.');
      return;
    }

    // Q4: 불호 요소 수집 (Collect dislikes)
    const selectedDislikes = Array.from(document.querySelectorAll('input[name="dislike"]:checked'))
      .map(input => input.value);

    // Q5: 탐색 스타일 수집 (Collect exploration style)
    const selectedExploration = document.querySelector('input[name="exploration"]:checked');
    if (!selectedExploration) {
      alert('탐색 스타일을 선택해주세요.');
      return;
    }

    // 프로필에 저장 (Save to profile)
    userProfile.genres = selectedGenres;
    userProfile.mood = selectedMood.value;
    userProfile.dislikes = selectedDislikes;
    userProfile.sortBy = selectedExploration.value;

    // 2단계로 이동 (Move to step 2)
    document.getElementById('firstPopup').classList.add('hidden');
    document.getElementById('secondPopup').classList.remove('hidden');

    await loadSecondPopupMovies();
  });
}

/* ============================================
   2단계: 별점 평가 (Step 2: Rating Movies)
   ============================================ */

/**
 * 별점 평가 팝업 영화 로드
 * Load movies for rating popup
 */
async function loadSecondPopupMovies() {
  try {
    const genreIds = userProfile.genres.join(',');

    // 불호 장르 계산 (Calculate disliked genres)
    const withoutGenres = [];
    if (userProfile.dislikes) {
      userProfile.dislikes.forEach(dislike => {
        const mapping = DISLIKE_MAPPING[dislike];
        if (mapping && mapping.genres) {
          withoutGenres.push(...mapping.genres);
        }
      });
    }

    // 인기 있고 유명한 영화 우선 (Prioritize popular and famous movies)
    let movies = await window.tmdbApi.discoverMovies({
      with_genres: genreIds,
      without_genres: withoutGenres.length > 0 ? withoutGenres.join(',') : undefined,
      sort_by: 'popularity.desc',
      'vote_count.gte': 2000,
      'vote_average.gte': 7.0,
      page: 1
    });

    let movieList = movies.results;

    // 결과 부족 시 조건 완화 (Relax conditions if not enough results)
    if (movieList.length < 5) {
      movies = await window.tmdbApi.discoverMovies({
        with_genres: genreIds,
        without_genres: withoutGenres.length > 0 ? withoutGenres.join(',') : undefined,
        sort_by: 'popularity.desc',
        'vote_count.gte': 1000,
        'vote_average.gte': 6.5,
        page: 1
      });
      movieList = movies.results;
    }

    const ratingGrid = document.getElementById('movieRatingGrid');
    ratingGrid.innerHTML = '';

    // 상위 5개 영화 표시 (Show top 5 movies)
    movieList.slice(0, 5).forEach((movie, index) => {
      const ratingCard = document.createElement('div');
      ratingCard.className = 'rating-card';
      ratingCard.dataset.movieId = movie.id;
      ratingCard.innerHTML = `
        <img src="${movie.poster_path ? window.tmdbApi.getImageUrl(movie.poster_path, 'w500') : 'https://via.placeholder.com/200x300'}" alt="${movie.title}">
        <div class="rating-info">
          <div class="rating-title">${movie.title}</div>
          <div class="rating-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'} · ★ ${movie.vote_average.toFixed(1)}</div>
          <div class="star-rating-input" data-movie-id="${movie.id}">
            ${[1, 2, 3, 4, 5].map(star => `<span class="star" data-rating="${star}">☆</span>`).join('')}
          </div>
          <button class="btn-pass" data-movie-id="${movie.id}">Pass</button>
        </div>
      `;

      // 별점 클릭 이벤트 (Star click event)
      const stars = ratingCard.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', function() {
          const rating = parseInt(this.dataset.rating);
          const movieId = movie.id;

          // 별점 표시 업데이트 (Update star display)
          stars.forEach((s, i) => {
            s.textContent = i < rating ? '★' : '☆';
          });

          // 프로필에 저장 (Save to profile)
          const existingIndex = userProfile.ratings.findIndex(r => r.movieId === movieId);
          if (existingIndex >= 0) {
            userProfile.ratings[existingIndex].rating = rating;
            userProfile.ratings[existingIndex].passed = false;
          } else {
            userProfile.ratings.push({
              movieId: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              rating: rating,
              genre_ids: movie.genre_ids,
              passed: false
            });
          }

          // Pass 버튼 상태 초기화 (Reset pass button)
          const passBtn = ratingCard.querySelector('.btn-pass');
          passBtn.classList.remove('passed');
          passBtn.textContent = 'Pass';
        });
      });

      // Pass 버튼 클릭 이벤트 (Pass button click event)
      const passBtn = ratingCard.querySelector('.btn-pass');
      passBtn.addEventListener('click', function() {
        const movieId = parseInt(this.dataset.movieId);
        const existingIndex = userProfile.ratings.findIndex(r => r.movieId === movieId);

        if (this.classList.contains('passed')) {
          // Pass 취소 (Cancel pass)
          this.classList.remove('passed');
          this.textContent = 'Pass';
          if (existingIndex >= 0) {
            userProfile.ratings.splice(existingIndex, 1);
          }
          stars.forEach(s => s.textContent = '☆');
        } else {
          // Pass 처리 (Mark as passed)
          this.classList.add('passed');
          this.textContent = 'Passed';
          stars.forEach(s => s.textContent = '☆');

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

    // 분석 완료 버튼 (Complete analysis button)
    const btnAnalyze = document.getElementById('btnAnalyzeComplete');
    btnAnalyze.onclick = async () => {
      const validRatings = userProfile.ratings.filter(r => !r.passed);

      if (validRatings.length < 3) {
        alert('최소 3개 이상의 영화에 별점을 매겨주세요. (Pass는 제외)');
        return;
      }

      // 3단계로 이동 (Move to step 3)
      document.getElementById('secondPopup').classList.add('hidden');
      document.getElementById('resultPopup').classList.remove('hidden');

      await showResultPopup();
    };
  } catch (error) {
    console.error('별점 평가 팝업 영화 로드 실패:', error);
  }
}

/* ============================================
   3단계: 결과 표시 (Step 3: Show Results)
   ============================================ */

/**
 * 결과 팝업 표시
 * Show result popup
 */
async function showResultPopup() {
  try {
    // 사용자 프로필 분석 (Analyze user profile)
    analyzeUserProfile();

    // 프로필 요약 표시 (Display profile summary)
    const profileSummary = document.getElementById('userProfileSummary');
    profileSummary.innerHTML = `
      <div class="profile-summary">
        <h4>당신의 영화 취향 프로필</h4>
        <p><strong>선호 장르:</strong> ${userProfile.genres.map(id => GENRE_MAP[id]).join(', ')}</p>
        <p><strong>선호 무드:</strong> ${getMoodLabel(userProfile.mood)}</p>
        <p><strong>탐색 스타일:</strong> ${getExplorationLabel(userProfile.sortBy)}</p>
      </div>
    `;

    // 추천 영화 가져오기 (Get recommended movies)
    const recommendations = await getRecommendedMovies();

    // 추천 영화 표시 (Display recommended movies)
    const moviesList = document.getElementById('recommendedMoviesList');
    moviesList.innerHTML = '';

    recommendations.slice(0, 5).forEach(movie => {
      const movieCard = document.createElement('div');
      movieCard.className = 'result-movie-card';
      movieCard.innerHTML = `
        <img src="${movie.poster_path ? window.tmdbApi.getImageUrl(movie.poster_path, 'w500') : 'https://via.placeholder.com/200x300'}" alt="${movie.title}">
        <div class="result-movie-info">
          <div class="result-movie-title">${movie.title}</div>
          <div class="result-movie-rating">★ ${movie.vote_average.toFixed(1)}</div>
        </div>
      `;
      moviesList.appendChild(movieCard);
    });

    // 완료 버튼 (Complete button)
    const btnStart = document.getElementById('btnStartBrowsing');
    btnStart.onclick = () => {
      saveUserProfile();
      window.parent.postMessage({ action: 'closePopup' }, '*');
    };
  } catch (error) {
    console.error('결과 팝업 표시 실패:', error);
  }
}

/**
 * 사용자 프로필 분석
 * Analyze user profile based on ratings
 */
function analyzeUserProfile() {
  const highRatings = userProfile.ratings.filter(r => r.rating >= 4);
  const lowRatings = userProfile.ratings.filter(r => r.rating <= 2);

  // 높은 별점 장르 추출 (Extract liked genres)
  const likedGenres = new Set();
  highRatings.forEach(rating => {
    rating.genre_ids.forEach(id => likedGenres.add(id));
  });

  // 낮은 별점 장르 추출 (Extract disliked genres)
  const dislikedGenres = new Set();
  lowRatings.forEach(rating => {
    rating.genre_ids.forEach(id => dislikedGenres.add(id));
  });

  userProfile.likedGenres = Array.from(likedGenres);
  userProfile.dislikedGenres = Array.from(dislikedGenres);
}

/**
 * 추천 영화 가져오기
 * Get recommended movies
 */
async function getRecommendedMovies() {
  try {
    const withoutGenres = [];
    userProfile.dislikes.forEach(dislike => {
      const mapping = DISLIKE_MAPPING[dislike];
      if (mapping && mapping.genres) {
        withoutGenres.push(...mapping.genres);
      }
    });

    // 유명하고 평가가 좋은 영화만 추천 (Only recommend popular and well-rated movies)
    const data = await window.tmdbApi.discoverMovies({
      with_genres: userProfile.genres.join(','),
      without_genres: withoutGenres.length > 0 ? withoutGenres.join(',') : undefined,
      sort_by: userProfile.sortBy,
      'vote_count.gte': 1000,      // 최소 1000개 이상의 평가
      'vote_average.gte': 6.5,     // 최소 평점 6.5 이상
      page: 1
    });

    return data.results;
  } catch (error) {
    console.error('추천 영화 로드 실패:', error);
    return [];
  }
}

/* ============================================
   프로필 저장/로드 (Profile Save/Load)
   ============================================ */

/**
 * 사용자 프로필 저장
 * Save user profile
 */
function saveUserProfile() {
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  localStorage.setItem('survey_completed', 'true');
}

/**
 * 사용자 프로필 로드
 * Load user profile
 */
function loadUserProfile() {
  const saved = localStorage.getItem('userProfile');
  if (saved) {
    userProfile = JSON.parse(saved);
  }
}

/* ============================================
   유틸리티 함수 (Utility Functions)
   ============================================ */

/**
 * 무드 라벨 반환
 * @param {string} mood - 무드 키
 * @returns {string} 무드 한글 이름
 */
function getMoodLabel(mood) {
  return getKoreanName('mood', mood);
}

/**
 * 탐색 스타일 라벨 반환
 * @param {string} sortBy - 정렬 기준
 * @returns {string} 탐색 스타일 한글 이름
 */
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
   팝업 버튼 이벤트 (Popup Button Events)
   ============================================ */

/**
 * 팝업 이벤트 설정
 * Setup popup events
 */
function setupPopupEvents() {
  // 건너뛰기 버튼 (Skip button)
  const btnSkip = document.getElementById('btnSkipSurvey');
  if (btnSkip) {
    btnSkip.addEventListener('click', () => {
      if (confirm('설문을 건너뛰면 맞춤 추천을 받을 수 없습니다. 계속하시겠습니까?')) {
        window.parent.postMessage({ action: 'closePopup' }, '*');
      }
    });
  }

  // 팝업 닫기 버튼 (Close button)
  const popupClose = document.getElementById('popupClose');
  if (popupClose) {
    popupClose.addEventListener('click', () => {
      if (confirm('설문을 종료하시겠습니까?')) {
        window.parent.postMessage({ action: 'closePopup' }, '*');
      }
    });
  }
}

/* ============================================
   초기화 실행 (Initialize)
   ============================================ */

initSurveyPopup();
setupPopupEvents();
