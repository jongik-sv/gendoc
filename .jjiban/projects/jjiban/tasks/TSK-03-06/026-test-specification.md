# 테스트 명세서 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-06 |
| Task명 | completed 필드 지원 (Parser/Serializer/API) |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | parseCompleted, serializeAttributes, executeTransition | 90% 이상 |
| E2E 테스트 | 전체 워크플로우 (파싱 → 전이 → 롤백 → 직렬화) | 100% 시나리오 커버 |
| 매뉴얼 테스트 | wbs.md 파일 확인, 타임스탬프 정확도 | 전체 케이스 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest |
| 테스트 프레임워크 (E2E) | Playwright |
| 테스트 데이터 경로 | `.jjiban/test-completed-field/` |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | parseCompleted | 정상 파싱 (여러 단계) | CompletedTimestamps 객체 반환 | FR-001 |
| UT-002 | parseCompleted | 빈 completed 필드 | 빈 객체 반환 | FR-001 |
| UT-003 | serializeAttributes | 정상 직렬화 | 마크다운 라인 배열 반환 | FR-002 |
| UT-004 | serializeAttributes | 빈 completed 객체 | completed 라인 출력 안 함 | FR-002 |
| UT-005 | executeTransition | 타임스탬프 기록 | completed[newStatus] 추가 | FR-003, BR-001 |
| UT-006 | executeTransition | 기존 completed 항목 보존 | 이전 항목 유지 | FR-003, BR-002, BR-004 |
| UT-007 | executeTransition | 롤백 감지 | isRollback = true | FR-004, BR-003 |
| UT-008 | executeTransition | 이후 단계 completed 삭제 | 롤백 시 이후 키 삭제 | FR-004, BR-003 |
| UT-009 | executeTransition | 롤백 경계 조건 (삭제할 키 없음) | 에러 없이 진행 | FR-004, BR-003 |

### 2.2 테스트 케이스 상세

#### UT-001: parseCompleted 정상 파싱

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/wbs/parser/__tests__/_attributes.spec.ts` |
| **테스트 블록** | `describe('parseCompleted') → it('should parse completed field with multiple timestamps')` |
| **Mock 의존성** | - |
| **입력 데이터** | `["- completed:", "  - bd: 2025-12-15 10:30", "  - dd: 2025-12-15 14:20", "  - im: 2025-12-15 16:00"]` |
| **검증 포인트** | `expect(result).toEqual({ bd: "2025-12-15 10:30", dd: "2025-12-15 14:20", im: "2025-12-15 16:00" })` |
| **커버리지 대상** | parseCompleted() 정상 분기 |
| **관련 요구사항** | FR-001 |

#### UT-002: parseCompleted 빈 completed 필드

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/wbs/parser/__tests__/_attributes.spec.ts` |
| **테스트 블록** | `describe('parseCompleted') → it('should return empty object for empty completed field')` |
| **Mock 의존성** | - |
| **입력 데이터** | `["- completed:", "- ref: prd.md"]` (completed 아래 항목 없음) |
| **검증 포인트** | `expect(result).toEqual({})` |
| **커버리지 대상** | parseCompleted() 빈 필드 처리 |
| **관련 요구사항** | FR-001 |

#### UT-003: serializeAttributes 정상 직렬화

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/wbs/serializer/__tests__/_attributes.spec.ts` |
| **테스트 블록** | `describe('serializeAttributes') → it('should serialize completed field correctly')` |
| **Mock 의존성** | - |
| **입력 데이터** | `{ type: 'task', id: 'TSK-01', title: 'Test', completed: { bd: "2025-12-15 10:30", dd: "2025-12-15 14:20" } }` |
| **검증 포인트** | `expect(result).toContain("- completed:")` 및 `expect(result).toContain("  - bd: 2025-12-15 10:30")` |
| **커버리지 대상** | serializeAttributes() completed 직렬화 |
| **관련 요구사항** | FR-002 |

#### UT-004: serializeAttributes 빈 completed 객체

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/wbs/serializer/__tests__/_attributes.spec.ts` |
| **테스트 블록** | `describe('serializeAttributes') → it('should not output completed field for empty object')` |
| **Mock 의존성** | - |
| **입력 데이터** | `{ type: 'task', id: 'TSK-01', title: 'Test', completed: {} }` |
| **검증 포인트** | `expect(result.join('\\n')).not.toContain("- completed:")` |
| **커버리지 대상** | serializeAttributes() 빈 객체 처리 |
| **관련 요구사항** | FR-002 |

