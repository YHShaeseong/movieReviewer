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

#### 핵심 코드 위치:
```javascript
// src/js/main.js: 462-497 (DOMContentLoaded 이벤트)
window.addEventListener('DOMContentLoaded', () => {
  // 비로그인 상태: 프로필 없으면 팝업 자동 표시 (489-492)
  popupFrame.style.display = 'block';

  // 이벤트 리스너 등록 (496)
  setupEventListeners();
});
```

**강조점:**
- localStorage 기반 상태 관리 (`userProfile`, `server_${username}_profile` 키 사용)
- 첫 방문 감지: 비로그인이고 `userProfile` 없으면 팝업 자동 표시

---

### **2단계: 취향 설정 - Phase 1 (카드 선택)** (3분)
**파일:** `src/js/popup.js`

#### 설명 포인트:
- 5개 질문으로 기본 취향 수집
- 장르, 무드, 탐색 스타일 파악
- 각 질문은 독립적인 페이지로 구성

#### 핵심 코드 위치:
```javascript
// src/js/popup.js: 68-116 (카드 클릭 핸들러)
function setupFirstPopupHandlers() {
  firstPopup.addEventListener('click', (e) => {
    const card = e.target.closest('.choice-card');

    if (isSingleSelect) {
      // 단일 선택: 같은 페이지의 다른 카드 선택 해제 (79-84)
      questionPage.querySelectorAll('.choice-card.single-select').forEach(c => {
        c.classList.remove('selected');
      });
    } else {
      // 복수 선택: 토글 (86-88)
      card.classList.toggle('selected');
    }
  });
}

// src/js/popup.js: 136-179 (질문 검증 및 저장)
function validateAndSaveQuestion(questionNum, page) {
  switch (questionNum) {
    case '1': userProfile.genres = [...]; // 장르 (141-149)
    case '2': userProfile.mood = ...; // 무드 (151-157)
    case '3': userProfile.dislikes = [...]; // 불호 요소 (159-163)
    case '4': userProfile.sortBy = ...; // 탐색 스타일 (165-171)
  }
}
```

**강조점:**
- 사용자 친화적 카드 UI (단일/다중 선택 구분)
- `userProfile` 객체에 실시간 저장
- 영화 검색 기능 (194-257): 디바운싱 300ms로 API 호출 최적화

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

#### 🎯 [추가] 3-Layer 방식을 택한 이유

**1. 기존 추천 시스템의 한계**
```
기존 방식 (1차원):
- 장르만 수집 → "액션을 좋아하세요?"
- 문제점: 같은 액션이라도 '다크 나이트'와 '어벤져스'는 전혀 다름
- 결과: 피상적인 추천
```

**2. 3-Layer 분석의 장점**
```
Layer 1: Worldview (세계관)
- 왜 필요? 현실적 범죄물 vs SF 액션 구분
- 예시: 기생충(현실) vs 인터스텔라(환상)

Layer 2: Stimulation (자극 방식)
- 왜 필요? 같은 스릴러라도 지적 vs 감성적 구분
- 예시: 인셉션(brain) vs 코코(heart) vs 다크나이트(body)

Layer 3: Texture (감성 분위기)
- 왜 필요? 온도와 밀도로 세밀한 분위기 파악
- 예시: 토이스토리(warm+light) vs 조커(cold+heavy)
```

**3. 과학적 근거**
- 영화 이론: 장르(Genre) + 톤(Tone) + 무드(Mood)
- 심리학: 인지적/정서적/신체적 반응 구분
- 결과: **다차원적 취향 분석** 가능

**4. 실제 효과**
```
단순 장르: "액션 좋아함"
→ 매드맥스, 어벤져스, 본 시리즈 모두 추천 (부정확)

3-Layer: "현실파 + 두뇌 자극 + 차가운 분위기"
→ 본 시리즈, 미션 임파서블 추천 (정확)
```

