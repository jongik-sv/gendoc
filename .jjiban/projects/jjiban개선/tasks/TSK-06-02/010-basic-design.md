# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Gantt 차트 의존성 화살표 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 섹션 11 (의존관계 그래프 시각화) |
| TRD | `.jjiban/projects/jjiban개선/trd.md` | 전체 |
| 선행 Task | TSK-06-01 | DependencyGraph.client.vue 구현 |

---

## 1. 목적 및 범위

### 1.1 목적

Gantt 차트에 Task 간 의존관계를 시각적 화살표로 표현하여 프로젝트 일정과 의존성을 동시에 파악할 수 있도록 합니다.

**핵심 가치:**
- 일정 시간축 기반 의존관계 시각화
- Task 완료 상태에 따른 화살표 색상 구분
- 호버 상호작용으로 연결된 Task 하이라이트

### 1.2 범위

**포함 범위**:
- Frappe Gantt 차트에 SVG 화살표 오버레이 렌더링
- Task 간 의존관계를 시간축 좌표로 변환
- 화살표 스타일링 (완료/진행중 상태별 색상)
- 화살표 호버 시 연결된 Task 하이라이트
- 의존성 라인의 충돌 방지 (계단식 경로)

**제외 범위**:
- Gantt 차트 기본 구현 → 별도 Task (TSK-08-05 또는 유사)
- 의존관계 편집 기능 → wbs.md 직접 수정으로 대체
- 순환 의존성 검증 → TSK-06-01에서 이미 구현됨

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | Frappe Gantt Task 바 위에 SVG 화살표 렌더링 | High | 11 |
| FR-002 | 의존관계 데이터(depends 필드) 파싱 및 화살표 생성 | High | 11 |
| FR-003 | Task 상태별 화살표 색상 구분 (완료/진행중) | Medium | 11 |
| FR-004 | 화살표 호버 시 source/target Task 하이라이트 | Medium | 11 |
| FR-005 | 계단식 경로로 여러 화살표 충돌 방지 | Low | 11 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 화살표 렌더링 성능 | 100개 Task < 100ms |
| NFR-002 | Gantt 차트 줌/팬 시 화살표 동기화 | 즉시 갱신 |
| NFR-003 | 브라우저 호환성 | SVG 1.1 지원 브라우저 |
| NFR-004 | 접근성 | 화살표 title 속성으로 설명 제공 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

**기존 구현 활용 전략:**
- TSK-06-01에서 구현한 `useDependencyGraph` composable 재사용
- Frappe Gantt 인스턴스와 독립적으로 SVG 레이어 관리
- Vue Flow의 Edge 렌더링 방식을 Frappe Gantt에 맞게 변환

**레이어 구조:**
```
┌─────────────────────────────────────────┐
│ Gantt 차트 컨테이너                      │
│  ┌───────────────────────────────────┐  │
│  │ Frappe Gantt Canvas (Task 바)    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ SVG Overlay (의존성 화살표)       │  │ ← 신규
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| `GanttDependencyOverlay.vue` | SVG 화살표 렌더링 | Task 좌표 추출, 화살표 경로 계산, 이벤트 처리 |
| `useGanttDependencies` | 의존성 데이터 변환 | Gantt Task 위치 → SVG 좌표 매핑 |
| `GanttChart.vue` | Frappe Gantt 통합 | Gantt 인스턴스 + 화살표 오버레이 통합 |

### 3.3 데이터 흐름

```
[1] wbsStore.flatNodes
      ↓
[2] useDependencyGraph.buildGraphData()
      ↓ (depends 필드 파싱)
[3] TaskEdge[] (source, target)
      ↓
[4] Frappe Gantt 인스턴스
      ↓ (Task 바 위치 계산)
[5] useGanttDependencies.calculateArrowPath()
      ↓ (SVG 좌표 변환)
[6] GanttDependencyOverlay.vue
      ↓ (SVG <path> 렌더링)
[7] 화면에 화살표 표시
```

### 3.4 화살표 경로 계산 알고리즘

**기본 방식: 계단식 경로 (Step Path)**

```
Task A [====]
            └──→ (수평) ──┐
                          ↓ (수직)
                    Task B [====]
