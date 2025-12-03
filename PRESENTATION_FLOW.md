# Pictos 영화 추천 시스템 - 발표 자료 (20분)

## 📌 사용자 플로우 (User Flow)

```
[1] 첫 방문
    ↓
[2] 취향 설정 팝업 (3단계)
    ├─ Phase 1: 카드 선택 (5개 질문)
    ├─ Phase 2: VS 게임 (13라운드)
    └─ Phase 3: 결과 분석
    ↓
[3] 메인 페이지
    ├─ 히어로 캐러셀 (맞춤 추천)
    ├─ 오늘 이건 어때 (일일 추천)
    └─ TOP 100 (인기 영화)
    ↓
[4] 영화 상세 정보
    ├─ 평점/출연진/리뷰
    └─ Watchlist 추가
    ↓
[5] 회원가입 & 로그인
    └─ 프로필 저장
```

---

## 🎯 발표 순서 및 핵심 코드 설명

### **1단계: 첫 방문 - 초기화** (2분)
**파일:** `src/js/main.js`

#### 설명 포인트:
- 앱 초기화 로직
- localStorage에서 사용자 프로필 확인
- 프로필 없으면 팝업 자동 표시

#### 핵심 코드:
```javascript
// main.js: 14-22 (초기화)
async function initApp() {
  const savedProfile = localStorage.getItem('userProfile');

  if (!savedProfile) {
    // 팝업 자동 표시
    document.getElementById('popupFrame').style.display = 'block';
  }

  // TMDB API로 영화 데이터 로드
  await loadMovies();
}
```

**강조점:**
- localStorage 기반 상태 관리
- 첫 방문 감지 로직

---

### **2단계: 취향 설정 - Phase 1 (카드 선택)** (3분)
**파일:** `src/js/popup.js`

#### 설명 포인트:
- 5개 질문으로 기본 취향 수집
- 장르, 무드, 탐색 스타일 파악
- 각 질문은 독립적인 페이지로 구성

#### 핵심 코드:
```javascript
// popup.js: 80-120 (질문 렌더링)
function renderQuestionPage(pageIndex) {
  const question = QUESTIONS[pageIndex];

  // 카드 그리드 생성
  question.choices.forEach(choice => {
    const card = document.createElement('div');
    card.className = 'choice-card';

    // 클릭 시 선택/해제
    card.onclick = () => {
      if (question.type === 'single') {
        // 단일 선택
      } else {
        // 다중 선택
      }
    };
  });
}
```

**강조점:**
- 사용자 친화적 카드 UI
- 단일/다중 선택 구분
- 진행률 표시

---

### **3단계: 취향 설정 - Phase 2 (VS 게임)** (4분)
**파일:** `src/js/vs-game/vsGameEngine.js`

#### 설명 포인트:
- **3-Layer 취향 분석 시스템**
  1. **Worldview** (세계관): 현실 vs 환상
  2. **Stimulation** (자극): 두뇌(brain) vs 감성(heart) vs 육체(body)
  3. **Texture** (분위기): 온도(warm/cold), 밀도(light/heavy)

- **2-Phase 게임 구조**
  - Phase 1 (10라운드): 고정 영화로 취향 탐색
  - Phase 2 (3라운드): 동적 영화로 취향 검증

#### 핵심 코드:
```javascript
// vsGameEngine.js: 34-127 (Phase 1 고정 라운드)
const PHASE1_FIXED_ROUNDS = [
  // R1: 현실 vs 환상
  {
    layer: 'worldview',
    movieA: { id: 278, attribute: 'reality' },    // 쇼생크 탈출
    movieB: { id: 157336, attribute: 'fantasy' }  // 인터스텔라
  },
  // R4: 두뇌 vs 감성
  {
    layer: 'stimulation',
    movieA: { id: 9693, attribute: 'brain' },     // 셜록 홈즈
    movieB: { id: 1022789, attribute: 'heart' }   // 인사이드 아웃 2
  }
  // ... 10라운드
];

// vsGameEngine.js: 337-399 (Phase 2 동적 생성)
async generatePhase2Rounds() {
  // Phase 1 결과 기반으로 검증 라운드 생성
  const winner = this.phase1Results.worldview;

  // 사용자가 선호한 속성의 영화 선택
  // TMDB API로 동적 검색
  const movies = await this.searchMoviesByAttribute(winner);
}

// vsGameEngine.js: 236-285 (선택 처리 및 점수 계산)
async processChoice(choice) {
  const round = this.getCurrentRound();
  const movie = choice === 'A' ? round.movieA : round.movieB;

  // 점수 업데이트
  this.scores[round.layer][movie.attribute]++;

  // Phase 2에서는 신뢰도 조정
  if (this.phase === 2) {
    if (movie.expected) {
      this.confidence++; // 예상대로 선택
    } else {
      this.confidence--; // 예상과 반대
    }
  }
}
```

**강조점:**
- 3-Layer 시스템의 과학적 접근
- Phase 2의 동적 검증 로직
- 신뢰도 기반 정확도 향상

---

