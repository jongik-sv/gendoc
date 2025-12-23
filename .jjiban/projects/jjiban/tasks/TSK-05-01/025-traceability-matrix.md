# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: PRD → 기본설계 → 상세설계 → 테스트 4단계 양방향 추적
>
> **참조**: 이 문서는 `020-detail-design.md`와 `026-test-specification.md`와 함께 사용됩니다.

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-01 |
| Task명 | Detail Panel Structure |
| 상세설계 참조 | `020-detail-design.md` |
| 테스트 명세 참조 | `026-test-specification.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 기능 요구사항 추적 (FR → 설계 → 테스트)

> PRD → 기본설계 → 상세설계 → 테스트케이스 매핑

| 요구사항 ID | PRD 섹션 | 기본설계 섹션 | 상세설계 섹션 | 단위 테스트 | E2E 테스트 | 매뉴얼 TC | 상태 |
|-------------|----------|--------------|--------------|-------------|------------|-----------|------|
| FR-001 | 6.3 | 2.1 | 8.1.3, 9.2 | - | E2E-001 | TC-001 | 설계완료 |
| FR-002 | 6.3.1 | 2.1, 5.1 | 7.2, 9.3 | - | E2E-001 | TC-001 | 설계완료 |
| FR-003 | 6.3.1 | 2.1, 5.2 | 8.1.2, 9.3 | - | E2E-002 | TC-002 | 설계완료 |
| FR-004 | 6.3.1 | 2.1, 5.2 | 8.1.2, 9.3 | - | E2E-003 | TC-003 | 설계완료 |
| FR-005 | 6.3.1 | 2.1, 5.2 | 7.4, 9.3 | - | E2E-004 | TC-004 | 설계완료 |
| FR-006 | 10.1 | 2.1, 5.2 | 9.3 | - | E2E-005 | TC-005 | 설계완료 |
| FR-007 | 10.1 | 2.1, 5.2 | 9.3 | - | E2E-006 | TC-006 | 설계완료 |
| FR-008 | 8.1 | 3.3, 5.1 | 8.1.2, 10 | - | E2E-007 | TC-007 | 설계완료 |
| FR-009 | 6.3 | 2.1, 5.1 | 9.2, 9.5 | - | E2E-008 | TC-008 | 설계완료 |
| FR-010 | 11 | 2.2, 5.1 | 8.1.1, 9.2 | - | E2E-009 | TC-009 | 설계완료 |

### 1.1 요구사항별 상세 매핑

#### FR-001: 선택된 Task가 없을 때 빈 상태 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3 | Task 상세 패널 기본 동작 |
| 기본설계 | 010-basic-design.md | 2.1 | 빈 상태 처리 요구사항 정의 |
| 상세설계 | 020-detail-design.md | 8.1.3, 9.2 | 빈 상태 프로세스, UI 레이아웃 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.1 | TC-001 |

#### FR-002: Task ID, 제목, 카테고리, 우선순위, 담당자 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.1 | 기본 정보 표시 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1, 5.1 | TaskBasicInfo 컴포넌트 역할 정의 |
| 상세설계 | 020-detail-design.md | 7.2, 9.3 | GET /api/tasks/:id, TaskBasicInfo Props |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.1 | TC-001 |

#### FR-003: 제목 필드 인라인 편집 가능

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.1 | 인라인 편집 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | 제목 인라인 편집 기능 정의 |
| 상세설계 | 020-detail-design.md | 8.1.2, 9.3 | 인라인 편집 프로세스, TaskBasicInfo 제목 편집 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-002 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.2 | TC-002 |

#### FR-004: 우선순위 Dropdown으로 변경 가능

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.1 | 우선순위 편집 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | 우선순위 Dropdown 정의 |
| 상세설계 | 020-detail-design.md | 8.1.2, 9.3 | 우선순위 변경 프로세스, Dropdown 설정 |
| E2E 테스트 | 026-test-specification.md | 3.3 | E2E-003 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.3 | TC-003 |

#### FR-005: 담당자 Dropdown으로 변경 가능

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.1 | 담당자 편집 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | 담당자 Dropdown 정의 |
| 상세설계 | 020-detail-design.md | 7.4, 9.3 | GET /api/projects/:id (팀원 목록), 담당자 Dropdown |
| E2E 테스트 | 026-test-specification.md | 3.4 | E2E-004 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.4 | TC-004 |

#### FR-006: 카테고리별 색상 구분

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 10.1 | Dark Blue 테마, 색상 팔레트 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | 카테고리 색상 매핑 정의 |
| 상세설계 | 020-detail-design.md | 9.3 | TaskBasicInfo 카테고리 Tag 색상 설정 |
| E2E 테스트 | 026-test-specification.md | 3.5 | E2E-005 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.5 | TC-005 |

#### FR-007: 우선순위별 색상 구분

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 10.1 | 우선순위 색상 팔레트 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | 우선순위 색상 매핑 정의 |
| 상세설계 | 020-detail-design.md | 9.3 | TaskBasicInfo 우선순위 Dropdown 색상 설정 |
| E2E 테스트 | 026-test-specification.md | 3.6 | E2E-006 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.6 | TC-006 |

#### FR-008: 인라인 편집 시 API 연동 및 낙관적 업데이트

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 8.1 | API 연동 요구사항 |
| 기본설계 | 010-basic-design.md | 3.3, 5.1 | 낙관적 업데이트 패턴 정의 |
| 상세설계 | 020-detail-design.md | 8.1.2, 10 | 낙관적 업데이트 프로세스, 비즈니스 규칙 BR-004 |
| E2E 테스트 | 026-test-specification.md | 3.7 | E2E-007 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.7 | TC-007 |

#### FR-009: 스크롤 가능한 콘텐츠 영역 제공

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3 | 스크롤 영역 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1, 5.1 | TaskDetailPanel 스크롤 영역 정의 |
| 상세설계 | 020-detail-design.md | 9.2, 9.5 | UI 레이아웃 스크롤 영역, TailwindCSS 설정 |
| E2E 테스트 | 026-test-specification.md | 3.8 | E2E-008 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.8 | TC-008 |

#### FR-010: 로딩 상태 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11 | 로딩/에러 상태 요구사항 |
| 기본설계 | 010-basic-design.md | 2.2, 5.1 | TaskDetailPanel 로딩 상태 처리 |
| 상세설계 | 020-detail-design.md | 8.1.1, 9.2 | 로딩 프로세스, Skeleton UI |
| E2E 테스트 | 026-test-specification.md | 3.9 | E2E-009 |
| 매뉴얼 테스트 | 026-test-specification.md | 4.9 | TC-009 |

---

## 2. 비즈니스 규칙 추적 (BR → 구현 → 검증)

| 규칙 ID | PRD 출처 | 기본설계 섹션 | 구현 위치(개념) | 단위 테스트 | E2E 테스트 | 검증 방법 | 상태 |
|---------|----------|--------------|-----------------|-------------|------------|-----------|------|
| BR-001 | 6.3.1 | 2.1, 5.2 | TaskDetailPanel.handleUpdateTitle | - | E2E-010 | 제목 길이 검증 (1-200자) | 설계완료 |
| BR-002 | 6.3.1 | 2.1, 5.2 | TaskBasicInfo 우선순위 Dropdown | - | E2E-011 | Dropdown 옵션 제한 확인 | 설계완료 |
| BR-003 | 6.3.1 | 2.1, 5.2 | PUT /api/tasks/:id (서버) | - | E2E-012 | 담당자 팀원 목록 검증 | 설계완료 |
| BR-004 | 8.1 | 3.3, 5.1 | TaskDetailPanel 편집 핸들러 | - | E2E-013 | API 실패 시 롤백 확인 | 설계완료 |
| BR-005 | 6.3.1 | 2.1, 5.2 | TaskBasicInfo 카테고리 Tag | - | E2E-014 | 카테고리 편집 UI 부재 확인 | 설계완료 |

### 2.1 비즈니스 규칙별 상세 매핑

#### BR-001: 제목은 1-200자 범위

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 제목 필드 인라인 편집 지원 (유효성 검증 포함) |
| **기본설계 표현** | 제목 1-200자 제약, 클라이언트 및 서버 검증 |
| **구현 위치** | TaskDetailPanel.handleUpdateTitle (클라이언트), PUT /api/tasks/:id (서버) |
| **검증 방법** | E2E 테스트: 201자 입력 시 에러 메시지 확인 |
| **관련 테스트** | E2E-010 |

#### BR-002: 우선순위는 4개 값만 허용

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 우선순위 Dropdown으로 변경 가능 (critical/high/medium/low) |
| **기본설계 표현** | 우선순위 Dropdown 옵션 제한 |
| **구현 위치** | TaskBasicInfo 우선순위 Dropdown 옵션 설정 |
| **검증 방법** | E2E 테스트: Dropdown 옵션 개수 및 값 확인 |
| **관련 테스트** | E2E-011 |

#### BR-003: 담당자는 팀원 목록에 존재해야 함

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 담당자 Dropdown으로 변경 가능 (팀원 목록 기반) |
| **기본설계 표현** | 담당자 ID는 team.json에 존재하는 팀원만 허용 |
| **구현 위치** | PUT /api/tasks/:id 서버 검증 (team.json 조회) |
| **검증 방법** | E2E 테스트: 잘못된 담당자 ID 입력 시 에러 확인 |
| **관련 테스트** | E2E-012 |

#### BR-004: 낙관적 업데이트 실패 시 롤백

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 인라인 편집 시 낙관적 업데이트 적용 |
| **기본설계 표현** | API 호출 전 UI 업데이트, 실패 시 이전 값 복원 |
| **구현 위치** | TaskDetailPanel.handleUpdateTitle/Priority/Assignee |
| **검증 방법** | E2E 테스트: API 실패 시뮬레이션 후 UI 롤백 확인 |
| **관련 테스트** | E2E-013 |

#### BR-005: 카테고리는 읽기 전용

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 카테고리 태그 표시 (읽기 전용) |
| **기본설계 표현** | TaskBasicInfo에서 카테고리는 Tag로만 표시, 편집 UI 없음 |
| **구현 위치** | TaskBasicInfo 카테고리 Tag 컴포넌트 |
| **검증 방법** | E2E 테스트: 카테고리 편집 UI 요소 부재 확인 |
| **관련 테스트** | E2E-014 |

---

## 3. 테스트 역추적 매트릭스

> 테스트 결과 → 요구사항 역추적용 (build/verify 단계 결과서 생성 시 활용)

| 테스트 ID | 테스트 유형 | 검증 대상 요구사항 | 검증 대상 비즈니스 규칙 | 상태 |
|-----------|------------|-------------------|----------------------|------|
| E2E-001 | E2E | FR-001, FR-002 | - | 미실행 |
| E2E-002 | E2E | FR-003 | - | 미실행 |
| E2E-003 | E2E | FR-004 | - | 미실행 |
| E2E-004 | E2E | FR-005 | - | 미실행 |
| E2E-005 | E2E | FR-006 | - | 미실행 |
| E2E-006 | E2E | FR-007 | - | 미실행 |
| E2E-007 | E2E | FR-008 | - | 미실행 |
| E2E-008 | E2E | FR-009 | - | 미실행 |
| E2E-009 | E2E | FR-010 | - | 미실행 |
| E2E-010 | E2E | - | BR-001 | 미실행 |
| E2E-011 | E2E | - | BR-002 | 미실행 |
| E2E-012 | E2E | - | BR-003 | 미실행 |
| E2E-013 | E2E | - | BR-004 | 미실행 |
| E2E-014 | E2E | - | BR-005 | 미실행 |
| TC-001 | 매뉴얼 | FR-001, FR-002 | - | 미실행 |
| TC-002 | 매뉴얼 | FR-003 | BR-001 | 미실행 |
| TC-003 | 매뉴얼 | FR-004 | BR-002 | 미실행 |
| TC-004 | 매뉴얼 | FR-005 | BR-003 | 미실행 |
| TC-005 | 매뉴얼 | FR-006 | - | 미실행 |
| TC-006 | 매뉴얼 | FR-007 | - | 미실행 |
| TC-007 | 매뉴얼 | FR-008 | BR-004 | 미실행 |
| TC-008 | 매뉴얼 | FR-009 | - | 미실행 |
| TC-009 | 매뉴얼 | FR-010 | - | 미실행 |

---

## 4. 데이터 모델 추적

> 기본설계 엔티티 → 상세설계 타입 → API DTO 매핑

| 기본설계 엔티티 | 상세설계 TypeScript 타입 | API Request DTO | API Response DTO |
|----------------|------------------------|-----------------|------------------|
| TaskDetail | TaskDetail (types/index.ts) | UpdateTaskDto | TaskDetail |
| TeamMember | TeamMember (types/index.ts) | - | TeamMember[] (팀원 목록) |
| DocumentInfo | DocumentInfo (types/index.ts) | - | DocumentInfo[] (문서 목록) |
| HistoryEntry | HistoryEntry (types/index.ts) | - | HistoryEntry[] (이력) |

### 4.1 타입별 상세 매핑

#### TaskDetail

| 기본설계 필드 | 상세설계 타입 필드 | API Request 필드 | API Response 필드 |
|--------------|------------------|-----------------|------------------|
| id | id: string | - | id |
| title | title: string | title?: string | title |
| category | category: TaskCategory | - | category |
| status | status: TaskStatus | - | status |
| priority | priority: Priority | priority?: Priority | priority |
| assignee | assignee?: TeamMember | assignee?: string \| null | assignee |
| parentWp | parentWp: string | - | parentWp |
| parentAct | parentAct?: string | - | parentAct |

---

## 5. 인터페이스 추적

> 기본설계 인터페이스 요구사항 → API 엔드포인트 매핑

| 기본설계 인터페이스 | 상세설계 API | Method | Endpoint | 요구사항 |
|--------------------|-------------|--------|----------|----------|
| Task 상세 조회 | GET Task Detail | GET | /api/tasks/:id | FR-002 |
| Task 정보 수정 | PUT Task | PUT | /api/tasks/:id | FR-003, FR-004, FR-005, FR-008 |
| 팀원 목록 조회 | GET Project | GET | /api/projects/:id | FR-005 |

---

## 6. 화면 추적

> 기본설계 화면 요구사항 → 상세설계 컴포넌트 매핑

| 기본설계 화면 | 상세설계 화면 | 컴포넌트 | 요구사항 |
|--------------|--------------|----------|----------|
| Task Detail Panel (컨테이너) | TaskDetailPanel.vue | TaskDetailPanel | FR-001, FR-008, FR-009, FR-010 |
| 기본 정보 섹션 | TaskBasicInfo.vue | TaskBasicInfo | FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 |
| 진행 상태 섹션 | TaskProgress.vue | TaskProgress | FR-004, FR-005 (상태 및 워크플로우) |

### 6.1 컴포넌트별 상세 매핑

#### TaskDetailPanel.vue

| 기본설계 요구사항 | 상세설계 구현 항목 | 관련 섹션 |
|-----------------|------------------|----------|
| Pinia 스토어 연동 | useSelectionStore 구독 | 5.1, 9.4 |
| 로딩/에러/빈 상태 처리 | 분기 렌더링 (Skeleton, Message) | 8.1.1, 8.1.3, 9.2 |
| 인라인 편집 이벤트 핸들링 | handleUpdateTitle/Priority/Assignee | 8.1.2, 9.3 |
| 낙관적 업데이트 및 롤백 | try-catch 로직, 이전 값 백업 | 8.1.2, 10 |

#### TaskBasicInfo.vue

| 기본설계 요구사항 | 상세설계 구현 항목 | 관련 섹션 |
|-----------------|------------------|----------|
| ID, 제목, 카테고리, 우선순위, 담당자 표시 | Badge, InputText, Tag, Dropdown 렌더링 | 9.2, 9.3 |
| 제목 인라인 편집 | InputText + Enter/Blur/Escape 핸들러 | 9.3 |
| 우선순위/담당자 Dropdown | PrimeVue Dropdown 설정 | 9.3 |
| 카테고리/우선순위 색상 적용 | 색상 매핑 객체, Tag/Dropdown 스타일 | 9.3 |

#### TaskProgress.vue

| 기본설계 요구사항 | 상세설계 구현 항목 | 관련 섹션 |
|-----------------|------------------|----------|
| 현재 상태 Badge 표시 | PrimeVue Badge 렌더링 | 9.3 |
| 워크플로우 단계 시각화 | workflowSteps computed, 단계 인디케이터 | 8.2.3, 9.3 |
| 현재 단계 강조 | currentStepIndex 계산, 강조 스타일 | 9.3 |

---

## 7. 추적성 검증 요약

### 7.1 커버리지 통계

| 구분 | 총 항목 | 매핑 완료 | 미매핑 | 커버리지 |
|------|---------|----------|--------|---------|
| 기능 요구사항 (FR) | 10 | 10 | 0 | 100% |
| 비즈니스 규칙 (BR) | 5 | 5 | 0 | 100% |
| E2E 테스트 | 14 | 14 | 0 | 100% |
| 매뉴얼 테스트 (TC) | 9 | 9 | 0 | 100% |
| API 엔드포인트 | 3 | 3 | 0 | 100% |
| 컴포넌트 | 3 | 3 | 0 | 100% |

### 7.2 미매핑 항목 (있는 경우)

| 구분 | ID | 설명 | 미매핑 사유 |
|------|-----|------|-----------|
| - | - | - | - |

**결론**: 모든 요구사항, 비즈니스 규칙, 테스트, 컴포넌트가 완전히 추적되었습니다.

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
