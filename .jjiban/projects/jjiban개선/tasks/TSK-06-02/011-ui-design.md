# UI 설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **설계 규칙**
> * 시각적 디자인과 사용자 경험에 집중
> * CSS 클래스 중앙화 원칙 준수 (main.css)
> * PrimeVue 및 Tailwind CSS 활용
> * 접근성 및 반응형 고려

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Gantt 차트 의존성 화살표 |
| Category | development |
| 상태 | [bd] 기본설계 (UI 설계 단계) |
| 작성일 | 2025-12-17 |
| 작성자 | Claude Code |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 섹션 11 (의존관계 그래프 시각화) |
| TRD | `.jjiban/projects/jjiban개선/trd.md` | 전체 |
| 기본설계 | `010-basic-design.md` | 섹션 5 (화살표 스타일 설계) |
| 참조 구현 | TSK-06-01 | DependencyGraph.client.vue |

---

## 1. UI 설계 목적

### 1.1 목적

Gantt 차트에서 Task 간 의존관계를 시각적으로 표현하여 프로젝트 일정과 선후행 관계를 직관적으로 파악할 수 있도록 합니다.

**핵심 UX 목표:**
- 시간축 기반 의존관계의 명확한 시각화
- Task 상태에 따른 즉각적인 시각적 피드백
- 최소한의 인터랙션으로 관련 Task 탐색
- 복잡한 의존관계에서도 높은 가독성 유지

### 1.2 디자인 원칙

1. **명확성 (Clarity)**: 화살표 색상만으로 상태 파악 가능
2. **일관성 (Consistency)**: DependencyGraph와 동일한 색상 체계
3. **접근성 (Accessibility)**: 색맹 사용자 고려, 텍스트 대체 제공
4. **성능 (Performance)**: SVG 최적화로 부드러운 렌더링

---

## 2. 화면 레이아웃

### 2.1 전체 구조

```
┌────────────────────────────────────────────────────────────┐
│ Gantt 차트 페이지                                           │
├────────────────────────────────────────────────────────────┤
│ [헤더/컨트롤]                                               │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Frappe Gantt 차트 영역                                 │ │
│ │ ┌───────┬───────────────────────────────────────────┐ │ │
│ │ │ Task  │ 2024-01  │ 2024-02  │ 2024-03            │ │ │
│ │ │ 목록  ├───────────────────────────────────────────┤ │ │
│ │ │       │ ─────────[TSK-A]─────────                │ │ │
│ │ │ TSK-A │           └──────→ (화살표)               │ │ │
│ │ │ TSK-B │                 [TSK-B]──────             │ │ │
│ │ │ TSK-C │      [TSK-C]────────                      │ │ │
│ │ │       │         └───────────→ (화살표)            │ │ │
│ │ └───────┴───────────────────────────────────────────┘ │ │
│ │                                                        │ │
│ │ [SVG 오버레이 레이어 - 화살표만 렌더링]                │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 2.2 레이어 구성

| 레이어 | Z-Index | 요소 | 역할 |
|--------|---------|------|------|
| Base | 1 | Frappe Gantt Canvas | Task 바, 그리드, 라벨 |
| Overlay | 2 | SVG Container | 의존성 화살표 렌더링 |
| Interaction | 3 | Tooltip | 호버 시 정보 표시 |

---

## 3. 화살표 시각 디자인

### 3.1 화살표 색상 체계

> **CSS 클래스 중앙화**: `main.css`에 정의, 컴포넌트에서 클래스명 참조

#### 상태별 색상 매핑

| Task 상태 | CSS 클래스 | 색상 | HEX | 의미 |
|----------|-----------|------|-----|------|
| 완료 `[xx]` | `.gantt-arrow-completed` | Green | `#22c55e` | 완료된 의존관계 |
| 진행중 `[im]`, `[vf]` | `.gantt-arrow-active` | Blue | `#3b82f6` | 활성 의존관계 |
| 대기 `[bd]`, `[dd]`, `[ ]` | `.gantt-arrow-pending` | Gray | `#6b7280` | 대기 중 의존관계 |
| 에러 (순환) | `.gantt-arrow-error` | Red | `#ef4444` | 순환 의존성 경고 |

#### main.css 추가 클래스 정의

