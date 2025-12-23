# 기본설계: WBS API

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-14

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-02 |
| Task명 | WBS API |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-14 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 8.1, 8.2 |
| TRD | `.jjiban/projects/jjiban/trd.md` | 전체 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-03-02 요구사항 |

---

## 1. 목적 및 범위

### 1.1 목적

WBS(Work Breakdown Structure) 데이터를 조회, 수정하고 개별 Task 정보를 관리하기 위한 REST API를 구현합니다. 이를 통해 프론트엔드에서 WBS 트리를 표시하고 Task 상세 정보를 편집할 수 있습니다.

### 1.2 범위

**포함 범위**:
- GET /api/projects/:id/wbs - WBS 트리 조회 (파싱, 계층 구조, 진행률)
- PUT /api/projects/:id/wbs - WBS 전체 저장 (유효성 검증, 롤백)
- GET /api/tasks/:id - Task 상세 조회 (문서 목록, 이력 포함)
- PUT /api/tasks/:id - Task 정보 수정 (이력 기록)

**제외 범위**:
- 워크플로우 상태 전이 API → TSK-03-03
- 설정 조회 API (columns, categories 등) → TSK-03-03
- Task 문서 조회/수정 API → WP-05 (프론트엔드)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WBS 트리 전체 조회 (wbs.md 파싱) | Critical | 8.1, 8.2 |
| FR-002 | WBS 트리 전체 저장 (시리얼라이즈 후 wbs.md 쓰기) | Critical | 8.1, 8.2 |
| FR-003 | Task 상세 정보 조회 (WBS 트리에서 추출 + 문서 목록) | High | 8.1, 8.2 |
| FR-004 | Task 정보 수정 (속성 변경 후 wbs.md 업데이트) | High | 8.1, 8.2 |
| FR-005 | 진행률 자동 계산 (하위 Task 기반) | Medium | 6.2, 8.2 |
| FR-006 | 이력 기록 (Task 수정 시 변경 이력 저장) | Medium | 6.3.6 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | WBS 조회 응답 시간 | < 500ms (1000 노드 기준) |
| NFR-002 | 데이터 무결성 | wbs.md 파싱/저장 시 데이터 손실 없음 |
| NFR-003 | 동시성 제어 | 파일 쓰기 시 충돌 방지 (낙관적 잠금) |
| NFR-004 | 테스트 커버리지 | >= 80% |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

WBS API는 기존에 구현된 wbs.md 파서/시리얼라이저를 활용하여 파일 기반 데이터 관리를 제공합니다.

**핵심 원칙**:
1. **단일 진실 소스(Single Source of Truth)**: wbs.md가 유일한 데이터 원본
2. **파서/시리얼라이저 활용**: TSK-02-02-01/02에서 구현된 기능 재사용
3. **원자적 저장(Atomic Write)**: wbs.md 쓰기 실패 시 롤백
4. **낙관적 잠금**: updated 필드로 동시성 충돌 감지

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| WbsService | WBS 비즈니스 로직 | wbs.md 읽기/쓰기, 트리 가공 |
| TaskService | Task 비즈니스 로직 | Task 검색, 수정, 이력 관리 |
| WbsParser | wbs.md 파싱 | Markdown → WbsNode[] 변환 (기존) |
| WbsSerializer | WbsNode[] 시리얼라이즈 | WbsNode[] → Markdown 변환 (기존) |
| WbsValidator | WBS 유효성 검증 | ID 중복, 필수 속성, 상태 검증 (기존) |

### 3.3 데이터 흐름

**WBS 조회 흐름**:
```
Client → GET /api/projects/:id/wbs → WbsService.getWbsTree()
  → readFile(wbs.md) → parseWbsMarkdown() → calculateProgress()
  → return WbsNode[]
```

**WBS 저장 흐름**:
```
Client → PUT /api/projects/:id/wbs → WbsService.saveWbsTree()
  → validateWbs() → serializeWbs() → writeFile(wbs.md)
  → rollback on error
```

