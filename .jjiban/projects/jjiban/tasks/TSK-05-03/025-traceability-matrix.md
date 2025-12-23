# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: PRD → 기본설계 → 상세설계 → 테스트 4단계 양방향 추적
>
> **참조**: 이 문서는 `020-detail-design.md`와 `026-test-specification.md`와 함께 사용됩니다.

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-03 |
| Task명 | Detail Actions |
| 상세설계 참조 | `020-detail-design.md` |
| 테스트 명세 참조 | `026-test-specification.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 기능 요구사항 추적 (FR → 설계 → 테스트)

> PRD → 기본설계 → 상세설계 → 테스트케이스 매핑

| 요구사항 ID | PRD 섹션 | 기본설계 섹션 | 상세설계 섹션 | 단위 테스트 | E2E 테스트 | 매뉴얼 TC | 상태 |
|-------------|----------|--------------|--------------|-------------|------------|-----------|------|
| FR-001 | 6.3.5 | 2.1 | 2.1, 9.2 | UT-001 | E2E-001 | TC-001 | 설계완료 |
| FR-002 | 6.3.1, 6.3.5 | 2.1 | 7.2, 9.2 | UT-002 | E2E-002 | TC-002 | 설계완료 |
| FR-003 | 6.3.1, 6.3.5 | 2.1 | 7.2, 9.2 | UT-003 | E2E-002 | TC-002 | 설계완료 |
| FR-004 | 6.3.1, 6.3.5 | 2.1 | 7.2, 9.2 | UT-004 | E2E-002 | TC-002 | 설계완료 |
| FR-005 | 6.3.5, 5.3 | 2.1 | 7.3, 9.2 | UT-005 | E2E-003 | TC-003 | 설계완료 |
| FR-006 | 6.3.5 | 2.1 | 9.2 | - | E2E-004 | TC-004 | 설계완료 |
| FR-007 | 8.1 | 2.1 | 7.2 | UT-006 | E2E-002 | - | 설계완료 |
| FR-008 | 8.2 | 2.1, 6 | 8.2, 10.1 | UT-007 | E2E-005 | - | 설계완료 |
| FR-009 | 11 | 2.1, 6 | 8.2, 11.1 | UT-008 | E2E-006 | TC-005 | 설계완료 |
| FR-010 | 11.2 | 2.1 | 8.1, 9.5 | UT-009 | E2E-007 | TC-006 | 설계완료 |

### 1.1 요구사항별 상세 매핑

#### FR-001: Task 정보 편집 버튼 제공 (편집 모드 토글)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.5 | Task 액션 버튼 제공 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1 | 편집 모드 토글 기능 정의 |
| 상세설계 | 020-detail-design.md | 2.1, 9.2 | editMode ref, 편집 버튼 UI 설계 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-001: 편집 버튼 클릭 시 editMode 변경 검증 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 편집 버튼 → 인라인 편집 필드 표시 |

#### FR-002: 제목 필드 인라인 편집 (InputText)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.1, 6.3.5 | Task 제목 편집 기능 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | InputText 인라인 편집 설계 |
| 상세설계 | 020-detail-design.md | 7.2, 9.2 | InputText 컴포넌트 속성, API 요청 바디 |
| 단위 테스트 | 026-test-specification.md | 2.2 | UT-002: 제목 변경 시 API 호출 검증 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-002: 제목 입력 → 저장 → UI 반영 |

#### FR-003: 우선순위 필드 인라인 편집 (Dropdown)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.1, 6.3.5 | Task 우선순위 편집 기능 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | Dropdown 인라인 편집 설계 (critical/high/medium/low) |
| 상세설계 | 020-detail-design.md | 7.2, 9.2 | Dropdown 컴포넌트 옵션 설정 |
| 단위 테스트 | 026-test-specification.md | 2.3 | UT-003: 우선순위 변경 시 API 호출 검증 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-002: 우선순위 드롭다운 선택 → 저장 |

#### FR-004: 담당자 필드 인라인 편집 (Dropdown with Avatar)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.1, 6.3.5 | Task 담당자 편집 기능 |
| 기본설계 | 010-basic-design.md | 2.1, 5.2 | Dropdown with Avatar 설계 |
| 상세설계 | 020-detail-design.md | 7.2, 9.2 | Dropdown 템플릿 (value, option 슬롯) |
| 단위 테스트 | 026-test-specification.md | 2.4 | UT-004: 담당자 변경 시 API 호출 검증 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-002: 담당자 드롭다운 선택 → 저장 |

#### FR-005: 상태 전이 버튼 제공 (워크플로우 명령어 기반)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.5, 5.3 | 워크플로우 상태 전이 버튼 |
| 기본설계 | 010-basic-design.md | 2.1, 5.3 | availableActions 기반 버튼 렌더링 |
| 상세설계 | 020-detail-design.md | 7.3, 9.2 | POST /api/tasks/:id/transition API 설계 |
| 단위 테스트 | 026-test-specification.md | 2.5 | UT-005: 상태 전이 버튼 클릭 시 API 호출 |
| E2E 테스트 | 026-test-specification.md | 3.3 | E2E-003: 상태 전이 버튼 → 상태 변경 확인 |

#### FR-006: 문서 열기 버튼 제공 (문서 뷰어 연동)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.3.5 | 문서 보기 버튼 |
| 기본설계 | 010-basic-design.md | 2.1, 3.3 | 문서 열기 버튼 설계 (라우팅) |
| 상세설계 | 020-detail-design.md | 9.2 | router.push('/documents?task=...') |
| E2E 테스트 | 026-test-specification.md | 3.4 | E2E-004: 문서 버튼 → 문서 뷰어 이동 |

#### FR-007: API 연동 (PUT /api/tasks/:id)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 8.1 | WBS API 명세 |
| 기본설계 | 010-basic-design.md | 2.1, 9.1 | PUT /api/tasks/:id API 인터페이스 |
| 상세설계 | 020-detail-design.md | 7.2 | API 요청/응답 상세 설계 |
| 단위 테스트 | 026-test-specification.md | 2.6 | UT-006: API 엔드포인트 단위 테스트 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-002: API 호출 및 응답 검증 |

#### FR-008: 낙관적 업데이트 구현 (즉시 UI 반영)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 8.2 | 낙관적 업데이트 전략 |
| 기본설계 | 010-basic-design.md | 2.1, 6 | 낙관적 업데이트 메커니즘 설계 |
| 상세설계 | 020-detail-design.md | 8.2, 10.1 | 낙관적 업데이트 시퀀스 다이어그램 |
| 단위 테스트 | 026-test-specification.md | 2.7 | UT-007: 낙관적 업데이트 로직 검증 |
| E2E 테스트 | 026-test-specification.md | 3.5 | E2E-005: UI 즉시 반영 확인 |

#### FR-009: 에러 시 롤백 및 에러 토스트 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11 | 에러 처리 및 사용자 피드백 |
| 기본설계 | 010-basic-design.md | 2.1, 6 | 롤백 메커니즘 설계 |
| 상세설계 | 020-detail-design.md | 8.2, 11.1 | 롤백 시퀀스 다이어그램, 에러 메시지 |
| 단위 테스트 | 026-test-specification.md | 2.8 | UT-008: 롤백 로직 검증 |
| E2E 테스트 | 026-test-specification.md | 3.6 | E2E-006: API 실패 시 롤백 확인 |

#### FR-010: 편집 취소 기능 (Escape 키, 취소 버튼)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11.2 | 키보드 접근성 |
| 기본설계 | 010-basic-design.md | 2.1 | 편집 취소 기능 설계 |
| 상세설계 | 020-detail-design.md | 8.1, 9.5 | Escape 키 핸들링, 취소 버튼 |
| 단위 테스트 | 026-test-specification.md | 2.9 | UT-009: 취소 시 editMode false 검증 |
| E2E 테스트 | 026-test-specification.md | 3.7 | E2E-007: 취소 버튼/Escape 키 → 편집 모드 종료 |

---

## 2. 비즈니스 규칙 추적 (BR → 구현 → 검증)

| 규칙 ID | PRD 출처 | 기본설계 섹션 | 구현 위치(개념) | 단위 테스트 | E2E 테스트 | 검증 방법 | 상태 |
|---------|----------|--------------|-----------------|-------------|------------|-----------|------|
| BR-001 | 8.2 | 6.1 | TaskActions.handleUpdateField() | UT-007 | E2E-005 | API 호출 전 selectedTask 수정 확인 | 설계완료 |
| BR-002 | 8.2 | 6.2 | TaskActions.handleUpdateField() catch | UT-008 | E2E-006 | 실패 시 prevValues로 복원 확인 | 설계완료 |
| BR-003 | 8.2 | 6.1 | TaskActions.refreshTaskDetail() | UT-010 | E2E-002 | 성공 시 최신 데이터 가져오기 | 설계완료 |
| BR-004 | 5.3 | 5.3 | TaskActions.availableButtons computed | UT-011 | E2E-003 | availableActions 기반 버튼 필터링 | 설계완료 |
| BR-005 | 5.3 | 5.3 | /api/tasks/:id/transition | UT-012 | E2E-008 | 워크플로우 규칙 위반 시 409 에러 | 설계완료 |

### 2.1 비즈니스 규칙별 상세 매핑

#### BR-001: API 호출 전 UI 즉시 업데이트 (낙관적 업데이트)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 낙관적 업데이트 전략: API 응답 전에 UI를 먼저 업데이트하여 빠른 피드백 제공 |
| **기본설계 표현** | handleUpdateField() 메서드에서 API 호출 전 selectedTask 직접 수정 |
| **구현 위치** | TaskActions.vue - handleUpdateField() |
| **검증 방법** | API 호출 전 selectedTask 값 변경 확인 (단위 테스트 모킹) |
| **관련 테스트** | UT-007, E2E-005 |

#### BR-002: API 실패 시 이전 값으로 롤백

| 구분 | 내용 |
|------|------|
| **PRD 원문** | API 실패 시 데이터 일관성 유지를 위해 이전 값으로 롤백 |
| **기본설계 표현** | try-catch 블록의 catch에서 prevValues로 selectedTask 복원 |
| **구현 위치** | TaskActions.vue - handleUpdateField() catch 블록 |
| **검증 방법** | API 오류 발생 시 selectedTask가 이전 값으로 복원되는지 확인 |
| **관련 테스트** | UT-008, E2E-006 |

#### BR-003: 성공 시 서버 데이터로 재동기화

| 구분 | 내용 |
|------|------|
| **PRD 원문** | API 성공 후 서버의 최신 데이터로 UI 재동기화 |
| **기본설계 표현** | refreshTaskDetail() 호출로 GET /api/tasks/:id 최신 데이터 가져오기 |
| **구현 위치** | TaskActions.vue - handleUpdateField() 성공 분기 |
| **검증 방법** | API 성공 후 refreshTaskDetail() 호출 확인 |
| **관련 테스트** | UT-010, E2E-002 |

#### BR-004: availableActions 기반 버튼 렌더링

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 현재 Task 상태에서 가능한 워크플로우 명령어만 버튼으로 표시 |
| **기본설계 표현** | computed로 availableActions 필터링하여 버튼 배열 생성 |
| **구현 위치** | TaskActions.vue - availableButtons computed |
| **검증 방법** | availableActions 값에 따라 버튼 개수 변경 확인 |
| **관련 테스트** | UT-011, E2E-003 |

#### BR-005: 워크플로우 규칙 검증 (서버 측)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 워크플로우 규칙 위반 시 상태 전이 거부 |
| **기본설계 표현** | WorkflowEngine에서 현재 상태와 명령어 검증 |
| **구현 위치** | /api/tasks/:id/transition - WorkflowEngine.executeCommand() |
| **검증 방법** | 잘못된 명령어 실행 시 409 WORKFLOW_VIOLATION 에러 반환 |
| **관련 테스트** | UT-012, E2E-008 |

---

## 3. 테스트 역추적 매트릭스

> 테스트 결과 → 요구사항 역추적용 (build/verify 단계 결과서 생성 시 활용)

| 테스트 ID | 테스트 유형 | 검증 대상 요구사항 | 검증 대상 비즈니스 규칙 | 상태 |
|-----------|------------|-------------------|----------------------|------|
| UT-001 | 단위 | FR-001 | - | 미실행 |
| UT-002 | 단위 | FR-002 | - | 미실행 |
| UT-003 | 단위 | FR-003 | - | 미실행 |
| UT-004 | 단위 | FR-004 | - | 미실행 |
| UT-005 | 단위 | FR-005 | - | 미실행 |
| UT-006 | 단위 | FR-007 | - | 미실행 |
| UT-007 | 단위 | FR-008 | BR-001 | 미실행 |
| UT-008 | 단위 | FR-009 | BR-002 | 미실행 |
| UT-009 | 단위 | FR-010 | - | 미실행 |
| UT-010 | 단위 | - | BR-003 | 미실행 |
| UT-011 | 단위 | - | BR-004 | 미실행 |
| UT-012 | 단위 | - | BR-005 | 미실행 |
| E2E-001 | E2E | FR-001 | - | 미실행 |
| E2E-002 | E2E | FR-002, FR-003, FR-004, FR-007 | BR-003 | 미실행 |
| E2E-003 | E2E | FR-005 | BR-004 | 미실행 |
| E2E-004 | E2E | FR-006 | - | 미실행 |
| E2E-005 | E2E | FR-008 | BR-001 | 미실행 |
| E2E-006 | E2E | FR-009 | BR-002 | 미실행 |
| E2E-007 | E2E | FR-010 | - | 미실행 |
| E2E-008 | E2E | - | BR-005 | 미실행 |
| TC-001 | 매뉴얼 | FR-001 | - | 미실행 |
| TC-002 | 매뉴얼 | FR-002, FR-003, FR-004 | - | 미실행 |
| TC-003 | 매뉴얼 | FR-005 | - | 미실행 |
| TC-004 | 매뉴얼 | FR-006 | - | 미실행 |
| TC-005 | 매뉴얼 | FR-009 | - | 미실행 |
| TC-006 | 매뉴얼 | FR-010 | - | 미실행 |

---

## 4. 데이터 모델 추적

> 기본설계 엔티티 → 상세설계 모델 → API DTO 매핑

| 기본설계 엔티티 | 상세설계 타입 정의 | API Request DTO | API Response DTO |
|----------------|-------------------|-----------------|------------------|
| TaskDetail | TaskDetail (types/store.ts) | UpdateTaskDto | TaskDetailDto |
| TeamMember | TeamMember (types/store.ts) | - | TeamMemberDto |
| Document | Document (types/store.ts) | - | DocumentDto |

---

## 5. 인터페이스 추적

> 기본설계 인터페이스 요구사항 → API 엔드포인트 매핑

| 기본설계 인터페이스 | 상세설계 API | Method | Endpoint | 요구사항 |
|--------------------|-------------|--------|----------|----------|
| Task 정보 수정 | PUT /api/tasks/:id | PUT | /api/tasks/:id | FR-007, FR-008 |
| 상태 전이 | POST /api/tasks/:id/transition | POST | /api/tasks/:id/transition | FR-005 |

---

## 6. 화면 추적

> 기본설계 화면 요구사항 → 상세설계 컴포넌트 매핑

| 기본설계 화면 | 상세설계 화면 | 컴포넌트 | 요구사항 |
|--------------|--------------|----------|----------|
| TaskActions 컴포넌트 (편집 섹션) | TaskActions.vue (편집 모드) | TaskActions | FR-001, FR-002, FR-003, FR-004, FR-010 |
| TaskActions 컴포넌트 (상태 전이 섹션) | TaskActions.vue (상태 전이 버튼) | TaskActions | FR-005 |
| TaskActions 컴포넌트 (문서 섹션) | TaskActions.vue (문서 버튼) | TaskActions | FR-006 |

---

## 7. 추적성 검증 요약

### 7.1 커버리지 통계

| 구분 | 총 항목 | 매핑 완료 | 미매핑 | 커버리지 |
|------|---------|----------|--------|---------|
| 기능 요구사항 (FR) | 10 | 10 | 0 | 100% |
| 비즈니스 규칙 (BR) | 5 | 5 | 0 | 100% |
| 단위 테스트 (UT) | 12 | 12 | 0 | 100% |
| E2E 테스트 | 8 | 8 | 0 | 100% |
| 매뉴얼 테스트 (TC) | 6 | 6 | 0 | 100% |

### 7.2 미매핑 항목 (있는 경우)

| 구분 | ID | 설명 | 미매핑 사유 |
|------|-----|------|-----------|
| - | - | - | - |

**검증 결과**: 모든 요구사항, 비즈니스 규칙이 설계 및 테스트에 매핑됨. 추적성 100% 달성.

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
