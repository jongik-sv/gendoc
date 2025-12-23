# 기술설계: PrimeVue 4.x + TailwindCSS 설정

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-02 |
| Category | infrastructure |
| 상태 | [ds] 설계 |
| 상위 Activity | ACT-01-01 (Project Setup) |
| 상위 Work Package | WP-01 (Platform Infrastructure) |
| PRD 참조 | PRD 10.1 (테마 시스템) |
| 작성일 | 2025-12-13 |

---

## 1. 목적

Nuxt 3 프로젝트에 UI 프레임워크(PrimeVue 4.x)와 유틸리티 CSS(TailwindCSS)를 설정하여 일관된 UI 개발 환경을 구축합니다. PRD 10.1에 정의된 Dark Blue 테마 색상 팔레트를 적용하여 프로젝트 전체에서 통일된 디자인 시스템을 사용할 수 있도록 합니다.

---

## 2. 현재 상태

### 2.1 현재 구조

- TSK-01-01-01에서 Nuxt 3 프로젝트 초기화 완료
- TypeScript 설정 완료
- 기본 nuxt.config.ts 존재
- UI 프레임워크 미설치

### 2.2 문제점

- UI 컴포넌트 라이브러리 없음 → 모든 UI를 직접 구현해야 함
- 스타일링 시스템 없음 → 일관된 디자인 적용 어려움
- 테마 시스템 없음 → Dark Blue 테마 적용 불가

---

## 3. 목표 상태

### 3.1 목표 구조

```
jjiban/
├── nuxt.config.ts          # PrimeVue + TailwindCSS 설정
├── tailwind.config.ts      # TailwindCSS 커스텀 설정
├── assets/
│   └── css/
│       └── main.css        # 글로벌 스타일
├── plugins/
│   └── primevue.ts         # PrimeVue 플러그인
└── app/
    └── primevue/
        └── theme.ts        # PrimeVue 테마 프리셋
```

### 3.2 개선 효과

- PrimeVue 4.x 컴포넌트 즉시 사용 가능
- TailwindCSS 유틸리티 클래스로 빠른 스타일링
- Dark Blue 테마 색상 팔레트 전역 적용
- 일관된 디자인 시스템 구축

---

## 4. 구현 계획

### 4.1 설치 패키지

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `primevue` | 4.x | Vue 3 UI 컴포넌트 라이브러리 |
| `@primevue/themes` | 4.x | PrimeVue 테마 시스템 |
| `@primeuix/themes` | latest | 추가 테마 프리셋 |
| `primeicons` | latest | 아이콘 폰트 |
| `@nuxtjs/tailwindcss` | latest | Nuxt TailwindCSS 모듈 |

### 4.2 변경 사항

| 파일/모듈 | 변경 내용 |
|----------|----------|
| `package.json` | 의존성 추가 |
| `nuxt.config.ts` | 모듈 등록, PrimeVue 설정 |
| `tailwind.config.ts` | Dark Blue 테마 색상, 커스텀 설정 |
| `assets/css/main.css` | 글로벌 스타일, 테마 변수 |
| `plugins/primevue.ts` | PrimeVue 플러그인 설정 (필요시) |

### 4.3 Dark Blue 테마 색상 팔레트 (PRD 10.1)

| 용도 | CSS 변수 | Hex |
|------|----------|-----|
| 배경 (Background) | `--color-bg` | `#1a1a2e` |
| 헤더 (Header) | `--color-header` | `#16213e` |
| 사이드바 (Sidebar) | `--color-sidebar` | `#0f0f23` |
| 카드 배경 (Cards) | `--color-card` | `#1e1e38` |
| 프라이머리 (Primary) | `--color-primary` | `#3b82f6` |
| 성공 (Success) | `--color-success` | `#22c55e` |
| 경고 (Warning) | `--color-warning` | `#f59e0b` |
| 위험 (Danger) | `--color-danger` | `#ef4444` |
| 텍스트 (Primary) | `--color-text` | `#e8e8e8` |
| 텍스트 (Secondary) | `--color-text-secondary` | `#888888` |
| 보더 (Border) | `--color-border` | `#3d3d5c` |

### 4.4 계층 아이콘 색상 (PRD 10.1)

| 계층 | CSS 변수 | Hex |
|------|----------|-----|
| Project | `--color-level-project` | `#8b5cf6` |
| Work Package | `--color-level-wp` | `#3b82f6` |
| Activity | `--color-level-act` | `#22c55e` |
| Task | `--color-level-task` | `#f59e0b` |

---

## 5. 설정 상세

### 5.1 nuxt.config.ts 설정

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module'
  ],
  primevue: {
    options: {
      theme: {
        preset: 'Aura',  // 또는 커스텀 프리셋
        options: {
          darkModeSelector: '.dark'
        }
      },
      ripple: true
    },
    components: {
      include: '*'  // 모든 컴포넌트 자동 임포트
    }
  },
  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css'
  ]
})
```

### 5.2 tailwind.config.ts 설정

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark Blue 테마
        bg: {
          DEFAULT: '#1a1a2e',
          header: '#16213e',
          sidebar: '#0f0f23',
          card: '#1e1e38'
        },
        // 시맨틱 컬러
        primary: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          // ... 기타 셰이드
        },
        // 계층 색상
        level: {
          project: '#8b5cf6',
          wp: '#3b82f6',
          act: '#22c55e',
          task: '#f59e0b'
        },
        // 상태 색상
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        // 텍스트
        text: {
          DEFAULT: '#e8e8e8',
          secondary: '#888888'
        },
        // 보더
        border: '#3d3d5c'
      }
    }
  },
  plugins: []
} satisfies Config
```

### 5.3 main.css 글로벌 스타일

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Dark Blue 테마 기본 적용 */
:root {
  --color-bg: #1a1a2e;
  --color-header: #16213e;
  --color-sidebar: #0f0f23;
  --color-card: #1e1e38;
  --color-primary: #3b82f6;
  --color-border: #3d3d5c;
}

body {
  @apply bg-bg text-text;
}
```

---

## 6. 검증 방법

### 6.1 설치 확인

- [ ] `npm run dev` 정상 실행
- [ ] PrimeVue 컴포넌트 렌더링 확인 (예: Button)
- [ ] TailwindCSS 유틸리티 클래스 적용 확인

### 6.2 테마 확인

- [ ] Dark Blue 배경색 적용 확인
- [ ] 텍스트 색상 적용 확인
- [ ] PrimeVue 컴포넌트 테마 통합 확인

---

## 7. 의존성

| 선행 Task | 설명 |
|-----------|------|
| TSK-01-01-01 | Nuxt 3 프로젝트 초기화 (완료) |

---

## 8. 다음 단계

- `/wf:skip` 또는 `/wf:build` 명령어로 구현 단계 진행

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 10.1)
- Nuxt 3 문서: https://nuxt.com
- PrimeVue 4 문서: https://primevue.org
- TailwindCSS 문서: https://tailwindcss.com
