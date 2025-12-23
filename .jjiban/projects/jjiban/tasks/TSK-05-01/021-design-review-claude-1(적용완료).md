# 설계 리뷰 (021-design-review-claude-1.md)

**Reviewer:** Claude Opus 4.5 (refactoring-expert)
**Review Date:** 2025-12-15
**Task ID:** TSK-05-01
**Task Name:** Detail Panel Structure
**Design Document:** 020-detail-design.md

---

## 1. 리뷰 개요

### 1.1 리뷰 범위
- 아키텍처 품질 검증
- SOLID 원칙 준수 여부
- PrimeVue 4.x 컴포넌트 활용 적절성
- 상태 관리 패턴 검증
- 성능 및 접근성 고려사항
- 기술 부채 식별

### 1.2 리뷰 결과 요약

| 구분 | 평가 | 비고 |
|------|------|------|
| 전체 품질 | **우수** | 설계가 명확하고 구조화되어 있음 |
| SOLID 준수 | **양호** | 일부 개선 여지 있음 |
| 접근성 | **우수** | ARIA 속성 및 키보드 네비게이션 고려 |
| 성능 | **양호** | 낙관적 업데이트 패턴 우수, 일부 최적화 필요 |
| 기술 부채 | **낮음** | 몇 가지 개선점 존재 |

---

## 2. 긍정적 측면 (Strengths)

### 2.1 명확한 책임 분리
- TaskDetailPanel (컨테이너), TaskBasicInfo (표시), TaskProgress (진행 상태)로 SRP 준수
- 각 컴포넌트의 역할이 명확하게 정의됨

### 2.2 낙관적 업데이트 패턴
- 사용자 경험 최적화를 위한 낙관적 업데이트 + 롤백 메커니즘 우수
- API 실패 시 이전 값 복원 로직 명확

### 2.3 접근성 고려
- ARIA 속성 정의 (role, aria-label, aria-busy, aria-live)
- 키보드 네비게이션 지원 (Tab, Enter, Escape, Space)
- 포커스 관리 계획 수립

### 2.4 PrimeVue 활용
- PrimeVue 4.x 컴포넌트 적절히 선택 (Card, Panel, Tag, Badge, Dropdown, InputText, Message, Skeleton)
- 컴포넌트별 용도 명확

### 2.5 테스트 명세 충실
- E2E 테스트 시나리오 14개 정의
- data-testid 체계적으로 정의됨

---

## 3. 개선 권장 사항 (Recommendations)

### 3.1 컴포넌트 재사용성 강화 (중요도: 중)

**문제점:**
- TaskBasicInfo 컴포넌트가 제목, 우선순위, 담당자 편집 로직을 모두 포함하고 있어 복잡도가 높음
- 인라인 편집 UI가 여러 필드에 반복됨 (제목 InputText, 우선순위 Dropdown, 담당자 Dropdown)

**개선 방안:**
- 재사용 가능한 `InlineEditField` 컴포넌트 추출 고려
- Props: `value`, `type` (text | dropdown), `options` (Dropdown 용), `@update:value` 이벤트
- 장점: 코드 중복 감소, 일관된 편집 UX, 테스트 용이성 향상

**예시 구조 (개념):**
```
InlineEditField.vue
  Props: { value, type, options, label }
  Emits: { 'update:value' }

TaskBasicInfo.vue
  <InlineEditField type="text" :value="task.title" @update:value="emit('update:title', $event)" />
  <InlineEditField type="dropdown" :value="task.priority" :options="priorities" @update:value="emit('update:priority', $event)" />
```

**우선순위:** 중간 (구현 후 리팩토링 가능)

---

### 3.2 API 호출 로직 분리 (중요도: 중)

**문제점:**
- TaskDetailPanel에서 API 호출 로직 (handleUpdateTitle, handleUpdatePriority, handleUpdateAssignee)이 중복됨
- 낙관적 업데이트 + 롤백 패턴이 각 핸들러마다 반복됨

**개선 방안:**
- Composable 함수로 API 호출 로직 추출: `useOptimisticUpdate.ts`
- 책임: API 호출, 낙관적 업데이트, 롤백, 에러 처리
- 장점: DRY 원칙 준수, 테스트 용이, 재사용 가능

**예시 구조 (개념):**
```typescript
// composables/useOptimisticUpdate.ts
export function useOptimisticUpdate() {
  const updateField = async (
    taskId: string,
    field: string,
    newValue: any,
    storeRef: Ref<TaskDetail | null>
  ) => {
    const prevValue = storeRef.value?.[field]

    // 낙관적 업데이트
    if (storeRef.value) {
      storeRef.value[field] = newValue
    }

    try {
      await $fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: { [field]: newValue }
      })
      // 성공: 최신 데이터 동기화
      await refreshTaskDetail()
    } catch (error) {
      // 실패: 롤백
      if (storeRef.value) {
        storeRef.value[field] = prevValue
      }
      showToast('error', error.message)
    }
  }

  return { updateField }
}
```

