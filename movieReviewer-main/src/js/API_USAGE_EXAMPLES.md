# TMDB API 사용 가이드

## 개요

`tmdbApi.js` 모듈은 TMDB API를 쉽게 사용할 수 있도록 래핑한 서비스입니다.
모든 API 호출을 중앙화하여 관리하고, 캐싱, 에러 핸들링 등의 기능을 제공합니다.

## 기본 사용법

### 1. 모듈 로드

```html
<!-- HTML에서 먼저 로드 -->
<script src="src/js/tmdbApi.js"></script>
<script src="src/js/yourScript.js"></script>
```

### 2. API 호출

```javascript
// 전역 객체 tmdbApi를 통해 사용
const movies = await tmdbApi.getPopularMovies();
```

---

## 주요 기능

### 1. 영화 목록 가져오기

#### 인기 영화
```javascript
// 1페이지 인기 영화
const data = await tmdbApi.getPopularMovies(1);
console.log(data.results); // 영화 배열

// 2페이지 인기 영화
const data2 = await tmdbApi.getPopularMovies(2);
```

#### 최고 평점 영화
```javascript
const topRated = await tmdbApi.getTopRatedMovies(1);
```

#### 현재 상영중
```javascript
const nowPlaying = await tmdbApi.getNowPlayingMovies(1);
```

#### 개봉 예정
```javascript
const upcoming = await tmdbApi.getUpcomingMovies(1);
```

### 2. 영화 상세 정보

#### 기본 상세 정보
```javascript
const movieId = 550; // Fight Club
const details = await tmdbApi.getMovieDetails(movieId);

console.log(details.title);
console.log(details.overview);
console.log(details.vote_average);
```

#### 모든 정보 한번에 가져오기
```javascript
// 상세정보 + 출연진 + 비디오 + 비슷한 영화 + 추천 + 리뷰
const completeInfo = await tmdbApi.getCompleteMovieInfo(movieId);

console.log(completeInfo.credits); // 출연진
console.log(completeInfo.videos); // 예고편
console.log(completeInfo.similar); // 비슷한 영화
console.log(completeInfo.recommendations); // 추천 영화
console.log(completeInfo.reviews); // 리뷰
```

#### 출연진 정보
```javascript
const credits = await tmdbApi.getMovieCredits(movieId);

// 주연 배우
credits.cast.forEach(actor => {
  console.log(`${actor.name} as ${actor.character}`);
});

// 감독, 작가 등
credits.crew.forEach(member => {
  if (member.job === 'Director') {
    console.log(`감독: ${member.name}`);
  }
});
```

#### 예고편/비디오
```javascript
const videos = await tmdbApi.getMovieVideos(movieId);

// YouTube 예고편 찾기
const trailer = videos.results.find(v =>
  v.type === 'Trailer' && v.site === 'YouTube'
);

if (trailer) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
  console.log(youtubeUrl);
}
```

#### 비슷한 영화 / 추천 영화
```javascript
const similar = await tmdbApi.getSimilarMovies(movieId);
const recommended = await tmdbApi.getRecommendedMovies(movieId);
```

#### 리뷰
```javascript
const reviews = await tmdbApi.getMovieReviews(movieId);

reviews.results.forEach(review => {
  console.log(`${review.author}: ${review.content}`);
});
```

### 3. 영화 검색

#### 제목으로 검색
```javascript
const results = await tmdbApi.searchMovies('인셉션');

results.results.forEach(movie => {
  console.log(movie.title);
});
```

#### 고급 검색 (년도, 지역 등)
```javascript
const results = await tmdbApi.searchMovies('인셉션', 1, {
  year: 2010,
  region: 'KR'
});
```

#### 다중 검색 (영화 + TV + 인물)
```javascript
const results = await tmdbApi.searchMulti('크리스토퍼 놀란');

results.results.forEach(item => {
  if (item.media_type === 'movie') {
    console.log(`영화: ${item.title}`);
  } else if (item.media_type === 'person') {
    console.log(`인물: ${item.name}`);
  }
});
```

### 4. 장르별 영화

#### 장르 목록 가져오기
```javascript
const genres = await tmdbApi.getMovieGenres();

genres.genres.forEach(genre => {
  console.log(`${genre.id}: ${genre.name}`);
});
```

