/* ============================================
   VS 게임 데이터 - 3-Layer Deep Dive Logic

   Layer 1: Worldview Analysis (세계관 분석)
   Layer 2: Stimulation Targeting (자극 타겟팅)
   Layer 3: Emotional Texture (감성 텍스처)
   ============================================ */

/**
 * 3-Layer 분석 차원 정의
 */
export const ANALYSIS_LAYERS = {
  // Layer 1: Worldview (세계관)
  WORLDVIEW: {
    REALISM: 'realism',        // 현실주의 (다큐, 역사, 실화)
    FANTASY: 'fantasy'          // 판타지 (SF, 판타지, 초자연)
  },

  // Layer 2: Stimulation (자극 타겟)
  STIMULATION: {
    BRAIN: 'brain',             // 지적 자극 (추리, 미스터리, 복선)
    HEART: 'heart',             // 정서 자극 (드라마, 로맨스, 감동)
    BODY: 'body'                // 본능 자극 (액션, 공포, 스릴러)
  },

  // Layer 3: Emotional Texture (감성 텍스처)
  TEXTURE: {
    TEMPERATURE: {
      WARM: 'warm',             // 따뜻함 (위로, 희망, 유머)
      COLD: 'cold'              // 냉소 (서스펜스, 긴장, 어둠)
    },
    DENSITY: {
      LIGHT: 'light',           // 가벼움 (킬링타임, 오락)
      HEAVY: 'heavy'            // 무거움 (철학, 진중, 사회비판)
    }
  }
};

/**
 * VS 게임 8라운드 설계
 * 각 라운드는 3-Layer 중 하나의 차원을 측정합니다
 */
export const VS_ROUNDS = [
  // === Layer 1: Worldview Analysis (라운드 1-2) ===
  {
    round: 1,
    layer: 'WORLDVIEW',
    theme: '현실 vs 판타지',
    description: '실화 기반 vs 상상의 세계',
    movieA: {
      id: 424,
      title: '쉰들러 리스트',
      attribute: ANALYSIS_LAYERS.WORLDVIEW.REALISM,
      score: 1
    },
    movieB: {
      id: 120,
      title: '반지의 제왕: 반지 원정대',
      attribute: ANALYSIS_LAYERS.WORLDVIEW.FANTASY,
      score: 1
    }
  },
  {
    round: 2,
    layer: 'WORLDVIEW',
    theme: '역사 vs 미래',
    description: '과거의 기록 vs 미래의 상상',
    movieA: {
      id: 72976,
      title: '링컨',
      attribute: ANALYSIS_LAYERS.WORLDVIEW.REALISM,
      score: 1
    },
    movieB: {
      id: 157336,
      title: '인터스텔라',
      attribute: ANALYSIS_LAYERS.WORLDVIEW.FANTASY,
      score: 1
    }
  },

  // === Layer 2: Stimulation Targeting (라운드 3-5) ===
  {
    round: 3,
    layer: 'STIMULATION',
    theme: '추리 vs 액션',
    description: '머리를 쓰는 vs 몸으로 느끼는',
    movieA: {
      id: 680,
      title: '펄프 픽션',
      attribute: ANALYSIS_LAYERS.STIMULATION.BRAIN,
      score: 1
    },
    movieB: {
      id: 245891,
      title: '존 윅',
      attribute: ANALYSIS_LAYERS.STIMULATION.BODY,
      score: 1
    }
  },
  {
    round: 4,
    layer: 'STIMULATION',
    theme: '감동 vs 스릴',
    description: '마음을 울리는 vs 아드레날린',
    movieA: {
      id: 13,
      title: '포레스트 검프',
      attribute: ANALYSIS_LAYERS.STIMULATION.HEART,
      score: 1
    },
    movieB: {
      id: 155,
      title: '다크 나이트',
      attribute: ANALYSIS_LAYERS.STIMULATION.BODY,
      score: 1
    }
  },
  {
    round: 5,
    layer: 'STIMULATION',
    theme: '미스터리 vs 로맨스',
    description: '진실을 찾는 vs 사랑을 찾는',
    movieA: {
      id: 27205,
      title: '인셉션',
      attribute: ANALYSIS_LAYERS.STIMULATION.BRAIN,
      score: 1
    },
    movieB: {
      id: 613,
      title: '비포 선라이즈',
      attribute: ANALYSIS_LAYERS.STIMULATION.HEART,
      score: 1
    }
  },

  // === Layer 3: Emotional Texture - Temperature (라운드 6-7) ===
  {
    round: 6,
    layer: 'TEXTURE_TEMPERATURE',
    theme: '따뜻함 vs 차가움',
    description: '위로와 희망 vs 긴장과 서스펜스',
    movieA: {
      id: 862,
      title: '토이 스토리',
      attribute: ANALYSIS_LAYERS.TEXTURE.TEMPERATURE.WARM,
      score: 1
    },
    movieB: {
      id: 694,
      title: '샤이닝',
      attribute: ANALYSIS_LAYERS.TEXTURE.TEMPERATURE.COLD,
      score: 1
    }
  },
  {
    round: 7,
    layer: 'TEXTURE_TEMPERATURE',
    theme: '유머 vs 어둠',
    description: '웃음과 즐거움 vs 냉소와 긴장',
    movieA: {
      id: 293660,
      title: '데드풀',
      attribute: ANALYSIS_LAYERS.TEXTURE.TEMPERATURE.WARM,
      score: 1
    },
    movieB: {
      id: 807,
      title: '세븐',
      attribute: ANALYSIS_LAYERS.TEXTURE.TEMPERATURE.COLD,
      score: 1
    }
  },

  // === Layer 3: Emotional Texture - Density (라운드 8) ===
  {
    round: 8,
    layer: 'TEXTURE_DENSITY',
    theme: '가벼움 vs 무거움',
    description: '킬링타임 vs 진지한 사색',
    movieA: {
      id: 102899,
      title: '앤트맨',
      attribute: ANALYSIS_LAYERS.TEXTURE.DENSITY.LIGHT,
      score: 1
    },
    movieB: {
      id: 389,
      title: '12 몽키즈',
      attribute: ANALYSIS_LAYERS.TEXTURE.DENSITY.HEAVY,
      score: 1
    }
  }
];

