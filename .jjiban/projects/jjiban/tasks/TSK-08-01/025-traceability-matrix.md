# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**: PRD → 기본설계 → 상세설계 → 테스트 4단계 양방향 추적
>
> **참조**: 이 문서는 `020-detail-design.md`와 `026-test-specification.md`와 함께 사용됩니다.

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-01 |
| Task명 | WbsTreePanel PrimeVue Tree Migration |
| 상세설계 참조 | `020-detail-design.md` |
| 테스트 명세 참조 | `026-test-specification.md` |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 기능 요구사항 추적 (FR → 설계 → 테스트)

| 요구사항 ID | PRD 섹션 | 기본설계 섹션 | 상세설계 섹션 | 단위 테스트 | E2E 테스트 | 상태 |
|-------------|----------|--------------|--------------|-------------|------------|------|
| FR-001 | 6.2 | 2.1 | 6.2, 8.1 | UT-001 | E2E-001 | 설계완료 |
| FR-002 | 6.2 | 2.1 | 6.2, 7.3 | UT-002 | E2E-002, E2E-003 | 설계완료 |
| FR-003 | 6.2 | 2.1 | 7.3 | - | E2E-004 | 설계완료 |
| FR-004 | 6.2 | 2.1 | 9.4 | - | E2E-005 | 설계완료 |
| FR-005 | 6.2 | 2.1 | 7.3, 8.2 | UT-003 | E2E-002, E2E-003 | 설계완료 |
| FR-006 | 6.2 | 2.1 | 11.1 | - | E2E-006 | 설계완료 |
| FR-007 | 6.2 | 2.1 | 9.5 | - | E2E-001 | 설계완료 |

### 1.1 요구사항별 상세 매핑

#### FR-001: WbsNode[]를 PrimeVue TreeNode[] 구조로 변환

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2 | WBS 트리 패널 기본 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1 | 데이터 변환 로직 개념 |
| 상세설계 | 020-detail-design.md | 6.2 | WbsNode → TreeNode 변환 구조 정의 |
| 상세설계 | 020-detail-design.md | 8.1 | convertToTreeNodes 함수 처리 흐름 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-001: convertToTreeNodes 함수 테스트 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 트리 렌더링 확인 |

#### FR-002: v-model:expandedKeys로 펼침/접힘 상태 관리

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2 | 노드 펼침/접힘 기능 |
| 기본설계 | 010-basic-design.md | 2.1 | expandedKeys 동기화 개념 |
| 상세설계 | 020-detail-design.md | 6.2 | expandedKeys 변환 로직 (Set → Record) |
| 상세설계 | 020-detail-design.md | 7.3 | PrimeVue Tree v-model 바인딩 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-002: expandedKeys computed 테스트 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-002: 노드 펼침 동작, E2E-003: 노드 접힘 동작 |

#### FR-003: 노드 클릭 시 'node-selected' 이벤트 발생

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2 | 노드 선택 기능 |
| 기본설계 | 010-basic-design.md | 2.1 | 노드 클릭 이벤트 정의 |
| 상세설계 | 020-detail-design.md | 7.3 | handleNodeClick 함수 시그니처 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-004: 노드 클릭 이벤트 검증 |

#### FR-004: 커스텀 노드 템플릿: NodeIcon + StatusBadge 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2 | 노드 아이콘 및 상태 표시 |
| 기본설계 | 010-basic-design.md | 2.1 | 커스텀 템플릿 설계 방향 |
| 상세설계 | 020-detail-design.md | 9.4 | Custom Template Slot Props, NodeIcon/StatusBadge Props |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-005: 커스텀 템플릿 렌더링 검증 |

#### FR-005: wbsStore.expandedNodes와 양방향 동기화

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2 | 상태 동기화 요구사항 |
| 기본설계 | 010-basic-design.md | 2.1 | 동기화 메커니즘 개념 |
| 상세설계 | 020-detail-design.md | 7.3 | updateExpandedKeys 함수 시그니처 |
| 상세설계 | 020-detail-design.md | 8.2 | 상태 동기화 시퀀스 다이어그램 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-003: updateExpandedKeys 함수 테스트 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-002, E2E-003: 동기화 검증 |

#### FR-006: 로딩/에러/빈 상태 표시 유지

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2 | UI 상태 표시 |
| 기본설계 | 010-basic-design.md | 2.1 | 상태별 UI 유지 |
| 상세설계 | 020-detail-design.md | 11.1 | 오류 처리 및 경계 조건 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-006: 상태별 UI 검증 |

#### FR-007: 기존 testid 속성 유지 (E2E 호환성)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2 | 테스트 호환성 |
| 기본설계 | 010-basic-design.md | 2.1 | data-testid 유지 요구사항 |
| 상세설계 | 020-detail-design.md | 9.5 | 컴포넌트별 data-testid 정의 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 기존 셀렉터 동작 확인 |

