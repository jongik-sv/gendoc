# 테스트 명세서 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: 단위 테스트, E2E 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:verify` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-02 |
| Task명 | Tree Node |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (System Architect) |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | 컴포넌트 Props/Computed 로직 | 85% 이상 |
| E2E 테스트 | 노드 시각화, 재귀 렌더링, 인터랙션 | 100% 시나리오 커버 |
| 접근성 테스트 | ARIA 속성, 키보드 네비게이션 | 주요 패턴 커버 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest |
| 테스트 유틸리티 | @vue/test-utils |
| 테스트 프레임워크 (E2E) | Playwright |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |
| 테스트 프로젝트 | `.jjiban/projects/project` (테스트 전용) |

---

## 2. 단위 테스트 시나리오

### 2.1 WbsTreeNode 컴포넌트

#### UT-001: 재귀 렌더링 검증

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/WbsTreeNode.spec.ts` |
| **테스트 블록** | `describe('WbsTreeNode') → it('should render node recursively with children')` |
| **Mock 의존성** | Pinia stores (wbs, selection) |
| **입력 데이터** | 3단계 트리 (root → child → grandchild) |
| **검증 포인트** | - 루트 노드 렌더링 확인<br>- 자식 노드 개수 확인 (findAllComponents)<br>- grandchild까지 렌더링 확인 |
| **커버리지 대상** | 재귀 렌더링 로직 |
| **관련 요구사항** | FR-001 |

#### UT-002: 들여쓰기 계산 검증

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/WbsTreeNode.spec.ts` |
| **테스트 블록** | `describe('WbsTreeNode') → it('should calculate indent width correctly')` |
| **Mock 의존성** | Pinia stores |
| **입력 데이터** | `{ depth: 0 }`, `{ depth: 1 }`, `{ depth: 3 }` |
| **검증 포인트** | - depth=0: paddingLeft = 0px<br>- depth=1: paddingLeft = 20px<br>- depth=3: paddingLeft = 60px |
| **커버리지 대상** | indentWidth computed |
| **관련 요구사항** | FR-002, VR-004 |

#### UT-003: 펼침/접기 버튼 조건부 렌더링

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/WbsTreeNode.spec.ts` |
| **테스트 블록** | `describe('WbsTreeNode') → it('should show expand button only if has children')` |
| **Mock 의존성** | Pinia stores |
| **입력 데이터** | - `{ children: [] }` (자식 없음)<br>- `{ children: [child1] }` (자식 있음) |
| **검증 포인트** | - children 없음: Button 컴포넌트 없음<br>- children 있음: Button 컴포넌트 존재 |
| **커버리지 대상** | hasChildren computed, v-if 조건 |
| **관련 요구사항** | FR-003, VR-005 |

#### UT-010: 선택 상태 클래스 적용

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/WbsTreeNode.spec.ts` |
| **테스트 블록** | `describe('WbsTreeNode') → it('should apply selected class when node is selected')` |
| **Mock 의존성** | selection store mock (selectedNode 설정) |
| **입력 데이터** | `node.id === selectedNode.id` |
| **검증 포인트** | - 선택됨: .selected 클래스 존재<br>- 미선택: .selected 클래스 없음 |
| **커버리지 대상** | isSelected computed, 클래스 바인딩 |
| **관련 요구사항** | FR-008 |

---

### 2.2 NodeIcon 컴포넌트

#### UT-004: 계층별 아이콘 매핑 검증

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/NodeIcon.spec.ts` |
| **테스트 블록** | `describe('NodeIcon') → it.each(['project', 'wp', 'act', 'task'])('should display correct icon for %s')` |
| **Mock 의존성** | 없음 |
| **입력 데이터** | - `type: 'project'`<br>- `type: 'wp'`<br>- `type: 'act'`<br>- `type: 'task'` |
| **검증 포인트** | - project: pi-folder, #6366f1<br>- wp: pi-briefcase, #3b82f6<br>- act: pi-list, #10b981<br>- task: pi-check-square, #f59e0b |
| **커버리지 대상** | iconConfig computed |
| **관련 요구사항** | FR-004, VR-001 |

---

### 2.3 StatusBadge 컴포넌트

#### UT-005: 상태 코드 정상 파싱

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/StatusBadge.spec.ts` |
| **테스트 블록** | `describe('StatusBadge') → it('should parse status code correctly')` |
| **Mock 의존성** | 없음 |
| **입력 데이터** | `status: "basic-design [bd]"` |
| **검증 포인트** | - statusCode: "bd"<br>- statusLabel: "Design"<br>- statusSeverity: "info" |
| **커버리지 대상** | statusCode, statusLabel, statusSeverity computed |
| **관련 요구사항** | FR-005 |

