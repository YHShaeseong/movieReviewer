// TMDB example: add to watchlist.   찝 설정기능..

//fetch 부분
const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMzI1YTY5NzliMmUyNmRiMGM1ZWUyNDIwZDBmMzEzOCIsIm5iZiI6MTc2MjE1NTY0MC4wMDcsInN1YiI6IjY5MDg1Yzc4NGQ0ZDdkYzlhYTU5ODg4ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.tXYlaIIml1lr3ZoFa6CqWtKkXTgyWTVdSjAS6wjDv5I'
  },
  body: JSON.stringify({media_type: 'movie', media_id: 11, watchlist: true})
};

fetch('https://api.themoviedb.org/3/account/22437166/watchlist', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));


/* fetch 문법 fetch 라는 함수명을 가진 함수 안에 인자로 api data에 접근할 수 있는 key가 되는 url 주소와, options 가 들어간다

  // response 예시
  /*
  {
  "success": true,
  "status_code": 1,
  "status_message": "Success."
}
*/