#### 핵심 코드 위치:
```javascript
// src/js/vs-game/vsGameEngine.js: 41-134 (Phase 1 고정 라운드 10개)
const PHASE1_FIXED_ROUNDS = [
  // R1: 현실 vs 환상 (42-50)
  { layer: 'worldview', movieA: { id: 278 }, movieB: { id: 157336 } },
  // R2: 극한 현실 vs 무한 상상 (51-59)
  // R3: 역사 vs 미래 (60-68)
  // R4: 두뇌 vs 감성 (70-78)
  // R5: 스릴 vs 감성 (79-87)
  // R6: 액션 vs 로맨스 (88-96)
  // R7-10: 분위기 4개 라운드 (98-133)
];

// src/js/vs-game/vsGameEngine.js: 310-411 (Phase 2 검증 라운드 동적 생성)
async generatePhase2Rounds() {
  // Phase 1 결과 분석 (314-323)
  this.phase1Results = {
    worldview: this.scores.worldview.reality > this.scores.worldview.fantasy ? 'reality' : 'fantasy',
    stimulation: this.getTopStimulation(),
    texture: { ... }
  };

  // R11: 세계관 검증 (325-351) - 승자 속성 영화 vs 패자 속성 영화
  // R12: 자극 검증 (353-380) - 최다 선택 vs 반대 자극
  // R13: 온도 검증 (382-408) - warm vs cold
}

// src/js/vs-game/vsGameEngine.js: 416-455 (선택 처리 및 점수 계산)
async selectMovie(choice) {
  // Phase 1: 기본 점수 누적 (433-436)
  if (phase === 1) {
    this.addScore(roundConfig.layer, attribute);
  }

  // Phase 2: 검증 + 신뢰도 조정 (438-442)
  else if (phase === 2) {
    this.adjustConfidence(roundConfig, selectedMovie);
  }
}

// src/js/vs-game/vsGameEngine.js: 473-490 (신뢰도 조정)
adjustConfidence(roundConfig, selectedMovie) {
  if (isExpected) {
    this.confidence[layer] *= 1.2; // 일관성 있음 → 신뢰도 증가
  } else {
    this.confidence[layer] *= 0.9; // 일관성 없음 → 신뢰도 감소
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

#### 핵심 코드 위치:
```javascript
// src/js/vs-game/vsGameEngine.js: 516-680 (3-Layer 프로필 분석)
getProfileAnalysis() {
  // 신뢰도 적용된 최종 점수 계산 (518-534)
  const finalScores = {
    worldview: {
      reality: this.scores.worldview.reality * this.confidence.worldview,
      fantasy: this.scores.worldview.fantasy * this.confidence.worldview
    },
    // stimulation, texture도 동일
  };

  // 강도 계산 헬퍼 (537-542)
  const getIntensity = (percent) => {
    if (percent >= 80) return '매우 강하게';
    if (percent >= 65) return '강하게';
    if (percent >= 55) return '약간';
    return '균형있게';
  };

  // Layer 1: 세계관 분석 (544-559)
  const worldviewTotal = finalScores.worldview.reality + finalScores.worldview.fantasy;
  const realityPercent = Math.round((finalScores.worldview.reality / worldviewTotal) * 100);

  // Layer 2: 자극 타겟 분석 (562-586)
  const brainPercent = Math.round((finalScores.stimulation.brain / stimTotal) * 100);

  // Layer 3: 감성 텍스처 분석 (588-675)
  const warmPercent = Math.round((finalScores.texture.warm / warmColdTotal) * 100);

  // MBTI 스타일 문장 생성 (596-631)
  const title = personaTitle[`${worldviewResult.attribute}_${stimAttr}`];
  const sentence = `당신은 ${atmosphereAdj[tempAttr]} ${worldviewNoun[worldviewResult.attribute]} 속에서
                    ${stimulationVerb[stimAttr]} ${title}입니다.`;

  // 해시태그 생성 (633-640)
  const hashtags = ['#따뜻함 or #냉철함', '#현실주의 or #몽상가', ...];
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

#### 🎯 [추가] 가중치 기반 추천 알고리즘

**추천 알고리즘 핵심 원리**
```
총점 = (1단계 설문 × 50%) + (VS 게임 × 30%) + (3-Layer × 20%)
```

**왜 이런 가중치?**
1. **1단계 설문 50%** - 사용자가 명시적으로 선택한 선호
   - 가장 직관적이고 명확한 의도
   - 예: "액션 좋아요" → 신뢰도 높음

2. **VS 게임 30%** - 실제 선택 행동 패턴
   - 말과 행동의 차이 반영
   - 예: "로맨스 싫다"고 했지만 VS 게임에서 로맨스 선택

3. **3-Layer 20%** - 심층 분석 결과
   - 사용자도 모르는 잠재 취향
   - 보조 지표로 활용

#### 핵심 코드:
```javascript
// vsGameEngine.js: 701-759 (가중치 계산 알고리즘)
async getRecommendations(page = 1) {
  const genreScores = {};

  // 1. 1단계 설문 장르 (가중치 50% = +5.0점)
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (userProfile.genres) {
    userProfile.genres.forEach(genreId => {
      genreScores[genreId] = (genreScores[genreId] || 0) + 5.0;
    }); 
  }

  // 2. VS 게임 선택 영화 장르 (가중치 30% = +3.0점)
  this.history.forEach(h => {
    const round = this.roundMovies[h.round - 1];
    const selected = h.choice === 'A' ? round.movieA : round.movieB;
    if (selected?.genre_ids) {
      selected.genre_ids.forEach(genreId => {
        genreScores[genreId] = (genreScores[genreId] || 0) + 3.0;
      });
    }
  });

  // 3. 3-Layer 분석 장르 매핑 (가중치 20% = +2.0점)
  const genreMapping = {
    reality: [36, 18, 80],        // 역사, 드라마, 범죄
    fantasy: [878, 14, 12],       // SF, 판타지, 모험
    brain: [9648, 53, 80],        // 미스터리, 스릴러, 범죄
    heart: [10749, 18, 10751],    // 로맨스, 드라마, 가족
    body: [28, 27, 12],           // 액션, 공포, 모험
    warm: [35, 10751, 16],        // 코미디, 가족, 애니메이션
    cold: [53, 80, 9648],         // 스릴러, 범죄, 미스터리
    light: [35, 28],              // 코미디, 액션
    heavy: [18, 36]               // 드라마, 역사
  };

  [
    ...genreMapping[profile.worldview.attribute],
    ...genreMapping[profile.stimulation.attribute],
    ...genreMapping[profile.texture.temperature.attribute],
    ...genreMapping[profile.texture.density.attribute]
  ].forEach(genreId => {
    genreScores[genreId] = (genreScores[genreId] || 0) + 2.0;
  });

  // 4. 피하기 요소 반영 (음수 가중치 -3.0)
  if (userProfile.dislikes?.length > 0) {
    userProfile.dislikes.forEach(genreId => {
      genreScores[genreId] = (genreScores[genreId] || 0) - 3.0;
    });
  }

  // 5. 점수 기준 상위 5개 장르 선택 (음수 제외)
  const uniqueGenres = Object.entries(genreScores)
    .filter(([id, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => parseInt(id));

  // 6. TMDB API 호출
  const params = {
    with_genres: uniqueGenres.join(','),
    'vote_average.gte': 7.5,
    'vote_count.gte': 5000,
    sort_by: 'vote_average.desc'
  };
}
```

**⭐ 핵심 알고리즘 설계 원리:**

"다음은 저희 서비스의 핵심인 추천 알고리즘의 설계 원리입니다. 저희는 정확도를 극대화하기 위해 **'3-Layer 필터링 방식'**과 **'가중치 채점 시스템'**을 도입했습니다.

우선, 왜 3-Layer일까요? 사용자가 '말로 표현하는 취향'과 '무의식적으로 끌리는 취향'은 다를 수 있습니다. 그래서 Layer 1에서는 사용자가 선택한 장르로 기본 필터링을 하고, Layer 2인 'VS 게임'을 통해 사용자의 무의식적인 선호도, 즉 분위기나 자극 세기를 포착합니다. 마지막 Layer 3에서 이 두 데이터의 정합성을 검증하여 추천의 실패 확률을 줄였습니다.

또한, 이 과정에서 **가중치(Weighting)**를 적용했습니다. 모든 응답을 동등하게 처리하면 변별력이 사라집니다. 따라서 사용자가 기피하는 장르나 선호 장르 같은 **'결정적 요인(Critical Factor)'**에는 높은 가중치를 부여하고, VS 게임의 분위기 선택 같은 **'취향 요인'**에는 가산점을 주는 방식을 택했습니다.

이를 통해 단순히 장르만 맞춘 영화가 아니라, **'장르가 맞으면서도 사용자의 감성과 톤앤매너에 가장 근접한 영화'**를 우선순위로 매핑할 수 있었습니다."

**실제 예시:**
```
사용자 A:
1단계: 액션(28), 드라마(18) 선택
VS게임: 다크나이트(28, 80), 인셉션(878, 53) 선택
3-Layer: 현실파(36, 18, 80) + 두뇌형(9648, 53, 80)

최종 점수:
- 액션(28): 5.0(1단계) + 3.0(VS) + 2.0(3-Layer) = 10.0
- 드라마(18): 5.0 + 0 + 4.0 = 9.0
- 범죄(80): 0 + 6.0 + 4.0 = 10.0
- 스릴러(53): 0 + 3.0 + 2.0 = 5.0

→ 범죄, 액션, 드라마 중심 추천
```

**코드 위치:** `src/js/vs-game/vsGameEngine.js: 712-812` ⭐핵심 알고리즘⭐

#### 핵심 코드 위치:
```javascript
// src/js/renderer/movieRenderer.js: 147-188 (히어로 캐러셀 로드)
export async function loadHeroCarousel() {
  const savedProfile = localStorage.getItem('userProfile');

  if (savedProfile) {
    const profile = JSON.parse(savedProfile);

    // VS 게임 추천 영화 우선 사용 (156-158)
    if (profile.recommendedMovies && profile.recommendedMovies.length > 0) {
      movieList = profile.recommendedMovies.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
    } else {
      // 사용자 프로필 기반 추천 (161-163)
      const data = await window.tmdbApi.getPersonalizedRecommendations(enrichedProfile);
      movieList = data.results.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
    }
  } else {
    // 인기 영화 폴백 (166-169)
    const data = await window.tmdbApi.getPopularMovies(1);
    movieList = data.results.slice(0, CONFIG.HERO_CAROUSEL_COUNT);
  }

  // 예고편 정보 병렬 로드 (172-181)
  heroMovies = await Promise.all(
    movieList.map(async (movie) => {
      const videos = await window.tmdbApi.getMovieVideos(movie.id);
      return { ...movie, trailer: findBestTrailer(videos) };
    })
  );

  renderHeroCarousel(); // 183
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

#### 핵심 코드 위치:
```javascript
// src/js/main.js: 160-224 (검색 기능 with 디바운싱)
function setupMainPageEvents() {
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;

  // 검색 입력 이벤트 (168-209)
  searchInput.oninput = async (e) => {
    clearTimeout(searchTimeout);
    const keyword = e.target.value.trim();

    // 디바운싱: 300ms 대기 (186-208)
    searchTimeout = setTimeout(async () => {
      if (keyword.length < 1) {
        searchResultsDropdown.style.display = 'none';
        return;
      }

      // TMDB API 검색 (ko-KR + en-US 병렬) (188-199)
      const [koData, enData] = await Promise.all([
        window.tmdbApi.searchMovies(keyword, 1, { language: 'ko-KR' }),
        window.tmdbApi.searchMovies(keyword, 1, { language: 'en-US' })
      ]);

      // 중복 제거 (193-199)
      const allMovies = [...koData.results];
      enData.results.forEach(movie => {
        if (!allMovies.find(m => m.id === movie.id)) {
          allMovies.push(movie);
        }
      });

      renderSearchDropdown(allMovies.slice(0, 8), searchResultsDropdown); // 202
    }, 300);
  };
}

// src/js/main.js: 316-323 (정렬 기능)
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
  sortSelect.onchange = (e) => {
    isShowingAll = false;
    fetchMovies(e.target.value); // 새로운 정렬로 영화 재로드
  };
}
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