#### UT-006: 상태 코드 파싱 실패 시 원본 표시

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/StatusBadge.spec.ts` |
| **테스트 블록** | `describe('StatusBadge') → it('should display original status if parsing fails')` |
| **Mock 의존성** | 없음 |
| **입력 데이터** | `status: "unknown-status"` (대괄호 없음) |
| **검증 포인트** | - statusLabel: "unknown-status" (원본 반환)<br>- statusSeverity: "secondary" (기본값) |
| **커버리지 대상** | 파싱 실패 처리 로직 |
| **관련 요구사항** | VR-002 |

---

### 2.4 CategoryTag 컴포넌트

#### UT-007: 카테고리 매핑 검증

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/CategoryTag.spec.ts` |
| **테스트 블록** | `describe('CategoryTag') → it.each(['development', 'defect', 'infrastructure'])('should display correct tag for %s')` |
| **Mock 의존성** | 없음 |
| **입력 데이터** | - `category: 'development'`<br>- `category: 'defect'`<br>- `category: 'infrastructure'` |
| **검증 포인트** | - development: pi-code, #3b82f6, "Dev"<br>- defect: pi-exclamation-triangle, #ef4444, "Defect"<br>- infrastructure: pi-cog, #8b5cf6, "Infra" |
| **커버리지 대상** | categoryConfig computed |
| **관련 요구사항** | FR-006 |

---

### 2.5 ProgressBar 컴포넌트

#### UT-008: 진행률 색상 매핑 검증

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/ProgressBar.spec.ts` |
| **테스트 블록** | `describe('ProgressBar') → it.each([[15, '#ef4444'], [50, '#f59e0b'], [85, '#22c55e']])('should apply correct color for %i%')` |
| **Mock 의존성** | 없음 |
| **입력 데이터** | - `value: 15` (0-30% 구간)<br>- `value: 50` (30-70% 구간)<br>- `value: 85` (70-100% 구간) |
| **검증 포인트** | - 15%: #ef4444 (빨강)<br>- 50%: #f59e0b (황색)<br>- 85%: #22c55e (초록) |
| **커버리지 대상** | barColor computed |
| **관련 요구사항** | FR-007 |

#### UT-009: 진행률 범위 경계 테스트

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/ProgressBar.spec.ts` |
| **테스트 블록** | `describe('ProgressBar') → it('should handle boundary values correctly')` |
| **Mock 의존성** | 없음 |
| **입력 데이터** | - `value: 0`<br>- `value: 30`<br>- `value: 70`<br>- `value: 100` |
| **검증 포인트** | - 0%: 빨강<br>- 30%: 황색<br>- 70%: 초록<br>- 100%: 초록 |
| **커버리지 대상** | 경계값 처리 로직 |
| **관련 요구사항** | VR-003 |

---

## 3. E2E 테스트 시나리오

