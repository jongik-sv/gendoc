# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-05 |
| Task명 | TaskDetailPanel Dialog Migration |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 추적성 매트릭스 개요

본 문서는 TSK-08-05의 요구사항(PRD, TRD, wbs.md) → 기본설계 → 상세설계 → 테스트 케이스 간의 추적성을 보장합니다.

---

## 2. PRD → 기본설계 → 상세설계 추적성

| PRD 요구사항 | 기본설계 FR ID | 상세설계 섹션 | 구현 방법 | 테스트 케이스 |
|------------|--------------|-------------|----------|-------------|
| PRD 6.3: Task Detail Panel | FR-001 | 섹션 7.1 | TaskDetailPanel Dialog CSS 클래스화 | TC-001 |
| PRD 10.1: UI 디자인 시스템 (Dark Blue) | FR-007 | 섹션 6.2 | CSS 변수 매핑표 | TC-008 |
| TRD 2.3.6: CSS 클래스 중앙화 | FR-005 | 섹션 6.1 | main.css 클래스 정의 | TC-005 |
| TRD 2.3.6: 인라인 스타일 금지 | FR-001~FR-004 | 섹션 7.1~7.4 | :style 제거, :class 바인딩 | TC-001~TC-004 |
| wbs.md: TaskWorkflow WORKFLOW_THEME 제거 | FR-002 | 섹션 7.2 | getNodeClass() 구현 | TC-002 |
| wbs.md: TaskHistory HISTORY_THEME 제거 | FR-003 | 섹션 7.3 | getEntryMarkerClass() 구현 | TC-003 |
| wbs.md: TaskDocuments 인라인 스타일 제거 | FR-004 | 섹션 7.4 | getDocumentCardClasses() 확장 | TC-004 |
| wbs.md: themeConfig.ts 의존성 완전 제거 | FR-006 | 섹션 5.3 | 파일 삭제 | TC-006 |

---

## 3. 기능 요구사항 추적성 (FR)

### 3.1 FR-001: TaskDetailPanel 인라인 스타일 제거

| 항목 | 내용 |
|------|------|
| 출처 | wbs.md, 기본설계 섹션 1.2 |
| 기본설계 | 섹션 3.2 (해결책) |
| 상세설계 | 섹션 7.1 (컴포넌트 인터페이스) |
| 구현 파일 | TaskDetailPanel.vue, main.css |
| 수용 기준 | :style 속성 1건 (max-height 동적 계산 예외) |
| 테스트 케이스 | TC-001: Dialog width CSS 클래스 검증 |

**변경 내용**:
- Dialog `:style="{ width: '80vw', maxWidth: '1200px' }"` → `class="document-viewer-dialog"`
- main.css에 `.document-viewer-dialog { width: 80vw; max-width: 1200px; }` 추가

**검증 방법**:
- Grep 검색: `<Dialog` 태그에 `:style` 속성 없음
- 브라우저 개발자 도구: width 80vw, max-width 1200px 확인

---

### 3.2 FR-002: TaskWorkflow WORKFLOW_THEME 제거

| 항목 | 내용 |
|------|------|
| 출처 | wbs.md, 기본설계 섹션 1.2 |
| 기본설계 | 섹션 3.3 (해결책) |
| 상세설계 | 섹션 7.2 (컴포넌트 인터페이스) |
| 구현 파일 | TaskWorkflow.vue, main.css |
| 수용 기준 | WORKFLOW_THEME import 전무, CSS 클래스 3개 정의 |
| 테스트 케이스 | TC-002: 워크플로우 노드 색상 일치 검증 |

**변경 내용**:
- `import { WORKFLOW_THEME } from '~/utils/themeConfig'` 제거
- `getNodeStyle()` 제거, `getNodeClass()` 구현
- main.css에 `.workflow-node-completed`, `.workflow-node-current`, `.workflow-node-pending` 추가

**검증 방법**:
- Grep 검색: `WORKFLOW_THEME` 문자열 0건
- E2E 테스트: data-testid="workflow-node-current" 요소 색상 #3b82f6 확인

---

### 3.3 FR-003: TaskHistory HISTORY_THEME 제거

| 항목 | 내용 |
|------|------|
| 출처 | wbs.md, 기본설계 섹션 1.2 |
| 기본설계 | 섹션 3.4 (해결책) |
| 상세설계 | 섹션 7.3 (컴포넌트 인터페이스) |
| 구현 파일 | TaskHistory.vue, main.css |
| 수용 기준 | HISTORY_THEME import 전무, CSS 클래스 4개 정의 |
| 테스트 케이스 | TC-003: 이력 마커 색상 일치 검증 |

