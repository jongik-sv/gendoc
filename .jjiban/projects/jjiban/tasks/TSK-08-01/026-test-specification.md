# 테스트 명세서 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**: 단위 테스트, E2E 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-01 |
| Task명 | WbsTreePanel PrimeVue Tree Migration |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | 유틸리티 함수 (convertToTreeNodes, computed) | 80% 이상 |
| E2E 테스트 | PrimeVue Tree 통합, 사용자 인터랙션 | 100% 시나리오 커버 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest |
| 테스트 프레임워크 (E2E) | Playwright |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | convertToTreeNodes | WbsNode[] → TreeNode[] 변환 | 올바른 TreeNode 구조 반환 | FR-001 |
| UT-002 | expandedKeys (computed) | Set<string> → Record<string, boolean> 변환 | PrimeVue 형식 객체 반환 | FR-002 |
| UT-003 | updateExpandedKeys | node-expand 이벤트 처리 | wbsStore.expandedNodes에 추가 | FR-005 |

### 2.2 테스트 케이스 상세

#### UT-001: convertToTreeNodes - WbsNode[] → TreeNode[] 변환

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/WbsTreePanel.spec.ts` |
| **테스트 블록** | `describe('convertToTreeNodes') → it('should convert WbsNode[] to TreeNode[]')` |
| **입력 데이터** | `[{ id: 'WP-01', type: 'wp', title: 'Test WP', children: [{ id: 'TSK-01-01', type: 'task', title: 'Test Task' }] }]` |
| **검증 포인트** | 1. TreeNode.key = WbsNode.id<br>2. TreeNode.label = WbsNode.title<br>3. TreeNode.data.node = 원본 WbsNode<br>4. TreeNode.children 재귀 변환 확인 |
| **커버리지 대상** | convertToTreeNodes 함수 전체 분기 |
| **관련 요구사항** | FR-001 |

**테스트 시나리오**:

| 케이스 | 입력 | 예상 출력 |
|--------|------|----------|
| 단순 WP 노드 | `[{ id: 'WP-01', type: 'wp', title: 'Auth' }]` | `[{ key: 'WP-01', label: 'Auth', data: { node: {...} }, children: undefined }]` |
| 중첩 구조 (WP → TSK) | `[{ id: 'WP-01', children: [{ id: 'TSK-01-01', type: 'task', title: 'Login' }] }]` | TreeNode.children[0].key = 'TSK-01-01' |
| 깊은 중첩 (WP → ACT → TSK) | 3단계 계층 구조 | 재귀적으로 모든 레벨 변환 |
| 빈 배열 | `[]` | `[]` |

#### UT-002: expandedKeys (computed) - Set → Record 변환

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/WbsTreePanel.spec.ts` |
| **테스트 블록** | `describe('expandedKeys computed') → it('should convert Set to Record')` |
| **입력 데이터** | `wbsStore.expandedNodes = new Set(['WP-01', 'ACT-01-01'])` |
| **검증 포인트** | 1. 반환값 타입 = Record<string, boolean><br>2. Set의 각 키가 true 값으로 매핑<br>3. Set 변경 시 computed 자동 재계산 |
| **커버리지 대상** | expandedKeys computed 속성 |
| **관련 요구사항** | FR-002 |

**테스트 시나리오**:

| 케이스 | wbsStore.expandedNodes (Set) | expandedKeys (Record) |
|--------|------------------------------|-----------------------|
| 2개 확장 | `Set(['WP-01', 'ACT-01-01'])` | `{ 'WP-01': true, 'ACT-01-01': true }` |
| 빈 Set | `Set()` | `{}` |
| 1개 확장 | `Set(['TSK-01-01-01'])` | `{ 'TSK-01-01-01': true }` |

#### UT-003: updateExpandedKeys - node-expand 이벤트 처리

