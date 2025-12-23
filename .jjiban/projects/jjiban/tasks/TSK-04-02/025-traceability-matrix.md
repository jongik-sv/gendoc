# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**: PRD → 기본설계 → 상세설계 → 테스트 4단계 양방향 추적
>
> **참조**: 이 문서는 `020-detail-design.md`와 `026-test-specification.md`와 함께 사용됩니다.

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-02 |
| Task명 | Tree Node |
| 상세설계 참조 | `020-detail-design.md` |
| 테스트 명세 참조 | `026-test-specification.md` |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (System Architect) |

---

## 1. 기능 요구사항 추적 (FR → 설계 → 테스트)

| 요구사항 ID | PRD 섹션 | 기본설계 섹션 | 상세설계 섹션 | 단위 테스트 | E2E 테스트 | 상태 |
|-------------|----------|--------------|--------------|-------------|------------|------|
| FR-001 | 6.2.2 | 2.1, 4.1 | 8.1, 8.2 | UT-001 | E2E-001 | 설계완료 |
| FR-002 | 6.2.2 | 2.1, 4.1 | 8.1, 9.2 | UT-002 | E2E-001 | 설계완료 |
| FR-003 | 6.2.2 | 2.1, 4.1 | 8.1 | UT-003 | E2E-002 | 설계완료 |
| FR-004 | 6.2.2, 10.1 | 2.1, 4.2 | 5.1, 9.3 | UT-004 | E2E-003 | 설계완료 |
| FR-005 | 6.2.2 | 2.1, 4.3 | 5.1, 8.1 | UT-005, UT-006 | E2E-003 | 설계완료 |
| FR-006 | 6.2.2 | 2.1, 4.4 | 5.1 | UT-007 | E2E-003 | 설계완료 |
| FR-007 | 6.2.2 | 2.1, 4.5 | 5.1 | UT-008, UT-009 | E2E-004 | 설계완료 |
| FR-008 | 6.2.2 | 2.1, 4.1 | 8.1, 9.2 | UT-010 | E2E-005 | 설계완료 |

### 1.1 요구사항별 상세 매핑

#### FR-001: WbsTreeNode 재귀 렌더링

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2 | WBS 트리 뷰에서 계층 구조를 재귀적으로 표시 |
| 기본설계 | 010-basic-design.md | 2.1, 4.1 | WbsTreeNode 재귀 컴포넌트, children 자동 처리 |
| 상세설계 | 020-detail-design.md | 8.1, 8.2 | 재귀 렌더링 프로세스, 시퀀스 다이어그램 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-001: 재귀 렌더링 검증 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 계층 구조 표시 확인 |

#### FR-002: 계층별 들여쓰기 (depth × 20px)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2 | 계층 깊이에 따른 시각적 구분 |
| 기본설계 | 010-basic-design.md | 2.1, 4.1 | 들여쓰기 계산 로직 (depth × 20px) |
| 상세설계 | 020-detail-design.md | 8.1, 9.2 | indentWidth computed 속성, CSS 바인딩 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-002: 들여쓰기 계산 검증 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001: 시각적 들여쓰기 확인 |

#### FR-003: 펼침/접기 아이콘 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2 | children이 있을 때만 펼침/접기 버튼 표시 |
| 기본설계 | 010-basic-design.md | 2.1, 4.1 | hasChildren computed, 조건부 렌더링 |
| 상세설계 | 020-detail-design.md | 8.1 | v-if="hasChildren" 구현 방식 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-003: children 유무에 따른 버튼 표시 검증 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-002: 펼침/접기 버튼 시각화 확인 |

#### FR-004: 계층별 NodeIcon 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2, 10.1 | 계층별 아이콘과 색상 표시 |
| 기본설계 | 010-basic-design.md | 2.1, 4.2 | NodeIcon 컴포넌트, 계층별 매핑 테이블 |
| 상세설계 | 020-detail-design.md | 5.1, 9.3 | iconConfig computed, 색상 적용 방식 |
| 단위 테스트 | 026-test-specification.md | 2.2 | UT-004: 계층별 아이콘 매핑 검증 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-003: 아이콘 색상 시각화 확인 |

#### FR-005: StatusBadge 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2 | 상태 코드를 레이블로 변환하여 표시 |
| 기본설계 | 010-basic-design.md | 2.1, 4.3 | StatusBadge 컴포넌트, 상태 코드 파싱 |
| 상세설계 | 020-detail-design.md | 5.1, 8.1 | 정규식 파싱, 레이블/severity 매핑 |
| 단위 테스트 | 026-test-specification.md | 2.3 | UT-005, UT-006: 상태 파싱 및 매핑 검증 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-003: 상태 배지 표시 확인 |

#### FR-006: CategoryTag 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2 | 카테고리별 아이콘과 레이블 표시 |
| 기본설계 | 010-basic-design.md | 2.1, 4.4 | CategoryTag 컴포넌트, 3개 카테고리 지원 |
| 상세설계 | 020-detail-design.md | 5.1 | categoryConfig computed, 아이콘/색상 매핑 |
| 단위 테스트 | 026-test-specification.md | 2.4 | UT-007: 카테고리 매핑 검증 |
| E2E 테스트 | 026-test-specification.md | 3.2 | E2E-003: 카테고리 태그 표시 확인 |

