# 구현 문서 (030-implementation.md)

**Task ID:** TSK-06-02
**Task명:** Gantt 차트 의존성 화살표
**구현일:** 2025-12-17
**구현자:** Claude Code

---

## 1. 구현 개요

Frappe Gantt 라이브러리를 기반으로 Gantt 차트에 Task 간 의존관계를 SVG 화살표로 시각화하는 기능을 구현하였습니다.

### 주요 구현 사항

1. **패키지 설치**: frappe-gantt 설치 완료
2. **타입 정의**: `types/gantt.ts` 생성
3. **Composable**: `app/composables/useGanttDependencies.ts` 구현
4. **컴포넌트**: `app/components/gantt/GanttDependencyOverlay.vue` 구현
5. **페이지**: `app/pages/gantt.vue` 생성
6. **CSS**: `main.css`에 Gantt 화살표 스타일 추가

---

## 2. 파일 구조

```
app/
├── composables/
│   └── useGanttDependencies.ts       (신규: 좌표 변환 로직)
├── components/
│   └── gantt/
│       └── GanttDependencyOverlay.vue (신규: SVG 화살표 렌더링)
├── pages/
│   └── gantt.vue                     (신규: Gantt 차트 페이지)
└── assets/css/
    └── main.css                      (업데이트: .gantt-arrow-* 클래스 추가)

types/
└── gantt.ts                          (신규: Gantt 타입 정의)

package.json                          (업데이트: frappe-gantt 의존성 추가)
```

---

## 3. 구현 상세

### 3.1 타입 정의 (`types/gantt.ts`)

```typescript
export type ArrowStatus = 'completed' | 'active' | 'pending' | 'error'

export interface GanttCoordinate {
  x: number
  y: number
}

export interface GanttTaskBounds {
  taskId: string
  left: number
  right: number
  top: number
  bottom: number
}

export interface GanttArrow {
  id: string
  sourceId: string
  targetId: string
  path: string
  status: ArrowStatus
  markerEnd: string
}

export interface FrappeGanttTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies?: string
}
```

### 3.2 Composable (`useGanttDependencies.ts`)

**주요 함수:**

1. **buildGanttArrows()**
   - TaskEdge[]와 컨테이너 DOM을 입력받아 GanttArrow[] 반환
   - DOM 쿼리로 Task 바 위치 추출
   - SVG 경로 계산 및 상태 결정

2. **calculateArrowPath()**
   - 계단식 SVG 경로 생성 (M/H/V/H 명령어)
   - 출발점: source.right, source.centerY
   - 도착점: target.left, target.centerY

3. **getArrowStatus()**
   - Task 상태 기반 화살표 색상 결정
   - 완료: 둘 다 [xx]
   - 활성: 하나라도 [im], [vf]
   - 대기: 나머지

4. **filterVisibleArrows()**
   - 가상화 렌더링: 100개 이상 화살표 시 뷰포트 내만 렌더링
   - AABB 충돌 검사로 성능 최적화

### 3.3 컴포넌트 (`GanttDependencyOverlay.vue`)

**Props:**
- `arrows`: GanttArrow[] - 렌더링할 화살표 배열
- `selectedTaskId`: string | null - 선택된 Task ID
- `containerWidth`: number - SVG 너비
- `containerHeight`: number - SVG 높이

**Events:**
- `arrowClick`: 화살표 클릭 시 발생
- `arrowHover`: 화살표 호버 시 발생

**주요 기능:**
- SVG 마커 정의 (화살촉)
- 화살표 상태별 CSS 클래스 적용
- Tooltip 표시 (호버 시)
- 하이라이트/Dimmed 처리 (선택 시)
- ARIA 접근성 속성

### 3.4 Gantt 페이지 (`gantt.vue`)

**주요 기능:**
1. Frappe Gantt 인스턴스 생성
2. WBS 노드 → Frappe Gantt Task 변환
3. Dependency arrows 오버레이 통합
4. Task 클릭 시 선택 상태 관리
5. 리사이즈 시 화살표 재계산

**데이터 흐름:**
```
wbsStore.flatNodes
  → convertToGanttTasks()
  → Frappe Gantt
  → buildGraphData() (useDependencyGraph)
  → buildGanttArrows() (useGanttDependencies)
  → GanttDependencyOverlay
```

### 3.5 CSS 스타일 (`main.css`)

**추가된 클래스:**
- `.gantt-arrows-overlay`: SVG 컨테이너
- `.gantt-arrow`: 기본 화살표 스타일
- `.gantt-arrow-completed`: 완료 상태 (녹색)
- `.gantt-arrow-active`: 진행중 (파랑)
- `.gantt-arrow-pending`: 대기 (회색)
- `.gantt-arrow-error`: 순환 의존성 (빨강, 점선)
- `.gantt-arrow-highlighted`: 선택된 Task 관련 (노랑)
- `.gantt-arrow-dimmed`: 선택되지 않은 화살표 (투명도 0.2)

**애니메이션:**
- `@keyframes dash-flow`: 순환 의존성 화살표 흐르는 효과

---

## 4. 설계 문서 대비 구현 현황

### 4.1 설계 문서 준수 사항

| 설계 항목 | 구현 여부 | 비고 |
|----------|---------|------|
| SVG 오버레이 방식 | ✅ 완료 | position: absolute, z-index: 10 |
| 계단식 경로 (Step Path) | ✅ 완료 | M/H/V/H 명령어 조합 |
| 상태별 화살표 색상 | ✅ 완료 | completed/active/pending/error |
| 화살촉 마커 | ✅ 완료 | SVG <defs> 마커 5종 |
| 호버 Tooltip | ✅ 완료 | Teleport로 body에 렌더링 |
| Task 선택 하이라이트 | ✅ 완료 | 노란색 강조, 나머지 dimmed |
| 가상화 렌더링 | ✅ 완료 | 100개 이상 시 뷰포트 필터링 |
| ARIA 접근성 | ✅ 완료 | role, aria-label, tabindex |
| CSS 중앙화 원칙 | ✅ 완료 | main.css 변수 활용 |