---

## 2. 비즈니스 규칙 추적 (BR → 구현 → 검증)

> 이 Task는 UI 마이그레이션으로 비즈니스 규칙 없음

| 규칙 ID | PRD 출처 | 기본설계 섹션 | 구현 위치 | 단위 테스트 | E2E 테스트 | 검증 방법 | 상태 |
|---------|----------|--------------|----------|-------------|------------|-----------|------|
| - | - | - | - | - | - | - | - |

---

## 3. 테스트 역추적 매트릭스

| 테스트 ID | 테스트 유형 | 검증 대상 요구사항 | 검증 대상 비즈니스 규칙 | 상태 |
|-----------|------------|-------------------|----------------------|------|
| UT-001 | 단위 | FR-001 | - | 미실행 |
| UT-002 | 단위 | FR-002 | - | 미실행 |
| UT-003 | 단위 | FR-005 | - | 미실행 |
| E2E-001 | E2E | FR-001, FR-007 | - | 미실행 |
| E2E-002 | E2E | FR-002, FR-005 | - | 미실행 |
| E2E-003 | E2E | FR-002, FR-005 | - | 미실행 |
| E2E-004 | E2E | FR-003 | - | 미실행 |
| E2E-005 | E2E | FR-004 | - | 미실행 |
| E2E-006 | E2E | FR-006 | - | 미실행 |

---

## 4. 데이터 모델 추적

| 기본설계 엔티티 | 상세설계 데이터 타입 | 변환 함수 | 용도 |
|----------------|---------------------|----------|------|
| WbsNode | WbsNode (app/types/store) | - | 애플리케이션 내부 트리 구조 |
| - | TreeNode (PrimeVue 타입) | convertToTreeNodes | PrimeVue Tree 렌더링용 |
| expandedNodes (Set<string>) | expandedKeys (Record<string, boolean>) | computed 변환 | PrimeVue v-model 바인딩 |

---

## 5. 인터페이스 추적

| 기본설계 인터페이스 | 상세설계 컴포넌트/함수 | 타입 | 용도 | 요구사항 |
|--------------------|----------------------|------|------|----------|
| WbsNode[] 입력 | convertToTreeNodes | Function | 데이터 변환 | FR-001 |
| TreeNode[] 출력 | PrimeVue Tree :value | Props | 트리 렌더링 | FR-001 |
| expandedKeys | PrimeVue Tree v-model | Props | 상태 동기화 | FR-002 |
| @node-expand/@node-collapse | updateExpandedKeys | Event Handler | 상태 업데이트 | FR-005 |
| @click (Custom Template) | handleNodeClick | Event Handler | 노드 선택 | FR-003 |
| emit('node-selected') | WbsTreePanel Emits | Event | 부모 컴포넌트 통지 | FR-003 |

---

## 6. 화면 추적

| 기본설계 화면 | 상세설계 화면 | 컴포넌트 | 요구사항 |
|--------------|--------------|----------|----------|
| WBS 트리 패널 | WbsTreePanel.vue | PrimeVue Tree + Custom Template | FR-001~FR-007 |
| 로딩 상태 | WbsTreePanel.vue | ProgressSpinner | FR-006 |
| 에러 상태 | WbsTreePanel.vue | Message + Button | FR-006 |
| 빈 상태 | WbsTreePanel.vue | Empty State (pi pi-inbox) | FR-006 |
| 노드 템플릿 | Custom Template Slot | NodeIcon + StatusBadge | FR-004 |

---

## 7. 추적성 검증 요약

### 7.1 커버리지 통계

| 구분 | 총 항목 | 매핑 완료 | 미매핑 | 커버리지 |
|------|---------|----------|--------|---------|
| 기능 요구사항 (FR) | 7 | 7 | 0 | 100% |
| 비즈니스 규칙 (BR) | 0 | 0 | 0 | N/A |
| 단위 테스트 (UT) | 3 | 3 | 0 | 100% |
| E2E 테스트 | 6 | 6 | 0 | 100% |
| 데이터 모델 | 3 | 3 | 0 | 100% |
| 인터페이스 | 6 | 6 | 0 | 100% |
| 화면 요소 | 5 | 5 | 0 | 100% |

### 7.2 미매핑 항목 (있는 경우)

| 구분 | ID | 설명 | 미매핑 사유 |
|------|-----|------|-----------|
| - | - | - | - |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 기본설계: `010-basic-design.md`
- 화면설계: `011-ui-design.md`
- PRD: `.jjiban/jjiban/prd.md` (섹션 6.2)

---

<!--
author: Claude Opus 4.5
Template Version: 1.0.0
Created: 2025-12-16
-->
