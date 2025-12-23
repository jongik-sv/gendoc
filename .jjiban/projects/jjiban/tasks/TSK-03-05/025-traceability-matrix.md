# TSK-03-05: WBS 테스트 결과 업데이트 API - 추적성 매트릭스

## 문서 정보
- **Task ID**: TSK-03-05
- **작성일**: 2025-12-15
- **문서 버전**: 1.0
- **목적**: 요구사항 → 설계 → 구현 → 테스트 추적성 확보

---

## 1. 요구사항 추적성

### 1.1 기능 요구사항 (FR) → 설계 → 구현 → 테스트

| FR ID | 요구사항 | 설계 문서 참조 | 구현 위치 | 테스트 케이스 |
|-------|----------|----------------|-----------|---------------|
| FR-001 | PUT /api/projects/:id/wbs/tasks/:taskId/test-result 엔드포인트 제공 | 020-detail-design.md § 2.1 | test-result.put.ts:13-200 | TC-I-001, TC-E2E-001 |
| FR-002 | wbs.md 파일에서 특정 Task 노드 탐색 | 020-detail-design.md § 3.1 | taskService.ts:findTaskInTree | TC-U-003-001~005 |
| FR-003 | Task 노드의 test-result 속성 업데이트 | 020-detail-design.md § 2.1.4 | test-result.put.ts:95-98 | TC-I-001 |
| FR-004 | 업데이트된 WBS 트리를 wbs.md 파일에 저장 | 020-detail-design.md § 2.1.4 | test-result.put.ts:116-145 | TC-I-001 |
| FR-005 | 파일 업데이트 시 백업 생성 및 실패 시 롤백 | 020-detail-design.md § 2.1.4 | test-result.put.ts:101-115, 131-144 | TC-I-004, TC-I-005 |

### 1.2 비기능 요구사항 (NFR) → 설계 → 검증

| NFR ID | 요구사항 | 기준 | 설계 문서 참조 | 검증 방법 | 테스트 케이스 |
|--------|----------|------|----------------|-----------|---------------|
| NFR-001 | API 응답 시간 | < 500ms | 020-detail-design.md § 5 | 성능 프로파일링 | TC-PERF-001 |
| NFR-002 | 파일 안정성 | 백업 생성 후 업데이트 | 020-detail-design.md § 6.3 | 롤백 시나리오 테스트 | TC-I-004, TC-I-005 |
| NFR-003 | 동시성 | 순차 처리 | 010-basic-design.md § 2.3 | 동시 요청 테스트 | TC-CONC-001 |
| NFR-004 | 보안 | 경로 순회 공격 방지 | 020-detail-design.md § 6.1 | 보안 테스트 | TC-SEC-001~003 |

---

## 2. 비즈니스 규칙 (BR) → 설계 → 구현

| BR ID | 비즈니스 규칙 | 설계 문서 참조 | 구현 위치 | 테스트 케이스 |
|-------|---------------|----------------|-----------|---------------|
| BR-001 | Task ID 형식: TSK-XX-XX 또는 TSK-XX-XX-XX | 010-basic-design.md § 4 | test-result.put.ts:validateTaskId | TC-U-001-001~005 |
| BR-002 | test-result 유효값: none, pass, fail | 010-basic-design.md § 4 | test-result.put.ts:validateTestResult | TC-U-002-001~006 |
| BR-003 | Task 존재 여부: ID + type='task' 일치 | 010-basic-design.md § 4 | taskService.ts:findTaskInTree | TC-U-003-001~004 |
| BR-004 | 백업 및 롤백: 백업 생성 → 업데이트 → 실패 시 복원 | 010-basic-design.md § 4 | test-result.put.ts:101-144 | TC-I-004, TC-I-005 |
| BR-005 | 메타데이터 업데이트: updated 필드 자동 갱신 | 010-basic-design.md § 4 | test-result.put.ts:110 | TC-I-001 |

---

## 3. 에러 코드 → 설계 → 구현 → 테스트

