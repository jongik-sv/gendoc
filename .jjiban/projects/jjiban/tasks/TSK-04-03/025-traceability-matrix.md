# 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**
> * 요구사항 → 설계 → 구현 → 테스트 추적성 확보
> * 변경 영향도 분석 지원
> * 구현 완전성 검증

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-03 |
| Task명 | Tree Interaction |
| Category | development |
| Domain | frontend |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (System Architect) |

---

## 1. 추적성 매트릭스 개요

### 1.1 추적 레벨

```
PRD 요구사항 (섹션 6.2.3, 11.2)
        ↓
기본설계 요구사항 (FR-001~FR-008)
        ↓
Composable 함수 (useTreeInteraction, useKeyboardNav, useTreePersistence)
        ↓
테스트 케이스 (UT-*, E2E-*)
        ↓
인수 기준 (AC-001~AC-015)
```

### 1.2 커버리지 목표

| 레벨 | 목표 커버리지 | 측정 방법 |
|------|-------------|----------|
| 요구사항 → 설계 | 100% | 모든 FR이 Composable로 매핑됨 |
| 설계 → 구현 | 100% | 모든 함수가 구현됨 |
| 구현 → 테스트 | ≥80% | 단위 테스트 + E2E 테스트 |
| 테스트 → 인수 기준 | 100% | 모든 AC가 테스트로 검증됨 |

---

## 2. 요구사항 → Composable 매핑

### 2.1 기능 요구사항 (FR) 매핑

| FR ID | 요구사항 | 우선순위 | Composable | 함수 | 테스트 ID |
|-------|---------|---------|-----------|------|----------|
| **FR-001** | 개별 노드 펼침/접기 토글 (클릭, 더블클릭, Space) | Critical | useTreeInteraction | toggleNode() | UT-TI-001, E2E-KBD-003 |
| **FR-002** | 전체 트리 펼치기/접기 버튼 | High | useTreeInteraction | expandAll(), collapseAll() | UT-TI-002, E2E-UI-001 |
| **FR-003** | 노드 선택 시 상세 패널 표시 (클릭, Enter) | Critical | useTreeInteraction | selectNode() | UT-TI-003, E2E-SEL-001 |
| **FR-004** | 화살표 키로 트리 탐색 (Up/Down/Left/Right) | High | useKeyboardNav | handleArrowDown(), handleArrowUp(), handleArrowLeft(), handleArrowRight() | UT-KBD-001~004, E2E-KBD-001 |
| **FR-005** | 키보드 단축키 지원 (Home, End, Esc) | Medium | useKeyboardNav | handleHome(), handleEnd(), handleEscape() | UT-KBD-005~007, E2E-KBD-004 |
| **FR-006** | 로컬 스토리지에 펼침/접기 상태 저장 | Medium | useTreePersistence | saveExpandedState() | UT-PER-001, E2E-PER-001 |
| **FR-007** | 프로젝트별 독립적인 상태 관리 | High | useTreePersistence | getStorageKey() | UT-PER-002, E2E-PER-002 |
| **FR-008** | 선택된 노드 시각적 피드백 (하이라이트, 스크롤) | High | useKeyboardNav, useTreeInteraction | focusNode(), isSelected() | UT-TI-004, E2E-SEL-002 |

### 2.2 비기능 요구사항 (NFR) 매핑

| NFR ID | 요구사항 | 기준 | 구현 위치 | 검증 방법 |
|--------|---------|------|----------|----------|
| **NFR-001** | 인터랙션 응답 시간 | < 100ms | 모든 Composable | E2E-PERF-001 (프레임율 측정) |
| **NFR-002** | 로컬 스토리지 크기 | < 1MB | useTreePersistence | UT-PER-003 (크기 체크) |
| **NFR-003** | 접근성 표준 | WCAG 2.1 AA | useKeyboardNav | E2E-A11Y-001 (Lighthouse) |
| **NFR-004** | 키보드 네비게이션 커버리지 | 100% | useKeyboardNav | E2E-KBD-005 (모든 기능 테스트) |
| **NFR-005** | 상태 동기화 지연 | < 50ms | Pinia Stores (반응성) | UT-TI-005 (watch 테스트) |

---

## 3. Composable → 함수 매핑

