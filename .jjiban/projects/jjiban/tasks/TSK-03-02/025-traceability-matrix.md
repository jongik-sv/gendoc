# 요구사항 추적성 매트릭스 (Traceability Matrix)

**Task ID:** TSK-03-02 — **Task명:** WBS API
**작성일:** 2025-12-14 — **작성자:** Claude Code

---

## 1. 목적

본 문서는 TSK-03-02 (WBS API)의 요구사항, 설계, 구현, 테스트 간 추적성을 보장하기 위해 작성되었습니다.

---

## 2. 기능 요구사항 추적성

### 2.1 FR → 설계 → 테스트 매핑

| FR ID | 요구사항 | 설계 섹션 | 구현 위치 | 테스트 ID | 상태 |
|-------|----------|-----------|-----------|-----------|------|
| FR-001 | WBS 트리 전체 조회 | 7.2, 8.1, 8.5 | server/api/projects/[id]/wbs.get.ts | UT-WBS-01, E2E-WBS-01 | 설계 완료 |
| FR-002 | WBS 트리 전체 저장 | 7.3, 8.2, 8.6 | server/api/projects/[id]/wbs.put.ts | UT-WBS-02, E2E-WBS-02 | 설계 완료 |
| FR-003 | Task 상세 정보 조회 | 7.4, 8.3, 8.7 | server/api/tasks/[id].get.ts | UT-TASK-01, E2E-TASK-01 | 설계 완료 |
| FR-004 | Task 정보 수정 | 7.5, 8.4, 8.8 | server/api/tasks/[id].put.ts | UT-TASK-02, E2E-TASK-02 | 설계 완료 |
| FR-005 | 진행률 자동 계산 | 10, BR-003 | server/utils/wbs/parser/tree.ts (기존) | UT-PROGRESS-01 | 구현 완료 (기존) |
| FR-006 | 이력 기록 | 10, BR-005 | server/utils/wbs/taskService.ts | UT-TASK-03 | 설계 완료 |

### 2.2 FR 상세 추적

#### FR-001: WBS 트리 전체 조회

| 구성 요소 | 참조 위치 | 비고 |
|----------|----------|------|
| **기본설계** | 010-basic-design.md 섹션 2.1 | 요구사항 정의 |
| **상세설계** | 020-detail-design.md 섹션 7.2, 8.1, 8.5 | API 명세, 프로세스 흐름, 시퀀스 다이어그램 |
| **API 엔드포인트** | GET /api/projects/:id/wbs | RESTful 엔드포인트 |
| **비즈니스 로직** | WbsService.getWbsTree() | wbs.md 읽기, 파싱, 진행률 계산 |
| **파서 활용** | parseWbsMarkdown() (기존) | Markdown → WbsNode[] 변환 |
| **단위 테스트** | UT-WBS-01 | WBS 조회 성공 케이스 |
| **E2E 테스트** | E2E-WBS-01 | 전체 API 호출 검증 |

#### FR-002: WBS 트리 전체 저장

| 구성 요소 | 참조 위치 | 비고 |
|----------|----------|------|
| **기본설계** | 010-basic-design.md 섹션 2.1 | 요구사항 정의 |
| **상세설계** | 020-detail-design.md 섹션 7.3, 8.2, 8.6 | API 명세, 프로세스 흐름, 시퀀스 다이어그램 |
| **API 엔드포인트** | PUT /api/projects/:id/wbs | RESTful 엔드포인트 |
| **비즈니스 로직** | WbsService.saveWbsTree() | 유효성 검증, 시리얼라이즈, wbs.md 쓰기 |
| **검증 활용** | validateWbs() (기존) | ID 중복, 필수 속성 검증 |
| **시리얼라이저 활용** | serializeWbs() (기존) | WbsNode[] → Markdown 변환 |
| **단위 테스트** | UT-WBS-02 | WBS 저장 성공 케이스, 백업/롤백 |
| **E2E 테스트** | E2E-WBS-02 | 전체 API 호출 검증, 동시성 충돌 |

#### FR-003: Task 상세 정보 조회