**변경 내용**:
- `import { HISTORY_THEME } from '~/utils/themeConfig'` 제거
- `getEntryColor()` 제거, `getEntryMarkerClass()` 구현
- `getEntryIcon()` switch 문으로 변경
- main.css에 `.history-marker-transition`, `.history-marker-action`, `.history-marker-update`, `.history-marker-default` 추가

**검증 방법**:
- Grep 검색: `HISTORY_THEME` 문자열 0건
- E2E 테스트: data-testid="history-entry-0" 마커 색상 확인

---

### 3.4 FR-004: TaskDocuments 인라인 스타일 제거

| 항목 | 내용 |
|------|------|
| 출처 | wbs.md, 기본설계 섹션 1.2 |
| 기본설계 | 섹션 3.5 (해결책) |
| 상세설계 | 섹션 7.4 (컴포넌트 인터페이스) |
| 구현 파일 | TaskDocuments.vue, main.css |
| 수용 기준 | getDocumentCardStyle 제거, CSS 클래스 2개 정의 |
| 테스트 케이스 | TC-004: 문서 카드 스타일 일치 검증 |

**변경 내용**:
- `getDocumentCardStyle()` 함수 제거
- `getDocumentCardClasses()` 함수 확장 (doc-card-* 클래스 포함)
- main.css에 `.doc-card-exists`, `.doc-card-expected` 추가

**검증 방법**:
- Grep 검색: `getDocumentCardStyle` 함수 0건
- E2E 테스트: data-testid="document-exists-*" 요소 배경색 #dbeafe 확인

---

### 3.5 FR-005: CSS 클래스 정의

| 항목 | 내용 |
|------|------|
| 출처 | 기본설계 섹션 1.2 |
| 기본설계 | 섹션 5 (main.css 통합 스타일 정의) |
| 상세설계 | 섹션 6.1 (CSS 클래스 설계) |
| 구현 파일 | main.css |
| 수용 기준 | .workflow-*, .history-marker-*, .doc-card-* 클래스 존재 |
| 테스트 케이스 | TC-005: main.css 클래스 정의 검증 |

**추가할 CSS 클래스**:
1. `.document-viewer-dialog` (1개)
2. `.workflow-node-completed`, `.workflow-node-current`, `.workflow-node-pending` (3개)
3. `.history-marker-transition`, `.history-marker-action`, `.history-marker-update`, `.history-marker-default` (4개)
4. `.doc-card-exists`, `.doc-card-expected` (2개)

**총 10개 클래스**

**검증 방법**:
- main.css 파일 확인: 10개 클래스 존재
- CSS 변수 매핑 정확성: HEX 값 일치

---

### 3.6 FR-006: themeConfig.ts 삭제

| 항목 | 내용 |
|------|------|
| 출처 | wbs.md, 기본설계 섹션 1.2 |
| 기본설계 | 섹션 3.6 (themeConfig.ts 제거) |
| 상세설계 | 섹션 5.3 (파일 변경 목록) |
| 구현 파일 | app/utils/themeConfig.ts (삭제) |
| 수용 기준 | 파일 미존재, import 검색 0건 |
| 테스트 케이스 | TC-006: themeConfig.ts 의존성 검증 |

**삭제 조건**:
1. TaskWorkflow.vue에서 WORKFLOW_THEME import 제거 완료
2. TaskHistory.vue에서 HISTORY_THEME import 제거 완료
3. 전체 프로젝트에서 themeConfig.ts import 검색 결과 0건

**검증 방법**:
- Grep 검색: `from '~/utils/themeConfig'` 문자열 0건
- 파일 존재 확인: `app/utils/themeConfig.ts` 미존재

---

### 3.7 FR-007: 기존 기능 유지

| 항목 | 내용 |
|------|------|
| 출처 | 기본설계 섹션 1.2 |
| 기본설계 | 섹션 10 (수용 기준) |
| 상세설계 | 섹션 9.2 (시각적 일관성 유지) |
| 구현 파일 | 모든 컴포넌트 |
| 수용 기준 | 시각적 모습 및 동작 100% 유지 |
| 테스트 케이스 | TC-007: 시각적 회귀 테스트 |

**검증 항목**:
- 색상 일치: CSS 변수 매핑 정확성
- 레이아웃 일치: Tailwind 클래스 조합
- 애니메이션 유지: transform, box-shadow
- data-testid 유지: E2E 테스트 호환성

**검증 방법**:
- Before/After 스크린샷 비교
- 브라우저 개발자 도구 Computed Style 확인
- E2E 테스트 실행

---

## 4. 비기능 요구사항 추적성 (NFR)

### 4.1 NFR-001: 유지보수성

| 항목 | 내용 |
|------|------|
| 출처 | 기본설계 섹션 1.3 |
| 측정 기준 | CSS 클래스 중앙화로 스타일 변경 용이성 |
| 구현 방법 | main.css에 모든 스타일 정의 |
| 검증 방법 | 색상 변경 시 main.css만 수정으로 전체 반영 확인 |