/**
 * 3-Layer 프로필 구조
 */
export const INITIAL_PROFILE = {
  // Layer 1: Worldview
  worldview: {
    realism: 0,
    fantasy: 0
  },

  // Layer 2: Stimulation
  stimulation: {
    brain: 0,
    heart: 0,
    body: 0
  },

  // Layer 3: Texture
  texture: {
    temperature: {
      warm: 0,
      cold: 0
    },
    density: {
      light: 0,
      heavy: 0
    }
  }
};

/**
 * 3-Layer 분석 결과를 TMDB 장르/키워드로 매핑
 */
export const LAYER_TO_TMDB_MAPPING = {
  // Layer 1: Worldview
  worldview: {
    realism: {
      genres: [99, 36, 10752],  // 다큐멘터리, 역사, 전쟁
      keywords: [9715, 10683, 9748],  // based-on-true-story, biography, historical-fiction
      vote_average_gte: 7.0
    },
    fantasy: {
      genres: [878, 14, 16],    // SF, 판타지, 애니메이션
      keywords: [9951, 10150, 9882],  // superhero, magic, alien
      vote_average_gte: 6.5
    }
  },

  // Layer 2: Stimulation
  stimulation: {
    brain: {
      genres: [9648, 53, 80],   // 미스터리, 스릴러, 범죄
      keywords: [10349, 4344, 9748],  // detective, mystery, plot-twist
      vote_average_gte: 7.0
    },
    heart: {
      genres: [18, 10749, 10751],  // 드라마, 로맨스, 가족
      keywords: [9840, 10683, 9840],  // emotional, relationship, love
      vote_average_gte: 7.0
    },
    body: {
      genres: [28, 27, 12],     // 액션, 공포, 모험
      keywords: [9951, 10090, 6152],  // action, chase, fight
      vote_average_gte: 6.5
    }
  },

  // Layer 3: Texture Temperature
  texture_temperature: {
    warm: {
      genres: [35, 10751, 16],  // 코미디, 가족, 애니메이션
      keywords: [9840, 10683],  // heartwarming, uplifting
      vote_average_gte: 6.5
    },
    cold: {
      genres: [53, 27, 9648],   // 스릴러, 공포, 미스터리
      keywords: [4344, 10349],  // suspense, dark
      vote_average_gte: 6.8
    }
  },

  // Layer 3: Texture Density
  texture_density: {
    light: {
      genres: [35, 28, 12],     // 코미디, 액션, 모험
      vote_average_gte: 6.0,
      vote_count_gte: 1000
    },
    heavy: {
      genres: [18, 36, 99],     // 드라마, 역사, 다큐멘터리
      vote_average_gte: 7.5,
      vote_count_gte: 500
    }
  }
};

/**
 * 프로필 분석 결과 레이블
 */
export const PROFILE_LABELS = {
  worldview: {
    realism: '현실주의',
    fantasy: '판타지'
  },
  stimulation: {
    brain: '지적 자극 (추리/미스터리)',
    heart: '정서 자극 (드라마/감동)',
    body: '본능 자극 (액션/스릴)'
  },
  texture: {
    temperature: {
      warm: '따뜻하고 밝은',
      cold: '차갑고 긴장감 있는'
    },
    density: {
      light: '가볍고 재미있는',
      heavy: '무겁고 진중한'
    }
  }
};
