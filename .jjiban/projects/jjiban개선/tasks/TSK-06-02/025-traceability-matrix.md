# 요구사항 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **목적**: PRD → 기본설계 → 상세설계 → 테스트 4단계 양방향 추적
>
> **참조**: 이 문서는 `020-detail-design.md`와 `026-test-specification.md`와 함께 사용됩니다.

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Gantt 차트 의존성 화살표 |
| 상세설계 참조 | `020-detail-design.md` |
| 테스트 명세 참조 | `026-test-specification.md` |
| 작성일 | 2025-12-17 |
| 작성자 | Claude Code |

---

## 1. 기능 요구사항 추적 (FR → 설계 → 테스트)

> PRD → 기본설계 → 상세설계 → 테스트케이스 매핑

| 요구사항 ID | PRD 섹션 | 기본설계 섹션 | 상세설계 섹션 | 단위 테스트 | E2E 테스트 | 매뉴얼 TC | 상태 |
|-------------|----------|--------------|--------------|-------------|------------|-----------|------|
| FR-001 | 11 | 2.1 | 5.1, 8.1 | UT-001, UT-002 | E2E-001 | TC-001 | 설계완료 |
| FR-002 | 11 | 2.1, 3.4 | 7.1, 8.1 | UT-003, UT-004 | E2E-001 | TC-001 | 설계완료 |
| FR-003 | 11 | 5.1 | 7.1, 12.2 | UT-005 | E2E-002 | TC-002 | 설계완료 |
| FR-004 | 11 | 6.1 | 9.3, 9.4 | UT-006 | E2E-003 | TC-003 | 설계완료 |
| FR-005 | 11 | 3.4 | 7.1 | UT-004 | E2E-001 | TC-001 | 설계완료 |

### 1.1 요구사항별 상세 매핑

#### FR-001: Frappe Gantt Task 바 위에 SVG 화살표 렌더링

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11 | 의존관계 그래프 시각화 - Gantt 차트 화살표 |
| 기본설계 | 010-basic-design.md | 2.1 | 기능 요구사항 정의 |
| 상세설계 | 020-detail-design.md | 5.1 | GanttDependencyOverlay.vue 역할 정의 |
| 상세설계 | 020-detail-design.md | 8.1 | 화살표 렌더링 프로세스 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-001, UT-002 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001 |

**구현 요약**:
- GanttDependencyOverlay.vue 컴포넌트가 SVG 오버레이 레이어 생성
- position: absolute로 Gantt 차트 위에 겹침
- z-index: 10으로 Task 바 위에 표시

#### FR-002: 의존관계 데이터(depends 필드) 파싱 및 화살표 생성

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11 | 의존관계 데이터 시각화 |
| 기본설계 | 010-basic-design.md | 2.1, 3.4 | 데이터 흐름, 화살표 경로 계산 알고리즘 |
| 상세설계 | 020-detail-design.md | 7.1 | useGanttDependencies.buildGanttArrows() |
| 상세설계 | 020-detail-design.md | 8.1 | 데이터 로드 및 좌표 계산 프로세스 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-003, UT-004 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001 |

**구현 요약**:
- useDependencyGraph.buildGraphData() 재사용 (depends 필드 파싱)
- useGanttDependencies.buildGanttArrows()로 좌표 변환
- DOM 쿼리로 Task 바 위치 추출
- calculateArrowPath()로 SVG 경로 생성

#### FR-003: Task 상태별 화살표 색상 구분 (완료/진행중)

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11 | 상태 기반 시각적 피드백 |
| 기본설계 | 010-basic-design.md | 5.1 | 화살표 스타일 설계 - 색상 체계 |
| 상세설계 | 020-detail-design.md | 7.1 | getArrowStatus() 함수 |
| 상세설계 | 020-detail-design.md | 12.2 | CSS 상태별 색상 클래스 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-005 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-002 |

