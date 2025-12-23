# 사용자 매뉴얼 (080-manual.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**: TSK-08-01 (WbsTreePanel + NodeIcon Migration) 사용자 및 개발자 매뉴얼

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-01 |
| Task명 | WbsTreePanel PrimeVue Tree Migration |
| Category | development |
| 상태 | [xx] 완료 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 개요

### 1.1 변경 요약

WbsTreePanel 컴포넌트의 커스텀 트리 렌더링을 **PrimeVue Tree 컴포넌트**로 교체했습니다.

| 변경 전 | 변경 후 |
|---------|---------|
| 커스텀 `v-for` 재귀 렌더링 | PrimeVue `<Tree>` 컴포넌트 |
| HEX 색상 하드코딩 (`NodeIcon`) | CSS 클래스 중앙화 (`main.css`) |
| 개별 확장 상태 관리 | `v-model:expandedKeys` 통합 관리 |

### 1.2 영향 범위

| 파일 | 변경 유형 |
|------|----------|
| `app/components/wbs/WbsTreePanel.vue` | 전면 재작성 |
| `app/components/wbs/NodeIcon.vue` | 스타일 분리 |
| `app/assets/css/main.css` | 클래스 추가 |

---

## 2. 주요 기능

### 2.1 PrimeVue Tree 통합

WBS 트리가 PrimeVue Tree 컴포넌트 기반으로 렌더링됩니다.

```vue
<Tree
  v-model:expandedKeys="expandedKeys"
  :value="treeNodes"
  @node-expand="updateExpandedKeys"
  @node-collapse="updateExpandedKeys"
>
  <template #default="{ node }">
    <!-- 커스텀 노드 템플릿 -->
  </template>
</Tree>
```

### 2.2 노드 타입별 표시

| 노드 타입 | 아이콘 | 색상 클래스 |
|----------|--------|------------|
| Project (PRJ) | PRJ | `.node-icon-project` (Blue-600) |
| Work Package (WP) | WP | `.node-icon-wp` (Emerald-500) |
| Activity (ACT) | ACT | `.node-icon-act` (Amber-500) |
| Task (TSK) | TSK | `.node-icon-task` (Purple-500) |

### 2.3 상태 표시

각 노드에 StatusBadge 컴포넌트로 작업 상태가 표시됩니다:

| 상태 | 표시 |
|------|------|
| `[ ]` | Todo |
| `[bd]` | 기본설계 |
| `[dd]` | 상세설계 |
| `[im]` | 구현 |
| `[vf]` | 테스트 |
| `[xx]` | 완료 |

### 2.4 펼침/접힘 상태 관리

- **자동 동기화**: PrimeVue Tree ↔ wbsStore.expandedNodes
- **전체 펼치기/접기**: WbsTreeHeader의 버튼으로 제어
- **LocalStorage 저장**: 브라우저 새로고침 후에도 상태 유지

---

## 3. 사용 방법

### 3.1 기본 사용

WBS 페이지(`/wbs?project={projectId}`)에서 자동으로 트리가 로드됩니다.

**노드 조작:**
- **클릭**: 노드 선택 → 상세 패널에 정보 표시
- **토글 버튼 클릭**: 하위 노드 펼치기/접기
- **더블 클릭**: 없음 (향후 인라인 편집 예정)

### 3.2 키보드 탐색

PrimeVue Tree의 기본 키보드 탐색을 지원합니다:

| 키 | 동작 |
|----|------|
| `↑` / `↓` | 이전/다음 노드로 이동 |
| `→` | 노드 펼치기 또는 자식으로 이동 |
| `←` | 노드 접기 또는 부모로 이동 |
| `Enter` | 노드 선택 |

### 3.3 상태별 UI

| 상태 | 표시 내용 | data-testid |
|------|----------|-------------|
| 로딩 중 | 스피너 + "로딩 중" | `loading-state` |
| 에러 | 에러 메시지 + 재시도 버튼 | `error-state`, `retry-button` |
| 빈 데이터 | "WBS 데이터가 없습니다" | `empty-state-no-wbs` |
| 프로젝트 미선택 | "프로젝트 선택 안내" | `no-project-state` |

---

## 4. 개발자 가이드

### 4.1 데이터 변환

WbsNode[]를 PrimeVue TreeNode[]로 변환하는 함수:

```typescript
function convertToTreeNodes(nodes: WbsNode[], visited = new Set<string>()): TreeNode[] {
  return nodes.map(node => {
    if (visited.has(node.id)) {
      console.warn(`Circular reference detected: ${node.id}`);
      return { key: node.id, label: node.title, data: { node }, children: [] };
    }
    visited.add(node.id);
    return {
      key: node.id,
      label: node.title,
      data: { node },
      children: node.children ? convertToTreeNodes(node.children, visited) : []
    };
  });
}
```

### 4.2 확장 상태 동기화

```typescript
// Set<string> ↔ Record<string, boolean> 양방향 변환
const expandedKeys = computed({
  get: () => {
    const keys: Record<string, boolean> = {};
    wbsStore.expandedNodes.forEach(key => { keys[key] = true; });
    return keys;
  },
  set: (newKeys: Record<string, boolean>) => {
    Object.entries(newKeys).forEach(([key, expanded]) => {
      if (expanded) wbsStore.expandedNodes.add(key);
      else wbsStore.expandedNodes.delete(key);
    });
  }
});
```

### 4.3 CSS 클래스 구조

**NodeIcon 클래스 (`main.css`):**

```css
.node-icon { @apply w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white; }
.node-icon-project { @apply bg-level-project; }  /* Blue-600 */
.node-icon-wp { @apply bg-level-wp; }            /* Emerald-500 */
.node-icon-act { @apply bg-level-act; }          /* Amber-500 */
.node-icon-task { @apply bg-level-task; }        /* Purple-500 */
```

**PrimeVue Tree 오버라이드:**

```css
.wbs-tree :deep(.p-tree-node-content) { @apply rounded transition-colors cursor-pointer; }
.wbs-tree :deep(.p-tree-node-content:hover) { @apply bg-slate-700/50; }
.wbs-tree :deep(.p-tree-node-content.p-tree-node-selected) { @apply bg-blue-600/30; }
```

### 4.4 테스트 작성

**단위 테스트 예시:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import WbsTreePanel from '~/components/wbs/WbsTreePanel.vue';

describe('WbsTreePanel', () => {
  it('WbsNode[]를 TreeNode[]로 변환한다', () => {
    const nodes = [{ id: 'WP-01', title: 'Test', type: 'wp', children: [] }];
    const treeNodes = convertToTreeNodes(nodes);
    expect(treeNodes[0].key).toBe('WP-01');
    expect(treeNodes[0].data.node).toEqual(nodes[0]);
  });
});
```

---

## 5. 성능 고려사항

### 5.1 노드 수 제한

| 노드 수 | 지원 상태 | 권장 조치 |
|---------|----------|----------|
| 100개 이하 | ✅ 정상 | 제약 없음 |
| 100~500개 | ⚠️ 주의 | 성능 모니터링 |
| 500개 이상 | ❌ 미지원 | 데이터 분할 또는 가상 스크롤링 필요 |

### 5.2 렌더링 최적화

- `treeNodes`는 `computed`로 캐싱됨
- 펼침 상태 변경 시만 해당 서브트리 재렌더링
- 순환 참조 감지로 무한 루프 방지

---

## 6. 문제 해결

### 6.1 자주 발생하는 문제

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 트리가 표시되지 않음 | projectId 미전달 | URL에 `?project=jjiban` 추가 |
| 펼침 상태가 초기화됨 | localStorage 삭제 | 브라우저 캐시 확인 |
| 노드 색상이 없음 | main.css 미로드 | Tailwind 빌드 확인 |
| 순환 참조 경고 | WBS 데이터 오류 | wbs.md 파일 검증 |

### 6.2 디버깅

**콘솔 확인:**
```javascript
// expandedKeys 상태 확인
console.log(wbsStore.expandedNodes);

// TreeNode 변환 결과 확인
console.log(treeNodes.value);
```

---

## 7. 관련 문서

| 문서 | 경로 |
|------|------|
| 기본설계 | `010-basic-design.md` |
| 상세설계 | `020-detail-design.md` |
| 구현 문서 | `030-implementation.md` |
| 통합테스트 | `070-integration-test.md` |
| PrimeVue Tree 문서 | https://primevue.org/tree |

---

## 8. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-16 | Claude Opus 4.5 | 최초 작성 |

---

<!--
author: Claude Opus 4.5
created: 2025-12-16
task_status: completed
-->