### 3.1 E2E-001: 계층 구조 및 들여쓰기 시각화

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-node.spec.ts` |
| **테스트명** | `test('WBS 트리 노드가 계층 구조와 들여쓰기를 정확히 표시한다')` |
| **사전조건** | 테스트 프로젝트 생성 (4단계 트리) |
| **data-testid 셀렉터** | |
| - 트리 노드 | `[data-testid="wbs-tree-node"]` |
| - 노드별 ID | `[data-testid="wbs-tree-node-{id}"]` |
| **실행 단계** | |
| 1 | WBS 페이지 접속 (`/wbs?project=project`) |
| 2 | 루트 노드 확인 |
| 3 | 자식 노드들의 들여쓰기 측정 (getBoundingBox) |
| **검증 포인트** | - depth=0: paddingLeft ≈ 0px<br>- depth=1: paddingLeft ≈ 20px<br>- depth=2: paddingLeft ≈ 40px<br>- depth=3: paddingLeft ≈ 60px |
| **스크린샷** | `e2e-001-hierarchy-indent.png` |
| **관련 요구사항** | FR-001, FR-002, VR-004 |

---

### 3.2 E2E-002: 펼침/접기 버튼 표시 및 동작

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-node.spec.ts` |
| **테스트명** | `test('children이 있는 노드만 펼침/접기 버튼을 표시한다')` |
| **사전조건** | 테스트 프로젝트 (일부 노드는 children 있음, 일부는 없음) |
| **data-testid 셀렉터** | |
| - 펼침/접기 버튼 | `[data-testid="expand-toggle-{nodeId}"]` |
| - 트리 노드 | `[data-testid="wbs-tree-node-{id}"]` |
| **실행 단계** | |
| 1 | WBS 페이지 접속 |
| 2 | children이 있는 노드 확인 (버튼 존재) |
| 3 | children이 없는 노드 확인 (버튼 없음) |
| **검증 포인트** | - children.length > 0: Button 표시<br>- children.length === 0: Button 숨김 |
| **스크린샷** | `e2e-002-expand-button.png` |
| **관련 요구사항** | FR-003, VR-005 |

---

### 3.3 E2E-003: 아이콘, 상태, 카테고리 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-node.spec.ts` |
| **테스트명** | `test('노드 아이콘, 상태 배지, 카테고리 태그를 정확히 표시한다')` |
| **사전조건** | 다양한 계층, 상태, 카테고리를 가진 테스트 데이터 |
| **data-testid 셀렉터** | |
| - 노드 아이콘 | `[data-testid="node-icon-{nodeId}"]` |
| - 상태 배지 | `[data-testid="status-badge-{nodeId}"]` |
| - 카테고리 태그 | `[data-testid="category-tag-{nodeId}"]` |
| **실행 단계** | |
| 1 | WBS 페이지 접속 |
| 2 | Project 노드 아이콘 확인 (색상: indigo) |
| 3 | Task 노드 상태 배지 확인 (예: "Design") |
| 4 | Task 노드 카테고리 태그 확인 (예: "Dev") |
| **검증 포인트** | - NodeIcon 색상 일치<br>- StatusBadge 레이블 정확성<br>- CategoryTag 아이콘 및 레이블 일치 |
| **스크린샷** | `e2e-003-icons-badges.png` |
| **관련 요구사항** | FR-004, FR-005, FR-006, VR-001, VR-002 |

---

### 3.4 E2E-004: 진행률 바 시각화

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-node.spec.ts` |
| **테스트명** | `test('진행률 바가 구간별 색상으로 정확히 표시된다')` |
| **사전조건** | 진행률 다양한 노드 (15%, 50%, 85%) |
| **data-testid 셀렉터** | |
| - 진행률 바 | `[data-testid="progress-bar-{nodeId}"]` |
| **실행 단계** | |
| 1 | WBS 페이지 접속 |
| 2 | 진행률 15% 노드의 바 색상 확인 (빨강) |
| 3 | 진행률 50% 노드의 바 색상 확인 (황색) |
| 4 | 진행률 85% 노드의 바 색상 확인 (초록) |
| **검증 포인트** | - 색상 구간별 정확성<br>- 퍼센트 텍스트 표시 확인 |
| **스크린샷** | `e2e-004-progress-bar.png` |
| **관련 요구사항** | FR-007, VR-003 |

---

### 3.5 E2E-005: 선택 상태 시각화

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-node.spec.ts` |
| **테스트명** | `test('선택된 노드가 시각적으로 강조된다')` |
| **사전조건** | 테스트 프로젝트 |
| **data-testid 셀렉터** | |
| - 트리 노드 | `[data-testid="wbs-tree-node-{id}"]` |
| **실행 단계** | |
| 1 | WBS 페이지 접속 |
| 2 | 특정 노드 클릭 (선택) |
| 3 | 선택된 노드의 배경색 확인 |
| 4 | 다른 노드 클릭 시 이전 노드 선택 해제 확인 |
| **검증 포인트** | - selected 클래스 적용 확인<br>- 배경색 변경 확인<br>- 단일 선택 유지 |
| **스크린샷** | `e2e-005-selection-state.png` |
| **관련 요구사항** | FR-008 |