**구현 요약**:
- getArrowStatus() 함수로 source/target Task 상태 기반 ArrowStatus 결정
- CSS 클래스: .gantt-arrow-completed (녹색), .gantt-arrow-active (파랑), .gantt-arrow-pending (회색)
- main.css 변수 사용: var(--color-success), var(--color-primary), var(--color-text-muted)

#### FR-004: 화살표 호버 시 source/target Task 하이라이트

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11 | 인터랙티브 시각화 |
| 기본설계 | 010-basic-design.md | 6.1 | 화살표 호버 동작 |
| 상세설계 | 020-detail-design.md | 9.3 | GanttDependencyOverlay Events 정의 |
| 상세설계 | 020-detail-design.md | 9.4 | hoveredArrowId 로컬 상태 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-006 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-003 |

**구현 요약**:
- @mouseenter/@mouseleave 이벤트로 hoveredArrowId 상태 업데이트
- arrowHover 이벤트 emit으로 부모 컴포넌트에 알림
- CSS 클래스 .gantt-arrow-highlighted 적용 (노란색, 두께 3px)
- PrimeVue Tooltip 표시 (Task 정보)

#### FR-005: 계단식 경로로 여러 화살표 충돌 방지

| 설계 단계 | 문서 | 섹션 | 구현 항목 |
|----------|------|------|----------|
| PRD | prd.md | 11 | 가독성 향상 - 충돌 방지 |
| 기본설계 | 010-basic-design.md | 3.4 | 화살표 경로 계산 알고리즘 |
| 상세설계 | 020-detail-design.md | 7.1 | calculateArrowPath() 함수 |
| 단위 테스트 | 026-test-specification.md | 2.1 | UT-004 |
| E2E 테스트 | 026-test-specification.md | 3.1 | E2E-001 |

**구현 요약**:
- SVG path 명령어: `M x1,y1 H x2 V y2 H x3` (수평-수직-수평)
- 중간 지점 x2 = (x1 + x3) / 2로 계산
- 겹치는 화살표는 Y 오프셋 자동 조정 (+5px 간격)

---

## 2. 비기능 요구사항 추적 (NFR → 구현 → 검증)

| 요구사항 ID | PRD 출처 | 기본설계 섹션 | 구현 위치(개념) | 단위 테스트 | E2E 테스트 | 검증 방법 | 상태 |
|-------------|----------|--------------|-----------------|-------------|------------|-----------|------|
| NFR-001 | 11 | 8.1 | useGanttDependencies | UT-007 | E2E-004 | 성능 벤치마크 | 설계완료 |
| NFR-002 | 11 | 6.3, 8.1 | GanttDependencyOverlay | - | E2E-005 | 줌/팬 동기화 테스트 | 설계완료 |
| NFR-003 | 11 | 4 | SVG 표준 활용 | - | E2E-006 | 브라우저 호환성 테스트 | 설계완료 |
| NFR-004 | 11 | 9.5 | ARIA 속성 | - | E2E-007 | 접근성 자동 검증 | 설계완료 |

### 2.1 비기능 요구사항별 상세 매핑

#### NFR-001: 화살표 렌더링 성능 (100개 Task < 100ms)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 100개 Task 프로젝트에서 화살표 렌더링 시간 < 100ms |
| **기본설계 표현** | 렌더링 최적화 전략: 가상화, 캐싱, 디바운싱 |
| **구현 위치** | useGanttDependencies.buildGanttArrows() |
| **검증 방법** | 단위 테스트에서 performance.now() 측정, E2E에서 Lighthouse 성능 검증 |
| **관련 테스트** | UT-007, E2E-004 |

#### NFR-002: Gantt 차트 줌/팬 시 화살표 동기화

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 줌/팬 동작 시 화살표 위치가 즉시 갱신되어야 함 |
| **기본설계 표현** | 줌/팬 이벤트 리스너, SVG 뷰포트 변환 행렬 업데이트 |
| **구현 위치** | GanttDependencyOverlay.vue (ResizeObserver) |
| **검증 방법** | E2E 테스트에서 줌 액션 후 화살표 위치 검증 |
| **관련 테스트** | E2E-005 |

