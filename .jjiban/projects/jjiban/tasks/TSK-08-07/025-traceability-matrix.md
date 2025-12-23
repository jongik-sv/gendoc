# 추적성 매트릭스: Task Panel Enhancement - Stepper & Missing Info

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-07 |
| Category | development |
| 작성일 | 2025-12-16 |
| 관련 문서 | 010-basic-design.md, 011-ui-design.md, 020-detail-design.md |

---

## 1. 요구사항 추적성

### 1.1 PRD → 기본설계 → 상세설계 → 구현

| PRD 요구사항 | 기본설계 | 상세설계 | 구현 대상 | 테스트 |
|------------|---------|---------|----------|--------|
| PRD 8.3.1: TaskDetail에 completed 필드 추가 | BR-001 | 섹션 3.2, 4.2 | types/index.ts, taskService.ts | UT-003, UT-004 |
| PRD 8.3.1: getTaskDetail() API 수정 | FR-003 | 섹션 4.1, 4.2 | taskService.ts | IT-001 |
| PRD 8.3.2: TaskProgress Stepper 변환 | FR-001 | 섹션 5.1 | TaskProgress.vue | UT-001, E2E-001 |
| PRD 8.3.2: Popover 통합 | FR-002 | 섹션 5.1.2 | TaskProgress.vue | UT-002, E2E-001 |
| PRD 8.3.2: 완료일 표시 | FR-002 | 섹션 5.1.3 | TaskProgress.vue | UT-003 |
| PRD 8.3.2: Auto 버튼 | FR-002 | 섹션 5.1.3 | TaskProgress.vue | IT-001 |
| PRD 8.3.2: 액션 버튼들 | FR-002 | 섹션 5.1.3 | TaskProgress.vue | IT-002 |
| PRD 8.3.3: TaskBasicInfo schedule 추가 | FR-004 | 섹션 5.2.1 | TaskBasicInfo.vue | UT-005 |
| PRD 8.3.3: TaskBasicInfo tags 추가 | FR-004 | 섹션 5.2.1 | TaskBasicInfo.vue | UT-006 |
| PRD 8.3.3: TaskBasicInfo depends 추가 | FR-004 | 섹션 5.2.1 | TaskBasicInfo.vue | UT-007, IT-004 |
| PRD 8.3.3: TaskBasicInfo ref 추가 | FR-004 | 섹션 5.2.1 | TaskBasicInfo.vue | UT-005 |
| PRD 8.3: WCAG 2.1 AA 준수 | FR-005 | 섹션 9 (접근성) | TaskProgress.vue | E2E-003 |

---

## 2. 기능 요구사항 추적성

### 2.1 기능 요구사항 → 설계 → 구현 → 테스트

| FR ID | 요구사항 | 설계 섹션 | 구현 파일 | 테스트 ID | 상태 |
|-------|---------|----------|----------|---------|------|
| FR-001 | Stepper UI 렌더링 | 5.1 | TaskProgress.vue | UT-001 | 설계 완료 |
| FR-002 | Popover 통합 및 액션 제공 | 5.1 | TaskProgress.vue | UT-002, IT-001, IT-002 | 설계 완료 |
| FR-003 | completed 필드 API 반환 | 4.2 | taskService.ts | UT-003, UT-004 | 설계 완료 |
| FR-004 | TaskBasicInfo 필드 확장 | 5.2 | TaskBasicInfo.vue | UT-005, UT-006, UT-007 | 설계 완료 |
| FR-005 | 접근성 (WCAG AA) | 9 | TaskProgress.vue | E2E-003 | 설계 완료 |

---

## 3. 비즈니스 규칙 추적성

### 3.1 비즈니스 규칙 → 설계 → 구현

| BR ID | 규칙 설명 | 설계 섹션 | 구현 위치 | 검증 테스트 | 상태 |
|-------|----------|----------|----------|------------|------|
| BR-001 | 현재 단계의 액션 버튼만 활성화 | 5.1.2 (템플릿) | TaskProgress.vue (라인 392-405) | IT-002 | 설계 완료 |
| BR-002 | 완료된 단계는 체크 아이콘 표시 | 5.1.2 (템플릿) | TaskProgress.vue (라인 351-354) | UT-001 | 설계 완료 |
| BR-003 | 미완료 단계는 비활성화 스타일 | 5.1.2 (템플릿) | TaskProgress.vue (라인 340) | UT-001 | 설계 완료 |
| BR-004 | Auto 버튼은 현재 단계 Popover에서만 표시 | 5.1.2 (템플릿) | TaskProgress.vue (라인 379-389) | IT-001 | 설계 완료 |
| BR-005 | depends 클릭 시 해당 Task로 이동 | 5.2.2 (스크립트) | TaskBasicInfo.vue (라인 856-859) | UT-007, IT-004 | 설계 완료 |

---

## 4. 화면 설계 추적성

