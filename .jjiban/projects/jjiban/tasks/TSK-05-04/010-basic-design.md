# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-04 |
| Task명 | Document Viewer |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 8.1 (API 명세), 9.2 (컴포넌트 구조) |
| TRD | `.jjiban/projects/jjiban/trd.md` | 섹션 2.2 (UI 스택), 2.3 (PrimeVue 우선순위) |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-05-04 요구사항 |

---

## 1. 목적 및 범위

### 1.1 목적

Task 상세 패널에서 Markdown 기반 문서(기본설계, 상세설계, 코드리뷰 등)를 렌더링하여 표시하는 DocumentViewer 컴포넌트를 구현. 개발 프로세스 문서의 가독성을 높이고 LLM이 생성한 Markdown 문서를 즉시 확인할 수 있도록 함.

### 1.2 범위

**포함 범위**:
- Markdown 렌더링 라이브러리 선정 및 설정
- DocumentViewer 컴포넌트 구현 (로드, 렌더링, 스크롤)
- 문서 API 연동 (GET /api/tasks/:id/documents/:filename)
- 코드 하이라이팅 설정 (TypeScript, Vue, Bash 등)
- GFM (GitHub Flavored Markdown) 지원
- 로딩/에러 상태 UI

**제외 범위**:
- Mermaid 다이어그램 렌더링 → TSK-05-05 (2차)
- 문서 편집 기능 → TSK-05-06 (2차)
- PDF 내보내기 → 2차

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | Markdown → HTML 변환 및 렌더링 | High | 섹션 8.1 |
| FR-002 | 코드 블록 문법 하이라이팅 지원 | High | TRD 2.2 |
| FR-003 | GFM 확장 구문 지원 (테이블, 체크박스, 취소선) | Medium | - |
| FR-004 | 문서 파일 API 로드 (GET /api/tasks/:id/documents/:filename) | High | PRD 8.1 |
| FR-005 | 로딩 상태 표시 (Skeleton/Spinner) | Medium | PRD 11 |
| FR-006 | 에러 상태 표시 (파일 없음, 로드 실패) | Medium | PRD 11 |
| FR-007 | 스크롤 가능한 컨텐츠 영역 | Low | - |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 렌더링 성능 | 10KB 문서 < 100ms |
| NFR-002 | 번들 사이즈 | Markdown 라이브러리 < 50KB gzipped |
| NFR-003 | 접근성 | Semantic HTML, ARIA 속성 |
| NFR-004 | Dark Blue 테마 일관성 | TRD 2.3.3 색상 팔레트 준수 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
TaskDocuments (부모 컴포넌트)
  └── DocumentViewer
      ├── DocumentLoader (API 호출, 상태 관리)
      ├── MarkdownRenderer (marked/markdown-it 사용)
      └── CodeHighlighter (highlight.js/shiki 통합)
```

**데이터 흐름**:
1. TaskDocuments → 문서 파일명 선택
2. DocumentViewer → props로 taskId, filename 수신
3. DocumentLoader → API 호출 (GET /api/tasks/:id/documents/:filename)
4. MarkdownRenderer → Markdown → HTML 변환
5. CodeHighlighter → 코드 블록 스타일 적용
6. DOM에 렌더링 (v-html 또는 component)

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| **DocumentViewer.vue** | 컨테이너 컴포넌트 | Props 수신, 상태 관리, 레이아웃 |
| **useMarkdownRenderer** | Composable | Markdown → HTML 변환, sanitization |
| **useDocumentLoader** | Composable | API 호출, 캐싱, 에러 처리 |

### 3.3 데이터 흐름

```
[Props: taskId, filename]
  ↓
[useDocumentLoader] → fetch(/api/tasks/:id/documents/:filename)
  ↓
[Markdown String]
  ↓
[useMarkdownRenderer] → marked.parse() or markdownit.render()
  ↓
[HTML String (Sanitized)]
  ↓
[<div v-html="renderedHtml" class="markdown-body">]
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| **Markdown 파서** | marked, markdown-it, remark | **marked** | - 경량 (31KB gzipped)<br>- GFM 지원 내장<br>- 간단한 API<br>- Nuxt/Vue 통합 용이 |
| **코드 하이라이팅** | highlight.js, Prism, shiki | **highlight.js** | - marked와 통합 간편<br>- 언어 팩 자동 로드<br>- 테마 커스터마이징 용이 |
| **HTML Sanitization** | DOMPurify, sanitize-html | **DOMPurify** | - XSS 방지 필수<br>- 브라우저 환경 최적화<br>- marked 권장 라이브러리 |
| **렌더링 방식** | v-html, component-based | **v-html** | - 정적 문서 렌더링<br>- 성능 우수<br>- sanitization 전제 |
| **로딩 UI** | Skeleton, Spinner | **PrimeVue Skeleton** | - TRD 2.3.1 PrimeVue 우선<br>- 일관된 디자인 시스템 |

**핵심 라이브러리 선택 이유**:

- **marked**: markdown-it보다 가볍고 (31KB vs 40KB), 플러그인 없이 GFM 지원
- **highlight.js**: Prism보다 통합이 쉽고, shiki보다 번들 사이즈가 작음
- **DOMPurify**: v-html 사용 시 XSS 공격 방지 필수

---

## 5. 인수 기준

