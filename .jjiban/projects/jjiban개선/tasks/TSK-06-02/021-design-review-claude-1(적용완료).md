# TSK-06-02 설계 리뷰 (021-design-review-claude-1.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Gantt 차트 의존성 화살표 |
| 리뷰일 | 2025-12-17 |
| 리뷰어 | Claude (Refactoring Expert) |
| 리뷰 범위 | 기본설계, UI설계, 상세설계, 추적성 매트릭스, 테스트 명세 |
| 리뷰 결과 | MAJOR 이슈 1건 (Gantt 차트 미구현), SUGGESTION 4건 |

---

## 1. 리뷰 요약

### 1.1 전체 평가

| 평가 항목 | 점수 | 코멘트 |
|----------|------|--------|
| PRD/TRD 일관성 | B+ | Gantt 차트 미구현으로 인한 실현 가능성 이슈 |
| 아키텍처 설계 | A | SVG 오버레이 접근 방식 적절, TSK-06-01 재사용 우수 |
| 인터페이스 설계 | A | Composable 계약 명확, 타입 정의 완전 |
| 테스트 커버리지 | A | 단위/E2E/매뉴얼 100% 커버, data-testid 체계적 |
| 구현 가능성 | C+ | Frappe Gantt 미설치로 구현 차단 가능성 높음 |
| **종합 평가** | **B+** | 설계 품질 우수하나 기반 Gantt 차트 구현 선결 필요 |

### 1.2 지적사항 분류

| 심각도 | 건수 | 내역 |
|--------|------|------|
| CRITICAL | 0 | - |
| MAJOR | 1 | Gantt 차트 미구현으로 인한 실현 가능성 이슈 |
| MINOR | 0 | - |
| SUGGESTION | 4 | 대안 전략 명확화, 타입 개선, 성능 최적화, 접근성 강화 |
| **합계** | **5** | - |

---

## 2. 설계 문서 검토

### 2.1 기본설계 (010-basic-design.md)

**검토 결과: 우수 (A-)**

**강점:**
- 섹션 3.1: SVG 오버레이 레이어 구조 명확, Frappe Gantt과 독립적 설계 적절
- 섹션 3.4: 계단식 경로 알고리즘 상세 설명, SVG path 명령어 구체적
- 섹션 5: 화살표 색상 체계 완성도 높음 (완료/진행중/대기/에러 4가지 상태)
- 섹션 11: Gantt 차트 미구현 시 대안 전략 3가지 제시 (A/B/C 옵션)

**약점:**
- 섹션 11 권장 방안이 "확인 후 결정"으로 모호함
- DOM 쿼리 방식의 취약성 (Frappe Gantt 버전 변경 시) 대응책 부족

**개선 제안:**
- 대안 전략 우선순위 명확화 (옵션 B를 1순위로 권장)
- DOM 쿼리 안정성 확보 방안 추가 (CSS 셀렉터 버전별 검증)

---

### 2.2 UI 설계 (011-ui-design.md)

**검토 결과: 우수 (A)**

**강점:**
- 섹션 3.1: CSS 클래스 중앙화 원칙 철저히 준수, main.css 변수 활용
- 섹션 4: 인터랙션 시나리오 구체적 (호버, 클릭, 키보드 네비게이션)
- 섹션 7: 접근성 ARIA 속성 체계적 정의, WCAG AA 대비율 검증 완료
- 섹션 11.2: DependencyGraph와 테마 일관성 유지 (색상 매칭)

**약점:**
- 섹션 4.5: 줌/팬 동기화 성능 최적화 전략 간략함
- 반응형 모바일 최적화는 언급되나 구체적 브레이크포인트 전략 부재

**개선 제안:**
- 줌/팬 디바운싱 알고리즘 상세화 (100ms 근거 보강)
- 모바일 터치 인터랙션 우선순위 명확화

---

### 2.3 상세설계 (020-detail-design.md)

**검토 결과: 우수 (A)**

**강점:**
- 섹션 1: 일관성 검증 매트릭스 체계적 (CHK-PRD, CHK-BD, CHK-TRD 3단계)
- 섹션 7.1: Composable 인터페이스 계약 명확 (buildGanttArrows, calculateArrowPath, getArrowStatus)
- 섹션 8.2: Sequence Diagram 상세하여 데이터 흐름 추적 용이
- 섹션 12: CSS 클래스 설계 완성도 높음 (.gantt-arrow-* 체계)

