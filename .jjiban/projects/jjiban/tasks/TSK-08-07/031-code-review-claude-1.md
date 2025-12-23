# 코드 리뷰: TSK-08-07

## 리뷰 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-07 |
| 리뷰어 | Claude |
| 리뷰일 | 2025-12-16 |
| 리뷰 범위 | Stepper + Popover 워크플로우 UI 구현 |

## 리뷰 요약
- 총 지적 사항: 9건
- Critical: 0건
- Major: 3건
- Minor: 6건

## 지적 사항

### [CR-001] Popover ref 타입 안전성 부족
- **심각도**: Major
- **파일**: `app/components/wbs/detail/TaskProgress.vue`
- **라인**: 186, 57
- **설명**: `popoverRefs`가 `any[]`로 타입 선언되어 있어 타입 안전성이 없음. PrimeVue Popover 컴포넌트의 실제 타입을 사용해야 함.
- **권장 수정**:
```typescript
// 현재 (잘못됨)
const popoverRefs = ref<any[]>([])

// 권장
import type Popover from 'primevue/popover'
const popoverRefs = ref<InstanceType<typeof Popover>[]>([])
```
- **영향**: 런타임 오류 가능성, IDE 자동완성 미지원

---

### [CR-002] CSS 클래스 중앙화 원칙 위반
- **심각도**: Minor
- **파일**: `app/components/wbs/detail/TaskProgress.vue`
- **라인**: 115-117, 423-496
- **설명**: Scoped CSS에서 인라인 조건부 클래스를 사용하고 있으나, 프로젝트 규칙에 따라 `main.css`에 통합해야 함. 특히 `font-semibold text-blue-600`, `text-gray-600` 등의 동적 스타일은 CSS 변수 또는 전역 클래스로 정의해야 함.
- **권장 수정**:
```css
/* main.css에 추가 */
.workflow-step-label-current {
  @apply font-semibold text-primary;
}

.workflow-step-label-default {
  @apply text-text-muted;
}
```
```vue
<!-- Vue 템플릿 -->
<div
  class="workflow-step-label"
  :class="{
    'workflow-step-label-current': index === currentStepIndex,
    'workflow-step-label-default': index !== currentStepIndex,
  }"
>
```
- **영향**: CSS 유지보수성 저하, 디자인 일관성 훼손

---

### [CR-003] 하드코딩된 색상 클래스
- **심각도**: Minor
- **파일**: `app/components/wbs/detail/TaskProgress.vue`
- **라인**: 6, 51, 116-117, 484
- **설명**: `text-gray-600`, `text-gray-400`, `bg-gray-500` 등이 하드코딩되어 있음. 프로젝트 디자인 토큰(`--color-text-secondary`, `--color-text-muted`)을 사용해야 함.
- **권장 수정**:
```css
/* 현재 (잘못됨) */
class="font-semibold text-sm text-gray-600"

/* 권장 */
class="font-semibold text-sm text-text-secondary"
```
- **영향**: 다크 테마 일관성 저하, CSS 변수 변경 시 스타일 불일치

---

### [CR-004] getCompletedDate() 함수의 타입 안전성 부족
- **심각도**: Major
- **파일**: `app/components/wbs/detail/TaskProgress.vue`
- **라인**: 313-321
- **설명**: `props.task.completed` 객체에 대한 키 존재 검증 없이 접근하고 있음. 존재하지 않는 상태 코드에 대해 undefined 처리가 명확하지 않음.
- **권장 수정**:
```typescript
function getCompletedDate(statusCode: string): string {
  if (!props.task.completed) return '미완료'

  // 상태 코드에서 키 추출 (예: '[bd]' → 'bd')
  const key = statusCode.replace(/[\[\]]/g, '')

  // 타입 가드 추가
  if (!Object.prototype.hasOwnProperty.call(props.task.completed, key)) {
    return '미완료'
  }

  const timestamp = props.task.completed[key]
  return timestamp || '미완료'
}
```
- **영향**: 잠재적 런타임 오류, 타입 안전성 저하

