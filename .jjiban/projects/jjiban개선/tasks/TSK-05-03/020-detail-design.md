# 상세설계: 상태 코드 통일

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-03 |
| Category | development |
| 상태 | [dd] 상세설계 |
| 상위 Work Package | WP-05: 워크플로우 유연화 |
| 의존성 | TSK-05-01 (CLI 설정 로더), TSK-05-02 (workflowSteps 리팩토링) |
| 작성일 | 2025-12-17 |

---

## 1. 개요

### 1.1 목적

Server와 CLI 간 상태 코드 불일치를 해결하기 위한 구체적인 구현 사양을 정의합니다.

### 1.2 설계 범위

1. **WbsReader.js 정규화 레이어** - 상태 코드 매핑 함수
2. **슬래시 명령어 수정** - 15개 파일 상태 코드 변경
3. **wf-common-lite.md 수정** - 상태 코드 표 업데이트
4. **테스트 사양** - 단위/통합 테스트

---

## 2. 상태 코드 정규화 레이어

### 2.1 WbsReader.js 수정 사양

**파일**: `cli/core/WbsReader.js`

#### 2.1.1 정규화 함수 추가

**위치**: Line 7 (imports 다음)

```javascript
/**
 * 레거시 상태 코드를 표준 상태 코드로 정규화
 *
 * @param {string} statusCode - 상태 코드 (예: "[ts]", "[vf]")
 * @returns {string} 정규화된 상태 코드
 *
 * @example
 * normalizeStatusCode('[ts]')  // → '[vf]'
 * normalizeStatusCode('[ds]')  // → '[dd]'
 * normalizeStatusCode('[vf]')  // → '[vf]' (이미 표준)
 */
function normalizeStatusCode(statusCode) {
  // 상태 코드 매핑 테이블
  const STATUS_CODE_MAP = {
    '[ts]': '[vf]',  // Test → Verify (레거시 → 표준)
    '[ds]': '[dd]',  // Design → Detail Design (infrastructure용)
  };

  // 매핑 테이블에 있으면 변환, 없으면 그대로 반환
  return STATUS_CODE_MAP[statusCode] || statusCode;
}
```

**설계 원칙:**
- **단순 매핑**: 복잡한 로직 없이 테이블 기반
- **비파괴적**: 매핑 없는 경우 원본 반환
- **확장 가능**: 새로운 레거시 코드 추가 쉬움
- **성능**: O(1) 해시 룩업

#### 2.1.2 getTask() 메서드 수정

**현재 코드** (Line 209-220):
```javascript
// 상태 코드 추출 (예: "basic-design [bd]" → "[bd]")
const statusMatch = (task.status || '[ ]').match(/\[([^\]]*)\]/);
const statusCode = statusMatch ? `[${statusMatch[1]}]` : '[ ]';

return {
  id: task.id,
  title: task.title,
  category: task.category || 'development',
  status: statusCode,  // ← 정규화 없이 그대로 반환
  priority: task.priority,
  projectId: pid
};
```

**수정 후 코드**:
```javascript
// 상태 코드 추출 (예: "basic-design [bd]" → "[bd]")
const statusMatch = (task.status || '[ ]').match(/\[([^\]]*)\]/);
let statusCode = statusMatch ? `[${statusMatch[1]}]` : '[ ]';

// 레거시 상태 코드 정규화
statusCode = normalizeStatusCode(statusCode);

return {
  id: task.id,
  title: task.title,
  category: task.category || 'development',
  status: statusCode,  // ← 정규화된 상태 코드 반환
  priority: task.priority,
  projectId: pid
};
```

**변경 사항:**
1. Line 210: `const statusCode` → `let statusCode` (재할당 가능)
2. Line 213: `statusCode = normalizeStatusCode(statusCode);` 추가
3. Line 219: 주석 수정

#### 2.1.3 정규화 동작 흐름

```
WBS 파일
  ↓
parseWbsMarkdownSimple()
  → task.status = "verify [ts]"
  ↓
getTask()
  → statusMatch.match() → statusCode = "[ts]"
  ↓
normalizeStatusCode("[ts]")
  → STATUS_CODE_MAP['[ts]'] → "[vf]"
  ↓
return { status: "[vf]" }  ← CLI 내부에서는 표준 코드 사용
```

