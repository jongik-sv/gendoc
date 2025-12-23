# 화면설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * UI/UX 중심 설계에 집중
> * 모든 화면은 SVG 개념도로 시각화
> * PrimeVue 4.x 컴포넌트 우선 사용
> * Dark Blue 테마 색상 팔레트 준수

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-04 |
| Task명 | Document Viewer |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 섹션 7 (컴포넌트 설계), 섹션 8 (스타일링) |
| 상세설계 | `020-detail-design.md` | 섹션 9 (UI 설계) |
| TRD | `.jjiban/projects/jjiban/trd.md` | 섹션 2.3 (PrimeVue 우선순위), 섹션 2.3.3 (색상 팔레트) |

---

## 1. 화면 개요

### 1.1 화면 목적

Task 상세 패널 내에서 Markdown 기반 개발 프로세스 문서를 렌더링하여 표시. LLM이 생성한 문서를 즉시 확인하고 검토할 수 있는 가독성 높은 뷰어 환경 제공.

### 1.2 사용자 시나리오

1. **문서 로드 시나리오**
   - 사용자가 TaskDocuments 컴포넌트에서 문서 파일 선택
   - DocumentViewer가 로딩 스켈레톤 표시
   - API 응답 후 렌더링된 Markdown 표시

2. **에러 처리 시나리오**
   - 파일 없음 또는 로드 실패 시 에러 메시지 표시
   - 재시도 버튼 클릭 시 다시 로드 시도

3. **콘텐츠 탐색 시나리오**
   - 렌더링된 문서 스크롤
   - 코드 블록 가로 스크롤 (긴 코드 라인)
   - 링크 클릭 시 외부 페이지 열기

---

## 2. 화면 상태 정의

### 2.1 상태 목록

| 상태 | 조건 | 설명 |
|------|------|------|
| **Loading** | loading = true | API 응답 대기 중, Skeleton UI 표시 |
| **Error** | error != null | 파일 없음 또는 로드 실패, 에러 메시지 표시 |
| **Content** | content != null && !loading | 정상 렌더링 상태, Markdown HTML 표시 |
| **Empty** | content = "" && !loading | 빈 파일, "문서 내용이 없습니다" 표시 |

### 2.2 상태 전이 다이어그램

```
Initial → Loading → Content (성공)
              ↓
             Error (실패) → Loading (재시도)
```

---

## 3. 화면 레이아웃

### 3.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│ DocumentViewer Component                                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Loading State: PrimeVue Skeleton]                          │
│  OR                                                           │
│  [Error State: 에러 메시지 + 재시도 버튼]                     │
│  OR                                                           │
│  [Content State: 렌더링된 Markdown HTML]                     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ <div class="markdown-body">                           │  │
│  │   ... 렌더링된 HTML ...                               │  │
│  │ </div>                                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 컴포넌트 계층

```
DocumentViewer.vue
├── v-if="loading"
│   └── Skeleton (PrimeVue)
│       ├── Skeleton (height="2rem") - 제목
│       ├── Skeleton (height="1rem", mt-2) - 라인 1
│       ├── Skeleton (height="1rem", mt-2) - 라인 2
│       └── Skeleton (height="300px", mt-4) - 본문 블록
├── v-else-if="error"
│   └── ErrorDisplay
│       ├── InlineMessage (PrimeVue, severity="error")
│       ├── p - 에러 메시지
│       └── Button (PrimeVue, label="재시도", @click="reload")
└── v-else
    └── div.markdown-body (v-html="renderedHtml")
```

---

## 4. 화면 상세 설계

### 4.1 Loading State (로딩 스켈레톤)

**목적**: API 응답 대기 중 사용자에게 로딩 상태 시각적 피드백 제공

**컴포넌트**: PrimeVue Skeleton