| 구성 요소 | 참조 위치 | 비고 |
|----------|----------|------|
| **기본설계** | 010-basic-design.md 섹션 2.1 | 요구사항 정의 |
| **상세설계** | 020-detail-design.md 섹션 7.4, 8.3, 8.7 | API 명세, 프로세스 흐름, 시퀀스 다이어그램 |
| **API 엔드포인트** | GET /api/tasks/:id | RESTful 엔드포인트 |
| **비즈니스 로직** | TaskService.getTaskDetail() | Task 검색, 문서 목록, 이력 조회 |
| **문서 목록 생성** | buildDocumentInfoList() | tasks/{id}/ 폴더 스캔 |
| **이력 조회** | readJsonFile(history.json) | 이력 파일 읽기 |
| **단위 테스트** | UT-TASK-01 | Task 조회 성공 케이스 |
| **E2E 테스트** | E2E-TASK-01 | 전체 API 호출 검증 |

#### FR-004: Task 정보 수정

| 구성 요소 | 참조 위치 | 비고 |
|----------|----------|------|
| **기본설계** | 010-basic-design.md 섹션 2.1 | 요구사항 정의 |
| **상세설계** | 020-detail-design.md 섹션 7.5, 8.4, 8.8 | API 명세, 프로세스 흐름, 시퀀스 다이어그램 |
| **API 엔드포인트** | PUT /api/tasks/:id | RESTful 엔드포인트 |
| **비즈니스 로직** | TaskService.updateTask() | Task 속성 수정, 이력 기록 |
| **이력 기록** | buildHistoryEntry() | 변경 전/후 값 기록 |
| **WBS 저장** | WbsService.saveWbsTree() | 수정된 트리 저장 |
| **단위 테스트** | UT-TASK-02 | Task 수정 성공 케이스 |
| **E2E 테스트** | E2E-TASK-02 | 전체 API 호출 검증, 이력 기록 확인 |

#### FR-005: 진행률 자동 계산

| 구성 요소 | 참조 위치 | 비고 |
|----------|----------|------|
| **기본설계** | 010-basic-design.md 섹션 2.1 | 요구사항 정의 |
| **상세설계** | 020-detail-design.md 섹션 10, BR-003 | 비즈니스 규칙 구현 명세 |
| **비즈니스 로직** | calculateProgress() (기존) | 하위 Task 기반 재귀 계산 |
| **호출 위치** | WbsParser, WbsService.getWbsTree() | 파싱 후 자동 계산 |
| **단위 테스트** | UT-PROGRESS-01 | 진행률 계산 검증 (기존) |

#### FR-006: 이력 기록

| 구성 요소 | 참조 위치 | 비고 |
|----------|----------|------|
| **기본설계** | 010-basic-design.md 섹션 2.1 | 요구사항 정의 |
| **상세설계** | 020-detail-design.md 섹션 10, BR-005 | 비즈니스 규칙 구현 명세 |
| **비즈니스 로직** | TaskService.updateTask() | 변경 전/후 값을 HistoryEntry로 기록 |
| **이력 저장** | writeJsonFile(history.json) | tasks/{id}/history.json에 저장 |
| **단위 테스트** | UT-TASK-03 | 이력 기록 검증 |
| **E2E 테스트** | E2E-TASK-02 | Task 수정 시 이력 생성 확인 |

---

## 3. 비즈니스 규칙 추적성

### 3.1 BR → 설계 → 테스트 매핑

