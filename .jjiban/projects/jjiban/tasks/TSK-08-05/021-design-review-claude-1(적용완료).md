# 설계리뷰 (021-design-review-claude-1.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **리뷰 규칙**
> * 기본설계, 상세설계의 PRD/TRD 일관성 검증
> * CSS 클래스 중앙화 원칙 준수 여부 확인
> * 코딩 표준 및 베스트 프랙티스 준수 확인
> * 잠재적 문제점 식별 및 개선안 제시
> * 승인/조건부승인/반려 결정

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-05 |
| Task명 | TaskDetailPanel Dialog Migration |
| Category | development |
| 상태 | [dd] 상세설계 완료 |
| 리뷰일 | 2025-12-16 |
| 리뷰어 | Claude Opus 4.5 |

### 리뷰 대상 문서

| 문서 유형 | 파일명 | 버전 |
|----------|--------|------|
| 기본설계 | `010-basic-design.md` | 3.0.0 |
| 상세설계 | `020-detail-design.md` | 3.0.0 |
| 추적성 매트릭스 | `025-traceability-matrix.md` | 3.0.0 |
| 테스트 명세 | `026-test-specification.md` | 3.0.0 |

---

## 1. 리뷰 요약

### 1.1 총평

TSK-08-05의 기본설계 및 상세설계는 CSS 클래스 중앙화 원칙과 PrimeVue 마이그레이션 요구사항을 충실히 반영하고 있습니다. 설계 문서는 체계적이고 명확하며, TSK-08-01, TSK-08-02에서 확립된 패턴을 일관되게 적용하고 있습니다.

그러나 **3가지 중요한 개선 사항**이 확인되었습니다:
1. TaskDetailPanel의 동적 계산 스타일 처리 방식 명확화 필요
2. CSS 클래스명 일관성 개선 필요
3. 마이그레이션 순서 최적화 필요

이러한 개선 사항은 구현 전에 반드시 반영되어야 합니다.

### 1.2 리뷰 결과

| 구분 | 결과 |
|------|------|
| 최종 판정 | ✅ **조건부 승인** |
| 승인 조건 | 3가지 개선 사항 반영 |
| 구현 진행 가능 여부 | ⚠️ 개선 사항 반영 후 진행 |

### 1.3 평가 점수표

| 평가 항목 | 점수 (10점 만점) | 코멘트 |
|----------|----------------|--------|
| PRD/TRD 일관성 | 10 | 완벽한 요구사항 추적성 |
| 설계 완전성 | 9 | 일부 동적 스타일 처리 명확화 필요 |
| 코딩 표준 준수 | 8 | CSS 클래스명 일관성 개선 필요 |
| 기술적 타당성 | 9 | 검증된 패턴 재사용 |
| 테스트 가능성 | 10 | 명확한 data-testid 유지 |
| 문서 품질 | 10 | 체계적이고 상세한 문서화 |
| **총점** | **56/60** | **93.3%** |

---

## 2. 요구사항 충족도 검증

### 2.1 기능 요구사항 (FR) 검증

| FR ID | 요구사항 | 설계 반영 여부 | 검증 결과 | 비고 |
|-------|---------|--------------|----------|------|
| FR-001 | TaskDetailPanel 인라인 스타일 제거 | ✅ 반영 | ✅ PASS | Dialog width만 CSS 클래스화 |
| FR-002 | TaskWorkflow WORKFLOW_THEME 제거 | ✅ 반영 | ✅ PASS | getNodeClass() 함수로 변환 |
| FR-003 | TaskHistory HISTORY_THEME 제거 | ✅ 반영 | ✅ PASS | getEntryMarkerClass() 함수로 변환 |
| FR-004 | TaskDocuments 인라인 스타일 제거 | ✅ 반영 | ✅ PASS | getDocumentCardClasses() 확장 |
| FR-005 | CSS 클래스 정의 | ✅ 반영 | ⚠️ 개선 필요 | 클래스명 일관성 개선 권장 |
| FR-006 | themeConfig.ts 삭제 | ✅ 반영 | ✅ PASS | 의존성 확인 절차 명확 |
| FR-007 | 기존 기능 유지 | ✅ 반영 | ✅ PASS | data-testid 유지, 시각적 일치 |