**레이아웃**:
```
┌──────────────────────────────────────────────────────────┐
│ ████████████████                                (제목)    │
│                                                           │
│ ████████████████████████████████████           (라인 1)  │
│ ████████████████████████████                   (라인 2)  │
│                                                           │
│ ███████████████████████████████████████████████          │
│ ███████████████████████████████████████████████          │
│ ███████████████████████████████████████████████          │
│ ███████████████████████████████████████████████          │
│ ███████████████████████████████████████████████          │
│ ███████████████████████████████████████████████          │
│                                                (본문 블록)│
└──────────────────────────────────────────────────────────┘
```

**SVG 파일**: `ui-assets/screen-01-viewer-loading.svg`

**Props**:
- Skeleton height="2rem" (제목)
- Skeleton height="1rem" class="mt-2" (라인 1, 2)
- Skeleton height="300px" class="mt-4" (본문 블록)

**색상**:
- Skeleton 배경: `#334155` (slate-700)
- 애니메이션: 밝기 변화 (shimmer effect)

---

### 4.2 Content State (렌더링된 콘텐츠)

**목적**: Markdown을 HTML로 렌더링하여 가독성 높게 표시

**컴포넌트**: div.markdown-body (v-html)

**레이아웃**:
```
┌──────────────────────────────────────────────────────────┐
│ 기본설계 (010-basic-design.md)                           │
│                                                           │
│ 0. 문서 메타데이터                                        │
│ ───────────────────────────────────────                  │
│ | 항목 | 내용 |                                           │
│ |------|------|                                           │
│ | Task ID | TSK-05-04 |                                  │
│                                                           │
│ 1. 목적 및 범위                                           │
│ Task 상세 패널에서 Markdown 기반 문서를 렌더링...        │
│                                                           │
│ interface Props {                                        │
│   taskId: string                                         │
│   filename: string                                       │
│ }                                                        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**SVG 파일**: `ui-assets/screen-01-viewer-content.svg`

**타이포그래피**:
- h1: `font-size: 2rem`, `color: #E2E8F0` (slate-200)
- h2: `font-size: 1.5rem`, `color: #E2E8F0`
- h3: `font-size: 1.25rem`, `color: #E2E8F0`
- p: `font-size: 1rem`, `color: #CBD5E1` (slate-300), `line-height: 1.6`
- a: `color: #6C9BCF`, `text-decoration: underline`

**스크롤**:
- 컨테이너: `overflow-y: auto`, `max-height: {maxHeight}px`
- 스크롤바 커스터마이징 (Dark Blue 테마)

---

### 4.3 Content State - Code Block (코드 하이라이팅)

**목적**: 코드 블록에 문법 하이라이팅 적용하여 가독성 향상

**컴포넌트**: div.markdown-body > pre > code.hljs

**레이아웃**:
```
┌──────────────────────────────────────────────────────────┐
│ interface Props {                                        │
│   /** Task ID (API 경로용) */                            │
│   taskId: string                                         │
│   /** 문서 파일명 */                                      │
│   filename: string                                       │
│   /** 최대 높이 (px) */                                   │
│   maxHeight?: number                                     │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
```

**SVG 파일**: `ui-assets/screen-02-viewer-code-block.svg`

**코드 하이라이팅 색상** (highlight.js atom-one-dark 기반):
- 배경: `#1E293B` (slate-800)
- 키워드 (interface, string): `#C678DD` (보라)
- 타입 (string): `#61AFEF` (파랑)
- 문자열: `#98C379` (초록)
- 주석: `#5C6370` (회색)

**코드 블록 스타일**:
- 배경: `#1E293B` (slate-800)
- 경계선: `1px solid #334155` (slate-700)
- 둥근 모서리: `border-radius: 4px`
- 내부 여백: `padding: 1rem`
- 가로 스크롤: `overflow-x: auto`
- 폰트: `font-family: 'Fira Code', 'Consolas', monospace`

---

### 4.4 Content State - Table (GFM 테이블)

**목적**: GitHub Flavored Markdown 테이블을 스타일링하여 표시

**컴포넌트**: div.markdown-body > table

