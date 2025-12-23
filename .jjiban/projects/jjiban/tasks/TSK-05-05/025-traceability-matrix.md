# 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-16

> **목적**
> * 요구사항 → 설계 → 구현 → 테스트 간 추적성 확보
> * 누락된 요구사항 및 미구현 기능 식별
> * 품질 보증 및 회귀 테스트 기준 제공

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-05 |
| Task명 | WP/ACT Detail Panel |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude (System Architect) |

---

## 1. 추적성 매트릭스

### 1.1 요구사항 → 설계 → 구현 → 테스트 매핑

| 요구사항 ID | 요구사항 내용 | 설계 참조 | 구현 대상 | 단위 테스트 | E2E 테스트 | 상태 |
|------------|-------------|----------|---------|-----------|-----------|------|
| FR-001 | WP/ACT 선택 시 기본 정보 표시 (ID, 제목, 일정, 진행률) | 기본설계 §5.2.3<br>상세설계 §2.3 | WpActBasicInfo.vue | WpActBasicInfo.test.ts | wp-act-detail-panel.spec.ts<br>(시나리오 1) | ✅ 설계 완료 |
| FR-002 | 하위 노드 목록 표시 (WP의 ACT/Task, ACT의 Task) | 기본설계 §5.2.5<br>상세설계 §2.5 | WpActChildren.vue | WpActChildren.test.ts | wp-act-detail-panel.spec.ts<br>(시나리오 2) | ✅ 설계 완료 |
| FR-003 | 상태별 카운트 표시 (Todo/Design/Detail/Implement/Verify/Done) | 기본설계 §5.2.4<br>상세설계 §2.4 | WpActProgress.vue<br>calculateProgressStats | wbsProgress.test.ts | wp-act-detail-panel.spec.ts<br>(시나리오 4) | ✅ 설계 완료 |
| FR-004 | 진행률 시각화 (완료/진행/대기 비율) | 기본설계 §5.2.4<br>상세설계 §2.4 | WpActProgress.vue | WpActProgress.test.ts | wp-act-detail-panel.spec.ts<br>(시나리오 4) | ✅ 설계 완료 |
| FR-005 | 하위 노드 클릭 시 선택 변경 및 상세 패널 업데이트 | 기본설계 §5.3.2<br>상세설계 §2.2, §2.5 | WpActChildren.vue<br>WpActDetailPanel.vue | WpActChildren.test.ts | wp-act-detail-panel.spec.ts<br>(시나리오 2) | ✅ 설계 완료 |
| FR-006 | wbs.vue에서 노드 타입별 패널 분기 처리 | 기본설계 §7<br>상세설계 §2.1, §5 | NodeDetailPanel.vue<br>wbs.vue | - | wp-act-detail-panel.spec.ts<br>(시나리오 1, 2) | ✅ 설계 완료 |
| NFR-001 | 노드 선택 응답 시간 < 100ms | 기본설계 §2.2<br>상세설계 §9 | selectionStore 확장 | selection.test.ts | 성능 테스트 | ✅ 설계 완료 |
| NFR-002 | 하위 노드 카운팅 성능 < 50ms | 기본설계 §2.2<br>상세설계 §4.1.3 | calculateProgressStats | wbsProgress.test.ts<br>(성능 테스트) | - | ✅ 설계 완료 |
| NFR-003 | 컴포넌트 재사용성 | 기본설계 §5.1<br>상세설계 §2 | WP/ACT 공통 컴포넌트 | - | - | ✅ 설계 완료 |
| NFR-004 | 타입 안전성 | 기본설계 §2.2<br>상세설계 §1, §7 | TypeScript 타입 정의 | 타입 체크 | - | ✅ 설계 완료 |

---

## 2. 컴포넌트별 추적성

### 2.1 NodeDetailPanel

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| FR-006 | 분기 로직 설계<br>(기본설계 §5.1) | `isWpOrActSelected` computed<br>`selectedNode` computed<br>Template 분기 | E2E: 시나리오 1, 2 |