| BR ID | 규칙 설명 | 구현 위치 | 검증 방법 | 테스트 ID | 상태 |
|-------|----------|-----------|-----------|-----------|------|
| BR-001 | Task 필수 속성 검증 | WbsValidator.validateAttributes() (기존) | 단위 테스트 | UT-VAL-01 | 구현 완료 (기존) |
| BR-002 | Task ID 중복 불가 | WbsValidator.checkDuplicates() (기존) | 단위 테스트 | UT-VAL-02 | 구현 완료 (기존) |
| BR-003 | 진행률 자동 계산 | WbsParser.calculateProgress() (기존) | 단위 테스트 | UT-PROGRESS-01 | 구현 완료 (기존) |
| BR-004 | WBS 저장 실패 시 롤백 | WbsService.saveWbsTree() | E2E 테스트 | E2E-WBS-03 | 설계 완료 |
| BR-005 | Task 수정 시 이력 기록 | TaskService.updateTask() | 단위 테스트, E2E | UT-TASK-03, E2E-TASK-02 | 설계 완료 |
| BR-006 | updated 필드 자동 갱신 | WbsService.saveWbsTree() | 단위 테스트 | UT-WBS-03 | 설계 완료 |

### 3.2 BR 상세 추적

#### BR-001: Task 필수 속성 검증

| 항목 | 내용 |
|------|------|
| **규칙 설명** | Task는 category, status, priority 필수 |
| **상세설계 참조** | 020-detail-design.md 섹션 10 |
| **구현 위치** | WbsValidator.validateAttributes() (기존) |
| **검증 시점** | PUT /api/projects/:id/wbs 호출 시 |
| **에러 응답** | 400 VALIDATION_ERROR |
| **테스트 케이스** | UT-VAL-01: Task 필수 속성 누락 시 에러 |

#### BR-002: Task ID 중복 불가

| 항목 | 내용 |
|------|------|
| **규칙 설명** | 전체 WBS 트리에서 Task ID는 고유해야 함 |
| **상세설계 참조** | 020-detail-design.md 섹션 10 |
| **구현 위치** | WbsValidator.checkDuplicates() (기존) |
| **검증 시점** | PUT /api/projects/:id/wbs 호출 시 |
| **에러 응답** | 400 VALIDATION_ERROR |
| **테스트 케이스** | UT-VAL-02: 중복 ID 발견 시 에러, E2E-WBS-04: 중복 ID 저장 시도 |

#### BR-003: 진행률 자동 계산

| 항목 | 내용 |
|------|------|
| **규칙 설명** | progress는 하위 Task의 상태 기반 자동 계산 |
| **상세설계 참조** | 020-detail-design.md 섹션 10 |
| **구현 위치** | WbsParser.calculateProgress() (기존) |
| **계산 로직** | (하위 done Task 수 / 전체 하위 Task 수) * 100 |
| **호출 시점** | WBS 조회 시, WBS 파싱 후 |
| **테스트 케이스** | UT-PROGRESS-01: 다양한 트리 구조에서 진행률 계산 검증 |

#### BR-004: WBS 저장 실패 시 롤백

| 항목 | 내용 |
|------|------|
| **규칙 설명** | wbs.md 쓰기 실패 시 백업 파일로 복구 |
| **상세설계 참조** | 020-detail-design.md 섹션 8.2, 8.6, 10 |
| **구현 위치** | WbsService.saveWbsTree() |
| **백업 메커니즘** | wbs.md → wbs.md.bak 복사 → 쓰기 → 실패 시 백업 복구 |
| **복구 전략** | copyFile(wbs.md.bak, wbs.md) |
| **테스트 케이스** | E2E-WBS-03: 쓰기 실패 시나리오, 백업 복구 확인 |

#### BR-005: Task 수정 시 이력 기록

| 항목 | 내용 |
|------|------|
| **규칙 설명** | Task 속성 변경 시 누가, 언제, 무엇을 변경했는지 기록 |
| **상세설계 참조** | 020-detail-design.md 섹션 8.4, 8.8, 10 |
| **구현 위치** | TaskService.updateTask() |
| **이력 형식** | { timestamp, action, from, to, user } |
| **저장 위치** | tasks/{id}/history.json |
| **테스트 케이스** | UT-TASK-03: 이력 엔트리 생성, E2E-TASK-02: 수정 후 이력 확인 |

#### BR-006: updated 필드 자동 갱신