#### UT-005: executeTransition 타임스탬프 기록

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/workflow/__tests__/transitionService.spec.ts` |
| **테스트 블록** | `describe('executeTransition') → it('should record completed timestamp on transition')` |
| **Mock 의존성** | getWbsTree, saveWbsTree |
| **입력 데이터** | `taskId: "TSK-03-06", command: "start"` |
| **검증 포인트** | 1. completed.bd 존재 확인<br>2. 타임스탬프 형식 검증 (정규식: `\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}`) |
| **커버리지 대상** | executeTransition() 타임스탬프 기록 로직 |
| **관련 요구사항** | FR-003, BR-001 |

#### UT-006: executeTransition 기존 completed 항목 보존

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/workflow/__tests__/transitionService.spec.ts` |
| **테스트 블록** | `describe('executeTransition') → it('should preserve existing completed items on new transition')` |
| **Mock 의존성** | getWbsTree, saveWbsTree |
| **입력 데이터** | `taskId: "TSK-03-06", command: "draft"`, 기존 completed: `{ bd: "2025-12-15 10:00" }` |
| **검증 포인트** | 1. completed.bd 유지 확인<br>2. completed.dd 추가 확인 |
| **커버리지 대상** | executeTransition() 기존 항목 보존 로직 |
| **관련 요구사항** | FR-003, BR-002, BR-004 |

#### UT-007: executeTransition 롤백 감지

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/workflow/__tests__/transitionService.spec.ts` |
| **테스트 블록** | `describe('executeTransition') → it('should detect rollback when new state index < current state index')` |
| **Mock 의존성** | getWbsTree, saveWbsTree, getWorkflows |
| **입력 데이터** | `taskId: "TSK-03-06", command: "draft"` (from [im] to [dd]) |
| **검증 포인트** | 1. 롤백 감지 로직 호출 확인 (스파이)<br>2. 이후 단계 삭제 로직 호출 확인 |
| **커버리지 대상** | executeTransition() 롤백 감지 로직 |
| **관련 요구사항** | FR-004, BR-003 |

#### UT-008: executeTransition 이후 단계 completed 삭제

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/workflow/__tests__/transitionService.spec.ts` |
| **테스트 블록** | `describe('executeTransition') → it('should delete completed keys for subsequent states on rollback')` |
| **Mock 의존성** | getWbsTree, saveWbsTree, getWorkflows |
| **입력 데이터** | `taskId: "TSK-03-06", command: "draft"` (from [im] to [dd]), 기존 completed: `{ bd: "...", dd: "...", im: "...", vf: "..." }` |
| **검증 포인트** | 1. completed.bd, completed.dd 유지<br>2. completed.im, completed.vf 삭제 확인<br>3. completed.dd 갱신 확인 |
| **커버리지 대상** | executeTransition() 이후 단계 삭제 로직 |
| **관련 요구사항** | FR-004, BR-003 |

#### UT-009: executeTransition 롤백 경계 조건

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/workflow/__tests__/transitionService.spec.ts` |
| **테스트 블록** | `describe('executeTransition') → it('should handle rollback when no completed keys to delete')` |
| **Mock 의존성** | getWbsTree, saveWbsTree, getWorkflows |
| **입력 데이터** | `taskId: "TSK-03-06", command: "draft"` (from [im] to [dd]), 기존 completed: `{ bd: "...", dd: "..." }` (im, vf 없음) |
| **검증 포인트** | 1. 에러 없이 실행 완료<br>2. completed.bd, completed.dd 유지<br>3. completed.dd 갱신 확인 |
| **커버리지 대상** | executeTransition() 롤백 경계 조건 |
| **관련 요구사항** | FR-004, BR-003 |

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 파싱 및 직렬화 왕복 변환 | wbs.md 존재 | 1. 파싱 2. 직렬화 | 원본과 동일 | FR-001, FR-002 |
| E2E-002 | 상태 전이 후 completed 확인 | Task 존재 | 1. 전이 API 호출 | completed 필드 추가됨 | FR-003, BR-001 |
| E2E-003 | 연속 전이 후 completed 누적 | Task 존재 | 1. 여러 전이 실행 | completed 항목 누적 | FR-003, BR-002, BR-004 |
| E2E-004 | development 롤백 시나리오 | Task [im] 상태 | 1. [im] → [dd] 롤백 | im, vf, xx 삭제됨 | FR-004, BR-003 |
| E2E-005 | defect 롤백 시나리오 | Task [fx] 상태 | 1. [fx] → [an] 롤백 | fx, vf, xx 삭제됨 | FR-004, BR-003 |

### 3.2 테스트 케이스 상세

#### E2E-001: 파싱 및 직렬화 왕복 변환

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/completed-field.spec.ts` |
| **테스트명** | `test('completed 필드가 파싱 및 직렬화 왕복 변환에서 정확히 유지된다')` |
| **사전조건** | 테스트 프로젝트 생성, wbs.md에 completed 필드 포함 |
| **실행 단계** | |
| 1 | `GET /api/projects/test-completed/wbs` (파싱) |
| 2 | 응답에서 completed 필드 확인 |
| 3 | `PUT /api/projects/test-completed/wbs` (직렬화) |
| 4 | wbs.md 파일 읽기 및 내용 확인 |
| **API 확인** | `GET /api/projects/test-completed/wbs` → 200<br>`PUT /api/projects/test-completed/wbs` → 200 |
| **검증 포인트** | 1. 파싱된 completed 객체 확인<br>2. 직렬화된 wbs.md에 completed 라인 존재<br>3. 원본과 동일한 형식 유지 |
| **관련 요구사항** | FR-001, FR-002 |