---

### [CR-005] 접근성 (A11y) 개선 필요
- **심각도**: Minor
- **파일**: `app/components/wbs/detail/TaskProgress.vue`
- **라인**: 22-53
- **설명**: Stepper 버튼에 `role="button"`과 `aria-label`이 있지만, Popover가 열려 있을 때 `aria-expanded` 속성이 없음. 스크린 리더 사용자에게 Popover 상태를 알려야 함.
- **권장 수정**:
```vue
<button
  :id="`step-${index}`"
  class="workflow-step-circle workflow-step-clickable"
  :aria-label="`${step.label} 단계`"
  :aria-expanded="isPopoverOpen(index)"
  :aria-current="index === currentStepIndex ? 'step' : undefined"
  role="button"
  tabindex="0"
  @click="togglePopover(index, $event)"
>
```
- **영향**: WCAG 2.1 Level AA 준수 실패, 스크린 리더 사용자 경험 저하

---

### [CR-006] 중복된 워크플로우 버튼 설정
- **심각도**: Minor
- **파일**: `app/components/wbs/detail/TaskProgress.vue`, `app/components/wbs/detail/TaskBasicInfo.vue`
- **라인**: TaskProgress.vue 290-304, TaskBasicInfo.vue 326-339
- **설명**: `workflowButtonConfig` 객체가 두 컴포넌트에서 동일하게 정의되어 있음. 공통 설정 파일 또는 Composable로 추출해야 함.
- **권장 수정**:
```typescript
// app/composables/useWorkflowConfig.ts (신규 파일)
export const useWorkflowConfig = () => {
  const workflowButtonConfig: Record<string, { label: string; icon: string; severity: string }> = {
    start: { label: '시작', icon: 'pi pi-play', severity: 'primary' },
    draft: { label: '초안 작성', icon: 'pi pi-pencil', severity: 'info' },
    build: { label: '구현', icon: 'pi pi-cog', severity: 'success' },
    verify: { label: '검증', icon: 'pi pi-check-circle', severity: 'warn' },
    done: { label: '완료', icon: 'pi pi-flag', severity: 'success' },
    // ... 나머지
  }

  return { workflowButtonConfig }
}

// 컴포넌트에서 사용
const { workflowButtonConfig } = useWorkflowConfig()
```
- **영향**: DRY 원칙 위반, 유지보수 비용 증가

---

### [CR-007] 매직 넘버 사용
- **심각도**: Minor
- **파일**: `app/components/wbs/detail/TaskProgress.vue`
- **라인**: 449, 472, 475
- **설명**: `28px`, `24px`, `12px` 등 하드코딩된 크기 값이 있음. CSS 변수로 정의하여 일관성을 유지해야 함.
- **권장 수정**:
```css
/* main.css */
:root {
  --workflow-step-circle-size: 28px;
  --workflow-connector-width: 24px;
  --workflow-connector-height: 3px;
}

.workflow-step-circle {
  width: var(--workflow-step-circle-size);
  height: var(--workflow-step-circle-size);
  /* ... */
}
```
- **영향**: CSS 변경 시 일관성 유지 어려움

---

### [CR-008] TaskBasicInfo.vue의 navigateToTask() 피드백 부족
- **심각도**: Minor
- **파일**: `app/components/wbs/detail/TaskBasicInfo.vue`
- **라인**: 509-512
- **설명**: `navigateToTask()` 함수가 Task ID로 이동하지만, 해당 Task가 존재하지 않거나 로드 실패 시 에러 핸들링이 없음.
- **권장 수정**:
```typescript
async function navigateToTask(taskId: string) {
  try {
    await selectionStore.selectNode(taskId)
    notification.info(`${taskId} Task로 이동합니다.`)
  } catch (error) {
    notification.error(`${taskId} Task를 찾을 수 없습니다.`)
    errorHandler.handle(error, 'TaskBasicInfo.navigateToTask')
  }
}
```
- **영향**: 사용자 경험 저하, 오류 추적 어려움

---

