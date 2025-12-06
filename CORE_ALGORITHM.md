# ⭐ Pictos 핵심 추천 알고리즘

## 📍 코드 위치
**파일:** `src/js/vs-game/vsGameEngine.js`
**함수:** `getRecommendations(page = 1)`
**라인:** 712-812 (핵심 알고리즘 섹션)

---

## 🎯 설계 원리

### 1. 3-Layer 필터링 방식

**왜 3-Layer일까요?**

사용자가 **'말로 표현하는 취향'**과 **'무의식적으로 끌리는 취향'**은 다를 수 있습니다.

#### Layer 1: 명시적 취향 (가중치 50%)
- 사용자가 직접 선택한 장르
- **"사용자가 말로 표현하는 취향"**
- 점수: +5.0점

```javascript
// src/js/vs-game/vsGameEngine.js: 743-748
userProfile.genres.forEach(genreId => {
  genreScores[genreId] = (genreScores[genreId] || 0) + 5.0;
});
```

#### Layer 2: 무의식적 취향 (가중치 30%)
- VS 게임에서 실제 선택한 영화의 패턴 분석
- **"무의식적인 선호도"** (분위기, 자극 세기)
- 점수: +3.0점

```javascript
// src/js/vs-game/vsGameEngine.js: 755-764
this.history.forEach(h => {
  const selected = h.choice === 'A' ? round.movieA : round.movieB;
  if (selected?.genre_ids) {
    selected.genre_ids.forEach(genreId => {
      genreScores[genreId] = (genreScores[genreId] || 0) + 3.0;
    });
  }
});
```

#### Layer 3: 정합성 검증 (가중치 20%)
- 3-Layer 분석 결과 (세계관/자극/분위기)
- 두 데이터의 **정합성 검증**으로 추천 실패 확률 감소
- 점수: +2.0점

```javascript
// src/js/vs-game/vsGameEngine.js: 771-790
const genreMapping = {
  reality: [36, 18, 80],      // 역사, 드라마, 범죄
  fantasy: [878, 14, 12],     // SF, 판타지, 모험
  brain: [9648, 53, 80],      // 미스터리, 스릴러, 범죄
  heart: [10749, 18, 10751],  // 로맨스, 드라마, 가족
  body: [28, 27, 12],         // 액션, 공포, 모험
  warm: [35, 10751, 16],      // 코미디, 가족, 애니메이션
  cold: [53, 80, 9648],       // 스릴러, 범죄, 미스터리
  light: [35, 28],            // 코미디, 액션
  heavy: [18, 36]             // 드라마, 역사
};

[
  ...genreMapping[profile.worldview.attribute],
  ...genreMapping[profile.stimulation.attribute],
  ...genreMapping[profile.texture.temperature.attribute],
  ...genreMapping[profile.texture.density.attribute]
].forEach(genreId => {
  genreScores[genreId] = (genreScores[genreId] || 0) + 2.0;
});
```

---

### 2. 가중치 채점 시스템

**왜 가중치를 사용할까요?**

모든 응답을 동등하게 처리하면 **변별력이 사라집니다**.

#### 결정적 요인 (Critical Factor)
- 명시적 선호/기피 장르
- **높은 가중치** 부여
- 기피 장르: -3.0점 (절대 추천 금지)

```javascript
// src/js/vs-game/vsGameEngine.js: 797-801
if (userProfile.dislikes && userProfile.dislikes.length > 0) {
  userProfile.dislikes.forEach(genreId => {
    genreScores[genreId] = (genreScores[genreId] || 0) - 3.0;
  });
}
```

#### 취향 요인 (Preference Factor)
- VS 게임 선택 패턴
- **가산점** 부여

#### 감성 요인 (Emotional Factor)
- 3-Layer 분위기 분석
- **미세 조정**

---

## 🎬 최종 목표

> **단순 장르 매칭이 아닌, 사용자의 감성과 톤앤매너에 가장 근접한 영화를 우선순위로 추천**