#### E2E-002: 상태 전이 후 completed 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/completed-field.spec.ts` |
| **테스트명** | `test('상태 전이 시 completed 필드에 타임스탬프가 자동으로 기록된다')` |
| **사전조건** | 테스트 Task 생성 (status: [ ]) |
| **실행 단계** | |
| 1 | `POST /api/tasks/TSK-TEST-01/transition` (command: "start") |
| 2 | `GET /api/projects/test-completed/wbs` (파싱) |
| 3 | completed.bd 필드 확인 |
| **API 확인** | `POST /api/tasks/TSK-TEST-01/transition` → 200<br>`GET /api/projects/test-completed/wbs` → 200 |
| **검증 포인트** | 1. completed.bd 존재<br>2. 타임스탬프 형식 검증 (YYYY-MM-DD HH:mm)<br>3. 현재 시각과 유사 (±1분 이내) |
| **관련 요구사항** | FR-003, BR-001 |

#### E2E-003: 연속 전이 후 completed 누적

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/completed-field.spec.ts` |
| **테스트명** | `test('여러 상태 전이 후 completed 필드에 모든 단계가 누적된다')` |
| **사전조건** | 테스트 Task 생성 (status: [ ]) |
| **실행 단계** | |
| 1 | `POST /api/tasks/TSK-TEST-02/transition` (command: "start") → [bd] |
| 2 | `POST /api/tasks/TSK-TEST-02/transition` (command: "draft") → [dd] |
| 3 | `POST /api/tasks/TSK-TEST-02/transition` (command: "build") → [im] |
| 4 | `GET /api/projects/test-completed/wbs` (파싱) |
| 5 | completed 필드 확인 |
| **API 확인** | 각 transition API → 200<br>`GET /api/projects/test-completed/wbs` → 200 |
| **검증 포인트** | 1. completed.bd 존재<br>2. completed.dd 존재<br>3. completed.im 존재<br>4. 각 타임스탬프가 순차적으로 증가 |
| **관련 요구사항** | FR-003, BR-002, BR-004 |

#### E2E-004: development 롤백 시나리오

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/completed-field.spec.ts` |
| **테스트명** | `test('development 워크플로우에서 롤백 시 이후 단계 completed가 삭제된다')` |
| **사전조건** | 테스트 Task 생성 (status: [im], completed: { bd: "...", dd: "...", im: "..." }) |
| **실행 단계** | |
| 1 | `POST /api/tasks/TSK-TEST-03/transition` (command: "draft", [im] → [dd] 롤백) |
| 2 | `GET /api/projects/test-completed/wbs` (파싱) |
| 3 | completed 필드 확인 |
| **API 확인** | `POST /api/tasks/TSK-TEST-03/transition` → 200<br>`GET /api/projects/test-completed/wbs` → 200 |
| **검증 포인트** | 1. completed.bd 유지<br>2. completed.dd 갱신됨<br>3. completed.im 삭제됨 (존재하지 않음) |
| **스크린샷** | `e2e-004-rollback-development.png` |
| **관련 요구사항** | FR-004, BR-003 |

