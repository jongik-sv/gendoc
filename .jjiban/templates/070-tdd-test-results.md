# 단위 테스트 결과서 템플릿 (070-tdd-test-results.md)

**Template Version:** 1.0.0 — **Last Updated:** 2026-12-07

> **용도**: build 단계에서 단위 테스트 실행 후 결과를 기록하는 문서
> **생성 시점**: `/wf:build` 명령어 실행 시 자동 생성
> **참조 문서**: `020-detail-design.md` 섹션 2.3 (테스트 역추적 매트릭스), 섹션 13.1 (단위 테스트)

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | [Task-ID] |
| Task명 | [Task명] |
| 테스트 일시 | [YYYY-MM-DD HH:mm] |
| 테스트 환경 | Node.js [버전], Vitest [버전] |
| 상세설계 문서 | `020-detail-design.md` |

---

## 1. 테스트 요약

### 1.1 전체 결과

| 항목 | 수치 | 상태 |
|------|------|------|
| 총 테스트 수 | [N] | - |
| 통과 | [N] | ✅ |
| 실패 | [N] | ❌ |
| 스킵 | [N] | ⏭️ |
| **통과율** | [N]% | ✅/❌ |

### 1.2 커버리지 요약

| 항목 | 수치 | 목표 | 상태 |
|------|------|------|------|
| Statements | [N]% | 80% | ✅/❌ |
| Branches | [N]% | 80% | ✅/❌ |
| Functions | [N]% | 80% | ✅/❌ |
| Lines | [N]% | 80% | ✅/❌ |

### 1.3 테스트 판정

- [ ] **PASS**: 모든 테스트 통과 + 커버리지 목표 달성
- [ ] **CONDITIONAL**: 테스트 통과, 커버리지 미달 (진행 가능)
- [ ] **FAIL**: 테스트 실패 존재 (코드 수정 필요)

---

## 2. 요구사항별 테스트 결과

> 상세설계 섹션 2.3 (테스트 역추적 매트릭스) 기반

### 2.1 기능 요구사항 검증 결과

| 요구사항 ID | 요구사항 설명 | 테스트 ID | 결과 | 비고 |
|-------------|--------------|-----------|------|------|
| FR-001 | [설명] | UT-001 | ✅ PASS | - |
| FR-002 | [설명] | UT-002 | ✅ PASS | - |
| FR-003 | [설명] | UT-003, UT-004 | ✅ PASS | - |

**검증 현황**: [N]/[N] 기능 요구사항 검증 완료 (100%)

### 2.2 비즈니스 규칙 검증 결과

| 규칙 ID | 규칙 설명 | 테스트 ID | 결과 | 검증 방법 |
|---------|----------|-----------|------|----------|
| BR-001 | [설명] | UT-005 | ✅ PASS | 예외 발생 확인 |
| BR-002 | [설명] | UT-006 | ✅ PASS | 권한 거부 확인 |

**검증 현황**: [N]/[N] 비즈니스 규칙 검증 완료 (100%)

---

## 3. 테스트 케이스별 상세 결과

### 3.1 통과한 테스트

| 테스트 ID | 테스트명 | 실행 시간 | 요구사항 |
|-----------|----------|----------|----------|
| UT-001 | should create with valid data | 15ms | FR-003 |
| UT-002 | should throw ConflictException for duplicate name | 8ms | BR-001 |
| UT-003 | should return paginated list | 12ms | FR-001 |

### 3.2 실패한 테스트

> 실패한 테스트가 없으면 "없음"으로 표시

| 테스트 ID | 테스트명 | 실패 원인 | 요구사항 | 조치 필요 |
|-----------|----------|----------|----------|----------|
| UT-XXX | [테스트명] | [에러 메시지] | FR-XXX | [조치 내용] |

**실패 상세 분석**:

```
// UT-XXX 실패 로그
[실패 로그 내용]
```

**원인 분석**:
- [원인 1]
- [원인 2]

**권장 조치**:
1. [조치 1]
2. [조치 2]

---

## 4. 커버리지 상세

### 4.1 파일별 커버리지

| 파일 | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| `[resource].service.ts` | [N]% | [N]% | [N]% | [N]% |
| `[resource].controller.ts` | [N]% | [N]% | [N]% | [N]% |
| `dto/create-[resource].dto.ts` | [N]% | [N]% | [N]% | [N]% |

### 4.2 미커버 영역

> 커버리지 80% 미달 시 기록

| 파일 | 라인 | 미커버 이유 | 조치 필요 여부 |
|------|------|------------|---------------|
| `[file]` | [lines] | [이유] | 예/아니오 |

---

## 5. 테스트 실행 로그

### 5.1 실행 명령어

```bash
npm run test:unit -- --coverage
```

### 5.2 실행 결과 요약

```
 ✓ [resource].service.spec.ts (6 tests) 45ms
   ✓ [Resource]Service > create > should create with valid data
   ✓ [Resource]Service > create > should throw ConflictException for duplicate name
   ✓ [Resource]Service > findAll > should return paginated list
   ✓ [Resource]Service > findOne > should return single item
   ✓ [Resource]Service > update > should update successfully
   ✓ [Resource]Service > delete > should throw ForbiddenException for unauthorized user

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  HH:mm:ss
   Duration  XXXms
```

---

## 6. 품질 게이트 결과

| 게이트 | 기준 | 실제 | 결과 |
|--------|------|------|------|
| 테스트 통과율 | 100% | [N]% | ✅/❌ |
| 커버리지 (Statements) | ≥80% | [N]% | ✅/❌ |
| 커버리지 (Branches) | ≥80% | [N]% | ✅/❌ |
| 실패 테스트 | 0개 | [N]개 | ✅/❌ |

**최종 판정**: ✅ PASS / ❌ FAIL

---

## 7. 다음 단계

### 테스트 통과 시
- E2E 테스트 실행 (`070-e2e-test-results.md` 생성)
- 코드 리뷰 진행 (`031-code-review-{llm}-{n}.md` 생성)

### 테스트 실패 시
- 실패 원인 분석 및 코드 수정
- 테스트 재실행

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 구현 문서: `030-implementation.md`
- E2E 테스트 결과: `070-e2e-test-results.md`

---

<!--
author: 장종익 
Template Version History:
- v1.0.0 (2026-12-07): 신규 생성
  - 요구사항 추적성 기반 테스트 결과 매핑
  - 커버리지 상세 분석 섹션
  - 품질 게이트 결과 섹션
-->
