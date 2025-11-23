# TMDB API 신규 기능 사용 예제

## 추가된 기능 목록

1. **OTT 스트리밍 정보** - Netflix, Watcha 등에서 볼 수 있는지 확인
2. **이미지 갤러리** - 포스터, 배경, 스틸컷 여러 장
3. **외부 링크** - IMDb, 공식 홈페이지, SNS
4. **영화 컬렉션** - 마블, 해리포터 같은 시리즈
5. **키워드 검색** - "시간여행", "우주" 같은 테마로 검색
6. **계정 기능** - 평점, Watchlist, Favorite
7. **TV 시리즈** - 드라마, 시즌, 에피소드
8. **편의 프리셋** - 한국영화, 명작, 최신작 등

---

## 1. OTT 스트리밍 정보

### 어디서 볼 수 있는지 확인
```javascript
const movieId = 550; // Fight Club
const providers = await tmdbApi.getWatchProviders(movieId, 'KR');

const krData = providers.results.KR;

if (krData) {
  // 스트리밍 (구독)
  if (krData.flatrate) {
    console.log('스트리밍 가능:');
    krData.flatrate.forEach(provider => {
      console.log(`- ${provider.provider_name}`);
      // 로고: tmdbApi.getImageUrl(provider.logo_path)
    });
  }

  // 대여
  if (krData.rent) {
    console.log('대여 가능:');
    krData.rent.forEach(provider => {
      console.log(`- ${provider.provider_name}`);
    });
  }

  // 구매
  if (krData.buy) {
    console.log('구매 가능:');
    krData.buy.forEach(provider => {
      console.log(`- ${provider.provider_name}`);
    });
  }
}
```

### 실전 예제: OTT 아이콘 표시
```javascript
async function renderOTTProviders(movieId) {
  const providers = await tmdbApi.getWatchProviders(movieId, 'KR');
  const krData = providers.results.KR;

  if (!krData || !krData.flatrate) {
    document.getElementById('ott').innerHTML = '스트리밍 정보 없음';
    return;
  }

  const ottContainer = document.getElementById('ott');
  ottContainer.innerHTML = '<h3>지금 볼 수 있는 곳:</h3>';

  krData.flatrate.forEach(provider => {
    const logo = document.createElement('img');
    logo.src = tmdbApi.getImageUrl(provider.logo_path, 'w92');
    logo.alt = provider.provider_name;
    logo.title = provider.provider_name;
    logo.className = 'ott-logo';
    ottContainer.appendChild(logo);
  });
}
```

---

## 2. 이미지 갤러리

### 포스터, 배경, 스틸컷 가져오기
```javascript
const images = await tmdbApi.getMovieImages(550);

// 포스터 (여러 언어)
console.log('포스터:', images.posters.length);
images.posters.slice(0, 5).forEach(poster => {
  const url = tmdbApi.getImageUrl(poster.file_path, 'w342');
  console.log(url);
});

// 배경 이미지
console.log('배경:', images.backdrops.length);
images.backdrops.slice(0, 5).forEach(backdrop => {
  const url = tmdbApi.getImageUrl(backdrop.file_path, 'w1280');
  console.log(url);
});

// 스틸컷
if (images.stills) {
  console.log('스틸컷:', images.stills.length);
}
```

### 실전 예제: 이미지 갤러리 렌더링
```javascript
async function renderImageGallery(movieId) {
  const images = await tmdbApi.getMovieImages(movieId);
  const gallery = document.getElementById('gallery');

  // 배경 이미지 갤러리
  const backdrops = images.backdrops.slice(0, 10);
  backdrops.forEach(image => {
    const img = document.createElement('img');
    img.src = tmdbApi.getImageUrl(image.file_path, 'w780');
    img.className = 'gallery-image';
    img.addEventListener('click', () => {
      openLightbox(tmdbApi.getImageUrl(image.file_path, 'original'));
    });
    gallery.appendChild(img);
  });
}
```