```

**계산 단계:**
1. Source Task 바의 오른쪽 중앙 좌표 추출
2. Target Task 바의 왼쪽 중앙 좌표 추출
3. SVG path 생성: `M x1,y1 H x2 V y2 H x3`
   - M: 시작점 (source 오른쪽 끝)
   - H: 수평선 (중간 지점까지)
   - V: 수직선 (target 높이까지)
   - H: 수평선 (target 왼쪽 끝까지)

**화살표 마커:**
- SVG `<defs>` 섹션에 화살촉 정의
- `marker-end` 속성으로 경로 끝에 표시

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 화살표 렌더링 방식 | Canvas, SVG, CSS | SVG | 확대/축소 시에도 선명, 이벤트 처리 용이 |
| 경로 스타일 | 직선, 곡선, 계단식 | 계단식 | Gantt 그리드 정렬, 충돌 최소화 |
| 좌표 추출 방법 | Frappe API, DOM 쿼리 | DOM 쿼리 | Frappe Gantt API 제한적, 실제 렌더링 위치 보장 |
| 상태별 색상 | 고정, 동적 | 동적 | Task 상태 변경 시 즉시 반영 |

**Frappe Gantt vs Vue Flow 차이점:**
- Frappe Gantt: 시간축 기반 수평 배치, Task 바 위치 계산
- Vue Flow: 위상정렬 기반 레벨 배치, 노드 드래그 가능
- 공통점: 의존관계 데이터는 동일 (depends 필드)

---

## 5. 화살표 스타일 설계

### 5.1 색상 체계

| Task 상태 | 화살표 색상 | HEX | 의미 |
|----------|------------|-----|------|
| 완료 ([xx]) | 녹색 | `#22c55e` | 완료된 의존관계 |
| 진행중 ([im], [vf]) | 파랑 | `#3b82f6` | 활성 의존관계 |
| 대기 ([bd], [dd]) | 회색 | `#6b7280` | 대기 중 의존관계 |
| 에러 (순환) | 빨강 | `#ef4444` | 순환 의존성 경고 |

**CSS 클래스 (main.css):**
```css
.gantt-arrow-completed { stroke: #22c55e; }
.gantt-arrow-active { stroke: #3b82f6; }
.gantt-arrow-pending { stroke: #6b7280; }
.gantt-arrow-error { stroke: #ef4444; }
```

### 5.2 호버 스타일

| 상태 | 스타일 | 효과 |
|------|--------|------|
| 기본 | stroke-width: 2 | 기본 화살표 |
| 호버 | stroke-width: 3, opacity: 1 | 두껍게 강조 |
| 하이라이트 | stroke: #fbbf24 (노란색) | 관련 Task 선택 시 |

### 5.3 화살표 마커 (SVG defs)

```svg
<defs>
  <marker id="arrowhead-completed" markerWidth="10" markerHeight="10"
          refX="9" refY="3" orient="auto">
    <polygon points="0 0, 10 3, 0 6" fill="#22c55e" />
  </marker>
  <!-- 다른 상태별 마커 정의 -->
</defs>
```

---

## 6. 상호작용 설계

### 6.1 화살표 호버

**동작:**
1. 화살표에 마우스 오버
2. 화살표 두께 증가 (2 → 3px)
3. Source Task와 Target Task 바 배경색 변경 (하이라이트)
4. Tooltip 표시: "TSK-A → TSK-B"

### 6.2 Task 바 클릭

**동작:**
1. Gantt Task 바 클릭
2. 해당 Task와 연결된 모든 화살표 하이라이트
3. 연결된 Task 바 테두리 강조

### 6.3 줌/팬 동기화

**동작:**
1. Frappe Gantt 줌 또는 팬 이벤트 발생
2. SVG 뷰포트 변환 행렬 업데이트
3. 화살표 위치 재계산 및 갱신

---

## 7. Frappe Gantt 통합

### 7.1 Gantt 인스턴스 접근

**Frappe Gantt API 사용:**
```javascript
const ganttInstance = new Gantt('#gantt-container', tasks, options)

// Task 바 DOM 요소 쿼리
const taskBars = document.querySelectorAll('.bar-wrapper')
```

### 7.2 Task 좌표 추출

**방법:**
1. Task ID로 DOM 요소 선택: `document.querySelector(\`.bar-wrapper[data-id="\${taskId}"]\`)`
2. `getBoundingClientRect()` 호출하여 위치/크기 추출
3. 컨테이너 상대 좌표로 변환

### 7.3 이벤트 리스너

| 이벤트 | 핸들러 | 목적 |
|--------|--------|------|
| `date_change` | `updateArrows()` | Task 일정 변경 시 화살표 갱신 |
| `view_change` | `recalculateArrows()` | 뷰 모드 변경 (일/주/월) 시 재계산 |
| `task_click` | `highlightConnected()` | Task 선택 시 관련 화살표 강조 |

