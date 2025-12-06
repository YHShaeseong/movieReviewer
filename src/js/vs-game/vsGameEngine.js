/* ============================================
   VS 게임 엔진 (3-Layer 취향 분석)

   Phase 1: 탐색 (Round 1-10) - 3-Layer 데이터 수집
   Phase 2: 검증 (Round 11-13) - 취향 재확인 + 신뢰도 조정
   ============================================ */

/* ============================================
   TMDB 키워드 매핑 테이블
   ============================================ */
const KEYWORD_MAPPING = {
  // Stimulation - 자극
  stimulation: {
    brain: [9663, 10183, 9824, 11005],  // investigation, psychological, mystery, suspense
    heart: [6075, 4093, 10634, 9716],   // friendship, love, coming of age, healing
    body: [9714, 156095, 10349]         // remake, survival, gore
  },
  // Atmosphere - 분위기 (Texture)
  texture: {
    warm: [10564, 9716],     // feel good, healing
    cold: [10046, 11003, 9718, 236],  // dystopia, noir, revenge, suicide
    light: [],               // Comedy, Adventure (장르로 처리)
    heavy: []                // Drama, History, War (장르로 처리)
  },
  // Worldview - 세계관
  worldview: {
    reality: [387],          // biography
    fantasy: [4388, 9866]    // spaceship, magic
  }
};

/* ============================================
   [발표 3단계] 취향 설정 - Phase 2 (VS 게임)
   설명: 3-Layer 취향 분석 (Worldview/Stimulation/Texture)
        Phase 1 (10라운드) + Phase 2 (3라운드 동적 검증)
   ============================================ */

/* ============================================
   Phase 1: 고정 영화 라운드 (10라운드)
   ============================================ */
const PHASE1_FIXED_ROUNDS = [
  // R1: 현실 vs 환상
  {
    phase: 1,
    layer: 'worldview',
    theme: '현실 vs 환상',
    description: '어떤 세계관이 더 끌리나요?',
    movieA: { id: 278, attribute: 'reality' },      // 쇼생크 탈출
    movieB: { id: 157336, attribute: 'fantasy' }    // 인터스텔라
  },
  // R2: 극한 현실 vs 무한 상상
  {
    phase: 1,
    layer: 'worldview',
    theme: '극한 현실 vs 무한 상상',
    description: '사실 vs 상상, 어디에 더 빠지나요?',
    movieA: { id: 496243, attribute: 'reality' },   // 기생충
    movieB: { id: 299534, attribute: 'fantasy' }    // 어벤져스: 엔드게임
  },
  // R3: 역사 vs 미래
  {
    phase: 1,
    layer: 'worldview',
    theme: '역사 vs 미래',
    description: '과거 vs 미래, 어디로 가고 싶나요?',
    movieA: { id: 597, attribute: 'reality' },      // 타이타닉
    movieB: { id: 19995, attribute: 'fantasy' }     // 아바타
  },

  // R4: 치열한 두뇌 vs 따뜻한 감동
  {
    phase: 1,
    layer: 'stimulation',
    theme: '치열한 두뇌 vs 따뜻한 감동',
    description: '머리 vs 가슴, 무엇을 더 자극받고 싶나요?',
    movieA: { id: 9693, attribute: 'brain' },       // 셜록 홈즈
    movieB: { id: 1022789, attribute: 'heart' }     // 인사이드 아웃 2
  },
  // R5: 압도적 스릴 vs 몽글몽글 감성
  {
    phase: 1,
    layer: 'stimulation',
    theme: '압도적 스릴 vs 몽글몽글 감성',
    description: '긴장감 vs 눈물, 어떤 걸 원하나요?',
    movieA: { id: 155, attribute: 'body' },         // 다크 나이트
    movieB: { id: 129, attribute: 'heart' }         // 센과 치히로의 행방불명
  },
  // R6: 짜릿한 액션 vs 달달한 로맨스
  {
    phase: 1,
    layer: 'stimulation',
    theme: '짜릿한 액션 vs 달달한 로맨스',
    description: '몸 vs 마음, 어떤 자극을 원하나요?',
    movieA: { id: 361743, attribute: 'body' },      // 탑건: 매버릭
    movieB: { id: 976573, attribute: 'heart' }      // 엘리멘탈
  },

  // R7: 진지함 vs 유쾌함
  {
    phase: 1,
    layer: 'texture',
    theme: '진지함 vs 유쾌함',
    description: '무거운 감동 vs 따뜻한 감동, 어떤 걸 원하나요?',
    movieA: { id: 872585, attribute: 'heavy' },     // 오펜하이머
    movieB: { id: 346698, attribute: 'light' }      // 바비
  },
  // R8: 따뜻한 위로 vs 차가운 전율
  {
    phase: 1,
    layer: 'texture',
    theme: '따뜻한 위로 vs 차가운 전율',
    description: '어떤 온도의 영화가 좋나요?',
    movieA: { id: 150540, attribute: 'warm' },      // 인사이드 아웃
    movieB: { id: 475557, attribute: 'cold' }       // 조커
  },
  // R9: 가벼운 웃음 vs 묵직한 서사
  {
    phase: 1,
    layer: 'texture',
    theme: '가벼운 웃음 vs 묵직한 서사',
    description: '어떤 무게감의 이야기가 좋나요?',
    movieA: { id: 585511, attribute: 'light' },     // 극한직업
    movieB: { id: 49026, attribute: 'heavy' }       // 다크 나이트 라이즈
  },
  // R10: 밝은 동심 vs 어두운 복수
  {
    phase: 1,
    layer: 'texture',
    theme: '밝은 동심 vs 어두운 복수',
    description: '어떤 분위기를 선호하나요?',
    movieA: { id: 862, attribute: 'light' },        // 토이 스토리
    movieB: { id: 1500, attribute: 'cold' }         // 올드보이
  }
];