---

## 3. 외부 링크

### IMDb, 공식 홈페이지, SNS
```javascript
const externalIds = await tmdbApi.getMovieExternalIds(550);

// IMDb 링크
if (externalIds.imdb_id) {
  const imdbUrl = `https://www.imdb.com/title/${externalIds.imdb_id}`;
  console.log('IMDb:', imdbUrl);
}

// 공식 홈페이지 (상세 정보에서)
const details = await tmdbApi.getMovieDetails(550);
console.log('홈페이지:', details.homepage);

// SNS
console.log('Facebook:', externalIds.facebook_id);
console.log('Instagram:', externalIds.instagram_id);
console.log('Twitter:', externalIds.twitter_id);
```

### 실전 예제: 외부 링크 버튼
```javascript
async function renderExternalLinks(movieId) {
  const [externalIds, details] = await Promise.all([
    tmdbApi.getMovieExternalIds(movieId),
    tmdbApi.getMovieDetails(movieId)
  ]);

  const linksContainer = document.getElementById('externalLinks');

  // IMDb
  if (externalIds.imdb_id) {
    const imdbBtn = document.createElement('a');
    imdbBtn.href = `https://www.imdb.com/title/${externalIds.imdb_id}`;
    imdbBtn.target = '_blank';
    imdbBtn.textContent = 'IMDb에서 보기';
    imdbBtn.className = 'external-link';
    linksContainer.appendChild(imdbBtn);
  }

  // 공식 홈페이지
  if (details.homepage) {
    const homeBtn = document.createElement('a');
    homeBtn.href = details.homepage;
    homeBtn.target = '_blank';
    homeBtn.textContent = '공식 홈페이지';
    homeBtn.className = 'external-link';
    linksContainer.appendChild(homeBtn);
  }
}
```

---

## 4. 영화 컬렉션 (시리즈물)

### 마블, 해리포터 같은 시리즈
```javascript
// 영화 상세에서 컬렉션 ID 확인
const movie = await tmdbApi.getMovieDetails(671); // 해리포터와 마법사의 돌
console.log(movie.belongs_to_collection); // { id, name, poster_path, backdrop_path }

// 컬렉션 전체 영화 가져오기
const collectionId = movie.belongs_to_collection.id;
const collection = await tmdbApi.getCollection(collectionId);

console.log(collection.name); // "해리 포터 컬렉션"
console.log(collection.parts.length); // 8편

collection.parts.forEach(part => {
  console.log(`${part.title} (${part.release_date})`);
});
```

### 실전 예제: 시리즈 목록 표시
```javascript
async function renderCollection(movieId) {
  const movie = await tmdbApi.getMovieDetails(movieId);

  if (!movie.belongs_to_collection) {
    return; // 컬렉션 아님
  }

  const collection = await tmdbApi.getCollection(movie.belongs_to_collection.id);
  const container = document.getElementById('collection');

  container.innerHTML = `<h2>${collection.name}</h2>`;

  // 개봉일 순으로 정렬
  const sortedParts = collection.parts.sort((a, b) =>
    new Date(a.release_date) - new Date(b.release_date)
  );

  sortedParts.forEach((part, index) => {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.innerHTML = `
      <span class="part-number">${index + 1}</span>
      <img src="${tmdbApi.getImageUrl(part.poster_path, 'w185')}" alt="${part.title}">
      <h4>${part.title}</h4>
      <p>${part.release_date ? part.release_date.split('-')[0] : 'TBA'}</p>
    `;
    card.addEventListener('click', () => {
      window.location.href = `/movie/${part.id}`;
    });
    container.appendChild(card);
  });
}
```

---

## 5. 키워드 검색

### 테마별로 영화 찾기
```javascript
// 1. 키워드 검색
const keywords = await tmdbApi.searchKeywords('시간여행');
console.log(keywords.results);

