# 테스트 명세 (026-test-specification.md)

**Version:** 1.0.0 — **Last Updated:** 2025-12-17

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-01 |
| Task명 | 워크플로우 액션 UI |
| 작성일 | 2025-12-17 |

---

## 1. 테스트 범위

### 1.1 포함

| 대상 | 테스트 유형 |
|------|-------------|
| WorkflowActions | Unit, Integration |
| WorkflowButton | Unit |
| WorkflowAutoActions | Unit |
| isCommandAvailable | Unit |

### 1.2 제외

| 대상 | 사유 |
|------|------|
| 터미널 연동 | TSK-02-02 범위 |
| API 호출 | TSK-02-02 범위 |

---

## 2. 단위 테스트 케이스

### TC-001: WorkflowActions 버튼 렌더링

| 항목 | 내용 |
|------|------|
| ID | TC-001 |
| 대상 | WorkflowActions |
| 설명 | 13개 명령어 버튼이 렌더링되는지 확인 |
| 전제조건 | task prop 전달 |
| 입력 | task: { status: '[ ]', category: 'development' } |
| 예상결과 | 13개 WorkflowButton 컴포넌트 렌더링 |
| 추적 | FR-001, AC-02 |

---

### TC-002: development 상태별 버튼 활성화

| 항목 | 내용 |
|------|------|
| ID | TC-002 |
| 대상 | WorkflowActions |
| 설명 | development 카테고리 상태별 버튼 활성화 검증 |
| 전제조건 | category: 'development' |

**테스트 데이터**

| 상태 | 활성 버튼 | 비활성 버튼 |
|------|----------|------------|
| `[ ]` | start | 나머지 12개 |
| `[bd]` | ui, draft | 나머지 11개 |
| `[dd]` | review, apply, build | 나머지 10개 |
| `[im]` | test, audit, patch, verify | 나머지 9개 |
| `[vf]` | done | 나머지 12개 |

**추적**: FR-002

---

### TC-003: defect/infrastructure 상태별 버튼 활성화

| 항목 | 내용 |
|------|------|
| ID | TC-003 |
| 대상 | WorkflowActions |
| 설명 | defect/infrastructure 카테고리 상태별 버튼 활성화 검증 |

**테스트 데이터 - defect**

| 상태 | 활성 버튼 |
|------|----------|
| `[ ]` | start |
| `[an]` | fix |
| `[fx]` | audit, patch, verify |
| `[vf]` | done |

**테스트 데이터 - infrastructure**

| 상태 | 활성 버튼 |
|------|----------|
| `[ ]` | start, skip |
| `[dd]` | build |
| `[im]` | audit, patch, done |

**추적**: FR-002

---

### TC-004: 버튼 상태 스타일링

| 항목 | 내용 |
|------|------|
| ID | TC-004 |
| 대상 | WorkflowButton |
| 설명 | 버튼 상태별 스타일 적용 검증 |

**테스트 케이스**

| 입력 | 예상 severity | 예상 disabled | 예상 loading |
|------|--------------|---------------|--------------|
| disabled=false, loading=false | command.severity | false | false |
| disabled=true, loading=false | 'secondary' | true | false |
| disabled=true, loading=true | command.severity | true | true |

**추적**: FR-003, AC-03, AC-04

---

### TC-005: 자동실행 버튼 렌더링

| 항목 | 내용 |
|------|------|
| ID | TC-005 |
| 대상 | WorkflowAutoActions |
| 설명 | Run, Auto, 중지 버튼 렌더링 및 조건부 표시 |

**테스트 케이스**

| isExecuting | Run | Auto | 중지 |
|-------------|-----|------|------|
| false | 표시 | 표시 | 숨김 |
| true | 표시 | 표시 | 표시 |

**추적**: FR-004, AC-05

---

### TC-006: execute 이벤트 emit

| 항목 | 내용 |
|------|------|
| ID | TC-006 |
| 대상 | WorkflowActions |
| 설명 | 활성 버튼 클릭 시 execute 이벤트 emit 확인 |
| 전제조건 | task: { status: '[bd]', category: 'development' } |
| 입력 | 'draft' 버튼 클릭 |
| 예상결과 | emit('execute', 'draft') |
| 추적 | FR-005, AC-06 |

---

### TC-007: 버튼 반응 시간

| 항목 | 내용 |
|------|------|
| ID | TC-007 |
| 대상 | WorkflowButton |
| 설명 | 버튼 클릭 후 이벤트 emit까지 100ms 이내 |
| 측정방법 | performance.now() 차이 |
| 기준 | < 100ms |
| 추적 | NFR-001 |

---

### TC-008: 키보드 네비게이션

| 항목 | 내용 |
|------|------|
| ID | TC-008 |
| 대상 | WorkflowActions |
| 설명 | Tab 키로 버튼 간 이동 가능 |
| 입력 | Tab 키 입력 |
| 예상결과 | 다음 버튼으로 포커스 이동 |
| 추적 | NFR-002 |

---

### TC-009: WorkflowButton Props 렌더링

| 항목 | 내용 |
|------|------|
| ID | TC-009 |
| 대상 | WorkflowButton |
| 설명 | command props에 따른 label, icon, severity 렌더링 |
| 입력 | command: { name: 'build', label: '구현', icon: 'pi-wrench', severity: 'warning' } |
| 예상결과 | label="구현", icon="pi pi-wrench", severity="warning" |
| 추적 | AC-01 |

---

## 3. 통합 테스트 케이스

### TC-INT-001: TaskDetailPanel → WorkflowActions 통합

| 항목 | 내용 |
|------|------|
| ID | TC-INT-001 |
| 대상 | TaskDetailPanel + WorkflowActions |
| 설명 | Task 선택 시 해당 상태/카테고리에 맞는 버튼 활성화 |
| 전제조건 | WBS 페이지 로드 |
| 단계 | 1. Task 선택<br>2. WorkflowActions 확인 |
| 예상결과 | 선택된 Task의 상태/카테고리에 맞는 버튼만 활성화 |

---

## 4. 경계값 테스트

### TC-EDGE-001: 빈 Task

| 항목 | 내용 |
|------|------|
| ID | TC-EDGE-001 |
| 입력 | task: null 또는 undefined |
| 예상결과 | 컴포넌트 미렌더링 또는 에러 없이 빈 상태 |

### TC-EDGE-002: 알 수 없는 상태 코드

| 항목 | 내용 |
|------|------|
| ID | TC-EDGE-002 |
| 입력 | task: { status: '[unknown]', category: 'development' } |
| 예상결과 | 모든 버튼 비활성화 |

---

## 5. 테스트 환경

| 항목 | 값 |
|------|---|
| 프레임워크 | Vitest |
| 렌더링 | @vue/test-utils |
| 목 라이브러리 | vitest mock |
| 커버리지 도구 | @vitest/coverage-v8 |
| 목표 커버리지 | >= 80% |

---

<!--
author: Claude
Version: 1.0.0
-->
