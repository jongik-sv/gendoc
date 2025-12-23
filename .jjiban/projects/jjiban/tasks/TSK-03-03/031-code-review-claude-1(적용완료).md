# 코드 리뷰: Workflow API & Settings

## 리뷰 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-03 |
| Category | development |
| 리뷰 일시 | 2025-12-15 12:30 |
| 리뷰어 | Claude Opus 4.5 |
| 리뷰 회차 | 1차 |

---

## 1. 리뷰 요약

### 1.1 전체 평가
| 항목 | 평가 | 심각도 | 우선순위 | 비고 |
|------|------|--------|---------|------|
| 설계 일치성 | ✅ | - | - | 상세설계와 일치 |
| 코드 품질 | ✅ | - | - | SOLID 원칙 준수 |
| 보안 | ⚠️ | Medium | P3 | 경로 검증 개선 가능 |
| 성능 | ⚠️ | Low | P4 | 중복 Task 조회 개선 가능 |
| 테스트 | ⚠️ | Medium | P3 | E2E 테스트 보강 필요 |

### 1.2 이슈 통계
| 심각도 | 개수 |
|--------|------|
| ⚠️ Critical | 0 |
| ❗ High | 0 |
| 🔧 Medium | 3 |
| 📝 Low | 4 |
| ℹ️ Info | 2 |

### 1.3 종합 의견

TSK-03-03의 구현은 전반적으로 **우수**합니다. 상세설계 문서와 높은 일치도를 보이며, 코드 구조가 명확하고 SOLID 원칙을 잘 준수하고 있습니다.

**강점:**
- API 라우터와 Service 계층 분리가 명확함
- 표준 에러 처리 패턴 일관성 있게 적용
- 타입 정의가 상세설계와 정확히 일치
- WorkflowEngine의 동시성 제어 (히스토리 락 맵) 구현

**개선 권장:**
- 중복 `findTaskById()` 호출 최적화
- `extractStatusCode()` 함수 중복 정의 해소
- E2E 테스트에서 transition/documents API 커버리지 추가

---

## 2. 상세 리뷰

### 2.1 설계-구현 일치성
**검증 범위**: 020-detail-design.md, 025-traceability-matrix.md

| 설계 항목 | 구현 상태 | 일치 여부 | 비고 |
|-----------|----------|----------|------|
| FR-001: 상태 전이 검증 | transitionService.ts:116-141 | ✅ | validateTransition() 구현 |
| FR-002: 상태 전이 실행 | transitionService.ts:150-238 | ✅ | executeTransition() 구현 |
| FR-003: 이력 기록 | workflowEngine.ts:188-238 | ✅ | recordHistory() 구현 |
| FR-004: 문서 목록 조회 | documentService.ts:87-130 | ✅ | getExistingDocuments() 구현 |
| FR-005: 예정 문서 표시 | documentService.ts:139-186 | ✅ | getExpectedDocuments() 구현 |
| FR-006: 설정 조회 | settings/[type].get.ts | ✅ | 기존 구현 재사용 |
| POST /api/tasks/:id/transition | transition.post.ts | ✅ | 201 Created 응답 |
| GET /api/tasks/:id/documents | documents.get.ts | ✅ | 문서 목록 반환 |

**분석 결과**:
모든 기능 요구사항이 상세설계와 일치하게 구현되었습니다. API 명세(요청/응답 포맷)도 설계 문서와 동일합니다.

### 2.2 코드 품질
**검토 기준**: SOLID, Clean Code, 프로젝트 코딩 표준

| 원칙 | 준수 여부 | 위반 사례 |
|------|----------|----------|
| SRP (단일 책임) | ✅ | - |
| OCP (개방-폐쇄) | ✅ | 워크플로우 확장 용이 |
| DRY (중복 제거) | ⚠️ | extractStatusCode() 중복 |
| 네이밍 규칙 | ✅ | camelCase 일관성 |

**분석 결과**:

**우수한 점:**
- Service 계층 분리가 명확 (TransitionService, DocumentService, WorkflowEngine)
- API 라우터는 얇은 계층으로 유지하고 비즈니스 로직은 Service에 위임
- 표준 에러 클래스(createNotFoundError, createConflictError 등) 일관 사용
- TypeScript 타입 정의가 명확하고 상세설계와 일치

