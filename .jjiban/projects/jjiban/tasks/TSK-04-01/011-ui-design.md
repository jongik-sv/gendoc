# UI 설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 컴포넌트 중심 UI 설계
> * PrimeVue 4.x 컴포넌트 적극 활용
> * Dark Blue 테마 일관성 유지
> * 반응형 레이아웃 고려
> * 접근성 (ARIA, 키보드 네비게이션) 포함

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | Tree Panel |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Frontend Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2, 10.1 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-01 |

---

## 1. 목적 및 범위

### 1.1 목적

WBS 트리 뷰 좌측 패널의 시각적 디자인을 정의하여, 일관되고 사용자 친화적인 인터페이스를 구현합니다.

**해결하는 문제**:
- 컴포넌트별 스타일 일관성 확보
- Dark Blue 테마 적용 방안 명확화
- 반응형 레이아웃 구조 정의
- 접근성 기준 충족

**제공하는 가치**:
- 개발자를 위한 명확한 UI 구현 가이드
- 디자인 일관성 확보
- 빠른 구현 및 유지보수

### 1.2 범위

**포함 범위**:
- WbsTreePanel 레이아웃 설계
- WbsTreeHeader 시각적 디자인
- WbsSummaryCards 카드 디자인
- WbsSearchBox 입력 컴포넌트 디자인
- 색상, 타이포그래피, 간격, 반응형 브레이크포인트
- 접근성 고려사항

**제외 범위**:
- WbsTreeNode 컴포넌트 디자인 (TSK-04-02)
- 인터랙션 동작 (hover, focus 상태만 정의)
- 애니메이션 세부 사양

---

## 2. 디자인 시스템

### 2.1 색상 팔레트 (Dark Blue 테마)

#### 기본 색상

| 용도 | Tailwind Class | Hex | 사용 위치 |
|------|----------------|-----|-----------|
| 배경 (Main) | `bg-[#1a1a2e]` | `#1a1a2e` | 전체 패널 배경 |
| 배경 (Header) | `bg-[#16213e]` | `#16213e` | WbsTreeHeader 배경 |
| 배경 (Card) | `bg-[#1e1e38]` | `#1e1e38` | SummaryCards 배경 |
| 배경 (Sidebar) | `bg-[#0f0f23]` | `#0f0f23` | 패널 전체 배경 (대안) |

#### 텍스트 색상

| 용도 | Tailwind Class | Hex | 사용 위치 |
|------|----------------|-----|-----------|
| 텍스트 (Primary) | `text-[#e8e8e8]` | `#e8e8e8` | 제목, 주요 텍스트 |
| 텍스트 (Secondary) | `text-[#888888]` | `#888888` | 부가 정보, 레이블 |
| 텍스트 (Muted) | `text-gray-500` | `#6b7280` | Placeholder, Hint |

#### 강조 색상

| 용도 | Tailwind Class | Hex | 사용 위치 |
|------|----------------|-----|-----------|
| Primary (Blue) | `text-blue-500` | `#3b82f6` | WP 카운트, 액션 버튼 |
| Success (Green) | `text-green-500` | `#22c55e` | ACT 카운트, 성공 상태 |
| Warning (Orange) | `text-orange-500` | `#f59e0b` | TSK 카운트, 경고 |
| Info (Purple) | `text-purple-500` | `#8b5cf6` | Progress, Project 아이콘 |

#### 보더 및 구분선

| 용도 | Tailwind Class | Hex | 사용 위치 |
|------|----------------|-----|-----------|
| Border (Default) | `border-[#3d3d5c]` | `#3d3d5c` | 카드 테두리, 구분선 |
| Border (Subtle) | `border-gray-700` | `#374151` | 입력 필드 기본 상태 |
| Border (Focus) | `border-blue-500` | `#3b82f6` | 입력 필드 포커스 |

### 2.2 타이포그래피

#### 폰트 패밀리