#### 핵심 코드 위치:
```javascript
// src/js/modals/modals.js: 277-314 (영화 상세 모달)
export async function openMovieDetailModal(movieId) {
  const modal = document.getElementById('movieDetailModal');
  const content = document.getElementById('movieDetailContent');

  // 로딩 표시 (281-287)
  content.innerHTML = `<div class="movie-detail-loading">로딩 중...</div>`;
  modal.style.display = 'flex';

  try {
    // 영화 정보와 스트리밍 정보 병렬 로드 (291-295)
    const [movie, watchProviders] = await Promise.all([
      window.tmdbApi.getCompleteMovieInfo(movieId),  // 상세 정보 + 출연진 + 비슷한 영화 모두 포함
      window.tmdbApi.getWatchProviders(movieId)
    ]);

    // 예고편 찾기 (298)
    const trailer = findBestTrailer(movie.videos || { results: [] });

    // 한국 스트리밍 정보 (301)
    const krProviders = watchProviders.results?.KR || null;

    // 상세 페이지 렌더링 (304)
    renderMovieDetail(movie, trailer, krProviders);
  } catch (error) {
    console.error('영화 상세 정보 로딩 실패:', error);
  }
}

// src/js/modals/modals.js: 329-425 (영화 상세 정보 렌더링)
function renderMovieDetail(movie, trailer, watchProviders) {
  // 출연진 (339)
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  // 비슷한 영화 (340)
  const similarMovies = movie.similar?.results?.slice(0, 6) || [];

  // HTML 생성 (342-424)
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

#### 핵심 코드 위치:
```javascript
// src/js/watchlist/watchlist.js: 21-44 (워치리스트 CRUD)
export function getWatchlist() {
  const currentUser = getCurrentUser();
  const key = currentUser ? `watchlist_${currentUser.username}` : 'watchlist_guest';
  return JSON.parse(localStorage.getItem(key)) || [];
}

