# 기본설계: Workflow API & Settings

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/WBS와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-03 |
| Task명 | Workflow API & Settings |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 5.2, 5.3, 8.1 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-03-03 요구사항 |

---

## 1. 목적 및 범위

### 1.1 목적

Task의 워크플로우 상태 전이(Transition)를 관리하고, Task 문서 목록을 조회하며, 전역 설정(columns, categories, workflows, actions)을 제공하는 REST API를 구현합니다.

### 1.2 범위

**포함 범위**:
- POST /api/tasks/:id/transition - 상태 전이 API (검증, 이력 기록)
- GET /api/tasks/:id/documents - 문서 목록 조회 (존재/예정 구분)
- GET /api/settings/:type - 설정 조회 (columns, categories, workflows, actions)

**제외 범위**:
- 워크플로우 규칙 검증 로직 → TSK-03-04 (WorkflowEngine)
- 설정 수정 API (1차 범위 외)
- 문서 생성/수정 API → WP-05 (프론트엔드)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|---------|----------|
| FR-001 | 상태 전이 요청 검증 (카테고리별 워크플로우) | Critical | 5.2, 5.3 |
| FR-002 | 상태 전이 실행 (wbs.md 업데이트) | Critical | 5.2, 5.3 |
| FR-003 | 상태 전이 이력 기록 | High | 6.3.6 |
| FR-004 | Task 문서 목록 조회 | High | 6.3.3, 8.1 |
| FR-005 | 예정 문서(미생성) 표시 | High | 6.3.3 |
| FR-006 | 설정 조회 API (4가지 설정 타입) | Critical | 8.1 |
| FR-007 | 설정 타입 유효성 검사 | Medium | 8.1 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 상태 전이 응답 시간 | < 200ms |
| NFR-002 | 문서 목록 조회 응답 시간 | < 100ms |
| NFR-003 | 설정 조회 응답 시간 (캐시됨) | < 50ms |
| NFR-004 | 데이터 무결성 | 전이 실패 시 롤백 |
| NFR-005 | 테스트 커버리지 | >= 80% |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

**핵심 원칙**:
1. **설정 중앙화**: 기존 SettingsService 재사용
2. **워크플로우 연동**: 카테고리별 워크플로우 규칙 기반 검증
3. **문서 자동 발견**: 파일 시스템 스캔으로 존재 문서 파악
4. **이력 추적**: 상태 전이 시 변경 이력 기록

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| SettingsService | 설정 관리 (기존) | 전역 설정 로드/캐싱 |
| TransitionService | 상태 전이 | 규칙 검증, wbs.md 업데이트 |
| DocumentService | 문서 관리 | 존재 문서 파악, 예정 문서 목록화 |
| TaskService (확장) | Task 관리 (기존) | 문서 목록 생성 |
| API Routes | REST 엔드포인트 | 요청 처리, 에러 핸들링 |

### 3.3 데이터 흐름

**상태 전이 흐름**:
```
Client → POST /api/tasks/:id/transition
  → TransitionService.validate()
    ├─ Task 존재 여부 확인
    ├─ 현재 상태 확인
    ├─ 카테고리별 워크플로우 조회
    └─ 가능한 전이 목록 확인
  → validateTransition()
    ├─ 요청된 전이가 가능한가?
    └─ 필수 문서는 생성되어야 하는가?
  → executeTransition()
    ├─ 새 상태로 Task 업데이트
    ├─ 문서 생성 (필요 시)
    └─ wbs.md 저장 (롤백 기능 포함)
  → recordHistory()
    └─ history.json 기록
  → return TransitionResult
```

**문서 목록 조회 흐름**:
```
Client → GET /api/tasks/:id/documents
  → TaskService.getTaskDocuments()
    ├─ Task 폴더 확인
    ├─ 실제 .md 파일 목록 조회 (exist: true)
    ├─ 워크플로우 기반 예정 문서 목록 생성 (exist: false)
    └─ 병합하여 반환
```

**설정 조회 흐름**:
```
Client → GET /api/settings/:type
  → validateSettingsType()
  → SettingsService.getSettingsByType()
    └─ 캐시에서 조회 (또는 파일 로드)
  → return Settings
```

---

## 4. 상세 요구사항

### 4.1 POST /api/tasks/:id/transition - 상태 전이 API

**목적**: Task의 상태를 전이하고 관련 문서를 생성합니다.

**요청 형식**:
```
POST /api/tasks/:id/transition
Content-Type: application/json

{
  "command": "start|draft|build|verify|done|fix|skip|ui|review|apply|test|audit|patch",
  "comment": "선택적 변경 사유"
}
```

**응답 형식 (성공)**:
```json
{
  "success": true,
  "taskId": "TSK-01-01-01",
  "previousStatus": "[ ]",
  "newStatus": "[bd]",
  "command": "start",
  "documentCreated": "010-basic-design.md",
  "timestamp": "2025-12-14T10:30:00Z"
}
```