### 2.2 WpActDetailPanel

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| FR-001, FR-002, FR-003, FR-004 | 컨테이너 조정<br>(기본설계 §5.2.2) | `progressStats` computed<br>`handleNodeSelect` method<br>하위 컴포넌트 통합 | E2E: 시나리오 1, 2 |

### 2.3 WpActBasicInfo

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| FR-001 | 기본 정보 표시<br>(기본설계 §5.2.3<br>화면설계 §2.3) | `nodeTypeLabel` computed<br>`nodeTypeIcon` computed<br>`scheduleText` computed<br>`progressBarClass` computed | 단위: WpActBasicInfo.test.ts<br>E2E: 시나리오 1 |

### 2.4 WpActProgress

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| FR-003, FR-004 | 진행률 시각화<br>(기본설계 §5.2.4<br>화면설계 §2.4) | `completedPercentage` computed<br>`inProgressPercentage` computed<br>`todoPercentage` computed<br>`getStatusSeverity` method | 단위: WpActProgress.test.ts<br>E2E: 시나리오 4 |

### 2.5 WpActChildren

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| FR-002, FR-005 | 하위 노드 목록<br>(기본설계 §5.2.5<br>화면설계 §2.5) | `handleChildClick` method<br>`getNodeTypeIcon` method<br>`getStatusSeverity` method<br>`select` emit | 단위: WpActChildren.test.ts<br>E2E: 시나리오 2 |

---

## 3. 유틸리티 함수 추적성

### 3.1 calculateProgressStats

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| FR-003, NFR-002 | 재귀 탐색 알고리즘<br>(상세설계 §4.1.2) | `collectTasks` 내부 함수<br>상태별 카운팅 로직 | 단위: wbsProgress.test.ts<br>(5개 테스트 케이스) |

**테스트 커버리지**:
- 빈 WP 노드
- 완료된 Task만 있는 WP
- 다양한 상태 혼합
- 중첩된 ACT 구조
- 성능 테스트 (100+ Task)

---

## 4. 스토어 확장 추적성

### 4.1 selectionStore

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| FR-006, NFR-001 | Computed 확장<br>(상세설계 §3.1) | `isWpOrActSelected` computed<br>`selectedNode` computed | 통합: selection.test.ts<br>(4개 테스트 케이스) |

**테스트 커버리지**:
- WP 선택 시 `isWpOrActSelected === true`
- ACT 선택 시 `isWpOrActSelected === true`
- Task 선택 시 `isWpOrActSelected === false`
- `selectedNode` 반환 정확성

### 4.2 wbsStore

| 요구사항 | 설계 요소 | 구현 요소 | 테스트 |
|---------|----------|---------|-------|
| NFR-001 | 기존 `getNode` 메서드 활용<br>(상세설계 §3.2) | `flatNodes.get(id)` | 기존 테스트 활용 |

---

## 5. UI 추적성

### 5.1 화면설계 → CSS 클래스

| 화면 요소 | 화면설계 참조 | CSS 클래스 | 테스트 |
|----------|-------------|-----------|-------|
| WP/ACT 컨테이너 | §2.2 | `.wp-act-detail-panel`<br>`.wp-act-detail-content` | E2E: Visual 테스트 |
| 기본 정보 필드 | §2.3 | `.wp-act-basic-info .field` | E2E: 시나리오 1 |
| 다단계 ProgressBar | §2.4 | `.progress-segments`<br>`.progress-segment-completed`<br>`.progress-segment-inprogress`<br>`.progress-segment-todo` | E2E: 시나리오 4 |
| 하위 노드 아이템 | §2.5 | `.child-item`<br>`.child-header`<br>`.child-info` | E2E: 시나리오 2 |
| 호버 효과 | §2.5.4 | `.child-item:hover` | E2E: Interaction 테스트 |
| 포커스 표시 | §2.5.4 | `.child-item:focus` | E2E: Accessibility 테스트 |

---

## 6. 접근성 추적성

### 6.1 ARIA 속성 → 테스트

