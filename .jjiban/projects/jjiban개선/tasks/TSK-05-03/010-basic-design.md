# 기본설계: 상태 코드 통일

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-03 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 상위 Work Package | WP-05: 워크플로우 유연화 |
| 의존성 | TSK-05-01 (CLI 설정 로더), TSK-05-02 (workflowSteps 리팩토링) |
| 작성일 | 2025-12-17 |

---

## 1. 개요

### 1.1 목적

Server와 CLI 간 상태 코드 불일치를 해결하여 시스템 전체에 일관된 상태 코드를 사용합니다.

### 1.2 현재 문제

**상태 코드 불일치:**

| 상태 | Server | CLI | wf-common-lite.md |
|------|--------|-----|-------------------|
| Verify (검증) | `[vf]` | `[ts]` | `[ts]` |
| Infra Design (설계) | `[dd]` | `[ds]` | `[ds]` |

**영향 범위:**

1. **WbsReader.js** - 상태 코드를 파싱하지만 정규화 없이 그대로 반환
2. **슬래시 명령어 15개** - `/wf:verify` 등에서 `[ts]` 상태 코드 사용
3. **wf-common-lite.md** - 문서에 레거시 상태 코드 명시
4. **기존 WBS 파일** - `[ts]`, `[ds]` 상태 코드로 작성된 Task 존재

### 1.3 구현 범위

> WBS Task 설명에서 추출

- `cli/core/WbsReader.js` 상태 코드 정규화 레이어 추가
- 슬래시 명령어 상태 코드 수정 (`[ts]` → `[vf]`)
- `.claude/includes/wf-common-lite.md` 상태 코드 표 수정

### 1.4 제외 범위

- CLI 설정 로더 생성 → TSK-05-01 (완료)
- workflowSteps 리팩토링 → TSK-05-02 (진행 중)
- 통합 테스트 → TSK-05-04

---

## 2. 문제 분석

### 2.1 현재 상태

**WbsReader.js (Line 209-211):**
```javascript
// 상태 코드 추출 (예: "basic-design [bd]" → "[bd]")
const statusMatch = (task.status || '[ ]').match(/\[([^\]]*)\]/);
const statusCode = statusMatch ? `[${statusMatch[1]}]` : '[ ]';
```

- 상태 코드를 추출만 하고 정규화하지 않음
- `[ts]` → `[ts]` 그대로 반환
- `[ds]` → `[ds]` 그대로 반환

**wf-common-lite.md (Line 84):**
```markdown
| `[ts]` | 테스트 | dev/defect | Verify |
```

- 문서에 `[ts]` 상태 코드 명시
- CLI 슬래시 명령어의 동작 가이드로 사용됨

**슬래시 명령어 (`/wf:verify`):**
```markdown
> **상태 전환**: `[im] 구현` → `[ts] 테스트` (development)
> **상태 전환**: `[fx] 수정` → `[ts] 테스트` (defect)
```

- 15개 슬래시 명령어 중 일부가 `[ts]`, `[ds]` 사용
- Server API와 통신 시 불일치 발생 가능

### 2.2 불일치로 인한 문제

1. **개발자 혼란**: Server 코드에서 `[vf]`, CLI 문서에서 `[ts]`
2. **API 불일치**: Server API가 `[vf]`를 기대하나 CLI가 `[ts]` 전송 가능
3. **문서 불일치**: PRD와 wf-common-lite.md 간 상태 코드 다름
4. **유지보수 어려움**: 변경 시 두 곳을 모두 수정해야 함

### 2.3 근본 원인

**역사적 배경:**
- 초기 구현 시 Server와 CLI 독립 개발
- Server: PrimeVue UI 중심 → 칸반 컬럼명 기반 (`[vf]` = Verify)
- CLI: 워크플로우 명령어 중심 → 직관적 약어 (`[ts]` = Test)

**설정 분리:**
- Server: `server/utils/settings/defaults.ts` 설정 기반
- CLI: `cli/config/workflowSteps.js` 하드코딩
- 설정 파일 없이 각자 정의

---

## 3. 해결 전략

### 3.1 기본 방침

**원칙:**
1. **Server 상태 코드를 표준으로 채택** - Server가 DB, API, UI의 중심
2. **하위 호환성 유지** - 기존 WBS 파일 (`[ts]`, `[ds]`) 그대로 동작
3. **점진적 마이그레이션** - 신규 Task는 표준 상태 코드 사용
4. **중앙 집중 관리** - 상태 코드 정규화는 WbsReader에서만 수행

