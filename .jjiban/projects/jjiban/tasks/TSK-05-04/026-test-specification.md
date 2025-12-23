# 테스트 명세서 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-04 |
| Task명 | Document Viewer |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | Composables, Server Route, documentService | 85% 이상 |
| E2E 테스트 | 주요 사용자 시나리오 (문서 로드, 렌더링, 에러 처리) | 100% 시나리오 커버 |
| 매뉴얼 테스트 | UI/UX, 접근성, 반응형, Dark Blue 테마 | 전체 화면 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest 2.x |
| 테스트 프레임워크 (E2E) | Playwright 1.49.x |
| 테스트 파일 위치 | .jjiban/jjiban/ (테스트 전용 폴더) |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | useMarkdownRenderer | 정상 Markdown 렌더링 | HTML 반환 | FR-001 |
| UT-002 | useMarkdownRenderer | 빈 Markdown | 빈 HTML 반환 | FR-001 |
| UT-003 | useMarkdownRenderer | 코드 블록 하이라이팅 | highlight.js 클래스 포함 | FR-002 |
| UT-004 | useMarkdownRenderer | GFM 구문 (테이블, 체크박스) | 정확한 HTML 변환 | FR-003 |
| UT-005 | useDocumentLoader | API 호출 성공 | content 업데이트 | FR-004 |
| UT-006 | useDocumentLoader | 로딩 상태 | loading = true → false | FR-005 |
| UT-007 | useDocumentLoader | API 호출 실패 | error 업데이트 | FR-006 |
| UT-008 | Server Route | 잘못된 파일명 | 400 에러 | BR-001 |
| UT-009 | Server Route | 경로 탐색 시도 (../) | 400 에러 | BR-002 |
| UT-010 | useMarkdownRenderer | 악성 HTML (XSS) | `<script>` 제거 | BR-003 |
| UT-011 | Server Route | 파일 크기 > 1MB | 400 에러 | BR-004 |

### 2.2 테스트 케이스 상세

#### UT-001: useMarkdownRenderer - 정상 Markdown 렌더링

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useMarkdownRenderer.spec.ts` |
| **테스트 블록** | `describe('useMarkdownRenderer') → it('should render markdown to HTML')` |
| **Mock 의존성** | - |
| **입력 데이터** | `"# 제목\n\n본문 텍스트"` |
| **검증 포인트** | 반환 HTML에 `<h1>제목</h1>`, `<p>본문 텍스트</p>` 포함 |
| **커버리지 대상** | `render()` 메서드 정상 분기 |
| **관련 요구사항** | FR-001 |

#### UT-002: useMarkdownRenderer - 빈 Markdown

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useMarkdownRenderer.spec.ts` |
| **테스트 블록** | `describe('useMarkdownRenderer') → it('should return empty HTML for empty markdown')` |
| **Mock 의존성** | - |
| **입력 데이터** | `""` (빈 문자열) |
| **검증 포인트** | 반환 HTML이 빈 문자열 또는 `""` |
| **커버리지 대상** | `render()` 메서드 빈 입력 처리 |
| **관련 요구사항** | FR-001 |

#### UT-003: useMarkdownRenderer - 코드 블록 하이라이팅

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useMarkdownRenderer.spec.ts` |
| **테스트 블록** | `describe('useMarkdownRenderer') → it('should apply syntax highlighting to code blocks')` |
| **Mock 의존성** | - |
| **입력 데이터** | `` "```typescript\nconst x = 1;\n```" `` |
| **검증 포인트** | 반환 HTML에 `class="hljs"` 또는 highlight.js 클래스 포함 |
| **커버리지 대상** | highlight.js 통합 |
| **관련 요구사항** | FR-002 |

#### UT-004: useMarkdownRenderer - GFM 구문

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useMarkdownRenderer.spec.ts` |
| **테스트 블록** | `describe('useMarkdownRenderer') → it('should render GFM tables and checkboxes')` |
| **Mock 의존성** | - |
| **입력 데이터** | `"\| A \| B \|\n\|---\|---\|\n\| 1 \| 2 \|"`, `"- [ ] Todo\n- [x] Done"` |
| **검증 포인트** | `<table>`, `<input type="checkbox">` 태그 포함 |
| **커버리지 대상** | GFM 확장 구문 처리 |
| **관련 요구사항** | FR-003 |