// 2. 키워드 ID로 영화 검색
const keywordId = keywords.results[0].id;
const movies = await tmdbApi.getMoviesByKeyword(keywordId);

movies.results.forEach(movie => {
  console.log(movie.title);
});

// 3. 영화의 키워드 확인
const movieKeywords = await tmdbApi.getMovieKeywords(550);
console.log(movieKeywords.keywords);
```

### 실전 예제: 키워드 기반 추천
```javascript
async function getSimilarByKeywords(movieId) {
  // 현재 영화의 키워드 가져오기
  const keywordData = await tmdbApi.getMovieKeywords(movieId);
  const keywords = keywordData.keywords;

  if (keywords.length === 0) return [];

  // 첫 번째 키워드로 비슷한 영화 찾기
  const keywordId = keywords[0].id;
  const similar = await tmdbApi.getMoviesByKeyword(keywordId);

  return similar.results.filter(m => m.id !== movieId).slice(0, 10);
}
```

---

## 6. 계정 기능 (평점, Watchlist)

⚠️ **주의**: 이 기능들은 TMDB 계정 로그인이 필요합니다.

### 영화 평점 매기기
```javascript
// sessionId는 TMDB 인증 후 받음
const sessionId = 'your_session_id';
const movieId = 550;

// 평점 매기기 (0.5 ~ 10.0)
await tmdbApi.rateMovie(movieId, 8.5, sessionId);

// 평점 삭제
await tmdbApi.deleteMovieRating(movieId, sessionId);
```

### Watchlist 관리
```javascript
const accountId = 'your_account_id';
const sessionId = 'your_session_id';
const movieId = 550;

// Watchlist에 추가
await tmdbApi.updateWatchlist(accountId, sessionId, movieId, true);

// Watchlist에서 제거
await tmdbApi.updateWatchlist(accountId, sessionId, movieId, false);
```

### Favorite 관리
```javascript
// Favorite에 추가
await tmdbApi.updateFavorite(accountId, sessionId, movieId, true);

// Favorite에서 제거
await tmdbApi.updateFavorite(accountId, sessionId, movieId, false);
```

---

## 7. TV 시리즈

### TV 쇼 정보
```javascript
const tvId = 1399; // Game of Thrones

// 시리즈 기본 정보
const tvShow = await tmdbApi.getTVShowDetails(tvId);
console.log(tvShow.name);
console.log(tvShow.number_of_seasons);
console.log(tvShow.number_of_episodes);

// 특정 시즌 정보
const season1 = await tmdbApi.getSeasonDetails(tvId, 1);
console.log(season1.episodes.length);

season1.episodes.forEach(ep => {
  console.log(`S01E${ep.episode_number}: ${ep.name}`);
});

// 특정 에피소드 정보
const episode = await tmdbApi.getEpisodeDetails(tvId, 1, 1);
console.log(episode.name);
console.log(episode.overview);
```

---

## 8. 편의 프리셋

### 한국 영화
```javascript
const koreanMovies = await tmdbApi.getKoreanMovies(1);

koreanMovies.results.forEach(movie => {
  console.log(movie.title);
});
```

### 특정 연도/기간 영화
```javascript
// 2020년 영화
const movies2020 = await tmdbApi.getMoviesByYear(2020);

// 2000년대 명작
const classics2000s = await tmdbApi.getMoviesByYearRange(2000, 2009);
```

### 명작 영화
```javascript
// 평점 8.0 이상
const classics = await tmdbApi.getClassicMovies(8.0);
```

### 최신 개봉작
```javascript
// 최근 3개월 개봉작
const recent = await tmdbApi.getRecentReleases();
```

### 배우/감독 필모그래피
```javascript
const actorId = 6193; // 레오나르도 디카프리오

// 출연작
const movies = await tmdbApi.getMoviesByActor(actorId);