### 2.2 정규화 매핑 테이블

| 레거시 코드 | 표준 코드 | 의미 | 사용처 |
|------------|----------|------|--------|
| `[ts]` | `[vf]` | Verify (검증) | development, defect |
| `[ds]` | `[dd]` | Detail Design (상세설계) | infrastructure |

**제외 코드** (정규화 불필요):
- `[ ]`, `[bd]`, `[dd]`, `[an]`, `[im]`, `[fx]`, `[vf]`, `[xx]` - 이미 표준

### 2.3 하위 호환성 보장

**시나리오 1: 레거시 WBS 파일**
```markdown
#### TSK-01-01: 터미널 UI
- status: verify [ts]
```
→ WbsReader.getTask() → `{ status: '[vf]' }` 반환

**시나리오 2: 표준 WBS 파일**
```markdown
#### TSK-01-01: 터미널 UI
- status: verify [vf]
```
→ WbsReader.getTask() → `{ status: '[vf]' }` 반환

**결과**: 동일한 출력 → CLI 내부 로직 영향 없음

---

## 3. 슬래시 명령어 수정

### 3.1 수정 대상 파일 (15개)

**우선순위 P0 (Critical):**

| 파일 | 수정 위치 | 변경 내용 |
|------|----------|----------|
| `verify.md` | Line 3-4 | `[ts]` → `[vf]` (상태 전환) |
| `verify.md` | Line 48-49 | `[ts]` → `[vf]` (상태 업데이트) |

**우선순위 P1 (High):**

| 파일 | 수정 위치 | 변경 내용 |
|------|----------|----------|
| `done.md` | Line 3-4 | `[ts]` → `[vf]` (입력 상태) |
| `skip.md` | Line 3-4 | `[ds]` → `[dd]` (infra 설계) |
| `auto.md` | Line 20-30 | `[ts]` → `[vf]` (워크플로우 체인) |
| `run.md` | Line 20-30 | `[ts]` → `[vf]` (워크플로우 체인) |

**우선순위 P2 (Medium):**

| 파일 | 수정 위치 | 변경 내용 |
|------|----------|----------|
| `apply.md` | Line 3-4 | `[ts]` → `[vf]` (리뷰 적용 후) |
| `audit.md` | Line 20-30 | `[ts]` → `[vf]` (감사 후 상태) |
| `patch.md` | Line 3-4 | `[ts]` → `[vf]` (긴급 수정 후) |
| `test.md` | Line 3-4 | `[ts]` → `[vf]` (테스트 → 검증) |

**수정 불필요 (5개):**
- `build.md`, `draft.md`, `fix.md`, `review.md`, `start.md`, `ui.md`

### 3.2 verify.md 수정 예시

**파일**: `.claude/commands/wf/verify.md`

**수정 전** (Line 1-5):
```markdown
# /wf:verify - 통합테스트 (Lite)

> **상태 전환**: `[im] 구현` → `[ts] 테스트` (development)
> **상태 전환**: `[fx] 수정` → `[ts] 테스트` (defect)
> **적용 category**: development, defect
```

**수정 후**:
```markdown
# /wf:verify - 통합테스트 (Lite)

> **상태 전환**: `[im] 구현` → `[vf] 검증` (development)
> **상태 전환**: `[fx] 수정` → `[vf] 검증` (defect)
> **적용 category**: development, defect
```

**수정 전** (Line 47-49):
```markdown
5. **상태 업데이트**
   - `[im]` → `[ts]` (development)
   - `[fx]` → `[ts]` (defect)
```

**수정 후**:
```markdown
5. **상태 업데이트**
   - `[im]` → `[vf]` (development)
   - `[fx]` → `[vf]` (defect)
```

**수정 전** (Line 68-70):
```markdown
| 에러 | 메시지 |
|------|--------|
| 잘못된 상태 | `[ERROR] 구현/수정 상태가 아닙니다` |
```

**수정 후**: (변경 없음 - 입력 상태 체크는 WbsReader 정규화가 처리)

### 3.3 done.md 수정 예시

**파일**: `.claude/commands/wf/done.md`

