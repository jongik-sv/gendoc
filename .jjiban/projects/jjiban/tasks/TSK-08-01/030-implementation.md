# 구현 문서 (030-implementation.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**: TSK-08-01 (WbsTreePanel + NodeIcon Migration) 구현 결과 문서화
>
> **상세설계 참조**: `020-detail-design.md`
> **설계리뷰 참조**: `021-design-review-claude-1.md`

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-01 |
| Task명 | WbsTreePanel PrimeVue Tree Migration |
| Category | development |
| 상태 | [im] 구현 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 구현 요약

### 1.1 구현 범위

| 구현 항목 | 파일 | 변경 유형 |
|----------|------|----------|
| WbsTreePanel PrimeVue Tree 마이그레이션 | `app/components/wbs/WbsTreePanel.vue` | 전면 재작성 |
| NodeIcon CSS 클래스 중앙화 | `app/components/wbs/NodeIcon.vue` | 수정 |
| PrimeVue Tree 스타일 및 노드 아이콘 클래스 | `app/assets/css/main.css` | 추가 |

### 1.2 설계리뷰 반영 사항

| Issue ID | 내용 | 반영 상태 |
|----------|------|----------|
| IMP-01 | `convertToTreeNodes`에 순환 참조 감지 추가 | ✅ 완료 |
| IMP-02 | projectId 미존재 시 사용자 안내 UI 추가 | ✅ 완료 |
| IMP-03 | 성능 제약조건 명확화 | 📝 문서 참조 |

---

## 2. 파일별 변경 상세

### 2.1 WbsTreePanel.vue

#### 주요 변경점

1. **커스텀 트리 렌더링 → PrimeVue Tree 컴포넌트로 교체**
   - `v-for` 재귀 렌더링 제거
   - `<Tree>` 컴포넌트로 대체
   - `v-model:expandedKeys` 기반 펼침/접힘 상태 관리

2. **데이터 변환 함수 구현**
   - `convertToTreeNodes(nodes, visited)`: WbsNode[] → TreeNode[] 변환
   - 순환 참조 감지 로직 포함 (설계리뷰 IMP-01)

3. **상태 동기화 로직**
   - `expandedKeys` computed: Set<string> ↔ Record<string, boolean> 양방향 변환
   - `updateExpandedKeys`: PrimeVue Tree 이벤트 → wbsStore 동기화

4. **projectId 미존재 상태 추가 (설계리뷰 IMP-02)**
   - 새로운 UI 상태: `data-testid="no-project-state"`
   - 프로젝트 목록으로 이동 버튼 제공

#### 핵심 함수

```typescript
// WbsNode[] → TreeNode[] 변환 (순환 참조 감지 포함)
function convertToTreeNodes(nodes: WbsNode[], visited = new Set<string>()): TreeNode[]

// Set<string> ↔ Record<string, boolean> 양방향 변환
const expandedKeys = computed({
  get: () => { /* Set → Record 변환 */ },
  set: (newKeys) => { /* Record → Set 동기화 */ }
})

// PrimeVue Tree 이벤트 핸들러
function updateExpandedKeys(node: TreeNode)
function handleNodeClick(nodeId: string)
```

### 2.2 NodeIcon.vue

#### 변경 전

```vue
<div
  class="node-icon"
  :class="`node-icon-${type}`"
  :style="{ backgroundColor: iconColor }"  <!-- 인라인 스타일 -->
>
```

#### 변경 후

```vue
<div
  class="node-icon"
  :class="`node-icon-${type}`"  <!-- CSS 클래스만 사용 -->
>
```

#### 제거된 코드

- `iconColor` computed 속성 제거
- `<style scoped>` 블록 제거 (main.css로 이전)
- HEX 색상 하드코딩 제거

### 2.3 main.css

#### 추가된 클래스

**NodeIcon 스타일 (CSS 클래스 중앙화)**

```css
.node-icon { /* 기본 스타일: 24x24, 라운드, 흰색 텍스트 */ }
.node-icon-project { @apply bg-level-project; }
.node-icon-wp { @apply bg-level-wp; }
.node-icon-act { @apply bg-level-act; }
.node-icon-task { @apply bg-level-task; }
```