#### UT-005: useDocumentLoader - API 호출 성공

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useDocumentLoader.spec.ts` |
| **테스트 블록** | `describe('useDocumentLoader') → it('should load document content successfully')` |
| **Mock 의존성** | $fetch (성공 응답 모킹) |
| **입력 데이터** | `{ taskId: 'TSK-05-04', filename: '010-basic-design.md' }` |
| **검증 포인트** | `content.value = "# 기본설계"`, `loading.value = false`, `error.value = null` |
| **커버리지 대상** | `load()` 메서드 성공 분기 |
| **관련 요구사항** | FR-004 |

#### UT-006: useDocumentLoader - 로딩 상태

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useDocumentLoader.spec.ts` |
| **테스트 블록** | `describe('useDocumentLoader') → it('should set loading state during API call')` |
| **Mock 의존성** | $fetch (지연 응답 모킹) |
| **입력 데이터** | `{ taskId: 'TSK-05-04', filename: '010-basic-design.md' }` |
| **검증 포인트** | API 호출 중 `loading.value = true`, 완료 후 `loading.value = false` |
| **커버리지 대상** | 로딩 상태 관리 |
| **관련 요구사항** | FR-005 |

#### UT-007: useDocumentLoader - API 호출 실패

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useDocumentLoader.spec.ts` |
| **테스트 블록** | `describe('useDocumentLoader') → it('should handle API errors')` |
| **Mock 의존성** | $fetch (에러 응답 모킹: 404) |
| **입력 데이터** | `{ taskId: 'TSK-05-04', filename: 'not-found.md' }` |
| **검증 포인트** | `error.value.message = "DOCUMENT_NOT_FOUND"`, `loading.value = false` |
| **커버리지 대상** | `load()` 메서드 에러 처리 |
| **관련 요구사항** | FR-006 |

#### UT-008: Server Route - 잘못된 파일명

| 항목 | 내용 |
|------|------|
| **파일** | `server/api/tasks/[id]/documents/__tests__/[filename].spec.ts` |
| **테스트 블록** | `describe('GET /api/tasks/:id/documents/:filename') → it('should reject invalid filename')` |
| **Mock 의존성** | - |
| **입력 데이터** | `filename = "invalid_name.md"` (숫자 없음) |
| **검증 포인트** | 응답 상태 400, 에러 코드 `INVALID_FILENAME` |
| **커버리지 대상** | 파일명 정규식 검증 |
| **관련 요구사항** | BR-001 |

#### UT-009: Server Route - 경로 탐색 시도

| 항목 | 내용 |
|------|------|
| **파일** | `server/api/tasks/[id]/documents/__tests__/[filename].spec.ts` |
| **테스트 블록** | `describe('GET /api/tasks/:id/documents/:filename') → it('should reject path traversal')` |
| **Mock 의존성** | - |
| **입력 데이터** | `filename = "../../../etc/passwd"` |
| **검증 포인트** | 응답 상태 400, 에러 코드 `INVALID_PATH` |
| **커버리지 대상** | 경로 탐색 금지 로직 |
| **관련 요구사항** | BR-002 |

#### UT-010: useMarkdownRenderer - XSS 방지

| 항목 | 내용 |
|------|------|
| **파일** | `composables/__tests__/useMarkdownRenderer.spec.ts` |
| **테스트 블록** | `describe('useMarkdownRenderer') → it('should sanitize malicious HTML')` |
| **Mock 의존성** | - |
| **입력 데이터** | `"<script>alert('XSS')</script>"` |
| **검증 포인트** | 반환 HTML에 `<script>` 태그 없음 |
| **커버리지 대상** | DOMPurify.sanitize() 적용 |
| **관련 요구사항** | BR-003 |

#### UT-011: Server Route - 파일 크기 제한

| 항목 | 내용 |
|------|------|
| **파일** | `server/api/tasks/[id]/documents/__tests__/[filename].spec.ts` |
| **테스트 블록** | `describe('GET /api/tasks/:id/documents/:filename') → it('should reject files larger than 1MB')` |
| **Mock 의존성** | fs.stat (파일 크기 > 1MB 모킹) |
| **입력 데이터** | `filename = "large-file.md"` (1.5MB) |
| **검증 포인트** | 응답 상태 400, 에러 메시지 "파일이 너무 큽니다" |
| **커버리지 대상** | 파일 크기 검증 |
| **관련 요구사항** | BR-004 |

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 문서 표시 및 코드 하이라이팅 | Task 문서 존재 | 1. 문서 선택 | 문서 렌더링, 코드 블록 하이라이팅 | FR-001, FR-002 |
| E2E-002 | GFM 렌더링 확인 | 테이블, 체크박스 포함 문서 | 1. 문서 선택 | 테이블, 체크박스 정상 표시 | FR-003 |
| E2E-003 | 문서 API 연동 | Task 문서 존재 | 1. 문서 선택 | API 호출 확인, 내용 표시 | FR-004 |
| E2E-004 | 로딩 상태 표시 | 네트워크 지연 시뮬레이션 | 1. 문서 선택 | Skeleton 표시 | FR-005 |
| E2E-005 | 에러 상태 표시 | 존재하지 않는 문서 | 1. 문서 선택 | 에러 메시지 표시 | FR-006 |
| E2E-006 | 스크롤 동작 | 긴 문서 | 1. 문서 선택 2. 스크롤 | 스크롤 동작 확인 | FR-007 |
| E2E-007 | 파일명 검증 | 잘못된 파일명 | 1. 잘못된 파일명 요청 | 에러 표시 | BR-001 |
| E2E-008 | 경로 탐색 방지 | 경로 탐색 시도 | 1. ../ 포함 파일명 요청 | 에러 표시 | BR-002 |
| E2E-009 | XSS 방지 | 악성 HTML 포함 문서 | 1. 문서 선택 | `<script>` 실행 안됨 | BR-003 |
| E2E-010 | 파일 크기 제한 | 대용량 문서 (>1MB) | 1. 문서 선택 | 에러 메시지 표시 | BR-004 |

### 3.2 테스트 케이스 상세

#### E2E-001: 문서 표시 및 코드 하이라이팅

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('사용자가 Task 문서를 조회하고 코드 블록 하이라이팅을 확인할 수 있다')` |
| **사전조건** | `.jjiban/jjiban/tasks/TSK-TEST-01/010-basic-design.md` 존재 |
| **data-testid 셀렉터** | |
| - 문서 뷰어 | `[data-testid="document-viewer"]` |
| - Markdown 본문 | `[data-testid="markdown-body"]` |
| - 코드 블록 | `.markdown-body pre code` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="document-item-010-basic-design"]')` |
| 2 | `await page.waitForSelector('[data-testid="markdown-body"]')` |
| **API 확인** | `GET /api/tasks/TSK-TEST-01/documents/010-basic-design.md` → 200 |
| **검증 포인트** | `expect(page.locator('.markdown-body h1')).toContainText('기본설계')` |
| **검증 포인트** | `expect(page.locator('.markdown-body pre code')).toHaveClass(/hljs/)` |
| **스크린샷** | `e2e-001-document-rendered.png` |
| **관련 요구사항** | FR-001, FR-002 |