### **4단계: 취향 분석 결과** (2분)
**파일:** `src/js/vs-game/vsGameEngine.js`, `src/js/popup.js`

#### 설명 포인트:
- 13라운드 결과를 종합 분석
- 퍼센트 기반 강도 표현
- 한 문장 취향 요약 생성

#### 핵심 코드:
```javascript
// vsGameEngine.js: 606-666 (결과 분석)
getResults() {
  // 퍼센트 계산
  const totalWorldview = this.scores.worldview.reality +
                         this.scores.worldview.fantasy;
  const realityPercent = (this.scores.worldview.reality / totalWorldview) * 100;

  // 강도 표현 변환
  function getIntensity(percent) {
    if (percent >= 80) return '매우 강함';
    if (percent >= 60) return '강함';
    if (percent >= 40) return '보통';
    return '약함';
  }

  return {
    worldview: {
      label: realityPercent > 50 ? '현실' : '환상',
      intensity: getIntensity(Math.max(realityPercent, 100-realityPercent)),
      percent: Math.max(realityPercent, 100-realityPercent)
    }
    // ... 다른 레이어들
  };
}

// vsGameEngine.js: 562-604 (한 문장 요약)
generateSummary(vsProfile) {
  const parts = [];

  // 세계관
  parts.push(vsProfile.worldview.label === '현실'
    ? '현실적인 이야기를 선호하며'
    : '환상적인 세계관을 추구하며');

  // 자극
  const stim = vsProfile.stimulation.primary;
  if (stim === 'brain') parts.push('지적 자극을 중시하고');
  else if (stim === 'heart') parts.push('감성적 교감을 원하며');

  // 분위기
  parts.push(vsProfile.texture.temperature.label === '따뜻함'
    ? '따뜻한 온기를 추구합니다'
    : '냉철한 긴장감을 선호합니다');

  return parts.join(', ');
}
```

**강조점:**
- 정량적 분석 (퍼센트)
- 정성적 표현 (강도)
- 자연스러운 한국어 요약

---

### **5단계: 맞춤 추천 - 히어로 캐러셀** (2분)
**파일:** `src/js/renderer/movieRenderer.js`

#### 설명 포인트:
- VS 게임 결과 기반 영화 추천
- TMDB API 키워드 매핑
- 자동 캐러셀 UI

#### 핵심 코드:
```javascript
// movieRenderer.js: 143-184 (히어로 캐러셀 로드)
export async function loadHeroCarousel() {
  const savedProfile = localStorage.getItem('userProfile');

  if (savedProfile) {
    const profile = JSON.parse(savedProfile);

    // VS 게임 추천 영화 우선 사용
    if (profile.recommendedMovies) {
      movieList = profile.recommendedMovies.slice(0, 5);
    } else {
      // 프로필 기반 추천
      const data = await window.tmdbApi.getPersonalizedRecommendations(profile);
      movieList = data.results.slice(0, 5);
    }
  }

  // 예고편 정보 병렬 로드
  heroMovies = await Promise.all(
    movieList.map(async (movie) => {
      const videos = await window.tmdbApi.getMovieVideos(movie.id);
      return { ...movie, trailer: findBestTrailer(videos) };
    })
  );

  renderHeroCarousel();
}

// tmdbApi.js: 150-180 (맞춤 추천 API)
async getPersonalizedRecommendations(profile) {
  // VS 게임 결과를 TMDB 파라미터로 변환
  const genres = this.mapGenresToIds(profile.genres);
  const keywords = this.extractKeywords(profile.vsResults);

  const params = {
    with_genres: genres.join(','),
    with_keywords: keywords.join(','),
    sort_by: 'vote_average.desc',
    'vote_count.gte': 1000
  };

  return this.discover('movie', params);
}
```

**강조점:**
- VS 게임과 추천 시스템 연동
- 비동기 병렬 처리 최적화
- 예고편 자동 로드

---

### **6단계: 영화 탐색 - 검색 & 필터** (2분)
**파일:** `src/js/main.js`, `src/js/tmdbApi.js`

#### 설명 포인트:
- 실시간 검색 (디바운싱)
- 정렬 기능 (인기도, 평점)
- 무한 스크롤 (더보기)

#### 핵심 코드:
```javascript
// main.js: 120-150 (검색 기능)
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();

  // 디바운싱: 300ms 대기
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (query.length >= 2) {
      const results = await window.tmdbApi.searchMovies(query);
      displaySearchResults(results.results);
    }
  }, 300);
});

// main.js: 200-230 (정렬 기능)
sortSelect.addEventListener('change', async (e) => {
  currentSort = e.target.value;
  currentPage = 1;

  // 새로운 정렬로 영화 재로드
  const data = await window.tmdbApi.getPopularMovies(1, currentSort);
  renderMovies(data.results.map(transformMovie));
});
```

**강조점:**
- 디바운싱으로 API 호출 최적화
- 사용자 경험 개선

---

### **7단계: 영화 상세 정보** (2분)
**파일:** `src/js/modals/modals.js`