### 4.1 화면 → UI 컴포넌트 → 구현

| 화면 ID | 화면명 | UI 컴포넌트 | 구현 파일 | 테스트 ID | 상태 |
|---------|--------|------------|----------|---------|------|
| SCR-01 | TaskProgress Stepper | Stepper 노드, 연결선, ProgressBar | TaskProgress.vue | UT-001, E2E-001 | 설계 완료 |
| SCR-02 | Step Popover | Popover, CompletedDate, AutoButton, ActionButtons | TaskProgress.vue | UT-002, IT-001, IT-002 | 설계 완료 |
| SCR-03 | TaskBasicInfo 확장 | schedule, tags, depends, ref 필드 | TaskBasicInfo.vue | UT-005, UT-006, UT-007 | 설계 완료 |

---

## 5. 데이터 요구사항 추적성

### 5.1 데이터 필드 → 타입 → API → 컴포넌트

| 데이터 필드 | 타입 정의 | API 응답 | 컴포넌트 사용 | 테스트 ID | 상태 |
|-----------|---------|---------|-------------|---------|------|
| completed | CompletedTimestamps | getTaskDetail() | TaskProgress.vue | UT-003, UT-004 | 설계 완료 |
| schedule | ScheduleRange | getTaskDetail() | TaskBasicInfo.vue | UT-005 | 이미 구현됨 |
| tags | string[] | getTaskDetail() | TaskBasicInfo.vue | UT-006 | 이미 구현됨 |
| depends | string[] | getTaskDetail() | TaskBasicInfo.vue | UT-007, IT-004 | 이미 구현됨 |
| ref | string | getTaskDetail() | TaskBasicInfo.vue | UT-005 | 이미 구현됨 |
| availableActions | string[] | getTaskDetail() | TaskProgress.vue | IT-002 | 이미 구현됨 |

---

## 6. 테스트 커버리지 매트릭스

### 6.1 요구사항 → 테스트 커버리지

| 요구사항 | 단위 테스트 | 통합 테스트 | E2E 테스트 | 커버리지 % |
|---------|-----------|-----------|-----------|-----------|
| Stepper UI 렌더링 | UT-001 | - | E2E-001 | 100% |
| Popover 토글 | UT-002 | IT-003 | E2E-001 | 100% |
| 완료일 표시 | UT-003, UT-004 | - | - | 100% |
| Auto 명령 실행 | - | IT-001 | E2E-001 | 100% |
| 액션 버튼 실행 | - | IT-002 | E2E-001 | 100% |
| schedule 렌더링 | UT-005 | - | - | 100% |
| tags 렌더링 | UT-006 | - | - | 100% |
| depends 네비게이션 | UT-007 | IT-004 | E2E-002 | 100% |
| 접근성 (WCAG AA) | - | - | E2E-003 | 100% |

---

## 7. 변경 영향 분석

### 7.1 파일 변경 → 영향 범위 → 테스트

| 변경 파일 | 변경 유형 | 영향 컴포넌트 | 영향 범위 | 테스트 필요 | 상태 |
|---------|---------|-------------|----------|-----------|------|
| types/index.ts | 수정 | TaskDetail 인터페이스 | 전체 (타입 참조) | UT-003, UT-004 | 설계 완료 |
| taskService.ts | 수정 | getTaskDetail() | TaskDetailPanel | IT-001 | 설계 완료 |
| TaskProgress.vue | 대규모 수정 | Stepper, Popover | TaskDetailPanel | UT-001, UT-002, IT-001, IT-002, E2E-001 | 설계 완료 |
| TaskBasicInfo.vue | 중간 수정 | 필드 4개 추가 | TaskDetailPanel | UT-005, UT-006, UT-007, IT-004 | 설계 완료 |
| main.css | 수정 | CSS 클래스 추가 | 전체 (스타일) | E2E-001 | 설계 완료 |

---

## 8. 의존성 매트릭스

### 8.1 컴포넌트 의존성

| 컴포넌트 | 의존 컴포넌트 | 의존 서비스 | 의존 스토어 | 의존 타입 | 상태 |
|---------|-------------|------------|-----------|----------|------|
| TaskProgress.vue | Popover, Button, Badge, ProgressBar | taskService | selectionStore | TaskDetail | 설계 완료 |
| TaskBasicInfo.vue | Tag, Button | taskService | selectionStore, projectStore | TaskDetail, TeamMember | 설계 완료 |
| taskService.ts | - | wbsService, fileService | - | WbsNode, TaskDetail | 설계 완료 |

---

## 9. 위험 추적성

### 9.1 위험 → 완화 전략 → 검증

