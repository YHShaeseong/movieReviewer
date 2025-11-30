/* ============================================
   취향 설문 팝업 모듈 (Preference Survey Popup)

   역할:
   - 사용자 취향 설문 팝업 UI 관리
   - 3단계 설문 프로세스 (기본 정보 → 별점 평가 → 결과)
   - TMDB API를 활용한 영화 검색 및 추천
   ============================================ */

import { GENRE_MAP, DISLIKE_MAPPING } from './config/constants.js';
import { getKoreanName } from './utils/utils.js';
import { VSGameEngine } from './vs-game/vsGameEngine.js';

window.GENRE_MAP = GENRE_MAP;

/* ============================================
   사용자 프로필 객체 (User Profile Object)
   ============================================ */
let userProfile = {
  favoriteMovie: null,   // 좋아하는 영화 (Favorite movie)
  genres: [],            // 선호 장르 (Preferred genres)
  mood: null,            // 선호 무드 (Preferred mood)
  dislikes: [],          // 불호 요소 (Dislikes)
  sortBy: null,          // 탐색 스타일 (Exploration style)
  ratings: [],           // 영화 별점 (Movie ratings)
  vsProfile: null        // VS 게임 분석 결과 (3-Layer Profile)
};

// VS 게임 엔진 인스턴스
let vsEngine = null;

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
 * 첫 번째 팝업 핸들러 설정 (카드 기반 네비게이션)
 * Setup first popup handlers with card-based navigation
 */
function setupFirstPopupHandlers() {
  const firstPopup = document.getElementById('firstPopup');

  // 카드 클릭 이벤트 (Choice card click events)
  firstPopup.addEventListener('click', (e) => {
    const card = e.target.closest('.choice-card');
    if (!card) return;

    const isSingleSelect = card.classList.contains('single-select');
    const questionPage = card.closest('.question-page');

    if (isSingleSelect) {
      // 단일 선택: 같은 페이지의 다른 카드 선택 해제
      questionPage.querySelectorAll('.choice-card.single-select').forEach(c => {
        c.classList.remove('selected');
      });
      card.classList.add('selected');
    } else {
      // 복수 선택: 토글
      card.classList.toggle('selected');
    }
  });

  // 다음 버튼 클릭 이벤트 (Next button click events)
  firstPopup.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-next-question');
    if (!btn) return;

    const nextPage = btn.dataset.next;
    const currentPage = btn.closest('.question-page');
    const questionNum = currentPage.dataset.question;

    // 현재 페이지 데이터 수집 및 검증
    if (!validateAndSaveQuestion(questionNum, currentPage)) {
      return;
    }

    if (nextPage === 'vs') {
      // VS 게임으로 이동
      moveToVSGame();
    } else {
      // 다음 질문 페이지로 이동
      navigateToQuestion(parseInt(nextPage));
    }
  });

  // 영화 검색 기능 (Movie search functionality)
  setupMovieSearch();
}

/**
 * 질문 페이지 이동
 */
function navigateToQuestion(pageNum) {
  const pages = document.querySelectorAll('.question-page');
  pages.forEach(page => {
    const num = parseInt(page.dataset.question);
    if (num === pageNum) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });
}

/**
 * 질문 검증 및 저장
 */
function validateAndSaveQuestion(questionNum, page) {
  const selectedCards = page.querySelectorAll('.choice-card.selected');
  const dataName = selectedCards[0]?.dataset.name;

  switch (questionNum) {
    case '1': // 장르
      if (selectedCards.length === 0) {
        alert('최소 1개 이상의 장르를 선택해주세요.');
        return false;
      }
      userProfile.genres = Array.from(selectedCards).map(card =>
        parseInt(card.dataset.value)
      );
      break;

    case '2': // 무드
      if (selectedCards.length === 0) {
        alert('무드를 선택해주세요.');
        return false;
      }
      userProfile.mood = selectedCards[0].dataset.value;
      break;

    case '3': // 불호 요소 (선택사항)
      userProfile.dislikes = Array.from(selectedCards).map(card =>
        card.dataset.value
      );
      break;

    case '4': // 탐색 스타일
      if (selectedCards.length === 0) {
        alert('탐색 스타일을 선택해주세요.');
        return false;
      }
      userProfile.sortBy = selectedCards[0].dataset.value;
      break;

    case '5': // 인생 영화 (선택사항)
      // favoriteMovie는 검색을 통해 이미 저장됨
      break;
  }

  return true;
}