**수정 전**:
```markdown
# /wf:done - 작업 완료

> **상태 전환**: `[ts] 테스트` → `[xx] 완료`
> **적용 category**: development, defect, infrastructure
```

**수정 후**:
```markdown
# /wf:done - 작업 완료

> **상태 전환**: `[vf] 검증` → `[xx] 완료`
> **적용 category**: development, defect, infrastructure
```

### 3.4 skip.md 수정 예시

**파일**: `.claude/commands/wf/skip.md`

**수정 전**:
```markdown
# /wf:skip - 설계 건너뛰기

> **상태 전환**: `[ ] 대기` → `[im] 구현` (infrastructure, ds 생략)
```

**수정 후**:
```markdown
# /wf:skip - 설계 건너뛰기

> **상태 전환**: `[ ] 대기` → `[im] 구현` (infrastructure, dd 생략)
```

### 3.5 auto.md, run.md 수정 예시

**파일**: `.claude/commands/wf/auto.md`, `.claude/commands/wf/run.md`

**수정 전** (워크플로우 체인):
```markdown
## development 워크플로우
[ ] → [bd] → [dd] → [im] → [ts] → [xx]
     start   draft   build   verify  done
```

**수정 후**:
```markdown
## development 워크플로우
[ ] → [bd] → [dd] → [im] → [vf] → [xx]
     start   draft   build   verify  done
```

**수정 전** (defect 워크플로우):
```markdown
## defect 워크플로우
[ ] → [an] → [fx] → [ts] → [xx]
     start   fix    verify  done
```

**수정 후**:
```markdown
## defect 워크플로우
[ ] → [an] → [fx] → [vf] → [xx]
     start   fix    verify  done
```

---

## 4. wf-common-lite.md 수정

### 4.1 파일 정보

**파일**: `.claude/includes/wf-common-lite.md`

**수정 위치**: Line 73-86 (상태 코드 표)

### 4.2 수정 내용

**수정 전** (Line 73-86):
```markdown
## 상태 코드

| 코드 | 의미 | Category | 칸반 |
|------|------|----------|------|
| `[ ]` | Todo | 공통 | Todo |
| `[bd]` | 기본설계 | development | Design |
| `[dd]` | 상세설계 | development | Detail |
| `[an]` | 분석 | defect | Detail |
| `[ds]` | 설계 | infrastructure | Detail |
| `[im]` | 구현 | dev/infra | Implement |
| `[fx]` | 수정 | defect | Implement |
| `[ts]` | 테스트 | dev/defect | Verify |
| `[xx]` | 완료 | 공통 | Done |
```

**수정 후**:
```markdown
## 상태 코드

| 코드 | 의미 | Category | 칸반 |
|------|------|----------|------|
| `[ ]` | Todo | 공통 | Todo |
| `[bd]` | 기본설계 | development | Design |
| `[dd]` | 상세설계 | dev/infra | Detail |
| `[an]` | 분석 | defect | Detail |
| `[im]` | 구현 | dev/infra | Implement |
| `[fx]` | 수정 | defect | Implement |
| `[vf]` | 검증 | dev/defect | Verify |
| `[xx]` | 완료 | 공통 | Done |
```

**변경 사항:**
1. Line 79: `[ds]` 삭제 - `[dd]`로 통일
2. Line 79: `[dd]` Category를 `dev/infra`로 확장 (infrastructure도 dd 사용)
3. Line 84: `[ts]` → `[vf]`, 의미 "테스트" → "검증"

### 4.3 wf-common.md 수정

**파일**: `.claude/includes/wf-common.md`

**동일한 수정** 적용 (상태 코드 표 섹션)

---

## 5. 테스트 사양

### 5.1 단위 테스트: normalizeStatusCode()

**테스트 파일**: `cli/core/__tests__/WbsReader.test.js` (신규 생성)

