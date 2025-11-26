/* ============================================
   영화 렌더링 모듈 (Movie Renderer)

   역할:
   - 영화 목록, 히어로 캐러셀, 일일 추천 등 영화 UI 렌더링
   - DocumentFragment를 사용한 성능 최적화 렌더링
   - 캐러셀 컨트롤 및 스크롤 기능
   ============================================ */

import { CONFIG } from '../config/constants.js';
import { getGenreNames, findBestTrailer, enrichProfileWithDislikedGenres } from '../utils/utils.js';
import { isInWatchlist, toggleWatchlist, updateWatchlistIcons } from '../watchlist/watchlist.js';
import { openMovieDetailModal, openTrailerModal } from '../modals/modals.js';

/* ============================================
   전역 상태 (Global State)
   ============================================ */

// 히어로 캐러셀 영화 목록 (Hero carousel movies)
let heroMovies = [];

// 현재 히어로 캐러셀 인덱스 (Current hero carousel index)
let currentHeroIndex = 0;

/* ============================================
   영화 목록 렌더링 (Movie List Rendering)
   ============================================ */

/**
 * 영화 목록 렌더링 (DocumentFragment 사용)
 * @param {Array} movieList - 영화 객체 배열
 */
export function renderMovies(movieList) {
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
      <img src="${movie.image}" alt="${movie.title}">
      <div class="movie-info">
        <div class="title">${movie.title}</div>
        <div class="movie-meta">${movie.year} · ${getGenreNames(movie.genre_ids)}</div>
        <div class="movie-stats">
          <span class="likes">좋아요 ${movie.likes}</span>
          <span class="star-rating">★ ${movie.rating}</span>
          <button class="watchlist-btn-icon ${inWatchlist ? 'active' : ''}"
                  data-movie-id="${movie.id}"
                  title="${inWatchlist ? '워치리스트에서 제거' : '워치리스트에 추가'}">
            ${inWatchlist ? '🔖' : '🏷️'}
          </button>
        </div>
      </div>
    `;

    // 영화 카드 클릭 시 상세 모달 열기 (Open detail modal on card click)
    card.onclick = () => openMovieDetailModal(movie.id);

    // 워치리스트 버튼 클릭 (Watchlist button click)
    const watchlistBtn = card.querySelector('.watchlist-btn-icon');
    watchlistBtn.onclick = (e) => toggleWatchlist(movie, e);

    fragment.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

/* ============================================
   히어로 캐러셀 렌더링 (Hero Carousel Rendering)
   ============================================ */

/**
 * 히어로 캐러셀 렌더링
 */
export function renderHeroCarousel() {
  const track = document.getElementById('heroCarouselTrack');
  const dotsContainer = document.getElementById('heroCarouselDots');

  if (!track || !dotsContainer) return;

  const trackFragment = document.createDocumentFragment();
  const dotsFragment = document.createDocumentFragment();

  heroMovies.forEach((movie, index) => {
    const backdropUrl = movie.backdrop_path
      ? window.tmdbApi.getImageUrl(movie.backdrop_path, 'original')
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

    // 도트 생성 (Create dot)
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

/**
 * 히어로 캐러셀 로드
 */
export async function loadHeroCarousel() {
  try {
    const savedProfile = localStorage.getItem('userProfile');
    let movieList;

    if (savedProfile) {
      const profile = JSON.parse(savedProfile);

      // VS 게임 추천 영화가 있으면 우선 사용
      if (profile.recommendedMovies && profile.recommendedMovies.length > 0) {
        console.log('VS 게임 추천 영화 사용:', profile.recommendedMovies.length, '개');
        movieList = profile.recommendedMovies.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
      } else {
        // 사용자 프로필 기반 추천 (Profile-based recommendations)
        const enrichedProfile = enrichProfileWithDislikedGenres(profile);
        const data = await window.tmdbApi.getPersonalizedRecommendations(enrichedProfile);
        movieList = data.results.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
      }
    } else {
      // 인기 영화 (Popular movies)
      const data = await window.tmdbApi.getPopularMovies(1);
      movieList = data.results.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
    }

    // 예고편 정보 병렬 로드 (Load trailer info in parallel)
    heroMovies = await Promise.all(
      movieList.map(async (movie) => {
        try {
          const videos = await window.tmdbApi.getMovieVideos(movie.id);
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

/**
 * 히어로 캐러셀 업데이트
 */
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

/**
 * 히어로 슬라이드로 이동
 * @param {number} index - 슬라이드 인덱스
 */
function goToHeroSlide(index) {
  currentHeroIndex = index;
  updateHeroCarousel();
}

/**
 * 히어로 캐러셀 이벤트 설정
 */
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

/**
 * 히어로 버튼 이벤트 설정
 */
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

/* ============================================
   일일 추천 렌더링 (Daily Recommendations)
   ============================================ */

/**
 * 일일 추천 로드
 */
export async function loadDailyRecommendations() {
  try {
    const container = document.getElementById('dailyMovieScroll');
    if (!container) return;

    const savedProfile = localStorage.getItem('userProfile');
    let movieList;

    if (savedProfile) {
      // 사용자 프로필 기반 (Profile-based)
      const profile = enrichProfileWithDislikedGenres(JSON.parse(savedProfile));
      const randomPage = Math.random() < 0.7 ? 1 : 2; // 70% 확률로 1페이지
      const data = await window.tmdbApi.getPersonalizedRecommendations({ ...profile, page: randomPage });
      movieList = data.results.slice(0, CONFIG.DAILY_MOVIES_COUNT);
    } else {
      // 트렌딩 영화 (Trending movies)
      const data = await window.tmdbApi.getTrending('movie', 'week');
      movieList = data.results.slice(0, CONFIG.DAILY_MOVIES_COUNT);
    }

    // DocumentFragment로 성능 최적화 (Performance optimization with DocumentFragment)
    const fragment = document.createDocumentFragment();
    movieList.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'daily-movie-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <img src="${window.tmdbApi.getImageUrl(movie.poster_path, 'w342')}" alt="${movie.title}">
        <div class="daily-movie-info">
          <div class="daily-movie-title">${movie.title}</div>
          <div class="daily-movie-rating">★ ${movie.vote_average.toFixed(1)}</div>
        </div>
      `;
      // 카드 클릭 시 상세 모달 열기 (Open detail modal on card click)
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

/**
 * 일일 추천 스크롤 버튼 설정
 */
function setupDailyScrollButtons() {
  const container = document.getElementById('dailyMovieScroll');
  const prevBtn = document.getElementById('dailyPrev');
  const nextBtn = document.getElementById('dailyNext');

  if (!container || !prevBtn || !nextBtn) return;

  prevBtn.onclick = () => container.scrollBy({ left: -CONFIG.SCROLL_AMOUNT, behavior: 'smooth' });
  nextBtn.onclick = () => container.scrollBy({ left: CONFIG.SCROLL_AMOUNT, behavior: 'smooth' });
}

/* ============================================
   히어로 캐러셀 상태 접근자 (Accessors)
   ============================================ */

/**
 * 히어로 영화 목록 반환
 * @returns {Array} 히어로 영화 배열
 */
export function getHeroMovies() {
  return heroMovies;
}

/**
 * 현재 히어로 인덱스 반환
 * @returns {number} 현재 인덱스
 */
export function getCurrentHeroIndex() {
  return currentHeroIndex;
}
