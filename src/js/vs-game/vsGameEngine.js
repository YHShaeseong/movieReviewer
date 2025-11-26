/* ============================================
   VS 게임 엔진 (3-Layer Deep Dive + Dynamic Confidence Scoring)

   Phase 1: 탐색전 (Round 1-10) - 3-Layer 데이터 수집
   Phase 2: 검증전 (Round 11-15) - 함정 질문 + 신뢰도 검증
   ============================================ */

/* ============================================
   Phase 1: 탐색전 라운드 구성 (10라운드)
   ============================================ */
const PHASE1_ROUNDS = [
  // Layer 1: 현실 vs 환상 (3문항)
  {
    phase: 1,
    layer: 'worldview',
    theme: '현실 vs 환상',
    description: '어떤 세계관이 더 끌리나요?',
    movieA: { id: 424, attribute: 'reality' }, // 쉰들러 리스트 (현실)
    movieB: { id: 120, attribute: 'fantasy' }  // 반지의 제왕 (환상)
  },
  {
    phase: 1,
    layer: 'worldview',
    theme: '다큐 vs SF',
    description: '사실 vs 상상, 어디에 더 빠지나요?',
    movieA: { id: 278, attribute: 'reality' }, // 쇼생크 탈출 (현실)
    movieB: { id: 157336, attribute: 'fantasy' } // 인터스텔라 (환상)
  },
  {
    phase: 1,
    layer: 'worldview',
    theme: '역사 vs 미래',
    description: '과거 vs 미래, 어디로 가고 싶나요?',
    movieA: { id: 13, attribute: 'reality' }, // 포레스트 검프 (현실/역사)
    movieB: { id: 603, attribute: 'fantasy' } // 매트릭스 (미래/환상)
  },

  // Layer 2: 자극 타겟 (4문항) - Brain / Heart / Body
  {
    phase: 1,
    layer: 'stimulation',
    theme: '두뇌 vs 심장',
    description: '머리 vs 가슴, 무엇을 더 자극받고 싶나요?',
    movieA: { id: 27205, attribute: 'brain' }, // 인셉션 (두뇌)
    movieB: { id: 19404, attribute: 'heart' }  // 다이어리 (심장)
  },
  {
    phase: 1,
    layer: 'stimulation',
    theme: '스릴 vs 감동',
    description: '긴장감 vs 눈물, 어떤 걸 원하나요?',
    movieA: { id: 155, attribute: 'brain' },  // 다크나이트 (두뇌/스릴)
    movieB: { id: 570670, attribute: 'heart' } // 엘리멘탈 (심장/감동)
  },
  {
    phase: 1,
    layer: 'stimulation',
    theme: '액션 vs 로맨스',
    description: '몸 vs 마음, 어떤 자극을 원하나요?',
    movieA: { id: 299534, attribute: 'body' },  // 어벤져스 (신체)
    movieB: { id: 597, attribute: 'heart' }     // 타이타닉 (심장)
  },
  {
    phase: 1,
    layer: 'stimulation',
    theme: '공포 vs 코미디',
    description: '소름 vs 웃음, 어떤 반응을 원하나요?',
    movieA: { id: 694, attribute: 'body' },   // 샤이닝 (신체)
    movieB: { id: 102899, attribute: 'heart' } // 앤트맨 (심장/유머)
  },

  // Layer 3: 감성 텍스처 (3문항) - 온도(따뜻/차가움) / 밀도(가벼움/무거움)
  {
    phase: 1,
    layer: 'texture',
    theme: '따뜻함 vs 차가움',
    description: '어떤 온도의 영화가 좋나요?',
    movieA: { id: 862, attribute: 'warm' },    // 토이 스토리 (따뜻함)
    movieB: { id: 769, attribute: 'cold' }     // 좋은 친구들 (차가움)
  },
  {
    phase: 1,
    layer: 'texture',
    theme: '가벼움 vs 무거움',
    description: '어떤 무게감의 이야기가 좋나요?',
    movieA: { id: 293660, attribute: 'light' }, // 데드풀 (가벼움)
    movieB: { id: 680, attribute: 'heavy' }     // 펄프 픽션 (무거움)
  },
  {
    phase: 1,
    layer: 'texture',
    theme: '밝음 vs 어두움',
    description: '어떤 분위기를 선호하나요?',
    movieA: { id: 109445, attribute: 'light' }, // 겨울왕국 (밝음)
    movieB: { id: 346, attribute: 'heavy' }     // 세븐 (어두움)
  }
];