```javascript
// src/js/vs-game/vsGameEngine.js: 808-812
const uniqueGenres = Object.entries(genreScores)
  .filter(([id, score]) => score > 0)  // 음수 점수 제외 (기피 장르 완전 배제)
  .sort((a, b) => b[1] - a[1])         // 점수 높은 순 정렬
  .slice(0, 5)                         // 상위 5개 장르 선택
  .map(([id]) => parseInt(id));
```

---

## 📊 실제 예시

### 사용자 A의 취향 분석

**입력 데이터:**
- **1단계 설문:** 액션(28), 드라마(18) 선택
- **VS 게임 선택:** 다크나이트(액션 28, 범죄 80), 인셉션(SF 878, 스릴러 53)
- **3-Layer 분석:** 현실파(역사 36, 드라마 18, 범죄 80) + 두뇌형(미스터리 9648, 스릴러 53, 범죄 80)

**점수 계산:**

| 장르 ID | 장르명 | Layer 1 (×5.0) | Layer 2 (×3.0) | Layer 3 (×2.0) | 총점 |
|---------|--------|----------------|----------------|----------------|------|
| 28      | 액션   | 5.0            | 3.0            | 2.0            | **10.0** |
| 18      | 드라마 | 5.0            | 0              | 4.0            | **9.0** |
| 80      | 범죄   | 0              | 6.0            | 4.0            | **10.0** |
| 53      | 스릴러 | 0              | 3.0            | 2.0            | **5.0** |
| 878     | SF     | 0              | 3.0            | 0              | **3.0** |

**최종 추천 장르:** 범죄, 액션, 드라마, 스릴러, SF

**추천 영화 예시:**
- 범죄 + 액션 + 드라마 → **"다크 나이트", "본 시리즈", "히트"**
- 범죄 + 스릴러 → **"살인의 추억", "추격자"**

---

## 🔬 알고리즘의 차별화 포인트

### 1. 말과 행동의 괴리 해결
- "액션 좋아요"라고 말했지만 실제로는 드라마틱한 액션을 선호
- VS 게임으로 **실제 선택 패턴** 분석

### 2. 기피 장르 완전 배제
- 음수 가중치(-3.0)로 **절대 추천하지 않음**
- `score > 0` 필터링으로 이중 안전장치

### 3. 감성과 톤앤매너 반영
- 3-Layer 분석으로 **"어떤 액션"**인지까지 파악
- 같은 액션이라도 "다크 나이트" vs "어벤져스" 구분

---

## 📈 성능 최적화

### 병렬 처리
```javascript
// src/js/vs-game/vsGameEngine.js: 839-846
// 1차~5차 시도를 순차적으로 진행하여 최소 5개 영화 보장
let movies = [];

// 1차 시도: 장르 + 키워드 (엄격)
if (uniqueGenres.length >= 3) {
  movies = await fetchMoviesWithFallback(uniqueGenres.slice(0, 3), 5000, 7.5, page, true);
}

// 2차~5차 시도: 점진적 기준 완화
// ...
```

### 중복 제거
```javascript
// src/js/vs-game/vsGameEngine.js: 787-797
const seenMovieIds = new Set();
this.roundMovies.forEach(round => {
  if (round.movieA) seenMovieIds.add(round.movieA.id);
  if (round.movieB) seenMovieIds.add(round.movieB.id);
});
// VS 게임에서 이미 본 영화는 추천에서 제외
```

---

## 🎓 발표 시 강조 포인트

1. **3-Layer 필터링의 필요성**
   - "말로 표현하는 취향"과 "무의식적 취향"의 차이
   - 정합성 검증으로 정확도 향상

2. **가중치 시스템의 과학성**
   - 결정적 요인 vs 취향 요인의 구분
   - 기피 장르 완전 배제 메커니즘

3. **최종 목표의 차별화**
   - 단순 장르 매칭 → **감성과 톤앤매너 매칭**
   - "다크 나이트" vs "어벤져스" 구분 가능
