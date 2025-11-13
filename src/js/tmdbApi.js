/* ============================================
   TMDB API Service Module
   - TMDB API 호출을 중앙화하여 관리
   - 재사용 가능한 API 메서드 제공
   - 에러 핸들링 및 로깅
   ============================================ */

/* ============================================
   TMDB API 설정
   ============================================ */
const TMDB_CONFIG = {
  API_KEY: 'f325a6979b2e26db0c5ee2420d0f3138',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMG_BASE_URL: 'https://image.tmdb.org/t/p',
  AUTH_TOKEN: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMzI1YTY5NzliMmUyNmRiMGM1ZWUyNDIwZDBmMzEzOCIsIm5iZiI6MTc2MjE1NTY0MC4wMDcsInN1YiI6IjY5MDg1Yzc4NGQ0ZDdkYzlhYTU5ODg4ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.tXYlaIIml1lr3ZoFa6CqWtKkXTgyWTVdSjAS6wjDv5I',

  // 이미지 사이즈 옵션
  IMAGE_SIZES: {
    POSTER: {
      SMALL: 'w185',
      MEDIUM: 'w342',
      LARGE: 'w500',
      ORIGINAL: 'original'
    },
    BACKDROP: {
      SMALL: 'w300',
      MEDIUM: 'w780',
      LARGE: 'w1280',
      ORIGINAL: 'original'
    },
    PROFILE: {
      SMALL: 'w45',
      MEDIUM: 'w185',
      LARGE: 'h632',
      ORIGINAL: 'original'
    }
  }
};

/* ============================================
   TMDB API Service 클래스
   ============================================ */
class TMDBApiService {
  constructor() {
    this.config = TMDB_CONFIG;
    this.cache = new Map(); // 간단한 캐시
    this.cacheExpiry = 5 * 60 * 1000; // 5분
  }

  /* ============================================
     내부 메서드: API 요청 처리
     ============================================ */