**레이아웃**:
```
┌──────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────┐  │
│ │ 항목          │ 내용                              │  │
│ ├──────────────┼───────────────────────────────────┤  │
│ │ Task ID      │ TSK-05-04                          │  │
│ │ Task명       │ Document Viewer                    │  │
│ │ Category     │ development                        │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**SVG 파일**: `ui-assets/screen-02-viewer-table.svg`

**테이블 스타일**:
- 전체 너비: `width: 100%`
- 테두리 병합: `border-collapse: collapse`
- 헤더 배경: `#1E293B` (slate-800)
- 헤더 텍스트: `#E2E8F0` (slate-200), `font-weight: bold`
- 셀 경계선: `1px solid #334155` (slate-700)
- 셀 내부 여백: `padding: 0.5rem 1rem`
- 홀수 행 배경: `#0F172A` (slate-900)
- 짝수 행 배경: `#1E293B` (slate-800)

---

### 4.5 Error State (에러 표시)

**목적**: 파일 없음 또는 로드 실패 시 에러 메시지와 재시도 옵션 제공

**컴포넌트**: InlineMessage (PrimeVue) + Button

**레이아웃**:
```
┌──────────────────────────────────────────────────────────┐
│ ⚠️ 문서를 불러올 수 없습니다                              │
│                                                           │
│ 요청한 문서를 찾을 수 없습니다 (DOCUMENT_NOT_FOUND)      │
│                                                           │
│ ┌──────────┐                                             │
│ │ 재시도   │                                             │
│ └──────────┘                                             │
└──────────────────────────────────────────────────────────┘
```

**SVG 파일**: `ui-assets/screen-03-viewer-error.svg`

**컴포넌트 Props**:
- InlineMessage severity="error"
- Button label="재시도" icon="pi pi-refresh" @click="reload()"

**에러 메시지 매핑**:

| 에러 코드 | 사용자 메시지 |
|----------|--------------|
| DOCUMENT_NOT_FOUND | 요청한 문서를 찾을 수 없습니다 |
| FILE_READ_ERROR | 문서를 불러올 수 없습니다 |
| INVALID_FILENAME | 유효하지 않은 파일명입니다 |
| NETWORK_ERROR | 네트워크 연결을 확인해주세요 |

**색상**:
- InlineMessage 배경: `#991B1B` (red-800, 50% opacity)
- InlineMessage 경계선: `#EF4444` (red-500)
- 텍스트: `#FCA5A5` (red-300)
- 버튼 배경: `#1E293B` (slate-800)
- 버튼 호버: `#334155` (slate-700)

---

## 5. 반응형 설계

### 5.1 브레이크포인트

| 크기 | 범위 | 설명 |
|------|------|------|
| **Desktop** | ≥1200px | 전체 너비, 기본 폰트 크기 |
| **Tablet** | 768px ~ 1199px | 전체 너비, 폰트 크기 조정 |
| **Mobile** | <768px | 전체 너비, 코드 블록 가로 스크롤 |

### 5.2 반응형 조정

**Desktop (≥1200px)**:
- markdown-body: `font-size: 1rem`
- h1: `font-size: 2rem`
- 코드 블록: `font-size: 0.875rem`
- 테이블: 전체 너비 표시

**Tablet (768px ~ 1199px)**:
- markdown-body: `font-size: 0.9375rem` (15px)
- h1: `font-size: 1.75rem`
- 코드 블록: `font-size: 0.8125rem` (13px)
- 테이블: 전체 너비, 셀 패딩 축소

**Mobile (<768px)**:
- markdown-body: `font-size: 0.875rem` (14px)
- h1: `font-size: 1.5rem`
- 코드 블록: `overflow-x: auto`, `font-size: 0.75rem` (12px)
- 테이블: `overflow-x: auto` 컨테이너로 감싸기

---

## 6. 접근성 설계

### 6.1 Semantic HTML

| 요소 | HTML 태그 | 목적 |
|------|-----------|------|
| 문서 컨테이너 | `<article>` | 독립적인 콘텐츠 영역 |
| 제목 | `<h1>` ~ `<h6>` | 계층적 제목 구조 |
| 단락 | `<p>` | 본문 텍스트 |
| 링크 | `<a>` | 외부 링크 (target="_blank") |
| 코드 | `<code>`, `<pre>` | 인라인 코드, 코드 블록 |
| 테이블 | `<table>`, `<thead>`, `<tbody>` | 구조화된 데이터 |