### 3.2 표준 상태 코드

| 상태 | 표준 코드 | 레거시 코드 | 의미 |
|------|----------|------------|------|
| Todo | `[ ]` | - | 대기 |
| Basic Design | `[bd]` | - | 기본설계 |
| Detail Design | `[dd]` | `[ds]` | 상세설계 (infra용 ds는 dd로 통일) |
| Analyze | `[an]` | - | 분석 (defect) |
| Implement | `[im]` | - | 구현 |
| Fix | `[fx]` | - | 수정 (defect) |
| Verify | `[vf]` | `[ts]` | 검증 (ts는 vf로 통일) |
| Done | `[xx]` | - | 완료 |

**변경 사항:**
- `[ts]` → `[vf]` (Test → Verify)
- `[ds]` → `[dd]` (Design → Detail Design)

### 3.3 구현 계층

```
┌──────────────────────────────────────────┐
│ WBS 파일 (wbs.md)                         │
│ - 기존: [ts], [ds]                        │
│ - 신규: [vf], [dd]                        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ WbsReader.js (정규화 레이어)              │
│ normalizeStatusCode()                     │
│ [ts] → [vf]                               │
│ [ds] → [dd]                               │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ CLI 내부 (표준 상태 코드 사용)             │
│ WorkflowPlanner, Commands                │
└──────────────────────────────────────────┘
```

### 3.4 마이그레이션 전략

**단계별 접근:**

1. **Phase 1: 입력 정규화 (TSK-05-03)** ← 현재 Task
   - WbsReader에 정규화 레이어 추가
   - 슬래시 명령어 문서 수정
   - wf-common-lite.md 수정
   - 기존 WBS 파일 호환성 보장

2. **Phase 2: 신규 Task 표준 적용** (향후)
   - 신규 생성 Task는 `[vf]`, `[dd]` 사용
   - 슬래시 명령어 실행 시 표준 상태 코드로 업데이트

3. **Phase 3: 레거시 마이그레이션** (선택적)
   - 기존 WBS 파일 일괄 변환 스크립트 제공
   - 프로젝트별 선택 실행

---

## 4. 영향 범위 분석

### 4.1 파일 수정 목록

**코드 파일 (1개):**

| 파일 | 수정 내용 | 우선순위 |
|------|----------|----------|
| `cli/core/WbsReader.js` | `normalizeStatusCode()` 메서드 추가 | Critical |

**슬래시 명령어 파일 (15개):**

| 파일 | 수정 내용 | 행 번호 |
|------|----------|---------|
| `.claude/commands/wf/apply.md` | `[ts]` → `[vf]` | 상태 전환 섹션 |
| `.claude/commands/wf/audit.md` | `[ts]` → `[vf]` | 상태 전환 섹션 |
| `.claude/commands/wf/auto.md` | `[ts]` → `[vf]` | 워크플로우 체인 |
| `.claude/commands/wf/build.md` | - | 수정 없음 |
| `.claude/commands/wf/done.md` | `[ts]` → `[vf]` | 입력 상태 체크 |
| `.claude/commands/wf/draft.md` | - | 수정 없음 |
| `.claude/commands/wf/fix.md` | - | 수정 없음 |
| `.claude/commands/wf/patch.md` | `[ts]` → `[vf]` | 리뷰 후 상태 |
| `.claude/commands/wf/review.md` | - | 수정 없음 |
| `.claude/commands/wf/run.md` | `[ts]` → `[vf]` | 워크플로우 체인 |
| `.claude/commands/wf/skip.md` | `[ds]` → `[dd]` | infra 설계 건너뛰기 |
| `.claude/commands/wf/start.md` | - | 수정 없음 |
| `.claude/commands/wf/test.md` | `[ts]` → `[vf]` | 상태 전환 |
| `.claude/commands/wf/ui.md` | - | 수정 없음 |
| `.claude/commands/wf/verify.md` | `[ts]` → `[vf]` | 상태 전환, 입력/출력 |

**문서 파일 (2개):**

| 파일 | 수정 내용 |
|------|----------|
| `.claude/includes/wf-common-lite.md` | 상태 코드 표 (Line 84) `[ts]` → `[vf]` |
| `.claude/includes/wf-common.md` | 상태 코드 표 `[ts]` → `[vf]` |

### 4.2 기존 WBS 파일 영향

**jjiban 프로젝트:**
- `wbs.md`에 `[vf]` 상태 Task 16개 존재
- 이미 표준 상태 코드 사용 중 → 영향 없음

