# 워크플로우 구성요소 비교 분석

## 1. 폴더 역할

| 폴더 | 역할 | 파일 형식 |
|------|------|-----------|
| `.jjiban/templates/` | Task 문서 템플릿 | Markdown 템플릿 |
| `.claude/commands/wf/` | 워크플로우 명령어 정의 | Claude Code 명령어 |

---

## 2. 명령어 비교 (commands/wf/ vs JSON 설정)

### 2.1 상태 전환 명령어 (workflows.json)

| 명령어 | commands/wf/ | 카테고리 | 상태 |
|--------|:------------:|----------|------|
| `start` | ✅ | 전체 | 존재 |
| `draft` | ✅ | development | 존재 |
| `build` | ✅ | development, infrastructure | 존재 |
| `verify` | ✅ | development, defect | 존재 |
| `done` | ✅ | 전체 | 존재 |
| `fix` | ✅ | defect | 존재 |
| `skip` | ✅ | infrastructure | 존재 |

### 2.2 상태 내 액션 (actions.json)

| 액션 | commands/wf/ | 사용 상태 | 상태 |
|------|:------------:|----------|------|
| `ui` | ✅ | basic-design | 존재 |
| `review` | ✅ | detail-design | 존재 |
| `apply` | ✅ | detail-design | 존재 |
| `audit` | ✅ | implement | 존재 |
| `patch` | ✅ | implement | 존재 |
| `test` | ✅ | implement | 존재 |

**결과: 모든 명령어가 commands/wf/에 존재 ✅**

---

## 3. 템플릿 비교 (templates/ vs JSON 설정)

### 3.1 workflows.json에서 필요한 템플릿

| 문서 | templates/ | 카테고리 | 상태 |
|------|:----------:|----------|------|
| `010-basic-design.md` | ✅ | development | 존재 |
| `020-detail-design.md` | ✅ | development | 존재 |
| `030-implementation.md` | ✅ | 전체 | 존재 |
| `070-integration-test.md` | ❌ | development | **누락** |
| `080-manual.md` | ❌ | development | **누락** |
| `010-defect-analysis.md` | ❌ | defect | **누락** |
| `070-test-results.md` | ❌ | defect | **누락** |
| `010-tech-design.md` | ❌ | infrastructure | **누락** |

### 3.2 actions.json에서 필요한 템플릿

| 문서 | templates/ | 액션 | 상태 |
|------|:----------:|------|------|
| `011-ui-design.md` | ❌ | ui | **누락** |
| `021-design-review.md` | ✅ | review | 존재 (템플릿) |
| `031-code-review.md` | ❌ | audit | **누락** |

### 3.3 templates/에만 있는 파일 (JSON 미참조)

| 파일 | 용도 | 상태 |
|------|------|------|
| `025-traceability-matrix.md` | 추적성 매트릭스 | PRD에 언급됨 |
| `026-test-specification.md` | 테스트 명세 | PRD에 언급됨 |
| `070-e2e-test-results.md` | E2E 테스트 결과 | test 액션용 |
| `070-tdd-test-results.md` | TDD 테스트 결과 | test 액션용 |
| `e2e-html-report.html` | E2E HTML 리포트 | test 액션용 |

---

## 4. 누락 항목 요약

### 4.1 누락된 템플릿 (총 7개)

```
❌ 010-defect-analysis.md    (defect 분석용)
❌ 010-tech-design.md        (infrastructure 설계용)
❌ 011-ui-design.md          (UI 설계용)
❌ 031-code-review.md        (코드 리뷰 템플릿)
❌ 070-integration-test.md   (통합테스트용)
❌ 070-test-results.md       (defect 테스트 결과용)
❌ 080-manual.md             (매뉴얼용)
```

### 4.2 actions.json 업데이트 필요

`test` 액션의 document 필드가 `null`이지만, 실제로는 다음 템플릿 사용:
- `070-tdd-test-results.md`
- `070-e2e-test-results.md`

---

## 5. 권장 조치

### 5.1 템플릿 생성 필요

| 우선순위 | 파일 | 이유 |
|:--------:|------|------|
| 높음 | `010-defect-analysis.md` | defect 워크플로우 필수 |
| 높음 | `010-tech-design.md` | infrastructure 워크플로우 필수 |
| 높음 | `011-ui-design.md` | ui 액션에서 참조 |
| 높음 | `031-code-review.md` | audit 액션에서 참조 |
| 중간 | `070-integration-test.md` | development verify 단계 |
| 중간 | `070-test-results.md` | defect verify 단계 |
| 낮음 | `080-manual.md` | development done 단계 |

### 5.2 actions.json 수정 권장

```json
{
  "id": "test",
  "name": "Unit Test",
  "command": "/wf:test",
  "documents": ["070-tdd-test-results.md", "070-e2e-test-results.md"],
  "repeatable": true
}
```

---

## 6. 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|:----:|------|
| 명령어 (commands/wf/) | ✅ 완료 | 13개 모두 존재 |
| 템플릿 (templates/) | ⚠️ 부분 | 7개 누락 |
| workflows.json | ✅ 완료 | v1.1 |
| actions.json | ⚠️ 부분 | test document 미지정 |