**결과**: 7개 중 6개 PASS, 1개 개선 필요 (85.7%)

### 2.2 비기능 요구사항 (NFR) 검증

| NFR ID | 요구사항 | 설계 반영 여부 | 검증 결과 | 비고 |
|--------|---------|--------------|----------|------|
| NFR-001 | 유지보수성 | ✅ 반영 | ✅ PASS | CSS 클래스 중앙화 완료 |
| NFR-002 | 일관성 | ✅ 반영 | ✅ PASS | PRD 10.1 Dark Blue 테마 일치 |
| NFR-003 | 테스트 호환성 | ✅ 반영 | ✅ PASS | data-testid 모두 유지 |
| NFR-004 | 성능 | ✅ 반영 | ✅ PASS | 렌더링 성능 영향 없음 |

**결과**: 4개 중 4개 PASS (100%)

### 2.3 CSS 클래스 중앙화 원칙 (TRD 2.3.6) 준수도

| 원칙 | 설계 반영 여부 | 검증 결과 | 비고 |
|------|--------------|----------|------|
| 인라인 스타일 금지 | ✅ 반영 | ⚠️ 개선 필요 | 동적 계산 예외 명확화 필요 |
| HEX 하드코딩 금지 | ✅ 반영 | ✅ PASS | CSS 변수 참조로 변환 |
| main.css 중앙 관리 | ✅ 반영 | ✅ PASS | 모든 클래스 main.css에 정의 |
| :class 바인딩 우선 | ✅ 반영 | ✅ PASS | :style 완전 제거 (예외 1건) |

**결과**: 4개 중 3개 PASS, 1개 개선 필요 (75%)

---

## 3. 설계 품질 검증

### 3.1 PRD/TRD 일관성

#### ✅ PASS

1. **PRD 6.3 (Task Detail Panel)**: 모든 UI 요구사항 반영
2. **PRD 10.1 (UI 디자인 시스템)**: Dark Blue 테마 색상 팔레트 일치
3. **TRD 2.3.3 (PrimeVue 최우선 사용)**: Dialog, Panel, Timeline, Card 컴포넌트 활용
4. **TRD 2.3.4 (Dark Blue 테마)**: CSS 변수 매핑 정확

#### ❌ 문제점 없음

### 3.2 코딩 표준 준수

#### ✅ PASS

1. **Vue 3 Composition API**: `<script setup>` 사용
2. **TypeScript 필수**: 모든 함수 시그니처 타입 정의
3. **PrimeVue 컴포넌트 우선**: 일반 HTML 미사용
4. **data-testid 속성 유지**: E2E 테스트 호환성 보장

#### ⚠️ 개선 필요

1. **CSS 클래스명 일관성**: 일부 클래스명이 기존 패턴과 다름 (상세: 섹션 4.2)
2. **동적 스타일 예외 처리**: 예외 허용 조건 명확화 필요 (상세: 섹션 4.1)

### 3.3 기술적 타당성

#### ✅ PASS

1. **검증된 패턴 재사용**: TSK-08-01, TSK-08-02 패턴 일관성 있게 적용
2. **CSS 변수 매핑 정확성**: tailwind.config.ts 연동 구조 유지
3. **타입 안전성**: TypeScript 컴파일 에러 없음 예상
4. **롤백 전략**: 단계별 Git commit으로 안전한 롤백 가능

#### ❌ 문제점 없음

---

## 4. 지적사항 및 개선안

### 4.1 중요 (High Priority)

#### 지적사항 1: TaskDetailPanel 동적 스타일 처리 명확화 부족

**문제점**:

상세설계 섹션 7.1에서 TaskDetailPanel의 콘텐츠 div에 대해 다음과 같이 명시:

```vue
<!-- 변경 후 -->
<div :style="{ maxHeight: 'calc(100vh - 200px)' }">  <!-- 동적 계산 예외 -->
```

그러나 현재 코드는 다음과 같이 정적 인라인 스타일을 사용:

```vue
<!-- 현재 코드 (TaskDetailPanel.vue:71) -->
<div class="task-detail-content overflow-y-auto" style="max-height: calc(100vh - 200px);">
```

**문제 분석**:

1. `style="..."` (정적 인라인 스타일)과 `:style="..."` (동적 바인딩)의 구분 명확화 필요
2. CLAUDE.md 예외 규칙은 **"동적 계산 필수"** 케이스를 대상으로 함
3. `calc(100vh - 200px)`는 정적이므로 CSS 클래스로 정의 가능

**개선안**:

**Option 1: CSS 클래스로 이동 (권장)**

```css
/* main.css */
.task-detail-content {
  max-height: calc(100vh - 200px);
}
```

```vue
<!-- TaskDetailPanel.vue -->
<div class="task-detail-content overflow-y-auto">
  <!-- style 속성 완전 제거 -->
</div>
```

**Option 2: 진정한 동적 계산으로 변경 (대안)**

```vue
<script setup>
// 헤더 높이를 props 또는 상태로 받아서 동적 계산
const headerHeight = ref(200)
const contentMaxHeight = computed(() => `calc(100vh - ${headerHeight.value}px)`)
</script>

<template>
  <div :style="{ maxHeight: contentMaxHeight }">
    <!-- 동적 계산 정당화 -->
  </div>
</template>
```

**권장 사항**: **Option 1 채택**. `calc(100vh - 200px)`는 정적 값이므로 CSS 클래스로 정의 가능.

**영향 범위**:
- 상세설계 섹션 7.1 수정
- 기본설계 섹션 3.2 예외 조건 명확화

---

#### 지적사항 2: CSS 클래스명 일관성 개선 필요

**문제점**:

기본설계 및 상세설계에서 제안된 CSS 클래스명이 기존 패턴과 일부 불일치:

| 컴포넌트 | 제안 클래스명 | 기존 패턴 | 일관성 |
|----------|-------------|----------|--------|
| TaskWorkflow | `.workflow-node-completed` | `.node-icon-project` (TSK-08-01) | ⚠️ 불일치 |
| TaskWorkflow | `.workflow-node-current` | `.status-done` (main.css:151) | ⚠️ 불일치 |
| TaskHistory | `.history-marker-transition` | `.level-badge-project` (main.css:113) | ⚠️ 불일치 |
| TaskDocuments | `.doc-card-exists` | `.category-tag-development` (main.css:285) | ⚠️ 불일치 |

**기존 패턴 분석** (main.css 기준):

1. **아이콘 클래스**: `.node-icon-{type}` (예: `.node-icon-project`)
2. **배지 클래스**: `.level-badge-{type}`, `.status-badge`, `.category-tag`
3. **카드 클래스**: `.card`, `.card-hover`

**개선안**:

**일관성 있는 명명 규칙 적용**:

```css
/* TaskWorkflow - 기존 패턴 따르기 */
.workflow-step-completed {  /* node → step */
  @apply bg-success text-white;
}

.workflow-step-current {
  @apply bg-primary text-white font-bold;
  transform: scale(1.1);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.workflow-step-pending {
  @apply bg-gray-200 text-gray-500 border-2 border-dashed border-gray-400;
}

/* TaskHistory - 배지 패턴 따르기 */
.history-badge-transition {  /* marker → badge */
  @apply bg-primary;
}

.history-badge-action {
  @apply bg-level-project;
}

.history-badge-update {
  @apply bg-success;
}

.history-badge-default {
  @apply bg-gray-500;
}

/* TaskDocuments - 카드 패턴 따르기 */
.doc-card-exists {  /* 이미 일관성 있음 */
  @apply bg-blue-100 border border-primary;
}

.doc-card-expected {
  @apply bg-gray-50 border-2 border-dashed border-gray-400 opacity-60 cursor-not-allowed;
}
```