**우선순위:** 중간 (구현 초기 단계에서 적용 권장)

---

### 3.3 워크플로우 단계 계산 로직 재사용 (중요도: 낮음)

**문제점:**
- TaskProgress 컴포넌트의 `workflowSteps` computed 로직이 카테고리별 하드코딩됨
- 추후 워크플로우 규칙 변경 시 컴포넌트 수정 필요

**개선 방안:**
- 워크플로우 단계 정보를 `settings/workflows.json`에서 로드하거나, 유틸리티 함수로 추출
- 장점: 설정 기반 워크플로우, 유지보수 용이

**예시 구조 (개념):**
```typescript
// utils/workflow.ts
export function getWorkflowSteps(category: TaskCategory): string[] {
  const workflows = {
    development: ['[ ]', '[bd]', '[dd]', '[im]', '[vf]', '[xx]'],
    defect: ['[ ]', '[an]', '[fx]', '[vf]', '[xx]'],
    infrastructure: ['[ ]', '[ds]', '[im]', '[xx]']
  }
  return workflows[category] || ['[ ]', '[xx]']
}
```

**우선순위:** 낮음 (현재 구조로도 충분, 추후 최적화)

---

### 3.4 에러 처리 일관성 강화 (중요도: 중)

**문제점:**
- 에러 메시지가 하드코딩되어 있음 (예: "제목은 1-200자여야 합니다")
- 다국어 지원 시 문제 발생 가능

**개선 방안:**
- 에러 메시지를 중앙화된 상수 또는 i18n 파일로 관리
- 장점: 일관된 메시지, 다국어 준비, 유지보수 용이

**예시 구조 (개념):**
```typescript
// constants/errorMessages.ts
export const ERROR_MESSAGES = {
  TITLE_LENGTH: '제목은 1-200자여야 합니다',
  INVALID_PRIORITY: '올바른 우선순위를 선택하세요',
  ASSIGNEE_NOT_FOUND: '해당 팀원을 찾을 수 없습니다',
  FILE_READ_ERROR: '데이터를 불러오는 데 실패했습니다',
  FILE_WRITE_ERROR: '변경 사항을 저장하는 데 실패했습니다',
  NETWORK_ERROR: '네트워크 연결을 확인하세요',
  TIMEOUT: '요청 시간이 초과되었습니다'
}
```

**우선순위:** 중간 (구현 초기 단계에서 적용 권장)

---

### 3.5 팀원 목록 로드 최적화 (중요도: 낮음)

**문제점:**
- TaskBasicInfo에서 팀원 목록을 매번 로드하는 것으로 보임
- 팀원 목록은 변경 빈도가 낮으므로 캐싱 가능

**개선 방안:**
- useSelectionStore 또는 별도의 useProjectStore에서 팀원 목록 캐싱
- 최초 1회 로드 후 재사용
- 장점: API 호출 감소, 성능 향상

**예시 구조 (개념):**
```typescript
// stores/project.ts
export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project | null>(null)
  const teamMembers = ref<TeamMember[]>([])

  const loadProject = async (projectId: string) => {
    if (currentProject.value?.id === projectId) return // 이미 로드됨

    const data = await $fetch(`/api/projects/${projectId}`)
    currentProject.value = data
    teamMembers.value = data.team
  }

  return { currentProject, teamMembers, loadProject }
})
```

**우선순위:** 낮음 (성능 이슈 발생 시 적용)

---

### 3.6 타입 안정성 강화 (중요도: 낮음)

**문제점:**
- API 응답 타입이 명시적으로 정의되지 않음
- `$fetch` 호출 시 타입 추론이 약할 수 있음

**개선 방안:**
- API 응답 타입을 명시적으로 정의
- `$fetch<TaskDetail>`와 같이 제네릭 타입 사용

**예시 구조 (개념):**
```typescript
// types/api.ts
export interface TaskUpdateRequest {
  title?: string
  priority?: Priority
  assignee?: string | null
}

export interface TaskUpdateResponse {
  success: boolean
  data: TaskDetail
}

// 사용 예시
const response = await $fetch<TaskUpdateResponse>(`/api/tasks/${taskId}`, {
  method: 'PUT',
  body: updateData
})
```

**우선순위:** 낮음 (TypeScript 프로젝트이므로 선택적)

---

## 4. SOLID 원칙 검증

### 4.1 Single Responsibility Principle (SRP)
**평가:** **양호**

- TaskDetailPanel: 컨테이너, Pinia 연동, API 호출
- TaskBasicInfo: 기본 정보 표시 및 인라인 편집
- TaskProgress: 진행 상태 표시

**개선점:**
- TaskBasicInfo가 여러 편집 로직을 포함하고 있어 복잡도가 높음 → InlineEditField 추출 권장 (3.1 참조)

### 4.2 Open/Closed Principle (OCP)
**평가:** **양호**

- PrimeVue 컴포넌트 기반으로 확장 가능
- Props/Emits를 통한 컴포넌트 간 통신으로 수정에 닫혀 있음