---

## 8. 성능 최적화

### 8.1 렌더링 최적화

| 기법 | 방법 | 효과 |
|------|------|------|
| 가상화 | 뷰포트 내 화살표만 렌더링 | 대규모 프로젝트 성능 향상 |
| 캐싱 | Task 좌표 캐시, 변경 시만 갱신 | 불필요한 재계산 방지 |
| 디바운싱 | 줌/팬 이벤트 100ms 디바운스 | 과도한 렌더링 방지 |

### 8.2 DOM 쿼리 최적화

- Task 바 요소를 Map에 캐싱: `Map<taskId, Element>`
- `data-id` 속성으로 직접 접근
- `querySelectorAll` 호출 최소화

---

## 9. 인수 기준

- [ ] AC-01: 의존관계가 있는 모든 Task 간에 화살표가 표시됨
- [ ] AC-02: Task 상태별로 화살표 색상이 정확하게 구분됨 (완료/진행중/대기)
- [ ] AC-03: 화살표 호버 시 연결된 Task가 하이라이트됨
- [ ] AC-04: Gantt 차트 줌/팬 시 화살표 위치가 정확하게 동기화됨
- [ ] AC-05: 100개 Task 프로젝트에서 화살표 렌더링 시간 < 100ms
- [ ] AC-06: 순환 의존성이 감지되면 빨간색 화살표로 표시됨
- [ ] AC-07: 화살표에 title 속성으로 접근성 설명이 제공됨
- [ ] AC-08: 여러 화살표가 겹치지 않도록 계단식 경로로 렌더링됨

---

## 10. 리스크 및 의존성

### 10.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| Frappe Gantt DOM 구조 변경 | High | DOM 쿼리 대신 stable API 사용, 버전 고정 |
| 대규모 프로젝트 성능 저하 | Medium | 가상화 렌더링, 화살표 개수 제한 (옵션) |
| 브라우저별 SVG 렌더링 차이 | Low | 표준 SVG 1.1 사용, 주요 브라우저 테스트 |
| Gantt 차트 미구현 | High | Frappe Gantt 기본 구현 선행 필요 |

### 10.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-06-01 | 선행 | useDependencyGraph composable 재사용 |
| TSK-08-05 (가정) | 선행 | Frappe Gantt 기본 차트 구현 필요 |
| Frappe Gantt 라이브러리 | 외부 | npm 패키지 설치 필요 |

---

## 11. Frappe Gantt 미구현 시 대안

**현재 상황 분석:**
- package.json에 Frappe Gantt 패키지 없음
- AppHeader에서 Gantt 메뉴 비활성화 (`data: { isDisabled: true }`)
- 실제 Gantt 페이지 구현 확인 필요

**대안 전략:**

### 옵션 A: Frappe Gantt 신규 도입
- 장점: 검증된 라이브러리, 빠른 구현
- 단점: 추가 의존성, 커스터마이징 제약

### 옵션 B: Vue Flow 기반 Gantt 뷰 구현
- 장점: 기존 TSK-06-01 코드 재사용, 일관된 기술 스택
- 단점: Gantt 특화 기능 직접 구현 필요

### 옵션 C: 의존성 화살표만 독립 구현
- 장점: Gantt 구현 대기 불필요
- 단점: 실제 시간축 없이 개념 증명만 가능

**권장 방안:**
1. Gantt 차트 기본 구현 상태 확인
2. 미구현 시 TSK-06-02를 TSK-08-05 (Gantt 구현) 이후로 연기
3. 또는 옵션 B로 Vue Flow 타임라인 뷰 구현 고려

---

## 12. 다음 단계

1. **Gantt 차트 구현 상태 확인**
   - `/gantt` 라우트 존재 여부 확인
   - Frappe Gantt 패키지 설치 여부 확인

2. **Gantt 미구현 시**
   - TSK-08-05 (Gantt 기본 구현) 생성 및 선행
   - 또는 Vue Flow 타임라인 뷰로 설계 변경

3. **Gantt 구현 완료 시**
   - `/wf:draft` 명령어로 상세설계 진행
   - GanttDependencyOverlay 컴포넌트 설계
   - useGanttDependencies composable 설계

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban개선/prd.md` (섹션 11)
- TRD: `.jjiban/projects/jjiban개선/trd.md`
- 선행 Task: `TSK-06-01/030-implementation.md` (DependencyGraph 구현)
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude Code
Template Version: 1.0.0
-->