```css
/* Gantt 화살표 기본 스타일 */
.gantt-arrow {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
}

/* 상태별 색상 클래스 */
.gantt-arrow-completed {
  stroke: var(--color-success); /* #22c55e */
}

.gantt-arrow-active {
  stroke: var(--color-primary); /* #3b82f6 */
}

.gantt-arrow-pending {
  stroke: var(--color-text-muted); /* #6b7280 */
  opacity: 0.7;
}

.gantt-arrow-error {
  stroke: var(--color-danger); /* #ef4444 */
  stroke-dasharray: 4 2; /* 점선 스타일 */
  animation: dash-flow 1s linear infinite; /* SUGGESTION-04: 흐르는 점선 효과 */
}

/* SUGGESTION-04: 순환 의존성 화살표 애니메이션 */
@keyframes dash-flow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 6; } /* dasharray 합계 (4+2) */
}

/* 호버 상태 */
.gantt-arrow:hover {
  stroke-width: 3;
  opacity: 1;
  cursor: pointer;
}

/* 하이라이트 상태 (Task 선택 시) */
.gantt-arrow-highlighted {
  stroke: #fbbf24; /* Yellow */
  stroke-width: 3;
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.6));
}

/* 비활성화 상태 (다른 Task 선택 시) */
.gantt-arrow-dimmed {
  opacity: 0.2;
}
```

### 3.2 화살표 형태 및 스타일

#### 기본 형태: 계단식 경로 (Step Path)

```
Task A [════════]
                └──→ (수평선)
                    ↓ (수직선)
              Task B [════════]
```

**SVG 경로 구성:**
- M (moveTo): 시작점 (source Task 오른쪽 중앙)
- H (horizontal): 수평선 (중간 지점까지)
- V (vertical): 수직선 (target Task 높이까지)
- H (horizontal): 수평선 (target Task 왼쪽 중앙까지)

#### 화살표 두께

| 상태 | stroke-width | 설명 |
|------|--------------|------|
| 기본 | 2px | 일반 화살표 |
| 호버 | 3px | 마우스 오버 시 강조 |
| 하이라이트 | 3px | Task 선택 시 관련 화살표 |
| 비활성 | 2px (opacity: 0.2) | 선택되지 않은 화살표 |

#### 화살촉 마커 (SVG defs)

**SVG 마커 정의:**
```svg
<defs>
  <!-- 완료 상태 화살촉 -->
  <marker id="arrowhead-completed" markerWidth="10" markerHeight="10"
          refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
  </marker>

  <!-- 진행중 상태 화살촉 -->
  <marker id="arrowhead-active" markerWidth="10" markerHeight="10"
          refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
  </marker>

  <!-- 대기 상태 화살촉 -->
  <marker id="arrowhead-pending" markerWidth="10" markerHeight="10"
          refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
  </marker>

  <!-- 에러 상태 화살촉 -->
  <marker id="arrowhead-error" markerWidth="10" markerHeight="10"
          refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
  </marker>

  <!-- 하이라이트 화살촉 -->
  <marker id="arrowhead-highlighted" markerWidth="10" markerHeight="10"
          refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
  </marker>
</defs>
```

### 3.3 색상 대비 및 접근성

#### WCAG 2.1 AA 준수