**약점:**
- 섹션 5.3: 외부 의존성에서 Frappe Gantt이 "(선택)"으로 표시되어 실현 가능성 불확실
- 섹션 11.2: 경계 조건 중 "화살표 100개 이상" 가상화 렌더링 구현 계획 미제시

**개선 제안:**
- Frappe Gantt 미설치 시 대체 라이브러리 구체화 (Vue Flow 타임라인 뷰)
- 가상화 렌더링 알고리즘 개념 수준 명세 추가

---

### 2.4 추적성 매트릭스 (025-traceability-matrix.md)

**검토 결과: 우수 (A+)**

**강점:**
- 섹션 1: FR-001~005 모두 설계→테스트 양방향 매핑 100%
- 섹션 2: NFR-001~004 검증 방법 구체적 (성능 벤치마크, axe-core 접근성)
- 섹션 4: 컴포넌트 추적 3개 모두 파일 경로와 책임 명확
- 섹션 7.3: 추적성 품질 지표 100% 달성, 고아 요구사항/테스트 0건

**약점:**
- 없음 (매우 우수한 추적성 문서)

**개선 제안:**
- 없음

---

### 2.5 테스트 명세 (026-test-specification.md)

**검토 결과: 우수 (A)**

**강점:**
- 섹션 2.1: 단위 테스트 7건 체계적 (UT-001~007), 성능 테스트 포함
- 섹션 3.1: E2E 테스트 7건 완전한 시나리오 커버 (렌더링, 인터랙션, 성능, 접근성)
- 섹션 6: data-testid 체계 명확 (gantt-arrow-{sourceId}-{targetId} 패턴)
- 섹션 7: 커버리지 목표 구체적 (Lines 85%, Branches 80%, Functions 90%)

**약점:**
- 섹션 3.2: E2E-001 테스트에서 Gantt 페이지 접속 `/gantt?project=jjiban개선`이 실제 존재하지 않을 가능성
- Mock 데이터 생성 함수 `createMockContainer`의 세부 구현 필요성

**개선 제안:**
- Gantt 페이지 미구현 시 테스트 스킵 전략 명시
- Mock 함수 구현 시 JSDOM 환경 한계 고려

---

## 3. 지적사항 상세

### 3.1 MAJOR-01: Gantt 차트 미구현으로 인한 실현 가능성 이슈

**심각도:** MAJOR

**위치:**
- 010-basic-design.md 섹션 11
- 020-detail-design.md 섹션 1.2 (CHK-PRD-03 경고)

**현상:**
- package.json에 Frappe Gantt 패키지 미설치
- AppHeader에서 Gantt 메뉴 비활성화 확인 (`isDisabled: true`)
- `/gantt` 라우트 존재 여부 미확인
- FR-001~005 모든 요구사항이 Gantt 차트 존재를 전제로 설계됨

**문제점:**
- TSK-06-02 구현 착수 불가능 (기반 Gantt 차트 없음)
- E2E 테스트 전체 실패 가능성 (E2E-001~007 모두 `/gantt` 경로 의존)
- 프로젝트 일정 지연 리스크 (Gantt 구현 시간 미산정)

**개선 제안:**

**[방안 A] Frappe Gantt 신규 도입 (추천하지 않음)**
- 장점: 검증된 라이브러리, 빠른 구현
- 단점: 추가 의존성, 커스터마이징 제약, TSK-08-05 별도 Task 필요
- 예상 공수: 기본 Gantt 차트 구현 3-4일 + 화살표 구현 2-3일

**[방안 B] Vue Flow 타임라인 뷰로 설계 변경 (강력 추천)**
- 장점:
  - TSK-06-01에서 이미 Vue Flow 사용 중 (일관된 기술 스택)
  - DependencyGraph.client.vue 코드 재사용 가능
  - useDependencyGraph composable 100% 재사용
  - 추가 의존성 없음 (이미 설치됨)
- 단점:
  - Gantt 특화 기능 없음 (시간축 대신 레벨 기반 배치)
  - 날짜 기반 일정 관리 불가 (의존관계만 시각화)
- 예상 공수: 화살표 구현만 1-2일
- 설계 변경 범위:
  - GanttDependencyOverlay.vue → DependencyEdgeOverlay.vue (이름 변경)
  - useGanttDependencies → useDependencyEdges (이름 변경)
  - DOM 쿼리 대상: Task 바 → Vue Flow 노드
  - 좌표 시스템: 시간축 기반 → 위상정렬 레벨 기반