/* ============================================
   VS 게임 엔진 클래스
   ============================================ */
export class VSGameEngine {
  constructor() {
    this.currentRound = 0;
    this.phase = 1;
    this.totalRounds = 13; // Phase 1 (10) + Phase 2 (3)

    // 영화 데이터 캐시
    this.moviesCache = {};

    // 라운드별 영화 매핑
    this.roundMovies = [];

    // 사용자 점수 (3-Layer)
    this.scores = {
      worldview: { reality: 0, fantasy: 0 },
      stimulation: { brain: 0, heart: 0, body: 0 },
      texture: { warm: 0, cold: 0, light: 0, heavy: 0 }
    };

    // 신뢰도 점수 (Confidence Score)
    this.confidence = {
      worldview: 1.0,
      stimulation: 1.0,
      texture: 1.0
    };

    // Phase 1 결과 저장
    this.phase1Results = null;

    // Phase 2 라운드 (동적 생성)
    this.phase2Rounds = [];

    // 선택 기록
    this.history = [];
  }

  /* ============================================
     영화 ID로 영화 정보 가져오기
     ============================================ */
  async fetchMovieById(movieId) {
    try {
      return await window.tmdbApi.getCompleteMovieInfo(movieId);
    } catch (error) {
      console.error(`영화 ID ${movieId} 로드 실패:`, error);
      throw error;
    }
  }

  /* ============================================
     영화 데이터 사전 로드 (고정)
     ============================================ */
  async preloadMovies() {
    try {
      console.log('Phase 1 고정 영화 로딩 시작...');

      for (const round of PHASE1_FIXED_ROUNDS) {
        try {
          const movieA = await this.fetchMovieById(round.movieA.id);
          const movieB = await this.fetchMovieById(round.movieB.id);

          this.moviesCache[movieA.id] = movieA;
          this.moviesCache[movieB.id] = movieB;

          this.roundMovies.push({
            movieA,
            movieB,
            template: round
          });

          console.log(`${round.theme}: ${movieA.title} vs ${movieB.title}`);
        } catch (error) {
          console.error(`${round.theme} 로드 실패:`, error);
        }
      }

      this.totalRounds = this.roundMovies.length + 3;
      console.log(`총 ${this.totalRounds}라운드 (Phase1: 10, Phase2: 3)`);
    } catch (error) {
      console.error('영화 로드 실패:', error);
      throw error;
    }
  }