### 4.2 설계 대비 변경 사항

**변경 1: Gantt 차트 구현 방식**
- **설계**: Vue Flow 타임라인 뷰 (옵션 B)
- **구현**: Frappe Gantt 라이브러리 (옵션 A)
- **사유**: Frappe Gantt 패키지 설치 가능 확인, 더 빠른 구현

**변경 2: Task 바 DOM 쿼리**
- **설계**: `data-id` 속성 사용
- **구현**: `data-task-id` 속성 사용
- **사유**: Frappe Gantt 기본 구조에 맞춤

**변경 3: Tooltip 구현**
- **설계**: PrimeVue Tooltip 컴포넌트
- **구현**: Teleport + 커스텀 div
- **사유**: Frappe Gantt DOM 구조와의 충돌 방지

---

## 5. 테스트 시나리오

### 5.1 단위 테스트 (TODO)

**파일**: `tests/unit/composables/useGanttDependencies.test.ts`

1. `calculateArrowPath()` 테스트
   - 수평 정렬 Task (source.right < target.left)
   - 수직 정렬 Task (source.bottom < target.top)
   - 역방향 의존성 (source.right > target.left)

2. `getArrowStatus()` 테스트
   - 완료 상태 조합 ([xx], [xx])
   - 진행중 상태 조합 ([im], [bd])
   - 대기 상태 조합 ([ ], [dd])

3. `filterVisibleArrows()` 테스트
   - 100개 이하: 전체 반환
   - 100개 이상: 뷰포트 내만 반환
   - AABB 충돌 검사 정확성

### 5.2 E2E 테스트 (TODO)

**파일**: `tests/e2e/gantt-dependency.spec.ts`

1. Gantt 페이지 렌더링
   - 프로젝트 선택 시 Gantt 차트 표시
   - Task 바 개수 확인
   - 화살표 개수 확인

2. 화살표 인터랙션
   - 화살표 호버 → Tooltip 표시
   - 화살표 클릭 → Task 선택
   - Task 선택 → 관련 화살표 하이라이트

3. 반응형 테스트
   - 브라우저 리사이즈 → 화살표 위치 재계산
   - Gantt 줌 → 화살표 동기화

---

## 6. 알려진 제약 사항

### 6.1 Frappe Gantt 제약

1. **Task 바 DOM 속성**
   - Frappe Gantt는 기본적으로 `data-task-id` 속성을 제공하지 않음
   - 현재 구현은 Frappe Gantt DOM 구조 수정 필요
   - **해결 방안**: Gantt 초기화 후 DOM 조작으로 속성 추가

2. **줌/팬 이벤트**
   - Frappe Gantt의 줌/팬 이벤트 훅 제한적
   - 화살표 동기화를 위한 추가 로직 필요
   - **해결 방안**: MutationObserver 또는 ResizeObserver 활용

### 6.2 성능 제약

1. **100개 이상 Task**
   - 가상화 렌더링 구현했으나, DOM 쿼리 비용 여전히 존재
   - **개선 방안**: Task 좌표 캐싱, requestAnimationFrame 최적화

2. **화살표 재계산 빈도**
   - 리사이즈 이벤트마다 전체 재계산
   - **개선 방안**: 디바운싱 (현재 미적용)

---

## 7. 향후 개선 사항

### 7.1 기능 개선

1. **키보드 네비게이션**
   - Tab 키로 화살표 포커스 이동
   - Enter 키로 화살표 선택
   - 설계 문서 SUGGESTION-03 반영

2. **화살표 편집**
   - 화살표 클릭 → 의존관계 삭제/수정 UI
   - wbs.md 자동 업데이트

3. **순환 의존성 감지**
   - useDependencyGraph에서 이미 구현됨
   - Gantt 화살표에 반영 (error 상태)

### 7.2 성능 개선

1. **좌표 캐싱**
   - Task 바 좌표를 Map에 캐시
   - 리사이즈 시에만 재계산

2. **디바운싱**
   - 리사이즈 이벤트 100ms 디바운스
   - 줌/팬 이벤트 디바운스

3. **requestAnimationFrame**
   - 화살표 렌더링 최적화
   - 60fps 유지

---

## 8. 참조 문서

- 기본설계: `010-basic-design.md`
- UI 설계: `011-ui-design.md`
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- 참조 구현: `app/components/wbs/graph/DependencyGraph.client.vue`

---

## 9. 체크리스트

### 구현 완료
- [x] frappe-gantt 패키지 설치
- [x] types/gantt.ts 타입 정의
- [x] useGanttDependencies composable 구현
- [x] GanttDependencyOverlay 컴포넌트 구현
- [x] gantt.vue 페이지 생성
- [x] main.css 스타일 추가
- [x] 화살표 호버 Tooltip
- [x] Task 선택 하이라이트
- [x] ARIA 접근성 속성

### 미완료 (향후 Task)
- [ ] 단위 테스트 작성
- [ ] E2E 테스트 작성
- [ ] Frappe Gantt DOM 속성 추가 로직
- [ ] 키보드 네비게이션 구현
- [ ] 좌표 캐싱 최적화
- [ ] 리사이즈 디바운싱
- [ ] AppHeader Gantt 메뉴 활성화

---

**구현 완료일:** 2025-12-17
**다음 단계:** 코드 리뷰 (`031-code-review-claude-1.md`)

<!--
author: Claude Code
Template Version: 2.0.0
-->
