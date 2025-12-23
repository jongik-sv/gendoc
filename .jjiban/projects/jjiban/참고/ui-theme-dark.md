# jjiban Dark Theme - UI/UX 적용 가이드

> **Source**: https://claude.com/pricing#api
> **Theme Type**: Dark Mode (Light → Dark 변환)
> **Target Stack**: Nuxt 3 + Vue 3 + PrimeVue 4.x + TailwindCSS 3.4.x
> **Analysis Date**: 2025-12-12

---

## 1. 디자인 시스템 개요

### 1.1 원본 디자인 특징 (Claude.com)

Claude.com은 **따뜻하고 자연스러운 색상 팔레트**를 사용하는 것이 특징입니다:

| 특징 | 설명 |
|------|------|
| **Primary Color** | Clay/Terracotta (`#d97757`) - 따뜻한 테라코타 계열 |
| **Background** | Warm Gray 계열 (`#faf9f5`) - 순수 흰색이 아닌 따뜻한 회색 |
| **Typography** | Anthropic Sans (본문), Anthropic Serif (제목) |
| **Border Radius** | 둥근 모서리 (카드: 24px, 버튼: 4px, 탭: 12px) |
| **Shadows** | 부드러운 그림자, 높은 대비 없음 |

### 1.2 Dark Mode 변환 원칙

라이트 모드의 색상을 단순히 반전하지 않고, **명도 스케일을 역전**시켜 자연스러운 다크 모드를 구현했습니다:

```
Light Mode Gray Scale:  #faf9f5 (밝음) → #141413 (어두움)
Dark Mode Gray Scale:   #0a0a09 (어두움) → #9c9a92 (밝음)
```

---

## 2. 색상 시스템

### 2.1 Surface Colors (배경)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `surface.0` | `#0a0a09` | 최하단 배경 (body) |
| `surface.50` | `#141413` | 기본 배경 |
| `surface.100` | `#1a1918` | 카드 배경 |
| `surface.200` | `#262624` | 호버 상태, 구분선 |
| `surface.300` | `#30302e` | 비활성 요소 |
| `surface.400` | `#3d3d3a` | 테두리 |

### 2.2 Text Colors

| 토큰 | Hex | 용도 |
|------|-----|------|
| `text.color` | `#f5f4ed` | 기본 텍스트 |
| `text.secondary` | `#9c9a92` | 보조 텍스트 |
| `text.muted` | `#73726c` | 비활성 텍스트, 플레이스홀더 |
| `text.inverse` | `#141413` | 밝은 배경 위 텍스트 |

### 2.3 Primary/Accent Colors (Clay)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `primary.500` | `#d97757` | 주요 액센트 |
| `primary.400` | `#e8936f` | 호버 상태 |
| `primary.600` | `#c96442` | 액티브 상태 |

### 2.4 Semantic Colors

| 상태 | Background | Text |
|------|------------|------|
| Success | `#166534` | `#22c55e` |
| Warning | `#92400e` | `#f59e0b` |
| Error | `#991b1b` | `#ef4444` |
| Info | `#1d4ed8` | `#3b82f6` |

### 2.5 WBS 계층 색상 (프로젝트 고유)

| 계층 | Hex | 용도 |
|------|-----|------|
| Project | `#8b5cf6` | 프로젝트 아이콘/배지 |
| Work Package | `#3b82f6` | WP 아이콘/배지 |
| Activity | `#22c55e` | Activity 아이콘/배지 |
| Task | `#f59e0b` | Task 아이콘/배지 |

---

## 3. 타이포그래피

### 3.1 Font Family

```css
/* Primary (본문) */
font-family: "Anthropic Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;

/* Secondary (제목) - Claude.com 스타일 */
font-family: "Anthropic Serif", Georgia, "Times New Roman", serif;

/* Monospace (코드) */
font-family: "JetBrains Mono", "Fira Code", Consolas, Monaco, monospace;
```

> **참고**: Anthropic Sans/Serif는 Claude.com 전용 폰트입니다. 프로젝트에서는 시스템 폰트 또는 유사한 대체 폰트를 사용합니다.

### 3.2 Font Scale

| 토큰 | Size | 용도 |
|------|------|------|
| `micro` | 0.625rem (10px) | 매우 작은 레이블 |
| `caption` | 0.75rem (12px) | 캡션, 태그 |
| `body-3` | 0.9375rem (15px) | 작은 본문 |
| `body-2` | 1.0625rem (17px) | 일반 본문 |
| `body-1` | 1.1875rem (19px) | 큰 본문 |
| `h6` | 1rem (16px) | 제목 6 |
| `h5` | 1.25rem (20px) | 제목 5 |
| `h4` | 1.4375rem (23px) | 제목 4 |
| `h3` | 1.75rem (28px) | 제목 3 |
| `h2` | 1.875rem (30px) | 제목 2 |
| `h1` | 2.125rem (34px) | 제목 1 |

---

## 4. 컴포넌트 스타일 가이드

### 4.1 Button

```vue
<!-- Primary Button (Claude.com 스타일: 밝은 배경, 어두운 텍스트) -->
<Button label="Start building" />

<!-- Secondary Button -->
<Button label="Contact sales" severity="secondary" />

<!-- Brand Button (Clay 색상) -->
<Button label="Try Claude" severity="contrast" />

<!-- Outlined Button -->
<Button label="Learn more" outlined />
```

| 속성 | 값 |
|------|-----|
| Border Radius | 0.25rem (4px) |
| Padding | 0.5rem 0.75rem |
| Font Weight | 500 |

### 4.2 Card

```vue
<Card>
  <template #title>Opus 4.5</template>
  <template #subtitle>Most intelligent model</template>
  <template #content>
    <!-- Card content -->
  </template>
</Card>
```

