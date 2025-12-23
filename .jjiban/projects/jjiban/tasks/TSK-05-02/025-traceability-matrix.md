# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: PRD → 기본설계 → 상세설계 → 테스트 4단계 양방향 추적
>
> **참조**: 이 문서는 `020-detail-design.md`와 `026-test-specification.md`와 함께 사용됩니다.

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-02 |
| Task명 | Detail Sections |
| 상세설계 참조 | `020-detail-design.md` |
| 테스트 명세 참조 | `026-test-specification.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 기능 요구사항 추적 (FR → 설계 → 테스트)

| 요구사항 ID | PRD 섹션 | 기본설계 섹션 | 상세설계 섹션 | 단위 테스트 | E2E 테스트 | 매뉴얼 TC | 상태 |
|-------------|----------|--------------|--------------|-------------|------------|-----------|------|
| FR-001 | 6.3.2 | 5.1 | 8.1, 9.2 | UT-001, UT-002 | E2E-001 | TC-001 | 설계완료 |
| FR-002 | 6.3.2 | 5.1 | 8.1, 9.2 | UT-003 | E2E-001 | TC-001 | 설계완료 |
| FR-003 | 6.3.2 | 5.1 | 8.1, 9.2 | UT-004 | E2E-001 | TC-001 | 설계완료 |
| FR-004 | 6.3.3 | 5.2 | 9.3 | - | E2E-002 | TC-002 | 설계완료 |
| FR-005 | 6.3.3 | 5.2 | 9.3 | - | E2E-002 | TC-002 | 설계완료 |
| FR-006 | 6.3.3 | 5.2 | 7.2, 8.2, 9.3 | UT-005 | E2E-003, E2E-004 | TC-003 | 설계완료 |
| FR-007 | 6.3.4 | 5.3 | 9.4 | - | E2E-005 | TC-004 | 설계완료 |
| FR-008 | 6.3.4 | 5.3 | 9.4 | UT-006 | E2E-005 | TC-004 | 설계완료 |
| FR-009 | 6.3.4 | 5.3 | 8.3, 9.4 | UT-007 | E2E-006 | TC-005 | 설계완료 |
| FR-010 | 6.3.4 | 5.3 | 9.4 | - | E2E-005 | TC-004 | 설계완료 |
| FR-011 | 6.3.6 | 5.4 | 9.5 | UT-008 | E2E-007 | TC-006 | 설계완료 |
| FR-012 | 6.3.6 | 5.4 | 9.5 | UT-009 | E2E-007 | TC-006 | 설계완료 |
| FR-013 | 6.3.6 | 5.4 | 9.5 | UT-009 | E2E-007 | TC-006 | 설계완료 |
| FR-014 | 6.3.6 | 5.4 | 9.5 | UT-009 | E2E-007 | TC-006 | 설계완료 |

### 1.1 요구사항별 상세 매핑

#### FR-001: 카테고리별 워크플로우 흐름 시각화

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.2 | 진행 상태 섹션 - 워크플로우 시각화 |
| 기본설계 | 010-basic-design.md | 5.1 | TaskWorkflow 컴포넌트 역할 및 책임 |
| 상세설계 | 020-detail-design.md | 8.1 | 워크플로우 시각화 프로세스 (단계 1-2) |
| 상세설계 | 020-detail-design.md | 9.2 | TaskWorkflow 레이아웃 및 스타일 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-001: workflowSteps computed (development) |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-002: workflowSteps computed (defect, infrastructure) |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 워크플로우 흐름 표시 확인 |

#### FR-002: 현재 상태 노드 강조 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.2 | 진행 상태 섹션 - 현재 상태 강조 |
| 기본설계 | 010-basic-design.md | 5.1 | 현재 상태 강조 (색상, 크기, 볼드) |
| 상세설계 | 020-detail-design.md | 8.1 | 워크플로우 시각화 프로세스 (단계 3-4) |
| 상세설계 | 020-detail-design.md | 9.2 | 현재 상태 스타일 (파란 배경, scale(1.1)) |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-003: currentStepIndex computed |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 현재 상태 노드 스타일 검증 |

#### FR-003: 완료/미완료 상태 구분 시각화

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.2 | 진행 상태 섹션 - 완료/미완료 구분 |
| 기본설계 | 010-basic-design.md | 5.1 | 완료/현재/미완료 상태 시각화 |
| 상세설계 | 020-detail-design.md | 8.1 | 워크플로우 시각화 프로세스 (단계 4) |
| 상세설계 | 020-detail-design.md | 9.2 | 상태별 스타일 (완료: 초록, 미완료: 회색 점선) |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-004: getNodeStyle 함수 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 완료/미완료 노드 스타일 검증 |

#### FR-004: 요구사항 목록 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.3 | 요구사항 섹션 - 마크다운 형식 목록 |
| 기본설계 | 010-basic-design.md | 5.2 | TaskRequirements 컴포넌트 - 요구사항 목록 표시 |
| 상세설계 | 020-detail-design.md | 9.3 | TaskRequirements 레이아웃 (읽기 모드) |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-002: 요구사항 목록 표시 확인 |

#### FR-005: PRD 참조 섹션 링크 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.3 | 요구사항 섹션 - PRD 섹션 참조 링크 |
| 기본설계 | 010-basic-design.md | 5.2 | PRD 참조 링크 |
| 상세설계 | 020-detail-design.md | 9.3 | PRD 참조 표시 (ref: PRD 6.3.2, ...) |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-002: PRD 참조 링크 확인 |

#### FR-006: 요구사항 인라인 편집

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.3 | 요구사항 섹션 - 인라인 편집 |
| 기본설계 | 010-basic-design.md | 5.2 | 인라인 편집 (추가/삭제/수정) |
| 상세설계 | 020-detail-design.md | 7.2 | PUT /api/tasks/:id API 계약 |
| 상세설계 | 020-detail-design.md | 8.2 | 요구사항 편집 프로세스 (6단계) |
| 상세설계 | 020-detail-design.md | 9.3 | TaskRequirements 편집 모드 레이아웃 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-005: 편집 상태 관리 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-003: 요구사항 편집 시나리오 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-004: 요구사항 추가/삭제 |

#### FR-007: 문서 목록 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.4 | 관련 문서 섹션 - 문서 목록 |
| 기본설계 | 010-basic-design.md | 5.3 | TaskDocuments - 문서 목록 표시 |
| 상세설계 | 020-detail-design.md | 9.4 | TaskDocuments 레이아웃 (Card 형태) |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-005: 문서 목록 표시 확인 |

#### FR-008: 문서 존재/예정 상태 구분

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.4 | 관련 문서 섹션 - 존재/예정 구분 |
| 기본설계 | 010-basic-design.md | 5.3 | 존재/예정 상태 구분 (배경색/테두리) |
| 상세설계 | 020-detail-design.md | 9.4 | 존재/예정 스타일 (파란/회색 배경) |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-006: getDocumentCardStyle 함수 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-005: 문서 상태별 스타일 검증 |

#### FR-009: 문서 클릭 시 뷰어 연동

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.4 | 관련 문서 섹션 - 문서 클릭 시 뷰어 |
| 기본설계 | 010-basic-design.md | 5.3 | 문서 클릭 시 뷰어 연동 |
| 상세설계 | 020-detail-design.md | 8.3 | 문서 열기 프로세스 |
| 상세설계 | 020-detail-design.md | 9.4 | 문서 카드 클릭 핸들러 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-007: handleOpenDocument 함수 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-006: 문서 클릭 → 뷰어 열기 |

#### FR-010: 예정 문서에 생성 가능 조건 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.4 | 관련 문서 섹션 - 생성 가능 조건 |
| 기본설계 | 010-basic-design.md | 5.3 | 예정 문서에 생성 가능 조건 표시 |
| 상세설계 | 020-detail-design.md | 9.4 | 생성 조건 표시 (expectedAfter 또는 command) |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-005: 예정 문서 생성 조건 확인 |

#### FR-011: 상태 변경 이력 타임라인 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.6 | 이력 섹션 - 시간순 상태 변경 기록 |
| 기본설계 | 010-basic-design.md | 5.4 | TaskHistory - 타임스탬프 기준 역순 정렬 |
| 상세설계 | 020-detail-design.md | 9.5 | TaskHistory 레이아웃 (PrimeVue Timeline) |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-008: sortedHistory computed |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-007: 이력 타임라인 표시 확인 |

#### FR-012: 이력 엔트리별 정보 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.6 | 이력 섹션 - 타임스탬프, 상태 변경, 사용자 |
| 기본설계 | 010-basic-design.md | 5.4 | 이력 엔트리별 정보 (타임스탬프, 상태, 사용자) |
| 상세설계 | 020-detail-design.md | 9.5 | 타임라인 엔트리 렌더링 (formatHistoryEntry) |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-009: formatHistoryEntry 함수 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-007: 이력 정보 표시 검증 |

#### FR-013: 문서 생성 이력 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.6 | 이력 섹션 - 문서 생성 이력 |
| 기본설계 | 010-basic-design.md | 5.4 | 문서 생성 이력 표시 |
| 상세설계 | 020-detail-design.md | 9.5 | documentCreated 필드 표시 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-009: formatHistoryEntry (documentCreated) |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-007: 문서 생성 이력 확인 |

#### FR-014: 이력 엔트리에 코멘트 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.6 | 이력 섹션 - 코멘트 |
| 기본설계 | 010-basic-design.md | 5.4 | 코멘트 표시 (있는 경우) |
| 상세설계 | 020-detail-design.md | 9.5 | comment 필드 표시 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-009: formatHistoryEntry (comment) |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-007: 코멘트 표시 확인 |

---

## 2. 비기능 요구사항 추적 (NFR → 구현 → 검증)

| 요구사항 ID | PRD 출처 | 기본설계 섹션 | 구현 위치(개념) | 단위 테스트 | E2E 테스트 | 검증 방법 | 상태 |
|-------------|----------|--------------|-----------------|-------------|------------|-----------|------|
| NFR-001 | 2.2 | - | Vue 렌더링 최적화 | - | E2E-PERF-01 | 렌더링 시간 측정 (< 100ms) | 설계완료 |
| NFR-002 | 2.2 | 8.2 | 낙관적 업데이트 | - | E2E-003 | UI 즉시 반영 확인 | 설계완료 |
| NFR-003 | 2.2 | 9.8 | ARIA 레이블, 키보드 네비게이션 | - | E2E-A11Y-01 | Playwright 접근성 테스트 | 설계완료 |
| NFR-004 | 2.2 | 5.1 | 독립적인 컴포넌트, Props/Emits | UT-010 | - | 컴포넌트 단독 렌더링 테스트 | 설계완료 |
| NFR-005 | 2.2 | 전체 | TypeScript 타입 정의 | - | - | tsc --noEmit 통과 | 설계완료 |
| NFR-006 | 2.2 | 9.2, 9.4 | PrimeVue 테마, 카테고리별 색상 | - | E2E-001, E2E-005 | 시각적 일관성 확인 | 설계완료 |

### 2.1 비기능 요구사항별 상세 매핑

#### NFR-001: 응답 시간 (렌더링 < 100ms)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 각 섹션 렌더링 < 100ms |
| **기본설계 표현** | - (암묵적 요구사항) |
| **구현 위치** | Vue computed 속성 최적화, 가상 스크롤 검토 |
| **검증 방법** | Playwright Performance API로 렌더링 시간 측정 |
| **관련 테스트** | E2E-PERF-01 |

#### NFR-002: 인라인 편집 반응성 (낙관적 업데이트)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 사용자 입력 후 즉시 반영 |
| **기본설계 표현** | 낙관적 업데이트 (8.2 요구사항 편집 프로세스) |
| **구현 위치** | TaskDetailPanel.handleUpdateRequirements |
| **검증 방법** | API 응답 전 UI 업데이트 확인 |
| **관련 테스트** | E2E-003 |

#### NFR-003: 접근성 (키보드, ARIA, 스크린리더)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 키보드 네비게이션, ARIA 레이블, 스크린리더 지원 |
| **기본설계 표현** | 9.8 반응형/접근성 가이드 |
| **구현 위치** | 모든 컴포넌트 (role, aria-label, tabindex) |
| **검증 방법** | Playwright 접근성 테스트, axe-core |
| **관련 테스트** | E2E-A11Y-01 |

---

## 3. 비즈니스 규칙 추적 (BR → 구현 → 검증)

| 규칙 ID | PRD 출처 | 기본설계 섹션 | 구현 위치(개념) | 단위 테스트 | E2E 테스트 | 검증 방법 | 상태 |
|---------|----------|--------------|-----------------|-------------|------------|-----------|------|
| BR-WF-01 | 5.2 | 5.1 | TaskWorkflow computed | UT-001, UT-002 | E2E-001 | 카테고리별 워크플로우 단계 확인 | 설계완료 |
| BR-REQ-01 | - | 5.2 | TaskRequirements 유효성 검증 | UT-011 | E2E-008 | 500자 초과 입력 차단 확인 | 설계완료 |
| BR-DOC-01 | 6.3.4 | 5.3 | TaskDocuments handleOpenDocument | UT-007 | E2E-009 | exists=false 문서 클릭 불가 확인 | 설계완료 |
| BR-HIST-01 | 6.3.6 | 5.4 | TaskHistory sortedHistory computed | UT-008 | E2E-007 | 타임스탬프 역순 정렬 확인 | 설계완료 |

### 3.1 비즈니스 규칙별 상세 매핑

#### BR-WF-01: 카테고리별 워크플로우 단계 정의

| 구분 | 내용 |
|------|------|
| **PRD 원문** | development (6단계), defect (5단계), infrastructure (4단계) |
| **기본설계 표현** | TaskWorkflow 컴포넌트 - 카테고리별 워크플로우 단계 표시 |
| **구현 위치** | TaskWorkflow.vue - workflowSteps computed (switch-case) |
| **검증 방법** | 단위 테스트: 각 category별 workflowSteps 배열 검증 |
| **관련 테스트** | UT-001, UT-002, E2E-001 |

#### BR-REQ-01: 요구사항 항목은 500자 이하

| 구분 | 내용 |
|------|------|
| **PRD 원문** | (암묵적 요구사항 - 일반적인 텍스트 필드 제약) |
| **기본설계 표현** | TaskRequirements - 인라인 편집 |
| **구현 위치** | TaskRequirements.vue - 클라이언트 유효성 검증 (maxlength 속성 또는 computed) |
| **검증 방법** | E2E 테스트: 500자 초과 입력 시도 → 에러 메시지 또는 입력 차단 |
| **관련 테스트** | UT-011, E2E-008 |

#### BR-DOC-01: 예정 문서는 클릭 불가

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 관련 문서 섹션 - 예정 문서는 클릭 불가 (암묵적) |
| **기본설계 표현** | TaskDocuments - 존재하는 문서만 클릭 시 뷰어 열기 |
| **구현 위치** | TaskDocuments.vue - handleOpenDocument 함수 (exists 체크) |
| **검증 방법** | E2E 테스트: exists=false 문서 클릭 시 이벤트 발생하지 않음 확인 |
| **관련 테스트** | UT-007, E2E-009 |

#### BR-HIST-01: 이력은 타임스탬프 역순 정렬

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 이력 섹션 - 시간순 상태 변경 기록 (역순 암묵적) |
| **기본설계 표현** | TaskHistory - 타임스탬프 기준 역순 정렬 |
| **구현 위치** | TaskHistory.vue - sortedHistory computed |
| **검증 방법** | 단위 테스트: 정렬 전후 배열 비교 |
| **관련 테스트** | UT-008, E2E-007 |

---

## 4. 테스트 역추적 매트릭스

| 테스트 ID | 테스트 유형 | 검증 대상 요구사항 | 검증 대상 비즈니스 규칙 | 상태 |
|-----------|------------|-------------------|----------------------|------|
| UT-001 | 단위 | FR-001 | BR-WF-01 | 미실행 |
| UT-002 | 단위 | FR-001 | BR-WF-01 | 미실행 |
| UT-003 | 단위 | FR-002 | - | 미실행 |
| UT-004 | 단위 | FR-003 | - | 미실행 |
| UT-005 | 단위 | FR-006 | - | 미실행 |
| UT-006 | 단위 | FR-008 | - | 미실행 |
| UT-007 | 단위 | FR-009 | BR-DOC-01 | 미실행 |
| UT-008 | 단위 | FR-011 | BR-HIST-01 | 미실행 |
| UT-009 | 단위 | FR-012, FR-013, FR-014 | - | 미실행 |
| UT-010 | 단위 | NFR-004 | - | 미실행 |
| UT-011 | 단위 | - | BR-REQ-01 | 미실행 |
| E2E-001 | E2E | FR-001, FR-002, FR-003 | BR-WF-01, NFR-006 | 미실행 |
| E2E-002 | E2E | FR-004, FR-005 | - | 미실행 |
| E2E-003 | E2E | FR-006 | NFR-002 | 미실행 |
| E2E-004 | E2E | FR-006 | - | 미실행 |
| E2E-005 | E2E | FR-007, FR-008, FR-010 | NFR-006 | 미실행 |
| E2E-006 | E2E | FR-009 | - | 미실행 |
| E2E-007 | E2E | FR-011, FR-012, FR-013, FR-014 | BR-HIST-01 | 미실행 |
| E2E-008 | E2E | - | BR-REQ-01 | 미실행 |
| E2E-009 | E2E | - | BR-DOC-01 | 미실행 |
| E2E-PERF-01 | E2E Performance | NFR-001 | - | 미실행 |
| E2E-A11Y-01 | E2E Accessibility | NFR-003 | - | 미실행 |
| TC-001 | 매뉴얼 | FR-001, FR-002, FR-003 | - | 미실행 |
| TC-002 | 매뉴얼 | FR-004, FR-005 | - | 미실행 |
| TC-003 | 매뉴얼 | FR-006 | - | 미실행 |
| TC-004 | 매뉴얼 | FR-007, FR-008, FR-010 | - | 미실행 |
| TC-005 | 매뉴얼 | FR-009 | - | 미실행 |
| TC-006 | 매뉴얼 | FR-011, FR-012, FR-013, FR-014 | - | 미실행 |

---

## 5. 데이터 모델 추적

| 기본설계 엔티티 | 상세설계 인터페이스 | API Request DTO | API Response DTO |
|----------------|---------------------|-----------------|------------------|
| WorkflowStep | WorkflowStep (computed) | - | - (런타임 전용) |
| DocumentInfo | DocumentInfo (types/index.ts) | - | TaskDetail.documents[] |
| HistoryEntry | HistoryEntry (types/index.ts) | - | TaskDetail.history[] |
| TaskDetail.requirements | string[] | { requirements: string[] } | TaskDetail.requirements |

---

## 6. 인터페이스 추적

| 기본설계 인터페이스 | 상세설계 API | Method | Endpoint | 요구사항 |
|--------------------|-------------|--------|----------|----------|
| 요구사항 수정 | PUT /api/tasks/:id | PUT | /api/tasks/:id | FR-006 |

---

## 7. 화면 추적

| 기본설계 화면 | 상세설계 화면 | 컴포넌트 | 요구사항 |
|--------------|--------------|----------|----------|
| 워크플로우 흐름 섹션 | TaskWorkflow 레이아웃 | TaskWorkflow.vue | FR-001, FR-002, FR-003 |
| 요구사항 섹션 | TaskRequirements 레이아웃 | TaskRequirements.vue | FR-004, FR-005, FR-006 |
| 관련 문서 섹션 | TaskDocuments 레이아웃 | TaskDocuments.vue | FR-007, FR-008, FR-009, FR-010 |
| 이력 섹션 | TaskHistory 레이아웃 | TaskHistory.vue | FR-011, FR-012, FR-013, FR-014 |

---

## 8. 추적성 검증 요약

### 8.1 커버리지 통계

| 구분 | 총 항목 | 매핑 완료 | 미매핑 | 커버리지 |
|------|---------|----------|--------|---------|
| 기능 요구사항 (FR) | 14 | 14 | 0 | 100% |
| 비기능 요구사항 (NFR) | 6 | 6 | 0 | 100% |
| 비즈니스 규칙 (BR) | 4 | 4 | 0 | 100% |
| 단위 테스트 (UT) | 11 | 11 | 0 | 100% |
| E2E 테스트 | 11 | 11 | 0 | 100% |
| 매뉴얼 테스트 (TC) | 6 | 6 | 0 | 100% |

### 8.2 미매핑 항목

없음. 모든 요구사항이 설계 및 테스트에 매핑되었습니다.

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 기본설계: `010-basic-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md`

---

<!--
author: AI Agent
Template Version: 1.0.0
-->
