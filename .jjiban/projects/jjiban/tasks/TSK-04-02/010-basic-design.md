# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-02 |
| Task명 | Tree Node |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Requirements Analyst) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2.2, 10.1 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-04-02 |
| 의존 Task | TSK-04-01 (Tree Panel) | 패널 구조 및 데이터 흐름 |
| 타입 정의 | `types/index.ts` | WbsNode, TaskCategory, TaskStatus |

---

## 1. 목적 및 범위

### 1.1 목적

WBS 트리 뷰에서 개별 노드를 시각적으로 표현하는 컴포넌트 시스템을 설계합니다. 사용자가 계층 구조, 상태, 카테고리, 진행률 등 Task의 핵심 정보를 한눈에 파악할 수 있는 재사용 가능하고 확장 가능한 UI 컴포넌트를 제공합니다.

**해결하는 문제**:
- WBS 계층 구조를 재귀적으로 렌더링하여 무한 깊이 지원
- 계층별 시각적 차별화 (아이콘, 색상, 들여쓰기)
- 상태와 카테고리 정보를 직관적으로 표시
- 진행률을 시각적 바로 표현

**제공하는 가치**:
- 일관된 트리 노드 UI/UX
- 효율적인 재귀 렌더링
- 시각적 정보 밀도 최적화
- 접근성 및 상호작용 지원

### 1.2 범위

**포함 범위**:
- WbsTreeNode: 재귀 렌더링 컨테이너 (계층별 들여쓰기, 펼침/접기, 선택 상태)
- NodeIcon: 계층별 아이콘 배지 (라운드 사각형, 색상, 아이콘)
- StatusBadge: 상태 표시 (상태 코드 → 레이블 매핑, 색상)
- CategoryTag: 카테고리 표시 (아이콘, 색상, 레이블)
- ProgressBar: 진행률 시각화 (퍼센트 바, 색상 구분)

**제외 범위**:
- 트리 인터랙션 로직 (선택, 펼침/접기) → TSK-04-03
- 트리 데이터 로드 및 상태 관리 → TSK-04-01
- 노드 편집 기능 → WP-05
- 검색 필터링 하이라이트 → TSK-04-01 (향후 구현)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WbsTreeNode 재귀 렌더링 (children 자동 처리) | Critical | 섹션 6.2.2 |
| FR-002 | 계층별 들여쓰기 (depth × 20px) | High | 섹션 6.2.2 |
| FR-003 | 펼침/접기 아이콘 표시 (children이 있을 때만) | High | 섹션 6.2.2 |
| FR-004 | 계층별 NodeIcon 표시 (project/wp/act/task) | Critical | 섹션 10.1 |
| FR-005 | StatusBadge 표시 (상태 코드 → 레이블, 색상) | Critical | 섹션 6.2.2 |
| FR-006 | CategoryTag 표시 (development/defect/infrastructure) | High | 섹션 6.2.2 |
| FR-007 | ProgressBar 표시 (0-100%, 색상 구분) | Medium | 섹션 6.2.2 |
| FR-008 | 선택 상태 시각화 (배경색 변경, 강조) | High | 섹션 6.2.2 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 재귀 렌더링 성능 | < 1000 노드에서 < 200ms |
| NFR-002 | 컴포넌트 재사용성 | 독립적 Props 인터페이스 |
| NFR-003 | 접근성 | ARIA 속성, 시맨틱 HTML |
| NFR-004 | 시각적 일관성 | PrimeVue 테마 적용 |
| NFR-005 | 반응형 디자인 | 최소 너비 300px 지원 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌──────────────────────────────────────────────┐
│         WbsTreeNode (Recursive)              │
│  ┌────────────────────────────────────────┐  │
│  │  [Indent] [Expand] [Icon] [Content]   │  │
│  │  ↓        ↓        ↓      ↓            │  │
│  │  padding  toggle   NodeIcon             │  │
│  │                    Component            │  │
│  │                                         │  │
│  │  [Title]                                │  │
│  │  [StatusBadge] [CategoryTag]           │  │
│  │  [ProgressBar]                          │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  WbsTreeNode (child 1) - Recursive     │  │ ← 재귀
│  │    WbsTreeNode (grandchild) - Recursive│  │ ← 재귀
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  WbsTreeNode (child 2) - Recursive     │  │ ← 재귀
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**컴포지션 패턴**:
- **WbsTreeNode**: 재귀 컨테이너 (구조, 레이아웃, 자식 렌더링)
- **NodeIcon, StatusBadge, CategoryTag, ProgressBar**: 프레젠테이션 컴포넌트 (독립적 UI)

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| WbsTreeNode | 재귀 컨테이너 | - 노드 렌더링<br>- 자식 노드 재귀 호출<br>- 들여쓰기 관리<br>- 펼침/접기 UI |
| NodeIcon | 계층 아이콘 | - 계층별 아이콘 표시<br>- 색상 매핑<br>- 라운드 배지 스타일 |
| StatusBadge | 상태 배지 | - 상태 코드 → 레이블 변환<br>- 상태별 색상 적용 |
| CategoryTag | 카테고리 태그 | - 카테고리별 아이콘<br>- 색상 및 레이블 표시 |
| ProgressBar | 진행률 바 | - 0-100% 시각화<br>- 구간별 색상 (0-30%, 30-70%, 70-100%) |