| 속성 | 값 |
|------|-----|
| Background | `#1a1918` (surface.100) |
| Border | `1px solid #262624` |
| Border Radius | 1.5rem (24px) |
| Padding | 2rem |

### 4.3 Tabs (API Pricing 스타일)

```vue
<TabView>
  <TabPanel header="Individual">...</TabPanel>
  <TabPanel header="Team & Enterprise">...</TabPanel>
  <TabPanel header="API">...</TabPanel>
</TabView>
```

| 상태 | Background | Text Color |
|------|------------|------------|
| Default | transparent | `#73726c` |
| Hover | `#262624` | `#9c9a92` |
| Active | `#1a1918` | `#f5f4ed` |

### 4.4 DataTable (가격표 스타일)

```vue
<DataTable :value="models" stripedRows>
  <Column field="name" header="Model" />
  <Column field="input" header="Input" />
  <Column field="output" header="Output" />
</DataTable>
```

| 요소 | Background | Border |
|------|------------|--------|
| Header | `#141413` | `#30302e` |
| Row | `#0a0a09` | `#262624` |
| Row (alt) | `#141413` | `#262624` |
| Row (hover) | `#1a1918` | - |

### 4.5 Tag/Badge

```vue
<!-- Primary -->
<Tag value="Latest" />

<!-- Status Tags -->
<Tag value="Success" severity="success" />
<Tag value="Warning" severity="warn" />
<Tag value="Error" severity="danger" />
<Tag value="Info" severity="info" />

<!-- WBS Hierarchy Tags -->
<Tag value="WP-01" :style="{ background: '#3b82f620', color: '#3b82f6' }" />
```

---

## 5. 적용 방법

### 5.1 PrimeVue 프리셋 적용

**Step 1**: 프리셋 파일 임포트

```typescript
// nuxt.config.ts
import { JjibanDarkPreset } from './.jjiban/jjiban/ui-theme-dark-preset'

export default defineNuxtConfig({
  primevue: {
    options: {
      theme: {
        preset: JjibanDarkPreset,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: {
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities'
          }
        }
      }
    }
  }
})
```

**Step 2**: Dark Mode 클래스 적용

```vue
<!-- app.vue -->
<template>
  <div class="dark-mode">
    <NuxtPage />
  </div>
</template>
```

### 5.2 TailwindCSS 확장 (선택)

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        clay: {
          50: '#fef7f5',
          100: '#fdeee9',
          200: '#fbd5c9',
          300: '#f7b8a3',
          400: '#e8936f',
          500: '#d97757',
          600: '#c96442',
          700: '#a84d32',
          800: '#8a3f2a',
          900: '#723526',
          950: '#3d1a12'
        },
        surface: {
          0: '#0a0a09',
          50: '#141413',
          100: '#1a1918',
          200: '#262624',
          300: '#30302e',
          400: '#3d3d3a',
          500: '#4d4c48',
          600: '#5e5d59',
          700: '#73726c',
          800: '#87867f',
          900: '#9c9a92'
        }
      },
      fontFamily: {
        sans: ['"Anthropic Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['"Anthropic Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco', 'monospace']
      },
      borderRadius: {
        'card': '1.5rem',
        'button': '0.25rem',
        'tab': '0.75rem'
      }
    }
  }
} satisfies Config
```

### 5.3 CSS 변수 직접 사용 (대안)

```css
/* assets/css/theme.css */
:root {
  /* Surface Colors */
  --surface-0: #0a0a09;
  --surface-50: #141413;
  --surface-100: #1a1918;
  --surface-200: #262624;
  --surface-300: #30302e;
  --surface-400: #3d3d3a;

  /* Text Colors */
  --text-color: #f5f4ed;
  --text-secondary: #9c9a92;
  --text-muted: #73726c;

  /* Primary Colors */
  --primary-color: #d97757;
  --primary-hover: #e8936f;
  --primary-active: #c96442;

  /* WBS Colors */
  --wbs-project: #8b5cf6;
  --wbs-wp: #3b82f6;
  --wbs-activity: #22c55e;
  --wbs-task: #f59e0b;
}
```

---

## 6. 산출물 목록

| 파일 | 설명 |
|------|------|
| `ui-theme-dark.json` | 디자인 토큰 (JSON 형식) |
| `ui-theme-dark-preset.ts` | PrimeVue 4.x 프리셋 |
| `ui-theme-dark.md` | 적용 가이드 문서 (현재 파일) |

---

## 7. 참고 사항

### 7.1 폰트 대체

Claude.com의 Anthropic Sans/Serif는 전용 폰트이므로, 다음 대체 폰트를 권장합니다:

| 원본 | 대체 권장 |
|------|----------|
| Anthropic Sans | Inter, Nunito Sans, Source Sans 3 |
| Anthropic Serif | Lora, Merriweather, Source Serif 4 |

### 7.2 접근성

- 모든 텍스트 색상은 WCAG AA 기준 (4.5:1) 충족
- Primary 색상 (`#d97757`)은 배경색과 충분한 대비 확보
- Focus 상태 시 `#d97757` 아웃라인으로 명확한 표시

### 7.3 반응형 고려사항

Claude.com은 clamp()를 사용한 유동적 타이포그래피를 적용합니다:

```css
/* 예: H1 */
font-size: clamp(2.125rem, calc(2.125rem + (3.25 - 2.125) * ((100vw - 20rem) / (90 - 20))), 3.25rem);
```

본 테마에서는 고정 크기를 사용하며, 필요시 위 패턴을 적용할 수 있습니다.

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-12 | 초기 버전 - Claude.com 디자인 추출 및 Dark Mode 변환 |