#### 장르별 영화 검색
```javascript
// 액션 영화 (장르 ID: 28)
const actionMovies = await tmdbApi.getMoviesByGenre(28);

// 액션 + 스릴러 (28, 53)
const actionThrillers = await tmdbApi.getMoviesByGenre([28, 53]);

// 평점순으로 정렬
const topActionMovies = await tmdbApi.getMoviesByGenre(28, 1, 'vote_average.desc');
```

### 5. 고급 필터링 (Discover API)

#### 기본 필터링
```javascript
const movies = await tmdbApi.discoverMovies({
  page: 1,
  sort_by: 'popularity.desc',
  with_genres: '28,12', // 액션, 모험
  vote_average_gte: 7.0,
  vote_count_gte: 1000
});
```

#### 개봉 연도 필터
```javascript
const movies2020 = await tmdbApi.discoverMovies({
  primary_release_year: 2020
});

// 기간으로 필터
const recentMovies = await tmdbApi.discoverMovies({
  'primary_release_date.gte': '2020-01-01',
  'primary_release_date.lte': '2023-12-31'
});
```

#### 개인화된 추천
```javascript
const userProfile = {
  genres: [28, 12, 878], // 액션, 모험, SF
  sortBy: 'vote_average.desc',
  dislikedGenres: [27, 9648], // 공포, 미스터리 제외
  minRating: 7.0,
  yearFrom: 2015,
  yearTo: 2024
};

const recommendations = await tmdbApi.getPersonalizedRecommendations(userProfile);
```

### 6. 트렌딩 콘텐츠

```javascript
// 이번 주 트렌딩 영화
const trendingWeek = await tmdbApi.getTrending('movie', 'week');

// 오늘 트렌딩 영화
const trendingDay = await tmdbApi.getTrending('movie', 'day');

// 모든 미디어 트렌딩
const trendingAll = await tmdbApi.getTrending('all', 'week');
```

### 7. 인물 정보

#### 인기 인물
```javascript
const popularPeople = await tmdbApi.getPopularPeople();
```

#### 인물 상세 정보
```javascript
const personId = 6193; // 레오나르도 디카프리오
const person = await tmdbApi.getPersonDetails(personId);

console.log(person.name);
console.log(person.biography);
```

#### 인물의 출연 작품
```javascript
const filmography = await tmdbApi.getPersonMovieCredits(personId);

// 출연 작품
filmography.cast.forEach(movie => {
  console.log(`${movie.title} (${movie.character})`);
});

// 제작 참여 작품
filmography.crew.forEach(movie => {
  console.log(`${movie.title} (${movie.job})`);
});
```

### 8. 이미지 URL 생성

```javascript
const posterPath = '/abc123.jpg';

// 기본 크기 (w500)
const url1 = tmdbApi.getImageUrl(posterPath);

// 작은 포스터
const smallPoster = tmdbApi.getImageUrl(posterPath, 'w185');

// 중간 포스터
const mediumPoster = tmdbApi.getImageUrl(posterPath, 'w342');

// 원본 포스터
const originalPoster = tmdbApi.getImageUrl(posterPath, 'original');

// 배경 이미지
const backdrop = tmdbApi.getImageUrl(backdropPath, 'w1280');
```

### 9. 여러 영화 동시에 가져오기

```javascript
const movieIds = [550, 680, 155];
const movies = await tmdbApi.getMultipleMovies(movieIds);

movies.forEach(movie => {
  console.log(movie.title);
});
```

### 10. 캐시 관리

```javascript
// 캐시는 기본적으로 5분간 유지됩니다
// 캐시 수동 초기화
tmdbApi.clearCache();
```

---

## 실전 예제

### 예제 1: 영화 카드 렌더링