| 위험 ID | 위험 설명 | 완화 전략 | 검증 방법 | 테스트 ID | 상태 |
|---------|----------|----------|----------|---------|------|
| RISK-001 | Popover 성능 저하 | 지연 렌더링 적용 | Chrome DevTools Performance | E2E-001 | 설계 완료 |
| RISK-002 | completed 필드 없음 | Fallback "미완료" 표시 | 단위 테스트 | UT-004 | 설계 완료 |
| RISK-003 | depends Task 순환 참조 | Task ID 유효성 검증 | 통합 테스트 | IT-004 | 설계 완료 |
| RISK-004 | Auto 명령 미구현 | 향후 구현 예정 메시지 | 통합 테스트 | IT-001 | 설계 완료 |
| RISK-005 | 사용자 혼란 (새 UI) | 인터랙티브 가이드 제공 | 사용자 테스트 | - | 계획 중 |
| RISK-006 | 접근성 미준수 | WCAG 테스트 자동화 | E2E 테스트 | E2E-003 | 설계 완료 |

---

## 10. 수용 기준 추적성

### 10.1 수용 기준 → 구현 → 검증

| AC ID | 수용 기준 | 구현 파일 | 검증 방법 | 테스트 ID | 상태 |
|-------|----------|----------|----------|---------|------|
| AC-001 | TaskDetail API에서 completed 필드 반환 | taskService.ts | API 테스트 | IT-001 | 설계 완료 |
| AC-002 | TaskProgress가 Stepper 형태로 렌더링 | TaskProgress.vue | 컴포넌트 테스트 | UT-001 | 설계 완료 |
| AC-003 | Stepper 단계 클릭 시 Popover 표시 | TaskProgress.vue | 인터랙션 테스트 | UT-002 | 설계 완료 |
| AC-004 | Popover 맨 위에 완료일 표시 | TaskProgress.vue | UI 테스트 | UT-003 | 설계 완료 |
| AC-005 | Popover에 Auto 버튼 표시 및 동작 | TaskProgress.vue | 통합 테스트 | IT-001 | 설계 완료 |
| AC-006 | Popover에 해당 단계 액션 버튼 표시 | TaskProgress.vue | 통합 테스트 | IT-002 | 설계 완료 |
| AC-007 | 현재 단계만 액션 버튼 활성화 | TaskProgress.vue | 비즈니스 로직 테스트 | IT-002 | 설계 완료 |
| AC-008 | TaskBasicInfo에 schedule 표시 | TaskBasicInfo.vue | 컴포넌트 테스트 | UT-005 | 설계 완료 |
| AC-009 | TaskBasicInfo에 tags 표시 | TaskBasicInfo.vue | 컴포넌트 테스트 | UT-006 | 설계 완료 |
| AC-010 | TaskBasicInfo에 depends 표시 (클릭 시 이동) | TaskBasicInfo.vue | 통합 테스트 | UT-007, IT-004 | 설계 완료 |
| AC-011 | TaskBasicInfo에 ref 표시 | TaskBasicInfo.vue | 컴포넌트 테스트 | UT-005 | 설계 완료 |
| AC-012 | 키보드 접근성 지원 (Tab, Enter, Escape) | TaskProgress.vue | E2E 테스트 | E2E-003 | 설계 완료 |
| AC-013 | 다크 테마 호환 | main.css | 시각적 테스트 | E2E-001 | 설계 완료 |

---

## 11. 문서 추적성

### 11.1 문서 간 참조 관계

| 소스 문서 | 대상 문서 | 참조 섹션 | 추적 항목 | 상태 |
|---------|---------|----------|----------|------|
| PRD 8.3 | 010-basic-design.md | 섹션 3, 4 | 기능 요구사항 | 완료 |
| 010-basic-design.md | 011-ui-design.md | 전체 | 화면 설계 | 완료 |
| 010-basic-design.md | 020-detail-design.md | 전체 | 상세 설계 | 완료 |
| 011-ui-design.md | 020-detail-design.md | 섹션 5 | UI 구현 설계 | 완료 |
| 020-detail-design.md | 025-traceability-matrix.md | 전체 | 추적성 | 완료 |
| 020-detail-design.md | 026-test-specification.md | 섹션 7 | 테스트 설계 | 완료 |

---

## 12. 버전 추적

| 문서 | 버전 | 작성일 | 변경 내용 | 작성자 |
|-----|------|--------|----------|-------|
| 010-basic-design.md | 1.0 | 2025-12-16 | 초기 작성 | Hong |
| 011-ui-design.md | 1.0 | 2025-12-16 | 초기 작성 | Hong |
| 020-detail-design.md | 1.0 | 2025-12-16 | 초기 작성 | Hong |
| 025-traceability-matrix.md | 1.0 | 2025-12-16 | 초기 작성 | Hong |

---

## 13. 승인 및 검토

| 역할 | 이름 | 일자 | 서명 |
|-----|------|------|------|
| 작성자 | Hong | 2025-12-16 | |
| 검토자 | | | |
| 승인자 | | | |

---

**문서 버전**: 1.0
**최종 수정일**: 2025-12-16
