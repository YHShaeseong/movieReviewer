/* ============================================
   상수 정의 파일 (Constants Configuration)

   역할:
   - 애플리케이션 전체에서 사용되는 공통 상수 정의
   - 장르 매핑, 무드 키워드, 불호 요소 매핑 등
   - API 설정 및 기본 설정값
   ============================================ */

/* ============================================
   애플리케이션 기본 설정 (App Configuration)
   ============================================ */
export const CONFIG = {
  HERO_CAROUSEL_COUNT: 5,      // 히어로 캐러셀에 표시할 영화 개수
  DAILY_MOVIES_COUNT: 20,      // 일일 추천 영화 개수
  INITIAL_MOVIES_COUNT: 20,    // 초기 로딩 시 표시할 영화 개수
  TOTAL_PAGES: 5,              // 인기 영화 로딩 페이지 수
  SCROLL_AMOUNT: 440           // 가로 스크롤 이동 거리 (px)
};

/* ============================================
   장르 ID 매핑 (TMDB Genre Mapping)
   TMDB API의 장르 ID를 한글 이름으로 변환
   ============================================ */
export const GENRE_MAP = {
  28: '액션',           // Action
  12: '모험',           // Adventure
  16: '애니메이션',      // Animation
  35: '코미디',         // Comedy
  80: '범죄',           // Crime
  99: '다큐멘터리',      // Documentary
  18: '드라마',         // Drama
  10751: '가족',        // Family
  14: '판타지',         // Fantasy
  36: '역사',           // History
  27: '공포',           // Horror
  10402: '음악',        // Music
  9648: '미스터리',     // Mystery
  10749: '로맨스',      // Romance
  878: 'SF',            // Science Fiction
  53: '스릴러',         // Thriller
  10752: '전쟁',        // War
  37: '서부'            // Western
};

/* ============================================
   무드 키워드 매핑 (Mood to Genre Keywords)
   사용자가 선택한 무드에 따라 추천할 장르 키워드
   ============================================ */
export const MOOD_KEYWORDS = {
  happy: ['comedy', 'adventure', 'family'],        // 밝고 즐거운
  dark: ['crime', 'thriller', 'mystery'],          // 어둡고 무거운
  emotional: ['romance', 'drama', 'music'],        // 감동적인
  intense: ['action', 'thriller', 'war'],          // 긴장감 넘치는
  thoughtful: ['documentary', 'history', 'drama']  // 생각을 자극하는
};

/* ============================================
   불호 요소 매핑 (Dislike Elements Mapping)
   사용자가 피하고 싶어하는 요소를 장르 ID로 변환
   ============================================ */
export const DISLIKE_MAPPING = {
  violence: { genres: [28, 80] },  // 폭력적인 장면 → 액션, 범죄
  horror: { genres: [27] },        // 공포 요소 → 공포
  sad: { genres: [] },             // 슬픈 결말 → 특정 장르 없음
  slow: { genres: [99, 36] },      // 느린 전개 → 다큐멘터리, 역사
  complex: { genres: [9648, 878] } // 복잡한 줄거리 → 미스터리, SF
};

/* ============================================
   영어-한글 매핑 (Korean Name Translation)
   UI에 표시할 한글 이름 매핑
   ============================================ */
export const KOREAN_NAMES = {
  // 장르 한글 이름
  genre: {
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
  },
  // 무드 한글 이름
  mood: {
    happy: '밝고 즐거운',
    dark: '어둡고 무거운',
    emotional: '감동적인',
    intense: '긴장감 넘치는',
    thoughtful: '생각을 자극하는'
  },
  // 불호 요소 한글 이름
  dislike: {
    violence: '폭력적인 장면',
    horror: '공포 요소',
    sad: '슬픈 결말',
    slow: '느린 전개',
    complex: '복잡한 줄거리'
  }
};

/* ============================================
   스트리밍 서비스 URL 매핑 (Streaming Service URLs)
   한국에서 실제 사용 가능한 스트리밍 서비스 정보
   ============================================ */
export const STREAMING_URLS = {
  8: { name: 'Netflix', url: 'https://www.netflix.com/search?q=' },
  337: { name: 'Disney+', url: 'https://www.disneyplus.com/ko-kr/search?q=' },
  356: { name: 'wavve', url: 'https://www.wavve.com/search?searchWord=' },
  97: { name: 'Watcha', url: 'https://watcha.com/search?query=' },
  1796: { name: 'Netflix basic with Ads', url: 'https://www.netflix.com/search?q=' },
  1899: { name: 'Max', url: 'https://www.max.com/search?q=' },
  531: { name: 'Paramount+', url: 'https://www.paramountplus.com/search?q=' },
  350: { name: 'Apple TV+', url: 'https://tv.apple.com/kr/search?term=' },
  2: { name: 'Apple TV', url: 'https://tv.apple.com/kr/search?term=' },
  68: { name: 'Microsoft Store', url: 'https://www.microsoft.com/ko-kr/search?q=' },
  96: { name: 'Naver Store', url: 'https://series.naver.com/search/search.series?query=' }
  // 3: Google Play 무비 제거됨 (removed)
};