**개선 필요:**
- `extractStatusCode()` 함수가 transitionService.ts:35와 documentService.ts:29에 중복 정의됨
- statusUtils.ts에 동일 함수가 이미 존재하나 일부 파일에서 미사용

### 2.3 보안 검토
**검토 항목**: OWASP Top 10 기준

| 취약점 유형 | 검토 결과 | 발견 위치 |
|-------------|----------|----------|
| XSS | ✅ | - |
| SQL Injection | ✅ | N/A (파일 기반) |
| CSRF | ✅ | - |
| 인증/인가 | ⚠️ | 미구현 (로컬 앱) |
| 민감정보 노출 | ✅ | - |
| 경로 탐색 | ✅ | getTaskFolderPath() 검증 |

**분석 결과**:
- 파일 기반 아키텍처로 SQL Injection 위험 없음
- Task ID는 wbs.md에서 검색하여 존재 확인 후 사용
- 경로 탐색 공격은 paths.ts의 validateProjectId()에서 방어
- 로컬 환경 앱으로 인증/인가는 요구사항 외

### 2.4 성능 검토
**검토 항목**: 쿼리 최적화, 렌더링 성능, 리소스 사용

| 성능 항목 | 검토 결과 | 개선 필요 |
|-----------|----------|----------|
| N+1 쿼리 | ⚠️ | findTaskById 중복 호출 |
| 불필요한 렌더링 | ✅ | N/A (Backend) |
| 메모리 누수 | ✅ | historyLocks 정리됨 |
| API 응답 시간 | ✅ | 목표 < 500ms 달성 예상 |

**분석 결과**:

1. **중복 findTaskById 호출** (transitionService.ts)
   - `executeTransition()` 내에서 `validateTransition()` 호출 (1회)
   - 이후 다시 `findTaskById()` 직접 호출 (2회)
   - 총 2회 중복 호출 발생

2. **워크플로우 조회 최적화**
   - `getWorkflows()` 캐싱 적용됨 (SettingsService)

3. **히스토리 동시성 제어**
   - `historyLocks` Map으로 뮤텍스 패턴 구현
   - 작업 완료 후 락 정리됨 (`finally` 블록)

### 2.5 테스트 검토
**검토 항목**: 테스트 커버리지, 테스트 품질

| 테스트 항목 | 상태 | 커버리지 |
|-------------|------|---------|
| 단위 테스트 | ✅ | workflowEngine.test.ts 존재 |
| 통합 테스트 | ⚠️ | transition/documents API 미포함 |
| E2E 테스트 | ⚠️ | tasks.spec.ts에 기본 테스트만 |

**분석 결과**:
- WorkflowEngine 단위 테스트 (30개 케이스) 존재
- tasks.spec.ts E2E 테스트에 Task 조회/수정만 포함
- POST /api/tasks/:id/transition E2E 테스트 미구현
- GET /api/tasks/:id/documents E2E 테스트 미구현

---

## 3. 개선 사항 목록

### 3.1 🔴 P1 - 즉시 해결 (Must Fix)
| # | 심각도 | 파일 | 라인 | 설명 | 해결 방안 |
|---|--------|------|------|------|----------|
| - | - | - | - | 없음 | - |

### 3.2 🟠 P2 - 빠른 해결 (Should Fix)
| # | 심각도 | 파일 | 라인 | 설명 | 해결 방안 |
|---|--------|------|------|------|----------|
| - | - | - | - | 없음 | - |

### 3.3 🟡 P3 - 보통 해결 (Could Fix)
| # | 심각도 | 파일 | 라인 | 설명 | 해결 방안 |
|---|--------|------|------|------|----------|
| 1 | 🔧 | transitionService.ts | 35 | extractStatusCode() 중복 정의 | statusUtils.ts에서 import |
| 2 | 🔧 | documentService.ts | 29 | extractStatusCode() 중복 정의 | statusUtils.ts에서 import |
| 3 | 🔧 | tests/e2e/ | - | transition API E2E 테스트 없음 | 테스트 추가 |

### 3.4 🟢 P4 - 개선 항목 (Nice to Have)
| # | 심각도 | 파일 | 라인 | 설명 | 해결 방안 |
|---|--------|------|------|------|----------|
| 1 | 📝 | transitionService.ts | 166-170 | findTaskById() 중복 호출 | validation 결과 재사용 |
| 2 | 📝 | documentService.ts | 40-78 | determineDocumentType() 매직 스트링 | 상수로 추출 |
| 3 | 📝 | workflowEngine.ts | 189 | updateTaskStatus() 내부 함수 | 별도 유틸로 분리 고려 |
| 4 | 📝 | transition.post.ts | 40 | 201 응답 하드코딩 | setResponseStatus() 사용 |