  /* ============================================
     현재 라운드 데이터 반환
     ============================================ */
  async getCurrentRound() {
    // Phase 1 (1-10)
    if (this.currentRound < this.roundMovies.length) {
      const roundData = this.roundMovies[this.currentRound];

      if (!roundData) {
        console.error(`라운드 ${this.currentRound} 데이터 없음`);
        return null;
      }

      const { movieA, movieB, template } = roundData;

      // 동적 roundConfig 생성
      const roundConfig = {
        ...template,
        movieA: {
          id: movieA.id,
          attribute: template.movieA.attribute
        },
        movieB: {
          id: movieB.id,
          attribute: template.movieB.attribute
        }
      };

      return {
        phase: 1,
        roundConfig,
        movieAData: movieA,
        movieBData: movieB,
        progress: {
          current: this.currentRound + 1,
          total: this.totalRounds,
          percentage: ((this.currentRound + 1) / this.totalRounds) * 100
        },
        theme: template.theme,
        description: template.description
      };
    }

    // Phase 2
    else if (this.currentRound < this.totalRounds) {
      // Phase 2 첫 라운드면 검증 라운드 생성
      if (this.phase2Rounds.length === 0) {
        await this.generatePhase2Rounds();
      }

      const phase2Index = this.currentRound - this.roundMovies.length;
      const roundConfig = this.phase2Rounds[phase2Index];

      if (!roundConfig) {
        console.error('Phase 2 라운드 없음:', phase2Index);
        return null;
      }

      const movieAData = this.moviesCache[roundConfig.movieA.id];
      const movieBData = this.moviesCache[roundConfig.movieB.id];

      return {
        phase: 2,
        roundConfig,
        movieAData,
        movieBData,
        progress: {
          current: this.currentRound + 1,
          total: this.totalRounds,
          percentage: ((this.currentRound + 1) / this.totalRounds) * 100
        },
        theme: roundConfig.theme,
        description: roundConfig.description,
        isVerification: true
      };
    }

    return null;
  }

  /* ============================================
     [발표 3단계 - Phase 2] 동적 검증 라운드 생성
     설명: Phase 1 결과 기반으로 사용자 취향 재확인 (3라운드)
     ============================================ */
  /* ============================================
     Phase 2 검증 라운드 고정 생성
     ============================================ */
  async generatePhase2Rounds() {
    console.log('Phase 2 검증 라운드 생성 시작...');

    // Phase 1 결과 분석
    this.phase1Results = {
      worldview: this.scores.worldview.reality > this.scores.worldview.fantasy ? 'reality' : 'fantasy',
      stimulation: this.getTopStimulation(),
      texture: {
        temperature: this.scores.texture.warm > this.scores.texture.cold ? 'warm' : 'cold',
        density: this.scores.texture.light > this.scores.texture.heavy ? 'light' : 'heavy'
      }
    };

    console.log('Phase 1 분석 결과:', this.phase1Results);

    // R11: 세계관 검증 (reality vs fantasy)
    const worldviewMovies = {
      reality: { id: 550, title: '파이트 클럽' },      // 현실파 극한
      fantasy: { id: 122, title: '반지의 제왕: 두 개의 탑' }  // 판타지파 극한
    };

    const wvWinner = this.phase1Results.worldview;
    const wvLoser = wvWinner === 'reality' ? 'fantasy' : 'reality';

    try {
      const movieA = await this.fetchMovieById(worldviewMovies[wvWinner].id);
      const movieB = await this.fetchMovieById(worldviewMovies[wvLoser].id);

      this.moviesCache[movieA.id] = movieA;
      this.moviesCache[movieB.id] = movieB;

      this.phase2Rounds.push({
        type: 'extreme',
        layer: 'worldview',
        theme: '절대 포기할 수 없는 것',
        description: '당신이 진짜 좋아하는 세계관을 확인합니다',
        movieA: { id: movieA.id, attribute: wvWinner, expected: true },
        movieB: { id: movieB.id, attribute: wvLoser, expected: false }
      });
    } catch (error) {
      console.error('Phase 2 R11 생성 실패:', error);
    }

    // R12: 자극 검증 (brain vs heart vs body)
    const stimMovies = {
      brain: { id: 680, title: '펄프 픽션' },
      heart: { id: 372058, title: '너의 이름은' },
      body: { id: 299534, title: '어벤져스: 엔드게임' }
    };

    const stimWinner = this.phase1Results.stimulation;
    const stimOpposite = stimWinner === 'brain' ? 'body' : (stimWinner === 'body' ? 'heart' : 'brain');

    try {
      const movieA = await this.fetchMovieById(stimMovies[stimWinner].id);
      const movieB = await this.fetchMovieById(stimMovies[stimOpposite].id);

      this.moviesCache[movieA.id] = movieA;
      this.moviesCache[movieB.id] = movieB;

      this.phase2Rounds.push({
        type: 'crosscheck',
        layer: 'stimulation',
        theme: '진짜 원하는 자극',
        description: '어떤 자극이 더 끌리는지 확인합니다',
        movieA: { id: movieA.id, attribute: stimWinner, expected: true },
        movieB: { id: movieB.id, attribute: stimOpposite, expected: false }
      });
    } catch (error) {
      console.error('Phase 2 R12 생성 실패:', error);
    }

    // R13: 온도 검증 (warm vs cold)
    const tempMovies = {
      warm: { id: 354912, title: '코코' },
      cold: { id: 27205, title: '인셉션' }
    };

    const tempWinner = this.phase1Results.texture.temperature;
    const tempLoser = tempWinner === 'warm' ? 'cold' : 'warm';

    try {
      const movieA = await this.fetchMovieById(tempMovies[tempWinner].id);
      const movieB = await this.fetchMovieById(tempMovies[tempLoser].id);

      this.moviesCache[movieA.id] = movieA;
      this.moviesCache[movieB.id] = movieB;

      this.phase2Rounds.push({
        type: 'trap',
        layer: 'texture',
        theme: '따뜻함 vs 차가움',
        description: '어떤 분위기가 더 편한지 확인합니다',
        movieA: { id: movieA.id, attribute: tempWinner, expected: true },
        movieB: { id: movieB.id, attribute: tempLoser, expected: false }
      });
    } catch (error) {
      console.error('Phase 2 R13 생성 실패:', error);
    }

    console.log('Phase 2 라운드 생성 완료 (3라운드):', this.phase2Rounds);
  }