### 3.3 데이터 흐름

```
┌─────────────────┐
│  WbsTreePanel   │
│  (TSK-04-01)    │
└────────┬────────┘
         │
         ▼
┌───────────────────────┐
│  Pinia Store          │
│  - root: WbsNode      │
│  - expandedNodes      │
│  - selectedNode       │
└────────┬──────────────┘
         │
         ▼
┌────────────────────────────────┐
│  WbsTreeNode (Recursive)       │
│  Props: node, depth            │
├────────────────────────────────┤
│  Computed:                     │
│  - isExpanded (from store)     │
│  - isSelected (from store)     │
│  - hasChildren (node.children) │
└────────┬───────────────────────┘
         │
         ├───→ NodeIcon (node.type)
         ├───→ StatusBadge (node.status)
         ├───→ CategoryTag (node.category)
         ├───→ ProgressBar (node.progress)
         │
         └───→ WbsTreeNode[] (재귀, children)
```

**Props 전달**:
```
WbsTreePanel → WbsTreeNode(node, depth=0)
             → WbsTreeNode(child1, depth=1)
                → WbsTreeNode(grandchild, depth=2)
```

---

## 4. 컴포넌트 상세 설계

### 4.1 WbsTreeNode (재귀 컨테이너)

**파일 경로**: `app/components/wbs/WbsTreeNode.vue`

**책임**:
- WbsNode 데이터를 UI로 렌더링
- 자식 노드를 재귀적으로 렌더링
- 계층 깊이에 따른 들여쓰기 적용
- 펼침/접기 토글 아이콘 표시
- 선택 상태 시각화

**Props**:
```typescript
interface Props {
  node: WbsNode;        // 렌더링할 노드
  depth?: number;       // 현재 깊이 (기본값: 0)
}
```

**Emits**: 없음 (스토어 직접 사용)

**주요 Computed**:
```typescript
const wbsStore = useWbsStore()
const selectionStore = useSelectionStore()

const isExpanded = computed(() => wbsStore.isExpanded(props.node.id))
const isSelected = computed(() => selectionStore.selectedNode?.id === props.node.id)
const hasChildren = computed(() => props.node.children.length > 0)
const indentWidth = computed(() => (props.depth ?? 0) * 20) // px
```