#### E2E-002: GFM 렌더링 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('GFM 확장 구문(테이블, 체크박스)이 정상 렌더링된다')` |
| **사전조건** | 테이블, 체크박스 포함 문서 존재 |
| **data-testid 셀렉터** | |
| - 테이블 | `.markdown-body table` |
| - 체크박스 | `.markdown-body input[type="checkbox"]` |
| **실행 단계** | |
| 1 | 문서 선택 |
| 2 | 테이블, 체크박스 요소 확인 |
| **검증 포인트** | `expect(page.locator('.markdown-body table')).toBeVisible()` |
| **검증 포인트** | `expect(page.locator('.markdown-body input[type="checkbox"]')).toHaveCount(2)` |
| **스크린샷** | `e2e-002-gfm-rendered.png` |
| **관련 요구사항** | FR-003 |

#### E2E-003: 문서 API 연동

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('문서 API가 정상적으로 호출되고 내용이 표시된다')` |
| **사전조건** | Task 문서 존재 |
| **API 모니터링** | `page.on('request', ...)` |
| **실행 단계** | |
| 1 | API 요청 감지 시작 |
| 2 | 문서 선택 |
| 3 | API 호출 확인 |
| **API 확인** | `GET /api/tasks/TSK-TEST-01/documents/010-basic-design.md` → 200 |
| **검증 포인트** | API 응답 { content, filename, size, lastModified } 포함 |
| **검증 포인트** | `expect(page.locator('[data-testid="markdown-body"]')).toBeVisible()` |
| **스크린샷** | `e2e-003-api-success.png` |
| **관련 요구사항** | FR-004 |

#### E2E-004: 로딩 상태 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('문서 로드 중 Skeleton UI가 표시된다')` |
| **사전조건** | 네트워크 지연 시뮬레이션 (1초) |
| **data-testid 셀렉터** | |
| - Skeleton | `[data-testid="document-skeleton"]` |
| **실행 단계** | |
| 1 | 네트워크 지연 설정 (`page.route('**/documents/**', ...)`) |
| 2 | 문서 선택 |
| 3 | Skeleton 표시 확인 |
| **검증 포인트** | `expect(page.locator('[data-testid="document-skeleton"]')).toBeVisible()` |
| **검증 포인트** | 로드 완료 후 Skeleton 사라짐 |
| **스크린샷** | `e2e-004-loading.png` |
| **관련 요구사항** | FR-005 |

