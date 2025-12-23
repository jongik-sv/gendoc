# 구현 보고서: PrimeVue 4.x + TailwindCSS 설정

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-02 |
| Category | infrastructure |
| 상태 | [im] 구현 |
| 참조 설계서 | `010-tech-design.md` |
| 구현 기간 | 2025-12-13 |
| 상위 Activity | ACT-01-01 (Project Setup) |
| 상위 Work Package | WP-01 (Platform Infrastructure) |

---

## 1. 구현 개요

### 1.1 목적

Nuxt 3 프로젝트에 PrimeVue 4.x와 TailwindCSS를 설정하여 일관된 UI 개발 환경을 구축하고, PRD 10.1에 정의된 Dark Blue 테마 색상 팔레트를 적용했습니다.

### 1.2 구현 범위

- PrimeVue 4.x 설치 및 Nuxt 모듈 설정
- TailwindCSS 설치 및 커스텀 설정
- Dark Blue 테마 색상 팔레트 적용
- CSS Layer 통합 (PrimeVue + TailwindCSS)
- 유틸리티 CSS 클래스 정의 (배지, 태그 등)

### 1.3 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| PrimeVue | 4.x | Vue 3 UI 컴포넌트 라이브러리 |
| @primevue/themes | 4.x | Aura 테마 프리셋 |
| @primevue/nuxt-module | latest | Nuxt 자동 통합 |
| primeicons | latest | 아이콘 폰트 |
| @nuxtjs/tailwindcss | latest | Nuxt TailwindCSS 모듈 |

---

## 2. 구현 결과

### 2.1 설치된 패키지

```bash
npm install primevue @primevue/themes primeicons @primevue/nuxt-module @nuxtjs/tailwindcss
```

**package.json 의존성 추가**:
- `primevue`: ^4.x
- `@primevue/themes`: ^4.x
- `@primevue/nuxt-module`: ^4.x
- `primeicons`: ^7.x
- `@nuxtjs/tailwindcss`: ^6.x

### 2.2 생성/수정된 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `nuxt.config.ts` | 수정 | 모듈 등록, PrimeVue 설정 추가 |
| `tailwind.config.ts` | 생성 | Dark Blue 테마 색상, 커스텀 설정 |
| `app/assets/css/main.css` | 생성 | 글로벌 스타일, CSS 변수, 유틸리티 클래스 |
| `app/app.vue` | 수정 | .dark 클래스 추가 |
| `app/pages/index.vue` | 수정 | 테마 검증용 샘플 페이지 |

### 2.3 nuxt.config.ts 설정

```typescript
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module'
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities'
          }
        }
      },
      ripple: true
    }
  },
  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css'
  ]
})
```

### 2.4 Dark Blue 테마 색상 (PRD 10.1)

| 용도 | TailwindCSS 클래스 | Hex |
|------|-------------------|-----|
| 배경 | `bg-bg` | `#1a1a2e` |
| 헤더 | `bg-bg-header` | `#16213e` |
| 사이드바 | `bg-bg-sidebar` | `#0f0f23` |
| 카드 | `bg-bg-card` | `#1e1e38` |
| Primary | `bg-primary` | `#3b82f6` |
| Success | `bg-success` | `#22c55e` |
| Warning | `bg-warning` | `#f59e0b` |
| Danger | `bg-danger` | `#ef4444` |
| 텍스트 | `text-text` | `#e8e8e8` |
| 보더 | `border-border` | `#3d3d5c` |

### 2.5 계층 색상 (PRD 10.1)

| 계층 | TailwindCSS 클래스 | Hex |
|------|-------------------|-----|
| Project | `level-badge-project` | `#8b5cf6` |
| Work Package | `level-badge-wp` | `#3b82f6` |
| Activity | `level-badge-act` | `#22c55e` |
| Task | `level-badge-task` | `#f59e0b` |

---

## 3. 유틸리티 클래스

### 3.1 카드 스타일

```css
.card {
  @apply bg-bg-card border border-border rounded-xl p-4 shadow-card;
}
.card-hover {
  @apply hover:shadow-card-hover hover:border-border-light transition-all duration-200;
}
```

### 3.2 레벨 배지

```css
.level-badge { @apply inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold text-white; }
.level-badge-project { @apply bg-level-project; }
.level-badge-wp { @apply bg-level-wp; }
.level-badge-act { @apply bg-level-act; }
.level-badge-task { @apply bg-level-task; }
```

### 3.3 상태 배지