**템플릿 구조**:
```vue
<div
  class="wbs-tree-node"
  :class="{ 'selected': isSelected }"
  :style="{ paddingLeft: `${indentWidth}px` }"
>
  <!-- 펼침/접기 아이콘 -->
  <Button
    v-if="hasChildren"
    :icon="isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
    text
    rounded
    size="small"
    @click="toggleExpand"
  />
  <span v-else class="expand-placeholder" />

  <!-- 노드 아이콘 -->
  <NodeIcon :type="node.type" />

  <!-- 노드 콘텐츠 -->
  <div class="node-content" @click="selectNode">
    <div class="node-title">{{ node.title }}</div>
    <div class="node-meta">
      <StatusBadge v-if="node.status" :status="node.status" />
      <CategoryTag v-if="node.category" :category="node.category" />
    </div>
    <ProgressBar
      v-if="node.progress !== undefined"
      :value="node.progress"
    />
  </div>

  <!-- 재귀: 자식 노드 렌더링 -->
  <template v-if="isExpanded && hasChildren">
    <WbsTreeNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :depth="(depth ?? 0) + 1"
    />
  </template>
</div>
```

**주요 메서드**:
```typescript
const toggleExpand = () => {
  wbsStore.toggleExpand(props.node.id)
}

const selectNode = () => {
  selectionStore.selectNode(props.node)
}
```

**스타일링**:
- 선택 상태: `background-color: var(--surface-100)`
- Hover 상태: `background-color: var(--surface-50)`
- 트랜지션: `transition: background-color 0.2s`

---

### 4.2 NodeIcon (계층 아이콘)

**파일 경로**: `app/components/wbs/NodeIcon.vue`

**책임**:
- 계층 타입별 아이콘 표시 (project/wp/act/task)
- 라운드 사각형 배지 스타일
- 색상 매핑

**Props**:
```typescript
interface Props {
  type: WbsNodeType; // 'project' | 'wp' | 'act' | 'task'
}
```

**Emits**: 없음

**계층별 아이콘 매핑**:

| Type | 아이콘 | 색상 | 레이블 |
|------|--------|------|--------|
| project | `pi-folder` | `#6366f1` (indigo-500) | P |
| wp | `pi-briefcase` | `#3b82f6` (blue-500) | WP |
| act | `pi-list` | `#10b981` (green-500) | ACT |
| task | `pi-check-square` | `#f59e0b` (amber-500) | TSK |

**템플릿 구조**:
```vue
<div
  class="node-icon"
  :class="`node-icon-${type}`"
  :style="{ backgroundColor: iconColor }"
>
  <i :class="`pi ${iconClass}`" />
</div>
```

**Computed 속성**:
```typescript
const iconConfig = computed(() => {
  const configs = {
    project: { icon: 'pi-folder', color: '#6366f1', label: 'P' },
    wp: { icon: 'pi-briefcase', color: '#3b82f6', label: 'WP' },
    act: { icon: 'pi-list', color: '#10b981', label: 'ACT' },
    task: { icon: 'pi-check-square', color: '#f59e0b', label: 'TSK' },
  }
  return configs[props.type]
})

const iconClass = computed(() => iconConfig.value.icon)
const iconColor = computed(() => iconConfig.value.color)
```

**스타일링**:
- 크기: `24px × 24px`
- 형태: `border-radius: 4px` (라운드 사각형)
- 패딩: `4px`
- 아이콘 색상: `white`

---

### 4.3 StatusBadge (상태 배지)

**파일 경로**: `app/components/wbs/StatusBadge.vue`

**책임**:
- 상태 코드 → 레이블 변환
- 상태별 색상 적용
- 컴팩트한 배지 UI

**Props**:
```typescript
interface Props {
  status: string; // 예: "basic-design [bd]" 또는 "[bd]"
}
```

**Emits**: 없음

**상태 코드 매핑**:

| 상태 코드 | 레이블 | 색상 | Column |
|-----------|--------|------|--------|
| `[ ]` | Todo | `#6b7280` (gray-500) | Todo |
| `[bd]` | Design | `#3b82f6` (blue-500) | Design |
| `[dd]` | Detail | `#8b5cf6` (violet-500) | Detail |
| `[an]` | Analyze | `#8b5cf6` (violet-500) | Detail |
| `[ds]` | Design | `#8b5cf6` (violet-500) | Detail |
| `[im]` | Implement | `#f59e0b` (amber-500) | Implement |
| `[fx]` | Fix | `#f59e0b` (amber-500) | Implement |
| `[vf]` | Verify | `#22c55e` (green-500) | Verify |
| `[xx]` | Done | `#10b981` (emerald-500) | Done |

**템플릿 구조**:
```vue
<Tag
  :value="statusLabel"
  :severity="statusSeverity"
  rounded
/>
```

**Computed 속성**:
```typescript
const statusCode = computed(() => {
  // "basic-design [bd]" → "bd"
  const match = props.status.match(/\[([^\]]+)\]/)
  return match ? match[1].trim() : props.status
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    ' ': 'Todo',
    'bd': 'Design',
    'dd': 'Detail',
    'an': 'Analyze',
    'ds': 'Design',
    'im': 'Implement',
    'fx': 'Fix',
    'vf': 'Verify',
    'xx': 'Done',
  }
  return labels[statusCode.value] || statusCode.value
})

const statusSeverity = computed(() => {
  const severities: Record<string, string> = {
    ' ': 'secondary',
    'bd': 'info',
    'dd': 'info',
    'an': 'info',
    'ds': 'info',
    'im': 'warning',
    'fx': 'warning',
    'vf': 'success',
    'xx': 'success',
  }
  return severities[statusCode.value] || 'secondary'
})
```

**PrimeVue Tag 사용**:
- `severity`: PrimeVue 내장 색상 시스템
- `rounded`: 라운드 모서리
- 크기: `small`

---

### 4.4 CategoryTag (카테고리 태그)

**파일 경로**: `app/components/wbs/CategoryTag.vue`

**책임**:
- 카테고리별 아이콘 표시
- 색상 및 레이블 표시
- 컴팩트한 태그 UI

**Props**:
```typescript
interface Props {
  category: TaskCategory; // 'development' | 'defect' | 'infrastructure'
}
```

**Emits**: 없음

**카테고리 매핑**:

| Category | 아이콘 | 색상 | 레이블 |
|----------|--------|------|--------|
| development | `pi-code` | `#3b82f6` (blue-500) | Dev |
| defect | `pi-exclamation-triangle` | `#ef4444` (red-500) | Defect |
| infrastructure | `pi-cog` | `#8b5cf6` (violet-500) | Infra |

**템플릿 구조**:
```vue
<Tag
  :value="categoryLabel"
  :icon="categoryIcon"
  :style="{ backgroundColor: categoryColor }"
  rounded
/>
```

**Computed 속성**:
```typescript
const categoryConfig = computed(() => {
  const configs: Record<TaskCategory, { icon: string; color: string; label: string }> = {
    development: { icon: 'pi-code', color: '#3b82f6', label: 'Dev' },
    defect: { icon: 'pi-exclamation-triangle', color: '#ef4444', label: 'Defect' },
    infrastructure: { icon: 'pi-cog', color: '#8b5cf6', label: 'Infra' },
  }
  return configs[props.category]
})

const categoryIcon = computed(() => `pi ${categoryConfig.value.icon}`)
const categoryColor = computed(() => categoryConfig.value.color)
const categoryLabel = computed(() => categoryConfig.value.label)
```

**스타일링**:
- PrimeVue Tag 컴포넌트 사용
- 아이콘 + 레이블 조합
- 크기: `small`

---

### 4.5 ProgressBar (진행률 바)

**파일 경로**: `app/components/wbs/ProgressBar.vue`

**책임**:
- 0-100% 진행률 시각화
- 구간별 색상 구분
- 퍼센트 텍스트 표시