### 3.1 useTreeInteraction 함수 매핑

| 함수명 | 기능 | 관련 FR | 의존성 | 테스트 ID |
|--------|------|---------|--------|----------|
| **toggleNode** | 노드 펼침/접기 토글 | FR-001 | useWbsStore().toggleExpand() | UT-TI-001 |
| **selectNode** | 노드 선택 및 상세 로드 | FR-003 | useSelectionStore().selectNode() | UT-TI-003 |
| **expandAll** | 전체 노드 펼치기 | FR-002 | useWbsStore().expandAll() | UT-TI-002a |
| **collapseAll** | 전체 노드 접기 | FR-002 | useWbsStore().collapseAll() | UT-TI-002b |
| **isExpanded** | 노드 펼침 상태 확인 | FR-001 | useWbsStore().isExpanded() | UT-TI-001 |
| **isSelected** | 노드 선택 상태 확인 | FR-008 | useSelectionStore().selectedNodeId | UT-TI-004 |

### 3.2 useKeyboardNav 함수 매핑

| 함수명 | 기능 | 관련 FR | 키 매핑 | 테스트 ID |
|--------|------|---------|---------|----------|
| **handleKeyDown** | 키보드 이벤트 메인 핸들러 | FR-004, FR-005 | 모든 키 | UT-KBD-000 |
| **handleArrowDown** | 다음 노드로 이동 | FR-004 | ArrowDown | UT-KBD-001 |
| **handleArrowUp** | 이전 노드로 이동 | FR-004 | ArrowUp | UT-KBD-002 |
| **handleArrowRight** | 노드 펼치기 또는 자식 이동 | FR-004 | ArrowRight | UT-KBD-003 |
| **handleArrowLeft** | 노드 접기 또는 부모 이동 | FR-004 | ArrowLeft | UT-KBD-004 |
| **handleEnter** | 노드 선택 | FR-003 | Enter | UT-KBD-005 |
| **handleSpace** | 펼침/접기 토글 | FR-001 | Space | UT-KBD-006 |
| **handleHome** | 첫 번째 노드로 이동 | FR-005 | Home | UT-KBD-007 |
| **handleEnd** | 마지막 노드로 이동 | FR-005 | End | UT-KBD-008 |
| **handleEscape** | 선택 해제 | FR-005 | Escape | UT-KBD-009 |
| **focusNode** | 특정 노드로 포커스 이동 | FR-008 | - (내부 호출) | UT-KBD-010 |
| **flattenedNodes** | 평면화된 노드 배열 생성 | FR-004 | - (computed) | UT-KBD-011 |
| **getCurrentIndex** | 현재 노드 인덱스 찾기 | FR-004 | - (헬퍼) | UT-KBD-012 |
| **findParentNode** | 부모 노드 찾기 | FR-004 | - (헬퍼) | UT-KBD-013 |

### 3.3 useTreePersistence 함수 매핑

| 함수명 | 기능 | 관련 FR | 스토리지 키 | 테스트 ID |
|--------|------|---------|------------|----------|
| **restoreExpandedState** | 저장된 상태 복원 | FR-006 | jjiban:tree:{projectId}:expanded | UT-PER-001 |
| **saveExpandedState** | 현재 상태 저장 | FR-006 | jjiban:tree:{projectId}:expanded | UT-PER-001 |
| **clearExpandedState** | 저장된 상태 초기화 | FR-006 | jjiban:tree:{projectId}:expanded | UT-PER-004 |
| **getStorageKey** | 프로젝트별 스토리지 키 생성 | FR-007 | - (헬퍼) | UT-PER-002 |
| **cleanupOldStorage** | 오래된 데이터 정리 | NFR-002 | - (내부 호출) | UT-PER-003 |

---

## 4. 함수 → 테스트 케이스 매핑

### 4.1 단위 테스트 (UT) 매핑

#### useTreeInteraction 단위 테스트