export function isInWatchlist(movieId) {
  return getWatchlist().some(m => m.id === movieId);
}

// src/js/watchlist/watchlist.js: 59-96 (토글 기능)
export function toggleWatchlist(movie, event) {
  event.stopPropagation(); // 카드 클릭 이벤트 전파 방지 (60)

  const watchlist = getWatchlist();
  const index = watchlist.findIndex(m => m.id === movie.id);
  const MAX_WATCHLIST_SIZE = 10;

  if (index > -1) {
    // 워치리스트에서 제거 (66-69)
    watchlist.splice(index, 1);
    alert(`"${movie.title}"이(가) 워치리스트에서 제거되었습니다.`);
  } else {
    // 최대 개수 확인 (71-75)
    if (watchlist.length >= MAX_WATCHLIST_SIZE) {
      alert(`워치리스트는 최대 ${MAX_WATCHLIST_SIZE}개까지만 저장할 수 있습니다.`);
      return;
    }

    // 이미지 URL 생성 (78-80)
    const imageUrl = movie.image || (movie.poster_path
      ? window.tmdbApi.getImageUrl(movie.poster_path, 'w342')
      : '');

    // 워치리스트에 추가 (83-90)
    watchlist.push({
      id: movie.id,
      title: movie.title,
      image: imageUrl,
      rating: movie.rating || movie.vote_average?.toFixed(1) || 'N/A',
      year: movie.year || movie.release_date?.split('-')[0] || 'N/A',
      addedAt: new Date().toISOString()
    });
  }

  saveWatchlist(watchlist); // 94
  updateWatchlistIcons(); // 95
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

#### 핵심 코드 위치:
```javascript
// src/js/auth/auth.js: 14-30 (현재 사용자 조회)
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

export function getCurrentUser() {
  return currentUser;
}

// src/js/auth/auth.js: 54-80 (로그인 처리)
export function login(username, password) {
  const user = usersDB.find(u => u.username === username && u.password === password);

  if (!user) {
    alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    return false;
  }

  // 현재 사용자 설정 (62-64)
  currentUser = { username: user.username };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // 로컬 데이터를 서버로 업로드 (68-69)
  uploadLocalDataToServer();

  // 서버에 저장된 프로필 불러오기 (71-77)
  const serverKey = `server_${currentUser.username}_profile`;
  const serverData = localStorage.getItem(serverKey);
  if (serverData) {
    localStorage.setItem('userProfile', serverData);
  }

  return true;
}

// src/js/auth/auth.js: 105-135 (회원가입 처리)
export function signup(username, password) {
  // 중복 아이디 체크 (107-110)
  if (usersDB.find(u => u.username === username)) {
    alert('이미 사용 중인 아이디입니다.');
    return false;
  }

  // 검증 (112-122)
  if (username.length < 4) return false;
  if (password.length < 6) return false;

  // 새 사용자 추가 (125-129)
  usersDB.push({
    username,
    password,
    joinDate: new Date().toISOString()
  });

  localStorage.setItem('usersDB', JSON.stringify(usersDB));
  return true;
}

// src/js/auth/auth.js: 145-150 (데이터 동기화)
export function uploadLocalDataToServer() {
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile && currentUser) {
    localStorage.setItem(`server_${currentUser.username}_profile`, userProfile);
  }
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

## 📊 코드 참조 맵 (정확한 라인 번호)

| 단계 | 파일 | 주요 함수/라인 |
|------|------|---------------|
| 1. 초기화 | `src/js/main.js` | DOMContentLoaded 이벤트 (462-497) |
| 2. Phase 1 (카드 선택) | `src/js/popup.js` | `setupFirstPopupHandlers()` (68-116), `validateAndSaveQuestion()` (136-179) |
| 3. Phase 2 (VS 게임) | `src/js/vs-game/vsGameEngine.js` | `PHASE1_FIXED_ROUNDS` (41-134), `generatePhase2Rounds()` (310-411), `selectMovie()` (416-455), `adjustConfidence()` (473-490) |
| 4. 결과 분석 | `src/js/vs-game/vsGameEngine.js` | `getProfileAnalysis()` (516-680) |
| 5. 맞춤 추천 (히어로) | `src/js/renderer/movieRenderer.js` | `loadHeroCarousel()` (147-188) |
| 5. 가중치 알고리즘 | `src/js/vs-game/vsGameEngine.js` | `getRecommendations()` (719-926) |
| 6. 검색 & 필터 | `src/js/main.js` | `setupMainPageEvents()` (160-224), sortSelect 이벤트 (316-323) |
| 7. 영화 상세 정보 | `src/js/modals/modals.js` | `openMovieDetailModal()` (277-314), `renderMovieDetail()` (329-425) |
| 8. Watchlist 관리 | `src/js/watchlist/watchlist.js` | `getWatchlist()` (21-25), `toggleWatchlist()` (59-96) |
| 9. 회원 인증 | `src/js/auth/auth.js` | `login()` (54-80), `signup()` (105-135), `uploadLocalDataToServer()` (145-150) |