| HTTP | 에러 코드 | 설계 문서 참조 | 구현 위치 | 트리거 조건 | 테스트 케이스 |
|------|-----------|----------------|-----------|-------------|---------------|
| 400 | INVALID_REQUEST | 010-basic-design.md § 3.4 | test-result.put.ts:25-30 | projectId/taskId 누락 | TC-ERR-001 |
| 400 | INVALID_PROJECT_ID | 010-basic-design.md § 3.4 | test-result.put.ts:33-38 | projectId 형식 오류 | TC-ERR-002 |
| 400 | INVALID_TASK_ID | 010-basic-design.md § 3.4 | test-result.put.ts:41-46 | taskId 형식 오류 | TC-ERR-003 |
| 400 | INVALID_REQUEST_BODY | 010-basic-design.md § 3.4 | test-result.put.ts:49-54 | body 누락/형식 오류 | TC-ERR-004 |
| 400 | INVALID_TEST_RESULT | 010-basic-design.md § 3.4 | test-result.put.ts:58-63 | testResult 값 오류 | TC-I-003 |
| 404 | PROJECT_NOT_FOUND | 010-basic-design.md § 3.4 | test-result.put.ts:68-72 | 프로젝트 미존재 | TC-ERR-005 |
| 404 | TASK_NOT_FOUND | 010-basic-design.md § 3.4 | test-result.put.ts:93-97 | Task 미존재 | TC-I-002 |
| 500 | FILE_ACCESS_ERROR | 010-basic-design.md § 3.4 | test-result.put.ts:75-79 | WBS 파일 읽기 실패 | TC-ERR-006 |
| 500 | PARSE_ERROR | 010-basic-design.md § 3.4 | test-result.put.ts:85-91 | WBS 파싱 실패 | TC-ERR-007 |
| 500 | BACKUP_FAILED | 010-basic-design.md § 3.4 | test-result.put.ts:105-109 | 백업 생성 실패 | TC-I-004 |
| 500 | SERIALIZATION_ERROR | 010-basic-design.md § 3.4 | test-result.put.ts:118-126 | WBS 직렬화 실패 | TC-ERR-008 |
| 500 | FILE_WRITE_ERROR | 010-basic-design.md § 3.4 | test-result.put.ts:135-140 | 파일 쓰기 실패 (롤백 성공) | TC-I-005 |
| 500 | ROLLBACK_FAILED | 010-basic-design.md § 3.4 | test-result.put.ts:141-145 | 롤백 실패 (치명적) | TC-ERR-009 |

---

## 4. 설계 결정 (DR) → 설계 → 구현

| DR ID | 설계 결정 | 근거 | 설계 문서 참조 | 구현 위치 |
|-------|----------|------|----------------|-----------|
| DR-001 | test-result 저장 위치: WbsNode.attributes['test-result'] | 확장성, 유연성 | 010-basic-design.md § 14.1 | types/index.ts:45 |
| DR-002 | 백업 전략: 매번 백업 생성 (wbs.md.bak) | 즉시 복구 가능 | 010-basic-design.md § 14.2 | test-result.put.ts:101-115 |
| DR-003 | 롤백 실패 처리: 치명적 에러 발생 | 데이터 무결성 우선 | 010-basic-design.md § 14.3 | test-result.put.ts:141-145 |
| DR-004 | test-result 값: none, pass, fail | 단순성, 가독성 | 010-basic-design.md § 14.4 | test-result.put.ts:validateTestResult |
| DR-005 | Task 탐색: 전체 트리 순회 | 단순성 우선, 성능 이슈 시 최적화 | 020-detail-design.md § 5 | taskService.ts:findTaskInTree |

---

## 5. 테스트 커버리지 매트릭스

### 5.1 단위 테스트 (Unit Test)

| 테스트 ID | 테스트 대상 | 커버하는 FR/BR | 설계 참조 | 구현 상태 |
|-----------|-------------|----------------|-----------|----------|
| TC-U-001-001 | validateTaskId: 3단계 Task ID | BR-001 | 020-detail-design.md § 8.1 | Pending |
| TC-U-001-002 | validateTaskId: 4단계 Task ID | BR-001 | 020-detail-design.md § 8.1 | Pending |
| TC-U-001-003 | validateTaskId: 1자리 세그먼트 거부 | BR-001 | 020-detail-design.md § 8.1 | Pending |
| TC-U-001-004 | validateTaskId: 잘못된 접두사 거부 | BR-001 | 020-detail-design.md § 8.1 | Pending |
| TC-U-001-005 | validateTaskId: 잘못된 형식 거부 | BR-001 | 020-detail-design.md § 8.1 | Pending |
| TC-U-002-001 | validateTestResult: "none" 허용 | BR-002 | 020-detail-design.md § 8.1 | Pending |
| TC-U-002-002 | validateTestResult: "pass" 허용 | BR-002 | 020-detail-design.md § 8.1 | Pending |
| TC-U-002-003 | validateTestResult: "fail" 허용 | BR-002 | 020-detail-design.md § 8.1 | Pending |
| TC-U-002-004 | validateTestResult: 대문자 거부 | BR-002 | 020-detail-design.md § 8.1 | Pending |
| TC-U-002-005 | validateTestResult: 잘못된 값 거부 | BR-002 | 020-detail-design.md § 8.1 | Pending |
| TC-U-002-006 | validateTestResult: 빈 문자열 거부 | BR-002 | 020-detail-design.md § 8.1 | Pending |
| TC-U-003-001 | findTaskInTree: 깊이 2 탐색 | FR-002, BR-003 | 020-detail-design.md § 8.2 | Pending |
| TC-U-003-002 | findTaskInTree: 깊이 3 탐색 | FR-002, BR-003 | 020-detail-design.md § 8.2 | Pending |
| TC-U-003-003 | findTaskInTree: 미존재 Task | FR-002, BR-003 | 020-detail-design.md § 8.2 | Pending |
| TC-U-003-004 | findTaskInTree: 비Task 노드 거부 | FR-002, BR-003 | 020-detail-design.md § 8.2 | Pending |
| TC-U-003-005 | findTaskInTree: 빈 트리 처리 | FR-002 | 020-detail-design.md § 8.2 | Pending |
| TC-U-004-001 | parseMetadata: 유효한 메타데이터 파싱 | BR-005 | 020-detail-design.md § 8.3 | Pending |
| TC-U-004-002 | parseMetadata: 기본값 사용 | BR-005 | 020-detail-design.md § 8.3 | Pending |
| TC-U-004-003 | parseMetadata: 빈 메타데이터 처리 | BR-005 | 020-detail-design.md § 8.3 | Pending |