```javascript
async function renderMovieCards() {
  const data = await tmdbApi.getPopularMovies(1);

  const container = document.getElementById('movieContainer');

  data.results.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${tmdbApi.getImageUrl(movie.poster_path)}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p>평점: ${movie.vote_average.toFixed(1)}</p>
      <p>${movie.release_date}</p>
    `;
    container.appendChild(card);
  });
}
```

### 예제 2: 영화 상세 페이지

```javascript
async function renderMovieDetail(movieId) {
  const movie = await tmdbApi.getCompleteMovieInfo(movieId);

  // 기본 정보
  document.getElementById('title').textContent = movie.title;
  document.getElementById('overview').textContent = movie.overview;
  document.getElementById('rating').textContent = movie.vote_average.toFixed(1);
  document.getElementById('poster').src = tmdbApi.getImageUrl(movie.poster_path, 'w500');

  // 출연진
  const castContainer = document.getElementById('cast');
  movie.credits.cast.slice(0, 10).forEach(actor => {
    const actorCard = document.createElement('div');
    actorCard.innerHTML = `
      <img src="${tmdbApi.getImageUrl(actor.profile_path, 'w185')}">
      <p>${actor.name}</p>
      <p>${actor.character}</p>
    `;
    castContainer.appendChild(actorCard);
  });

  // 예고편
  const trailer = movie.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  if (trailer) {
    document.getElementById('trailer').src = `https://www.youtube.com/embed/${trailer.key}`;
  }
}
```

### 예제 3: 검색 자동완성

```javascript
let searchTimeout;
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', async (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();

  if (query.length < 2) return;

  searchTimeout = setTimeout(async () => {
    const results = await tmdbApi.searchMovies(query);

    const dropdown = document.getElementById('searchDropdown');
    dropdown.innerHTML = '';

    results.results.slice(0, 10).forEach(movie => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <img src="${tmdbApi.getImageUrl(movie.poster_path, 'w92')}">
        <div>
          <div>${movie.title}</div>
          <div>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        window.location.href = `/movie/${movie.id}`;
      });
      dropdown.appendChild(item);
    });
  }, 300);
});
```

### 예제 4: 장르 필터

```javascript
async function setupGenreFilter() {
  const genres = await tmdbApi.getMovieGenres();
  const filterContainer = document.getElementById('genreFilter');

  genres.genres.forEach(genre => {
    const button = document.createElement('button');
    button.textContent = genre.name;
    button.addEventListener('click', async () => {
      const movies = await tmdbApi.getMoviesByGenre(genre.id);
      renderMovies(movies.results);
    });
    filterContainer.appendChild(button);
  });
}
```

### 예제 5: 무한 스크롤

```javascript
let currentPage = 1;
let isLoading = false;

async function loadMoreMovies() {
  if (isLoading) return;

  isLoading = true;
  const data = await tmdbApi.getPopularMovies(currentPage);

  appendMovies(data.results);

  currentPage++;
  isLoading = false;
}

window.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  if (scrollTop + clientHeight >= scrollHeight - 500) {
    loadMoreMovies();
  }
});

// 초기 로드
loadMoreMovies();
```

---

## 에러 핸들링

```javascript
try {
  const movies = await tmdbApi.getPopularMovies(1);
  // 성공 처리
} catch (error) {
  console.error('영화 로드 실패:', error);
  // 에러 UI 표시
  showErrorMessage('영화를 불러오는데 실패했습니다.');
}
```

---

## 성능 최적화 팁

1. **캐싱 활용**: 동일한 데이터는 5분간 캐시됨
2. **병렬 요청**: `Promise.all()` 사용
3. **이미지 크기 최적화**: 필요한 크기만 요청
4. **페이지네이션**: 한번에 너무 많은 데이터 요청 금지

```javascript
// 병렬 요청 예제
const [popular, topRated, nowPlaying] = await Promise.all([
  tmdbApi.getPopularMovies(1),
  tmdbApi.getTopRatedMovies(1),
  tmdbApi.getNowPlayingMovies(1)
]);
```

---

## 정렬 옵션 (sort_by)

- `popularity.desc` - 인기도 내림차순
- `popularity.asc` - 인기도 오름차순
- `vote_average.desc` - 평점 내림차순
- `vote_average.asc` - 평점 오름차순
- `release_date.desc` - 최신 개봉작
- `release_date.asc` - 오래된 영화
- `revenue.desc` - 흥행 수익 높은순

---

## 추가 참고자료

- [TMDB API 공식 문서](https://developers.themoviedb.org/3)
- [이미지 설정](https://developers.themoviedb.org/3/getting-started/images)
- [장르 ID 목록](https://developers.themoviedb.org/3/genres/get-movie-list)