**응답 형식 (실패)**:
```json
{
  "success": false,
  "error": "INVALID_TRANSITION",
  "message": "Cannot transition from [bd] to [xx] with command 'done'",
  "timestamp": "2025-12-14T10:30:00Z"
}
```

**비즈니스 규칙**:
- BR-001: Task는 카테고리별 워크플로우 규칙을 따름
- BR-002: 상태 전이는 명령어(command) 기반 (예: start, draft, build)
- BR-003: 전이 성공 시 wbs.md 업데이트 및 이력 기록
- BR-004: 전이 실패 시 원본 상태 유지 (롤백)
- BR-005: 문서 생성이 필요한 경우 자동으로 템플릿 생성

**에러 시나리오**:
- 400: Task ID 형식 오류, 명령어 미제공
- 404: Task 존재하지 않음
- 409: 불가능한 상태 전이
- 500: wbs.md 저장 실패

### 4.2 GET /api/tasks/:id/documents - 문서 목록 조회

**목적**: Task의 현재 상태에서 존재하는 문서와 예정된 문서를 반환합니다.

**요청 형식**:
```
GET /api/tasks/:id/documents
```

**응답 형식**:
```json
{
  "taskId": "TSK-01-01-01",
  "documents": [
    {
      "name": "010-basic-design.md",
      "path": "tasks/TSK-01-01-01/010-basic-design.md",
      "exists": true,
      "type": "design",
      "stage": "현재",
      "size": 12345,
      "createdAt": "2025-12-14T10:00:00Z",
      "updatedAt": "2025-12-14T10:30:00Z"
    },
    {
      "name": "020-detail-design.md",
      "path": "tasks/TSK-01-01-01/020-detail-design.md",
      "exists": false,
      "type": "design",
      "stage": "예정",
      "expectedAfter": "[dd] 상태 진입 시",
      "command": "draft"
    },
    {
      "name": "030-implementation.md",
      "path": "tasks/TSK-01-01-01/030-implementation.md",
      "exists": false,
      "type": "implementation",
      "stage": "예정",
      "expectedAfter": "[im] 상태 진입 시",
      "command": "build"
    }
  ]
}
```

**필드 설명**:
- `name`: 문서 파일명
- `path`: 프로젝트 상대 경로
- `exists`: 실제 파일 존재 여부
- `type`: 문서 유형 (design, implementation, test, manual, analysis, review)
- `stage`: "현재" (존재) 또는 "예정" (미생성)
- `size`, `createdAt`, `updatedAt`: 존재 파일만 포함
- `expectedAfter`, `command`: 예정 문서만 포함

**문서 분류 로직**:
1. **실제 파일**: 파일 시스템에서 `.md` 파일 스캔
2. **예정 문서**: 현재 상태 다음의 워크플로우 전이에서 참조하는 문서들

**에러 시나리오**:
- 400: Task ID 형식 오류
- 404: Task 존재하지 않음
- 500: 파일 시스템 오류

### 4.3 GET /api/settings/:type - 설정 조회

**목적**: 전역 설정을 조회합니다. (기존 구현 확인 필요)

**요청 형식**:
```
GET /api/settings/columns
GET /api/settings/categories
GET /api/settings/workflows
GET /api/settings/actions
```

**응답 형식** (columns):
```json
{
  "version": "1.0",
  "columns": [
    {
      "id": "todo",
      "name": "Todo",
      "statusCode": "[ ]",
      "order": 1,
      "color": "#6b7280",
      "description": "대기 중인 작업"
    },
    ...
  ]
}
```

**설정 타입**:
- `columns`: 칸반 컬럼 (6단계)
- `categories`: 카테고리 (development, defect, infrastructure)
- `workflows`: 워크플로우 규칙 (상태 전이)
- `actions`: 상태 내 액션 (상태 변경 없는 동작)

**비즈니스 규칙**:
- BR-006: 설정 타입은 4가지로 제한
- BR-007: 설정은 캐싱되어 반복 파일 I/O 방지
- BR-008: 잘못된 타입 요청 시 400 에러

**에러 시나리오**:
- 400: 설정 타입 미제공, 무효한 타입
- 500: 설정 파일 로드 실패

---

## 5. 데이터 모델

### 5.1 핵심 데이터 구조

**TransitionRequest**:
```
{
  command: string              // 전이 명령어
  comment?: string             // 변경 사유 (선택)
}
```

**TransitionResult**:
```
{
  success: boolean
  taskId: string
  previousStatus?: string      // success=true일 때
  newStatus?: string           // success=true일 때
  command?: string
  documentCreated?: string     // 생성된 문서명
  error?: string               // success=false일 때
  message?: string
  timestamp: string
}
```