### 5.2 통합 테스트 (Integration Test)

| 테스트 ID | 테스트 시나리오 | 커버하는 FR/NFR | 설계 참조 | 구현 상태 |
|-----------|----------------|-----------------|-----------|----------|
| TC-I-001 | test-result 업데이트 성공 (none → pass) | FR-001~005, NFR-002 | 020-detail-design.md § 9.1 | Pending |
| TC-I-002 | Task 미존재 (404) | FR-002, BR-003 | 020-detail-design.md § 9.2 | Pending |
| TC-I-003 | 잘못된 test-result 값 (400) | BR-002 | 020-detail-design.md § 9.2 | Pending |
| TC-I-004 | 백업 실패 시 업데이트 중단 (500) | FR-005, NFR-002, BR-004 | 020-detail-design.md § 9.2 | Pending |
| TC-I-005 | 파일 쓰기 실패 + 롤백 성공 (500) | FR-005, NFR-002, BR-004 | 020-detail-design.md § 9.2 | Pending |

### 5.3 E2E 테스트 (End-to-End Test)

| 테스트 ID | 테스트 시나리오 | 커버하는 FR/NFR | 설계 참조 | 구현 상태 |
|-----------|----------------|-----------------|-----------|----------|
| TC-E2E-001 | `/wf:test` 명령 실행 후 자동 업데이트 | FR-001~005 | 020-detail-design.md § 10.1 | Pending (TSK-03-04 후) |
| TC-E2E-002 | WBS Tree View에서 test-result 아이콘 표시 | FR-001 | 020-detail-design.md § 10.2 | Pending (UI 구현 후) |

### 5.4 성능 테스트 (Performance Test)

| 테스트 ID | 테스트 시나리오 | 커버하는 NFR | 설계 참조 | 구현 상태 |
|-----------|----------------|--------------|-----------|----------|
| TC-PERF-001 | 소규모 프로젝트 (50 노드) 응답 시간 | NFR-001 | 020-detail-design.md § 5.2 | Pending |
| TC-PERF-002 | 중규모 프로젝트 (200 노드) 응답 시간 | NFR-001 | 020-detail-design.md § 5.2 | Pending |
| TC-PERF-003 | 대규모 프로젝트 (500 노드) 응답 시간 | NFR-001 | 020-detail-design.md § 5.2 | Pending |

### 5.5 보안 테스트 (Security Test)

| 테스트 ID | 테스트 시나리오 | 커버하는 NFR | 설계 참조 | 구현 상태 |
|-----------|----------------|--------------|-----------|----------|
| TC-SEC-001 | 경로 순회 공격 방지 (projectId) | NFR-004 | 020-detail-design.md § 6.1 | Pending |
| TC-SEC-002 | 입력 검증 (testResult 값) | NFR-004 | 020-detail-design.md § 6.2 | Pending |
| TC-SEC-003 | Task ID 형식 검증 | NFR-004 | 020-detail-design.md § 6.2 | Pending |

### 5.6 동시성 테스트 (Concurrency Test)

| 테스트 ID | 테스트 시나리오 | 커버하는 NFR | 설계 참조 | 구현 상태 |
|-----------|----------------|--------------|-----------|----------|
| TC-CONC-001 | 동시 요청 시 순차 처리 | NFR-003 | 010-basic-design.md § 2.3 | Pending |