  /* ============================================
     영화 선택 처리
     ============================================ */
  async selectMovie(choice) {
    const roundData = await this.getCurrentRound();
    if (!roundData) return true;

    const { roundConfig, phase } = roundData;
    const selectedMovie = choice === 'A' ? roundConfig.movieA : roundConfig.movieB;
    const attribute = selectedMovie.attribute;

    // 선택 기록
    this.history.push({
      round: this.currentRound + 1,
      phase,
      choice,
      attribute,
      layer: roundConfig.layer
    });

    // Phase 1: 기본 점수 누적
    if (phase === 1) {
      this.addScore(roundConfig.layer, attribute);
    }

    // Phase 2: 검증 + 신뢰도 조정
    else if (phase === 2) {
      this.addScore(roundConfig.layer, attribute);
      this.adjustConfidence(roundConfig, selectedMovie);
    }

    // 다음 라운드로
    this.currentRound++;

    // Phase 1 완료 시점 (10라운드 끝)
    if (this.currentRound === 10) {
      console.log('Phase 1 완료! Phase 2 준비 중...');
      return false; // 아직 게임 계속
    }

    // 게임 종료 여부
    return this.currentRound >= this.totalRounds;
  }

  /* ============================================
     점수 추가
     ============================================ */
  addScore(layer, attribute) {
    if (layer === 'worldview') {
      this.scores.worldview[attribute]++;
    } else if (layer === 'stimulation') {
      this.scores.stimulation[attribute]++;
    } else if (layer === 'texture') {
      this.scores.texture[attribute]++;
    }
  }

  /* ============================================
     신뢰도 조정 (Phase 2)
     ============================================ */
  adjustConfidence(roundConfig, selectedMovie) {
    const { layer, type } = roundConfig;
    const isExpected = selectedMovie.expected === true;

    console.log(`신뢰도 조정: ${layer}, 예상대로? ${isExpected}`);

    if (type === 'extreme' || type === 'crosscheck' || type === 'trap') {
      if (isExpected) {
        // 일관성 있음 → 신뢰도 증가
        this.confidence[layer] *= 1.2;
        console.log(`✅ ${layer} 신뢰도 증가: ${this.confidence[layer].toFixed(2)}`);
      } else {
        // 일관성 없음 → 신뢰도 감소
        this.confidence[layer] *= 0.9;
        console.log(`⚠️ ${layer} 신뢰도 감소: ${this.confidence[layer].toFixed(2)}`);
      }
    }
  }

  /* ============================================
     최상위 자극 타겟 계산
     ============================================ */
  getTopStimulation() {
    const { brain, heart, body } = this.scores.stimulation;
    if (brain >= heart && brain >= body) return 'brain';
    if (heart >= body) return 'heart';
    return 'body';
  }

