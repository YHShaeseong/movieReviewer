픽토스 (Picktos) - 영화 추천 서비스
사용자의 숨겨진 취향까지 분석하여 영화를 추천하는 개인화 웹 서비스

💻 기술 스택 (Tech Stack)
Core: HTML, CSS, JavaScript (ES6+)

API: TMDB (The Movie Database) API

Data Storage: Local Storage (브라우저 내장 스토리지)

✨ 핵심 기능 로직 (How It Works)
본 서비스의 핵심은 사용자가 처음 방문했을 때 실행되는 **'2단계 취향 분석 팝업'**입니다.

[최초 방문 확인]

localStorage에 survey_completed 플래그가 있는지 확인합니다.

플래그가 없으면 2단계 취향 분석 팝업을 실행합니다.

[1단계: 5가지 질문 (넓은 취향 파악)]

Q1. 인생 영화: (텍스트 입력) API 검색을 통해 영화 ID(movie_id) 및 키워드(keywords) 확보

Q2. 선호 장르: (체크박스) 장르 ID(genre_ids) 확보

Q3. 선호 무드: (객관식) 자체 매핑된 키워드 ID(keywords) 확보

Q4. 불호 요소: (체크박스) 불호 장르 ID(without_genres) 및 불호 키워드(without_keywords) 확보

Q5. 탐색 스타일: (객관식) API 정렬 기준(sort_by) 확보

[2단계: 타겟 별점 평가 (취향 세분화)]

1단계에서 선택한 '선호 장르'를 기반으로, API에서 해당 장르의 인기 영화 10개를 동적으로 불러옵니다.

사용자는 이 10개의 영화에 대해 별점(1~5점)을 매깁니다.

이 별점 데이터를 분석하여 사용자의 liked_keywords와 disliked_keywords를 더욱 정교하게 보강합니다.

[프로필 생성 및 저장]

1, 2단계의 모든 데이터를 조합하여 하나의 userProfile JSON 객체를 생성합니다.

이 객체를 localStorage에 저장합니다.

localStorage.setItem('userProfile', JSON.stringify(profile))

localStorage.setItem('survey_completed', 'true')

분석 결과와 함께 초기 추천 영화 5편을 팝업에 표시한 뒤 팝업을 닫습니다.

🚀 주요 기능
1. 2단계 취향 분석 팝업 (Core)
기능: 사용자가 사이트에 처음 방문했을 때, 취향을 분석하기 위해 1회 실행됩니다.

흐름: [1/2] 5가지 질문 → [2/2] 1단계 기반 타겟 영화 10개 별점 평가 → [결과] 분석 완료 및 초기 추천

2. 개인화된 맞춤 영화 추천
기능: 팝업에서 생성된 localStorage의 userProfile을 기반으로 영화를 추천합니다.

API: TMDB의 /discover/movie 엔드포인트를 사용합니다.

로직: userProfile의 with_genres, without_genres, with_keywords, sort_by 등의 파라미터를 조합하여 API를 호출합니다.

3. 찜하기 (Wishlist)
기능: 영화 카드의 '하트' 아이콘을 클릭하여 영화를 찜 목록에 추가/제거합니다.

저장: localStorage에 wishlist라는 이름의 배열(영화 ID 저장)로 관리됩니다.

4. 영화 검색
기능: 헤더의 검색창에서 키워드 입력 시, TMDB API (/search/movie)를 호출하여 실시간으로 결과를 표시합니다.

5. TOP 100 영화 목록
기능: TMDB API (/discover/movie)의 정렬 기능(sort_by=vote_average.desc)을 활용하여 평점이 높은 영화 목록을 표시합니다.