#### NFR-003: 브라우저 호환성 (SVG 1.1 지원 브라우저)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 주요 브라우저 (Chrome, Firefox, Safari, Edge)에서 정상 동작 |
| **기본설계 표현** | 표준 SVG 1.1 사용, 벤더 프리픽스 불필요 |
| **구현 위치** | SVG 렌더링 템플릿 |
| **검증 방법** | Playwright에서 Chromium/Firefox/Webkit 크로스 브라우저 테스트 |
| **관련 테스트** | E2E-006 |

#### NFR-004: 접근성 (ARIA 라벨, 스크린 리더 지원)

| 구분 | 내용 |
|------|------|
| **PRD 원문** | 화살표에 title 속성으로 설명 제공 |
| **기본설계 표현** | ARIA 속성, 키보드 네비게이션, 포커스 인디케이터 |
| **구현 위치** | GanttDependencyOverlay.vue SVG path 요소 |
| **검증 방법** | Playwright axe-core 통합으로 WCAG AA 자동 검증 |
| **관련 테스트** | E2E-007 |

---

## 3. 테스트 역추적 매트릭스

> 테스트 결과 → 요구사항 역추적용 (build/verify 단계 결과서 생성 시 활용)

| 테스트 ID | 테스트 유형 | 검증 대상 요구사항 | 검증 대상 비기능 요구사항 | 상태 |
|-----------|------------|-------------------|-------------------------|------|
| UT-001 | 단위 | FR-001 | - | 미실행 |
| UT-002 | 단위 | FR-001 | - | 미실행 |
| UT-003 | 단위 | FR-002 | - | 미실행 |
| UT-004 | 단위 | FR-002, FR-005 | - | 미실행 |
| UT-005 | 단위 | FR-003 | - | 미실행 |
| UT-006 | 단위 | FR-004 | - | 미실행 |
| UT-007 | 단위 | - | NFR-001 | 미실행 |
| E2E-001 | E2E | FR-001, FR-002, FR-005 | - | 미실행 |
| E2E-002 | E2E | FR-003 | - | 미실행 |
| E2E-003 | E2E | FR-004 | - | 미실행 |
| E2E-004 | E2E | - | NFR-001 | 미실행 |
| E2E-005 | E2E | - | NFR-002 | 미실행 |
| E2E-006 | E2E | - | NFR-003 | 미실행 |
| E2E-007 | E2E | - | NFR-004 | 미실행 |
| TC-001 | 매뉴얼 | FR-001, FR-002, FR-005 | - | 미실행 |
| TC-002 | 매뉴얼 | FR-003 | - | 미실행 |
| TC-003 | 매뉴얼 | FR-004 | - | 미실행 |

---

## 4. 컴포넌트 추적

> 기본설계 컴포넌트 → 상세설계 구현 매핑

| 기본설계 컴포넌트 | 상세설계 파일 | 주요 책임 | 관련 요구사항 |
|------------------|--------------|----------|--------------|
| GanttDependencyOverlay.vue | app/components/wbs/gantt/GanttDependencyOverlay.vue | SVG 화살표 렌더링, 이벤트 처리 | FR-001, FR-004 |
| useGanttDependencies | app/composables/useGanttDependencies.ts | 좌표 변환, 경로 계산 | FR-002, FR-005 |
| useDependencyGraph (재사용) | app/composables/useDependencyGraph.ts | 의존관계 데이터 추출 | FR-002 |

---

## 5. 타입 추적

> 기본설계 데이터 구조 → 상세설계 TypeScript 타입 매핑