| 항목 | 내용 |
|------|------|
| **파일** | `app/components/wbs/__tests__/WbsTreePanel.spec.ts` |
| **테스트 블록** | `describe('updateExpandedKeys') → it('should add node key to expandedNodes on expand')` |
| **Mock 의존성** | wbsStore (Pinia Test Wrapper) |
| **입력 데이터** | `event = { node: { key: 'WP-01' } }` |
| **검증 포인트** | 1. wbsStore.expandedNodes.has('WP-01') = true<br>2. node-collapse 시 .delete() 호출 확인 |
| **커버리지 대상** | updateExpandedKeys 함수 |
| **관련 요구사항** | FR-005 |

**테스트 시나리오**:

| 이벤트 | 입력 노드 키 | wbsStore.expandedNodes 변경 |
|--------|-------------|----------------------------|
| @node-expand | 'WP-01' | .add('WP-01') 호출 |
| @node-collapse | 'WP-01' | .delete('WP-01') 호출 |

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 트리 렌더링 확인 | WBS 데이터 로드 완료 | 1. /wbs 페이지 접속 | PrimeVue Tree 표시 | FR-001, FR-007 |
| E2E-002 | 노드 펼침 동작 | 트리 렌더링 완료 | 1. 펼침 아이콘 클릭 | 자식 노드 표시, expandedNodes 업데이트 | FR-002, FR-005 |
| E2E-003 | 노드 접힘 동작 | 노드 펼침 상태 | 1. 접힘 아이콘 클릭 | 자식 노드 숨김, expandedNodes 업데이트 | FR-002, FR-005 |
| E2E-004 | 노드 클릭 이벤트 | 트리 렌더링 완료 | 1. 노드 제목 클릭 | 'node-selected' 이벤트 발생 | FR-003 |
| E2E-005 | 커스텀 템플릿 렌더링 | 트리 렌더링 완료 | 1. 각 노드 타입 확인 | NodeIcon + StatusBadge 표시 | FR-004 |
| E2E-006 | 상태별 UI 표시 | - | 1. 로딩/에러/빈 상태 확인 | 각 상태에 맞는 UI 표시 | FR-006 |

### 3.2 테스트 케이스 상세

#### E2E-001: 트리 렌더링 확인

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-primevue.spec.ts` |
| **테스트명** | `test('PrimeVue Tree가 정상적으로 렌더링된다')` |
| **사전조건** | 프로젝트 jjiban, WBS 데이터 존재 |
| **data-testid 셀렉터** | |
| - 트리 패널 | `[data-testid="wbs-tree-panel"]` |
| - 트리 컨테이너 | `[data-testid="wbs-tree"]` |
| - WP 노드 | `[data-testid="wbs-tree-node-WP-01"]` |
| **실행 단계** | |
| 1 | `await page.goto('/wbs?project=jjiban')` |
| 2 | `await page.waitForSelector('[data-testid="wbs-tree"]')` |
| **검증 포인트** | |
| 1 | `expect(page.locator('[data-testid="wbs-tree"]')).toBeVisible()` |
| 2 | `expect(page.locator('.p-tree')).toBeVisible()` (PrimeVue Tree 클래스) |
| 3 | `expect(page.locator('[data-testid="wbs-tree-node-WP-01"]')).toBeVisible()` |
| **관련 요구사항** | FR-001, FR-007 |

#### E2E-002: 노드 펼침 동작

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-primevue.spec.ts` |
| **테스트명** | `test('노드 펼침 아이콘 클릭 시 자식 노드가 표시되고 expandedNodes가 업데이트된다')` |
| **사전조건** | WP-01 노드 접힌 상태 |
| **data-testid 셀렉터** | |
| - 펼침 아이콘 | `.p-tree-toggler` (PrimeVue 기본) |
| - 자식 노드 | `[data-testid="wbs-tree-node-ACT-01-01"]` |
| **실행 단계** | |
| 1 | `await page.click('.p-tree-toggler[data-key="WP-01"]')` |
| 2 | `await page.waitForSelector('[data-testid="wbs-tree-node-ACT-01-01"]')` |
| **검증 포인트** | |
| 1 | `expect(page.locator('[data-testid="wbs-tree-node-ACT-01-01"]')).toBeVisible()` |
| 2 | 펼침 아이콘이 ▼ (하향) 상태 확인 |
| 3 | wbsStore.expandedNodes.has('WP-01') = true (Vue DevTools 또는 간접 검증) |
| **관련 요구사항** | FR-002, FR-005 |

