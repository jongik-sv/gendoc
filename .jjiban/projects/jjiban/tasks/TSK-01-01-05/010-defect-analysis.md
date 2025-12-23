# Defect 분석서

## 기본 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-05 |
| Task 명 | WBS Store API 응답 처리 버그 수정 |
| Category | defect |
| Priority | critical |
| 발견일 | 2025-12-15 |
| 발견 경로 | TSK-04-03 E2E 테스트 |

---

## 1. 증상 (Symptom)

### 1.1 에러 메시지
```
nodes is not iterable
```

### 1.2 발생 위치
- 페이지: `/wbs?projectId=jjiban`
- 컴포넌트: `WbsTreePanel.vue`
- 상태: 에러 화면 표시 (error-state)

### 1.3 재현 조건
1. 애플리케이션 실행 (`npm run dev`)
2. WBS 페이지 접속 (`/wbs?projectId=jjiban`)
3. 에러 발생 확인

---

## 2. 원인 분석 (Root Cause)

### 2.1 버그 위치
```
파일: app/stores/wbs.ts
라인: 131-146 (fetchWbs 함수)
```

### 2.2 문제 코드
```typescript
async function fetchWbs(projectId: string) {
  loading.value = true
  error.value = null
  try {
    // ❌ 문제: API 응답을 WbsNode[] 배열로 기대
    const data = await $fetch<WbsNode[]>(`/api/projects/${projectId}/wbs`)
    tree.value = data
    flatNodes.value = flattenTree(data)
    // ❌ data.forEach 호출 시 "nodes is not iterable" 에러 발생
    data.forEach(node => expandedNodes.value.add(node.id))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch WBS'
    throw e
  } finally {
    loading.value = false
  }
}
```

### 2.3 API 응답 형식
```typescript
// server/api/projects/[id]/wbs.get.ts
export default defineEventHandler(async (event): Promise<{
  metadata: WbsMetadata;
  tree: WbsNode[];
}> => {
  // ...
  return result;  // { metadata, tree } 객체 반환
});
```

### 2.4 불일치 요약
| 구분 | Store 기대값 | API 실제 응답 |
|------|-------------|---------------|
| 타입 | `WbsNode[]` | `{ metadata: WbsMetadata; tree: WbsNode[] }` |
| 접근 | `data` 직접 사용 | `data.tree` 사용 필요 |

---

## 3. 영향 범위 (Impact)

### 3.1 영향받는 기능
- WBS 트리 페이지 전체 동작 불가
- WBS 데이터 조회 실패
- 모든 WBS 관련 E2E 테스트 실패

### 3.2 영향받는 컴포넌트
- `WbsTreePanel.vue`
- `WbsTreeHeader.vue`
- `WbsTreeNode.vue`
- 모든 WBS 관련 composables

### 3.3 심각도
**Critical** - 핵심 기능 완전 동작 불가

---

## 4. 수정 방안 (Solution)

### 4.1 수정 코드
```typescript
async function fetchWbs(projectId: string) {
  loading.value = true
  error.value = null
  try {
    // ✅ 수정: API 응답 타입 정확히 지정
    const response = await $fetch<{ metadata: WbsMetadata; tree: WbsNode[] }>(
      `/api/projects/${projectId}/wbs`
    )
    // ✅ response.tree 사용
    tree.value = response.tree
    flatNodes.value = flattenTree(response.tree)
    response.tree.forEach(node => expandedNodes.value.add(node.id))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch WBS'
    throw e
  } finally {
    loading.value = false
  }
}
```

### 4.2 추가 타입 import
```typescript
import type { WbsNode, WbsMetadata } from '~/types/store'
```

---

## 5. 검증 계획 (Verification)

### 5.1 단위 테스트
- [ ] wbs store fetchWbs 함수 테스트 추가/수정

### 5.2 E2E 테스트
- [ ] TSK-04-03 E2E 테스트 재실행 (9개 테스트 통과 확인)

### 5.3 수동 테스트
- [ ] WBS 페이지 정상 로드 확인
- [ ] 트리 데이터 표시 확인
- [ ] 펼치기/접기 동작 확인

---

## 6. 관련 문서

- TSK-04-03: 070-e2e-test-results.md (버그 발견)
- TSK-01-01-03: Pinia 상태 관리 설정 (원본 구현)
- TSK-03-02: WBS API 구현