**권장 사항**:
- `workflow-node-*` → `workflow-step-*`
- `history-marker-*` → `history-badge-*`
- `doc-card-*` 유지 (이미 일관성 있음)

**영향 범위**:
- 상세설계 섹션 6.1, 7.2, 7.3
- 기본설계 섹션 3.3, 3.4, 5.1
- main.css 클래스명 변경

---

### 4.2 보통 (Medium Priority)

#### 지적사항 3: 마이그레이션 순서 최적화

**문제점**:

기본설계 섹션 8.1에서 제안된 마이그레이션 순서:

```
1. main.css 클래스 정의
2. TaskWorkflow 마이그레이션
3. TaskHistory 마이그레이션
4. TaskDocuments 마이그레이션
5. TaskDetailPanel 마이그레이션
6. themeConfig.ts 삭제
7. 회귀 테스트
```

**개선 포인트**:

1. **themeConfig.ts 삭제 시점**: 2~4단계 완료 후 즉시 삭제하면 TypeScript 컴파일 에러로 조기 검증 가능
2. **TaskDetailPanel 우선순위**: 가장 간단한 변경이므로 먼저 처리하여 성공 경험 축적

**개선안**:

```
1. main.css 클래스 정의
2. TaskDetailPanel 마이그레이션 (가장 간단)
3. TaskDocuments 마이그레이션 (HEX 제거)
4. TaskWorkflow 마이그레이션 (WORKFLOW_THEME 제거)
5. TaskHistory 마이그레이션 (HISTORY_THEME 제거)
6. themeConfig.ts 삭제 (즉시 TypeScript 검증)
7. 회귀 테스트
```

**근거**:

- 간단한 것부터 복잡한 순으로 진행 (심리적 안정감)
- themeConfig.ts 조기 삭제로 TypeScript 컴파일러의 의존성 검증 활용
- 4~5단계에서 문제 발생 시 3단계까지는 안전 확보

**영향 범위**:
- 기본설계 섹션 8.1
- 상세설계 섹션 8.1

---

### 4.3 낮음 (Low Priority)

#### 지적사항 4: CSS 변수 매핑 문서화 개선

**문제점**:

상세설계 섹션 6.2 "CSS 변수 매핑표"에서 일부 색상은 CSS 변수 없이 직접 Tailwind 클래스 사용:

```
| (없음) | #e5e7eb | bg-gray-200 | TaskWorkflow |
| (없음) | #dbeafe | bg-blue-100 | TaskDocuments |
```

**개선안**:

main.css에 보조 색상 CSS 변수 추가하여 일관성 강화:

```css
:root {
  /* 기존 변수 유지 */
  --color-primary: #3b82f6;
  --color-success: #22c55e;

  /* 보조 색상 추가 */
  --color-gray-200: #e5e7eb;
  --color-blue-100: #dbeafe;
  --color-gray-50: #f9fafb;
}
```

```css
.workflow-step-pending {
  background-color: var(--color-gray-200);  /* bg-gray-200 대신 */
  color: #6b7280;
  border: 2px dashed #9ca3af;
}

.doc-card-exists {
  background-color: var(--color-blue-100);  /* bg-blue-100 대신 */
  border: 1px solid var(--color-primary);
}
```

**권장 사항**: 선택 사항. Tailwind @apply 사용이 더 간결하므로 현재 방식 유지 가능.

**영향 범위**: main.css (선택 사항)

---

## 5. 체크리스트 검증

### 5.1 설계 문서 완전성

| 항목 | 상태 | 비고 |
|------|------|------|
| 요구사항 추적성 | ✅ | 025-traceability-matrix.md 완비 |
| 인터페이스 정의 | ✅ | 섹션 7.1~7.4 상세 명세 |
| 프로세스 흐름 | ✅ | Mermaid 시퀀스 다이어그램 |
| 예외 처리 | ✅ | 섹션 10.1~10.2 |
| 테스트 명세 | ✅ | 026-test-specification.md 완비 |
| 롤백 전략 | ✅ | 섹션 8.3 Git commit 전략 |

