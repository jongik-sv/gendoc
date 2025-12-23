# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-13

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-01 |
| Task명 | WbsTreePanel PrimeVue Tree Migration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/jjiban/prd.md` | 섹션 6.2 (WBS 트리 패널) |
| TRD | `.jjiban/jjiban/trd.md` | PrimeVue 4.x 통합 |

---

## 1. 목적 및 범위

### 1.1 목적

WbsTreePanel 컴포넌트의 커스텀 트리 렌더링(lines 143-235)을 PrimeVue Tree 컴포넌트로 교체하여:
- 표준화된 UI 컴포넌트 라이브러리 사용
- 접근성 및 키보드 탐색 기능 개선
- 유지보수성 향상 및 중복 코드 제거
- PrimeVue 디자인 시스템과의 일관성 확보

### 1.2 범위

**포함 범위**:
- WbsNode[] → PrimeVue TreeNode[] 변환 로직 설계
- v-model:expandedKeys 기반 펼침 상태 관리
- 커스텀 노드 템플릿 (NodeIcon + StatusBadge) 설계
- wbsStore와 expandedNodes 동기화 메커니즘
- ARIA 속성 및 접근성 유지
- 기존 시각적 스타일(다크 테마) 유지

**제외 범위**:
- NodeIcon 컴포넌트 내부 수정 → TSK-08-02
- AppLayout Splitter 마이그레이션 → TSK-08-03
- WbsTreeHeader 컴포넌트 수정 (현재 작업 범위 아님)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WbsNode[]를 PrimeVue TreeNode[] 구조로 변환 | High | 6.2 |
| FR-002 | v-model:expandedKeys로 펼침/접힘 상태 관리 | High | 6.2 |
| FR-003 | 노드 클릭 시 'node-selected' 이벤트 발생 | High | 6.2 |
| FR-004 | 커스텀 노드 템플릿: NodeIcon + StatusBadge 표시 | High | 6.2 |
| FR-005 | wbsStore.expandedNodes와 양방향 동기화 | High | 6.2 |
| FR-006 | 로딩/에러/빈 상태 표시 유지 | Medium | 6.2 |
| FR-007 | 기존 testid 속성 유지 (E2E 호환성) | Medium | - |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 렌더링 성능 | < 200ms (100개 노드 기준) |
| NFR-002 | 접근성 | WCAG 2.1 AA 준수 |
| NFR-003 | 테스트 커버리지 | >= 80% |
| NFR-004 | 타입 안정성 | TypeScript strict mode 통과 |
| NFR-005 | 기존 E2E 테스트 | 회귀 없이 통과 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
WbsTreePanel.vue
├── State Management
│   ├── wbsStore (tree, loading, error)
│   └── expandedKeys (ref<Record<string, boolean>>)
├── Data Transformation
│   └── convertToTreeNodes(WbsNode[] → TreeNode[])
├── PrimeVue Tree Component
│   ├── v-model:expandedKeys
│   ├── :value="treeNodes"
│   ├── @node-expand / @node-collapse (sync to store)
│   └── Custom Templates
│       ├── #default slot (NodeIcon + Title + StatusBadge)
│       └── Type-specific rendering (WP/ACT/TSK)
└── Event Handling
    └── @node-click → emit('node-selected')
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| **WbsTreePanel** | 트리 패널 컨테이너 | 데이터 로드, 상태 관리, 이벤트 조정 |
| **PrimeVue Tree** | 트리 UI 렌더링 | 계층 구조 표시, 펼침/접힘, 키보드 탐색 |
| **convertToTreeNodes()** | 데이터 변환 함수 | WbsNode → TreeNode 변환 |
| **Custom Node Template** | 노드 렌더링 | NodeIcon, 제목, StatusBadge 표시 |
| **wbsStore** | 상태 저장소 | tree, expandedNodes, 확장/축소 메서드 |

### 3.3 데이터 흐름

```
1. Data Load
   wbsStore.fetchWbs(projectId)
   → tree: WbsNode[]
   → expandedNodes: Set<string>

2. Data Transformation
   computed: treeNodes = convertToTreeNodes(tree)
   WbsNode[] → TreeNode[] with:
   - key: node.id
   - label: node.title
   - data: { node: WbsNode }
   - children: TreeNode[]