| 테스트 ID | 테스트 케이스 | 함수 | 입력 | 기대 출력 | 우선순위 |
|-----------|-------------|------|------|----------|---------|
| **UT-TI-001** | 노드 토글 시 펼침/접기 상태 변경 | toggleNode() | nodeId='WP-01' | isExpanded('WP-01') = true | P1 |
| **UT-TI-002a** | 전체 펼치기 시 모든 노드 펼침 | expandAll() | - | expandedNodes.size = 전체 노드 수 | P1 |
| **UT-TI-002b** | 전체 접기 시 모든 노드 접힘 | collapseAll() | - | expandedNodes.size = 0 | P1 |
| **UT-TI-003** | Task 선택 시 상세 정보 로드 | selectNode() | nodeId='TSK-01' | selectedNodeId = 'TSK-01', selectedTask !== null | P1 |
| **UT-TI-004** | 선택 상태 확인 | isSelected() | nodeId='TSK-01' | true (선택된 경우) | P2 |
| **UT-TI-005** | 유효하지 않은 노드 ID 입력 | toggleNode() | nodeId='' | 에러 없이 무시 (early return) | P2 |
| **UT-TI-006** | 자식이 없는 노드 토글 | toggleNode() | nodeId='TSK-01' (자식 없음) | 상태 변경 없음 | P2 |
| **UT-TI-007** | 중복 선택 방지 | selectNode() | nodeId='TSK-01' (이미 선택됨) | API 호출 없음 (early return) | P2 |

#### useKeyboardNav 단위 테스트

| 테스트 ID | 테스트 케이스 | 함수 | 입력 | 기대 출력 | 우선순위 |
|-----------|-------------|------|------|----------|---------|
| **UT-KBD-000** | 키보드 이벤트 핸들러 등록 | handleKeyDown() | KeyboardEvent('ArrowDown') | preventDefault() 호출됨 | P1 |
| **UT-KBD-001** | ArrowDown으로 다음 노드 이동 | handleArrowDown() | currentIndex=0 | focusedNodeId = 노드[1].id | P1 |
| **UT-KBD-002** | ArrowUp으로 이전 노드 이동 | handleArrowUp() | currentIndex=1 | focusedNodeId = 노드[0].id | P1 |
| **UT-KBD-003** | ArrowRight로 노드 펼치기 | handleArrowRight() | nodeId='WP-01' (접혀있음) | isExpanded('WP-01') = true | P1 |
| **UT-KBD-004** | ArrowLeft로 노드 접기 | handleArrowLeft() | nodeId='WP-01' (펼쳐짐) | isExpanded('WP-01') = false | P1 |
| **UT-KBD-005** | Enter로 노드 선택 | handleEnter() | focusedNodeId='TSK-01' | onNodeSelect('TSK-01') 호출됨 | P1 |
| **UT-KBD-006** | Space로 토글 | handleSpace() | focusedNodeId='WP-01' | toggleNode('WP-01') 호출됨 | P1 |
| **UT-KBD-007** | Home으로 첫 노드 이동 | handleHome() | - | focusedNodeId = 노드[0].id | P2 |
| **UT-KBD-008** | End로 마지막 노드 이동 | handleEnd() | - | focusedNodeId = 노드[마지막].id | P2 |
| **UT-KBD-009** | Escape로 선택 해제 | handleEscape() | - | clearSelection() 호출됨 | P2 |
| **UT-KBD-010** | focusNode로 포커스 이동 | focusNode() | nodeId='ACT-01' | focusedNodeId = 'ACT-01' | P1 |
| **UT-KBD-011** | 평면화 시 펼쳐진 노드만 포함 | flattenedNodes | expandedNodes=['WP-01'] | 노드 배열 길이 = WP-01 + 자식들 | P1 |
| **UT-KBD-012** | 현재 인덱스 찾기 | getCurrentIndex() | focusedNodeId='ACT-01' | index > 0 | P2 |
| **UT-KBD-013** | 부모 노드 찾기 | findParentNode() | nodeId='TSK-01' | parentNode.id = 'ACT-01' | P2 |
| **UT-KBD-014** | ArrowRight로 첫 자식 이동 | handleArrowRight() | nodeId='WP-01' (이미 펼쳐짐) | focusedNodeId = 첫 자식.id | P2 |
| **UT-KBD-015** | ArrowLeft로 부모 이동 | handleArrowLeft() | nodeId='TSK-01' (접혀있음) | focusedNodeId = 부모.id | P2 |
| **UT-KBD-016** | 경계 조건: 첫 노드에서 ArrowUp | handleArrowUp() | currentIndex=0 | focusedNodeId = 노드[0].id (변경 없음) | P2 |
| **UT-KBD-017** | 경계 조건: 마지막 노드에서 ArrowDown | handleArrowDown() | currentIndex=마지막 | focusedNodeId = 노드[마지막].id (변경 없음) | P2 |