#### E2E-005: defect 롤백 시나리오

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/completed-field.spec.ts` |
| **테스트명** | `test('defect 워크플로우에서 롤백 시 이후 단계 completed가 삭제된다')` |
| **사전조건** | 테스트 Task 생성 (category: defect, status: [fx], completed: { an: "...", fx: "..." }) |
| **실행 단계** | |
| 1 | `POST /api/tasks/TSK-TEST-04/transition` (command: "start", [fx] → [an] 롤백) |
| 2 | `GET /api/projects/test-completed/wbs` (파싱) |
| 3 | completed 필드 확인 |
| **API 확인** | `POST /api/tasks/TSK-TEST-04/transition` → 200<br>`GET /api/projects/test-completed/wbs` → 200 |
| **검증 포인트** | 1. completed.an 갱신됨<br>2. completed.fx 삭제됨 (존재하지 않음) |
| **스크린샷** | `e2e-005-rollback-defect.png` |
| **관련 요구사항** | FR-004, BR-003 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | wbs.md 파일 확인 | 프로젝트 존재 | 1. wbs.md 열기 | completed 필드 형식 확인 | High | FR-001, FR-002 |
| TC-002 | 타임스탬프 정확도 | Task 전이 실행 | 1. 전이 실행 2. wbs.md 확인 | 현재 시각과 일치 | High | FR-003, BR-001 |
| TC-003 | 롤백 후 파일 확인 | Task [im] 상태 | 1. 롤백 실행 2. wbs.md 확인 | 이후 단계 completed 없음 | High | FR-004, BR-003 |

### 4.2 매뉴얼 테스트 상세

#### TC-001: wbs.md 파일 확인

**테스트 목적**: wbs.md 파일에 completed 필드가 올바른 형식으로 저장되는지 확인

**테스트 단계**:
1. 테스트 프로젝트 폴더 열기 (`.jjiban/projects/test-completed/`)
2. wbs.md 파일을 텍스트 에디터로 열기
3. Task 섹션에서 completed 필드 찾기
4. 형식 확인:
   ```markdown
   - completed:
     - bd: 2025-12-15 10:30
     - dd: 2025-12-15 14:20
   ```

**예상 결과**:
- completed 라인이 다른 속성 뒤에 위치 (ref 다음)
- 들여쓰기가 2칸 공백으로 일관됨
- 타임스탬프 형식이 "YYYY-MM-DD HH:mm"
- 키-값 사이에 콜론(:)과 공백 1개

**검증 기준**:
- [ ] completed 필드 존재
- [ ] 들여쓰기 올바름
- [ ] 타임스탬프 형식 일치
- [ ] 여러 단계 항목이 순서대로 나열

#### TC-002: 타임스탬프 정확도

**테스트 목적**: 상태 전이 시 기록되는 타임스탬프가 정확한지 확인

**테스트 단계**:
1. Task 상세 패널 열기
2. 현재 시각 확인 (예: 2025-12-15 15:30)
3. 상태 전이 버튼 클릭 (예: "기본설계 시작")
4. 즉시 wbs.md 파일 열기
5. completed.bd 필드 확인

**예상 결과**:
- completed.bd 값이 클릭 시각과 ±1분 이내
- 형식이 "YYYY-MM-DD HH:mm" (초 단위 없음)
- 로컬 시간 기준 (서버 시간 아님)

**검증 기준**:
- [ ] 타임스탬프가 현재 시각과 유사
- [ ] 형식이 정확함
- [ ] 로컬 시간 기준 확인

#### TC-003: 롤백 후 파일 확인

**테스트 목적**: 롤백 시 이후 단계의 completed 항목이 삭제되는지 확인

**테스트 단계**:
1. Task가 [im] 상태이고 completed에 bd, dd, im 항목 존재 확인
2. wbs.md 파일 내용 스크린샷 저장
3. [dd] 상태로 롤백 (전이 명령어 실행)
4. wbs.md 파일 다시 열기
5. completed 필드 확인

**예상 결과**:
- completed.bd 유지됨
- completed.dd 갱신됨 (새 타임스탬프)
- completed.im 삭제됨 (라인 자체가 없음)
- completed.vf, completed.xx 삭제됨 (있었다면)

**검증 기준**:
- [ ] 롤백 이전 단계 항목 유지
- [ ] 롤백 대상 단계 항목 갱신
- [ ] 롤백 이후 단계 항목 삭제 (라인 없음)

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-COMPLETED-01 | 정상 completed 객체 | `{ bd: "2025-12-15 10:30", dd: "2025-12-15 14:20" }` |
| MOCK-COMPLETED-02 | 여러 단계 completed | `{ bd: "2025-12-15 10:00", dd: "2025-12-15 12:00", im: "2025-12-15 14:00" }` |
| MOCK-COMPLETED-EMPTY | 빈 completed 객체 | `{}` |
| MOCK-LINES-01 | completed 파싱용 라인 | `["- completed:", "  - bd: 2025-12-15 10:30", "  - dd: 2025-12-15 14:20"]` |
| MOCK-WORKFLOW-DEV | development 워크플로우 | `{ states: ["[ ]", "[bd]", "[dd]", "[im]", "[vf]", "[xx]"] }` |
| MOCK-WORKFLOW-DEFECT | defect 워크플로우 | `{ states: ["[ ]", "[an]", "[fx]", "[vf]", "[xx]"] }` |

### 5.2 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-COMPLETED-BASE | 기본 E2E 환경 | 자동 시드 | 프로젝트 1개, Task 3개 ([ ], [bd], [im]) |
| SEED-COMPLETED-ROLLBACK | 롤백 테스트용 | 자동 시드 | Task 1개 ([im], completed: { bd, dd, im }) |
| SEED-COMPLETED-DEFECT | defect 롤백 테스트용 | 자동 시드 | Task 1개 (category: defect, [fx], completed: { an, fx }) |

### 5.3 wbs.md 테스트 파일 샘플

#### 샘플 1: completed 필드 포함 Task

```markdown
### TSK-03-06: completed 필드 지원 (Parser/Serializer/API)
- category: development
- status: detail-design [dd]
- priority: high
- assignee: AI Agent
- schedule: 2025-12-15 ~ 2025-12-16
- ref: prd.md § 7.5
- completed:
  - bd: 2025-12-15 10:30
  - dd: 2025-12-15 14:20