  /* ============================================
     랜덤 선택 헬퍼
     ============================================ */
  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /* ============================================
     [발표 4단계] 취향 분석 결과
     설명: 13라운드 결과 종합 분석 → 강도 표현 → 한 문장 요약 생성
     ============================================ */
  /* ============================================
     3-Layer 프로필 분석
     ============================================ */
  getProfileAnalysis() {
    // 신뢰도 적용된 최종 점수 계산
    const finalScores = {
      worldview: {
        reality: this.scores.worldview.reality * this.confidence.worldview,
        fantasy: this.scores.worldview.fantasy * this.confidence.worldview
      },
      stimulation: {
        brain: this.scores.stimulation.brain * this.confidence.stimulation,
        heart: this.scores.stimulation.heart * this.confidence.stimulation,
        body: this.scores.stimulation.body * this.confidence.stimulation
      },
      texture: {
        warm: this.scores.texture.warm * this.confidence.texture,
        cold: this.scores.texture.cold * this.confidence.texture,
        light: this.scores.texture.light * this.confidence.texture,
        heavy: this.scores.texture.heavy * this.confidence.texture
      }
    };

    // 강도 계산 헬퍼 함수
    const getIntensity = (percent) => {
      if (percent >= 80) return '매우 강하게';
      if (percent >= 65) return '강하게';
      if (percent >= 55) return '약간';
      return '균형있게';
    };

    // Layer 1: 세계관
    const worldviewTotal = finalScores.worldview.reality + finalScores.worldview.fantasy;
    const realityPercent = Math.round((finalScores.worldview.reality / worldviewTotal) * 100);
    const fantasyPercent = 100 - realityPercent;

    const worldviewResult = realityPercent > fantasyPercent ? {
      label: '현실파',
      intensity: getIntensity(realityPercent),
      description: '사실적이고 현실적인 이야기를 선호합니다. 다큐멘터리, 역사물, 전기 영화에 끌립니다.',
      attribute: 'reality'
    } : {
      label: '환상파',
      intensity: getIntensity(fantasyPercent),
      description: '상상력이 넘치는 세계를 좋아합니다. SF, 판타지, 모험 영화를 즐깁니다.',
      attribute: 'fantasy'
    };

    // Layer 2: 자극 타겟
    const stimTotal = finalScores.stimulation.brain + finalScores.stimulation.heart + finalScores.stimulation.body;
    const brainPercent = Math.round((finalScores.stimulation.brain / stimTotal) * 100);
    const heartPercent = Math.round((finalScores.stimulation.heart / stimTotal) * 100);
    const bodyPercent = Math.round((finalScores.stimulation.body / stimTotal) * 100);

    const stimMax = Math.max(brainPercent, heartPercent, bodyPercent);
    let stimLabel, stimDesc, stimAttr, stimIntensity;

    if (stimMax === brainPercent) {
      stimLabel = '두뇌 자극형';
      stimDesc = '복잡한 스토리와 반전을 즐깁니다. 미스터리, 스릴러, 범죄 영화를 좋아합니다.';
      stimAttr = 'brain';
      stimIntensity = getIntensity(brainPercent);
    } else if (stimMax === heartPercent) {
      stimLabel = '감성 자극형';
      stimDesc = '감정선이 풍부한 이야기를 좋아합니다. 드라마, 로맨스, 가족 영화에 끌립니다.';
      stimAttr = 'heart';
      stimIntensity = getIntensity(heartPercent);
    } else {
      stimLabel = '액션 자극형';
      stimDesc = '강렬한 액션과 스릴을 즐깁니다. 액션, 공포, 어드벤처 영화를 선호합니다.';
      stimAttr = 'body';
      stimIntensity = getIntensity(bodyPercent);
    }

    // Layer 3: 감성 텍스처
    const warmColdTotal = finalScores.texture.warm + finalScores.texture.cold;
    const warmPercent = Math.round((finalScores.texture.warm / warmColdTotal) * 100);
    const coldPercent = 100 - warmPercent;

    const lightHeavyTotal = finalScores.texture.light + finalScores.texture.heavy;
    const lightPercent = Math.round((finalScores.texture.light / lightHeavyTotal) * 100);
    const heavyPercent = 100 - lightPercent;

    // MBTI 스타일 문장 생성 로직
    const tempAttr = warmPercent > coldPercent ? 'warm' : 'cold';
    const densAttr = lightPercent > heavyPercent ? 'light' : 'heavy';

    // 분위기 형용사 (온도감)
    const atmosphereAdj = {
      'warm': '따뜻하고 희망찬',
      'cold': '차갑고 냉철한'
    };

    // 세계관 명사
    const worldviewNoun = {
      'reality': '현실의 세계',
      'fantasy': '상상의 세계'
    };

    // 자극 타겟 동사구
    const stimulationVerb = {
      'brain': '지적인 탐구를 즐기는',
      'heart': '깊은 감동을 찾아 떠나는',
      'body': '짜릿한 전율을 만끽하는'
    };

    // 페르소나 칭호 (6가지 조합)
    const personaTitle = {
      'reality_brain': '현실의 전략가',
      'reality_heart': '감성적인 현실주의자',
      'reality_body': '행동하는 실천가',
      'fantasy_brain': '사색하는 몽상가',
      'fantasy_heart': '낭만적인 감성가',
      'fantasy_body': '꿈꾸는 모험가'
    };

    const title = personaTitle[`${worldviewResult.attribute}_${stimAttr}`];
    const sentence = `당신은 ${atmosphereAdj[tempAttr]} ${worldviewNoun[worldviewResult.attribute]} 속에서 ${stimulationVerb[stimAttr]} ${title}입니다.`;

    // 해시태그 생성 (3-5개)
    const hashtags = [
      `#${tempAttr === 'warm' ? '따뜻함' : '냉철함'}`,
      `#${worldviewResult.attribute === 'reality' ? '현실주의' : '몽상가'}`,
      `#${stimAttr === 'brain' ? '지적호기심' : stimAttr === 'heart' ? '감성충만' : '액션러버'}`
    ];

    if (densAttr === 'heavy') hashtags.push('#깊이있는');
    if (worldviewResult.intensity === '매우 높음') hashtags.push('#확고한취향');

    return {
      title: title,  // 페르소나 칭호
      sentence: sentence,  // MBTI 스타일 한 문장 요약
      hashtags: hashtags,  // 해시태그 배열
      worldview: worldviewResult,
      stimulation: {
        label: stimLabel,
        intensity: stimIntensity,
        description: stimDesc,
        attribute: stimAttr,
        distribution: {
          brain: brainPercent,
          heart: heartPercent,
          body: bodyPercent
        }
      },
      texture: {
        temperature: {
          label: warmPercent > coldPercent ? '따뜻함' : '차가움',
          intensity: getIntensity(warmPercent > coldPercent ? warmPercent : coldPercent),
          attribute: warmPercent > coldPercent ? 'warm' : 'cold',
          percent: warmPercent > coldPercent ? warmPercent : coldPercent,
          warmPercent,
          coldPercent
        },
        density: {
          label: lightPercent > heavyPercent ? '가벼움' : '무거움',
          intensity: getIntensity(lightPercent > heavyPercent ? lightPercent : heavyPercent),
          attribute: lightPercent > heavyPercent ? 'light' : 'heavy',
          percent: lightPercent > heavyPercent ? lightPercent : heavyPercent,
          lightPercent,
          heavyPercent
        }
      },
      confidence: this.confidence,
      rawScores: this.scores,
      finalScores: finalScores
    };
  }