**Props**:
```typescript
interface Props {
  value: number; // 0-100
  showValue?: boolean; // 기본값: true
}
```

**Emits**: 없음

**색상 구간**:

| 진행률 | 색상 | 의미 |
|--------|------|------|
| 0-30% | `#ef4444` (red-500) | 시작 단계 |
| 30-70% | `#f59e0b` (amber-500) | 진행 중 |
| 70-100% | `#22c55e` (green-500) | 거의 완료 |

**템플릿 구조**:
```vue
<ProgressBar
  :value="value"
  :show-value="showValue"
  :pt="{
    value: { style: { backgroundColor: barColor } }
  }"
/>
```

**Computed 속성**:
```typescript
const barColor = computed(() => {
  if (props.value < 30) return '#ef4444'
  if (props.value < 70) return '#f59e0b'
  return '#22c55e'
})
```

**PrimeVue ProgressBar 사용**:
- `value`: 0-100 숫자
- `show-value`: 퍼센트 텍스트 표시 여부
- Pass Through (`pt`) 활용하여 색상 커스터마이징

---

## 5. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 재귀 방식 | 1) 컴포넌트 재귀<br>2) 평면화 렌더링 | 컴포넌트 재귀 | - 계층 구조 명확<br>- Vue 재귀 공식 지원<br>- 깊이 무제한 |
| 아이콘 배지 형태 | 1) 원형<br>2) 라운드 사각형 | 라운드 사각형 | - 텍스트/아이콘 모두 수용<br>- 시각적 구분 명확<br>- PRD 10.1 요구사항 |
| 상태 표시 | 1) 커스텀 컴포넌트<br>2) PrimeVue Tag | PrimeVue Tag | - 일관된 디자인<br>- 색상 시스템 내장<br>- 접근성 지원 |
| 진행률 바 | 1) 커스텀 SVG<br>2) PrimeVue ProgressBar | PrimeVue ProgressBar | - 프로젝트 표준<br>- Pass Through로 커스터마이징<br>- 접근성 |
| 상태 관리 | 1) Local State<br>2) Pinia Store | Pinia Store | - TSK-04-03 인터랙션 연동<br>- 전역 상태 필요<br>- 이미 구현된 스토어 활용 |

---

## 6. 인터페이스 설계

### 6.1 Props/Emits 인터페이스

#### WbsTreeNode
```typescript
interface Props {
  node: WbsNode;
  depth?: number; // 기본값: 0
}
// Emits: 없음 (스토어 직접 사용)
```

#### NodeIcon
```typescript
interface Props {
  type: WbsNodeType;
}
// Emits: 없음
```

#### StatusBadge
```typescript
interface Props {
  status: string;
}
// Emits: 없음
```

#### CategoryTag
```typescript
interface Props {
  category: TaskCategory;
}
// Emits: 없음
```

#### ProgressBar
```typescript
interface Props {
  value: number; // 0-100
  showValue?: boolean; // 기본값: true
}
// Emits: 없음
```

### 6.2 타입 정의 (types/index.ts)

```typescript
// 이미 정의됨
export type WbsNodeType = 'project' | 'wp' | 'act' | 'task';
export type TaskCategory = 'development' | 'defect' | 'infrastructure';
export type TaskStatus = '[ ]' | '[bd]' | '[dd]' | '[an]' | '[ds]' | '[im]' | '[fx]' | '[vf]' | '[xx]';

export interface WbsNode {
  id: string;
  type: WbsNodeType;
  title: string;
  status?: string;
  category?: TaskCategory;
  priority?: Priority;
  progress?: number;
  children: WbsNode[];
  // ... 기타 속성
}
```

### 6.3 Pinia Store 인터페이스 (사용 부분만)

```typescript
// stores/wbs.ts (기존 구현 활용)
interface WbsStore {
  // Getters
  isExpanded: (nodeId: string) => boolean;

  // Actions
  toggleExpand: (nodeId: string) => void;
}

// stores/selection.ts (기존 구현 활용)
interface SelectionStore {
  // State
  selectedNode: WbsNode | null;

  // Actions
  selectNode: (node: WbsNode) => void;
}
```

