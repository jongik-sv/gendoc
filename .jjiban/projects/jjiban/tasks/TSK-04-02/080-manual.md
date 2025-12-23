# 사용자 매뉴얼 (080-manual.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**
> * WBS Tree Node 컴포넌트 사용 가이드
> * 개발자 및 사용자를 위한 참조 문서

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-02 |
| Task명 | Tree Node |
| 작성일 | 2025-12-15 |
| 버전 | 1.0.0 |

---

## 1. 개요

WBS Tree Node 컴포넌트들은 WBS 트리 구조에서 개별 노드를 렌더링하는 재사용 가능한 UI 컴포넌트 시스템입니다.

### 1.1 주요 기능

- 재귀 렌더링으로 무한 깊이 트리 지원
- 계층별 시각적 구분 (아이콘, 색상, 들여쓰기)
- 상태/카테고리 배지 표시
- 진행률 시각화

---

## 2. 컴포넌트 구성

### 2.1 WbsTreeNode

**역할**: 재귀 렌더링 컨테이너

**파일**: `app/components/wbs/WbsTreeNode.vue`

**Props**:
| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| node | WbsNode | Y | - | WBS 노드 데이터 |
| depth | number | N | 0 | 트리 깊이 |

**기능**:
- 재귀적 자식 노드 렌더링
- 들여쓰기: `depth × 20px` (최대 200px)
- 펼침/접기 버튼 (children 있을 때만)
- 선택 상태 시각화
- 재귀 깊이 제한 (MAX_DEPTH = 10)

**사용 예**:
```vue
<WbsTreeNode :node="rootNode" :depth="0" />
```

### 2.2 NodeIcon

**역할**: 계층별 아이콘 배지

**파일**: `app/components/wbs/NodeIcon.vue`

**Props**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| type | WbsNodeType | Y | 계층 타입 |

**계층별 색상**:
| 타입 | 색상 | 아이콘 |
|------|------|--------|
| project | Indigo (#6366f1) | pi-folder |
| wp | Blue (#3b82f6) | pi-briefcase |
| act | Green (#22c55e) | pi-list |
| task | Amber (#f59e0b) | pi-file |

**사용 예**:
```vue
<NodeIcon type="wp" />
```

### 2.3 StatusBadge

**역할**: 상태 표시 배지

**파일**: `app/components/wbs/StatusBadge.vue`

**Props**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| status | string | Y | 상태 문자열 (예: "basic-design [bd]") |

**상태 매핑**:
| 코드 | 레이블 | Severity |
|------|--------|----------|
| [ ] | Todo | secondary |
| [bd] | Design | info |
| [dd] | Detail | info |
| [an] | Analysis | info |
| [ds] | Planning | info |
| [im] | Implement | warn |
| [fx] | Fix | warn |
| [vf] | Verify | warn |
| [xx] | Done | success |

**사용 예**:
```vue
<StatusBadge status="implement [im]" />
```

### 2.4 CategoryTag

**역할**: 카테고리 태그

**파일**: `app/components/wbs/CategoryTag.vue`

**Props**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| category | TaskCategory | Y | 카테고리 |

**카테고리 매핑**:
| 카테고리 | 레이블 | 아이콘 | 색상 |
|----------|--------|--------|------|
| development | Dev | pi-code | Blue (#3b82f6) |
| defect | Bug | pi-exclamation-triangle | Red (#ef4444) |
| infrastructure | Infra | pi-server | Green (#22c55e) |

**사용 예**:
```vue
<CategoryTag category="development" />
```

### 2.5 ProgressBar

**역할**: 진행률 시각화

**파일**: `app/components/wbs/ProgressBar.vue`

**Props**:
| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| value | number | Y | - | 진행률 (0-100) |
| showValue | boolean | N | true | 값 표시 여부 |

**구간별 색상**:
| 범위 | 색상 | 의미 |
|------|------|------|
| 0-29% | Red (#ef4444) | 시작 단계 |
| 30-69% | Amber (#f59e0b) | 진행 중 |
| 70-100% | Green (#22c55e) | 마무리 |

**사용 예**:
```vue
<ProgressBar :value="65" />
<ProgressBar :value="100" :show-value="false" />
```

---

## 3. 접근성

### 3.1 ARIA 속성

**WbsTreeNode**:
- `role="treeitem"`: 트리 아이템 역할
- `aria-expanded`: 펼침 상태
- `aria-selected`: 선택 상태
- `aria-level`: 트리 깊이

**ProgressBar**:
- `role="progressbar"`: 진행률 바 역할
- `aria-valuenow`: 현재 값
- `aria-valuemin="0"`: 최소값
- `aria-valuemax="100"`: 최대값

### 3.2 키보드 지원

키보드 네비게이션은 TSK-04-03에서 구현됩니다.

---

## 4. 테스트 ID

| 컴포넌트 | data-testid |
|----------|-------------|
| WbsTreeNode | `wbs-tree-node-{id}` |
| NodeIcon | `node-icon-{type}` |
| StatusBadge | `status-badge-{code}` |
| CategoryTag | `category-tag-{category}` |
| ProgressBar | `progress-bar-{value}` |
| 펼침/접기 버튼 | `expand-button-{id}` |
| 노드 제목 | `node-title-{id}` |

---

## 5. 의존성

### 5.1 필수 패키지

- PrimeVue 4.x (Tag, ProgressBar, Button)
- Pinia (wbs, selection 스토어)
- TailwindCSS

### 5.2 관련 Task

- TSK-04-01: WbsTreePanel (컨테이너)
- TSK-04-03: Tree Interaction (인터랙션 로직)
- TSK-02-02-01: WBS 파서 (데이터 구조)

---

## 6. 타입 정의

```typescript
// types/index.ts

type WbsNodeType = 'project' | 'wp' | 'act' | 'task'
type TaskCategory = 'development' | 'defect' | 'infrastructure'
type TaskStatus = '[ ]' | '[bd]' | '[dd]' | '[an]' | '[ds]' | '[im]' | '[fx]' | '[vf]' | '[xx]'

interface WbsNode {
  id: string
  type: WbsNodeType
  title: string
  status?: string
  category?: TaskCategory
  progress?: number
  children: WbsNode[]
}
```

---

## 7. 테스트

### 7.1 단위 테스트 실행

```bash
npm test -- tests/unit/components/wbs
```

### 7.2 테스트 결과

- 총 36개 테스트, 100% 통과
- 요구사항 커버리지: 100% (FR 8/8, VR 5/5)

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2025-12-15 | 초기 릴리스 |

---

<!--
author: Claude
Template Version: 1.0.0
Created: 2025-12-15
-->