```javascript
import { describe, it, expect } from 'vitest';

// normalizeStatusCode는 내부 함수이므로 export 필요
// 또는 getTask() 결과로 간접 테스트

describe('normalizeStatusCode', () => {
  it('레거시 [ts]를 [vf]로 정규화', () => {
    const result = normalizeStatusCode('[ts]');
    expect(result).toBe('[vf]');
  });

  it('레거시 [ds]를 [dd]로 정규화', () => {
    const result = normalizeStatusCode('[ds]');
    expect(result).toBe('[dd]');
  });

  it('표준 코드는 그대로 반환', () => {
    expect(normalizeStatusCode('[vf]')).toBe('[vf]');
    expect(normalizeStatusCode('[dd]')).toBe('[dd]');
    expect(normalizeStatusCode('[bd]')).toBe('[bd]');
    expect(normalizeStatusCode('[im]')).toBe('[im]');
    expect(normalizeStatusCode('[xx]')).toBe('[xx]');
    expect(normalizeStatusCode('[ ]')).toBe('[ ]');
  });

  it('알 수 없는 코드는 그대로 반환', () => {
    expect(normalizeStatusCode('[unknown]')).toBe('[unknown]');
  });

  it('빈 문자열 처리', () => {
    expect(normalizeStatusCode('')).toBe('');
  });
});
```

### 5.2 통합 테스트: WbsReader.getTask()

**테스트 파일**: `cli/core/__tests__/WbsReader.integration.test.js`

```javascript
import { describe, it, expect, beforeAll } from 'vitest';
import { WbsReader } from '../WbsReader.js';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('WbsReader 상태 코드 정규화', () => {
  let reader;
  let testWbsPath;

  beforeAll(async () => {
    // 테스트용 WBS 파일 생성
    const testRoot = join(__dirname, 'test-fixtures');
    await fs.mkdir(testRoot, { recursive: true });
    await fs.mkdir(join(testRoot, '.jjiban/projects/test'), { recursive: true });

    testWbsPath = join(testRoot, '.jjiban/projects/test/wbs.md');
    const wbsContent = `> version: 2.0

---

### TSK-01-01: 레거시 테스트 상태
- category: development
- status: verify [ts]

### TSK-01-02: 레거시 설계 상태
- category: infrastructure
- status: design [ds]

### TSK-01-03: 표준 검증 상태
- category: development
- status: verify [vf]

### TSK-01-04: 표준 상세설계 상태
- category: infrastructure
- status: detail-design [dd]
`;
    await fs.writeFile(testWbsPath, wbsContent, 'utf-8');

    reader = new WbsReader(testRoot);
  });

  it('[ts] 상태를 [vf]로 정규화', async () => {
    const task = await reader.getTask('TSK-01-01', 'test');
    expect(task.status).toBe('[vf]');
  });

  it('[ds] 상태를 [dd]로 정규화', async () => {
    const task = await reader.getTask('TSK-01-02', 'test');
    expect(task.status).toBe('[dd]');
  });

  it('[vf] 상태는 그대로 유지', async () => {
    const task = await reader.getTask('TSK-01-03', 'test');
    expect(task.status).toBe('[vf]');
  });

  it('[dd] 상태는 그대로 유지', async () => {
    const task = await reader.getTask('TSK-01-04', 'test');
    expect(task.status).toBe('[dd]');
  });
});
```

### 5.3 E2E 테스트: 슬래시 명령어

**테스트 시나리오**:

1. **레거시 WBS 파일 생성**
   ```bash
   # .jjiban/projects/test/wbs.md
   ### TSK-01-01: 구현 완료 Task
   - category: development
   - status: implement [im]
   ```

2. **/wf:verify 실행**
   ```bash
   /wf:verify test/TSK-01-01
   ```

3. **예상 결과**
   - WbsReader.getTask() → `{ status: '[im]' }`
   - verify 명령어: `[im]` → `[vf]` 전환
   - wbs.md 업데이트: `- status: verify [vf]`

4. **검증**
   ```bash
   # wbs.md 확인
   grep "TSK-01-01" .jjiban/projects/test/wbs.md
   # 출력: - status: verify [vf]
   ```

### 5.4 회귀 테스트: 기존 WBS 파일

**목적**: 실제 프로젝트 WBS 파일 호환성 검증

**테스트 대상**:
- `.jjiban/projects/jjiban/wbs.md` (16개 `[vf]` 상태 Task)
- `.jjiban/projects/jjiban개선/wbs.md` (혼합 상태)