### 6.2 ARIA 속성

| 상태 | ARIA 속성 | 값 |
|------|----------|-----|
| 로딩 중 | `aria-busy` | "true" |
| 로딩 완료 | `aria-busy` | "false" |
| 에러 메시지 | `role` | "alert" |
| 문서 영역 | `aria-label` | "문서 내용" |

### 6.3 키보드 탐색

| 요소 | 동작 | 설명 |
|------|------|------|
| 링크 | Tab 키로 이동 | 포커스 표시 (outline) |
| 재시도 버튼 | Tab 키로 이동, Enter/Space 키 클릭 | 포커스 표시 |
| 스크롤 영역 | 화살표 키 스크롤 | 키보드 스크롤 지원 |

### 6.4 포커스 스타일

```css
.markdown-body a:focus,
.markdown-body button:focus {
  outline: 2px solid #6C9BCF;
  outline-offset: 2px;
}
```

---

## 7. 색상 팔레트 (Dark Blue 테마)

### 7.1 배경 색상

| 용도 | CSS 변수 | 값 | 사용 위치 |
|------|----------|-----|----------|
| 주 배경 | `--md-bg-primary` | `#0F172A` (slate-900) | 문서 배경, 테이블 홀수 행 |
| 부 배경 | `--md-bg-secondary` | `#1E293B` (slate-800) | 코드 블록, 테이블 짝수 행 |
| 코드 블록 배경 | `--md-codeblock-bg` | `#1E293B` (slate-800) | pre > code 배경 |

### 7.2 텍스트 색상

| 용도 | CSS 변수 | 값 | 사용 위치 |
|------|----------|-----|----------|
| 주 텍스트 | `--md-text-primary` | `#E2E8F0` (slate-200) | h1~h6 제목 |
| 부 텍스트 | `--md-text-secondary` | `#CBD5E1` (slate-300) | p, li 본문 |
| 링크 | `--md-link` | `#6C9BCF` | a 태그 |
| 코드 텍스트 | `--md-code-text` | `#9CDCFE` | 인라인 code |

### 7.3 경계선 색상

| 용도 | CSS 변수 | 값 | 사용 위치 |
|------|----------|-----|----------|
| 경계선 | `--md-border` | `#334155` (slate-700) | 테이블, 코드 블록 border |
| 구분선 | `--md-divider` | `#475569` (slate-600) | hr 태그 |

### 7.4 상태 색상

| 용도 | CSS 변수 | 값 | 사용 위치 |
|------|----------|-----|----------|
| 에러 배경 | `--md-error-bg` | `#991B1B` (red-800, 50%) | InlineMessage 배경 |
| 에러 경계선 | `--md-error-border` | `#EF4444` (red-500) | InlineMessage border |
| 에러 텍스트 | `--md-error-text` | `#FCA5A5` (red-300) | 에러 메시지 |

---

## 8. 인터랙션 설계

### 8.1 로딩 애니메이션

**Skeleton Shimmer Effect**:
- 애니메이션: `@keyframes shimmer`
- 지속 시간: `1.5s`
- 반복: `infinite`
- Easing: `ease-in-out`
- 효과: 밝기 변화 (`background-position: -200px 0 → 200px 0`)

### 8.2 버튼 인터랙션

**재시도 버튼**:
- Hover: 배경색 변경 (`#1E293B` → `#334155`)
- Active: 살짝 눌린 효과 (`transform: translateY(1px)`)
- 포커스: `outline: 2px solid #6C9BCF`
- 로딩 중: 버튼 비활성화, 스피너 아이콘 표시

### 8.3 링크 인터랙션

**Markdown 내 링크**:
- Hover: 밑줄 두껍게 (`text-decoration-thickness: 2px`)
- Hover: 색상 밝게 (`#6C9BCF` → `#8DB3D9`)
- 외부 링크: `target="_blank"`, `rel="noopener noreferrer"`
- 외부 링크 아이콘: 링크 옆에 작은 외부 링크 아이콘 표시 (선택)