// 감독 작품
const directorId = 138; // 크리스토퍼 놀란
const directed = await tmdbApi.getMoviesByDirector(directorId);
```

### 가족 영화
```javascript
const familyMovies = await tmdbApi.getFamilyMovies();
```

### 숨은 명작
```javascript
// 평점은 높지만 덜 알려진 영화
const hidden = await tmdbApi.getHiddenGems();
```

---

## 종합 예제: 영화 상세 페이지

```javascript
async function renderCompleteMoviePage(movieId) {
  // 1. 기본 정보, 출연진, 비디오, 이미지, 외부ID 동시 로드
  const [
    details,
    images,
    externalIds,
    providers,
    keywords
  ] = await Promise.all([
    tmdbApi.getCompleteMovieInfo(movieId), // 기본+출연진+비디오+비슷한영화
    tmdbApi.getMovieImages(movieId),
    tmdbApi.getMovieExternalIds(movieId),
    tmdbApi.getWatchProviders(movieId, 'KR'),
    tmdbApi.getMovieKeywords(movieId)
  ]);

  // 2. 기본 정보 렌더링
  document.getElementById('title').textContent = details.title;
  document.getElementById('overview').textContent = details.overview;
  document.getElementById('rating').textContent = details.vote_average.toFixed(1);
  document.getElementById('poster').src = tmdbApi.getImageUrl(details.poster_path);

  // 3. OTT 정보
  renderOTTProviders(providers);

  // 4. 출연진
  renderCast(details.credits.cast);

  // 5. 예고편
  renderTrailer(details.videos.results);

  // 6. 이미지 갤러리
  renderGallery(images.backdrops);

  // 7. 외부 링크
  renderExternalLinks(externalIds, details.homepage);

  // 8. 키워드
  renderKeywords(keywords.keywords);

  // 9. 컬렉션 (있다면)
  if (details.belongs_to_collection) {
    renderCollection(details.belongs_to_collection.id);
  }

  // 10. 비슷한 영화
  renderSimilarMovies(details.similar.results);
}
```

---

## 성능 최적화

### 병렬 로딩
```javascript
// ❌ 나쁜 예 (순차 실행 - 느림)
const details = await tmdbApi.getMovieDetails(movieId);
const credits = await tmdbApi.getMovieCredits(movieId);
const videos = await tmdbApi.getMovieVideos(movieId);

// ✅ 좋은 예 (병렬 실행 - 빠름)
const [details, credits, videos] = await Promise.all([
  tmdbApi.getMovieDetails(movieId),
  tmdbApi.getMovieCredits(movieId),
  tmdbApi.getMovieVideos(movieId)
]);

// ✅ 더 좋은 예 (한 번에 가져오기)
const completeInfo = await tmdbApi.getCompleteMovieInfo(movieId);
```

### 캐싱 활용
```javascript
// 첫 호출: API 요청
const movies1 = await tmdbApi.getPopularMovies(1);

// 5분 이내 재호출: 캐시에서 반환 (빠름)
const movies2 = await tmdbApi.getPopularMovies(1);

// 캐시 수동 초기화
tmdbApi.clearCache();
```

---

## 주요 추가 기능 요약

| 기능 | 메서드 | 활용도 |
|------|--------|--------|
| OTT 정보 | `getWatchProviders()` | ⭐⭐⭐ 필수 |
| 이미지 갤러리 | `getMovieImages()` | ⭐⭐⭐ 필수 |
| 외부 링크 | `getMovieExternalIds()` | ⭐⭐⭐ 필수 |
| 컬렉션 | `getCollection()` | ⭐⭐ 추천 |
| 키워드 | `getMovieKeywords()` | ⭐⭐ 추천 |
| 한국 영화 | `getKoreanMovies()` | ⭐⭐ 추천 |
| 계정 기능 | `rateMovie()` 등 | ⭐ 선택 |
| TV 시리즈 | `getTVShowDetails()` | ⭐ 선택 |

이제 거의 모든 TMDB 기능을 사용할 수 있습니다!