---

## 6. 코드 커버리지 목표

### 6.1 전체 커버리지

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 라인 커버리지 (Line Coverage) | 80% 이상 | vitest --coverage |
| 브랜치 커버리지 (Branch Coverage) | 75% 이상 | vitest --coverage |
| 함수 커버리지 (Function Coverage) | 85% 이상 | vitest --coverage |

### 6.2 파일별 커버리지 목표

| 파일 | 라인 커버리지 | 브랜치 커버리지 | 함수 커버리지 |
|------|---------------|-----------------|---------------|
| test-result.put.ts | 85% | 80% | 90% |
| taskService.ts (findTaskInTree) | 90% | 85% | 100% |
| validateTaskId | 100% | 100% | 100% |
| validateTestResult | 100% | 100% | 100% |
| parseMetadata | 85% | 80% | 100% |

---

## 7. 의존성 추적

### 7.1 선행 Task → 현재 Task

| 선행 Task ID | Task 명 | 제공 기능 | 현재 Task에서 활용 |
|-------------|---------|-----------|-------------------|
| TSK-03-02 | WBS Tree API (GET/PUT) | WBS 파일 읽기/쓰기 패턴 | test-result.put.ts 전체 흐름 |
| TSK-02-02-01 | WBS Parser | parseWbsMarkdown 함수 | wbs.md → WbsNode[] 변환 |
| TSK-02-02-02 | WBS Serializer | serializeWbs 함수 | WbsNode[] → wbs.md 변환 |
| TSK-02-03-03 | 에러 처리 표준화 | createBadRequestError 등 | 모든 에러 응답 |
| TSK-02-03-03 | 프로젝트 경로 관리 | validateProjectId, getWbsPath | 경로 검증 및 생성 |

### 7.2 현재 Task → 후속 Task

| 후속 Task ID | Task 명 | 현재 Task에서 제공하는 기능 |
|-------------|---------|---------------------------|
| TSK-03-04 | 워크플로우 엔진 | PUT /api/projects/:id/wbs/tasks/:taskId/test-result API |
| TSK-05-01 | WBS Tree View UI | test-result 속성 데이터 |
| TSK-05-02 | Kanban Board UI | test-result 필터링 데이터 |

---

## 8. 검증 체크리스트

### 8.1 기능 검증

- [ ] FR-001: PUT 엔드포인트 동작 확인 (TC-I-001)
- [ ] FR-002: Task 노드 탐색 동작 확인 (TC-U-003-001~002)
- [ ] FR-003: test-result 속성 업데이트 확인 (TC-I-001)
- [ ] FR-004: wbs.md 파일 저장 확인 (TC-I-001)
- [ ] FR-005: 백업 및 롤백 동작 확인 (TC-I-004, TC-I-005)

### 8.2 비기능 검증

- [ ] NFR-001: 응답 시간 500ms 이내 (TC-PERF-001~003)
- [ ] NFR-002: 백업 생성 후 업데이트 (TC-I-004)
- [ ] NFR-003: 동시 요청 순차 처리 (TC-CONC-001)
- [ ] NFR-004: 경로 순회 공격 방지 (TC-SEC-001)

### 8.3 비즈니스 규칙 검증

- [ ] BR-001: Task ID 형식 검증 (TC-U-001-001~005)
- [ ] BR-002: test-result 값 검증 (TC-U-002-001~006)
- [ ] BR-003: Task 존재 여부 확인 (TC-U-003-003~004)
- [ ] BR-004: 백업 및 롤백 로직 (TC-I-004, TC-I-005)
- [ ] BR-005: 메타데이터 자동 갱신 (TC-I-001)

### 8.4 에러 처리 검증

- [ ] 모든 에러 코드 (400, 404, 500)가 정확한 조건에서 발생 (TC-ERR-001~009)
- [ ] 에러 응답 형식이 표준 형식을 따름
- [ ] 복구 가능한 에러와 치명적 에러가 명확히 구분됨

### 8.5 보안 검증

- [ ] 경로 순회 공격 차단 (TC-SEC-001)
- [ ] 입력 검증 (testResult, taskId) (TC-SEC-002, TC-SEC-003)
- [ ] 파일 권한 확인 (수동 검증)

---

## 9. 문서 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-15 | Claude (Opus 4.5) | 초안 작성 |

---

## 10. 참고 자료

- **기본설계**: 010-basic-design.md
- **상세설계**: 020-detail-design.md
- **테스트 명세**: 026-test-specification.md (예정)
- **PRD**: .jjiban/docs/PRD.md