#### 설명 포인트:
- TMDB API 다중 호출 최적화
- 출연진, 리뷰, 유사 영화 통합
- 스트리밍 서비스 링크 제공

#### 핵심 코드:
```javascript
// modals.js: 30-100 (영화 상세 모달)
export async function openMovieDetailModal(movieId) {
  showLoadingState();

  // 병렬로 데이터 로드 (최적화)
  const [details, credits, reviews, similar, providers] = await Promise.all([
    window.tmdbApi.getMovieDetails(movieId),
    window.tmdbApi.getMovieCredits(movieId),
    window.tmdbApi.getMovieReviews(movieId),
    window.tmdbApi.getSimilarMovies(movieId),
    window.tmdbApi.getWatchProviders(movieId)
  ]);

  // UI 렌더링
  renderMovieDetail({ details, credits, reviews, similar, providers });
}
```

**강조점:**
- Promise.all로 병렬 처리
- 로딩 상태 관리

---

### **8단계: Watchlist 관리** (2분)
**파일:** `src/js/watchlist/watchlist.js`

#### 설명 포인트:
- 사용자별 watchlist 저장 (localStorage)
- 게스트 모드 지원
- 최대 10개 제한

#### 핵심 코드:
```javascript
// watchlist.js: 55-92 (토글 기능)
export function toggleWatchlist(movie, event) {
  event.stopPropagation();

  const watchlist = getWatchlist();
  const index = watchlist.findIndex(m => m.id === movie.id);

  if (index > -1) {
    // 제거
    watchlist.splice(index, 1);
  } else {
    // 추가
    if (watchlist.length >= 10) {
      alert('최대 10개까지 저장 가능합니다.');
      return;
    }

    // 이미지 URL 정규화 (poster_path 지원)
    const imageUrl = movie.image ||
      (movie.poster_path ? window.tmdbApi.getImageUrl(movie.poster_path, 'w342') : '');

    watchlist.push({
      id: movie.id,
      title: movie.title,
      image: imageUrl,
      rating: movie.rating || movie.vote_average?.toFixed(1),
      year: movie.year || movie.release_date?.split('-')[0]
    });
  }

  saveWatchlist(watchlist);
  updateWatchlistIcons();
}
```

**강조점:**
- 다양한 영화 객체 형식 지원
- 실시간 UI 업데이트

---

### **9단계: 회원 인증** (2분)
**파일:** `src/js/auth/auth.js`

#### 설명 포인트:
- localStorage 기반 인증
- 사용자별 데이터 분리
- 프로필 마이그레이션

#### 핵심 코드:
```javascript
// auth.js: 20-50 (회원가입)
export function register(username, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];

  // 중복 확인
  if (users.some(u => u.username === username)) {
    return { success: false, message: '이미 존재하는 아이디입니다.' };
  }

  // 게스트 데이터 마이그레이션
  const guestProfile = localStorage.getItem('userProfile');
  const guestWatchlist = localStorage.getItem('watchlist_guest');

  users.push({ username, password });
  localStorage.setItem('users', JSON.stringify(users));

  // 게스트 → 사용자 데이터 이동
  if (guestProfile) {
    localStorage.setItem(`profile_${username}`, guestProfile);
    localStorage.removeItem('userProfile');
  }
  if (guestWatchlist) {
    localStorage.setItem(`watchlist_${username}`, guestWatchlist);
    localStorage.removeItem('watchlist_guest');
  }

  return { success: true };
}
```

**강조점:**
- 게스트 → 회원 전환 시 데이터 보존
- 사용자별 네임스페이스

---

## 🎬 마무리 및 Q&A (1분)

### 프로젝트 주요 성과:
1. **3-Layer 취향 분석 시스템** - 과학적 접근
2. **동적 검증 알고리즘** - Phase 2 신뢰도 조정
3. **API 최적화** - Promise.all 병렬 처리
4. **사용자 경험** - 디바운싱, 무한 스크롤
5. **데이터 영속성** - localStorage 활용

### 기술 스택:
- Vanilla JavaScript (ES6+)
- TMDB API
- localStorage
- CSS3 (Flexbox/Grid)

---

## 📊 코드 참조 맵

| 단계 | 파일 | 주요 함수/라인 |
|------|------|---------------|
| 초기화 | `main.js` | `initApp()` (14-22) |
| Phase 1 | `popup.js` | `renderQuestionPage()` (80-120) |
| Phase 2 | `vsGameEngine.js` | `PHASE1_FIXED_ROUNDS` (34-127), `generatePhase2Rounds()` (337-399) |
| 결과 분석 | `vsGameEngine.js` | `getResults()` (606-666), `generateSummary()` (562-604) |
| 히어로 캐러셀 | `movieRenderer.js` | `loadHeroCarousel()` (143-184) |
| 검색 | `main.js` | 검색 디바운싱 (120-150) |
| 상세 모달 | `modals.js` | `openMovieDetailModal()` (30-100) |
| Watchlist | `watchlist.js` | `toggleWatchlist()` (55-92) |
| 인증 | `auth.js` | `register()` (20-50) |