### 3.5 🔵 P5 - 보류 항목 (Backlog)
| # | 심각도 | 파일 | 라인 | 설명 | 비고 |
|---|--------|------|------|------|------|
| 1 | ℹ️ | documentService.ts | 78 | 기본 타입 'design' fallback | 새 문서 타입 추가 시 검토 |
| 2 | ℹ️ | workflowEngine.ts | 221 | 히스토리 최대 100개 제한 | 요구사항 변경 시 조정 |

---

## 4. 코드 개선 예시

### 4.1 extractStatusCode() 중복 해소
**현재 코드** (transitionService.ts:35):
```typescript
function extractStatusCode(status?: string): string {
  if (!status) return '[ ]';
  const match = status.match(/\[([^\]]+)\]/);
  return match ? match[1] : status;
}
```

**개선 코드**:
```typescript
// transitionService.ts
import { extractStatusCode } from './statusUtils';

// 기존 내부 함수 제거, import로 대체
```

**개선 이유**: DRY 원칙 준수, 코드 중복 제거, 유지보수성 향상

### 4.2 findTaskById() 중복 호출 최적화
**현재 코드** (transitionService.ts:150-177):
```typescript
export async function executeTransition(...) {
  // 1차 호출 (validateTransition 내부)
  const validation = await validateTransition(taskId, command);

  // 2차 호출 (중복)
  const taskResult = await findTaskById(taskId);
}
```

**개선 코드**:
```typescript
export async function executeTransition(...) {
  // Task 먼저 조회
  const taskResult = await findTaskById(taskId);
  if (!taskResult) {
    throw createNotFoundError(`Task를 찾을 수 없습니다: ${taskId}`);
  }

  // 조회된 Task로 검증 (별도 함수)
  const validation = validateTransitionWithTask(taskResult.task, command);

  // 이후 로직...
}
```

**개선 이유**: 불필요한 I/O 감소, 응답 시간 개선

---

## 5. 다음 단계

- 개선 사항 반영: `/wf:patch TSK-03-03` → 코드 수정
- 추가 리뷰: `/wf:audit TSK-03-03` → 재리뷰

**권장 조치:**
1. P3 이슈 3건 해결 (extractStatusCode 중복, E2E 테스트)
2. P4 이슈는 다음 리팩토링 시 반영 검토

---

## 6. 검증된 파일 목록

### 6.1 API 라우터
| 파일 | 상태 | 비고 |
|------|------|------|
| server/api/tasks/[id]/transition.post.ts | ✅ 구현 완료 | 상세설계 일치 |
| server/api/tasks/[id]/documents.get.ts | ✅ 구현 완료 | 상세설계 일치 |
| server/api/tasks/[id]/available-commands.get.ts | ✅ 구현 완료 | TSK-03-04 연계 |
| server/api/tasks/[id]/history.get.ts | ✅ 구현 완료 | TSK-03-04 연계 |
| server/api/settings/[type].get.ts | ✅ 기존 구현 | TSK-02-03-02 |

### 6.2 Service 계층
| 파일 | 상태 | 비고 |
|------|------|------|
| server/utils/workflow/transitionService.ts | ✅ 구현 완료 | 275 lines |
| server/utils/workflow/documentService.ts | ✅ 구현 완료 | 231 lines |
| server/utils/workflow/workflowEngine.ts | ✅ 구현 완료 | TSK-03-04 연계 |
| server/utils/workflow/statusUtils.ts | ✅ 구현 완료 | 공통 유틸 |
| server/utils/workflow/stateMapper.ts | ✅ 구현 완료 | 상태 매핑 |
| server/utils/workflow/index.ts | ✅ 구현 완료 | 진입점 |

### 6.3 테스트
| 파일 | 상태 | 비고 |
|------|------|------|
| tests/utils/workflow/workflowEngine.test.ts | ✅ 구현 완료 | 30+ 케이스 |
| tests/e2e/tasks.spec.ts | ⚠️ 부분 구현 | transition/documents 테스트 필요 |

---

**문서 버전**: 1.0.0
**리뷰 완료**: 2025-12-15 12:30