| ARIA 속성 | 설계 참조 | 적용 컴포넌트 | 테스트 |
|----------|----------|-------------|-------|
| `role="region"` | 상세설계 §8.1 | NodeDetailPanel<br>WpActDetailPanel | E2E: ARIA 검증 |
| `role="list"` | 상세설계 §8.1 | WpActChildren | E2E: ARIA 검증 |
| `role="listitem"` | 상세설계 §8.1 | WpActChildren 아이템 | E2E: ARIA 검증 |
| `role="progressbar"` | 상세설계 §8.1 | WpActProgress | E2E: ARIA 검증 |
| `tabindex="0"` | 상세설계 §8.2 | child-item | E2E: 키보드 네비게이션 |
| `@keydown.enter` | 상세설계 §8.2 | child-item | E2E: 키보드 네비게이션 |

### 6.2 키보드 네비게이션 테스트

| 키 조합 | 동작 | 테스트 시나리오 |
|--------|------|-------------|
| Tab | 다음 노드로 포커스 이동 | E2E: 시나리오 6 |
| Shift+Tab | 이전 노드로 포커스 이동 | E2E: 시나리오 6 |
| Enter | 선택된 노드 활성화 | E2E: 시나리오 6<br>단위: WpActChildren.test.ts |

---

## 7. 성능 추적성

### 7.1 성능 요구사항 → 최적화 전략

| NFR ID | 목표 | 최적화 전략 | 측정 방법 | 테스트 |
|--------|------|-----------|---------|-------|
| NFR-001 | 노드 선택 < 100ms | `flatNodes` Map O(1) 검색<br>Vue Computed 캐싱 | Performance API | E2E: 성능 테스트 |
| NFR-002 | 카운팅 < 50ms | 재귀 Early Return<br>O(N) 알고리즘 | Performance API | 단위: wbsProgress.test.ts |

### 7.2 성능 테스트 시나리오

| 시나리오 | 데이터 규모 | 측정 지표 | 목표 | 테스트 파일 |
|---------|-----------|---------|------|----------|
| 노드 선택 | 1000개 노드 | selectNode 실행 시간 | < 100ms | selection.perf.test.ts |
| 진행률 계산 | 200개 Task | calculateProgressStats 실행 시간 | < 50ms | wbsProgress.perf.test.ts |
| 패널 렌더링 | 100개 하위 노드 | 컴포넌트 마운트 시간 | < 200ms | E2E 성능 테스트 |

---

## 8. 에러 처리 추적성

### 8.1 에러 케이스 → 처리 방안

| 에러 케이스 | 설계 참조 | 구현 위치 | 테스트 |
|-----------|----------|---------|-------|
| `selectedNode === null` | 상세설계 §7.1 | NodeDetailPanel computed | 단위: NodeDetailPanel.test.ts |
| `children.length === 0` | 상세설계 §7.1 | WpActChildren template | 단위: WpActChildren.test.ts<br>E2E: 시나리오 5 |
| `getNode() === undefined` | 상세설계 §7.2 | selectionStore computed | 통합: selection.test.ts |
| `progress === undefined` | 상세설계 §7.1 | WpActBasicInfo computed | 단위: WpActBasicInfo.test.ts |
| `taskCount === undefined` | 상세설계 §7.1 | WpActChildren template | 단위: WpActChildren.test.ts |

---

## 9. 회귀 테스트 매트릭스

### 9.1 기존 기능 영향 분석

| 기존 기능 | 영향 여부 | 영향 범위 | 회귀 테스트 |
|---------|----------|---------|-----------|
| TaskDetailPanel | 없음 | NodeDetailPanel이 분기 처리 | 기존 E2E 테스트 실행 |
| Task 선택 동작 | 없음 | 기존 로직 유지 | task-detail-panel.spec.ts |
| wbs.vue 우측 패널 | 변경 | TaskDetailPanel → NodeDetailPanel | E2E: 시나리오 1, 2 |
| selectionStore | 확장 | Computed 속성 추가<br>(기존 기능 유지) | selection.test.ts (전체) |
| wbsStore | 없음 | 기존 메서드 활용 | wbs.test.ts (전체) |

### 9.2 회귀 테스트 체크리스트

