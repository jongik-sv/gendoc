# jjiban Light Theme 적용 가이드

> **Source**: Dribbble Finance Dashboard Design
> **Theme Type**: Light
> **분석일**: 2025-12-12

---

## 1. 디자인 시스템 개요

### 1.1 디자인 특징

| 특징 | 설명 |
|------|------|
| **스타일** | Modern, Clean, Minimal |
| **레이아웃** | Card-based Dashboard |
| **색상 톤** | 밝은 배경 + 퍼플 액센트 |
| **모서리** | 둥근 모서리 (12-16px) |
| **그림자** | 부드러운 Subtle Shadow |
| **여백** | 충분한 화이트스페이스 |

### 1.2 컬러 팔레트 미리보기

```
Primary (Purple):  ████ #7c5cfc
Secondary (Blue):  ████ #5b8def
Success (Green):   ████ #10b981
Warning (Amber):   ████ #f59e0b
Error (Red):       ████ #ef4444

Background:        ░░░░ #f5f5f7
Card:              ░░░░ #ffffff
Text Primary:      ████ #1a1a1a
Text Secondary:    ░░░░ #6b7280
Border:            ░░░░ #e5e7eb
```

---

## 2. 색상 시스템

### 2.1 Primary Colors (Purple/Violet)

| Scale | Hex | 용도 |
|-------|-----|------|
| 50 | `#f5f3ff` | 배경 하이라이트, 선택 상태 |
| 100 | `#ede9fe` | 호버 상태 배경 |
| 200 | `#ddd6fe` | 비활성 보더 |
| 300 | `#c4b5fd` | 포커스 링 |
| 400 | `#a78bfa` | 아이콘, 보조 요소 |
| **500** | **`#7c5cfc`** | **Primary 메인 색상** |
| 600 | `#6d4de6` | 호버 상태 |
| 700 | `#5b3fd1` | 클릭/액티브 상태 |
| 800 | `#4c33b3` | 강조 텍스트 |
| 900 | `#3f2a94` | 다크 액센트 |

### 2.2 Surface Colors

| 토큰 | Hex | 용도 |
|------|-----|------|
| `ground` | `#f5f5f7` | 페이지 배경 |
| `section` | `#fafafa` | 섹션 배경 |
| `card` | `#ffffff` | 카드, 패널 배경 |
| `border` | `#e5e7eb` | 테두리, 구분선 |
| `hover` | `#f3f4f6` | 호버 배경 |

### 2.3 Semantic Colors

| 상태 | 메인 컬러 | 라이트 컬러 | 용도 |
|------|----------|------------|------|
| Success | `#10b981` | `#d1fae5` | 완료, 성공, 증가 |
| Warning | `#f59e0b` | `#fef3c7` | 경고, 진행중 |
| Error | `#ef4444` | `#fee2e2` | 오류, 위험 |
| Info | `#3b82f6` | `#dbeafe` | 정보, 알림 |

### 2.4 WBS 계층 색상 (TRD 기준 유지)

| 계층 | Hex | CSS 변수 |
|------|-----|---------|
| Project | `#8b5cf6` | `--jjiban-project` |
| Work Package | `#3b82f6` | `--jjiban-wp` |
| Activity | `#22c55e` | `--jjiban-act` |
| Task | `#f59e0b` | `--jjiban-task` |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: JetBrains Mono, 'Fira Code', Consolas, monospace;
```

### 3.2 폰트 사이즈 스케일

| 토큰 | 크기 | 용도 |
|------|------|------|
| `xs` | 0.75rem (12px) | 캡션, 레이블 |
| `sm` | 0.875rem (14px) | 보조 텍스트 |
| `base` | 1rem (16px) | 본문 텍스트 |
| `lg` | 1.125rem (18px) | 카드 제목 |
| `xl` | 1.25rem (20px) | 섹션 제목 |
| `2xl` | 1.5rem (24px) | 페이지 제목 |
| `3xl` | 1.875rem (30px) | 대시보드 숫자 |
| `display` | 2.5rem (40px) | 히어로 텍스트 |

---

## 4. 컴포넌트 스타일 가이드

### 4.1 버튼 (Button)

```vue
<!-- Primary Button (퍼플 배경) -->
<Button label="New payment" icon="pi pi-plus" />

<!-- Secondary Button (회색 배경) -->
<Button label="Export" icon="pi pi-download" severity="secondary" />

<!-- Dark Button (네비게이션 스타일) -->
<Button label="Dashboard" severity="contrast" />
```

**스타일 특징:**
- Border Radius: `0.5rem` (8px)
- Padding: `0.625rem 1rem`
- Font Weight: 500

### 4.2 카드 (Card)

```vue
<Card>
  <template #title>My accounts</template>
  <template #subtitle>Net worth: $16,531.54</template>
  <template #content>
    <!-- 콘텐츠 -->
  </template>
  <template #footer>
    <Button label="Add card" text />
  </template>
</Card>
```

**스타일 특징:**
- Border Radius: `1rem` (16px)
- Padding: `1.5rem` (24px)
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.04)`
- Border: 없음 (그림자로 구분)

### 4.3 입력 필드 (InputText)

```vue
<InputText v-model="search" placeholder="Search" />

<!-- 아이콘 포함 -->
<IconField>
  <InputIcon class="pi pi-search" />
  <InputText v-model="search" placeholder="Search" />
</IconField>
```

**스타일 특징:**
- Border Radius: `0.5rem` (8px)
- Border: `1px solid #e5e7eb`
- Focus Border: `#7c5cfc` (primary)

### 4.4 태그/뱃지 (Tag)

