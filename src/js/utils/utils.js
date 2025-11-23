/* ============================================
   유틸리티 함수 모음 (Utility Functions)

   역할:
   - 애플리케이션 전체에서 재사용되는 헬퍼 함수들
   - 데이터 변환, 필터링, 포맷팅 등
   ============================================ */

import { DISLIKE_MAPPING, GENRE_MAP, KOREAN_NAMES } from '../config/constants.js';

/* ============================================
   데이터 변환 함수 (Data Transformation)
   ============================================ */

/**
 * 불호 요소로부터 불호 장르 ID 배열 계산
 * @param {Array<string>} dislikes - 불호 요소 배열 ['violence', 'horror', ...]
 * @returns {Array<number>} 불호 장르 ID 배열
 */
export function getDislikedGenres(dislikes) {
  if (!dislikes) return [];
  return dislikes.flatMap(dislike => DISLIKE_MAPPING[dislike]?.genres || []);
}

/**
 * 사용자 프로필에 불호 장르 정보 추가
 * @param {Object} profile - 사용자 프로필 객체
 * @returns {Object} 불호 장르가 추가된 프로필
 */
export function enrichProfileWithDislikedGenres(profile) {
  return {
    ...profile,
    dislikedGenres: getDislikedGenres(profile.dislikes)
  };
}

/**
 * TMDB 영화 데이터를 앱 내부 포맷으로 변환
 * @param {Object} movie - TMDB API 영화 객체
 * @returns {Object} 변환된 영화 객체
 */
export function transformMovieData(movie) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.split('-')[0] || 'N/A',
    genre_ids: movie.genre_ids,
    rating: movie.vote_average.toFixed(1),
    likes: `${(movie.vote_count / 1000).toFixed(1)}K`,
    image: window.tmdbApi.getImageUrl(movie.poster_path, 'w500')
  };
}

/* ============================================
   포맷팅 함수 (Formatting Functions)
   ============================================ */

/**
 * 장르 ID 배열을 한글 이름 문자열로 변환
 * @param {Array<number>} genreIds - 장르 ID 배열
 * @returns {string} 쉼표로 구분된 장르 이름 문자열
 */
export function getGenreNames(genreIds) {
  if (!genreIds) return '';
  return genreIds.map(id => GENRE_MAP[id]).filter(Boolean).join(', ');
}

/**
 * 영어 키를 한글 이름으로 변환
 * @param {string} type - 카테고리 ('genre', 'mood', 'dislike')
 * @param {string} key - 영어 키
 * @returns {string} 한글 이름
 */
export function getKoreanName(type, key) {
  return KOREAN_NAMES[type]?.[key] || key;
}

/* ============================================
   비디오/예고편 관련 (Video/Trailer Utils)
   ============================================ */

/**
 * 최적의 예고편 선택 (공식 > 한국어 > 영어 순)
 * @param {Object} videos - TMDB videos API 응답
 * @returns {Object|null} 최적의 예고편 객체 또는 null
 */
export function findBestTrailer(videos) {
  const trailers = videos.results.filter(v =>
    v.type === 'Trailer' && v.site === 'YouTube'
  );

  if (trailers.length === 0) return null;

  // 우선순위 점수 계산: 공식(100점) + 언어(한국어 50점, 영어 25점)
  return trailers
    .map(t => ({
      ...t,
      score: (t.official ? 100 : 0) +
             (t.iso_639_1 === 'ko' ? 50 : t.iso_639_1 === 'en' ? 25 : 0)
    }))
    .sort((a, b) => b.score - a.score)[0];
}