#### E2E-005: 에러 상태 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('존재하지 않는 문서 선택 시 에러 메시지가 표시된다')` |
| **사전조건** | 존재하지 않는 문서 파일명 |
| **data-testid 셀렉터** | |
| - 에러 메시지 | `[data-testid="document-error"]` |
| - 재시도 버튼 | `[data-testid="retry-btn"]` |
| **실행 단계** | |
| 1 | 존재하지 않는 문서 선택 |
| 2 | 에러 메시지 표시 확인 |
| **API 확인** | `GET /api/tasks/.../not-found.md` → 404 |
| **검증 포인트** | `expect(page.locator('[data-testid="document-error"]')).toContainText('찾을 수 없습니다')` |
| **검증 포인트** | 재시도 버튼 존재 확인 |
| **스크린샷** | `e2e-005-error.png` |
| **관련 요구사항** | FR-006 |

#### E2E-006: 스크롤 동작

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('긴 문서에서 스크롤이 정상 동작한다')` |
| **사전조건** | 긴 문서 (> maxHeight) |
| **data-testid 셀렉터** | |
| - 문서 컨테이너 | `[data-testid="document-viewer"]` |
| **실행 단계** | |
| 1 | 긴 문서 선택 |
| 2 | 스크롤 다운 (`page.locator('...').evaluate(...)`) |
| **검증 포인트** | 스크롤 위치 변경 확인 (`scrollTop > 0`) |
| **검증 포인트** | overflow-y: auto 스타일 적용 확인 |
| **스크린샷** | `e2e-006-scroll.png` |
| **관련 요구사항** | FR-007 |

#### E2E-007: 파일명 검증

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('잘못된 파일명 형식 요청 시 에러가 표시된다')` |
| **사전조건** | 잘못된 파일명 (패턴 불일치) |
| **data-testid 셀렉터** | |
| - 에러 메시지 | `[data-testid="document-error"]` |
| **실행 단계** | |
| 1 | 잘못된 파일명으로 API 직접 호출 |
| **API 확인** | `GET /api/tasks/.../invalid_name.md` → 400 |
| **검증 포인트** | 에러 코드 `INVALID_FILENAME` |
| **스크린샷** | `e2e-007-invalid-filename.png` |
| **관련 요구사항** | BR-001 |