**DocumentInfo** (확장):
```
{
  name: string
  path: string
  exists: boolean
  type: DocumentType           // design | implementation | test | manual | analysis | review
  stage: "현재" | "예정"
  size?: number                // exists=true일 때
  createdAt?: string           // exists=true일 때
  updatedAt?: string           // exists=true일 때
  expectedAfter?: string       // exists=false일 때
  command?: string             // exists=false일 때
}
```

**HistoryEntry** (확장):
```
{
  taskId: string
  timestamp: string
  userId?: string
  action: "transition" | "action"
  previousStatus: string
  newStatus: string
  command: string
  comment?: string
  documentCreated?: string
}
```

### 5.2 기존 구조 활용

**SettingsService** (TSK-02-03-02 기존):
- `loadSettings()`: 전체 설정 로드
- `getSettingsByType()`: 타입별 설정 조회
- 캐싱 및 검증 기능 포함

**TaskService** (TSK-03-02 기존):
- `buildDocumentInfoList()`: 문서 목록 생성 (기존)
- `findTaskInTree()`: Task 검색 (기존)

---

## 6. 인터페이스 요구사항

### 6.1 Backend Service (신규/확장)

| 서비스 | 함수 | 입력 | 출력 |
|--------|------|------|------|
| TransitionService | validateTransition() | taskId, command | boolean |
| TransitionService | executeTransition() | taskId, command | TransitionResult |
| TransitionService | getAvailableCommands() | taskId | string[] |
| DocumentService | getTaskDocuments() | taskId | DocumentInfo[] |
| DocumentService | getExpectedDocuments() | taskId | DocumentInfo[] |
| HistoryService | recordTransition() | HistoryEntry | void |

### 6.2 REST API

| Method | Endpoint | 설명 | Status |
|--------|----------|------|--------|
| POST | /api/tasks/:id/transition | 상태 전이 | 201/400/404/409 |
| GET | /api/tasks/:id/documents | 문서 목록 조회 | 200/404 |
| GET | /api/settings/:type | 설정 조회 | 200/400/500 |

---

## 7. 의존성 및 제약

### 7.1 의존성

**선행 Task**:
- TSK-02-03-02: SettingsService (설정 로드/캐싱)
- TSK-02-03-01: 설정 JSON 스키마 (타입 정의)
- TSK-03-02: TaskService (Task 검색)
- TSK-02-02-01/02: WbsParser/Serializer (wbs.md 파싱/저장)

**외부 라이브러리**:
- h3: HTTP 프레임워크 (기존)
- 파일 시스템 API (기존 file.ts)

### 7.2 제약사항

1. **파일 기반 데이터**: wbs.md가 유일한 진실 공급원
2. **동시성 제어**: 하나의 Task 수정만 가능 (낙관적 잠금)
3. **캐싱**: 설정은 서버 재시작 시만 갱신
4. **성능**: 큰 WBS 트리 (1000+ 노드)에서 응답 시간 < 500ms

---

## 8. 테스트 전략

### 8.1 단위 테스트

**TransitionService**:
- 유효한 상태 전이 (development, defect, infrastructure)
- 불가능한 상태 전이
- 문서 생성 로직
- 이력 기록

**DocumentService**:
- 존재 문서 목록 조회
- 예정 문서 목록 조회
- 병합된 문서 목록 (정렬, 중복 제거)

**설정 API**:
- 모든 설정 타입 조회
- 무효한 타입 요청
- 캐시 동작

### 8.2 E2E 테스트

- 상태 전이 → 문서 생성 → 이력 기록 전체 흐름
- 트리 계층별 (WP, ACT, TSK) Task 전이
- 동시 전이 요청 처리 (롤백 테스트)

---

## 9. 위험 및 완화 방안

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| wbs.md 파일 손상 | 심각 | 저장 전 유효성 검증, 롤백 기능 |
| 동시 수정 충돌 | 중간 | updated 필드 기반 낙관적 잠금 |
| 설정 파일 없음 | 낮음 | 기본값 사용, 경고 로그 |
| 대용량 WBS 성능 | 중간 | 캐싱, 부분 로드 (향후) |

---

## 10. 검토 기준

**설계 검토 완료 기준**:
1. [ ] PRD 5.2, 5.3, 8.1 요구사항 모두 포함
2. [ ] 기존 SettingsService, TaskService와의 연동 명확
3. [ ] 에러 처리 전략 수립
4. [ ] 테스트 전략 수립
5. [ ] 성능/보안 고려사항 점검

---

## 11. 산출물 정의

| 문서 | 담당 | 일정 |
|------|------|------|
| 020-detail-design.md | Claude Code | TSK-03-03 [dd] 상태 |
| 025-traceability-matrix.md | Claude Code | TSK-03-03 [dd] 상태 |
| 026-test-specification.md | Claude Code | TSK-03-03 [dd] 상태 |
| 030-implementation.md | Claude Code | TSK-03-03 [im] 상태 |

---

**문서 버전**: 1.0.0
**최종 승인**: 검토 완료 시 확인 예정
