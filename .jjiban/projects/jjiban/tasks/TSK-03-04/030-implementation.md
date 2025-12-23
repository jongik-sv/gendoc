# 구현: Workflow Engine

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-04 |
| Task명 | Workflow Engine |
| Category | development |
| 상태 | [im] 구현 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| 상세설계 | `020-detail-design.md` | 전체 |

---

## 1. 구현 개요

### 1.1 구현 목표

TransitionService를 감싸는 고수준 워크플로우 오케스트레이션 계층 구현:
- 상태 매핑 유틸리티 (status code ↔ state name)
- 워크플로우 엔진 서비스
- API 엔드포인트 (가능한 명령어 조회, 이력 조회)

### 1.2 구현 범위

**Core Services**:
- `server/utils/workflow/stateMapper.ts` - 상태 코드 매핑
- `server/utils/workflow/workflowEngine.ts` - 워크플로우 오케스트레이션

**API Layer**:
- `server/api/tasks/[id]/available-commands.get.ts` - 가능한 명령어 조회
- `server/api/tasks/[id]/history.get.ts` - 워크플로우 이력 조회

**Types**:
- `types/index.ts` - WorkflowState, WorkflowHistory 인터페이스 추가

---

## 2. 구현 상세

### 2.1 State Mapper (server/utils/workflow/stateMapper.ts)

**목적**: status code ([bd]) ↔ state name (basic-design) 양방향 매핑

**핵심 함수**:

1. **statusCodeToName(category, statusCode)**
   - workflows.json 기반 동적 매핑
   - "[bd]" → "basic-design" 변환
   - "[ ]" → "todo" 변환

2. **nameToStatusCode(category, stateName)**
   - 역방향 매핑
   - "basic-design" → "[bd]" 변환
   - "todo" → "[ ]" 변환

3. **getAllStateMappings(category)**
   - 카테고리별 모든 상태 매핑 조회
   - Record<상태코드, 상태명> 반환

**설계 결정**:
- workflows.json 기반 동적 매핑 → 설정 변경 시 코드 수정 불필요
- 카테고리별 분리 → development, defect, infrastructure 각각 다른 매핑

### 2.2 Workflow Engine (server/utils/workflow/workflowEngine.ts)

**목적**: 고수준 워크플로우 오케스트레이션

**핵심 함수**:

1. **getWorkflowState(taskId)**
   - Task의 현재 워크플로우 상태 조회
   - status code, state name, 가능한 명령어 포함
   - TransitionService.getAvailableCommands() 위임

2. **getAvailableCommands(taskId)**
   - TransitionService 직접 래핑
   - 가능한 명령어 배열 반환

3. **executeCommand(taskId, command, comment)**
   - TransitionService.executeTransition() 위임
   - 이력 기록 (workflow-history.json)
   - TransitionResult 반환

4. **queryHistory(taskId, filter)**
   - 워크플로우 이력 조회
   - 필터링 (action, limit, offset)
   - workflow-history.json 읽기

**설계 결정**:
- TransitionService 재사용 → 중복 코드 방지
- 이력 별도 관리 → workflow-history.json (최대 100개)
- 고수준 추상화 → API 계층에서 사용하기 쉬운 인터페이스

### 2.3 API Endpoints

#### GET /api/tasks/:id/available-commands

**요청**:
```http
GET /api/tasks/TSK-01-01-01/available-commands
```

**응답**:
```json
{
  "taskId": "TSK-01-01-01",
  "category": "development",
  "currentStatus": "[bd]",
  "commands": ["draft"]
}
```

**로직**:
1. Task 존재 확인 (findTaskById)
2. TransitionService.getAvailableCommands() 호출
3. 현재 상태 코드 추출
4. JSON 응답 반환

#### GET /api/tasks/:id/history

**요청**:
```http
GET /api/tasks/TSK-01-01-01/history?action=transition&limit=10
```