**[방안 C] TSK-06-02 연기 (차선책)**
- TSK-08-05 (Gantt 기본 구현) Task 생성 및 선행 처리
- Frappe Gantt 설치 및 기본 차트 구현 후 TSK-06-02 재개
- 예상 공수: TSK-08-05 (3-4일) + TSK-06-02 (2-3일)

**권장 조치:**
1. **즉시 결정 필요**: 방안 B (Vue Flow 타임라인 뷰) 채택 권장
2. **설계 문서 업데이트**:
   - 010-basic-design.md 섹션 11 권장 방안 명시
   - 020-detail-design.md "Gantt" → "Dependency Graph" 용어 변경
   - 026-test-specification.md E2E 테스트 경로 `/gantt` → `/graph` 수정
3. **WBS 업데이트**: TSK-06-02 depends 필드에 "TSK-06-01 완료" 명시

---

### 3.2 SUGGESTION-01: GanttTaskBounds 타입 개선

**심각도:** SUGGESTION

**위치:** 020-detail-design.md 섹션 6.1

**현상:**
- GanttTaskBounds 타입에 taskId, left, right, top, bottom, centerY 6개 필드 정의
- centerY는 계산 가능한 값 (centerY = (top + bottom) / 2)
- 중복 데이터로 인한 불일치 가능성

**개선 제안:**
```typescript
// 현재 설계
interface GanttTaskBounds {
  taskId: string
  left: number
  right: number
  top: number
  bottom: number
  centerY: number  // 중복
}

// 개선안 1: centerY 제거, 계산 함수 제공
interface GanttTaskBounds {
  taskId: string
  left: number
  right: number
  top: number
  bottom: number
}

// 개선안 2: centerY를 getter로 변환
interface GanttTaskBounds {
  taskId: string
  left: number
  right: number
  top: number
  bottom: number
  get centerY(): number  // (top + bottom) / 2
}
```