  /* ============================================
     키워드 ID 추출 (3-Layer 분석 기반)
     ============================================ */
  getKeywordIds() {
    const profile = this.getProfileAnalysis();
    const keywordIds = [];

    // 1. Stimulation (자극 타겟)
    const stimAttr = profile.stimulation.attribute; // 'brain', 'heart', 'body'
    if (KEYWORD_MAPPING.stimulation[stimAttr]) {
      keywordIds.push(...KEYWORD_MAPPING.stimulation[stimAttr]);
    }

    // 2. Texture (분위기) - temperature 기준
    const tempAttr = profile.texture.temperature.attribute; // 'warm', 'cold'
    if (KEYWORD_MAPPING.texture[tempAttr]) {
      keywordIds.push(...KEYWORD_MAPPING.texture[tempAttr]);
    }

    // 3. Worldview (세계관)
    const worldAttr = profile.worldview.attribute; // 'reality', 'fantasy'
    if (KEYWORD_MAPPING.worldview[worldAttr]) {
      keywordIds.push(...KEYWORD_MAPPING.worldview[worldAttr]);
    }

    // 중복 제거 후 파이프(|)로 연결 (OR 조건)
    const uniqueIds = [...new Set(keywordIds)];
    return uniqueIds.join('|');
  }

  /* ============================================
     ⭐⭐⭐ [핵심 알고리즘] 3-Layer 필터링 + 가중치 채점 시스템 ⭐⭐⭐

     설계 원리:
     1. 3-Layer 필터링 방식
        - Layer 1 (명시적 취향): 사용자가 직접 선택한 장르
        - Layer 2 (무의식적 취향): VS 게임에서 선택한 영화의 패턴 분석
        - Layer 3 (정합성 검증): 3-Layer 분석으로 취향의 일관성 확인

     2. 가중치 채점 시스템
        - 결정적 요인(Critical Factor): 명시적 선호/기피 장르 → 높은 가중치
        - 취향 요인(Preference Factor): VS 게임 선택 패턴 → 가산점
        - 감성 요인(Emotional Factor): 3-Layer 분위기 분석 → 미세 조정

     3. 최종 목표
        → 단순 장르 매칭이 아닌, 사용자의 감성과 톤앤매너에
          가장 근접한 영화를 우선순위로 추천
     ============================================ */
  /* ============================================
     [발표 5단계] 맞춤 추천 - 가중치 기반 알고리즘
     설명: 1단계(50%) + VS게임(30%) + 3-Layer(20%) 가중치 합산
     ============================================ */
  async getRecommendations(page = 1) {
    const profile = this.getProfileAnalysis();
    const genreScores = {};

    /* ----------------------------------------
       Layer 1: 명시적 취향 (가중치 50% = +5.0점)
       "사용자가 말로 표현하는 취향"
       ---------------------------------------- */
    // 1. 1단계 설문 장르 (가중치 50%)
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userProfile.genres) {
      userProfile.genres.forEach(genreId => {
        genreScores[genreId] = (genreScores[genreId] || 0) + 5.0;
      });
    }