**개선점:**
- 워크플로우 단계 계산이 하드코딩되어 있어 확장성 제한 → 설정 기반으로 변경 권장 (3.3 참조)

### 4.3 Liskov Substitution Principle (LSP)
**평가:** **적용 없음**

- 이 Task는 상속 구조를 사용하지 않으므로 LSP 검증 불필요

### 4.4 Interface Segregation Principle (ISP)
**평가:** **우수**

- Props/Emits 인터페이스가 최소한으로 정의됨
- TaskBasicInfo는 `task` Props만 받고, 필요한 이벤트만 Emit

### 4.5 Dependency Inversion Principle (DIP)
**평가:** **양호**

- Pinia 스토어를 통한 의존성 주입
- API 호출이 `$fetch`를 통해 추상화됨

**개선점:**
- API 호출 로직을 Composable로 분리하면 DIP 강화 가능 (3.2 참조)

---

## 5. 성능 및 최적화

### 5.1 긍정적 측면
- 낙관적 업데이트로 200ms 이내 응답 목표 달성 가능
- Skeleton을 통한 로딩 상태 표시로 사용자 경험 향상

### 5.2 개선 가능 영역
- 팀원 목록 캐싱 부재 → useProjectStore에서 캐싱 권장 (3.5 참조)
- 워크플로우 단계 계산이 computed로 매번 실행됨 → 설정 기반으로 변경 시 캐싱 가능 (3.3 참조)

---

## 6. 보안 및 검증

### 6.1 긍정적 측면
- 클라이언트 + 서버 양측 유효성 검증 계획 (제목 길이, 우선순위, 담당자 ID)
- 에러 코드 체계 정의 (VALIDATION_ERROR, TASK_NOT_FOUND, ASSIGNEE_NOT_FOUND, FILE_READ_ERROR, FILE_WRITE_ERROR)

### 6.2 개선 가능 영역
- XSS 방어: 제목 편집 시 입력값 이스케이핑 필요 (Vue의 기본 이스케이핑 활용)
- CSRF 방어: Nuxt의 기본 CSRF 토큰 활용 확인 필요

---

## 7. 기술 부채 분석

### 7.1 현재 기술 부채
| 부채 ID | 설명 | 심각도 | 해결 우선순위 |
|---------|------|--------|--------------|
| TD-001 | 인라인 편집 로직 중복 (제목, 우선순위, 담당자) | 중간 | 중간 |
| TD-002 | API 호출 로직 중복 (낙관적 업데이트 + 롤백) | 중간 | 중간 |
| TD-003 | 에러 메시지 하드코딩 | 낮음 | 중간 |
| TD-004 | 워크플로우 단계 하드코딩 | 낮음 | 낮음 |
| TD-005 | 팀원 목록 캐싱 부재 | 낮음 | 낮음 |

### 7.2 기술 부채 해결 계획
- **TD-001, TD-002**: 구현 초기 단계에서 Composable 분리 적용
- **TD-003**: 구현 초기 단계에서 상수화 적용
- **TD-004, TD-005**: 성능 이슈 발생 시 우선순위 상향

---

## 8. 테스트 전략 평가

### 8.1 긍정적 측면
- E2E 테스트 시나리오 14개로 충분한 커버리지
- data-testid 체계적으로 정의됨
- 요구사항 추적성 매트릭스 존재 (025-traceability-matrix.md)

### 8.2 개선 가능 영역
- Composable 함수 추출 시 단위 테스트 추가 권장 (useOptimisticUpdate)
- API Mock 테스트 시나리오 명시 필요 (E2E-012, E2E-013)

---

## 9. 최종 권장사항

### 9.1 즉시 적용 권장 (구현 전)
1. **API 호출 로직 Composable 분리** (3.2): useOptimisticUpdate 추출로 코드 중복 제거
2. **에러 메시지 상수화** (3.4): 에러 메시지를 constants/errorMessages.ts로 분리

### 9.2 구현 후 리팩토링 권장
3. **InlineEditField 컴포넌트 추출** (3.1): 재사용성 강화
4. **팀원 목록 캐싱** (3.5): 성능 이슈 발생 시 적용

### 9.3 선택적 적용
5. **워크플로우 단계 설정 기반 변경** (3.3): 워크플로우 규칙 변경 빈도가 높을 경우 적용
6. **API 응답 타입 명시화** (3.6): TypeScript 안정성 강화 필요 시 적용

---

## 10. 승인 상태

| 구분 | 상태 | 비고 |
|------|------|------|
| 설계 승인 | **조건부 승인** | 권장사항 3.2, 3.4 적용 후 구현 진행 |
| 구현 진행 | **가능** | 나머지 권장사항은 리팩토링 단계에서 적용 가능 |

**다음 단계:** `/wf:apply` 명령어로 리뷰 내용 반영 후 구현 시작

---

## 관련 문서
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 테스트 명세: `026-test-specification.md`

---

<!--
Reviewer: Claude Opus 4.5 (refactoring-expert)
Review Date: 2025-12-15
-->