#### useTreePersistence 단위 테스트

| 테스트 ID | 테스트 케이스 | 함수 | 입력 | 기대 출력 | 우선순위 |
|-----------|-------------|------|------|----------|---------|
| **UT-PER-001** | 상태 저장 및 복원 | saveExpandedState(), restoreExpandedState() | expandedNodes=['WP-01', 'ACT-01'] | 복원 후 동일한 Set | P1 |
| **UT-PER-002** | 프로젝트별 독립 키 | getStorageKey() | projectId='proj-a', 'proj-b' | 다른 키 생성됨 | P1 |
| **UT-PER-003** | 크기 제한 체크 | saveExpandedState() | 1MB 초과 데이터 | 저장 생략 (console.warn) | P2 |
| **UT-PER-004** | 상태 초기화 | clearExpandedState() | - | localStorage에서 제거됨 | P2 |
| **UT-PER-005** | 버전 불일치 시 초기화 | restoreExpandedState() | version='0.9' (구버전) | clearExpandedState() 호출됨 | P2 |
| **UT-PER-006** | JSON 파싱 실패 처리 | restoreExpandedState() | 잘못된 JSON | clearExpandedState() 호출됨 | P2 |
| **UT-PER-007** | Quota 초과 시 정리 | saveExpandedState() | QuotaExceededError 발생 | cleanupOldStorage() 호출됨 | P2 |
| **UT-PER-008** | 유효하지 않은 노드 필터링 | restoreExpandedState() | expandedNodes=['DELETED-01'] | 존재하는 노드만 복원 | P2 |
| **UT-PER-009** | 오래된 데이터 정리 | cleanupOldStorage() | 30일 이전 데이터 | 해당 키 삭제됨 | P3 |

### 4.2 E2E 테스트 (Playwright) 매핑

| 테스트 ID | 시나리오 | 관련 FR | 테스트 단계 | 검증 항목 | 우선순위 |
|-----------|---------|---------|-----------|----------|---------|
| **E2E-UI-001** | 전체 펼치기/접기 버튼 동작 | FR-002 | 1. 전체 펼치기 클릭<br>2. 모든 노드 확인<br>3. 전체 접기 클릭 | 모든 자식 노드 표시/숨김 | P1 |
| **E2E-SEL-001** | 노드 클릭 시 상세 패널 표시 | FR-003 | 1. Task 노드 클릭<br>2. 상세 패널 확인 | 패널이 슬라이드 인됨 | P1 |
| **E2E-SEL-002** | 선택 상태 시각적 피드백 | FR-008 | 1. 노드 선택<br>2. 스타일 확인 | 배경색, 테두리 변경됨 | P1 |
| **E2E-KBD-001** | 화살표 키 탐색 | FR-004 | 1. 트리 포커스<br>2. ArrowDown 3회<br>3. ArrowUp 1회 | 포커스가 정확히 이동함 | P1 |
| **E2E-KBD-002** | ArrowRight로 펼치기 및 자식 이동 | FR-004 | 1. WP 노드 포커스<br>2. ArrowRight (펼치기)<br>3. ArrowRight (자식 이동) | 1단계 펼쳐짐, 2단계 첫 자식 포커스 | P1 |
| **E2E-KBD-003** | Space로 토글 | FR-001 | 1. WP 노드 포커스<br>2. Space 입력<br>3. 다시 Space 입력 | 펼침 → 접힘 → 펼침 | P1 |
| **E2E-KBD-004** | Home/End 키 이동 | FR-005 | 1. End 입력<br>2. Home 입력 | 마지막 노드 → 첫 노드 이동 | P2 |
| **E2E-KBD-005** | 키보드만으로 전체 기능 사용 | NFR-004 | 1. Tab으로 트리 포커스<br>2. 화살표로 탐색<br>3. Enter로 선택<br>4. Esc로 해제 | 마우스 없이 모든 기능 동작 | P1 |
| **E2E-PER-001** | 페이지 새로고침 시 상태 복원 | FR-006 | 1. 노드 펼치기<br>2. 새로고침<br>3. 상태 확인 | 동일한 펼침 상태 유지 | P1 |
| **E2E-PER-002** | 프로젝트 전환 시 독립 상태 | FR-007 | 1. 프로젝트 A 펼치기<br>2. 프로젝트 B로 전환<br>3. 다시 A로 전환 | 각 프로젝트 상태 독립적 | P2 |
| **E2E-PERF-001** | 인터랙션 응답 시간 | NFR-001 | 1. 노드 100개 트리<br>2. 펼치기/접기 반복<br>3. 프레임율 측정 | 60fps 유지 (< 16.67ms) | P1 |
| **E2E-A11Y-001** | 접근성 표준 준수 | NFR-003 | 1. Lighthouse 실행<br>2. axe-core 실행 | Accessibility 점수 ≥90 | P1 |