**테스트 방법**:
```bash
# 1. WbsReader로 전체 Task 읽기
node cli/test-wbs-reader.js

# 2. 상태 코드 정규화 확인
# 예상: [ts] → [vf], [ds] → [dd] 변환됨
```

**성공 기준**:
- 모든 Task 정상 조회
- 상태 코드 정규화 동작
- WBS 파일 원본 변경 없음

---

## 6. 구현 체크리스트

### 6.1 코드 수정

- [ ] `cli/core/WbsReader.js`
  - [ ] `normalizeStatusCode()` 함수 추가
  - [ ] `getTask()` 메서드 수정 (Line 210, 213)
  - [ ] JSDoc 주석 작성

### 6.2 슬래시 명령어 수정 (P0-P1)

- [ ] `.claude/commands/wf/verify.md` (Line 3-4, 48-49)
- [ ] `.claude/commands/wf/done.md` (Line 3-4)
- [ ] `.claude/commands/wf/skip.md` (Line 3-4)
- [ ] `.claude/commands/wf/auto.md` (워크플로우 체인)
- [ ] `.claude/commands/wf/run.md` (워크플로우 체인)

### 6.3 슬래시 명령어 수정 (P2)

- [ ] `.claude/commands/wf/apply.md`
- [ ] `.claude/commands/wf/audit.md`
- [ ] `.claude/commands/wf/patch.md`
- [ ] `.claude/commands/wf/test.md`

### 6.4 문서 수정

- [ ] `.claude/includes/wf-common-lite.md` (Line 79, 84)
- [ ] `.claude/includes/wf-common.md` (상태 코드 표)

### 6.5 테스트

- [ ] `cli/core/__tests__/WbsReader.test.js` 작성
- [ ] `cli/core/__tests__/WbsReader.integration.test.js` 작성
- [ ] 단위 테스트 실행 및 통과
- [ ] 통합 테스트 실행 및 통과
- [ ] E2E 테스트 (슬래시 명령어 실행)
- [ ] 회귀 테스트 (기존 WBS 파일)

### 6.6 검증

- [ ] `grep -r "\[ts\]" .claude/commands/wf/` → 0건
- [ ] `grep -r "\[ds\]" .claude/commands/wf/` → 0건
- [ ] `grep -r "\[ts\]" .claude/includes/` → 0건
- [ ] Server API 동작 확인 (영향 없음)
- [ ] 기존 WBS 파일 호환성 확인

---

## 7. 구현 순서

### 7.1 Phase 1: 코어 로직 (30분)

1. `WbsReader.js` 수정
   - `normalizeStatusCode()` 함수 추가
   - `getTask()` 메서드 수정
   - JSDoc 주석 작성

2. 단위 테스트 작성
   - `normalizeStatusCode()` 테스트 케이스
   - 실행 및 통과 확인

### 7.2 Phase 2: 슬래시 명령어 (1시간)

**우선순위 순서:**

1. P0: `verify.md` (가장 직접적 영향)
2. P1: `done.md`, `skip.md` (입력 상태 체크)
3. P1: `auto.md`, `run.md` (워크플로우 체인)
4. P2: `apply.md`, `audit.md`, `patch.md`, `test.md`

**일괄 수정 방법:**
```bash
# 1. 파일 목록 생성
FILES="verify.md done.md skip.md auto.md run.md apply.md audit.md patch.md test.md"

# 2. sed를 사용한 일괄 치환
for file in $FILES; do
  sed -i 's/\[ts\]/[vf]/g' ".claude/commands/wf/$file"
  sed -i 's/\[ds\]/[dd]/g' ".claude/commands/wf/$file"
done

# 3. 수동 검토
git diff .claude/commands/wf/
```

### 7.3 Phase 3: 문서 및 테스트 (30분)

1. `wf-common-lite.md`, `wf-common.md` 수정
2. 통합 테스트 작성 및 실행
3. E2E 테스트 실행
4. 회귀 테스트 (기존 WBS 파일)

### 7.4 Phase 4: 검증 및 커밋 (30분)

1. grep 검색으로 잔존 `[ts]`, `[ds]` 확인
2. 전체 테스트 재실행
3. Git 커밋
4. wbs.md 상태 업데이트 (`[ ]` → `[dd]`)