    /* ----------------------------------------
       Layer 2: 무의식적 취향 (가중치 30% = +3.0점)
       "VS 게임에서 실제 선택한 영화의 패턴"
       ---------------------------------------- */
    // 2. VS 게임 선택 영화 장르 (가중치 30%)
    this.history.forEach(h => {
      const round = this.roundMovies[h.round - 1];
      if (!round) return;
      const selected = h.choice === 'A' ? round.movieA : round.movieB;
      if (selected?.genre_ids) {
        selected.genre_ids.forEach(genreId => {
          genreScores[genreId] = (genreScores[genreId] || 0) + 3.0;
        });
      }
    });

    /* ----------------------------------------
       Layer 3: 정합성 검증 (가중치 20% = +2.0점)
       "3-Layer 분석 결과 (세계관/자극/분위기)"
       ---------------------------------------- */
    // 3. 3-Layer 분석 (가중치 20%)
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

    /* ----------------------------------------
       결정적 요인: 기피 장르 (음수 가중치 -3.0점)
       "절대 추천하지 말아야 할 장르 필터링"
       ---------------------------------------- */
    // 4. 피하기 요소 반영 (음수 가중치 -3.0)
    if (userProfile.dislikes && userProfile.dislikes.length > 0) {
      userProfile.dislikes.forEach(genreId => {
        genreScores[genreId] = (genreScores[genreId] || 0) - 3.0;
      });
    }