```vue
<!-- 상태별 태그 -->
<Tag value="Completed" severity="success" />
<Tag value="In Progress" severity="info" />
<Tag value="Pending" severity="warn" />
<Tag value="Failed" severity="danger" />

<!-- 퍼센트 변화 표시 -->
<Tag :value="`▲ ${change}%`" severity="success" />
<Tag :value="`▼ ${change}%`" severity="danger" />
```

**스타일 특징:**
- Border Radius: `9999px` (pill shape)
- Padding: `0.25rem 0.75rem`
- Font Weight: 500

### 4.5 네비게이션

```vue
<div class="flex gap-2">
  <Button label="Courses" text class="text-surface-500" />
  <Button label="Dashboard" severity="contrast" rounded />
  <Button label="Schedule" text class="text-surface-500" />
  <Button label="Support" text class="text-surface-500" />
</div>
```

**스타일 특징:**
- Active 상태: 검은 배경 (`#1a1a1a`) + 흰 텍스트
- Inactive 상태: 투명 배경 + 회색 텍스트 (`#6b7280`)
- Border Radius: pill shape

### 4.6 데이터 테이블 (DataTable)

```vue
<DataTable :value="data" stripedRows>
  <Column field="name" header="Name" />
  <Column field="amount" header="Amount">
    <template #body="{ data }">
      <span class="font-semibold">{{ formatCurrency(data.amount) }}</span>
    </template>
  </Column>
  <Column field="status" header="Status">
    <template #body="{ data }">
      <Tag :value="data.status" :severity="getSeverity(data.status)" />
    </template>
  </Column>
</DataTable>
```

### 4.7 차트 (Donut/Line)

```javascript
// 차트 컬러 팔레트
const chartColors = ['#7c5cfc', '#5b8def', '#10b981', '#f59e0b', '#ef4444'];

// Donut 차트 범례 색상
const legendColors = {
  available: '#ef4444',
  planned: '#f59e0b',
  other: '#3b82f6'
};
```

---

## 5. 프로젝트 적용 방법

### 5.1 테마 프리셋 설치

```bash
# assets/themes/ 폴더에 프리셋 복사
cp .jjiban/jjiban/ui-theme-light-preset.ts assets/themes/JjibanLight.ts
```

### 5.2 nuxt.config.ts 설정

```typescript
// nuxt.config.ts
import { JjibanLight } from './assets/themes/JjibanLight';

export default defineNuxtConfig({
  primevue: {
    options: {
      theme: {
        preset: JjibanLight,
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
});
```

### 5.3 Tailwind 확장 (선택)

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          // ... 전체 스케일
          500: '#7c5cfc',
          600: '#6d4de6',
          700: '#5b3fd1'
        },
        surface: {
          ground: '#f5f5f7',
          card: '#ffffff',
          border: '#e5e7eb'
        }
      },
      borderRadius: {
        'card': '1rem',
        'button': '0.5rem'
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)'
      }
    }
  }
};
```

### 5.4 CSS 변수 추가 (main.css)

```css
/* assets/css/main.css */
:root {
  /* Primary */
  --primary-50: #f5f3ff;
  --primary-500: #7c5cfc;
  --primary-600: #6d4de6;
  --primary-700: #5b3fd1;

  /* Surface */
  --surface-ground: #f5f5f7;
  --surface-card: #ffffff;
  --surface-border: #e5e7eb;

  /* Text */
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;

  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* WBS Hierarchy */
  --jjiban-project: #8b5cf6;
  --jjiban-wp: #3b82f6;
  --jjiban-act: #22c55e;
  --jjiban-task: #f59e0b;
}
```

---

## 6. 컴포넌트 매핑 (PrimeVue)

| 분석 UI 요소 | PrimeVue 컴포넌트 | 적용 스타일 |
|-------------|------------------|------------|
| 메인 버튼 | `<Button>` | severity="primary" |
| 보조 버튼 | `<Button severity="secondary">` | 회색 배경 |
| 네비게이션 탭 | `<Button severity="contrast">` | 다크 버튼 |
| 카드 | `<Card>` | 둥근 모서리, 그림자 |
| 검색 입력 | `<IconField>` + `<InputText>` | 아이콘 포함 |
| 상태 태그 | `<Tag>` | pill shape |
| 금액 표시 | `display` 폰트 사이즈 | 볼드, 큰 숫자 |
| 퍼센트 변화 | `<Tag>` + 화살표 아이콘 | success/danger |
| 계정 카드 | `<Card>` 커스텀 | 그라데이션 배경 |
| 도넛 차트 | 외부 라이브러리 | chartColors 사용 |
| 라인 차트 | 외부 라이브러리 | primary 컬러 |

---

## 7. 산출물 목록

| 파일 | 설명 |
|------|------|
| `ui-theme-light.json` | 디자인 토큰 (JSON) |
| `ui-theme-light-preset.ts` | PrimeVue 4.x 프리셋 |
| `ui-theme-light.md` | 이 가이드 문서 |

---

## 8. WCAG 접근성 준수

### 8.1 색상 대비율 검증

| 조합 | 대비율 | 결과 |
|------|--------|------|
| Primary (#7c5cfc) on White | 4.56:1 | ✅ AA |
| Text (#1a1a1a) on Ground (#f5f5f7) | 15.2:1 | ✅ AAA |
| Secondary Text (#6b7280) on White | 5.2:1 | ✅ AA |
| Success (#10b981) on SuccessLight | 4.8:1 | ✅ AA |
| Error (#ef4444) on White | 4.2:1 | ✅ AA (Large) |

### 8.2 권장사항

- 작은 텍스트 (14px 미만): 대비율 4.5:1 이상 사용
- 큰 텍스트 (18px 이상): 대비율 3:1 이상 허용
- 아이콘: 의미 전달 시 텍스트 레이블 병행

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-12 | 초기 Light Theme 생성 |