3. Expansion State Sync
   computed: expandedKeys = Set → Record<string, boolean>
   { 'WP-01': true, 'ACT-01-01': true }

4. User Interaction
   Tree @node-expand → updateExpandedKeys()
   → wbsStore.expandedNodes.add(nodeKey)

   Tree @node-collapse → updateExpandedKeys()
   → wbsStore.expandedNodes.delete(nodeKey)

5. Node Click
   Custom template @click
   → emit('node-selected', nodeId)
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| TreeNode 변환 시점 | (A) computed, (B) fetchWbs 직후 | A: computed | 반응성 유지, wbsStore 독립성 |
| expandedKeys 타입 | (A) Set, (B) Record<string, boolean> | B: Record | PrimeVue Tree API 요구사항 |
| 상태 동기화 방식 | (A) watcher, (B) event handler | B: event handler | 명시적, 단방향 데이터 흐름 |
| 노드 클릭 이벤트 | (A) @node-select, (B) template @click | B: template @click | 커스텀 템플릿 내 자유도 |
| data 속성 구조 | (A) 전체 node, (B) 필요 필드만 | A: 전체 node | 템플릿에서 모든 정보 접근 가능 |
| 스타일링 방식 | (A) Pass-Through, (B) Global CSS | B: Global CSS | 기존 다크 테마 스타일 재사용 |

---

## 5. 인수 기준

- [ ] AC-01: WbsNode[]가 PrimeVue TreeNode[] 구조로 올바르게 변환됨
- [ ] AC-02: v-model:expandedKeys로 펼침 상태가 관리됨
- [ ] AC-03: 노드 확장/축소 시 wbsStore.expandedNodes와 동기화됨
- [ ] AC-04: 커스텀 템플릿에서 NodeIcon과 StatusBadge가 표시됨
- [ ] AC-05: 노드 클릭 시 'node-selected' 이벤트가 정상 발생함
- [ ] AC-06: 기존 E2E 테스트(wbs-tree-panel, wbs-tree-node-*)가 통과함
- [ ] AC-07: ARIA 속성(role, aria-label, aria-busy)이 유지됨
- [ ] AC-08: 로딩/에러/빈 상태 표시가 정상 작동함
- [ ] AC-09: expandAll/collapseAll 메서드가 PrimeVue Tree와 동작함
- [ ] AC-10: 다크 테마 스타일(hover, 색상)이 유지됨

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| PrimeVue Tree 성능 저하 (100+ 노드) | Medium | 가상 스크롤링 옵션 검토, lazy loading 고려 |
| expandedKeys 동기화 버그 | High | 단위 테스트로 양방향 동기화 검증 |
| 기존 E2E 테스트 실패 | High | testid 속성 유지, 회귀 테스트 우선 수행 |
| 커스텀 템플릿 스타일 충돌 | Medium | PrimeVue 기본 스타일 오버라이드 검증 |
| 접근성 기능 손실 | Medium | ARIA 속성 명시적 추가, 키보드 탐색 테스트 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-06-02 | 선행 | wbsStore 및 기본 트리 구조 완성 |
| PrimeVue 4.x | 외부 | Tree 컴포넌트 API 안정성 |
| NodeIcon | 병렬 | TSK-08-02에서 최적화 (현재는 현상 유지) |
| StatusBadge | 내부 | 기존 StatusBadge 재사용 (별도 수정 없음) |

---

## 7. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행
  - convertToTreeNodes() 함수 상세 명세
  - expandedKeys 동기화 로직 상세화
  - 커스텀 템플릿 슬롯 구조 정의
  - 이벤트 핸들러 시그니처 정의
  - 에러 처리 및 fallback 전략

---

## 관련 문서

- PRD: `.jjiban/jjiban/prd.md` (섹션 6.2)
- TRD: `.jjiban/jjiban/trd.md` (PrimeVue 통합)
- 상세설계: `020-detail-design.md` (다음 단계)
- PrimeVue Tree Docs: https://primevue.org/tree

---

<!--
author: Claude Opus 4.5
Template Version: 1.0.0
Created: 2025-12-16
-->