**응답**:
```json
{
  "taskId": "TSK-01-01-01",
  "history": [
    {
      "taskId": "TSK-01-01-01",
      "timestamp": "2025-12-14T10:30:00Z",
      "action": "transition",
      "previousStatus": "[ ]",
      "newStatus": "bd",
      "command": "start",
      "documentCreated": "010-basic-design.md"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**로직**:
1. 쿼리 파라미터 파싱 (action, limit, offset)
2. 유효성 검증
3. workflowEngine.queryHistory() 호출
4. JSON 응답 반환

---

## 3. 구현 체크리스트

### 3.1 Core Services
- [x] stateMapper.ts 구현
  - [x] statusCodeToName()
  - [x] nameToStatusCode()
  - [x] getAllStateMappings()
- [x] workflowEngine.ts 구현
  - [x] getWorkflowState()
  - [x] getAvailableCommands() (래퍼)
  - [x] executeCommand() (래퍼 + 이력 기록)
  - [x] queryHistory()

### 3.2 API Layer
- [x] GET /api/tasks/:id/available-commands
- [x] GET /api/tasks/:id/history

### 3.3 Types
- [x] types/index.ts에 WorkflowState 추가
- [x] types/index.ts에 WorkflowHistory 추가

---

## 4. 핵심 로직 설명

### 4.1 상태 코드 매핑 (stateMapper.ts)

workflows.json 구조:
```json
{
  "workflows": {
    "development": {
      "states": ["todo", "basic-design", "detail-design", "implement", "verify", "done"],
      "transitions": [
        { "from": "todo", "to": "basic-design", "command": "start" },
        { "from": "basic-design", "to": "detail-design", "command": "draft" }
      ]
    }
  }
}
```

**매핑 로직**:
1. statusCodeToName("development", "bd")
   - workflows.development.transitions에서 to="bd" 찾기
   - 없으면 states 배열에서 찾기
   - 결과: "basic-design"

2. nameToStatusCode("development", "basic-design")
   - workflows.development.transitions에서 to="basic-design" 찾기
   - 결과: "[basic-design]" → "[bd]"

### 4.2 이력 기록 (workflowEngine.ts)

**파일**: `.jjiban/projects/{projectId}/tasks/{taskId}/workflow-history.json`

**구조**:
```json
[
  {
    "taskId": "TSK-01-01-01",
    "timestamp": "2025-12-14T10:30:00Z",
    "action": "transition",
    "previousStatus": "[ ]",
    "newStatus": "bd",
    "command": "start",
    "documentCreated": "010-basic-design.md"
  }
]
```

**특징**:
- 최신 항목이 배열 앞에 위치 (unshift)
- 최대 100개 유지 (splice)
- action: "transition" | "update"

---

## 5. 에러 처리

### 5.1 에러 코드 및 처리

| 에러 코드 | HTTP | 상황 | 메시지 |
|---------|------|------|--------|
| TASK_NOT_FOUND | 404 | Task 존재하지 않음 | Task를 찾을 수 없습니다: {taskId} |
| WORKFLOW_NOT_FOUND | 400 | 워크플로우 정의 없음 | 카테고리에 해당하는 워크플로우를 찾을 수 없습니다 |
| INVALID_PARAMETER | 400 | 잘못된 쿼리 파라미터 | {parameter}는 {조건}이어야 합니다 |

### 5.2 에러 응답 예시

```json
{
  "statusCode": 404,
  "statusMessage": "TASK_NOT_FOUND",
  "message": "Task를 찾을 수 없습니다: TSK-99-99-99"
}
```

---

## 6. 테스트 전략

### 6.1 단위 테스트 (미구현 - 기존 테스트 활용)

**stateMapper.test.ts**:
- statusCodeToName() 동작 검증
- nameToStatusCode() 역변환 검증
- getAllStateMappings() 전체 매핑 검증

**workflowEngine.test.ts**:
- getWorkflowState() 상태 조회 검증
- executeCommand() 이력 기록 검증
- queryHistory() 필터링 검증

### 6.2 통합 테스트 (미구현 - 기존 테스트 활용)

**workflow-engine.spec.ts**:
- GET /api/tasks/:id/available-commands 응답 검증
- GET /api/tasks/:id/history 응답 검증
- 쿼리 파라미터 유효성 검증

---

## 7. 구현 결과

### 7.1 구현된 파일

| 파일 경로 | 역할 | 라인 수 |
|----------|------|---------|
| server/utils/workflow/stateMapper.ts | 상태 코드 매핑 | ~100 |
| server/utils/workflow/workflowEngine.ts | 워크플로우 오케스트레이션 | ~200 |
| server/api/tasks/[id]/available-commands.get.ts | 가능한 명령어 API | ~40 |
| server/api/tasks/[id]/history.get.ts | 워크플로우 이력 API | ~50 |
| types/index.ts | 타입 정의 추가 | +20 |

### 7.2 핵심 기능 검증

**기능 1: 상태 매핑**
- [x] status code → state name 변환
- [x] state name → status code 역변환
- [x] 카테고리별 매핑 지원

**기능 2: 워크플로우 상태 조회**
- [x] 현재 상태 코드 추출
- [x] 상태명 조회
- [x] 가능한 명령어 조회

**기능 3: 상태 전이 및 이력**
- [x] TransitionService 위임
- [x] 이력 기록 (workflow-history.json)
- [x] 이력 조회 및 필터링

**기능 4: API 엔드포인트**
- [x] GET /api/tasks/:id/available-commands
- [x] GET /api/tasks/:id/history

---

## 8. 설계 결정 및 근거

### 8.1 TransitionService 재사용

**결정**: getAvailableCommands()는 TransitionService 직접 사용

**근거**:
- TransitionService에 이미 구현되어 있음
- 불필요한 중복 코드 방지
- WorkflowEngine은 추가 기능(상태 조회, 이력)만 담당

### 8.2 State Mapper 분리

**결정**: 상태 매핑 로직을 별도 모듈로 분리

**근거**:
- 단일 책임 원칙 (SRP)
- 재사용성 향상 (다른 모듈에서도 사용 가능)
- 테스트 용이성

### 8.3 Workflow History 저장

**결정**: workflow-history.json 파일로 별도 관리

**근거**:
- 기존 history.json과 분리 (관심사 분리)
- 워크플로우 전이 이력만 별도 추적
- 최대 100개 제한으로 파일 크기 관리

---

## 9. 다음 단계

1. [x] 기본설계 작성
2. [x] 상세설계 작성
3. [x] 구현 완료
4. [ ] 통합 테스트 (070-integration-test.md)
5. [ ] WBS 상태 업데이트: [im] → [vf]

---

## 10. 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- TransitionService: `../TSK-03-03/020-detail-design.md`
- workflows.json: `.claude/skills/jjiban-init/assets/settings/workflows.json`

---

<!--
author: Claude Code (backend-architect)
Created: 2025-12-14
Task: TSK-03-04 Workflow Engine 구현
Purpose: WorkflowEngine 서비스 구현, API 엔드포인트, State Mapper 구현
Status: 구현 완료
-->