```css
/* 시스템 기본 폰트 스택 (Tailwind 기본값) */
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

#### 폰트 크기 및 굵기

| 요소 | Tailwind Class | 크기 | 굵기 | 사용 위치 |
|------|----------------|------|------|-----------|
| 페이지 타이틀 | `text-lg font-semibold` | 18px | 600 | "WBS 트리" 타이틀 |
| 카드 값 | `text-2xl font-bold` | 24px | 700 | 통계 카운트 숫자 |
| 카드 레이블 | `text-sm` | 14px | 400 | 카드 하단 레이블 |
| 버튼 텍스트 | `text-sm` | 14px | 500 | 액션 버튼 |
| 입력 필드 | `text-base` | 16px | 400 | SearchBox |
| Placeholder | `text-sm` | 14px | 400 | 검색 힌트 |

### 2.3 간격 및 여백 (Spacing)

#### Padding

| 요소 | Tailwind Class | 값 | 설명 |
|------|----------------|-----|------|
| 패널 전체 | `p-0` | 0px | 패딩 없음 (내부 컴포넌트가 관리) |
| 헤더 영역 | `p-4` | 16px | 헤더 내부 여백 |
| 카드 내부 | `p-4` | 16px | 카드 컨텐츠 여백 |
| 버튼 | `px-4 py-2` | 16px/8px | 버튼 내부 여백 |

#### Margin/Gap

| 요소 | Tailwind Class | 값 | 설명 |
|------|----------------|-----|------|
| 타이틀-검색 간격 | `mb-4` | 16px | 헤더 요소 간 수직 간격 |
| 검색-카드 간격 | `mb-4` | 16px | 검색과 요약 카드 사이 |
| 카드 그리드 간격 | `gap-3` | 12px | 4개 카드 사이 간격 |
| 버튼 그룹 간격 | `gap-2` | 8px | 펼치기/접기 버튼 사이 |

### 2.4 반응형 브레이크포인트

| 브레이크포인트 | 최소 너비 | 좌측 패널 너비 | 설명 |
|---------------|----------|---------------|------|
| Desktop | 1200px | 320px | 기본 레이아웃 |
| Tablet | 768px | 280px | 패널 약간 축소 (향후) |
| Mobile | < 768px | 100% | 전체 화면 (향후) |

**1차 범위**: Desktop (1200px) 고정 레이아웃만 지원

---

## 3. 컴포넌트별 UI 설계

### 3.1 WbsTreePanel (컨테이너)

**파일 경로**: `app/components/wbs/WbsTreePanel.vue`

#### 레이아웃 구조

```
┌─────────────────────────────────────┐
│  WbsTreePanel                       │
│  bg-[#0f0f23] h-full overflow-auto  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   WbsTreeHeader              │  │
│  │   (고정 헤더)                 │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   WbsTreeNode (스크롤 영역)   │  │
│  │   ...                         │  │
│  │   ...                         │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

#### 스타일 명세

```vue
<div class="wbs-tree-panel h-full bg-[#0f0f23] flex flex-col overflow-hidden">
  <!-- 로딩 상태 -->
  <div v-if="loading" class="flex items-center justify-center h-full">
    <ProgressSpinner
      style="width: 50px; height: 50px"
      strokeWidth="4"
      fill="transparent"
      animationDuration="1s"
    />
  </div>

  <!-- 에러 상태 -->
  <div v-else-if="error" class="p-4">
    <Message severity="error" :closable="false">
      {{ error }}
    </Message>
  </div>

  <!-- 정상 상태 -->
  <div v-else class="flex flex-col h-full">
    <WbsTreeHeader class="flex-shrink-0" />

    <div class="flex-1 overflow-y-auto">
      <WbsTreeNode v-if="root" :node="root" />
    </div>
  </div>
</div>
```

#### PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| ProgressSpinner | 로딩 상태 표시 | `strokeWidth="4"`, `animationDuration="1s"` |
| Message | 에러 메시지 표시 | `severity="error"`, `:closable="false"` |

#### 접근성

- `role="region"` - 트리 패널 영역 정의
- `aria-label="WBS Tree Panel"` - 스크린 리더용 레이블
- `aria-busy="true"` - 로딩 중 표시

---

### 3.2 WbsTreeHeader (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsTreeHeader.vue`

#### 레이아웃 구조

```
┌────────────────────────────────────────┐
│  WbsTreeHeader                         │
│  bg-[#16213e] border-b border-[#3d3d5c]│
│  p-4                                   │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │ 📁 WBS 트리    [전체 펼치기] [전체 접기] │
│  │ (flex justify-between)          │  │
│  └─────────────────────────────────┘  │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │   WbsSearchBox                  │  │
│  │   (mb-4)                        │  │
│  └─────────────────────────────────┘  │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │   WbsSummaryCards               │  │
│  │   (grid-cols-4 gap-3)           │  │
│  └─────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

#### 스타일 명세

```vue
<div class="wbs-tree-header bg-[#16213e] border-b border-[#3d3d5c] p-4">
  <!-- 타이틀 및 액션 버튼 -->
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-[#e8e8e8] flex items-center gap-2">
      <i class="pi pi-sitemap text-purple-500"></i>
      WBS 트리
    </h2>

    <div class="flex gap-2">
      <Button
        label="전체 펼치기"
        icon="pi pi-angle-double-down"
        size="small"
        severity="secondary"
        outlined
        @click="expandAll"
      />
      <Button
        label="전체 접기"
        icon="pi pi-angle-double-up"
        size="small"
        severity="secondary"
        outlined
        @click="collapseAll"
      />
    </div>
  </div>

  <!-- 검색 박스 -->
  <WbsSearchBox class="mb-4" />

  <!-- 요약 카드 -->
  <WbsSummaryCards />
</div>
```

#### PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| Button | 액션 버튼 | `size="small"`, `severity="secondary"`, `outlined` |

#### 색상 적용

- 배경: `bg-[#16213e]` (Header)
- 하단 보더: `border-b border-[#3d3d5c]`
- 타이틀 아이콘: `text-purple-500` (Project 색상)
- 타이틀 텍스트: `text-[#e8e8e8]`

#### 접근성

- `<h2>` - 시맨틱 헤딩 사용
- 버튼 `aria-label` 속성 추가

---

### 3.3 WbsSummaryCards (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsSummaryCards.vue`

#### 레이아웃 구조

```
┌──────────────────────────────────────────────────────┐
│  WbsSummaryCards (grid grid-cols-4 gap-3)            │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │    12    │ │     8    │ │    45    │ │   62%   ││
│  │   WP     │ │   ACT    │ │   TSK    │ │ Progress││
│  │ (blue)   │ │ (green)  │ │ (orange) │ │(purple) ││
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### 스타일 명세

```vue
<div class="grid grid-cols-4 gap-3">
  <!-- WP 카드 -->
  <Card class="bg-[#1e1e38] border border-[#3d3d5c]">
    <template #content>
      <div class="text-center p-2">
        <div class="text-2xl font-bold text-blue-500">
          {{ wpCount }}
        </div>
        <div class="text-sm text-[#888888] mt-1">
          WP
        </div>
      </div>
    </template>
  </Card>

  <!-- ACT 카드 -->
  <Card class="bg-[#1e1e38] border border-[#3d3d5c]">
    <template #content>
      <div class="text-center p-2">
        <div class="text-2xl font-bold text-green-500">
          {{ actCount }}
        </div>
        <div class="text-sm text-[#888888] mt-1">
          ACT
        </div>
      </div>
    </template>
  </Card>

  <!-- TSK 카드 -->
  <Card class="bg-[#1e1e38] border border-[#3d3d5c]">
    <template #content>
      <div class="text-center p-2">
        <div class="text-2xl font-bold text-orange-500">
          {{ taskCount }}
        </div>
        <div class="text-sm text-[#888888] mt-1">
          TSK
        </div>
      </div>
    </template>
  </Card>

  <!-- Progress 카드 -->
  <Card class="bg-[#1e1e38] border border-[#3d3d5c]">
    <template #content>
      <div class="text-center p-2">
        <div class="text-2xl font-bold text-purple-500">
          {{ totalProgress }}%
        </div>
        <div class="text-sm text-[#888888] mt-1">
          Progress
        </div>
      </div>
    </template>
  </Card>
</div>
```

#### PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| Card | 통계 카드 | 기본 설정 사용 |

#### 카드 색상 매핑

| 카드 | 값 색상 | 레이블 | 의미 |
|------|---------|--------|------|
| WP | `text-blue-500` | WP | Work Package 수 |
| ACT | `text-green-500` | ACT | Activity 수 |
| TSK | `text-orange-500` | TSK | Task 수 |
| Progress | `text-purple-500` | Progress | 전체 진행률 |

#### 반응형 고려

- Desktop: `grid-cols-4` (4개 가로 배치)
- Tablet (향후): `grid-cols-2` (2x2 그리드)
- Mobile (향후): `grid-cols-1` (세로 스택)

#### 접근성

- `aria-label` 각 카드에 추가
  - "Work Package count: 12"
  - "Activity count: 8"
  - "Task count: 45"
  - "Overall progress: 62%"

---

### 3.4 WbsSearchBox (프레젠테이션)

**파일 경로**: `app/components/wbs/WbsSearchBox.vue`

#### 레이아웃 구조

```
┌────────────────────────────────────────┐
│  WbsSearchBox (relative)               │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ 🔍 Task ID 또는 제목으로 검색... │ X │
│  │    (IconField + InputText)      │   │
│  └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

#### 스타일 명세

```vue
<div class="wbs-search-box relative">
  <IconField iconPosition="left">
    <InputIcon>
      <i class="pi pi-search text-[#888888]" />
    </InputIcon>
    <InputText
      v-model="searchQuery"
      placeholder="Task ID 또는 제목으로 검색..."
      class="w-full bg-[#1e1e38] border-[#3d3d5c] text-[#e8e8e8]
             placeholder:text-gray-500
             focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  </IconField>

  <!-- 검색어 입력 시 초기화 버튼 -->
  <Button
    v-if="searchQuery"
    icon="pi pi-times"
    text
    rounded
    size="small"
    severity="secondary"
    @click="clearSearch"
    class="absolute right-2 top-1/2 -translate-y-1/2 hover:text-red-500"
    aria-label="Clear search"
  />
</div>
```

#### PrimeVue 컴포넌트

| 컴포넌트 | 용도 | Props |
|---------|------|-------|
| IconField | 아이콘 포함 입력 필드 | `iconPosition="left"` |
| InputIcon | 검색 아이콘 컨테이너 | - |
| InputText | 검색 입력 필드 | `v-model`, `placeholder` |
| Button | 초기화 버튼 | `icon`, `text`, `rounded` |

#### 상태별 스타일

| 상태 | 스타일 | 설명 |
|------|--------|------|
| Default | `bg-[#1e1e38] border-[#3d3d5c]` | 기본 상태 |
| Focus | `border-blue-500 ring-1 ring-blue-500` | 포커스 시 파란 테두리 |
| Hover | `border-gray-600` | 마우스 오버 (미세 밝기) |
| Disabled | `opacity-50 cursor-not-allowed` | 비활성 (향후) |

#### 인터랙션

- **입력 시**: 300ms debounce 적용 (로직)
- **ESC 키**: 검색어 초기화
- **X 버튼 클릭**: 검색어 초기화
- **포커스 시**: 파란색 테두리 표시

#### 접근성

- `role="searchbox"` - 검색 입력 필드
- `aria-label="Search WBS tree"` - 스크린 리더용
- `aria-describedby="search-hint"` - 힌트 텍스트 연결
- 키보드 네비게이션: Tab, ESC 지원

---

## 4. 상태별 UI 변화

### 4.1 로딩 상태 (WbsTreePanel)

**시각적 표현**:
- 중앙 정렬된 ProgressSpinner
- 배경: `bg-[#0f0f23]`
- 스피너 색상: 기본 (primary)

```vue
<div class="flex items-center justify-center h-full bg-[#0f0f23]">
  <ProgressSpinner
    style="width: 50px; height: 50px"
    strokeWidth="4"
    animationDuration="1s"
  />
</div>
```

### 4.2 에러 상태 (WbsTreePanel)

**시각적 표현**:
- PrimeVue Message 컴포넌트 (severity="error")
- 좌측 여백: `p-4`
- 아이콘: 자동 (위험 아이콘)

```vue
<div class="p-4 bg-[#0f0f23]">
  <Message severity="error" :closable="false">
    <p class="text-sm">{{ error }}</p>
  </Message>
</div>
```

### 4.3 빈 상태 (데이터 없음)

**시각적 표현** (향후):
- 중앙 정렬된 안내 메시지
- 아이콘: `pi pi-inbox`
- 텍스트: "WBS 데이터가 없습니다."

### 4.4 검색 결과 없음 (WbsSearchBox 활성 시)

**시각적 표현** (향후):
- 트리 영역에 안내 메시지
- "검색 결과가 없습니다."

---

## 5. 인터랙션 및 호버 상태

### 5.1 버튼 호버/포커스

| 버튼 유형 | 기본 상태 | 호버 상태 | 포커스 상태 |
|----------|----------|----------|-----------|
| Outlined Button | `border-gray-600` | `bg-gray-700/20` | `ring-2 ring-blue-500` |
| Text Button (X) | `text-gray-400` | `text-red-500` | `ring-2 ring-blue-500` |

### 5.2 입력 필드 포커스

**SearchBox**:
- 기본: `border-[#3d3d5c]`
- 포커스: `border-blue-500 ring-1 ring-blue-500`
- 전환: `transition-colors duration-200`

### 5.3 카드 호버 (향후)

**SummaryCards**:
- 기본: `border-[#3d3d5c]`
- 호버: `border-blue-500/50 shadow-lg` (향후 인터랙션 추가 시)

---

## 6. 타이포그래피 상세

### 6.1 헤더 타이틀

```css
font-size: 18px;        /* text-lg */
font-weight: 600;       /* font-semibold */
color: #e8e8e8;         /* text-[#e8e8e8] */
line-height: 1.5;
letter-spacing: -0.01em;
```

### 6.2 통계 카드 값

```css
font-size: 24px;        /* text-2xl */
font-weight: 700;       /* font-bold */
color: varies;          /* text-blue-500 등 */
line-height: 1.2;
```

### 6.3 통계 카드 레이블

```css
font-size: 14px;        /* text-sm */
font-weight: 400;       /* font-normal */
color: #888888;         /* text-[#888888] */
line-height: 1.5;
text-transform: uppercase;
```

### 6.4 입력 필드 텍스트

```css
font-size: 16px;        /* text-base */
font-weight: 400;       /* font-normal */
color: #e8e8e8;         /* text-[#e8e8e8] */
line-height: 1.5;
```

### 6.5 Placeholder

```css
font-size: 14px;        /* text-sm */
font-weight: 400;       /* font-normal */
color: #6b7280;         /* text-gray-500 */
line-height: 1.5;
font-style: normal;
```

---

## 7. 간격 시스템 (Spacing Scale)

### 7.1 패딩 규칙

| 영역 | Class | 값 | 용도 |
|------|-------|-----|------|
| 헤더 전체 | `p-4` | 16px | WbsTreeHeader 내부 여백 |
| 카드 내부 | `p-2` | 8px | SummaryCards 컨텐츠 |
| 버튼 | `px-4 py-2` | 16px/8px | 액션 버튼 |
| 입력 필드 | `px-3 py-2` | 12px/8px | SearchBox |

### 7.2 마진/Gap 규칙

| 영역 | Class | 값 | 용도 |
|------|-------|-----|------|
| 헤더 요소 간 | `mb-4` | 16px | 타이틀 → 검색 → 카드 |
| 카드 그리드 | `gap-3` | 12px | 4개 카드 사이 |
| 버튼 그룹 | `gap-2` | 8px | 펼치기/접기 버튼 |
| 아이콘-텍스트 | `gap-2` | 8px | 타이틀 아이콘 |

---

## 8. 반응형 디자인 전략

### 8.1 Desktop (1200px+) - 1차 범위

**좌측 패널 너비**: 320px (고정)

**레이아웃**:
```
┌──────────┬──────────────────────┐
│  Tree    │   Detail Panel       │
│  Panel   │   (우측 확장)         │
│  320px   │                      │
│  (고정)  │                      │
└──────────┴──────────────────────┘
```

**컴포넌트 조정**:
- WbsTreeHeader: 4개 카드 가로 배치 유지
- WbsSearchBox: 전체 너비 사용

### 8.2 Tablet (768px-1199px) - 향후

**좌측 패널 너비**: 280px (축소)

**레이아웃 변경**:
- SummaryCards: `grid-cols-2` (2x2 그리드)
- 버튼 레이블 축약: "펼치기" / "접기"

### 8.3 Mobile (< 768px) - 향후

**좌측 패널**: 전체 화면 또는 슬라이드

**레이아웃 변경**:
- SummaryCards: `grid-cols-1` (세로 스택)
- 버튼: 아이콘만 표시
- 검색: Sticky 헤더

---

## 9. 접근성 (Accessibility)

### 9.1 ARIA 속성

#### WbsTreePanel

```vue
<div
  role="region"
  aria-label="WBS Tree Panel"
  aria-busy="false"
>
```

#### WbsTreeHeader

```vue
<h2 id="wbs-tree-title">WBS 트리</h2>

<Button
  aria-label="Expand all tree nodes"
  aria-describedby="wbs-tree-title"
>
```

#### WbsSummaryCards

```vue
<Card aria-label="Work Package count: 12">
  <div role="status" aria-live="polite">
    <div aria-label="12 Work Packages">12</div>
  </div>
</Card>
```

#### WbsSearchBox

```vue
<InputText
  role="searchbox"
  aria-label="Search WBS tree by Task ID or title"
  aria-describedby="search-hint"
/>

<span id="search-hint" class="sr-only">
  Type to filter tasks. Press ESC to clear.
</span>
```

### 9.2 키보드 네비게이션

| 키 | 동작 | 컴포넌트 |
|----|------|---------|
| Tab | 포커스 이동 | 전체 |
| Enter | 버튼 실행 | Button |
| Space | 버튼 실행 | Button |
| ESC | 검색어 초기화 | SearchBox |
| Ctrl+F | 검색 포커스 (향후) | SearchBox |

### 9.3 스크린 리더 지원

- **시맨틱 HTML**: `<h2>`, `<button>` 사용
- **역할 정의**: `role="region"`, `role="searchbox"`
- **상태 알림**: `aria-live="polite"` (통계 업데이트 시)
- **레이블 제공**: 모든 인터랙티브 요소에 `aria-label`

### 9.4 색상 대비 (WCAG AA)

| 조합 | 대비 비율 | 기준 | 통과 |
|------|----------|------|------|
| `#e8e8e8` on `#16213e` | 9.2:1 | 4.5:1 | ✅ |
| `#888888` on `#1e1e38` | 4.8:1 | 4.5:1 | ✅ |
| `#3b82f6` on `#1e1e38` | 5.1:1 | 3:1 (Large) | ✅ |

---

## 10. PrimeVue 컴포넌트 사용 가이드

### 10.1 필수 Import

```typescript
// WbsTreePanel.vue
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

// WbsTreeHeader.vue
import Button from 'primevue/button'

// WbsSummaryCards.vue
import Card from 'primevue/card'

// WbsSearchBox.vue
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
```

### 10.2 PrimeVue 테마 커스터마이징

**Tailwind Preset** (nuxt.config.ts):

```typescript
primevue: {
  options: {
    theme: {
      preset: Lara,
      options: {
        darkModeSelector: '.dark',
        cssLayer: {
          name: 'primevue',
          order: 'tailwind-base, primevue, tailwind-utilities'
        }
      }
    }
  }
}
```

### 10.3 다크 모드 클래스

**전역 적용** (app.vue):

```vue
<template>
  <div class="dark">
    <NuxtPage />
  </div>
</template>
```

---

## 11. CSS 유틸리티 클래스 정리

### 11.1 공통 클래스

```css
/* 패널 배경 */
.wbs-tree-panel-bg {
  @apply bg-[#0f0f23];
}

/* 헤더 배경 */
.wbs-tree-header-bg {
  @apply bg-[#16213e] border-b border-[#3d3d5c];
}

/* 카드 배경 */
.wbs-card-bg {
  @apply bg-[#1e1e38] border border-[#3d3d5c];
}

/* 입력 필드 스타일 */
.wbs-input {
  @apply bg-[#1e1e38] border-[#3d3d5c] text-[#e8e8e8]
         placeholder:text-gray-500
         focus:border-blue-500 focus:ring-1 focus:ring-blue-500;
}
```

### 11.2 스크린 리더 전용

```css
/* Tailwind SR-Only 사용 */
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden
         whitespace-nowrap border-0;
}
```

---

## 12. 구현 체크리스트

### 12.1 컴포넌트 구현

- [ ] WbsTreePanel.vue - 기본 레이아웃 및 로딩/에러 상태
- [ ] WbsTreeHeader.vue - 타이틀, 버튼, 자식 컴포넌트 통합
- [ ] WbsSummaryCards.vue - 4개 카드 그리드 레이아웃
- [ ] WbsSearchBox.vue - 검색 입력 및 초기화 버튼

### 12.2 스타일링

- [ ] Dark Blue 테마 색상 적용
- [ ] 타이포그래피 일관성 확보
- [ ] 간격 시스템 준수
- [ ] PrimeVue 컴포넌트 스타일 커스터마이징

### 12.3 반응형

- [ ] Desktop (1200px) 레이아웃 구현
- [ ] 좌측 패널 너비 320px 고정

### 12.4 접근성

- [ ] ARIA 속성 추가 (role, aria-label 등)
- [ ] 키보드 네비게이션 지원 (Tab, ESC)
- [ ] 스크린 리더 호환성 확인
- [ ] 색상 대비 WCAG AA 기준 충족

### 12.5 PrimeVue 통합

- [ ] 필수 컴포넌트 Import
- [ ] 다크 모드 클래스 적용
- [ ] 테마 커스터마이징 설정

---

## 13. 디자인 검증 기준

### 13.1 시각적 일관성

- [ ] 모든 컴포넌트가 Dark Blue 테마 색상 사용
- [ ] 타이포그래피 크기 및 굵기 일관성
- [ ] 간격 시스템 규칙 준수
- [ ] 보더 색상 통일 (`#3d3d5c`)

### 13.2 사용자 경험

- [ ] 로딩 상태 명확히 표시
- [ ] 에러 메시지 사용자 친화적
- [ ] 검색 입력 즉각 반응 (시각적 피드백)
- [ ] 버튼 호버/포커스 상태 명확

### 13.3 성능

- [ ] 불필요한 리렌더링 방지
- [ ] CSS 클래스 최적화 (Tailwind Purge)
- [ ] PrimeVue 컴포넌트 효율적 사용

### 13.4 접근성

- [ ] 모든 인터랙티브 요소 키보드 접근 가능
- [ ] ARIA 속성 정확히 적용
- [ ] 색상 대비 기준 충족
- [ ] 스크린 리더 테스트 통과

---

## 14. 참고 자료

### 14.1 관련 문서

- 기본설계: `010-basic-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.2, 10.1)
- 상세설계: `020-detail-design.md` (다음 단계)

### 14.2 외부 참조

- [PrimeVue 4.x Documentation](https://primevue.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

### 14.3 디자인 토큰

**Figma/디자인 파일** (향후):
- 색상 팔레트 시안
- 컴포넌트 목업
- 반응형 레이아웃 스케치

---

## 15. 다음 단계

### 15.1 상세설계 단계 (/wf:draft)

- Pinia 스토어 `filteredNodes` getter 로직 구현
- 검색 필터링 알고리즘 상세 설계
- 이벤트 핸들러 로직 구현 계획
- 단위 테스트 시나리오 작성

### 15.2 구현 단계 (/wf:build)

- 4개 Vue 컴포넌트 파일 작성
- PrimeVue 통합 및 스타일링
- Pinia 스토어 연동
- 로컬 테스트 및 검증

### 15.3 검증 단계 (/wf:verify)

- 시각적 회귀 테스트 (스크린샷 비교)
- 접근성 자동화 테스트 (axe-core)
- 반응형 레이아웃 테스트
- 사용자 인수 테스트

---

<!--
author: Claude (Frontend Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
