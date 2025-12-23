# 워크플로우 단순화 검토 문서

## 1. 현재 상태 분석

### 1.1 현재 Development 워크플로우 (6단계)

```
[ ] → [bd] → [dd] → [im] → [vf] → [xx]
Todo   기본설계  상세설계  구현    검증    완료
```

**상태 전환 명령어:**
| From | To | Command | 생성 문서 |
|------|-----|---------|----------|
| `[ ]` | `[bd]` | start | 010-basic-design.md |
| `[bd]` | `[dd]` | draft | 020-detail-design.md |
| `[dd]` | `[im]` | build | 030-implementation.md |
| `[im]` | `[vf]` | verify | 070-integration-test.md |
| `[vf]` | `[xx]` | done | 080-manual.md |

**상태 내 액션 (상태 변경 없음):**
| 상태 | Action | Command | 문서 |
|------|--------|---------|------|
| `[bd]` | UI설계 | ui | 011-ui-design.md |
| `[dd]` | 설계리뷰 | review | 021-design-review-{llm}-{n}.md |
| `[dd]` | 리뷰반영 | apply | - |
| `[im]` | 코드리뷰 | audit | 031-code-review-{llm}-{n}.md |
| `[im]` | 리뷰반영 | patch | - |
| `[im]` | 테스트 | test | 070-tdd-test-results.md |

---

## 2. 발견된 문제점

### 2.1 기본설계 vs 상세설계 중복

**TSK-03-04 분석 결과:**
| 구분 | 기본설계 | 상세설계 |
|------|---------|---------|
| 줄 수 | 607줄 | 747줄 |
| 내용 중복률 | - | ~40% |

**중복되는 섹션:**
- 목적/범위 (거의 동일하게 반복)
- 데이터 모델 (기본설계에서 정의 → 상세설계에서 다시 정의)
- 아키텍처 개요 (기본설계 내용이 상세설계에서 확장)

### 2.2 상세설계의 코드 과다

**문제:** 상세설계 문서에 전체 구현 코드가 포함됨

**TSK-03-04 상세설계 코드 블록:**
| 모듈 | 코드 라인 | 문제점 |
|------|----------|--------|
| stateMapper.ts | ~100줄 | 구현 문서 내용 |
| workflowEngine.ts | ~200줄 | 구현 문서 내용 |
| API 엔드포인트 | ~140줄 | 구현 문서 내용 |

**원칙 위반:** 상세설계는 "How"를 설명해야 하지, 코드를 작성하는 곳이 아님

### 2.3 Verify 단계의 불필요성

**현재 흐름:**
```
[im] 구현 → wf:test → [vf] 검증 → wf:done → [xx] 완료
```

**문제점:**
- 구현 단계에서 이미 TDD/E2E 테스트 수행
- [vf] 검증 단계가 별도로 필요한 이유 불명확
- 테스트 결과를 상태로 관리하면 별도 단계 불필요

---

## 3. 개선 제안

### 3.1 설계 단계 통합

**현재:** `[ ]` → `[bd]` 기본설계 → `[dd]` 상세설계
**제안:** `[ ]` → `[dd]` 설계 (기본+UI+상세 통합)

**통합 설계 문서 구성:**
```
010-design.md (또는 기존 번호 유지)
├── 섹션 1: 목적 및 범위
├── 섹션 2: 요구사항 분석 (FR/NFR)
├── 섹션 3: 아키텍처 개요 (컴포넌트 구조)
├── 섹션 4: 데이터 모델 (ERD, 스키마)
├── 섹션 5: 인터페이스 계약 (API 명세 표)
├── 섹션 6: UI 설계 (화면 레이아웃, 상태)
├── 섹션 7: 프로세스 흐름 (시퀀스 다이어그램)
├── 섹션 8: 에러 처리 전략
├── 섹션 9: 테스트 시나리오
└── 섹션 10: 체크리스트 (리뷰/승인 포함)
```

**코드 금지 원칙:**
- ❌ TypeScript/JavaScript 구현 코드
- ❌ Vue/React 컴포넌트 코드
- ✅ 인터페이스 시그니처 (타입만)
- ✅ Prisma 스키마 (예외)
- ✅ 표, 다이어그램, 유즈케이스

### 3.2 Verify 단계 제거

**현재 (6단계):**
```
[ ] → [bd] → [dd] → [im] → [vf] → [xx]
```

**제안 (4단계):**
```
[ ] → [dd] → [im] → [xx]
     설계    구현    완료
```

**테스트 처리 방식:**
1. 구현(`[im]`) 단계에서 `wf:test` 실행
2. 테스트 실패 시 반복 (최대 3회)
3. Task 메타데이터에 `test-result` 필드 추가
   - `none`: 테스트 미실행
   - `pass`: 테스트 통과
   - `fail`: 테스트 실패
4. `test-result: pass`여야만 `[xx]` 완료로 전환 가능

### 3.3 리뷰/패치를 체크리스트로 전환

**현재:** review, apply, audit, patch가 별도 액션으로 존재
**제안:** 문서 내 체크리스트로 통합