/* ============================================
   검증용 영화 풀 (Verification Pool)
   ============================================ */
const VERIFICATION_POOL = {
  // 극단적 선택용
  reality_extreme: [278, 424, 238],  // 쇼생크, 쉰들러, 대부
  fantasy_extreme: [120, 122, 157336], // 반지의제왕, 인터스텔라

  // 시각 vs 청각
  visual: [299534, 284053, 27205], // 어벤져스, 인셉션 (화려한 영상)
  audio: [313369, 244786, 335984], // 라라랜드, 위플래쉬 (음악 중심)

  // 두뇌 자극
  brain_high: [27205, 155, 550],   // 인셉션, 다크나이트, 파이트클럽

  // 심장 자극
  heart_high: [597, 238, 13],      // 타이타닉, 대부, 포레스트 검프

  // 신체 자극
  body_high: [245891, 299534, 603] // 존 윅, 어벤져스, 매트릭스
};

/* ============================================
   VS 게임 엔진 클래스
   ============================================ */
export class VSGameEngine {
  constructor() {
    this.currentRound = 0;
    this.phase = 1;
    this.totalRounds = 15; // Phase 1 (10) + Phase 2 (5)

    // 영화 데이터 캐시
    this.moviesCache = {};

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
     영화 데이터 사전 로드
     ============================================ */
  async preloadMovies() {
    try {
      // Phase 1 영화 ID 수집
      const phase1Ids = PHASE1_ROUNDS.flatMap(r => [r.movieA.id, r.movieB.id]);

      // 검증 풀 영화 ID 수집
      const verificationIds = Object.values(VERIFICATION_POOL).flat();

      // 중복 제거
      const allIds = [...new Set([...phase1Ids, ...verificationIds])];

      console.log(`총 ${allIds.length}개 영화 정보 로딩 중...`);

      // 병렬 로드
      const promises = allIds.map(id =>
        window.tmdbApi.getMovieDetails(id)
          .catch(err => {
            console.error(`영화 ID ${id} 로드 실패:`, err);
            return null;
          })
      );

      const movies = await Promise.all(promises);

      // 캐시 저장
      movies.forEach(movie => {
        if (movie) {
          this.moviesCache[movie.id] = movie;
        }
      });

      console.log(`${Object.keys(this.moviesCache).length}개 영화 로드 완료`);

    } catch (error) {
      console.error('영화 데이터 로드 실패:', error);
      throw error;
    }
  }

  /* ============================================
     현재 라운드 데이터 반환
     ============================================ */
  getCurrentRound() {
    // Phase 1 (1-10)
    if (this.currentRound < 10) {
      const roundConfig = PHASE1_ROUNDS[this.currentRound];
      const movieAData = this.moviesCache[roundConfig.movieA.id];
      const movieBData = this.moviesCache[roundConfig.movieB.id];

      if (!movieAData || !movieBData) {
        console.error('영화 데이터 없음:', roundConfig);
        return null;
      }

      return {
        phase: 1,
        roundConfig,
        movieAData,
        movieBData,
        progress: {
          current: this.currentRound + 1,
          total: this.totalRounds,
          percentage: ((this.currentRound + 1) / this.totalRounds) * 100
        },
        theme: roundConfig.theme,
        description: roundConfig.description
      };
    }

    // Phase 2 (11-15)
    else if (this.currentRound < 15) {
      // Phase 2 첫 라운드면 검증 라운드 생성
      if (this.phase2Rounds.length === 0) {
        this.generatePhase2Rounds();
      }

      const phase2Index = this.currentRound - 10;
      const roundConfig = this.phase2Rounds[phase2Index];
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
     Phase 2 검증 라운드 동적 생성
     ============================================ */
  generatePhase2Rounds() {
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

    // 검증 질문 1: 극단적 선택 (세계관 1위 vs 2위)
    const worldviewWinner = this.phase1Results.worldview;
    const worldviewLoser = worldviewWinner === 'reality' ? 'fantasy' : 'reality';

    this.phase2Rounds.push({
      type: 'extreme',
      layer: 'worldview',
      theme: '절대 포기할 수 없는 것은?',
      description: '당신의 최애 세계관을 확인합니다',
      movieA: {
        id: this.pickRandom(VERIFICATION_POOL[`${worldviewWinner}_extreme`]),
        attribute: worldviewWinner,
        expected: true  // 이걸 선택해야 신뢰도 UP
      },
      movieB: {
        id: this.pickRandom(VERIFICATION_POOL[`${worldviewLoser}_extreme`]),
        attribute: worldviewLoser,
        expected: false
      }
    });

    // 검증 질문 2: 시각 vs 청각
    this.phase2Rounds.push({
      type: 'detail',
      layer: 'texture',
      theme: '스토리가 엉망이어도 용서되는 건?',
      description: '시각 vs 청각, 어느 쪽을 더 중시하나요?',
      movieA: {
        id: this.pickRandom(VERIFICATION_POOL.visual),
        attribute: 'visual'
      },
      movieB: {
        id: this.pickRandom(VERIFICATION_POOL.audio),
        attribute: 'audio'
      }
    });

    // 검증 질문 3: 자극 타겟 교차 검증
    const stimTop = this.phase1Results.stimulation;
    const stimOpposite = stimTop === 'brain' ? 'body' : (stimTop === 'body' ? 'heart' : 'brain');

    this.phase2Rounds.push({
      type: 'crosscheck',
      layer: 'stimulation',
      theme: '진짜 원하는 자극은?',
      description: '당신의 자극 타겟을 재확인합니다',
      movieA: {
        id: this.pickRandom(VERIFICATION_POOL[`${stimTop}_high`]),
        attribute: stimTop,
        expected: true
      },
      movieB: {
        id: this.pickRandom(VERIFICATION_POOL[`${stimOpposite}_high`]),
        attribute: stimOpposite,
        expected: false
      }
    });

    // 검증 질문 4: 온도 함정 질문
    const tempPreference = this.phase1Results.texture.temperature;

    // 따뜻함 선호자에게 차가운 명작 vs 따뜻한 B급 제시
    if (tempPreference === 'warm') {
      this.phase2Rounds.push({
        type: 'trap',
        layer: 'texture',
        theme: '명작이지만 차가운 vs 평범하지만 따뜻한',
        description: '온도 vs 완성도, 무엇을 택하나요?',
        movieA: { id: 769, attribute: 'cold', expected: false },  // 좋은 친구들 (명작/차가움)
        movieB: { id: 862, attribute: 'warm', expected: true }    // 토이 스토리 (따뜻함)
      });
    } else {
      this.phase2Rounds.push({
        type: 'trap',
        layer: 'texture',
        theme: '명작이지만 따뜻한 vs 평범하지만 차가운',
        description: '온도 vs 완성도, 무엇을 택하나요?',
        movieA: { id: 238, attribute: 'warm', expected: false }, // 대부 (명작/따뜻함)
        movieB: { id: 346, attribute: 'cold', expected: true }   // 세븐 (차가움)
      });
    }

    // 검증 질문 5: 밀도 함정 질문
    const densityPreference = this.phase1Results.texture.density;

    if (densityPreference === 'light') {
      this.phase2Rounds.push({
        type: 'trap',
        layer: 'texture',
        theme: '무거운 명작 vs 가벼운 즐거움',
        description: '완성도 vs 편안함, 무엇을 택하나요?',
        movieA: { id: 424, attribute: 'heavy', expected: false }, // 쉰들러 리스트 (무거움)
        movieB: { id: 293660, attribute: 'light', expected: true } // 데드풀 (가벼움)
      });
    } else {
      this.phase2Rounds.push({
        type: 'trap',
        layer: 'texture',
        theme: '가벼운 오락 vs 무거운 감동',
        description: '오락성 vs 의미, 무엇을 택하나요?',
        movieA: { id: 102899, attribute: 'light', expected: false }, // 앤트맨 (가벼움)
        movieB: { id: 680, attribute: 'heavy', expected: true }      // 펄프 픽션 (무거움)
      });
    }

    console.log('Phase 2 라운드 생성 완료:', this.phase2Rounds);
  }

  /* ============================================
     영화 선택 처리
     ============================================ */
  selectMovie(choice) {
    const roundData = this.getCurrentRound();
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

    // Layer 1: 세계관
    const worldviewTotal = finalScores.worldview.reality + finalScores.worldview.fantasy;
    const realityPercent = Math.round((finalScores.worldview.reality / worldviewTotal) * 100);
    const fantasyPercent = 100 - realityPercent;

    const worldviewResult = realityPercent > fantasyPercent ? {
      label: '현실파',
      percentage: realityPercent,
      description: '사실적이고 현실적인 이야기를 선호합니다. 다큐멘터리, 역사물, 전기 영화에 끌립니다.',
      attribute: 'reality'
    } : {
      label: '환상파',
      percentage: fantasyPercent,
      description: '상상력이 넘치는 세계를 좋아합니다. SF, 판타지, 모험 영화를 즐깁니다.',
      attribute: 'fantasy'
    };

    // Layer 2: 자극 타겟
    const stimTotal = finalScores.stimulation.brain + finalScores.stimulation.heart + finalScores.stimulation.body;
    const brainPercent = Math.round((finalScores.stimulation.brain / stimTotal) * 100);
    const heartPercent = Math.round((finalScores.stimulation.heart / stimTotal) * 100);
    const bodyPercent = Math.round((finalScores.stimulation.body / stimTotal) * 100);

    const stimMax = Math.max(brainPercent, heartPercent, bodyPercent);
    let stimLabel, stimDesc, stimAttr;

    if (stimMax === brainPercent) {
      stimLabel = '두뇌 자극형';
      stimDesc = '복잡한 스토리와 반전을 즐깁니다. 미스터리, 스릴러, 범죄 영화를 좋아합니다.';
      stimAttr = 'brain';
    } else if (stimMax === heartPercent) {
      stimLabel = '감성 자극형';
      stimDesc = '감정선이 풍부한 이야기를 좋아합니다. 드라마, 로맨스, 가족 영화에 끌립니다.';
      stimAttr = 'heart';
    } else {
      stimLabel = '액션 자극형';
      stimDesc = '강렬한 액션과 스릴을 즐깁니다. 액션, 공포, 어드벤처 영화를 선호합니다.';
      stimAttr = 'body';
    }

    // Layer 3: 감성 텍스처
    const warmColdTotal = finalScores.texture.warm + finalScores.texture.cold;
    const warmPercent = Math.round((finalScores.texture.warm / warmColdTotal) * 100);
    const coldPercent = 100 - warmPercent;

    const lightHeavyTotal = finalScores.texture.light + finalScores.texture.heavy;
    const lightPercent = Math.round((finalScores.texture.light / lightHeavyTotal) * 100);
    const heavyPercent = 100 - lightPercent;

    return {
      worldview: worldviewResult,
      stimulation: {
        label: stimLabel,
        percentage: stimMax,
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
          percentage: warmPercent > coldPercent ? warmPercent : coldPercent,
          attribute: warmPercent > coldPercent ? 'warm' : 'cold'
        },
        density: {
          label: lightPercent > heavyPercent ? '가벼움' : '무거움',
          percentage: lightPercent > heavyPercent ? lightPercent : heavyPercent,
          attribute: lightPercent > heavyPercent ? 'light' : 'heavy'
        }
      },
      confidence: this.confidence,
      rawScores: this.scores,
      finalScores: finalScores
    };
  }

  /* ============================================
     추천 영화 가져오기
     ============================================ */
  async getRecommendations(page = 1) {
    const profile = this.getProfileAnalysis();

    // 장르 ID 매핑
    const genreMapping = {
      // 세계관
      reality: [99, 36, 18, 80],      // 다큐멘터리, 역사, 드라마, 범죄
      fantasy: [878, 14, 12, 16],      // SF, 판타지, 모험, 애니메이션

      // 자극
      brain: [9648, 53, 80],           // 미스터리, 스릴러, 범죄
      heart: [10749, 18, 10751],       // 로맨스, 드라마, 가족
      body: [28, 27, 12],              // 액션, 공포, 모험

      // 텍스처
      warm: [35, 10751, 16],           // 코미디, 가족, 애니메이션
      cold: [53, 80, 9648],            // 스릴러, 범죄, 미스터리
      light: [35, 10749],              // 코미디, 로맨스
      heavy: [18, 36, 10752]           // 드라마, 역사, 전쟁
    };

    // 최종 장르 조합
    const genres = [
      ...genreMapping[profile.worldview.attribute],
      ...genreMapping[profile.stimulation.attribute],
      ...genreMapping[profile.texture.temperature.attribute].slice(0, 1),
      ...genreMapping[profile.texture.density.attribute].slice(0, 1)
    ];

    // 중복 제거
    const uniqueGenres = [...new Set(genres)];

    console.log('추천 장르:', uniqueGenres);

    try {
      const data = await window.tmdbApi.discoverMovies({
        with_genres: uniqueGenres.slice(0, 3).join(','), // 최대 3개
        sort_by: 'vote_average.desc',
        'vote_count.gte': 1000,
        'vote_average.gte': 7.0,
        page: page
      });

      return data.results;
    } catch (error) {
      console.error('추천 영화 로드 실패:', error);
      return [];
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