---

### 4.2 NFR-002: 일관성

| 항목 | 내용 |
|------|------|
| 출처 | 기본설계 섹션 1.3 |
| 측정 기준 | PRD 10.1 Dark Blue 테마와 100% 일치 |
| 구현 방법 | CSS 변수 매핑표 (섹션 6.2) |
| 검증 방법 | 브라우저 개발자 도구 Computed Style 비교 |
| 테스트 케이스 | TC-008: CSS 변수 매핑 검증 |

---

### 4.3 NFR-003: 테스트 호환성

| 항목 | 내용 |
|------|------|
| 출처 | 기본설계 섹션 1.3 |
| 측정 기준 | 기존 E2E 테스트 data-testid 유지 |
| 구현 방법 | 모든 컴포넌트 data-testid 속성 보존 |
| 검증 방법 | Grep 검색으로 data-testid 속성 확인 |

---

### 4.4 NFR-004: 성능

| 항목 | 내용 |
|------|------|
| 출처 | 기본설계 섹션 1.3 |
| 측정 기준 | 렌더링 성능 영향 < 5% |
| 구현 방법 | CSS 클래스 사용으로 스타일 계산 최적화 |
| 검증 방법 | Chrome DevTools Performance 탭 측정 |

---

## 5. 테스트 케이스 추적성

| 테스트 케이스 ID | FR/NFR ID | 테스트 유형 | 우선순위 |
|-----------------|-----------|-----------|---------|
| TC-001 | FR-001 | Unit | High |
| TC-002 | FR-002 | E2E | High |
| TC-003 | FR-003 | E2E | High |
| TC-004 | FR-004 | E2E | High |
| TC-005 | FR-005 | Integration | High |
| TC-006 | FR-006 | Integration | High |
| TC-007 | FR-007 | E2E | Critical |
| TC-008 | NFR-002 | Integration | Medium |

---

## 6. 구현 추적성

### 6.1 파일별 요구사항 매핑

| 파일 경로 | FR ID | 변경 내용 | 테스트 케이스 |
|----------|-------|----------|-------------|
| app/assets/css/main.css | FR-005 | .workflow-*, .history-marker-*, .doc-card-* 클래스 추가 | TC-005, TC-008 |
| app/components/wbs/detail/TaskDetailPanel.vue | FR-001 | Dialog :style → class 변환 | TC-001 |
| app/components/wbs/detail/TaskWorkflow.vue | FR-002 | WORKFLOW_THEME 제거, getNodeClass 구현 | TC-002 |
| app/components/wbs/detail/TaskHistory.vue | FR-003 | HISTORY_THEME 제거, getEntryMarkerClass 구현 | TC-003 |
| app/components/wbs/detail/TaskDocuments.vue | FR-004 | getDocumentCardStyle 제거, getDocumentCardClasses 확장 | TC-004 |
| app/utils/themeConfig.ts | FR-006 | 파일 삭제 | TC-006 |

### 6.2 함수별 요구사항 매핑

| 함수명 | 컴포넌트 | FR ID | 입력 | 출력 | 테스트 케이스 |
|--------|---------|-------|------|------|-------------|
| getNodeClass | TaskWorkflow.vue | FR-002 | index: number | string (CSS 클래스) | TC-002 |
| getEntryMarkerClass | TaskHistory.vue | FR-003 | entry: HistoryEntry | string (CSS 클래스) | TC-003 |
| getEntryIcon | TaskHistory.vue | FR-003 | entry: HistoryEntry | string (PrimeIcon) | TC-003 |
| getDocumentCardClasses | TaskDocuments.vue | FR-004 | doc: DocumentInfo | string[] (CSS 클래스 배열) | TC-004 |

---

## 7. 리스크 추적성

| 위험 요소 | 관련 FR/NFR | 완화 방안 | 검증 방법 |
|----------|------------|----------|----------|
| 색상 시각적 불일치 | FR-007, NFR-002 | CSS 변수 매핑표 작성, Before/After 비교 | TC-007, TC-008 |
| E2E 테스트 실패 | NFR-003 | data-testid 속성 유지 확인 | Grep 검색 |
| CSS 변수 참조 오류 | FR-005 | tailwind.config.ts 검증 | TypeScript 컴파일 |
| themeConfig.ts 다른 의존성 | FR-006 | 전체 프로젝트 grep 검색 | TC-006 |

---

## 8. 변경 이력 추적

| 버전 | 날짜 | 변경 내용 | 영향 받은 FR/NFR |
|------|------|----------|----------------|
| 1.0 | 2025-12-16 | 초기 작성 | 모든 FR, NFR |

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- PRD: `.jjiban/jjiban/prd.md`
- TRD: `.jjiban/jjiban/trd.md`

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