---

## 9. 컴포넌트 Props & Emits

### 9.1 DocumentViewer Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| taskId | string | Y | - | Task ID (예: "TSK-05-04") |
| filename | string | Y | - | 문서 파일명 (예: "010-basic-design.md") |
| maxHeight | number | N | 600 | 최대 높이 (px) |

### 9.2 DocumentViewer Emits

| Event | Payload | 설명 |
|-------|---------|------|
| loaded | content: string | 문서 로드 완료 시 발행 |
| error | error: Error | 로드 실패 시 발행 |

### 9.3 사용 예시

```vue
<DocumentViewer
  task-id="TSK-05-04"
  filename="010-basic-design.md"
  :max-height="800"
  @loaded="onDocumentLoaded"
  @error="onDocumentError"
/>
```

---

## 10. SVG 파일 목록

### 10.1 생성할 SVG 파일

| 파일명 | 설명 | 뷰포트 | 상태 |
|--------|------|--------|------|
| `screen-01-viewer-loading.svg` | 로딩 스켈레톤 | 600x500 | Loading |
| `screen-01-viewer-content.svg` | 렌더링된 콘텐츠 | 600x500 | Content |
| `screen-02-viewer-code-block.svg` | 코드 하이라이팅 예시 | 600x400 | Content |
| `screen-02-viewer-table.svg` | GFM 테이블 예시 | 600x400 | Content |
| `screen-03-viewer-error.svg` | 에러 상태 | 600x400 | Error |

### 10.2 SVG 스타일 가이드

**공통 스타일**:
- 뷰포트: `viewBox="0 0 600 500"` (또는 400)
- 배경: `fill="#0F172A"` (slate-900)
- 텍스트 폰트: `font-family: system-ui, -apple-system, sans-serif`
- 코드 폰트: `font-family: 'Courier New', monospace`

**색상 사용**:
- 제목: `#E2E8F0` (slate-200)
- 본문: `#CBD5E1` (slate-300)
- 링크: `#6C9BCF`
- 코드 블록 배경: `#1E293B` (slate-800)
- 테두리: `#334155` (slate-700)
- Skeleton: `#334155` (slate-700)

---

## 11. 구현 체크리스트

### UI 컴포넌트
- [ ] DocumentViewer.vue 기본 구조
- [ ] Loading State UI (PrimeVue Skeleton)
- [ ] Error State UI (InlineMessage + Button)
- [ ] Content State UI (markdown-body)
- [ ] Props/Emits 정의

### 스타일링
- [ ] markdown.css 작성 (.markdown-body 클래스)
- [ ] 타이포그래피 스타일 (h1~h6, p, a)
- [ ] 코드 블록 스타일 (pre, code)
- [ ] 테이블 스타일 (table, th, td)
- [ ] Dark Blue 테마 색상 변수
- [ ] 반응형 미디어 쿼리

### 접근성
- [ ] Semantic HTML 사용
- [ ] ARIA 속성 추가 (aria-busy, role="alert")
- [ ] 키보드 탐색 지원
- [ ] 포커스 스타일 정의

### SVG 자산
- [ ] screen-01-viewer-loading.svg
- [ ] screen-01-viewer-content.svg
- [ ] screen-02-viewer-code-block.svg
- [ ] screen-02-viewer-table.svg
- [ ] screen-03-viewer-error.svg

---

## 12. 다음 단계

- `/wf:build` 명령어로 구현 진행 (030-implementation.md)
- 구현 시 참조:
  - 상세설계 (020-detail-design.md) - Composables 구현 로직
  - 화면설계 (011-ui-design.md) - UI 컴포넌트 구조

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- TRD: `.jjiban/projects/jjiban/trd.md`
- SVG 자산: `ui-assets/` 폴더

---

<!--
author: AI Agent (Claude Sonnet 4.5)
Template Version: 1.0.0
Created: 2025-12-15
-->