**설계 문서 체크리스트 (010-design.md):**
```markdown
## 체크리스트

### 설계 완료
- [ ] 요구사항 분석 완료
- [ ] 아키텍처 설계 완료
- [ ] 데이터 모델 정의 완료
- [ ] API 인터페이스 정의 완료
- [ ] UI 설계 완료

### 설계 리뷰
- [ ] LLM 설계 리뷰 수행 (021-design-review-*.md)
- [ ] 리뷰 이슈 반영 완료
- [ ] 설계 승인 완료
```

**구현 문서 체크리스트 (030-implementation.md):**
```markdown
## 체크리스트

### 구현 완료
- [ ] Backend 구현 완료
- [ ] Frontend 구현 완료
- [ ] 단위 테스트 작성 완료

### 코드 리뷰
- [ ] LLM 코드 리뷰 수행 (031-code-review-*.md)
- [ ] 리뷰 이슈 반영 완료

### 테스트
- [ ] TDD 테스트 통과
- [ ] E2E 테스트 통과
- [ ] test-result: pass
```

---

## 4. 제안된 워크플로우 비교

### Option A: 4단계 + 승인 (CLAUDE.md 반영)

```
[ ] → [dd] → [ap] → [im] → [xx]
Todo  설계   승인   구현   완료
```

| Command | From | To | 설명 |
|---------|------|-----|------|
| start | `[ ]` | `[dd]` | 설계 시작 |
| approve | `[dd]` | `[ap]` | 설계 승인 |
| build | `[ap]` | `[im]` | 구현 시작 |
| done | `[im]` | `[xx]` | 완료 (test-result: pass 필요) |

### Option B: 3단계 (최소화)

```
[ ] → [dd] → [im] → [xx]
Todo  설계   구현   완료
```

| Command | From | To | 설명 |
|---------|------|-----|------|
| start | `[ ]` | `[dd]` | 설계 시작 |
| build | `[dd]` | `[im]` | 구현 시작 (승인은 체크리스트) |
| done | `[im]` | `[xx]` | 완료 (test-result: pass 필요) |

---

## 5. 수정 필요 파일 목록

### 5.1 설정 파일

| 파일 | 수정 내용 |
|------|----------|
| `server/utils/settings/defaults.ts` | DEFAULT_WORKFLOWS, DEFAULT_COLUMNS, DEFAULT_ACTIONS 수정 |
| `.claude/skills/jjiban-init/assets/settings/workflows.json` | 워크플로우 정의 수정 |
| `.claude/skills/jjiban-init/assets/settings/columns.json` | 칸반 컬럼 수정 |
| `.claude/skills/jjiban-init/assets/settings/actions.json` | 액션 정의 수정 |
| `types/settings.ts` | 필요시 타입 수정 |

### 5.2 CLI 명령어

| 파일 | 수정 내용 |
|------|----------|
| `.claude/commands/wf_old/start.md` | 설계 시작으로 변경 |
| `.claude/commands/wf_old/draft.md` | 제거 또는 통합 |
| `.claude/commands/wf_old/verify.md` | 제거 |
| `.claude/commands/wf_old/done.md` | test-result 체크 로직 추가 |

### 5.3 문서 템플릿

| 파일 | 수정 내용 |
|------|----------|
| `.claude/skills/jjiban-init/assets/templates/010-*.md` | 통합 설계 템플릿 |
| `.claude/skills/jjiban-init/assets/templates/030-*.md` | 체크리스트 섹션 추가 |

### 5.4 서비스 로직

| 파일 | 수정 내용 |
|------|----------|
| `server/utils/workflow/transitionService.ts` | done 전환 시 test-result 검증 |
| `server/utils/workflow/documentService.ts` | 문서 타입 매핑 수정 |
| `server/utils/workflow/stateMapper.ts` | 상태 매핑 수정 |

### 5.5 프로젝트 문서

| 파일 | 수정 내용 |
|------|----------|
| `CLAUDE.md` | 워크플로우 상태 설명 수정 |
| `.jjiban/projects/*/prd.md` | 워크플로우 정책 반영 |

---

## 6. 결정 필요 사항

### 6.1 워크플로우 구조
- [ ] Option A (4단계 + 승인) vs Option B (3단계)
- [ ] 승인([ap]) 단계 필요 여부

### 6.2 문서 번호 체계
- [ ] 010-design.md 통합 vs 010+011+020 분리 유지
- [ ] 기존 문서와의 호환성 처리 방안

### 6.3 체크리스트 위치
- [ ] 문서 내 체크리스트 섹션 vs 별도 체크리스트 파일

### 6.4 테스트 결과 관리
- [ ] test-result 필드 위치 (wbs.md Task 메타데이터)
- [ ] 실패 시 재시도 횟수 (제안: 3회)

---

## 7. 마이그레이션 고려사항

### 7.1 기존 Task 처리
- 진행 중인 Task의 상태 매핑 필요
- `[bd]` → `[dd]`로 자동 전환?
- `[vf]` → `[im]`으로 롤백?

### 7.2 기존 문서 처리
- 010-basic-design.md, 020-detail-design.md 병합 도구 필요?
- 또는 기존 문서 그대로 유지하고 새 Task부터 적용?

---

**문서 작성일:** 2025-12-18
**상태:** 검토 중