- [ ] AC-01: Markdown 문서를 HTML로 정확하게 렌더링
- [ ] AC-02: 코드 블록에 문법 하이라이팅 적용 (TypeScript, Vue, Bash 등 5개 이상 언어)
- [ ] AC-03: GFM 테이블, 체크박스, 취소선 정상 렌더링
- [ ] AC-04: GET /api/tasks/:id/documents/:filename API 연동 성공
- [ ] AC-05: 로딩 중 PrimeVue Skeleton 표시
- [ ] AC-06: 파일 없음/로드 실패 시 에러 메시지 표시
- [ ] AC-07: Dark Blue 테마 색상 일관성 유지
- [ ] AC-08: 10KB 문서 렌더링 < 100ms
- [ ] AC-09: XSS 방지 (DOMPurify 적용 확인)
- [ ] AC-10: 접근성 검증 (semantic HTML, heading 구조)

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| XSS 취약점 (v-html 사용) | High | DOMPurify로 HTML sanitization 필수 적용 |
| 큰 문서 렌더링 성능 | Medium | Virtual scrolling 또는 lazy rendering (2차) |
| 코드 하이라이팅 테마 불일치 | Low | Custom CSS로 Dark Blue 테마 오버라이드 |
| API 응답 지연 | Low | Skeleton UI + 타임아웃 설정 (5초) |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-01-01-02 | 선행 | PrimeVue 설정 완료 필요 |
| TSK-03-03 | 선행 | GET /api/tasks/:id/documents API 구현 필요 |
| TSK-05-02 | 선행 | TaskDocuments 컴포넌트에서 호출 |

---

## 7. 컴포넌트 설계

### 7.1 DocumentViewer.vue Props/Emits

```typescript
interface Props {
  /** Task ID (API 경로용) */
  taskId: string
  /** 문서 파일명 (예: "010-basic-design.md") */
  filename: string
  /** 최대 높이 (px, 기본값: 600) */
  maxHeight?: number
}

interface Emits {
  /** 문서 로드 완료 이벤트 */
  loaded: [content: string]
  /** 로드 실패 이벤트 */
  error: [error: Error]
}
```

### 7.2 Composables 설계

**useDocumentLoader.ts**
```typescript
interface UseDocumentLoaderOptions {
  taskId: string
  filename: string
  cache?: boolean
}

interface UseDocumentLoaderReturn {
  content: Ref<string | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  load: () => Promise<void>
  reload: () => Promise<void>
}
```

**useMarkdownRenderer.ts**
```typescript
interface UseMarkdownRendererOptions {
  gfm?: boolean
  highlight?: boolean
  sanitize?: boolean
}

interface UseMarkdownRendererReturn {
  render: (markdown: string) => string
  renderedHtml: ComputedRef<string>
}
```

### 7.3 API 명세

**Endpoint**: `GET /api/tasks/:id/documents/:filename`

**Response** (성공):
```json
{
  "content": "# 기본설계\n\n## 1. 목적...",
  "filename": "010-basic-design.md",
  "size": 5242,
  "lastModified": "2025-12-15T10:30:00Z"
}
```

**Response** (실패 - 404):
```json
{
  "error": "Document not found",
  "code": "DOCUMENT_NOT_FOUND"
}
```

---

## 8. 스타일링 설계

### 8.1 Markdown CSS 클래스

TRD 2.3.3 Dark Blue 테마에 맞춘 Markdown 스타일:

```css
.markdown-body {
  /* 타이포그래피 */
  --md-heading-color: #e0e0e0;
  --md-text-color: #b0b0b0;
  --md-link-color: #6c9bcf;
  --md-code-bg: #16213e;
  --md-code-color: #9cdcfe;

  /* 코드 블록 */
  --md-codeblock-bg: #0f0f23;
  --md-codeblock-border: #2a2a4e;

  /* 테이블 */
  --md-table-border: #2a2a4e;
  --md-table-header-bg: #16213e;
}
```

### 8.2 코드 하이라이팅 테마

highlight.js의 `atom-one-dark` 테마를 기반으로 커스터마이징:
- 배경색: `#0f0f23` (TRD sidebar 색상)
- 키워드: `#c678dd`
- 문자열: `#98c379`
- 함수: `#61afef`

---

## 9. 구현 단계

1. **환경 설정** (1h)
   - npm install marked highlight.js dompurify
   - TypeScript 타입 정의 설치

2. **Composables 구현** (2h)
   - useDocumentLoader (API 호출, 캐싱)
   - useMarkdownRenderer (marked + highlight.js)

3. **DocumentViewer 컴포넌트** (3h)
   - 기본 구조 (Props, Emits)
   - 로딩/에러 상태 UI (PrimeVue Skeleton)
   - Markdown 렌더링 영역

4. **스타일링** (2h)
   - markdown-body CSS 작성
   - highlight.js 테마 커스터마이징
   - Dark Blue 테마 적용

5. **API 연동** (1h)
   - Server Route 구현 (GET /api/tasks/:id/documents/:filename)
   - 파일 시스템 읽기
   - 에러 처리

6. **테스트** (2h)
   - 단위 테스트 (useMarkdownRenderer)
   - E2E 테스트 (문서 로드 및 렌더링)

**총 예상 시간**: 11시간

---

## 10. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행 (020-detail-design.md)
- 상세설계에서 다룰 내용:
  - Composables 세부 구현 로직
  - marked 설정 옵션 (renderer, tokenizer)
  - highlight.js 언어 팩 선택
  - DOMPurify 설정 (allowedTags, allowedAttributes)
  - 에러 바운더리 처리
  - 성능 최적화 (memoization, debouncing)

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md`
- TRD: `.jjiban/projects/jjiban/trd.md`
- 상세설계: `020-detail-design.md` (다음 단계)
- 의존 Task:
  - TSK-01-01-02: PrimeVue 설정
  - TSK-03-03: Workflow API & Settings
  - TSK-05-02: Detail Sections

---

<!--
author: AI Agent (Claude Opus 4.5)
Template Version: 1.0.0
Created: 2025-12-15
-->