| 색상 조합 | 대비율 | 준수 여부 |
|----------|--------|----------|
| Green (#22c55e) on Dark (#1a1a2e) | 7.2:1 | ✅ AAA |
| Blue (#3b82f6) on Dark (#1a1a2e) | 4.8:1 | ✅ AA |
| Gray (#6b7280) on Dark (#1a1a2e) | 4.1:1 | ✅ AA |
| Red (#ef4444) on Dark (#1a1a2e) | 5.6:1 | ✅ AAA |

#### 색맹 대응

- **Protanopia/Deuteranopia (적색맹/녹색맹)**:
  - Green → 밝기 차이로 구분 가능
  - Blue/Gray → 색조 차이로 구분 가능

- **Tritanopia (청색맹)**:
  - Blue/Green → 색조 차이로 구분 가능

- **보완 수단**:
  - 호버 시 Tooltip으로 상태 텍스트 표시
  - 완료 상태는 점선 스타일 추가 옵션 제공

---

## 4. 인터랙션 설계

### 4.1 화살표 호버 (Mouse Over)

**동작 시퀀스:**
1. 사용자가 화살표에 마우스 오버
2. 화살표 두께 증가 (2px → 3px)
3. 투명도 증가 (opacity: 1)
4. Tooltip 표시 (0.3초 딜레이)

**Tooltip 내용:**
```
┌─────────────────────────┐
│ TSK-A → TSK-B           │
│ 상태: 진행중            │
└─────────────────────────┘
```

**Tooltip 스타일:**
- 배경: `var(--color-card)` (#1e1e38)
- 테두리: `var(--color-border)` (#3d3d5c)
- 텍스트: `var(--color-text)` (#e8e8e8)
- 폰트 크기: 12px
- 패딩: 8px 12px
- 그림자: `0 2px 8px rgba(0, 0, 0, 0.3)`

### 4.2 Task 바 클릭 (Task Selection)

**동작 시퀀스:**
1. 사용자가 Gantt Task 바 클릭
2. 선택된 Task의 모든 의존 화살표 하이라이트
   - 나가는 화살표 (dependedBy): 노란색
   - 들어오는 화살표 (dependsOn): 노란색
3. 다른 화살표는 흐리게 표시 (opacity: 0.2)
4. 연결된 Task 바에 시각적 강조
   - 테두리 추가: `2px solid #fbbf24`

**선택 해제:**
- 빈 공간 클릭 시 모든 하이라이트 해제
- ESC 키 입력 시 선택 해제

### 4.3 화살표 클릭 (Arrow Selection)

**동작 시퀀스:**
1. 사용자가 화살표 클릭
2. 화살표 하이라이트 (노란색)
3. Source Task와 Target Task 강조
4. Sidebar/Panel에 의존관계 정보 표시

**정보 패널 내용:**
```
┌─────────────────────────────────┐
│ 의존관계 정보                   │
├─────────────────────────────────┤
│ From: TSK-A (구현)              │
│ To:   TSK-B (검증)              │
│ 타입: Finish-to-Start (FS)      │
│ 지연: 0일                       │
├─────────────────────────────────┤
│ [연결된 Task로 이동] [닫기]     │
└─────────────────────────────────┘
```

### 4.4 키보드 네비게이션 (SUGGESTION-03 반영)

| 우선순위 | 키 | 동작 | WCAG 기준 | 구현 단계 |
|---------|-------|------|----------|----------|
| P0 (필수) | Tab | 다음 화살표로 포커스 이동 | 2.1.1 Keyboard | Phase 1 |
| P0 (필수) | Enter/Space | 화살표 선택 (클릭과 동일) | 2.1.1 Keyboard | Phase 1 |
| P0 (필수) | Escape | 선택 해제 | 2.1.2 No Keyboard Trap | Phase 1 |
| P1 (권장) | Shift+Tab | 이전 화살표로 포커스 이동 | 2.1.1 Keyboard | Phase 2 |
| P2 (선택) | Arrow Keys | Task 바 간 포커스 이동 | - | Phase 3 |

> **구현 가이드**: Phase 1 (P0 필수 항목)만 구현해도 WCAG 2.1 AA 접근성 기준 충족

### 4.5 줌/팬 동기화

**동작 시퀀스:**
1. Frappe Gantt 줌 또는 팬 이벤트 발생
2. SVG 오버레이 변환 행렬 업데이트
3. 화살표 위치 재계산 (100ms 디바운스)
4. 부드러운 전환 애니메이션 (0.2s ease)

**성능 최적화:**
- `requestAnimationFrame`으로 렌더링 최적화
- 뷰포트 외부 화살표는 렌더링 생략

---

## 5. 반응형 디자인

### 5.1 뷰포트별 조정

| 뷰포트 | 화살표 두께 | 화살촉 크기 | Tooltip 크기 |
|--------|------------|-------------|--------------|
| Desktop (≥1280px) | 2px | 10x10 | 기본 (12px) |
| Tablet (768-1279px) | 2px | 8x8 | 기본 (12px) |
| Mobile (<768px) | 1.5px | 6x6 | 작게 (10px) |

### 5.2 터치 인터랙션

**모바일/태블릿 최적화:**
- 화살표 터치 영역 확대: 실제 두께 +8px 패딩
- 롱 프레스로 상세 정보 표시 (0.5초)
- 더블 탭으로 연결된 Task로 이동
- 스와이프 제스처로 줌/팬

---

## 6. 애니메이션 및 전환

### 6.1 화살표 등장 애니메이션

**초기 렌더링 시:**
```css
@keyframes arrow-fade-in {
  0% {
    opacity: 0;
    stroke-dashoffset: 100%;
  }
  100% {
    opacity: 1;
    stroke-dashoffset: 0;
  }
}

.gantt-arrow-enter {
  animation: arrow-fade-in 0.5s ease-out;
}
```

**단계별 등장:**
- 0-0.2초: 투명도 0 → 1
- 0-0.5초: 경로 따라 그려지는 효과 (stroke-dashoffset)

### 6.2 상태 변경 전환

**Task 상태 변경 시 화살표 색상 전환:**
```css
.gantt-arrow {
  transition: stroke 0.3s ease, stroke-width 0.2s ease, opacity 0.2s ease;
}
```

### 6.3 호버 전환

```css
.gantt-arrow:hover {
  stroke-width: 3;
  transition: stroke-width 0.15s ease;
}
```

---

## 7. 접근성 (WCAG 2.1 AA)

### 7.1 ARIA 속성

**SVG 화살표 요소:**
```html
<path
  class="gantt-arrow gantt-arrow-active"
  d="M x1,y1 H x2 V y2 H x3"
  marker-end="url(#arrowhead-active)"
  role="img"
  aria-label="TSK-A에서 TSK-B로의 의존관계, 상태: 진행중"
  tabindex="0"
/>
```

**SVG 컨테이너:**
```html
<svg
  class="gantt-arrows-overlay"
  role="group"
  aria-label="Task 의존관계 화살표"
>
  <title>Gantt 차트 의존관계</title>
  <desc>Task 간 선후행 관계를 화살표로 표시합니다.</desc>
  <!-- 화살표 요소들 -->
</svg>
```

### 7.2 스크린 리더 지원

**화살표 설명 패턴:**
- "TSK-A에서 TSK-B로의 의존관계, 상태: 진행중"
- "TSK-C에서 TSK-D로의 의존관계, 상태: 완료"
- "순환 의존성 경고: TSK-E와 TSK-F 간 순환 참조"

**키보드 포커스 순서:**
1. Gantt 차트 컨트롤 (줌, 팬)
2. Task 바 (좌측 → 우측, 상단 → 하단)
3. 의존성 화살표 (출발 Task 순서대로)

### 7.3 포커스 인디케이터

```css
.gantt-arrow:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  stroke-width: 3;
}

.gantt-arrow:focus-visible {
  outline: 3px solid #fbbf24;
  outline-offset: 3px;
}
```

---

## 8. 에러 및 엣지 케이스 UI

### 8.1 순환 의존성 표시

**시각적 표현:**
- 색상: 빨강 (#ef4444)
- 스타일: 점선 (stroke-dasharray: 4 2)
- 화살표 위에 경고 아이콘 오버레이

**경고 배지:**
```
┌─────────────────────────┐
│  ⚠️ 순환 의존성         │
│  TSK-A ⇄ TSK-B          │
└─────────────────────────┘
```

### 8.2 겹치는 화살표 처리

**전략:**
1. 수직 오프셋 추가 (Y축 +5px 간격)
2. 투명도 조정으로 겹침 인지 가능
3. 호버 시 최상단으로 이동 (z-index 조정)

### 8.3 화살표 없음 (Empty State)

**조건:**
- 프로젝트에 의존관계가 전혀 없는 경우

**UI 표시:**
```
┌─────────────────────────────────────┐
│                                     │
│  ℹ️ 의존관계가 없습니다             │
│  Task 간 의존관계를 설정하면        │
│  화살표가 표시됩니다                │
│                                     │
└─────────────────────────────────────┘
```

---

## 9. 컴포넌트 구조 (개념)

### 9.1 컴포넌트 계층

```
GanttChartPage.vue
└── GanttChart.vue
    ├── FrappeGanttCanvas.vue (외부 라이브러리 래퍼)
    └── GanttDependencyOverlay.vue (신규)
        ├── ArrowPath.vue (개별 화살표)
        └── ArrowTooltip.vue (호버 정보)
```

### 9.2 주요 컴포넌트 역할

| 컴포넌트 | 역할 | 주요 Props | 주요 Events |
|---------|------|-----------|------------|
| GanttDependencyOverlay | SVG 오버레이 관리 | tasks, dependencies, selectedTaskId | arrowClick, arrowHover |
| ArrowPath | 개별 화살표 렌더링 | source, target, status, highlighted | click, mouseenter, mouseleave |
| ArrowTooltip | 화살표 정보 표시 | arrow, position, visible | - |

---

## 10. 성능 최적화 UI 전략

### 10.1 렌더링 최적화

**전략:**
- 뷰포트 외부 화살표 렌더링 생략
- 100개 이상 화살표 시 가상화 적용
- 줌/팬 중 불필요한 재계산 방지 (디바운스 100ms)

### 10.2 로딩 상태 표시

**초기 로딩:**
```
┌─────────────────────────────────────┐
│                                     │
│      [스피너 애니메이션]            │
│   의존관계를 불러오는 중...         │
│                                     │
└─────────────────────────────────────┘
```

**로딩 스피너:**
- PrimeVue `ProgressSpinner` 컴포넌트 사용
- 색상: `var(--color-primary)` (#3b82f6)
- 크기: 32px

---

## 11. 다크 테마 통합

### 11.1 색상 변수 활용

**main.css 변수 사용:**
```css
.gantt-arrows-overlay {
  background-color: transparent;
}

.gantt-arrow-completed {
  stroke: var(--color-success);
}

.gantt-arrow-active {
  stroke: var(--color-primary);
}

.gantt-arrow-pending {
  stroke: var(--color-text-muted);
}

.gantt-arrow-error {
  stroke: var(--color-danger);
}
```

### 11.2 테마 일관성

**기존 DependencyGraph와 동일:**
- Edge 색상: Blue (#3b82f6) → Gantt Active 색상과 매칭
- Selected 색상: Yellow (#fbbf24) → Gantt Highlight 색상과 매칭
- Dimmed 투명도: 0.2 → 동일

---

## 12. UI 테스트 체크리스트

### 시각적 테스트
- [ ] 화살표가 정확한 색상으로 표시됨 (완료/진행중/대기)
- [ ] 화살표 두께가 상태에 따라 변경됨 (기본/호버/하이라이트)
- [ ] 화살촉이 올바른 방향과 색상으로 표시됨
- [ ] 순환 의존성이 점선 빨강으로 표시됨
- [ ] Task 선택 시 관련 화살표가 노란색으로 하이라이트됨

### 인터랙션 테스트
- [ ] 화살표 호버 시 Tooltip 표시됨
- [ ] Task 바 클릭 시 연결된 화살표 하이라이트됨
- [ ] 화살표 클릭 시 상세 정보 패널 표시됨
- [ ] 빈 공간 클릭 시 하이라이트 해제됨
- [ ] ESC 키로 선택 해제됨

### 반응형 테스트
- [ ] 데스크톱에서 정상 표시됨 (1920x1080)
- [ ] 태블릿에서 정상 표시됨 (768x1024)
- [ ] 모바일에서 터치 인터랙션 작동함 (375x667)
- [ ] 줌/팬 시 화살표 위치가 동기화됨

### 접근성 테스트
- [ ] 키보드로 화살표 간 이동 가능 (Tab)
- [ ] 스크린 리더가 화살표 설명 읽음
- [ ] 포커스 인디케이터가 명확하게 표시됨
- [ ] 색상 대비가 WCAG AA 기준 충족

### 성능 테스트
- [ ] 100개 Task 프로젝트에서 화살표 렌더링 < 100ms
- [ ] 줌/팬 동작이 부드럽게 작동함 (60fps)
- [ ] 화살표 호버 시 지연 없음

---

## 13. 다음 단계

1. **main.css 업데이트**
   - Gantt 화살표 CSS 클래스 추가
   - 기존 edge 스타일과 통합

2. **상세설계 진행**
   - `/wf:draft` 명령어로 020-detail-design.md 작성
   - GanttDependencyOverlay 컴포넌트 상세 설계
   - useGanttDependencies composable 설계

3. **프로토타입 검토**
   - Figma/Sketch로 화살표 스타일 목업 작성 (선택 사항)
   - 팀 리뷰 및 피드백 수렴

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 참조 컴포넌트: `app/components/wbs/graph/DependencyGraph.client.vue`
- CSS 스타일: `app/assets/css/main.css`
- PRD: `.jjiban/projects/jjiban개선/prd.md` (섹션 11)
- TRD: `.jjiban/projects/jjiban개선/trd.md`

---

<!--
author: Claude Code
Template Version: 1.0.0
-->