#### FR-007: ProgressBar 표시

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2 | 진행률을 시각적 바로 표현, 색상 구분 |
| 기본설계 | 010-basic-design.md | 2.1, 4.5 | ProgressBar 컴포넌트, 3구간 색상 분리 |
| 상세설계 | 020-detail-design.md | 5.1 | barColor computed, Pass Through API 활용 |
| 단위 테스트 | 026-test-specification.md | 2.5 | UT-008, UT-009: 색상 구간 검증 |
| E2E 테스트 | 026-test-specification.md | 3.3 | E2E-004: 진행률 바 시각화 확인 |

#### FR-008: 선택 상태 시각화

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 6.2.2 | 선택된 노드 배경색 변경, 강조 |
| 기본설계 | 010-basic-design.md | 2.1, 4.1 | isSelected computed, selected 클래스 |
| 상세설계 | 020-detail-design.md | 8.1, 9.2 | Pinia selection 스토어 연동, CSS 스타일 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-010: 선택 상태 클래스 검증 |
| E2E 테스트 | 026-test-specification.md | 3.4 | E2E-005: 선택 상태 시각화 확인 |

---

## 2. 비즈니스 규칙 추적 (BR → 구현 → 검증)

이 Task는 순수 UI 컴포넌트로, 비즈니스 규칙 대신 **시각적 규칙 (Visual Rules)**을 추적합니다.

| 규칙 ID | PRD 출처 | 기본설계 섹션 | 구현 위치(개념) | 단위 테스트 | E2E 테스트 | 검증 방법 | 상태 |
|---------|----------|--------------|-----------------|-------------|------------|-----------|------|
| VR-001 | 10.1 | 4.2 | NodeIcon.vue | UT-004 | E2E-003 | 계층별 색상 고유성 확인 | 설계완료 |
| VR-002 | - | 4.3 | StatusBadge.vue | UT-006 | E2E-003 | 파싱 실패 시 원본 표시 확인 | 설계완료 |
| VR-003 | 6.2.2 | 4.5 | ProgressBar.vue | UT-009 | E2E-004 | 구간별 색상 구분 확인 | 설계완료 |
| VR-004 | 6.2.2 | 4.1 | WbsTreeNode.vue | UT-002 | E2E-001 | 들여쓰기 계산 정확성 확인 | 설계완료 |
| VR-005 | 6.2.2 | 4.1 | WbsTreeNode.vue | UT-003 | E2E-002 | children 없으면 버튼 숨김 확인 | 설계완료 |

### 2.1 시각적 규칙별 상세 매핑

#### VR-001: 계층별 아이콘 색상 고유성

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 섹션 10.1: 계층별 시각적 구분 (아이콘 색상) |
| **기본설계 표현** | NodeIcon 컴포넌트: project(indigo), wp(blue), act(green), task(amber) |
| **구현 위치** | NodeIcon.vue - iconConfig computed |
| **검증 방법** | 각 계층 타입별로 올바른 색상이 적용되는지 확인 |
| **관련 테스트** | UT-004, E2E-003 |

#### VR-002: 상태 코드 파싱 실패 시 원본 표시

| 구분 | 내용 |
|------|------|
| **PRD 원문** | (암묵적) 상태 표시 안정성 |
| **기본설계 표현** | StatusBadge: 파싱 실패 시 status 원본 반환 |
| **구현 위치** | StatusBadge.vue - statusCode computed (catch 로직) |
| **검증 방법** | 잘못된 형식의 status 입력 시 원본 문자열 표시 확인 |
| **관련 테스트** | UT-006, E2E-003 |

#### VR-003: 진행률 구간별 색상 구분

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 섹션 6.2.2: 진행률 시각화 |
| **기본설계 표현** | ProgressBar: 0-30% 빨강, 30-70% 황색, 70-100% 초록 |
| **구현 위치** | ProgressBar.vue - barColor computed |
| **검증 방법** | 각 구간별로 올바른 색상이 적용되는지 확인 |
| **관련 테스트** | UT-009, E2E-004 |

---

## 3. 테스트 역추적 매트릭스

| 테스트 ID | 테스트 유형 | 검증 대상 요구사항 | 검증 대상 시각 규칙 | 상태 |
|-----------|------------|-------------------|-------------------|------|
| UT-001 | 단위 | FR-001 | - | 미실행 |
| UT-002 | 단위 | FR-002 | VR-004 | 미실행 |
| UT-003 | 단위 | FR-003 | VR-005 | 미실행 |
| UT-004 | 단위 | FR-004 | VR-001 | 미실행 |
| UT-005 | 단위 | FR-005 | - | 미실행 |
| UT-006 | 단위 | FR-005 | VR-002 | 미실행 |
| UT-007 | 단위 | FR-006 | - | 미실행 |
| UT-008 | 단위 | FR-007 | - | 미실행 |
| UT-009 | 단위 | FR-007 | VR-003 | 미실행 |
| UT-010 | 단위 | FR-008 | - | 미실행 |
| E2E-001 | E2E | FR-001, FR-002 | VR-004 | 미실행 |
| E2E-002 | E2E | FR-003 | VR-005 | 미실행 |
| E2E-003 | E2E | FR-004, FR-005, FR-006 | VR-001, VR-002 | 미실행 |
| E2E-004 | E2E | FR-007 | VR-003 | 미실행 |
| E2E-005 | E2E | FR-008 | - | 미실행 |