---

## 8. 파일 변경 요약

### 8.1 신규 파일 (2개)

| 파일 | 용도 |
|------|------|
| `cli/core/__tests__/WbsReader.test.js` | 단위 테스트 |
| `cli/core/__tests__/WbsReader.integration.test.js` | 통합 테스트 |

### 8.2 수정 파일 (12개)

**코드 파일 (1개):**
- `cli/core/WbsReader.js` (함수 추가, 메서드 수정)

**슬래시 명령어 (9개):**
- `verify.md`, `done.md`, `skip.md`, `auto.md`, `run.md`
- `apply.md`, `audit.md`, `patch.md`, `test.md`

**문서 파일 (2개):**
- `.claude/includes/wf-common-lite.md`
- `.claude/includes/wf-common.md`

### 8.3 변경 불필요 (6개)

- `build.md`, `draft.md`, `fix.md`, `review.md`, `start.md`, `ui.md`

---

## 9. 성공 기준 (재확인)

### 9.1 기능

- [x] 정규화 매핑 테이블 정의 (`[ts]` → `[vf]`, `[ds]` → `[dd]`)
- [ ] `normalizeStatusCode()` 구현 완료
- [ ] `getTask()` 메서드 정규화 적용
- [ ] 슬래시 명령어 9개 수정 완료
- [ ] wf-common*.md 문서 업데이트

### 9.2 품질

- [ ] 단위 테스트 커버리지 100%
- [ ] 통합 테스트 통과
- [ ] E2E 테스트 통과
- [ ] 회귀 테스트 통과 (기존 WBS 파일)

### 9.3 검증

- [ ] `grep -r "\[ts\]" .claude/` → 0건 (레거시 코드 잔존 없음)
- [ ] `grep -r "\[ds\]" .claude/` → 0건
- [ ] 기존 WBS 파일 정상 동작
- [ ] Server API 영향 없음

---

## 10. 리스크 및 대응 (상세)

### 10.1 리스크 시나리오

**리스크 1: WBS 파일 파싱 실패**

| 항목 | 내용 |
|------|------|
| 상황 | `normalizeStatusCode()`에서 예외 발생 |
| 영향 | CLI 명령어 전체 실패 |
| 확률 | Low (단순 매핑 로직) |
| 대응 | try-catch로 에러 처리, 원본 코드 반환 |

**리스크 2: 슬래시 명령어 누락**

| 항목 | 내용 |
|------|------|
| 상황 | 일부 파일에 `[ts]` 잔존 |
| 영향 | 문서 불일치 |
| 확률 | Medium |
| 대응 | grep 검색 자동화, 체크리스트 기반 검토 |

**리스크 3: Server API 불일치**

| 항목 | 내용 |
|------|------|
| 상황 | Server가 `[vf]` 인식 못 함 |
| 영향 | API 오류 |
| 확률 | Very Low (Server 이미 `[vf]` 사용) |
| 대응 | Server 코드 사전 확인 |

### 10.2 롤백 계획

**만약 심각한 문제 발생 시:**

1. Git revert로 변경사항 되돌리기
2. WbsReader.js만 롤백 (문서는 유지 가능)
3. 슬래시 명령어 개별 롤백

**롤백 조건:**
- 통합 테스트 50% 이상 실패
- 기존 WBS 파일 파싱 불가
- Server API 통신 실패

---

## 11. 다음 단계

### 11.1 구현 단계

1. **WbsReader.js 수정** (30분)
2. **슬래시 명령어 수정** (1시간)
3. **문서 업데이트** (30분)
4. **테스트 작성 및 실행** (1시간)
5. **검증 및 커밋** (30분)

### 11.2 후속 Task

- **TSK-05-04**: 통합 테스트
  - development/defect/infrastructure 전체 흐름 검증
  - 레거시 상태 코드 호환성 검증
  - 설정 파일 로드 실패 시 폴백 검증

### 11.3 문서 업데이트

- `wbs.md` 상태 업데이트: `TSK-05-03` → `[dd]` 상세설계
- Task 폴더에 `030-implementation.md` 작성 (구현 완료 후)

---

**작성자**: Claude Opus 4.5
**검토자**: TBD
**승인자**: TBD