| 항목 | 내용 |
|------|------|
| **규칙 설명** | wbs.md 저장 시 updated 필드를 현재 날짜로 갱신 |
| **상세설계 참조** | 020-detail-design.md 섹션 10 |
| **구현 위치** | WbsService.saveWbsTree() |
| **갱신 방법** | serializeWbs() 호출 시 { updateDate: true } 옵션 |
| **날짜 형식** | YYYY-MM-DD |
| **테스트 케이스** | UT-WBS-03: 저장 후 updated 필드 확인 |

---

## 4. 비기능 요구사항 추적성

### 4.1 NFR → 설계 → 테스트 매핑

| NFR ID | 요구사항 | 기준 | 설계 섹션 | 테스트 ID | 상태 |
|--------|----------|------|-----------|-----------|------|
| NFR-001 | WBS 조회 응답 시간 | < 500ms (1000 노드) | 12.1 | E2E-PERF-01 | 설계 완료 |
| NFR-002 | 데이터 무결성 | 파싱/저장 시 손실 없음 | 8.2, BR-004 | E2E-WBS-05 | 설계 완료 |
| NFR-003 | 동시성 제어 | 낙관적 잠금 (updated 필드) | 8.2, BR-006 | E2E-WBS-02 | 설계 완료 |
| NFR-004 | 테스트 커버리지 | >= 80% | 14 | - | 설계 완료 |

---

## 5. 설계 요소 추적성

### 5.1 모듈 → 테스트 매핑

| 모듈 | 역할 | 단위 테스트 | E2E 테스트 |
|------|------|------------|-----------|
| server/api/projects/[id]/wbs.get.ts | WBS 조회 API | - | E2E-WBS-01 |
| server/api/projects/[id]/wbs.put.ts | WBS 저장 API | - | E2E-WBS-02 |
| server/api/tasks/[id].get.ts | Task 조회 API | - | E2E-TASK-01 |
| server/api/tasks/[id].put.ts | Task 수정 API | - | E2E-TASK-02 |
| server/utils/wbs/wbsService.ts | WBS 비즈니스 로직 | UT-WBS-01, UT-WBS-02, UT-WBS-03 | - |
| server/utils/wbs/taskService.ts | Task 비즈니스 로직 | UT-TASK-01, UT-TASK-02, UT-TASK-03 | - |

### 5.2 데이터 모델 → API 응답 매핑

| 데이터 모델 | API 엔드포인트 | 응답 필드 |
|-----------|--------------|----------|
| WbsMetadata | GET /api/projects/:id/wbs | metadata.version, metadata.depth, metadata.updated |
| WbsNode | GET /api/projects/:id/wbs | tree[] |
| TaskDetail | GET /api/tasks/:id | id, title, category, status, ..., documents, history |
| HistoryEntry | GET /api/tasks/:id | history[] |
| DocumentInfo | GET /api/tasks/:id | documents[] |

---

## 6. 테스트 커버리지 매트릭스

### 6.1 기능 커버리지

| 기능 영역 | 단위 테스트 | E2E 테스트 | 커버리지 목표 |
|----------|------------|-----------|--------------|
| WBS 조회 | UT-WBS-01 | E2E-WBS-01 | 100% |
| WBS 저장 | UT-WBS-02, UT-WBS-03 | E2E-WBS-02, E2E-WBS-03, E2E-WBS-04, E2E-WBS-05 | 100% |
| Task 조회 | UT-TASK-01 | E2E-TASK-01 | 100% |
| Task 수정 | UT-TASK-02, UT-TASK-03 | E2E-TASK-02 | 100% |
| 진행률 계산 | UT-PROGRESS-01 | - | 100% |
| 유효성 검증 | UT-VAL-01, UT-VAL-02 (기존) | E2E-WBS-04 | 100% |
| 성능 | - | E2E-PERF-01 | NFR-001 충족 |

---

## 7. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-14 | Claude Code | 초기 작성 |

---

## 8. 승인

| 역할 | 이름 | 서명 | 날짜 |
|------|------|------|------|
| 설계자 | Claude Code | - | 2025-12-14 |
| 검토자 | - | - | - |
| 승인자 | - | - | - |

---

<!--
author: Claude Code
Template Version: 1.0.0
-->