    /* ----------------------------------------
       최종 점수 계산 및 상위 5개 장르 선정
       음수 점수는 제외하여 기피 장르 완전 배제
       ---------------------------------------- */
    // 점수 기준 상위 5개 장르 (음수 점수 제외)
    const uniqueGenres = Object.entries(genreScores)
      .filter(([id, score]) => score > 0)  // 음수 점수 제외
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => parseInt(id));

    console.log('추천 장르:', uniqueGenres);
    console.log('피하기 장르:', userProfile.dislikes);

    // 키워드 추출
    const keywordString = this.getKeywordIds();
    console.log('추천 키워드:', keywordString);

    // VS 게임에서 이미 본 영화 ID 수집
    const seenMovieIds = new Set();
    this.roundMovies.forEach(round => {
      if (round.movieA) seenMovieIds.add(round.movieA.id);
      if (round.movieB) seenMovieIds.add(round.movieB.id);
    });
    this.phase2Rounds.forEach(round => {
      const movieA = this.moviesCache[round.movieA.id];
      const movieB = this.moviesCache[round.movieB.id];
      if (movieA) seenMovieIds.add(movieA.id);
      if (movieB) seenMovieIds.add(movieB.id);
    });

    console.log('제외할 영화 수:', seenMovieIds.size);

    // 추천 영화 가져오기 함수 (폴백 포함)
    const fetchMoviesWithFallback = async (genreIds, voteCountMin, voteAvgMin, pageNum, withKeywords = true) => {
      try {
        const params = {
          with_genres: genreIds.join(','),
          sort_by: 'vote_average.desc',
          'vote_count.gte': voteCountMin,
          'vote_average.gte': voteAvgMin,
          page: pageNum
        };

        // 키워드 필터 추가 (옵션)
        if (withKeywords && keywordString) {
          params.with_keywords = keywordString;
        }

        const data = await window.tmdbApi.discoverMovies(params);

        if (!data.results) return [];

        // VS 게임에서 본 영화 제외하고 중복 제거
        const uniqueMovies = [];
        const movieIds = new Set();

        for (const movie of data.results) {
          if (!seenMovieIds.has(movie.id) && !movieIds.has(movie.id)) {
            movieIds.add(movie.id);
            uniqueMovies.push(movie);
          }
        }

        return uniqueMovies;
      } catch (error) {
        console.error('영화 로드 실패:', error);
        return [];
      }
    };

    try {
      let movies = [];

      // 1차 시도: 장르 + 키워드 (엄격한 기준)
      if (uniqueGenres.length >= 3) {
        movies = await fetchMoviesWithFallback(uniqueGenres.slice(0, 3), 5000, 7.5, page, true);
        console.log(`1차 시도 (장르+키워드): ${movies.length}개 로드`);
      }

      // 2차 시도: 장르만 (키워드 제거, 평점 완화)
      if (movies.length < 5 && uniqueGenres.length >= 3) {
        const additional = await fetchMoviesWithFallback(uniqueGenres.slice(0, 3), 3000, 7.0, page, false);
        const existingIds = new Set(movies.map(m => m.id));
        additional.forEach(movie => {
          if (!existingIds.has(movie.id) && movies.length < 20) {
            movies.push(movie);
            existingIds.add(movie.id);
          }
        });
        console.log(`2차 시도 (키워드 제거): 총 ${movies.length}개`);
      }

      // 3차 시도: 장르 확대 (상위 5개)
      if (movies.length < 5 && uniqueGenres.length > 0) {
        const additional = await fetchMoviesWithFallback(uniqueGenres.slice(0, 5), 3000, 7.0, page, false);
        const existingIds = new Set(movies.map(m => m.id));
        additional.forEach(movie => {
          if (!existingIds.has(movie.id) && movies.length < 20) {
            movies.push(movie);
            existingIds.add(movie.id);
          }
        });
        console.log(`3차 시도 (장르 확대): 총 ${movies.length}개`);
      }

      // 4차 시도: 기준 더 완화 (평점 6.5+)
      if (movies.length < 5 && uniqueGenres.length > 0) {
        const additional = await fetchMoviesWithFallback(uniqueGenres, 1000, 6.5, page, false);
        const existingIds = new Set(movies.map(m => m.id));
        additional.forEach(movie => {
          if (!existingIds.has(movie.id) && movies.length < 20) {
            movies.push(movie);
            existingIds.add(movie.id);
          }
        });
        console.log(`4차 시도 (기준 완화): 총 ${movies.length}개`);
      }

      // 5차 시도: 최종 폴백 - 인기 영화 (장르 제한 없음)
      if (movies.length < 5) {
        console.log('최종 폴백: 인기 영화로 채우기');
        const fallbackData = await window.tmdbApi.discoverMovies({
          sort_by: 'popularity.desc',
          'vote_count.gte': 5000,
          'vote_average.gte': 7.0,
          page: page
        });

        if (fallbackData.results) {
          const existingIds = new Set(movies.map(m => m.id));
          fallbackData.results.forEach(movie => {
            if (!seenMovieIds.has(movie.id) && !existingIds.has(movie.id) && movies.length < 20) {
              movies.push(movie);
              existingIds.add(movie.id);
            }
          });
        }
        console.log(`최종: 총 ${movies.length}개 (인기 영화 포함)`);
      }

      console.log(`✅ 최종 추천 영화 ${movies.length}개 반환`);
      return movies;

    } catch (error) {
      console.error('추천 영화 로드 실패:', error);

      // 최종 에러 폴백: 기본 인기 영화
      try {
        const fallbackData = await window.tmdbApi.discoverMovies({
          sort_by: 'popularity.desc',
          page: 1
        });
        return fallbackData.results?.slice(0, 20) || [];
      } catch {
        return [];
      }
    }
  }

  /* ============================================
     프로필 저장
     ============================================ */
  saveProfile() {
    const profile = this.getProfileAnalysis();
    localStorage.setItem('vsGameProfile', JSON.stringify({
      profile,
      history: this.history,
      timestamp: new Date().toISOString()
    }));
    console.log('VS 게임 프로필 저장 완료');
  }
}