**근거:**
- DRY 원칙 준수 (Don't Repeat Yourself)
- 불일치 버그 방지 (centerY 수동 계산 오류 제거)
- 타입 시스템 활용 극대화

---

### 3.3 SUGGESTION-02: 가상화 렌더링 알고리즘 구체화

**심각도:** SUGGESTION

**위치:** 020-detail-design.md 섹션 14.1

**현상:**
- "뷰포트 내 화살표만 렌더링" 언급만 있고 구체적 알고리즘 없음
- NFR-001에서 100개 Task 성능 목표 < 100ms 명시
- 실제 대규모 프로젝트 (200-300개 Task) 성능 보장 불확실

**개선 제안:**
섹션 14.1에 추가할 내용:

```markdown
### 14.1.1 가상화 렌더링 알고리즘

**적용 조건:**
- 화살표 개수 > 100개 시 자동 활성화

**알고리즘 단계:**
1. SVG 뷰포트 좌표 추출 (viewBox)
2. 각 화살표의 bounding box 계산 (min/max X/Y)
3. 뷰포트와 화살표 bounding box 교차 검사 (Axis-Aligned Bounding Box collision)
4. 교차하는 화살표만 DOM 렌더링
5. 교차하지 않는 화살표는 `display: none` 또는 DOM에서 제거

**성능 기대치:**
- 300개 화살표 중 평균 50개만 렌더링 (83% 감소)
- 렌더링 시간 300ms → 50ms 예상

**구현 위치:**
- useGanttDependencies.ts 내 `filterVisibleArrows()` 함수
```

**근거:**
- NFR-001 성능 요구사항 충족 보장
- 대규모 프로젝트 확장성 확보
- 실제 구현 시 명확한 가이드라인 제공

---

### 3.4 SUGGESTION-03: 접근성 키보드 네비게이션 우선순위 명확화

**심각도:** SUGGESTION

**위치:** 011-ui-design.md 섹션 4.4

**현상:**
- 키보드 네비게이션 표에 Tab, Shift+Tab, Enter, Escape, Arrow Keys 5개 키 나열
- 우선순위 불명확 (모두 구현 필수인지, 선택 사항인지)
- NFR-004 접근성 요구사항에서는 "화살표 title 속성"만 명시

**개선 제안:**
키보드 네비게이션 우선순위 표 추가:

| 우선순위 | 키 | 동작 | WCAG 기준 | 구현 단계 |
|---------|-------|------|----------|----------|
| P0 (필수) | Tab | 다음 화살표 포커스 | 2.1.1 Keyboard | Phase 1 |
| P0 (필수) | Enter/Space | 화살표 선택 | 2.1.1 Keyboard | Phase 1 |
| P0 (필수) | Escape | 선택 해제 | 2.1.2 No Keyboard Trap | Phase 1 |
| P1 (권장) | Shift+Tab | 이전 화살표 포커스 | 2.1.1 Keyboard | Phase 2 |
| P2 (선택) | Arrow Keys | Task 바 간 이동 | - | Phase 3 |

**근거:**
- WCAG 2.1 AA 준수 최소 요구사항 명확화
- 구현 단계별 검증 가능
- Phase 1만 구현해도 접근성 기본 충족

---

### 3.5 SUGGESTION-04: 순환 의존성 화살표 스타일 개선

**심각도:** SUGGESTION

**위치:** 011-ui-design.md 섹션 3.2

**현상:**
- 순환 의존성 화살표: 빨강 (#ef4444) + 점선 (stroke-dasharray: 4 2)
- TSK-06-01에서 순환 의존성 검증 구현 완료
- 하지만 사용자가 순환 의존성을 "에러"가 아닌 "의도된 설계"로 사용할 가능성

**개선 제안:**
순환 의존성 화살표에 추가 시각적 구분 요소:

```css
/* 기존 */
.gantt-arrow-error {
  stroke: var(--color-danger);  /* #ef4444 */
  stroke-dasharray: 4 2;
  opacity: 1;
}

/* 개선안: 애니메이션 추가 */
.gantt-arrow-error {
  stroke: var(--color-danger);
  stroke-dasharray: 4 2;
  opacity: 1;
  animation: dash-flow 1s linear infinite;  /* 흐르는 점선 효과 */
}

@keyframes dash-flow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 8;  /* dasharray 합계 */
  }
}
```

**대안: 경고 아이콘 오버레이**
- 화살표 중간 지점에 ⚠️ 아이콘 SVG 마커 추가
- 호버 시 "순환 의존성이 감지되었습니다" Tooltip 강조

**근거:**
- 순환 의존성은 Critical 이슈이므로 시각적 강조 필요
- 애니메이션으로 사용자 주의 환기 (깜빡임 없이 부드러운 흐름)
- 기존 설계 (빨강 점선)에 추가 강화

---

## 4. PRD/TRD 일관성 검증

### 4.1 PRD 섹션 11 (의존관계 그래프 시각화) 대조

| PRD 요구사항 | 설계 문서 반영 | 일치 여부 | 비고 |
|-------------|--------------|-----------|------|
| Hierarchical Layout (LR) | 020-detail-design.md 섹션 3.4 계단식 경로 | ✅ 일치 | SVG path 알고리즘 명확 |
| 인터랙티브 (드래그, 줌, 팬, 클릭) | 011-ui-design.md 섹션 4 | ⚠️ 부분 일치 | 호버/클릭만, 드래그 미지원 |
| 모달 형태 | 020-detail-design.md 섹션 9.2 | ❌ 불일치 | Gantt는 페이지, 모달 아님 |
| 전체 프로젝트 표시 | 010-basic-design.md 섹션 3.3 | ✅ 일치 | wbsStore.flatNodes 활용 |
| vis-network 선택 | 020-detail-design.md 섹션 3 | ❌ 불일치 | Frappe Gantt 전제 (미설치) |

**분석:**
- PRD 섹션 11은 "의존관계 그래프 모달" 명시 (vis-network 기반)
- TSK-06-02는 "Gantt 차트 의존성 화살표" (Frappe Gantt 기반)
- **두 요구사항이 다른 구현을 지칭**하고 있음
- TSK-06-01 (DependencyGraph 모달) = PRD 섹션 11 충족
- TSK-06-02 (Gantt 화살표) = PRD 섹션 11의 확장 기능 (별도 명시 없음)

**권장 조치:**
- PRD 업데이트: 섹션 11에 "Gantt 차트 의존성 화살표" 서브섹션 추가
- 또는 TSK-06-02 범위 명확화: "DependencyGraph 모달 확장" 또는 "별도 Gantt 뷰"

---

### 4.2 TRD 일관성 검증

| TRD 요구사항 | 설계 문서 반영 | 일치 여부 |
|-------------|--------------|-----------|
| Vue 3 Composition API | 020-detail-design.md 섹션 3 | ✅ 일치 |
| PrimeVue 4.x | 011-ui-design.md Tooltip | ✅ 일치 |
| CSS 중앙화 원칙 | 011-ui-design.md 섹션 3.1, 020-detail-design.md 섹션 12 | ✅ 일치 |
| TypeScript 필수 | 020-detail-design.md 섹션 6.1 타입 정의 | ✅ 일치 |
| Pinia 상태 관리 | 020-detail-design.md 섹션 9.4 wbsStore | ✅ 일치 |

**결과:** TRD 일관성 100% 충족

---

## 5. 테스트 커버리지 분석

### 5.1 요구사항별 테스트 매핑

| 요구사항 | 단위 테스트 | E2E 테스트 | 매뉴얼 테스트 | 커버리지 |
|---------|-----------|-----------|--------------|----------|
| FR-001 | UT-001, UT-002 | E2E-001 | TC-001 | 100% |
| FR-002 | UT-003, UT-004 | E2E-001 | TC-001 | 100% |
| FR-003 | UT-005 | E2E-002 | TC-002 | 100% |
| FR-004 | UT-006 | E2E-003 | TC-003 | 100% |
| FR-005 | UT-004 | E2E-001 | TC-001 | 100% |
| NFR-001 | UT-007 | E2E-004 | - | 100% |
| NFR-002 | - | E2E-005 | TC-004 | 100% |
| NFR-003 | - | E2E-006 | - | 100% |
| NFR-004 | - | E2E-007 | TC-005, TC-006 | 100% |

**결과:** 전체 요구사항 테스트 커버리지 100% (매우 우수)

---

### 5.2 테스트 품질 분석

**단위 테스트 (UT-001~007):**
- UT-001~002: 정상/에러 케이스 분기 커버
- UT-003~004: 경로 계산 알고리즘 검증 (수평/수직)
- UT-005: 상태 매핑 로직 parametrized test
- UT-006: 이벤트 핸들러 검증 (Vue Test Utils)
- UT-007: 성능 벤치마크 (performance.now())

**강점:** 모든 composable 함수 핵심 로직 커버

**E2E 테스트 (E2E-001~007):**
- E2E-001~003: 기능 시나리오 (렌더링, 상태 변경, 호버)
- E2E-004: 성능 검증 (Lighthouse)
- E2E-005: 통합 시나리오 (줌/팬 동기화)
- E2E-006: 크로스 브라우저 (Chromium/Firefox/Webkit)
- E2E-007: 접근성 자동 검증 (axe-core)

**강점:** NFR 전체 검증, Playwright 활용 우수

**약점:** Gantt 차트 미구현 시 E2E-001~007 모두 실행 불가능

---

## 6. 아키텍처 품질 평가

### 6.1 SOLID 원칙 준수도

| 원칙 | 평가 | 근거 |
|------|------|------|
| Single Responsibility | A | GanttDependencyOverlay (렌더링), useGanttDependencies (계산) 책임 분리 명확 |
| Open/Closed | A | CSS 클래스 확장으로 새로운 화살표 스타일 추가 가능 (코드 수정 불필요) |
| Liskov Substitution | B+ | GanttArrow 타입이 TaskEdge 타입과 호환되지 않음 (별도 타입 필요성 인정) |
| Interface Segregation | A | Composable 함수별 단일 책임, 불필요한 의존성 없음 |
| Dependency Inversion | A | useDependencyGraph 재사용, 구체적 구현 대신 추상화 의존 |

**종합:** SOLID 원칙 준수도 우수 (A-)

---

### 6.2 Composable 설계 품질

**useGanttDependencies 평가:**

**강점:**
- 순수 함수 3개로 구성 (buildGanttArrows, calculateArrowPath, getArrowStatus)
- 각 함수의 입력/출력 명확 (섹션 7.1)
- 사이드 이펙트 없음 (DOM 읽기만, 쓰기 없음)
- 테스트 용이성 극대화 (Mock 주입 가능)

**약점:**
- DOM 쿼리에 의존하여 Frappe Gantt 버전 변경 시 취약
- getBoundingClientRect() 호출이 Reflow 트리거 가능 (성능 이슈 잠재)

**개선 제안:**
- DOM 쿼리 추상화 레이어 추가 (Frappe Gantt API 변경 대응)
- 좌표 캐싱 전략 명확화 (Layout thrashing 방지)

---

### 6.3 타입 시스템 안전성

**타입 정의 평가:**

**강점:**
- GanttArrow, GanttCoordinate, GanttTaskBounds 3개 타입 명확
- ArrowStatus enum으로 상태 제약 (completed/active/pending/error)
- TaskEdge 타입 재사용 (DRY 원칙)

**약점:**
- GanttTaskBounds의 centerY 중복 (SUGGESTION-01에서 지적)
- 타입 가드 함수 없음 (런타임 검증 부재)

**개선 제안:**
```typescript
// 타입 가드 추가
function isValidArrowStatus(status: string): status is ArrowStatus {
  return ['completed', 'active', 'pending', 'error'].includes(status)
}

// 불변성 보장
interface GanttArrow {
  readonly id: string
  readonly sourceId: string
  readonly targetId: string
  readonly path: string
  readonly status: ArrowStatus
  readonly markerEnd: string
}
```

---

## 7. 성능 최적화 전략 평가

### 7.1 렌더링 성능

**현재 전략:**
- 캐싱: Task 바 좌표 Map에 저장
- 디바운싱: 줌/팬 이벤트 100ms
- 가상화: 뷰포트 내 화살표만 렌더링 (알고리즘 미구체화)

**강점:**
- 캐싱과 디바운싱 조합으로 불필요한 재계산 방지
- NFR-001 목표 (100개 Task < 100ms) 달성 가능성 높음

**약점:**
- 가상화 알고리즘 없어 300개 Task 이상 성능 불확실 (SUGGESTION-02 지적)
- requestAnimationFrame 언급만 있고 구현 전략 없음

**개선 제안:**
```markdown
### 14.1.2 requestAnimationFrame 활용

**적용 위치:**
- 줌/팬 이벤트 핸들러
- 화살표 위치 재계산 루프

**구현 패턴:**
```typescript
let rafId: number | null = null

function updateArrows() {
  if (rafId) return  // 이미 예약된 프레임 있음

  rafId = requestAnimationFrame(() => {
    // 화살표 위치 재계산
    recalculateArrowPositions()
    rafId = null
  })
}
```

**성능 기대치:**
- 60fps 유지 (16.67ms per frame)
- Layout thrashing 방지
```

---

### 7.2 메모리 최적화

**현재 전략:**
- 컴포넌트 unmount 시 이벤트 리스너 정리
- ResizeObserver 정리
- 캐시 Map 초기화

**평가:** 메모리 누수 방지 전략 적절

**추가 제안:**
- WeakMap 사용 검토 (Task 바 DOM 요소가 제거되면 자동으로 캐시 정리)

---

## 8. 접근성 (Accessibility) 평가

### 8.1 WCAG 2.1 AA 준수도

| 기준 | 요구사항 | 설계 반영 | 평가 |
|------|---------|----------|------|
| 1.1.1 Non-text Content | 화살표에 텍스트 대체 | ARIA label 제공 | ✅ 충족 |
| 1.4.3 Contrast (Minimum) | 4.5:1 대비율 | 색상 대비율 표 제공 (섹션 3.3) | ✅ 충족 |
| 2.1.1 Keyboard | 키보드 접근 가능 | Tab, Enter 지원 | ✅ 충족 |
| 2.1.2 No Keyboard Trap | 포커스 탈출 가능 | Escape 키 지원 | ✅ 충족 |
| 2.4.7 Focus Visible | 포커스 인디케이터 | outline 스타일 정의 | ✅ 충족 |

**결과:** WCAG 2.1 AA 기준 충족 (E2E-007 axe-core 검증 예정)

---

### 8.2 스크린 리더 지원

**제공 내용:**
- 화살표 설명 패턴: "TSK-A에서 TSK-B로의 의존관계, 상태: 진행중"
- SVG 컨테이너 `<title>`, `<desc>` 태그
- 키보드 포커스 순서 명확

**강점:** 스크린 리더 사용자 경험 고려 우수

**개선 제안:**
- 순환 의존성 화살표에 `aria-live="assertive"` 추가 (즉시 알림)

---

## 9. 코드 품질 예상 평가

> 주의: 아직 구현 전이므로 설계 문서 기반 예상 평가

### 9.1 복잡도 분석 (예상)

| 함수 | 예상 순환 복잡도 | 평가 |
|------|-----------------|------|
| buildGanttArrows | 5-7 (for-loop + try-catch) | 적정 |
| calculateArrowPath | 3-4 (조건 분기 적음) | 우수 |
| getArrowStatus | 4-5 (if-else 체인) | 적정 |

**결과:** 예상 평균 복잡도 4-5 (목표 <10 충족)

---

### 9.2 유지보수성 예상

**긍정 요인:**
- 타입 안전성 높음 (TypeScript 완전 활용)
- 컴포넌트 책임 분리 명확
- CSS 중앙화로 스타일 변경 용이
- 테스트 커버리지 100%로 리팩토링 안전

**리스크 요인:**
- Frappe Gantt DOM 구조 변경 시 수정 필요 (DOM 쿼리 의존)
- Gantt 차트 미구현 시 전체 재설계 가능성

**유지보수성 점수: B+** (Gantt 의존성만 해결되면 A)

---

## 10. 보안 고려사항

### 10.1 XSS 방어

**현재 설계:**
- SVG path d 속성: 좌표 숫자만 포함 (XSS 위험 없음)
- ARIA label: Task ID와 상태 코드 (wbs.md 파일 소스, 검증 불필요)
- Tooltip 내용: Task 정보 (XSS 위험 낮음, but PrimeVue 자동 이스케이프 확인 필요)

**권장 조치:**
- Tooltip 렌더링 시 PrimeVue의 HTML 이스케이프 동작 확인
- Task ID 패턴 검증 추가 (정규식: `^TSK-\d{2}-\d{2}$`)

---

### 10.2 DOM 조작 안전성

**현재 설계:**
- DOM 읽기만 수행 (querySelectorAll, getBoundingClientRect)
- DOM 쓰기 없음 (Vue 템플릿이 SVG 렌더링)

**평가:** DOM 조작 안전성 우수 (읽기 전용)

---

## 11. 개선 우선순위 로드맵

### Phase 1: 필수 조치 (구현 전 완료)

**[P0] MAJOR-01 해결: Gantt 차트 미구현 이슈**
- 예상 공수: 0.5일 (의사결정 + 설계 문서 업데이트)
- 조치: 방안 B (Vue Flow 타임라인 뷰) 채택 결정
- 산출물:
  - 010-basic-design.md 섹션 11 권장 방안 명시
  - 020-detail-design.md 용어 변경 (Gantt → DependencyGraph)
  - 026-test-specification.md E2E 경로 수정

**[P0] PRD 업데이트**
- 예상 공수: 0.5일
- 조치: PRD 섹션 11에 "의존성 화살표 확장 기능" 서브섹션 추가
- 산출물: PRD 버전 1.4

---

### Phase 2: 설계 개선 (구현 중 반영)

**[P1] SUGGESTION-02: 가상화 렌더링 알고리즘 구체화**
- 예상 공수: 0.5일 (알고리즘 설계 + 문서 업데이트)
- 조치: 020-detail-design.md 섹션 14.1.1 추가
- 산출물: Viewport collision detection 알고리즘 명세

**[P1] SUGGESTION-01: GanttTaskBounds 타입 개선**
- 예상 공수: 0.2일 (타입 정의 수정 + 테스트 업데이트)
- 조치: centerY 제거 또는 getter 변환
- 산출물: types/gantt.ts 업데이트

---

### Phase 3: 품질 강화 (구현 후 추가)

**[P2] SUGGESTION-03: 접근성 키보드 네비게이션 우선순위**
- 예상 공수: 0.5일 (P0 필수 항목만 구현)
- 조치: 011-ui-design.md 섹션 4.4 우선순위 표 추가
- 산출물: Phase 1~3 구현 계획

**[P2] SUGGESTION-04: 순환 의존성 화살표 애니메이션**
- 예상 공수: 0.5일 (CSS 애니메이션 + 테스트)
- 조치: main.css에 dash-flow 애니메이션 추가
- 산출물: 순환 의존성 시각적 강조 개선

---

## 12. 최종 권고사항

### 12.1 즉시 조치 필요 (BLOCKER)

1. **Gantt 차트 구현 여부 결정**
   - 현재 상태: Frappe Gantt 미설치, 메뉴 비활성화
   - 권장 방안: Vue Flow 타임라인 뷰로 변경 (TSK-06-01 기반 확장)
   - 대안: TSK-08-05 (Gantt 기본 구현) Task 생성 후 TSK-06-02 연기
   - 기한: 즉시 (설계 문서 업데이트 완료 후 구현 착수)

2. **PRD/WBS 일관성 확보**
   - PRD 섹션 11에 "Gantt 의존성 화살표" 추가
   - TSK-06-02 설명에 "DependencyGraph 확장" 또는 "별도 Gantt 뷰" 명시
   - 기한: Phase 1 완료 전

---

### 12.2 설계 품질 향상 권고

1. **가상화 렌더링 알고리즘 구체화**
   - 300개 이상 Task 성능 보장 필요
   - Viewport collision detection 알고리즘 명세 추가

2. **타입 시스템 개선**
   - GanttTaskBounds centerY 중복 제거
   - 타입 가드 함수 추가 (런타임 검증)

3. **접근성 우선순위 명확화**
   - P0 필수 항목 (Tab, Enter, Escape) 우선 구현
   - P1/P2는 Phase 2-3에서 추가

---

### 12.3 구현 단계 권장 순서

**Step 1: 기반 결정 (0.5-1일)**
- Gantt 차트 구현 방안 확정 (Vue Flow 타임라인 뷰 권장)
- 설계 문서 업데이트 (Gantt → DependencyGraph 용어 변경)

**Step 2: 핵심 구현 (2-3일)**
- useGanttDependencies composable 구현 (또는 useDependencyEdges)
- GanttDependencyOverlay 컴포넌트 구현
- main.css 화살표 클래스 추가
- 단위 테스트 작성 (UT-001~007)

**Step 3: 통합 및 검증 (1-2일)**
- DependencyGraph 또는 Gantt 페이지에 오버레이 통합
- E2E 테스트 작성 및 실행
- 접근성 검증 (axe-core)

**Step 4: 품질 강화 (1일)**
- 가상화 렌더링 구현 (100개 초과 시)
- 순환 의존성 애니메이션 추가
- 매뉴얼 테스트 완료

**총 예상 공수: 5-7일** (Gantt 기본 구현 불필요 가정)

---

## 13. 리뷰 요약 및 결론

### 13.1 설계 품질 종합 평가

| 평가 영역 | 점수 | 근거 |
|----------|------|------|
| 요구사항 분석 | A | FR/NFR 체계적 정의, 추적성 100% |
| 아키텍처 설계 | A | SVG 오버레이 접근 우수, SOLID 준수 |
| 인터페이스 설계 | A | Composable 계약 명확, 타입 안전 |
| UI/UX 설계 | A | CSS 중앙화, 접근성 WCAG AA |
| 테스트 설계 | A+ | 단위/E2E/매뉴얼 100% 커버 |
| 실현 가능성 | C+ | Gantt 차트 미구현 BLOCKER |
| **종합 평가** | **B+** | 설계 우수, 구현 기반 해결 필요 |

---

### 13.2 핵심 개선 사항 요약

**MAJOR 이슈 (1건):**
- Gantt 차트 미구현 → Vue Flow 타임라인 뷰로 변경 권장

**SUGGESTION (4건):**
1. GanttTaskBounds 타입 centerY 중복 제거
2. 가상화 렌더링 알고리즘 구체화 (300개 Task 성능 보장)
3. 접근성 키보드 네비게이션 우선순위 명확화
4. 순환 의존성 화살표 애니메이션 강화

---

### 13.3 최종 결론

**설계 품질:**
- 아키텍처 설계 매우 우수 (SVG 오버레이, Composable 분리)
- 테스트 커버리지 100% 달성 (단위/E2E/매뉴얼)
- CSS 중앙화 원칙 철저 준수
- WCAG 2.1 AA 접근성 기준 충족

**실현 가능성:**
- Frappe Gantt 미설치로 구현 차단 가능성 높음
- Vue Flow 타임라인 뷰로 변경 시 1-2일 내 구현 가능
- TSK-06-01 코드 재사용으로 기술 리스크 최소화

**권장 조치:**
1. **즉시**: Vue Flow 타임라인 뷰 변경 결정 (방안 B 채택)
2. **Phase 1**: 설계 문서 업데이트 (용어 변경, PRD 반영)
3. **Phase 2**: 핵심 구현 (composable + 컴포넌트 + 테스트)
4. **Phase 3**: 품질 강화 (가상화, 애니메이션)

**예상 일정:**
- 설계 조정: 0.5-1일
- 구현: 2-3일
- 통합 및 검증: 1-2일
- 품질 강화: 1일
- **총 5-7일** (Gantt 기본 구현 불필요 시)

**최종 승인 권고:**
- 설계 품질: 승인 (A 등급)
- 구현 진행: 조건부 승인 (Gantt 차트 방안 결정 후)

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- UI 설계: `011-ui-design.md`
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 테스트 명세: `026-test-specification.md`
- PRD: `.jjiban/projects/jjiban개선/prd.md` (섹션 11)
- TRD: `.jjiban/projects/jjiban개선/trd.md`
- 선행 Task: TSK-06-01 `030-implementation.md`

---

<!--
author: Claude (Refactoring Expert)
Template Version: 1.0.0
Review Date: 2025-12-17
-->