### 5.2 구현 준비도

| 항목 | 상태 | 비고 |
|------|------|------|
| CSS 클래스 정의 완료 | ⚠️ | 클래스명 일관성 개선 필요 |
| 함수 시그니처 정의 | ✅ | 타입 안전성 확보 |
| data-testid 유지 확인 | ✅ | E2E 테스트 호환성 |
| TypeScript 타입 정의 | ✅ | 컴파일 에러 없음 예상 |
| 의존성 제거 계획 | ✅ | themeConfig.ts 삭제 절차 명확 |

### 5.3 품질 보증

| 항목 | 상태 | 비고 |
|------|------|------|
| 색상 일치 검증 방법 | ✅ | 개발자 도구 Computed Style |
| 회귀 테스트 계획 | ✅ | Before/After 스크린샷 비교 |
| E2E 테스트 유지 | ✅ | data-testid 변경 없음 |
| 성능 영향 평가 | ✅ | < 5% 기준 명확 |

---

## 6. 승인 조건

### 6.1 필수 개선 사항 (구현 전 반영 필수)

| No | 개선 사항 | 우선순위 | 담당자 | 예상 소요 시간 |
|----|----------|---------|--------|--------------|
| 1 | TaskDetailPanel 동적 스타일 처리 명확화 | High | 개발자 | 30분 |
| 2 | CSS 클래스명 일관성 개선 | High | 개발자 | 1시간 |
| 3 | 마이그레이션 순서 최적화 | Medium | 개발자 | 15분 |

### 6.2 권장 개선 사항 (구현 중 고려)

| No | 개선 사항 | 우선순위 | 담당자 | 예상 소요 시간 |
|----|----------|---------|--------|--------------|
| 4 | CSS 변수 매핑 문서화 개선 | Low | 개발자 | 30분 (선택) |

---

## 7. 승인 의견

### 7.1 승인 상태

**✅ 조건부 승인**

### 7.2 승인 조건

다음 **3가지 필수 개선 사항** 반영 후 구현 진행 가능:

1. **TaskDetailPanel 동적 스타일 처리**: `calc(100vh - 200px)`를 CSS 클래스로 이동
2. **CSS 클래스명 일관성**: `workflow-node-*` → `workflow-step-*`, `history-marker-*` → `history-badge-*`
3. **마이그레이션 순서**: TaskDetailPanel 우선 처리, themeConfig.ts 조기 삭제

### 7.3 승인 사유

#### 강점

1. **체계적 설계**: PRD/TRD 요구사항 100% 반영
2. **검증된 패턴**: TSK-08-01, TSK-08-02 패턴 일관성 있게 재사용
3. **완벽한 추적성**: 요구사항 ↔ 설계 ↔ 테스트 완벽 매핑
4. **안전한 롤백**: 단계별 Git commit 전략으로 위험 최소화
5. **명확한 테스트 전략**: E2E 테스트 호환성 및 회귀 방지

#### 개선 영역

1. **일관성 부족**: CSS 클래스명이 기존 패턴과 일부 불일치
2. **예외 처리 명확화**: 동적 스타일 예외 조건 명확화 필요
3. **최적화 여지**: 마이그레이션 순서 조정으로 효율성 향상 가능

### 7.4 다음 단계

1. **설계 수정** (예상 1.5시간):
   - 지적사항 1~3 반영
   - 기본설계 및 상세설계 문서 업데이트
   - 추적성 매트릭스 재검증

2. **구현 진행** (`/wf:build`):
   - 수정된 설계에 따라 마이그레이션 실행
   - 단계별 Git commit 생성
   - TypeScript 컴파일 검증

3. **품질 검증**:
   - Before/After 스크린샷 비교
   - E2E 테스트 실행
   - 색상 일치 검증 (개발자 도구)

---

## 8. 리뷰 상세 코멘트

### 8.1 기본설계 (010-basic-design.md)

#### ✅ 우수한 점