**PrimeVue Tree 커스텀 스타일**

```css
.wbs-tree { /* 컨테이너 */ }
.wbs-tree :deep(.p-tree-node-content) { /* 노드 기본 */ }
.wbs-tree :deep(.p-tree-node-content:hover) { /* 호버 */ }
.wbs-tree :deep(.p-tree-node-content.p-tree-node-selected) { /* 선택 */ }
.wbs-tree :deep(.p-tree-node-toggle-button) { /* 토글 버튼 */ }
.wbs-tree :deep(.p-tree-node-children) { /* 자식 들여쓰기 */ }
.wbs-tree-node-label { /* 노드 라벨 컨테이너 */ }
.wbs-tree-node-title { /* 노드 제목 */ }
.wbs-tree-node-title-wp/act/task { /* 타입별 텍스트 색상 */ }
.wbs-tree-node-progress { /* 진행률 표시 */ }
```

---

## 3. 구현 체크리스트 완료 상태

### Frontend (020-detail-design.md 섹션 12)

- [x] convertToTreeNodes 함수 구현
- [x] expandedKeys computed 속성 구현
- [x] updateExpandedKeys 이벤트 핸들러
- [x] handleNodeClick 이벤트 핸들러
- [x] PrimeVue Tree 통합 (template)
- [x] 커스텀 노드 템플릿 (NodeIcon + StatusBadge)
- [x] 로딩/에러/빈 상태 유지
- [x] data-testid 속성 유지
- [x] 다크 테마 스타일 (Global CSS)

### 스타일 중앙화 (020-detail-design.md 섹션 9.7)

- [x] NodeIcon: `:style` → `:class` 변환 (HEX 제거)
- [x] main.css에 `.node-icon-*` 클래스 추가
- [x] main.css에 `.wbs-tree` PrimeVue 오버라이드 추가
- [x] 컴포넌트 내 HEX 하드코딩 제거

---

## 4. 테스트 결과

### 4.1 TypeScript 타입 체크

```bash
npm run typecheck
# WbsTreePanel.vue 관련 에러: 0개
# NodeIcon.vue 관련 에러: 0개
```

### 4.2 기존 data-testid 호환성

| data-testid | 유지 상태 |
|-------------|----------|
| `wbs-tree-panel` | ✅ 유지 |
| `loading-state` | ✅ 유지 |
| `error-state` | ✅ 유지 |
| `content-state` | ✅ 유지 |
| `wbs-tree` | ✅ 유지 |
| `empty-state-no-wbs` | ✅ 유지 |
| `retry-button` | ✅ 유지 |
| `wbs-tree-node-{id}` | ✅ 유지 |
| `node-icon-{type}` | ✅ 유지 |
| `no-project-state` | 🆕 추가 (설계리뷰 IMP-02) |

---

## 5. 성능 제약조건 (설계리뷰 IMP-03)

| 노드 수 | 지원 상태 | 비고 |
|---------|----------|------|
| 100개 이하 | ✅ 정상 동작 보장 | < 200ms 렌더링 |
| 100~500개 | ⚠️ 성능 저하 가능 | 모니터링 권장 |
| 500개 이상 | ❌ 지원 안 함 | 향후 가상 스크롤링 추가 예정 |

---

## 6. 알려진 제한사항

1. **가상 스크롤링 미구현**: 대량 데이터(500+)에서 성능 저하 가능
2. **다중 선택 미지원**: 현재 단일 노드 클릭만 지원
3. **키보드 탐색**: PrimeVue Tree 기본 동작에 의존

---

## 7. 다음 단계

1. `/wf:test` - 단위 테스트 (UT-001, UT-002, UT-003)
2. `/wf:audit` - 코드 리뷰
3. `/wf:verify` - 통합 테스트 (E2E-001 ~ E2E-006)
4. `/wf:done` - 완료 및 매뉴얼 작성

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 설계리뷰: `021-design-review-claude-1.md`
- 테스트 명세: `026-test-specification.md`
- 추적성 매트릭스: `025-traceability-matrix.md`

---

<!--
author: Claude Opus 4.5
implementation_date: 2025-12-16
typecheck_status: PASS (0 errors)
-->