**Task 조회 흐름**:
```
Client → GET /api/tasks/:id → TaskService.getTaskDetail()
  → getWbsTree() → findTaskById() → getTaskDocuments()
  → return TaskDetail
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| WBS 데이터 원본 | wbs.md vs JSON 캐시 | wbs.md | 단일 진실 소스 원칙, Git 친화적 |
| 동시성 제어 | 비관적 잠금 vs 낙관적 잠금 | 낙관적 잠금 (updated 필드) | 단일 사용자 환경, 파일 시스템 제약 |
| 진행률 계산 | 실시간 계산 vs 캐싱 | 실시간 계산 | 데이터 일관성 우선, 성능 충분 |
| Task 이력 저장 | wbs.md 내부 vs 별도 파일 | 별도 파일 (tasks/{id}/history.json) | wbs.md 크기 최소화, 이력 관리 용이 |
| 에러 롤백 전략 | 트랜잭션 로그 vs 백업 파일 | 백업 파일 (wbs.md.bak) | 간단한 구현, 충분한 복구 능력 |

---

## 5. 비즈니스 규칙

| 규칙 ID | 규칙 설명 | 검증 위치 |
|---------|----------|-----------|
| BR-001 | WBS 저장 시 필수 속성 검증 (category, status, priority) | WbsValidator |
| BR-002 | Task ID는 중복 불가 | WbsValidator.checkDuplicateIds() |
| BR-003 | progress는 자동 계산 (하위 Task 기반) | calculateProgress() |
| BR-004 | WBS 저장 실패 시 원본 파일 유지 (백업 복구) | WbsService.saveWbsTree() |
| BR-005 | Task 수정 시 이력 기록 (누가, 언제, 무엇을) | TaskService.updateTask() |
| BR-006 | wbs.md updated 필드는 저장 시 자동 갱신 | serializeWbs() with options |

---

## 6. 데이터 모델

### 6.1 WBS 메타데이터 (wbs.md 헤더)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| version | String | Y | WBS 파일 버전 (예: "1.0") |
| depth | Number | Y | 계층 깊이 (3 또는 4) |
| updated | String | Y | 최종 수정일 (YYYY-MM-DD) |
| start | String | N | 프로젝트 시작일 (YYYY-MM-DD) |

### 6.2 WbsNode (트리 노드)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | String | Y | 노드 고유 ID (WP-XX, TSK-XX-XX) |
| type | Enum | Y | 'project', 'wp', 'act', 'task' |
| title | String | Y | 노드 제목 |
| status | String | N | 상태 기호 (예: "[bd]") |
| category | Enum | N (Task만) | 'development', 'defect', 'infrastructure' |
| priority | Enum | N | 'critical', 'high', 'medium', 'low' |
| assignee | String | N | 담당자 ID |
| schedule | Object | N | { start, end } |
| tags | Array | N | 태그 목록 |
| depends | String | N | 선행 Task ID |
| requirements | Array | N | 요구사항 목록 |
| ref | String | N | 참조 문서 |
| progress | Number | Y | 진행률 (0-100) |
| taskCount | Number | Y | 하위 Task 수 |
| children | Array | Y | 하위 노드 배열 |

### 6.3 TaskDetail (Task 상세)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | String | Y | Task ID |
| title | String | Y | Task 제목 |
| category | String | Y | 카테고리 |
| status | String | Y | 상태 기호 |
| priority | String | Y | 우선순위 |
| assignee | Object | N | 담당자 정보 (TeamMember) |
| parentWp | String | Y | 소속 Work Package ID |
| parentAct | String | N | 소속 Activity ID (4단계 구조 시) |
| requirements | Array | Y | 요구사항 목록 |
| documents | Array | Y | 문서 목록 (DocumentInfo[]) |
| history | Array | Y | 변경 이력 (HistoryEntry[]) |
| availableActions | Array | Y | 가능한 워크플로우 명령어 |

### 6.4 HistoryEntry (이력 엔트리)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| timestamp | String | Y | ISO 8601 날짜시간 |
| action | String | Y | 변경 유형 (예: "status_change", "update") |
| from | String | N | 변경 전 값 |
| to | String | N | 변경 후 값 |
| user | String | N | 변경자 ID |

---

## 7. 인터페이스 정의

### 7.1 API 엔드포인트

| Method | Endpoint | 설명 | 요구사항 |
|--------|----------|------|----------|
| GET | /api/projects/:id/wbs | WBS 트리 조회 | FR-001 |
| PUT | /api/projects/:id/wbs | WBS 트리 저장 | FR-002 |
| GET | /api/tasks/:id | Task 상세 조회 | FR-003 |
| PUT | /api/tasks/:id | Task 정보 수정 | FR-004 |

### 7.2 GET /api/projects/:id/wbs

**요청**:
- Path Parameter: `id` (프로젝트 ID)

**응답 (200)**:
```json
{
  "metadata": {
    "version": "1.0",
    "depth": 4,
    "updated": "2025-12-14",
    "start": "2025-12-13"
  },
  "tree": [
    {
      "id": "WP-01",
      "type": "wp",
      "title": "Platform Infrastructure",
      "status": "planned",
      "progress": 25,
      "taskCount": 6,
      "children": [...]
    }
  ]
}
```

**에러**:
- 404: 프로젝트 또는 wbs.md 없음
- 500: 파싱 에러

### 7.3 PUT /api/projects/:id/wbs

**요청**:
```json
{
  "metadata": {
    "version": "1.0",
    "depth": 4,
    "updated": "2025-12-14"
  },
  "tree": [...]
}
```

**응답 (200)**:
```json
{
  "success": true,
  "updated": "2025-12-14"
}
```

**에러**:
- 400: 유효성 검증 실패 (ValidationError)
- 409: 동시성 충돌 (updated 필드 불일치)
- 500: 파일 쓰기 실패

### 7.4 GET /api/tasks/:id

**요청**:
- Path Parameter: `id` (Task ID, 예: "TSK-03-02")

**응답 (200)**:
```json
{
  "id": "TSK-03-02",
  "title": "WBS API",
  "category": "development",
  "status": "[bd]",
  "priority": "critical",
  "parentWp": "WP-03",
  "requirements": ["GET /api/projects/:id/wbs", ...],
  "documents": [
    {
      "name": "010-basic-design.md",
      "path": "tasks/TSK-03-02/010-basic-design.md",
      "exists": true,
      "type": "design"
    }
  ],
  "history": [
    {
      "timestamp": "2025-12-14T10:30:00Z",
      "action": "status_change",
      "from": "[ ]",
      "to": "[bd]"
    }
  ],
  "availableActions": ["draft", "review"]
}
```

**에러**:
- 404: Task 없음
- 500: 데이터 조회 실패

### 7.5 PUT /api/tasks/:id

**요청**:
```json
{
  "title": "WBS API 구현",
  "priority": "high",
  "assignee": "dev-001"
}
```

**응답 (200)**:
```json
{
  "success": true,
  "task": {
    "id": "TSK-03-02",
    "title": "WBS API 구현",
    ...
  }
}
```

**에러**:
- 400: 유효성 검증 실패
- 404: Task 없음
- 500: 저장 실패

---

## 8. 사용자 시나리오

### 8.1 시나리오 1: WBS 트리 조회

1. 사용자가 WBS 페이지 접속
2. 프론트엔드가 `GET /api/projects/jjiban/wbs` 호출
3. 서버가 wbs.md 파싱 후 트리 구조 반환
4. 프론트엔드가 트리를 렌더링하고 진행률 표시

### 8.2 시나리오 2: Task 정보 수정

1. 사용자가 Task 노드 클릭하여 상세 패널 표시
2. "편집" 버튼 클릭 후 우선순위를 "high"로 변경
3. 프론트엔드가 `PUT /api/tasks/TSK-03-02` 호출
4. 서버가 wbs.md를 파싱하여 해당 Task 찾기
5. 속성 수정 후 시리얼라이즈하여 wbs.md 저장
6. 이력 파일에 변경 기록 추가
7. 프론트엔드가 최신 Task 정보로 UI 업데이트

### 8.3 시나리오 3: WBS 전체 저장 (드래그 앤 드롭 후)

1. 사용자가 칸반 보드에서 Task를 드래그하여 상태 변경
2. 프론트엔드가 WBS 트리 전체를 `PUT /api/projects/jjiban/wbs`로 전송
3. 서버가 유효성 검증 (BR-001, BR-002)
4. wbs.md.bak 백업 파일 생성
5. 시리얼라이즈 후 wbs.md 쓰기
6. 성공 시 백업 파일 삭제, 실패 시 백업으로 복구
7. 프론트엔드가 성공 메시지 표시

---

## 9. 인수 기준

- [ ] AC-01: GET /api/projects/:id/wbs가 올바른 트리 구조와 진행률을 반환한다
- [ ] AC-02: PUT /api/projects/:id/wbs가 wbs.md를 정확하게 업데이트한다
- [ ] AC-03: Task ID 중복 시 유효성 검증 에러가 발생한다
- [ ] AC-04: WBS 저장 실패 시 원본 파일이 유지된다 (백업 복구)
- [ ] AC-05: GET /api/tasks/:id가 Task 상세 정보와 문서 목록을 반환한다
- [ ] AC-06: PUT /api/tasks/:id가 Task 정보를 수정하고 이력을 기록한다
- [ ] AC-07: 동시성 충돌 시 409 에러가 발생한다 (updated 필드 불일치)
- [ ] AC-08: 1000개 노드 WBS 조회가 500ms 이내에 완료된다

---

## 10. 리스크 및 의존성

### 10.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| wbs.md 파일 손상 | High | 백업 파일(.bak) 생성, 파싱 에러 시 복구 |
| 동시성 충돌 (여러 클라이언트) | Medium | 낙관적 잠금 (updated 필드), 충돌 시 재시도 안내 |
| 대용량 WBS 파일 (>10MB) | Low | 파싱 시간 제한, 노드 수 제한 (MAX_NODE_COUNT) |
| Task 이력 파일 누적 | Low | 이력 아카이빙 전략 (다음 버전) |

### 10.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-02-02-01 | 선행 | wbs.md 파서 구현 완료 |
| TSK-02-02-02 | 선행 | wbs.md 시리얼라이저 구현 완료 |
| TSK-02-02-03 | 선행 | WBS 유효성 검증 구현 완료 |
| TSK-03-01 | 선행 | Project API 구현 완료 (프로젝트 존재 확인) |
| TSK-02-03-03 | 선행 | 프로젝트 메타데이터 서비스 (team.json 조회) |

---

## 11. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행 (020-detail-design.md)
- 상세설계에서 다음 내용 포함:
  - WbsService 클래스 구조 및 메서드 시그니처
  - TaskService 클래스 구조 및 메서드 시그니처
  - 에러 핸들링 전략 상세
  - 백업/롤백 메커니즘 상세
  - Task 이력 저장 형식 및 로직

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 8.1, 8.2)
- TRD: `.jjiban/projects/jjiban/trd.md`
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-03-02 요구사항)
- 상세설계: `020-detail-design.md` (다음 단계)
- 선행 Task: TSK-02-02-01, TSK-02-02-02, TSK-03-01

---

<!--
author: Claude Code
Template Version: 1.0.0
-->