---

## 4. 컴포넌트 추적

> 기본설계 컴포넌트 → 상세설계 구현 명세 매핑

| 기본설계 컴포넌트 | 상세설계 파일 | Props 인터페이스 | 요구사항 |
|------------------|--------------|-----------------|----------|
| WbsTreeNode | app/components/wbs/WbsTreeNode.vue | node, depth | FR-001, FR-002, FR-003, FR-008 |
| NodeIcon | app/components/wbs/NodeIcon.vue | type | FR-004 |
| StatusBadge | app/components/wbs/StatusBadge.vue | status | FR-005 |
| CategoryTag | app/components/wbs/CategoryTag.vue | category | FR-006 |
| ProgressBar | app/components/wbs/ProgressBar.vue | value, showValue | FR-007 |

---

## 5. Pinia Store 인터페이스 추적

> 기본설계 Store 요구사항 → 상세설계 인터페이스 매핑

| 기본설계 Store | 상세설계 Store | State | Getters | Actions | 요구사항 |
|---------------|--------------|-------|---------|---------|----------|
| wbs | stores/wbs.ts | expandedNodes | isExpanded(nodeId) | toggleExpand(nodeId) | FR-003 |
| selection | stores/selection.ts | selectedNode | isSelected(nodeId) | selectNode(node) | FR-008 |

---

## 6. Props/Computed 추적

> 컴포넌트별 Props와 Computed 속성 추적

### 6.1 WbsTreeNode

| Props/Computed | 타입 | 목적 | 요구사항 |
|----------------|------|------|----------|
| node (Props) | WbsNode | 렌더링할 노드 데이터 | FR-001 |
| depth (Props) | number | 현재 계층 깊이 | FR-002 |
| isExpanded (Computed) | boolean | 노드 펼침 상태 | FR-003 |
| isSelected (Computed) | boolean | 노드 선택 상태 | FR-008 |
| hasChildren (Computed) | boolean | 자식 노드 존재 여부 | FR-003 |
| indentWidth (Computed) | number | 들여쓰기 픽셀 값 | FR-002 |

### 6.2 NodeIcon

| Props/Computed | 타입 | 목적 | 요구사항 |
|----------------|------|------|----------|
| type (Props) | WbsNodeType | 계층 타입 | FR-004 |
| iconConfig (Computed) | Object | 아이콘/색상 설정 | VR-001 |

### 6.3 StatusBadge

| Props/Computed | 타입 | 목적 | 요구사항 |
|----------------|------|------|----------|
| status (Props) | string | 상태 문자열 | FR-005 |
| statusCode (Computed) | string | 파싱된 상태 코드 | FR-005 |
| statusLabel (Computed) | string | 레이블 문자열 | FR-005 |
| statusSeverity (Computed) | string | PrimeVue severity | FR-005 |

### 6.4 CategoryTag

| Props/Computed | 타입 | 목적 | 요구사항 |
|----------------|------|------|----------|
| category (Props) | TaskCategory | 카테고리 | FR-006 |
| categoryConfig (Computed) | Object | 아이콘/색상 설정 | FR-006 |

### 6.5 ProgressBar

| Props/Computed | 타입 | 목적 | 요구사항 |
|----------------|------|------|----------|
| value (Props) | number | 진행률 (0-100) | FR-007 |
| showValue (Props) | boolean | 텍스트 표시 여부 | FR-007 |
| barColor (Computed) | string | 진행률 구간별 색상 | VR-003 |

---

## 7. 추적성 검증 요약

### 7.1 커버리지 통계

| 구분 | 총 항목 | 매핑 완료 | 미매핑 | 커버리지 |
|------|---------|----------|--------|---------|
| 기능 요구사항 (FR) | 8 | 8 | 0 | 100% |
| 시각 규칙 (VR) | 5 | 5 | 0 | 100% |
| 단위 테스트 (UT) | 10 | 10 | 0 | 100% |
| E2E 테스트 | 5 | 5 | 0 | 100% |
| 컴포넌트 | 5 | 5 | 0 | 100% |

### 7.2 미매핑 항목 (있는 경우)

| 구분 | ID | 설명 | 미매핑 사유 |
|------|-----|------|-----------|
| - | - | - | - |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 기본설계: `010-basic-design.md`
- UI설계: `011-ui-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md`
- WBS: `.jjiban/projects/jjiban/wbs.md`

---

<!--
author: Claude (System Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