#### E2E-003: 노드 접힘 동작

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-primevue.spec.ts` |
| **테스트명** | `test('노드 접힘 아이콘 클릭 시 자식 노드가 숨겨지고 expandedNodes가 업데이트된다')` |
| **사전조건** | WP-01 노드 펼침 상태 |
| **data-testid 셀렉터** | |
| - 접힘 아이콘 | `.p-tree-toggler` (PrimeVue 기본) |
| - 자식 노드 | `[data-testid="wbs-tree-node-ACT-01-01"]` |
| **실행 단계** | |
| 1 | `await page.click('.p-tree-toggler[data-key="WP-01"]')` (다시 클릭) |
| 2 | `await page.waitForTimeout(500)` (애니메이션 대기) |
| **검증 포인트** | |
| 1 | `expect(page.locator('[data-testid="wbs-tree-node-ACT-01-01"]')).toBeHidden()` |
| 2 | 펼침 아이콘이 ▶ (우향) 상태 확인 |
| 3 | wbsStore.expandedNodes.has('WP-01') = false |
| **관련 요구사항** | FR-002, FR-005 |

#### E2E-004: 노드 클릭 이벤트

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-primevue.spec.ts` |
| **테스트명** | `test('노드 제목 클릭 시 node-selected 이벤트가 발생한다')` |
| **사전조건** | 트리 렌더링 완료 |
| **data-testid 셀렉터** | |
| - 노드 | `[data-testid="wbs-tree-node-TSK-01-01-01"]` |
| **실행 단계** | |
| 1 | `const eventPromise = page.evaluate(() => new Promise(resolve => { window.addEventListener('node-selected', resolve, { once: true }) }))` |
| 2 | `await page.click('[data-testid="wbs-tree-node-TSK-01-01-01"]')` |
| 3 | `const event = await eventPromise` |
| **검증 포인트** | |
| 1 | 이벤트 발생 확인 |
| 2 | 이벤트 payload = 'TSK-01-01-01' |
| 3 | 노드 배경색 변경 (선택 상태) |
| **관련 요구사항** | FR-003 |

#### E2E-005: 커스텀 템플릿 렌더링

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-primevue.spec.ts` |
| **테스트명** | `test('각 노드 타입별 커스텀 템플릿이 올바르게 렌더링된다')` |
| **사전조건** | 트리 렌더링 완료 |
| **data-testid 셀렉터** | |
| - WP 노드 | `[data-testid="wbs-tree-node-WP-01"]` |
| - Task 노드 | `[data-testid="wbs-tree-node-TSK-01-01-01"]` |
| **실행 단계** | |
| 1 | WP-01 노드 펼침 |
| 2 | Task 노드 확인 |
| **검증 포인트** | |
| 1 | NodeIcon 표시: `expect(page.locator('[data-testid="wbs-tree-node-WP-01"] .node-icon')).toBeVisible()` |
| 2 | StatusBadge 표시 (Task만): `expect(page.locator('[data-testid="wbs-tree-node-TSK-01-01-01"] .status-badge')).toBeVisible()` |
| 3 | WP/ACT 진행률 표시: `expect(page.locator('[data-testid="wbs-tree-node-WP-01"]')).toContainText('%')` |
| **관련 요구사항** | FR-004 |

#### E2E-006: 상태별 UI 표시

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/wbs-tree-primevue.spec.ts` |
| **테스트명** | `test('로딩/에러/빈 상태가 올바르게 표시된다')` |
| **사전조건** | - |
| **data-testid 셀렉터** | |
| - 로딩 상태 | `[data-testid="loading-state"]` |
| - 에러 상태 | `[data-testid="error-state"]` |
| - 빈 상태 | `[data-testid="empty-state-no-wbs"]` |
| **실행 단계** | |
| 1 | 로딩 상태: API 지연 시뮬레이션 |
| 2 | 에러 상태: API 오류 응답 모킹 |
| 3 | 빈 상태: 빈 WBS 데이터 모킹 |
| **검증 포인트** | |
| 1 | 로딩: ProgressSpinner 표시 |
| 2 | 에러: Message 컴포넌트 + "다시 시도" 버튼 |
| 3 | 빈 상태: "WBS 데이터가 없습니다" 메시지 |
| **관련 요구사항** | FR-006 |