| 기본설계 데이터 구조 | 상세설계 타입 | 파일 | 용도 |
|---------------------|--------------|------|------|
| 화살표 데이터 | GanttArrow | types/gantt.ts | SVG 화살표 렌더링 데이터 |
| 좌표 정보 | GanttCoordinate | types/gantt.ts | X, Y 좌표 표현 |
| Task 경계 | GanttTaskBounds | types/gantt.ts | Task 바 위치 정보 |
| 화살표 상태 | ArrowStatus | types/gantt.ts | completed/active/pending/error |
| 의존관계 엣지 (재사용) | TaskEdge | types/graph.ts | 의존관계 source/target |

---

## 6. CSS 클래스 추적

> UI 설계 스타일 → main.css 클래스 매핑

| UI 설계 스타일 | CSS 클래스 | 용도 | 관련 요구사항 |
|---------------|-----------|------|--------------|
| 화살표 기본 스타일 | .gantt-arrow | 공통 화살표 스타일 | FR-001 |
| 완료 상태 화살표 | .gantt-arrow-completed | 녹색 화살표 | FR-003 |
| 진행중 상태 화살표 | .gantt-arrow-active | 파랑 화살표 | FR-003 |
| 대기 상태 화살표 | .gantt-arrow-pending | 회색 화살표 | FR-003 |
| 에러 상태 화살표 | .gantt-arrow-error | 빨강 점선 화살표 | FR-003 |
| 하이라이트 화살표 | .gantt-arrow-highlighted | 노랑 화살표 (호버 시) | FR-004 |
| 비활성 화살표 | .gantt-arrow-dimmed | 흐린 화살표 | FR-004 |
| SVG 오버레이 컨테이너 | .gantt-arrows-overlay | SVG 레이어 배치 | FR-001 |

---

## 7. 추적성 검증 요약

### 7.1 커버리지 통계

| 구분 | 총 항목 | 매핑 완료 | 미매핑 | 커버리지 |
|------|---------|----------|--------|---------|
| 기능 요구사항 (FR) | 5 | 5 | 0 | 100% |
| 비기능 요구사항 (NFR) | 4 | 4 | 0 | 100% |
| 단위 테스트 (UT) | 7 | 7 | 0 | 100% |
| E2E 테스트 | 7 | 7 | 0 | 100% |
| 매뉴얼 테스트 (TC) | 3 | 3 | 0 | 100% |
| 컴포넌트 | 3 | 3 | 0 | 100% |
| 타입 정의 | 5 | 5 | 0 | 100% |
| CSS 클래스 | 8 | 8 | 0 | 100% |

### 7.2 미매핑 항목

**없음** - 모든 요구사항이 설계 및 테스트에 매핑되었습니다.

### 7.3 추적성 품질 지표

| 지표 | 목표 | 실제 | 평가 |
|------|------|------|------|
| 요구사항 → 설계 매핑률 | 100% | 100% | ✅ 통과 |
| 설계 → 테스트 매핑률 | 100% | 100% | ✅ 통과 |
| 양방향 추적 가능성 | 100% | 100% | ✅ 통과 |
| 고아 요구사항 (orphan) | 0개 | 0개 | ✅ 통과 |
| 고아 테스트 (orphan) | 0개 | 0개 | ✅ 통과 |

---

## 8. 변경 이력 추적

> 향후 요구사항 변경 시 영향 범위 분석용

| 변경 ID | 변경일 | 요구사항 | 영향 받는 설계 | 영향 받는 테스트 | 상태 |
|---------|--------|----------|---------------|-----------------|------|
| - | - | - | - | - | - |

**참고**: 요구사항 변경 발생 시 이 섹션에 기록하여 영향 범위를 추적합니다.

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 기본설계: `010-basic-design.md`
- UI 설계: `011-ui-design.md`
- PRD: `.jjiban/projects/jjiban개선/prd.md` (섹션 11)
- TRD: `.jjiban/projects/jjiban개선/trd.md`

---

<!--
author: Claude Code
Template Version: 1.0.0
Last Updated: 2025-12-17
-->