---

## 4. 접근성 테스트 시나리오

### 4.1 ARIA 속성 검증

| 테스트 ID | 테스트 항목 | 실행 단계 | 예상 결과 |
|-----------|-----------|----------|----------|
| A11Y-001 | WbsTreeNode ARIA | 노드 확인 | `role="treeitem"`, `aria-expanded`, `aria-selected`, `aria-level` 존재 |
| A11Y-002 | StatusBadge ARIA | 배지 확인 | `aria-label="Status: Design"` 존재 |
| A11Y-003 | CategoryTag ARIA | 태그 확인 | `aria-label="Category: Dev"` 존재 |
| A11Y-004 | ProgressBar ARIA | 진행률 바 확인 | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` 존재 |

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

```typescript
// Mock WbsNode 구조 (개념)
MOCK_PROJECT_NODE = {
  id: 'project-1',
  type: 'project',
  title: 'Test Project',
  children: [
    {
      id: 'WP-01',
      type: 'wp',
      title: 'Work Package 1',
      status: 'implement [im]',
      category: 'development',
      progress: 45,
      children: [
        {
          id: 'TSK-01-01',
          type: 'task',
          title: 'Task 1',
          status: 'basic-design [bd]',
          category: 'development',
          progress: 20,
          children: []
        }
      ]
    }
  ]
}

// Pinia Store Mock
mockWbsStore = {
  expandedNodes: new Set(['project-1', 'WP-01']),
  isExpanded: vi.fn((id) => mockWbsStore.expandedNodes.has(id)),
  toggleExpand: vi.fn()
}

mockSelectionStore = {
  selectedNode: null,
  isSelected: vi.fn((id) => mockSelectionStore.selectedNode?.id === id),
  selectNode: vi.fn()
}
```

### 5.2 E2E 테스트용 시드 데이터

**시드 파일**: `.jjiban/projects/project/wbs.md` (테스트 전용)

```markdown
# WBS - project (테스트 프로젝트)

> version: 1.0
> depth: 4

## WP-01: Test Work Package
- status: implement [im]
- category: development
- progress: 45%

### ACT-01-01: Test Activity
- status: basic-design [bd]
- category: development
- progress: 30%

#### TSK-01-01-01: Task with children
- status: basic-design [bd]
- category: development
- progress: 15%

#### TSK-01-01-02: Task without children (leaf)
- status: verify [vf]
- category: defect
- progress: 85%

## WP-02: Second Work Package
- status: done [xx]
- category: infrastructure
- progress: 100%
```

---

## 6. data-testid 목록

### 6.1 WbsTreeNode

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `wbs-tree-node` | 노드 컨테이너 | 노드 렌더링 확인 |
| `wbs-tree-node-{id}` | 특정 노드 | 노드별 개별 테스트 |
| `expand-toggle-{id}` | 펼침/접기 버튼 | 버튼 클릭 테스트 |
| `node-content-{id}` | 노드 컨텐츠 영역 | 클릭 선택 테스트 |

### 6.2 NodeIcon

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `node-icon-{id}` | 아이콘 배지 | 아이콘 색상 확인 |

### 6.3 StatusBadge

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `status-badge-{id}` | 상태 배지 | 상태 레이블 확인 |

### 6.4 CategoryTag

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `category-tag-{id}` | 카테고리 태그 | 카테고리 표시 확인 |

### 6.5 ProgressBar

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `progress-bar-{id}` | 진행률 바 | 진행률 및 색상 확인 |

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 85% | 75% |
| Branches | 80% | 70% |
| Functions | 90% | 80% |
| Statements | 85% | 75% |

### 7.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 기능 요구사항 (FR) | 100% 커버 (8개 모두) |
| 시각 규칙 (VR) | 100% 커버 (5개 모두) |
| 주요 사용자 시나리오 | 100% |
| 접근성 (ARIA) | 주요 패턴 커버 |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`
- UI설계: `011-ui-design.md`

---

<!--
author: Claude (System Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