---

## 7. 인수 기준

- [ ] AC-01: WbsTreeNode가 자식 노드를 재귀적으로 렌더링
- [ ] AC-02: 계층 깊이에 따라 들여쓰기 적용 (depth × 20px)
- [ ] AC-03: children이 있는 노드만 펼침/접기 아이콘 표시
- [ ] AC-04: NodeIcon이 계층별 아이콘과 색상을 정확히 표시
- [ ] AC-05: StatusBadge가 상태 코드를 레이블로 변환하여 표시
- [ ] AC-06: CategoryTag가 카테고리별 아이콘과 레이블 표시
- [ ] AC-07: ProgressBar가 진행률에 따라 색상 구분 (0-30%, 30-70%, 70-100%)
- [ ] AC-08: 선택된 노드가 시각적으로 강조됨 (배경색 변경)
- [ ] AC-09: 모든 컴포넌트가 PrimeVue 테마 일관성 유지
- [ ] AC-10: 재귀 렌더링이 1000 노드 환경에서 200ms 이내 완료

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 재귀 렌더링 성능 | Medium | - 가상 스크롤 (향후 고려)<br>- 현재는 < 1000 노드로 제한<br>- Vue 재귀 최적화 활용 |
| 깊은 계층 구조 UI | Low | - 최대 4단계 제한 (WBS 스펙)<br>- 들여쓰기 최대 80px (4 × 20px) |
| 상태 코드 파싱 | Medium | - 정규식 안정성 검증<br>- 기본값 처리 (Unknown) |
| PrimeVue 버전 의존성 | Low | - PrimeVue 4.x 표준<br>- Pass Through API 안정화됨 |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-04-01 | 선행 | WbsTreePanel, Pinia 스토어 필요 |
| TSK-04-03 | 후행 | 트리 인터랙션 (펼침/접기, 선택) 구현 |
| TSK-01-01-02 | 선행 | PrimeVue 설정 완료 필요 |
| types/index.ts | 기존 구현 | WbsNode, TaskCategory, TaskStatus 타입 |
| stores/wbs.ts | 기존 구현 | isExpanded, toggleExpand |
| stores/selection.ts | 기존 구현 | selectedNode, selectNode |

---

## 9. 다음 단계

### 9.1 상세설계 단계 (/wf:draft)
- 컴포넌트별 스타일 가이드 (TailwindCSS 클래스)
- 접근성 속성 세부 정의 (ARIA labels, roles)
- 애니메이션 및 트랜지션 상세
- 단위 테스트 시나리오 작성

### 9.2 구현 단계 (/wf:build)
- 5개 컴포넌트 Vue 파일 작성
- PrimeVue 컴포넌트 통합 (Tag, ProgressBar, Button)
- TailwindCSS 스타일링
- 재귀 렌더링 최적화

### 9.3 검증 단계 (/wf:verify)
- 단위 테스트 (컴포넌트별 Props 검증)
- E2E 테스트 (재귀 렌더링, 시각적 표시)
- 성능 테스트 (1000 노드 렌더링 시간)
- 접근성 검증 (ARIA, 키보드 네비게이션)

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.2.2, 10.1)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-02)
- 상세설계: `020-detail-design.md` (다음 단계)
- 의존 Task:
  - TSK-04-01: `.jjiban/projects/jjiban/tasks/TSK-04-01/010-basic-design.md`
- 타입 정의: `types/index.ts`
- Pinia 스토어: `stores/wbs.ts`, `stores/selection.ts`
- 설정: `server/utils/settings/defaults.ts` (카테고리, 상태 매핑)

---

<!--
author: Claude (Requirements Analyst)
Template Version: 1.0.0
Created: 2025-12-15
-->
