/* ============================================
   Pictos 메인 스크립트
   TMDB API 모듈(tmdbApi.js) 사용
   ============================================ */

const CONFIG = {
  HERO_CAROUSEL_COUNT: 5,
  DAILY_MOVIES_COUNT: 20,
  INITIAL_MOVIES_COUNT: 20,
  TOTAL_PAGES: 5,
};

/* ============================================
   전역 변수
   ============================================ */
let movies = [];
let heroMovies = [];
let currentHeroIndex = 0;
let isShowingAll = false;

/* ============================================
   유틸리티
   ============================================ */
function getGenreNames(genreIds) {
  const GENRE_MAP = {
    28: "액션", 12: "모험", 16: "애니메이션", 35: "코미디",
    80: "범죄", 99: "다큐멘터리", 18: "드라마", 10751: "가족",
    14: "판타지", 36: "역사", 27: "공포", 10402: "음악",
    9648: "미스터리", 10749: "로맨스", 878: "SF", 53: "스릴러",
    10752: "전쟁", 37: "서부"
  };
  if (!genreIds) return "";
  return genreIds.map(id => GENRE_MAP[id]).filter(Boolean).join(", ");
}

function transformMovieData(movie) {
  return {
    id: movie.id,
    title: movie.title || movie.name || "제목 없음",
    year: movie.release_date?.split("-")[0] || "N/A",
    genre_ids: movie.genre_ids,
    rating: movie.vote_average?.toFixed(1) || "0.0",
    likes: `${(movie.vote_count / 1000).toFixed(1)}K`,
    image: tmdbApi.getImageUrl(movie.poster_path, "w500"),
  };
}

/* ============================================
   영화 목록 렌더링
   ============================================ */
function renderMovies(movieList) {
  const container = document.getElementById("movies");
  if (!container) return;

  const fragment = document.createDocumentFragment();

  movieList.forEach((movie, index) => {
    const card = document.createElement("div");
    card.className = "movie_item";
    card.dataset.movieId = movie.id;
    card.style.cursor = "pointer";
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

    // ✅ 포스터 클릭 시 상세페이지 이동 (경로 수정)
    card.onclick = () => {
      const targetUrl = `/movieReviewer-main/src/pages/detail.html?id=${movie.id}`;
      console.log("포스터 클릭됨:", movie.title, movie.id, targetUrl);
      window.location.href = targetUrl;
    };

    fragment.appendChild(card);
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

/* ============================================
   캐러셀 관련
   ============================================ */
function updateHeroCarousel() {
  const track = document.getElementById("heroCarouselTrack");
  const dots = document.querySelectorAll(".carousel-dot");
  if (!track) return;
  track.style.transform = `translateX(-${currentHeroIndex * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle("active", i === currentHeroIndex));
}

function goToHeroSlide(index) {
  currentHeroIndex = index;
  updateHeroCarousel();
}

function setupHeroCarouselEvents() {
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");

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

/* ============================================
   데이터 로드
   ============================================ */
async function fetchMovies() {
  try {
    const pagePromises = Array.from(
      { length: CONFIG.TOTAL_PAGES },
      (_, i) => tmdbApi.getPopularMovies(i + 1)
    );

    const results = await Promise.all(pagePromises);
    movies = results.flatMap(data => data.results).map(transformMovieData);

    renderMovies(movies.slice(0, CONFIG.INITIAL_MOVIES_COUNT));

    const viewMoreBtn = document.getElementById("viewMoreBtn");
    if (viewMoreBtn && !isShowingAll) {
      viewMoreBtn.style.display = "block";
    }
  } catch (error) {
    console.error("영화 데이터 로딩 실패:", error);
  }
}

async function loadHeroCarousel() {
  try {
    const data = await tmdbApi.getPopularMovies(1);
    heroMovies = data.results.slice(0, CONFIG.HERO_CAROUSEL_COUNT);

    const track = document.getElementById("heroCarouselTrack");
    const dotsContainer = document.getElementById("heroCarouselDots");

    if (!track || !dotsContainer) return;

    track.innerHTML = heroMovies.map((movie) => `
      <div class="hero-slide" style="background-image: url('${tmdbApi.getImageUrl(movie.backdrop_path, 'original')}')">
        <div class="hero-content">
          <h1>${movie.title}</h1>
          <p>${movie.overview || "영화 설명이 없습니다."}</p>
          <button class="btn-primary" onclick="window.location.href='/movieReviewer-main/src/pages/detail.html?id=${movie.id}'">
            상세보기
          </button>
        </div>
      </div>
    `).join("");

    dotsContainer.innerHTML = heroMovies.map((_, i) =>
      `<button class="carousel-dot ${i === 0 ? "active" : ""}" onclick="goToHeroSlide(${i})"></button>`
    ).join("");

    setupHeroCarouselEvents();
    updateHeroCarousel();
  } catch (error) {
    console.error("히어로 캐러셀 로딩 실패:", error);
  }
}

/* ============================================
   검색 기능
   ============================================ */
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  let searchTimeout;
  searchInput.oninput = async (e) => {
    clearTimeout(searchTimeout);
    const keyword = e.target.value.trim();

    if (keyword.length === 0) {
      renderMovies(movies.slice(0, isShowingAll ? movies.length : CONFIG.INITIAL_MOVIES_COUNT));
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const [koData, enData] = await Promise.all([
          tmdbApi.searchMovies(keyword, 1, { language: "ko-KR" }),
          tmdbApi.searchMovies(keyword, 1, { language: "en-US" }),
        ]);

        const allMovies = [...koData.results];
        enData.results.forEach((movie) => {
          if (!allMovies.find((m) => m.id === movie.id)) {
            allMovies.push(movie);
          }
        });

        const searchResults = allMovies.slice(0, 20).map(transformMovieData);
        renderMovies(searchResults);
      } catch (error) {
        console.error("검색 실패:", error);
      }
    }, 300);
  };
}

/* ============================================
   초기화
   ============================================ */
function initializeMainContent() {
  loadHeroCarousel();
  fetchMovies();
  setupSearch();

  const viewMoreBtn = document.getElementById("viewMoreBtn");
  if (viewMoreBtn) {
    viewMoreBtn.onclick = () => {
      isShowingAll = true;
      renderMovies(movies);
      viewMoreBtn.style.display = "none";
    };
  }
}

/* ============================================
   DOM 로드 후 실행
   ============================================ */
window.addEventListener("DOMContentLoaded", initializeMainContent);