---

## 5. 테스트 → 인수 기준 매핑

### 5.1 인수 기준 (AC) 검증 매핑

| AC ID | 인수 기준 | 관련 FR | 검증 테스트 | 통과 조건 |
|-------|----------|---------|-----------|----------|
| **AC-01** | 노드 클릭 시 펼침/접기 토글 동작 | FR-001 | E2E-UI-001, UT-TI-001 | 클릭 시 상태 변경됨 |
| **AC-02** | 노드 더블클릭 시 펼침/접기 토글 동작 | FR-001 | E2E-UI-001 (추가) | 더블클릭 시 토글됨 |
| **AC-03** | Space 키로 노드 펼침/접기 토글 | FR-001 | E2E-KBD-003, UT-KBD-006 | Space 입력 시 토글됨 |
| **AC-04** | 노드 선택 시 상세 패널 표시 | FR-003 | E2E-SEL-001, UT-TI-003 | 패널이 표시됨 |
| **AC-05** | Enter 키로 노드 선택 | FR-003 | E2E-KBD-005, UT-KBD-005 | Enter 시 선택됨 |
| **AC-06** | ArrowDown/Up으로 다음/이전 노드 이동 | FR-004 | E2E-KBD-001, UT-KBD-001/002 | 포커스가 이동함 |
| **AC-07** | ArrowRight/Left로 펼치기/접기 또는 자식/부모 이동 | FR-004 | E2E-KBD-002, UT-KBD-003/004 | 상황에 따라 동작함 |
| **AC-08** | Home/End 키로 첫/마지막 노드 이동 | FR-005 | E2E-KBD-004, UT-KBD-007/008 | 첫/마지막 노드로 이동함 |
| **AC-09** | Esc 키로 선택 해제 | FR-005 | E2E-KBD-005, UT-KBD-009 | 선택이 해제됨 |
| **AC-10** | 전체 펼치기 버튼 동작 | FR-002 | E2E-UI-001, UT-TI-002a | 모든 노드 펼쳐짐 |
| **AC-11** | 전체 접기 버튼 동작 | FR-002 | E2E-UI-001, UT-TI-002b | 모든 노드 접혀짐 |
| **AC-12** | 펼침/접기 상태가 로컬 스토리지에 저장됨 | FR-006 | E2E-PER-001, UT-PER-001 | localStorage 확인됨 |
| **AC-13** | 페이지 새로고침 후 펼침/접기 상태 복원됨 | FR-006 | E2E-PER-001, UT-PER-001 | 상태가 복원됨 |
| **AC-14** | 선택된 노드가 시각적으로 하이라이트됨 | FR-008 | E2E-SEL-002, UT-TI-004 | 배경/테두리 변경됨 |
| **AC-15** | 키보드로 이동 시 자동 스크롤 조정 | FR-008 | E2E-KBD-001, UT-KBD-010 | scrollIntoView 호출됨 |

---

## 6. 변경 영향도 분석

### 6.1 영향도 매트릭스

**시나리오**: FR-004 (화살표 키 탐색) 요구사항 변경 시