### [CR-009] CSS Popover 토큰 중복 정의
- **심각도**: Major
- **파일**: `app/assets/css/main.css`
- **라인**: 783-789
- **설명**: Popover 디자인 토큰이 `:root` 블록 내에서 정의되어 있으나, 다른 PrimeVue 컴포넌트 토큰들과 분리되어 있음. 일관성을 위해 기존 토큰 정의 영역(라인 180-255)에 통합해야 함.
- **권장 수정**:
```css
/* 현재 라인 783-789를 삭제하고, 라인 255 이후에 추가 */
:root {
  /* ... 기존 토큰들 ... */

  /* PrimeVue Popover 컴포넌트 */
  --p-popover-background: var(--color-card);
  --p-popover-color: var(--color-text);
  --p-popover-border-color: var(--color-border);
  --p-popover-border-radius: 0.5rem;
  --p-popover-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```
- **영향**: CSS 구조 혼란, 유지보수성 저하

---

## 긍정적인 부분

### 1. 타입 안전성 준수 (대부분)
- `TaskDetail`, `TaskCategory`, `TaskStatus` 등 프로젝트 타입 정의를 올바르게 사용
- Props 인터페이스가 명확하게 정의되어 있음

### 2. 코드 구조화
- Computed, Methods, Lifecycle 섹션이 명확하게 분리됨
- 주석으로 책임 영역이 명확히 표시됨

### 3. 에러 핸들링
- `try-catch` 블록으로 API 호출 오류를 적절히 처리
- `errorHandler.handle()` 통합 에러 핸들러 사용

### 4. CSS 클래스 네이밍
- BEM 스타일의 명확한 클래스 네이밍 (`workflow-step-circle`, `step-popover-content`)
- 의미 있는 상태 클래스 (`workflow-step-current`, `workflow-step-completed`)

### 5. PrimeVue 통합
- PrimeVue 컴포넌트(Panel, Badge, Button, Popover) 올바르게 사용
- 디자인 토큰을 활용한 다크 테마 통합

---

## 권장 사항

### 1. 타입 안전성 강화
- `any` 타입 제거 및 정확한 타입 정의 사용
- 옵셔널 체이닝(`?.`)과 타입 가드 추가

### 2. CSS 중앙화 원칙 준수
- 모든 색상/크기 하드코딩을 CSS 변수로 대체
- Scoped CSS를 최소화하고 `main.css`로 통합

### 3. 코드 재사용성 향상
- 중복된 `workflowButtonConfig`를 Composable로 추출
- 공통 유틸리티 함수 생성

### 4. 접근성 개선
- `aria-expanded`, `aria-haspopup` 속성 추가
- 키보드 탐색 테스트 수행

### 5. 테스트 작성
- Popover 토글 동작 단위 테스트
- Auto 버튼 및 액션 버튼 E2E 테스트

---

## 결론

TSK-08-07 구현은 전반적으로 **양호한 품질**을 보여주고 있습니다. 주요 기능(Stepper, Popover, 완료일 표시, Auto 버튼)이 정상 작동하며, PrimeVue 통합과 타입 안전성이 대부분 준수되었습니다.

그러나 **타입 안전성 강화**(CR-001, CR-004), **CSS 중앙화 원칙 준수**(CR-002, CR-003, CR-009), **코드 재사용성**(CR-006) 개선이 필요합니다. 특히 CR-001, CR-004, CR-009는 **Major** 심각도로, 다음 Task에서 우선 수정을 권장합니다.

**추천 액션:**
1. CR-001, CR-004, CR-009를 우선 수정 (Major 심각도)
2. CR-002, CR-003, CR-007을 단계적으로 개선 (CSS 중앙화)
3. CR-006을 리팩토링 Task로 등록 (Composable 추출)
4. CR-005, CR-008은 유지보수 시 점진적 개선

**최종 평가**: ⭐⭐⭐⭐☆ (4/5)
기능 구현과 코드 구조는 우수하나, 타입 안전성과 CSS 중앙화 개선 필요