```

#### 샘플 2: 롤백 후 completed 필드

```markdown
### TSK-03-06: completed 필드 지원 (Parser/Serializer/API)
- category: development
- status: detail-design [dd]
- priority: high
- assignee: AI Agent
- schedule: 2025-12-15 ~ 2025-12-16
- ref: prd.md § 7.5
- completed:
  - bd: 2025-12-15 10:30
  - dd: 2025-12-15 16:45
```

---

## 6. 테스트 커버리지 목표

### 6.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 90% | 80% |
| Branches | 85% | 75% |
| Functions | 95% | 85% |
| Statements | 90% | 80% |

### 6.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 |
| 비즈니스 규칙 (BR) | 100% 커버 |
| 롤백 시나리오 | 100% 커버 (development, defect) |

### 6.3 기능별 테스트 커버리지

| 기능 | 단위 테스트 | E2E 테스트 | 매뉴얼 테스트 | 총 커버리지 |
|------|------------|-----------|-------------|------------|
| parseCompleted | 2개 | 1개 | 1개 | 100% |
| serializeAttributes | 2개 | 1개 | 1개 | 100% |
| executeTransition (타임스탬프) | 2개 | 2개 | 1개 | 100% |
| executeTransition (롤백) | 3개 | 2개 | 1개 | 100% |

---

## 7. 테스트 실행 계획

### 7.1 실행 순서

1. **단위 테스트 (Vitest)**: 각 함수별 독립 테스트
2. **E2E 테스트 (Playwright)**: 전체 워크플로우 통합 테스트
3. **매뉴얼 테스트**: 파일 형식 및 타임스탬프 정확도 확인

### 7.2 실행 명령어

```bash
# 단위 테스트
npm run test:unit -- server/utils/wbs/parser/_attributes.spec.ts
npm run test:unit -- server/utils/wbs/serializer/_attributes.spec.ts
npm run test:unit -- server/utils/workflow/transitionService.spec.ts

# E2E 테스트
npm run test:e2e -- tests/e2e/completed-field.spec.ts

# 커버리지 확인
npm run test:coverage
```

### 7.3 성공 기준

| 구분 | 기준 |
|------|------|
| 단위 테스트 | 전체 통과, 커버리지 90% 이상 |
| E2E 테스트 | 전체 통과, 5개 시나리오 모두 성공 |
| 매뉴얼 테스트 | 3개 케이스 모두 검증 완료 |
| 회귀 테스트 | 기존 테스트 전체 통과 (no regression) |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`

---

<!--
author: AI Agent
Template Version: 1.0.0
-->