| 영향받는 레벨 | 영향받는 항목 | 변경 필요 여부 | 영향도 |
|-------------|-------------|--------------|--------|
| **Composable** | useKeyboardNav | ✅ 변경 필요 | High |
| **함수** | handleArrowDown, handleArrowUp, handleArrowLeft, handleArrowRight | ✅ 변경 필요 | High |
| **단위 테스트** | UT-KBD-001~004, UT-KBD-014~017 | ✅ 변경 필요 | High |
| **E2E 테스트** | E2E-KBD-001, E2E-KBD-002 | ✅ 변경 필요 | Medium |
| **인수 기준** | AC-06, AC-07 | ✅ 변경 필요 | Medium |
| **다른 Composable** | useTreeInteraction | ❌ 변경 불필요 | Low |

### 6.2 의존성 그래프

```
FR-001 (토글)
  ↓
useTreeInteraction.toggleNode()
  ↓
useWbsStore.toggleExpand()
  ↓
UT-TI-001, E2E-UI-001
  ↓
AC-01, AC-02, AC-03

FR-004 (화살표 키)
  ↓
useKeyboardNav.handleArrowXXX()
  ↓
useTreeInteraction.toggleNode(), focusNode()
  ↓
UT-KBD-001~004, E2E-KBD-001~002
  ↓
AC-06, AC-07

FR-006 (영속성)
  ↓
useTreePersistence.saveExpandedState()
  ↓
localStorage API
  ↓
UT-PER-001, E2E-PER-001
  ↓
AC-12, AC-13
```

---

## 7. 커버리지 분석

### 7.1 요구사항 커버리지

| 레벨 | 총 개수 | 매핑 완료 | 미매핑 | 커버리지 |
|------|--------|----------|--------|---------|
| FR (기능 요구사항) | 8 | 8 | 0 | **100%** |
| NFR (비기능 요구사항) | 5 | 5 | 0 | **100%** |
| Composable 함수 | 25 | 25 | 0 | **100%** |
| 단위 테스트 | 34 | 34 | 0 | **100%** (설계 완료) |
| E2E 테스트 | 12 | 12 | 0 | **100%** (설계 완료) |
| 인수 기준 | 15 | 15 | 0 | **100%** |

### 7.2 테스트 커버리지 목표

| Composable | 단위 테스트 수 | E2E 테스트 수 | 목표 코드 커버리지 |
|-----------|-------------|-------------|-----------------|
| useTreeInteraction | 7 | 2 | ≥85% |
| useKeyboardNav | 18 | 5 | ≥80% |
| useTreePersistence | 9 | 2 | ≥85% |
| **전체** | **34** | **12** | **≥80%** |

---

## 8. 검증 체크리스트

### 8.1 설계 단계 검증

- [x] 모든 FR이 Composable 함수로 매핑됨
- [x] 모든 NFR이 구현 위치로 매핑됨
- [x] 모든 함수가 단위 테스트로 매핑됨
- [x] 모든 인수 기준이 테스트로 검증됨
- [x] 변경 영향도 분석이 작성됨

### 8.2 구현 단계 검증 (다음 단계)

- [ ] 모든 Composable 파일이 작성됨
- [ ] 모든 함수가 상세설계대로 구현됨
- [ ] 단위 테스트가 모두 작성되고 통과함
- [ ] E2E 테스트가 모두 작성되고 통과함
- [ ] 코드 커버리지 ≥80% 달성함

### 8.3 검증 단계 검증 (최종 단계)

- [ ] 모든 인수 기준이 검증됨
- [ ] 성능 요구사항이 충족됨 (NFR-001~005)
- [ ] 접근성 표준이 준수됨 (NFR-003)
- [ ] 프로덕션 배포 준비 완료

---

## 9. 참고 문서

- 기본설계: `010-basic-design.md` (요구사항 FR-001~FR-008)
- 상세설계: `020-detail-design.md` (Composable 상세 명세)
- 테스트 명세: `026-test-specification.md` (테스트 케이스 상세)
- PRD: `.jjiban/projects/jjiban/prd.md` (원본 요구사항)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-04-03)

---

<!--
Author: Claude (System Architect)
Template Version: 1.0.0
Created: 2025-12-15
Purpose: Requirements → Design → Implementation → Test traceability
Coverage: 100% requirements, 100% functions, ≥80% code coverage
-->