1. **섹션 2.1~2.3**: 현황 분석 매우 상세하고 정확
2. **섹션 3.1**: 마이그레이션 전략 명확하고 검증된 패턴 재사용
3. **섹션 5.1**: main.css 클래스 정의 체계적이고 완전함
4. **섹션 6.1~6.3**: 테스트 전략 구체적이고 실행 가능

#### ⚠️ 개선 필요

1. **섹션 3.2**: TaskDetailPanel 동적 스타일 예외 조건 명확화 (지적사항 1)
2. **섹션 5.1**: CSS 클래스명 일관성 개선 (지적사항 2)
3. **섹션 8.1**: 마이그레이션 순서 최적화 (지적사항 3)

### 8.2 상세설계 (020-detail-design.md)

#### ✅ 우수한 점

1. **섹션 6.1**: CSS 클래스 설계 상세하고 명확
2. **섹션 7.1~7.4**: 컴포넌트 인터페이스 명세 완벽
3. **섹션 8.2**: Mermaid 시퀀스 다이어그램 명확
4. **섹션 11**: 구현 체크리스트 실행 가능

#### ⚠️ 개선 필요

1. **섹션 7.1**: TaskDetailPanel 동적 스타일 명세 수정 (지적사항 1)
2. **섹션 6.1, 7.2, 7.3**: CSS 클래스명 일관성 개선 (지적사항 2)
3. **섹션 8.1**: 마이그레이션 순서 조정 (지적사항 3)

### 8.3 추적성 매트릭스 (025-traceability-matrix.md)

#### ✅ 우수한 점

1. 요구사항 ↔ 설계 ↔ 테스트 완벽 매핑
2. 누락된 항목 없음
3. 명확한 추적 ID 체계

#### ❌ 문제점 없음

### 8.4 테스트 명세 (026-test-specification.md)

#### ✅ 우수한 점

1. 테스트 시나리오 구체적이고 실행 가능
2. data-testid 명확히 명시
3. 예상 결과 명확

#### ❌ 문제점 없음

---

## 9. 참고 자료

### 9.1 참조 문서

- PRD: `.jjiban/jjiban/prd.md` 섹션 6.3, 10.1
- TRD: `.jjiban/jjiban/trd.md` 섹션 2.3.3, 2.3.4, 2.3.6
- CLAUDE.md: CSS 클래스 중앙화 원칙
- TSK-08-01: `021-design-review-claude-1.md` (NodeIcon 패턴)
- TSK-08-02: `021-design-review-claude-1.md` (CategoryTag, ProgressBar 패턴)

### 9.2 현재 코드 분석 결과

#### themeConfig.ts 의존성 확인

```bash
# Grep 검색 결과
app\components\wbs\detail\TaskHistory.vue
app\components\wbs\detail\TaskWorkflow.vue
```

**확인 사항**: TaskDocuments.vue는 themeConfig.ts를 import하지 않고 HEX 직접 하드코딩 (설계 문서 정확)

#### 현재 인라인 스타일 현황

1. **TaskDetailPanel.vue:6**: Dialog `:style="{ width: '80vw', maxWidth: '1200px' }"`
2. **TaskDetailPanel.vue:71**: 콘텐츠 div `style="max-height: calc(100vh - 200px);"`
3. **TaskWorkflow.vue:18**: 노드 `:style="getNodeStyle(index)"`
4. **TaskHistory.vue:18**: 마커 `:style="{ backgroundColor: getEntryColor(slotProps.item) }"`
5. **TaskDocuments.vue:14**: 카드 `:style="getDocumentCardStyle(doc)"`

**확인 사항**: 설계 문서가 정확히 파악하고 있음

---

## 10. 리뷰어 서명

| 항목 | 내용 |
|------|------|
| 리뷰어 | Claude Opus 4.5 |
| 리뷰 일시 | 2025-12-16 |
| 승인 상태 | ✅ 조건부 승인 |
| 승인 조건 | 3가지 필수 개선 사항 반영 |
| 다음 단계 | 설계 수정 → 구현 진행 |

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