#### E2E-008: 경로 탐색 방지

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('경로 탐색 시도(../)가 차단된다')` |
| **사전조건** | ../ 포함 파일명 |
| **data-testid 셀렉터** | |
| - 에러 메시지 | `[data-testid="document-error"]` |
| **실행 단계** | |
| 1 | `../../../etc/passwd` 파일명으로 API 호출 |
| **API 확인** | `GET /api/tasks/.../.../etc/passwd` → 400 |
| **검증 포인트** | 에러 코드 `INVALID_PATH` |
| **스크린샷** | `e2e-008-path-traversal.png` |
| **관련 요구사항** | BR-002 |

#### E2E-009: XSS 방지

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('악성 HTML이 sanitization되어 스크립트가 실행되지 않는다')` |
| **사전조건** | `<script>` 태그 포함 문서 |
| **실행 단계** | |
| 1 | 악성 HTML 포함 문서 선택 |
| 2 | 페이지 콘솔 감시 (alert 실행 여부) |
| **검증 포인트** | `expect(page.locator('.markdown-body script')).toHaveCount(0)` |
| **검증 포인트** | alert 실행 안됨 |
| **스크린샷** | `e2e-009-xss-prevented.png` |
| **관련 요구사항** | BR-003 |

#### E2E-010: 파일 크기 제한

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/document-viewer.spec.ts` |
| **테스트명** | `test('1MB 초과 파일 요청 시 에러가 표시된다')` |
| **사전조건** | 1.5MB 크기의 문서 파일 |
| **data-testid 셀렉터** | |
| - 에러 메시지 | `[data-testid="document-error"]` |
| **실행 단계** | |
| 1 | 대용량 문서 선택 |
| **API 확인** | `GET /api/tasks/.../large-file.md` → 400 |
| **검증 포인트** | 에러 메시지 "파일이 너무 큽니다" 포함 |
| **스크린샷** | `e2e-010-file-size-limit.png` |
| **관련 요구사항** | BR-004 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 문서 렌더링 | Task 문서 존재 | 1. 문서 선택 | Markdown 정상 표시 | High | FR-001 |
| TC-002 | 코드 하이라이팅 | 코드 블록 포함 문서 | 1. 문서 선택 | 코드 색상 적용 | High | FR-002 |
| TC-003 | GFM 확인 | 테이블, 체크박스 포함 | 1. 문서 선택 | 정확한 렌더링 | Medium | FR-003 |
| TC-004 | API 연동 | 문서 존재 | 1. 문서 선택 | 내용 로드 | High | FR-004 |
| TC-005 | 로딩 상태 | 느린 네트워크 | 1. 문서 선택 | Skeleton 표시 | Medium | FR-005 |
| TC-006 | 에러 상태 | 문서 없음 | 1. 문서 선택 | 에러 메시지 | Medium | FR-006 |
| TC-007 | 스크롤 | 긴 문서 | 1. 스크롤 동작 | 정상 스크롤 | Low | FR-007 |
| TC-008 | Dark Blue 테마 | - | 1. 색상 확인 | 테마 일관성 | Medium | NFR-004 |
| TC-009 | 반응형 | - | 1. 브라우저 크기 조절 | 레이아웃 적응 | Medium | - |
| TC-010 | 접근성 | - | 1. 키보드 탐색 | 모든 요소 접근 가능 | Medium | NFR-003 |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 문서 렌더링

**테스트 목적**: 사용자가 Task 문서를 선택하여 Markdown 렌더링을 확인

**테스트 단계**:
1. Task 상세 패널에서 "Documents" 탭 클릭
2. "010-basic-design.md" 문서 선택
3. DocumentViewer에 내용 표시 확인

**예상 결과**:
- Markdown이 HTML로 정확히 변환됨
- 제목, 본문, 리스트, 테이블 등 정상 표시
- 링크 클릭 시 새 탭에서 열림

**검증 기준**:
- [ ] 제목 (h1~h6) 계층 구조 유지
- [ ] 본문 텍스트 가독성 확보
- [ ] 링크 색상 (#6c9bcf) 적용

#### TC-002: 코드 하이라이팅

**테스트 목적**: 코드 블록 문법 하이라이팅 확인

**테스트 단계**:
1. TypeScript 코드 블록 포함 문서 선택
2. 코드 블록 색상 확인

**예상 결과**:
- 키워드, 문자열, 함수에 색상 적용
- 배경색: #0f0f23 (Dark Blue)
- 코드 폰트: monospace

**검증 기준**:
- [ ] 키워드 색상: #c678dd (보라)
- [ ] 문자열 색상: #98c379 (초록)
- [ ] 함수 색상: #61afef (파랑)

#### TC-003: GFM 확인

**테스트 목적**: GitHub Flavored Markdown 확장 구문 렌더링 확인

**테스트 단계**:
1. 테이블, 체크박스, 취소선 포함 문서 선택
2. 각 요소 렌더링 확인

**예상 결과**:
- 테이블: 경계선, 헤더 배경색 적용
- 체크박스: 비활성화 상태 (표시 전용)
- 취소선: `<del>` 태그로 렌더링

**검증 기준**:
- [ ] 테이블 헤더 배경: #16213e
- [ ] 체크박스 비활성화 (클릭 불가)
- [ ] 취소선 텍스트 스타일 적용

#### TC-004: API 연동

**테스트 목적**: 문서 API 정상 호출 및 데이터 로드 확인

**테스트 단계**:
1. 브라우저 개발자 도구 Network 탭 열기
2. 문서 선택
3. API 요청/응답 확인

**예상 결과**:
- GET /api/tasks/:id/documents/:filename 호출
- 200 응답, { content, filename, size, lastModified } 반환
- 내용이 화면에 표시됨

**검증 기준**:
- [ ] API 호출 성공 (200)
- [ ] 응답 데이터 구조 일치
- [ ] 내용 정확히 렌더링

#### TC-005: 로딩 상태

**테스트 목적**: 문서 로드 중 로딩 UI 표시 확인

**테스트 단계**:
1. 네트워크를 Slow 3G로 설정
2. 문서 선택
3. 로딩 상태 UI 확인

**예상 결과**:
- PrimeVue Skeleton 컴포넌트 표시
- 로드 완료 후 Skeleton 사라짐
- 문서 내용 표시

**검증 기준**:
- [ ] Skeleton 애니메이션 동작
- [ ] 로드 완료 후 자동 전환

#### TC-006: 에러 상태

**테스트 목적**: 문서 로드 실패 시 에러 메시지 표시 확인

**테스트 단계**:
1. 존재하지 않는 문서 선택 (또는 서버 중단)
2. 에러 메시지 확인
3. 재시도 버튼 클릭

**예상 결과**:
- 에러 메시지: "문서를 찾을 수 없습니다"
- 재시도 버튼 표시
- 버튼 클릭 시 재로드 시도

**검증 기준**:
- [ ] 명확한 에러 메시지
- [ ] 재시도 버튼 동작 확인

#### TC-007: 스크롤

**테스트 목적**: 긴 문서에서 스크롤 동작 확인

**테스트 단계**:
1. 긴 문서 (>600px) 선택
2. 스크롤바 확인
3. 마우스 휠 또는 드래그로 스크롤

**예상 결과**:
- 세로 스크롤바 표시
- 스크롤 동작 부드러움
- 고정 높이 (maxHeight) 적용

**검증 기준**:
- [ ] overflow-y: auto 적용
- [ ] 스크롤바 스타일 일관성

#### TC-008: Dark Blue 테마

**테스트 목적**: Dark Blue 테마 색상 일관성 확인

**테스트 단계**:
1. 문서 렌더링 후 색상 확인
2. TRD 2.3.3 색상 팔레트와 비교

**예상 결과**:
- 배경: #0f0f23 (코드 블록)
- 텍스트: #e0e0e0 (제목), #b0b0b0 (본문)
- 링크: #6c9bcf
- 경계선: #2a2a4e

**검증 기준**:
- [ ] 모든 색상 팔레트 일치
- [ ] 가독성 확보

#### TC-009: 반응형

**테스트 목적**: 다양한 화면 크기에서 레이아웃 적응 확인

**테스트 단계**:
1. Desktop (1920px): 전체 너비
2. Tablet (768px): 폰트 크기 조정
3. Mobile (375px): 코드 블록 가로 스크롤

**예상 결과**:
- 모든 화면 크기에서 가독성 유지
- 코드 블록 가로 스크롤 (모바일)
- 테이블 반응형 처리

**검증 기준**:
- [ ] 레이아웃 깨짐 없음
- [ ] 폰트 크기 적절

#### TC-010: 접근성

**테스트 목적**: 키보드 탐색 및 스크린 리더 호환성 확인

**테스트 단계**:
1. Tab 키로 링크 이동
2. Enter 키로 링크 클릭
3. 스크린 리더로 문서 읽기

**예상 결과**:
- 모든 링크 Tab 키로 접근 가능
- 포커스 스타일 명확
- Heading 구조 올바름 (h1 → h2 → h3)
- ARIA 라벨 적용

**검증 기준**:
- [ ] 키보드 내비게이션 가능
- [ ] 포커스 표시 명확
- [ ] 스크린 리더 호환

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-MARKDOWN-SIMPLE | 기본 렌더링 | `"# 제목\n\n본문 텍스트"` |
| MOCK-MARKDOWN-CODE | 코드 블록 | `` "```typescript\nconst x = 1;\n```" `` |
| MOCK-MARKDOWN-TABLE | 테이블 | `"\| A \| B \|\n\|---\|---\|\n\| 1 \| 2 \|"` |
| MOCK-MARKDOWN-CHECKBOX | 체크박스 | `"- [ ] Todo\n- [x] Done"` |
| MOCK-MARKDOWN-XSS | 악성 HTML | `"<script>alert('XSS')</script>"` |
| MOCK-API-RESPONSE-SUCCESS | API 성공 | `{ content: "# 기본설계", filename: "010-basic-design.md", size: 5242, lastModified: "2025-12-15T10:00:00Z" }` |
| MOCK-API-RESPONSE-404 | API 실패 (404) | `{ error: "Document not found", code: "DOCUMENT_NOT_FOUND" }` |

### 5.2 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-E2E-DOCUMENTS | 기본 문서 환경 | 자동 시드 | TSK-TEST-01 문서 5개 (010~050) |
| SEED-E2E-LARGE-DOC | 긴 문서 (스크롤 테스트) | 자동 시드 | 100KB 문서 1개 |
| SEED-E2E-XSS-DOC | XSS 테스트 문서 | 자동 시드 | `<script>` 포함 문서 1개 |
| SEED-E2E-INVALID-FILENAME | 잘못된 파일명 | 수동 설정 | `invalid_name.md` |

### 5.3 테스트 문서 샘플

#### SEED-E2E-DOCUMENTS: 010-basic-design.md

```markdown
# 기본설계 (010-basic-design.md)