**jjiban개선 프로젝트:**
- `wbs.md`에 레거시 상태 코드 사용 가능
- 정규화 레이어로 호환성 보장 → 영향 없음

### 4.3 Server 영향

**Server 파일:**
- `server/utils/settings/defaults.ts` 이미 `[vf]` 사용
- API 엔드포인트 변경 불필요
- 영향 없음

---

## 5. 구현 우선순위

### 5.1 Critical (P0)

1. **WbsReader.js 정규화 레이어**
   - `normalizeStatusCode()` 메서드 추가
   - `getTask()` 메서드에 적용
   - 단위 테스트 추가

### 5.2 High (P1)

2. **슬래시 명령어 수정**
   - `/wf:verify.md` - 가장 직접적으로 영향 받음
   - `/wf:done.md` - 입력 상태 체크
   - `/wf:skip.md` - infrastructure `[ds]` 처리

3. **wf-common-lite.md 수정**
   - 상태 코드 표 업데이트
   - 워크플로우 가이드 수정

### 5.3 Medium (P2)

4. **나머지 슬래시 명령어**
   - `/wf:auto.md`, `/wf:run.md` - 워크플로우 체인
   - `/wf:apply.md`, `/wf:patch.md` - 리뷰 관련

5. **wf-common.md 수정**
   - 전체 상태 코드 문서 업데이트

---

## 6. 리스크 및 대응

### 6.1 리스크

| 리스크 | 영향 | 확률 | 대응 방안 |
|--------|------|------|-----------|
| 기존 WBS 파일 호환성 문제 | High | Low | 정규화 레이어 철저한 테스트 |
| 슬래시 명령어 누락 | Medium | Medium | 체크리스트 기반 검토 |
| Server API 불일치 | High | Low | Server는 이미 `[vf]` 사용 |
| 문서 불일치 | Low | Medium | wf-common*.md 일괄 검색 |

### 6.2 대응 전략

**하위 호환성 보장:**
- 정규화 레이어만 수정, WBS 파일은 수정 안 함
- 레거시 상태 코드 → 표준 상태 코드 변환
- 양방향 매핑 테이블 유지

**검증 방법:**
- 단위 테스트: `normalizeStatusCode()` 함수
- 통합 테스트: 실제 WBS 파일 읽기
- E2E 테스트: 슬래시 명령어 실행

---

## 7. 타임라인

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | 기본설계 문서 작성 | 1h |
| 2 | 상세설계 문서 작성 | 2h |
| 3 | WbsReader.js 수정 | 1.5h |
| 4 | 슬래시 명령어 수정 (15개) | 2h |
| 5 | wf-common*.md 수정 | 0.5h |
| 6 | 단위 테스트 작성 | 1h |
| 7 | 통합 테스트 | 1h |
| **합계** | | **9h** |

---

## 8. 성공 기준

### 8.1 기능 요구사항

- [ ] WbsReader가 `[ts]`를 `[vf]`로 정규화
- [ ] WbsReader가 `[ds]`를 `[dd]`로 정규화
- [ ] 기존 WBS 파일 정상 동작 (호환성)
- [ ] 15개 슬래시 명령어 상태 코드 수정 완료
- [ ] wf-common-lite.md 상태 코드 표 수정 완료

### 8.2 품질 요구사항

- [ ] 단위 테스트 커버리지 100% (normalizeStatusCode)
- [ ] 통합 테스트 통과 (실제 WBS 파일 읽기)
- [ ] 문서 일관성 검증 (grep 검색으로 `[ts]`, `[ds]` 0건)

### 8.3 비기능 요구사항

- [ ] 성능 영향 없음 (정규화 오버헤드 < 1ms)
- [ ] 기존 WBS 파일 수정 불필요
- [ ] Server API 변경 불필요

---

## 9. 다음 단계

1. **상세설계 문서 작성** (`020-detail-design.md`)
   - 정규화 함수 상세 사양
   - 슬래시 명령어 수정 목록
   - 테스트 케이스

2. **구현** (TSK-05-03 Implementation)
   - WbsReader.js 수정
   - 슬래시 명령어 일괄 수정
   - 문서 업데이트

3. **통합 테스트** (TSK-05-04)
   - 전체 워크플로우 흐름 검증
   - 레거시 상태 코드 호환성 검증

---

**작성자**: Claude Opus 4.5
**검토자**: TBD
**승인자**: TBD