- [ ] Task 선택 시 TaskDetailPanel 정상 렌더링
- [ ] Task 상세 정보 로드 정상 동작
- [ ] Task 편집 기능 정상 동작
- [ ] Task 상태 전이 정상 동작
- [ ] wbs.vue 로딩/에러 상태 처리 정상
- [ ] selectionStore 기존 메서드 정상 동작
- [ ] wbsStore 기존 메서드 정상 동작

---

## 10. 테스트 커버리지 목표

### 10.1 단위 테스트 커버리지

| 대상 | 목표 커버리지 | 측정 기준 | 상태 |
|------|------------|---------|------|
| calculateProgressStats | 100% | 라인, 브랜치 | 📝 테스트 명세 작성 완료 |
| WpActBasicInfo | 90% | 라인, 브랜치 | 📝 테스트 명세 작성 완료 |
| WpActProgress | 90% | 라인, 브랜치 | 📝 테스트 명세 작성 완료 |
| WpActChildren | 95% | 라인, 브랜치 | 📝 테스트 명세 작성 완료 |
| selectionStore 확장 | 100% | 라인, 브랜치 | 📝 테스트 명세 작성 완료 |

### 10.2 E2E 테스트 커버리지

| 시나리오 | 커버하는 요구사항 | 상태 |
|---------|---------------|------|
| 시나리오 1: WP 선택 및 정보 표시 | FR-001, FR-006 | 📝 명세 작성 완료 |
| 시나리오 2: 하위 노드 클릭 및 전환 | FR-002, FR-005, FR-006 | 📝 명세 작성 완료 |
| 시나리오 3: ACT 선택 및 정보 표시 | FR-001, FR-006 | 📝 명세 작성 완료 |
| 시나리오 4: 진행률 시각화 검증 | FR-003, FR-004 | 📝 명세 작성 완료 |
| 시나리오 5: 빈 WP/ACT 빈 상태 메시지 | FR-002 | 📝 명세 작성 완료 |
| 시나리오 6: 키보드 네비게이션 | FR-005 | 📝 명세 작성 완료 |

---

## 11. 변경 이력 추적

### 11.1 문서 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|-------|
| 1.0 | 2025-12-16 | 초기 작성 | Claude |

### 11.2 요구사항 변경 이력

| 변경일 | 요구사항 ID | 변경 내용 | 영향 범위 |
|-------|-----------|----------|----------|
| - | - | 변경 없음 | - |

---

## 12. 검증 체크리스트

### 12.1 설계 검증

- [x] 모든 기능 요구사항(FR)이 설계에 반영됨
- [x] 모든 비기능 요구사항(NFR)이 설계에 반영됨
- [x] 각 요구사항에 대해 테스트 케이스가 정의됨
- [x] 에러 케이스에 대한 처리 방안이 설계됨
- [x] 성능 요구사항에 대한 최적화 전략이 정의됨

### 12.2 구현 준비

- [x] 타입 정의가 완료됨
- [x] 컴포넌트 인터페이스가 정의됨
- [x] 메서드 시그니처가 정의됨
- [x] CSS 클래스가 정의됨
- [x] 테스트 명세가 작성됨

### 12.3 테스트 준비

- [x] 단위 테스트 시나리오 정의
- [x] 통합 테스트 시나리오 정의
- [x] E2E 테스트 시나리오 정의
- [x] 회귀 테스트 체크리스트 작성
- [x] 성능 테스트 시나리오 정의

---

## 13. 참고 자료

### 13.1 관련 문서

- 기본설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/010-basic-design.md`
- 화면설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/011-ui-design.md`
- 상세설계: `.jjiban/projects/jjiban/tasks/TSK-05-05/020-detail-design.md`
- 테스트 명세: `.jjiban/projects/jjiban/tasks/TSK-05-05/026-test-specification.md`

### 13.2 외부 참조

- PRD 섹션 6.3: Task Detail Panel
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-05-05)

---

**문서 버전**: 1.0
**최종 수정**: 2025-12-16
**다음 단계**: 테스트 명세 (026-test-specification.md), 구현 (030-implementation.md)