## 1. 목적 및 범위

테스트용 기본설계 문서입니다.

### 1.1 목적

- 목적 1
- 목적 2

## 2. 코드 예시

```typescript
const greeting = "Hello, World!";
console.log(greeting);
```

## 3. 테이블

| 항목 | 설명 |
|------|------|
| A | 내용 A |
| B | 내용 B |

## 4. 체크박스

- [ ] Todo 1
- [x] Done 1
```

---

## 6. data-testid 목록

> 프론트엔드 컴포넌트에 적용할 `data-testid` 속성 정의

### 6.1 DocumentViewer 컴포넌트

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `document-viewer` | 컴포넌트 컨테이너 | 컴포넌트 로드 확인 |
| `document-skeleton` | PrimeVue Skeleton | 로딩 상태 확인 |
| `document-error` | 에러 메시지 컨테이너 | 에러 상태 확인 |
| `retry-btn` | 재시도 버튼 | 재시도 액션 |
| `markdown-body` | Markdown 렌더링 영역 | 렌더링 결과 확인 |

### 6.2 TaskDocuments 컴포넌트 (상위)

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `document-list` | 문서 목록 | 문서 목록 확인 |
| `document-item-{filename}` | 문서 아이템 | 특정 문서 선택 |

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 85% | 75% |
| Branches | 80% | 70% |
| Functions | 90% | 80% |
| Statements | 85% | 75% |

### 7.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 |
| 비즈니스 규칙 (BR) | 100% 커버 |
| 에러 케이스 | 100% 커버 |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`

---

<!--
author: AI Agent (Claude Opus 4.5)
Template Version: 1.0.0
Created: 2025-12-15
-->