/**
 * VS 게임으로 이동
 */
async function moveToVSGame() {
  document.getElementById('firstPopup').classList.add('hidden');
  document.getElementById('secondPopup').classList.remove('hidden');
  await loadSecondPopupMovies();
}

/**
 * 영화 검색 설정
 */
function setupMovieSearch() {
  const movieInput = document.getElementById('favoriteMovie');
  const searchResults = document.getElementById('movieSearchResults');

  if (!movieInput || !searchResults) return;

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
        const [koData, enData] = await Promise.all([
          window.tmdbApi.searchMovies(query, 1, { language: 'ko-KR' }),
          window.tmdbApi.searchMovies(query, 1, { language: 'en-US' })
        ]);

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
}

/* ============================================
   2단계: VS 게임 (Step 2: VS Game)
   ============================================ */

/**
 * VS 게임 시작
 * Start VS game with 3-Layer Deep Dive Logic
 */
async function loadSecondPopupMovies() {
  try {
    // VS 엔진 초기화
    vsEngine = new VSGameEngine();

    // 영화 데이터 사전 로드
    const loadingMessage = showLoadingMessage('영화 데이터를 불러오는 중...');
    await vsEngine.preloadMovies();
    hideLoadingMessage(loadingMessage);

    await renderVSRound();
  } catch (error) {
    console.error('VS 게임 로드 실패:', error);
    alert('영화 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
  }
}

/**
 * VS 라운드 렌더링
 * Render VS round with 3-Layer analysis
 */
async function renderVSRound() {
  const ratingGrid = document.getElementById('movieRatingGrid');
  const roundData = await vsEngine.getCurrentRound();

  if (!roundData) {
    console.error('라운드 데이터 없음');
    return;
  }

  const { movieAData, movieBData, progress, theme, description } = roundData;

  ratingGrid.innerHTML = `
    <div class="vs-container">
      <div class="vs-round-header">
        <div class="vs-progress">
          <span class="vs-round-number">${progress.current} / ${progress.total}</span>
          <div class="vs-progress-bar">
            <div class="vs-progress-fill" style="width: ${progress.percentage}%"></div>
          </div>
        </div>
        <h3 class="vs-theme">${theme}</h3>
        <p class="vs-description">${description}</p>
      </div>

      <div class="vs-battle">
        <div class="vs-movie-card" data-choice="A">
          <div class="vs-movie-poster">
            <img src="${movieAData.poster_path ? window.tmdbApi.getImageUrl(movieAData.poster_path, 'w500') : 'https://via.placeholder.com/300x450'}"
                 alt="${movieAData.title}">
          </div>
          <div class="vs-movie-info">
            <h4 class="vs-movie-title">${movieAData.title}</h4>
            <p class="vs-movie-meta">${movieAData.release_date ? movieAData.release_date.split('-')[0] : 'N/A'} · ★ ${movieAData.vote_average ? movieAData.vote_average.toFixed(1) : 'N/A'}</p>
            <p class="vs-movie-genres">${movieAData.genres ? movieAData.genres.slice(0, 3).map(g => g.name).join(', ') : ''}</p>
          </div>
          <button class="vs-select-btn">이 영화 선택</button>
        </div>

        <div class="vs-divider">
          <span class="vs-text">VS</span>
        </div>

        <div class="vs-movie-card" data-choice="B">
          <div class="vs-movie-poster">
            <img src="${movieBData.poster_path ? window.tmdbApi.getImageUrl(movieBData.poster_path, 'w500') : 'https://via.placeholder.com/300x450'}"
                 alt="${movieBData.title}">
          </div>
          <div class="vs-movie-info">
            <h4 class="vs-movie-title">${movieBData.title}</h4>
            <p class="vs-movie-meta">${movieBData.release_date ? movieBData.release_date.split('-')[0] : 'N/A'} · ★ ${movieBData.vote_average ? movieBData.vote_average.toFixed(1) : 'N/A'}</p>
            <p class="vs-movie-genres">${movieBData.genres ? movieBData.genres.slice(0, 3).map(g => g.name).join(', ') : ''}</p>
          </div>
          <button class="vs-select-btn">이 영화 선택</button>
        </div>
      </div>
    </div>
  `;

  // 버튼 이벤트 등록
  const selectButtons = ratingGrid.querySelectorAll('.vs-select-btn');
  selectButtons.forEach(btn => {
    btn.addEventListener('click', handleVSSelection);
  });
}

/**
 * VS 선택 처리
 * Handle VS selection with 3-Layer analysis
 */
async function handleVSSelection(e) {
  const card = e.target.closest('.vs-movie-card');
  const choice = card.dataset.choice;

  // 선택 애니메이션
  card.classList.add('vs-selected');

  // VS 엔진에 선택 전달
  const currentRoundNum = vsEngine.currentRound;
  const isGameComplete = await vsEngine.selectMovie(choice);

  setTimeout(async () => {
    if (isGameComplete) {
      // 게임 완료 - 결과 화면으로
      await finishVSGame();
    } else if (vsEngine.currentRound === vsEngine.roundMovies.length) {
      // Phase 1 완료 → Phase 2 진입 메시지 표시
      await showPhase2Transition();
    } else {
      // 다음 라운드
      await renderVSRound();
    }
  }, 500);
}

/**
 * Phase 2 진입 전환 메시지 표시
 * Show Phase 1→2 transition message with visual changes
 */
async function showPhase2Transition() {
  const ratingGrid = document.getElementById('movieRatingGrid');

  // Phase 2 진입 메시지 표시
  ratingGrid.innerHTML = `
    <div class="vs-container phase2-transition">
      <div class="phase2-message">
        <div class="phase2-icon">✨</div>
        <h3 class="phase2-title">첫 번째 분석 완료!</h3>
        <p class="phase2-subtitle">당신의 취향을 다시 한 번 확인할게요.</p>
        <div class="phase2-loading">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>
  `;

  // 2초 후 Phase 2 시작
  setTimeout(async () => {
    await renderVSRound();
  }, 2000);
}

/**
 * VS 게임 완료 처리
 */
function finishVSGame() {
  console.log('VS 게임 완료!');

  // 3-Layer 프로필 분석 결과 저장
  userProfile.vsProfile = vsEngine.getProfileAnalysis();
  vsEngine.saveProfile();

  // 결과 화면으로 이동
  document.getElementById('secondPopup').classList.add('hidden');
  document.getElementById('resultPopup').classList.remove('hidden');
  showResultPopup();
}

/* ============================================
   3단계: 결과 표시 (Step 3: Show Results)
   ============================================ */

/**
 * 결과 팝업 표시 (3-Layer 분석 결과 포함)
 * Show result popup with 3-Layer analysis
 */
async function showResultPopup() {
  try {
    // 프로필 요약 표시 (Display 3-Layer profile summary)
    const profileSummary = document.getElementById('userProfileSummary');
    const vsProfile = userProfile.vsProfile;

    profileSummary.innerHTML = `
      <div class="profile-summary">
        <h4>🎬 당신의 영화 취향 DNA</h4>

        <div class="profile-layer">
          <div class="layer-header">
            <span class="layer-icon">🌍</span>
            <span class="layer-title">세계관 선호도</span>
          </div>
          <div class="layer-result">
            <strong>${vsProfile.worldview.label}</strong>
            <span class="percentage">${vsProfile.worldview.percentage}%</span>
          </div>
          <p class="layer-description">${vsProfile.worldview.description}</p>
        </div>

        <div class="profile-layer">
          <div class="layer-header">
            <span class="layer-icon">⚡</span>
            <span class="layer-title">자극 타겟</span>
          </div>
          <div class="layer-result">
            <strong>${vsProfile.stimulation.label}</strong>
            <span class="percentage">${vsProfile.stimulation.percentage}%</span>
          </div>
          <p class="layer-description">${vsProfile.stimulation.description}</p>
          <div class="stimulation-bar">
            <div class="stim-item">
              <span>🧠 Brain</span>
              <div class="progress-mini">
                <div class="fill" style="width: ${vsProfile.stimulation.distribution.brain}%"></div>
              </div>
              <span>${vsProfile.stimulation.distribution.brain}%</span>
            </div>
            <div class="stim-item">
              <span>❤️ Heart</span>
              <div class="progress-mini">
                <div class="fill" style="width: ${vsProfile.stimulation.distribution.heart}%"></div>
              </div>
              <span>${vsProfile.stimulation.distribution.heart}%</span>
            </div>
            <div class="stim-item">
              <span>💪 Body</span>
              <div class="progress-mini">
                <div class="fill" style="width: ${vsProfile.stimulation.distribution.body}%"></div>
              </div>
              <span>${vsProfile.stimulation.distribution.body}%</span>
            </div>
          </div>
        </div>

        <div class="profile-layer">
          <div class="layer-header">
            <span class="layer-icon">🎨</span>
            <span class="layer-title">감성 텍스처</span>
          </div>
          <div class="layer-split">
            <div class="texture-item">
              <strong>온도:</strong> ${vsProfile.texture.temperature.label}
              <span class="percentage">${vsProfile.texture.temperature.percentage}%</span>
            </div>
            <div class="texture-item">
              <strong>밀도:</strong> ${vsProfile.texture.density.label}
              <span class="percentage">${vsProfile.texture.density.percentage}%</span>
            </div>
          </div>
        </div>

        <div class="profile-basic">
          <p><strong>선호 장르:</strong> ${userProfile.genres.map(id => GENRE_MAP[id]).join(', ')}</p>
          <p><strong>선호 무드:</strong> ${getMoodLabel(userProfile.mood)}</p>
        </div>
      </div>
    `;

    // 영화 목록 영역에 로딩 표시
    const moviesList = document.getElementById('recommendedMoviesList');
    moviesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);"><div class="loading-spinner"></div><p style="margin-top: 15px;">맞춤 영화를 찾는 중...</p></div>';

    // VS 게임 결과 기반 추천 영화 가져오기
    let recommendations = await vsEngine.getRecommendations(1);

    // 4개 미만이면 추가 페이지 요청
    if (recommendations.length < 4) {
      const page2 = await vsEngine.getRecommendations(2);
      recommendations = [...recommendations, ...page2];
    }

    // 중복 제거 후 최소 4개 확보
    const uniqueMovies = [];
    const seenIds = new Set();
    for (const movie of recommendations) {
      if (!seenIds.has(movie.id)) {
        seenIds.add(movie.id);
        uniqueMovies.push(movie);
        if (uniqueMovies.length >= 5) break;
      }
    }

    const top5Movies = uniqueMovies.slice(0, 5);
    userProfile.recommendedMovies = top5Movies;

    // 추천 영화 표시
    moviesList.innerHTML = '';

    if (top5Movies.length < 4) {
      moviesList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">충분한 추천 영화를 찾을 수 없습니다.</p>';
    } else {
      top5Movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'result-movie-card';

        const genres = movie.genre_ids?.slice(0, 3).map(id => window.GENRE_MAP?.[id] || '').filter(Boolean).join(', ') || '';

        movieCard.innerHTML = `
          <img src="${movie.poster_path ? window.tmdbApi.getImageUrl(movie.poster_path, 'w500') : 'https://via.placeholder.com/200x300'}" alt="${movie.title}">
          <div class="result-movie-info">
            <div class="result-movie-title">${movie.title}</div>
            <div class="result-movie-rating">★ ${movie.vote_average.toFixed(1)}</div>
            ${genres ? `<div class="result-movie-genres">${genres}</div>` : ''}
          </div>
        `;
        moviesList.appendChild(movieCard);
      });
    }

    // 완료 버튼
    const btnStart = document.getElementById('btnStartBrowsing');
    btnStart.onclick = () => {
      saveUserProfile();
      window.parent.postMessage({
        action: 'closePopup',
        recommendedMovies: top5Movies
      }, '*');
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

/**
 * 로딩 메시지 표시
 * @param {string} message - 로딩 메시지
 * @returns {HTMLElement} 로딩 요소
 */
function showLoadingMessage(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-message';
  loadingDiv.innerHTML = `
    <div class="loading-spinner"></div>
    <p>${message}</p>
  `;
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px 40px;
    border-radius: 10px;
    z-index: 10000;
    text-align: center;
  `;
  document.body.appendChild(loadingDiv);
  return loadingDiv;
}

/**
 * 로딩 메시지 숨기기
 * @param {HTMLElement} element - 로딩 요소
 */
function hideLoadingMessage(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
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