```css
.status-badge { @apply inline-flex items-center px-2 py-0.5 rounded text-xs font-medium; }
.status-todo { @apply bg-text-muted/20 text-text-secondary; }
.status-design { @apply bg-primary/20 text-primary; }
.status-implement { @apply bg-warning/20 text-warning; }
.status-verify { @apply bg-success/20 text-success; }
.status-done { @apply bg-success text-white; }
```

### 3.4 카테고리 태그

```css
.category-tag { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.category-dev { @apply bg-primary/20 text-primary border border-primary/30; }
.category-defect { @apply bg-danger/20 text-danger border border-danger/30; }
.category-infra { @apply bg-level-project/20 text-level-project border border-level-project/30; }
```

---

## 4. 검증 결과

### 4.1 설치 검증

- [x] `npm run dev` 정상 실행 (포트 3001)
- [x] Nuxt 3.20.2 + Nitro 2.12.9 + Vite 7.2.7 정상 동작
- [x] TailwindCSS 모듈 정상 로드
- [x] PrimeVue Aura 테마 적용

### 4.2 컴포넌트 검증

- [x] PrimeVue Button 렌더링 확인
- [x] PrimeVue InputText 렌더링 확인
- [x] PrimeVue Checkbox 렌더링 확인
- [x] PrimeVue InputSwitch 렌더링 확인
- [x] PrimeIcons 아이콘 표시 확인

### 4.3 테마 검증

- [x] Dark Blue 배경색 적용 확인
- [x] 텍스트 색상 적용 확인
- [x] 계층 아이콘 색상 적용 확인
- [x] 상태 배지 색상 적용 확인
- [x] 카테고리 태그 색상 적용 확인

### 4.4 CSS Layer 통합

- [x] TailwindCSS와 PrimeVue 스타일 충돌 없음
- [x] CSS Layer 순서 정상 적용 (tailwind-base → primevue → tailwind-utilities)

---

## 5. 기술적 결정사항

### 5.1 CSS Layer 전략

PrimeVue 4.x와 TailwindCSS 통합 시 스타일 충돌을 방지하기 위해 CSS Layer를 사용했습니다.

```css
@layer tailwind-base, primevue, tailwind-utilities;
```

이 순서로 Layer를 정의하면 TailwindCSS 유틸리티 클래스가 PrimeVue 스타일보다 높은 우선순위를 가집니다.

### 5.2 Dark 모드 전략

`.dark` 클래스를 최상위 컨테이너에 적용하여 다크 모드를 활성화합니다. PrimeVue의 `darkModeSelector: '.dark'` 옵션과 연동됩니다.

### 5.3 Aura 테마 선택

PrimeVue 4.x의 기본 테마인 Aura를 사용했습니다. 모던한 디자인과 다크 모드 지원이 우수합니다.

---

## 6. 알려진 이슈

### 6.1 이슈 목록

| # | 이슈 | 심각도 | 상태 |
|---|------|--------|------|
| 1 | WebSocket 포트 24678 충돌 경고 | Low | 무시 가능 |

### 6.2 제약사항

- 현재 다크 모드만 지원 (라이트 모드 전환 기능 미구현)
- 폰트 파일 (Inter, JetBrains Mono) 외부 CDN 또는 별도 설치 필요

---

## 7. 구현 완료 체크리스트

- [x] PrimeVue 4.x 설치 및 Nuxt 모듈 설정
- [x] TailwindCSS 설치 및 커스텀 설정
- [x] Dark Blue 테마 색상 팔레트 적용
- [x] CSS Layer 통합 설정
- [x] 유틸리티 클래스 정의
- [x] 개발 서버 정상 실행 확인
- [x] PrimeVue 컴포넌트 렌더링 확인

---

## 8. 참고 자료

### 8.1 관련 문서

- 기술설계서: `.jjiban/projects/jjiban/tasks/TSK-01-01-02/010-tech-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 10.1)

### 8.2 소스 파일 위치

| 파일 | 경로 |
|------|------|
| Nuxt 설정 | `nuxt.config.ts` |
| TailwindCSS 설정 | `tailwind.config.ts` |
| 글로벌 CSS | `app/assets/css/main.css` |
| App 컴포넌트 | `app/app.vue` |
| 테스트 페이지 | `app/pages/index.vue` |

### 8.3 외부 문서

- [PrimeVue 4.x 문서](https://primevue.org)
- [TailwindCSS 문서](https://tailwindcss.com)
- [Nuxt 3 문서](https://nuxt.com)

---

## 9. 다음 단계

- `/wf:done TSK-01-01-02` - 작업 완료 (infrastructure는 verify 단계 생략)