---

## 4. 테스트 데이터 (Fixture)

### 4.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-WBS-SIMPLE | 단순 WP 노드 | `{ id: 'WP-01', type: 'wp', title: 'Auth Module', children: [] }` |
| MOCK-WBS-NESTED | 중첩 구조 (WP → TSK) | `{ id: 'WP-01', children: [{ id: 'TSK-01-01', type: 'task', title: 'Login', status: '[bd]' }] }` |
| MOCK-WBS-DEEP | 깊은 중첩 (WP → ACT → TSK) | 3단계 계층 구조 |
| MOCK-EXPANDED-NODES | 확장 상태 | `new Set(['WP-01', 'ACT-01-01'])` |

### 4.2 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-JJIBAN-WBS | 기본 E2E 환경 | 실제 jjiban 프로젝트 WBS | WP 8개, ACT 다수, TSK 다수 |
| SEED-EMPTY-WBS | 빈 환경 테스트 | 빈 wbs.md 파일 | WP 0개 |

### 4.3 Mock Functions

| Mock ID | 대상 | 용도 |
|---------|------|------|
| mockFetchWbs | wbsStore.fetchWbs | API 응답 시뮬레이션 |
| mockExpandedNodes | wbsStore.expandedNodes | 확장 상태 조작 |

---

## 5. data-testid 목록

### 5.1 WbsTreePanel 셀렉터

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `wbs-tree-panel` | 패널 컨테이너 | 패널 로드 확인 |
| `wbs-tree` | 트리 컨테이너 | 트리 표시 확인 |
| `wbs-tree-node-{id}` | 노드 아이템 | 노드별 클릭/선택 |
| `loading-state` | 로딩 상태 컨테이너 | 로딩 UI 검증 |
| `error-state` | 에러 상태 컨테이너 | 에러 UI 검증 |
| `retry-button` | 다시 시도 버튼 | 에러 복구 테스트 |
| `empty-state-no-wbs` | 빈 상태 컨테이너 | 빈 상태 UI 검증 |

### 5.2 PrimeVue Tree 기본 셀렉터

| 클래스/속성 | 요소 | 용도 |
|-----------|------|------|
| `.p-tree` | PrimeVue Tree 루트 | 트리 존재 확인 |
| `.p-tree-node` | 노드 컨테이너 | 노드 개수 확인 |
| `.p-tree-toggler` | 펼침/접힘 아이콘 | 펼침 동작 테스트 |
| `.p-tree-node-content` | 노드 콘텐츠 영역 | 커스텀 템플릿 검증 |
| `.p-highlight` | 선택된 노드 | 선택 상태 확인 |

---

## 6. 테스트 커버리지 목표

### 6.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 80% | 70% |
| Branches | 75% | 65% |
| Functions | 85% | 75% |
| Statements | 80% | 70% |

### 6.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 (FR-001~FR-007) |
| 인터랙션 패턴 | 100% (펼침/접힘/클릭) |
| 상태 UI | 100% (로딩/에러/빈 상태) |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`
- 화면설계: `011-ui-design.md`

---

<!--
author: Claude Opus 4.5
Template Version: 1.0.0
Created: 2025-12-16
-->