  /**
   * API 요청을 보내고 응답을 반환
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} params - 쿼리 파라미터
   * @param {boolean} useCache - 캐시 사용 여부
   * @returns {Promise<Object>} API 응답 데이터
   */
  async _fetch(endpoint, params = {}, useCache = true) {
    // 캐시 키 생성
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;

    // 캐시 확인
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`[TMDB API] Cache hit: ${endpoint}`);
        return cached.data;
      }
    }

    // URL 생성
    const url = new URL(`${this.config.BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', this.config.API_KEY);

    // 기본 파라미터 추가
    if (!params.language) {
      params.language = 'ko-KR';
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    try {
      console.log(`[TMDB API] Fetching: ${endpoint}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 캐시 저장
      if (useCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error(`[TMDB API Error] ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * 이미지 URL 생성
   * @param {string} path - 이미지 경로
   * @param {string} size - 이미지 사이즈
   * @returns {string} 전체 이미지 URL
   */
  getImageUrl(path, size = 'w500') {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `${this.config.IMG_BASE_URL}/${size}${path}`;
  }

  /* ============================================
     영화 관련 API
     ============================================ */

  /**
   * 인기 영화 가져오기
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 영화 목록
   */
  async getPopularMovies(page = 1) {
    return this._fetch('/movie/popular', { page });
  }

  /**
   * 최고 평점 영화 가져오기
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 영화 목록
   */
  async getTopRatedMovies(page = 1) {
    return this._fetch('/movie/top_rated', { page });
  }

  /**
   * 현재 상영중인 영화 가져오기
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 영화 목록
   */
  async getNowPlayingMovies(page = 1) {
    return this._fetch('/movie/now_playing', { page });
  }

  /**
   * 개봉 예정 영화 가져오기
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 영화 목록
   */
  async getUpcomingMovies(page = 1) {
    return this._fetch('/movie/upcoming', { page });
  }

  /**
   * 영화 상세 정보 가져오기
   * @param {number} movieId - 영화 ID
   * @param {string} appendToResponse - 추가 정보 (credits, videos, similar 등)
   * @returns {Promise<Object>} 영화 상세 정보
   */
  async getMovieDetails(movieId, appendToResponse = '') {
    const params = appendToResponse ? { append_to_response: appendToResponse } : {};
    return this._fetch(`/movie/${movieId}`, params);
  }

  /**
   * 영화 출연진 및 제작진 정보 가져오기
   * @param {number} movieId - 영화 ID
   * @returns {Promise<Object>} 출연진 정보
   */
  async getMovieCredits(movieId) {
    return this._fetch(`/movie/${movieId}/credits`);
  }

  /**
   * 영화 예고편 및 비디오 가져오기
   * @param {number} movieId - 영화 ID
   * @returns {Promise<Object>} 비디오 정보
   */
  async getMovieVideos(movieId) {
    return this._fetch(`/movie/${movieId}/videos`);
  }

  /**
   * 비슷한 영화 가져오기
   * @param {number} movieId - 영화 ID
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 비슷한 영화 목록
   */
  async getSimilarMovies(movieId, page = 1) {
    return this._fetch(`/movie/${movieId}/similar`, { page });
  }

  /**
   * 추천 영화 가져오기
   * @param {number} movieId - 영화 ID
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 추천 영화 목록
   */
  async getRecommendedMovies(movieId, page = 1) {
    return this._fetch(`/movie/${movieId}/recommendations`, { page });
  }

  /**
   * 영화 리뷰 가져오기
   * @param {number} movieId - 영화 ID
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 리뷰 목록
   */
  async getMovieReviews(movieId, page = 1) {
    return this._fetch(`/movie/${movieId}/reviews`, { page });
  }

  /* ============================================
     검색 관련 API
     ============================================ */

  /**
   * 영화 검색
   * @param {string} query - 검색어
   * @param {number} page - 페이지 번호
   * @param {Object} options - 추가 옵션 (year, region 등)
   * @returns {Promise<Object>} 검색 결과
   */
  async searchMovies(query, page = 1, options = {}) {
    return this._fetch('/search/movie', {
      query,
      page,
      ...options
    }, false); // 검색은 캐시 사용 안 함
  }

  /**
   * 다중 검색 (영화, TV, 인물)
   * @param {string} query - 검색어
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 검색 결과
   */
  async searchMulti(query, page = 1) {
    return this._fetch('/search/multi', { query, page }, false);
  }

  /* ============================================
     장르 관련 API
     ============================================ */

  /**
   * 영화 장르 목록 가져오기
   * @returns {Promise<Object>} 장르 목록
   */
  async getMovieGenres() {
    return this._fetch('/genre/movie/list');
  }

  /* ============================================
     영화 발견(Discover) API
     ============================================ */

  /**
   * 영화 발견 - 다양한 필터로 영화 검색
   * @param {Object} filters - 필터 옵션
   * @returns {Promise<Object>} 영화 목록
   */
  async discoverMovies(filters = {}) {
    const defaultFilters = {
      page: 1,
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...filters
    };

    return this._fetch('/discover/movie', defaultFilters);
  }

  /**
   * 장르별 영화 가져오기 (편의 메서드)
   * @param {number|string} genreIds - 장르 ID (단일 또는 배열)
   * @param {number} page - 페이지 번호
   * @param {string} sortBy - 정렬 방식
   * @returns {Promise<Object>} 영화 목록
   */
  async getMoviesByGenre(genreIds, page = 1, sortBy = 'popularity.desc') {
    const genres = Array.isArray(genreIds) ? genreIds.join(',') : genreIds;
    return this.discoverMovies({
      with_genres: genres,
      page,
      sort_by: sortBy
    });
  }

  /**
   * 개인화된 영화 추천 (사용자 프로필 기반)
   * @param {Object} userProfile - 사용자 프로필
   * @returns {Promise<Object>} 추천 영화 목록
   */
  async getPersonalizedRecommendations(userProfile) {
    const filters = {
      page: 1,
      sort_by: userProfile.sortBy || 'popularity.desc',
      vote_count_gte: 500
    };

    // 선호 장르
    if (userProfile.genres && userProfile.genres.length > 0) {
      filters.with_genres = userProfile.genres.join(',');
    }

    // 불호 장르 제외
    if (userProfile.dislikedGenres && userProfile.dislikedGenres.length > 0) {
      filters.without_genres = userProfile.dislikedGenres.join(',');
    }

    // 평점 필터
    if (userProfile.minRating) {
      filters.vote_average_gte = userProfile.minRating;
    }

    // 개봉 연도 필터
    if (userProfile.yearFrom) {
      filters.primary_release_date_gte = `${userProfile.yearFrom}-01-01`;
    }
    if (userProfile.yearTo) {
      filters.primary_release_date_lte = `${userProfile.yearTo}-12-31`;
    }

    return this.discoverMovies(filters);
  }

  /* ============================================
     인물 관련 API
     ============================================ */

  /**
   * 인기 인물 가져오기
   * @param {number} page - 페이지 번호
   * @returns {Promise<Object>} 인물 목록
   */
  async getPopularPeople(page = 1) {
    return this._fetch('/person/popular', { page });
  }

  /**
   * 인물 상세 정보 가져오기
   * @param {number} personId - 인물 ID
   * @returns {Promise<Object>} 인물 상세 정보
   */
  async getPersonDetails(personId) {
    return this._fetch(`/person/${personId}`);
  }

  /**
   * 인물의 출연 작품 가져오기
   * @param {number} personId - 인물 ID
   * @returns {Promise<Object>} 출연 작품 목록
   */
  async getPersonMovieCredits(personId) {
    return this._fetch(`/person/${personId}/movie_credits`);
  }

  /* ============================================
     트렌딩 API
     ============================================ */

  /**
   * 트렌딩 콘텐츠 가져오기
   * @param {string} mediaType - 미디어 타입 (all, movie, tv, person)
   * @param {string} timeWindow - 시간 범위 (day, week)
   * @returns {Promise<Object>} 트렌딩 목록
   */
  async getTrending(mediaType = 'movie', timeWindow = 'week') {
    return this._fetch(`/trending/${mediaType}/${timeWindow}`);
  }

  /* ============================================
     유틸리티 메서드
     ============================================ */

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    console.log('[TMDB API] Cache cleared');
  }

  /**
   * 특정 영화의 전체 정보 가져오기 (상세, 출연진, 비디오, 비슷한 영화)
   * @param {number} movieId - 영화 ID
   * @returns {Promise<Object>} 전체 영화 정보
   */
  async getCompleteMovieInfo(movieId) {
    return this._fetch(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,similar,recommendations,reviews'
    });
  }

  /**
   * 여러 영화의 상세 정보를 병렬로 가져오기
   * @param {Array<number>} movieIds - 영화 ID 배열
   * @returns {Promise<Array>} 영화 정보 배열
   */
  async getMultipleMovies(movieIds) {
    const promises = movieIds.map(id => this.getMovieDetails(id));
    return Promise.all(promises);
  }
}

/* ============================================
   싱글톤 인스턴스 생성 및 export
   ============================================ */
const tmdbApi = new TMDBApiService();

// 전역으로 사용 가능하도록 window 객체에 추가
if (typeof window !== 'undefined') {
  window.tmdbApi = tmdbApi;
}
