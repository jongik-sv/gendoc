# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-03 |
| Task명 | Detail Actions |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.3.5 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-05-03 |

---

## 1. 목적 및 범위

### 1.1 목적

Task 상세 패널에서 사용자가 Task 정보를 직관적으로 편집하고, 상태 전이를 수행하며, 관련 문서를 열 수 있도록 하는 액션 컴포넌트를 제공한다. 인라인 편집과 낙관적 업데이트를 통해 빠른 사용자 경험을 구현한다.

**핵심 가치**:
- 빠른 정보 수정 (인라인 편집)
- 명확한 워크플로우 액션 제공
- 낙관적 업데이트로 즉각적인 피드백
- API 연동을 통한 데이터 일관성 유지

### 1.2 범위

**포함 범위**:
- TaskActions 컴포넌트 (편집, 문서 열기, 상태 전이 버튼)
- 인라인 편집 기능 (제목, 우선순위, 담당자 필드별 편집)
- API 연동 (PUT /api/tasks/:id)
- 낙관적 업데이트 및 롤백 메커니즘
- 에러 처리 및 사용자 피드백

**제외 범위**:
- 상태 전이 로직 자체 → TSK-03-04 (Workflow Engine)
- 문서 뷰어 구현 → TSK-05-04 (Document Viewer)
- 워크플로우 규칙 정의 → TSK-02-03-01 (Settings Schema)
- TaskBasicInfo/TaskProgress 컴포넌트 → TSK-05-01 (Detail Panel Structure)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | Task 정보 편집 버튼 제공 (편집 모드 토글) | High | 섹션 6.3.5 |
| FR-002 | 제목 필드 인라인 편집 (InputText) | Critical | 섹션 6.3.1, 6.3.5 |
| FR-003 | 우선순위 필드 인라인 편집 (Dropdown) | High | 섹션 6.3.1, 6.3.5 |
| FR-004 | 담당자 필드 인라인 편집 (Dropdown with Avatar) | High | 섹션 6.3.1, 6.3.5 |
| FR-005 | 상태 전이 버튼 제공 (워크플로우 명령어 기반) | Critical | 섹션 6.3.5, 5.3 |
| FR-006 | 문서 열기 버튼 제공 (문서 뷰어 연동) | Medium | 섹션 6.3.5 |
| FR-007 | API 연동 (PUT /api/tasks/:id) | Critical | 섹션 8.1 |
| FR-008 | 낙관적 업데이트 구현 (즉시 UI 반영) | High | 섹션 8.2 |
| FR-009 | 에러 시 롤백 및 에러 토스트 표시 | High | 섹션 11 |
| FR-010 | 편집 취소 기능 (Escape 키, 취소 버튼) | Medium | 섹션 11.2 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | API 응답 시간 | PUT /api/tasks/:id < 300ms |
| NFR-002 | 낙관적 업데이트 반응성 | 사용자 입력 후 즉시 반영 (< 50ms) |
| NFR-003 | 접근성 | 키보드 네비게이션 지원 (Enter, Escape, Tab) |
| NFR-004 | 재사용성 | 컴포넌트 독립성, Props/Emits 명확화 |
| NFR-005 | 유지보수성 | TypeScript 타입 안정성, 명확한 책임 분리 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

**컴포넌트 계층 구조**:

```
TaskDetailPanel (컨테이너)
├── TaskBasicInfo (TSK-05-01) - 읽기 전용 표시
├── TaskProgress (TSK-05-01) - 읽기 전용 표시
├── TaskWorkflow (TSK-05-02) - 읽기 전용 표시
├── TaskRequirements (TSK-05-02) - 읽기 전용 표시
├── TaskDocuments (TSK-05-02) - 읽기 전용 표시
└── TaskActions (본 Task)
    ├── 편집 모드 토글 버튼
    ├── 인라인 편집 필드 (편집 모드 활성 시)
    │   ├── Title (InputText)
    │   ├── Priority (Dropdown)
    │   └── Assignee (Dropdown)
    ├── 상태 전이 버튼들 (워크플로우 명령어 기반)
    └── 문서 열기 버튼
```

**상태 관리 흐름**:

```
사용자 액션 → TaskActions (로컬 편집 상태 관리)
              ↓
         낙관적 업데이트 (selectedTask 즉시 수정)
              ↓
         PUT /api/tasks/:id (API 호출)
              ↓
      성공: refreshTaskDetail() → 최신 데이터 동기화
      실패: 롤백 + 에러 토스트 표시
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| TaskActions | 액션 버튼 및 인라인 편집 관리 | - 편집 모드 상태 관리<br>- 인라인 편집 UI 제공<br>- API 호출 및 낙관적 업데이트<br>- 상태 전이 버튼 렌더링<br>- 에러 처리 및 롤백 |
| EditableField | 재사용 가능한 인라인 편집 필드 (선택적) | - 읽기/편집 모드 전환<br>- 필드별 입력 컴포넌트 렌더링<br>- Enter/Escape 키 핸들링 |

### 3.3 데이터 흐름

**1. 인라인 편집 흐름**:
```
사용자가 "편집" 버튼 클릭
→ editMode = true
→ 인라인 편집 필드 표시 (InputText, Dropdown)
→ 사용자가 값 변경 후 Enter 또는 Blur
→ handleUpdate(field, newValue) 호출
→ 낙관적 업데이트: selectedTask[field] = newValue
→ PUT /api/tasks/:id { [field]: newValue }
→ 성공: refreshTaskDetail() + editMode = false
→ 실패: 롤백 + 에러 토스트 + editMode 유지
```

**2. 상태 전이 흐름**:
```
사용자가 상태 전이 버튼 클릭 (예: "start")
→ POST /api/tasks/:id/transition { command: "start" }
→ 성공: refreshTaskDetail() + 성공 토스트
→ 실패: 에러 토스트 + 현재 상태 유지
```

**3. 문서 열기 흐름**:
```
사용자가 "문서 열기" 버튼 클릭
→ router.push(`/documents?task=${taskId}`) 또는 모달 열기
→ DocumentViewer 컴포넌트로 전달 (TSK-05-04)
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 인라인 편집 방식 | PrimeVue InlineEdit, 커스텀 구현 | **커스텀 구현 (InputText + Dropdown)** | - PrimeVue InlineEdit 미존재<br>- 필드별 다른 입력 컴포넌트 필요<br>- 더 나은 커스터마이징 |
| 편집 모드 관리 | 전역 상태, 로컬 상태 | **로컬 상태 (ref)** | - 단일 컴포넌트 책임<br>- 불필요한 전역 상태 오염 방지 |
| API 호출 위치 | TaskActions 직접, TaskDetailPanel 위임 | **TaskActions 직접 호출** | - 명확한 책임 분리<br>- 에러 핸들링 로컬화<br>- 재사용성 향상 |
| 낙관적 업데이트 | 낙관적 업데이트, 응답 후 업데이트 | **낙관적 업데이트** | - 빠른 사용자 피드백 (NFR-002)<br>- 실패 시 롤백 메커니즘 제공 |
| 상태 전이 API | 별도 엔드포인트, WBS API 재사용 | **별도 엔드포인트 (POST /api/tasks/:id/transition)** | - 워크플로우 로직 분리<br>- 이력 기록 자동화<br>- PRD 8.1 명세 준수 |
| 에러 표시 방식 | 인라인 에러, 토스트 | **토스트 (PrimeVue Toast)** | - 비침투적 피드백<br>- 일관된 UX<br>- 자동 사라짐 |

---

## 5. 컴포넌트 상세 설계

### 5.1 TaskActions

**역할**: Task 액션 버튼 및 인라인 편집 관리

**Props**:
```typescript
interface Props {
  task: TaskDetail  // 필수
}
```

**Emits**:
```typescript
interface Emits {
  'task-updated': []  // Task 업데이트 성공 시
  'transition-completed': []  // 상태 전이 완료 시
}
```

**로컬 상태**:
```typescript
const editMode = ref(false)          // 편집 모드 활성화 여부
const updating = ref(false)          // API 호출 중
const editedValues = ref({           // 편집 중인 값들 (원본 보존용)
  title: '',
  priority: '',
  assignee: null as string | null
})
```

**주요 메서드**:
```typescript
// 편집 모드 활성화
function enterEditMode() {
  editMode.value = true
  editedValues.value = {
    title: props.task.title,
    priority: props.task.priority,
    assignee: props.task.assignee?.id || null
  }
}

// 편집 취소
function cancelEdit() {
  editMode.value = false
  editedValues.value = {
    title: '',
    priority: '',
    assignee: null
  }
}

// 필드 업데이트 (낙관적 업데이트)
async function handleUpdateField(field: keyof TaskDetail, newValue: any) {
  const prevValue = props.task[field]

  // 낙관적 업데이트
  const selectionStore = useSelectionStore()
  if (selectionStore.selectedTask) {
    selectionStore.selectedTask[field] = newValue
  }

  updating.value = true
  try {
    await $fetch(`/api/tasks/${props.task.id}`, {
      method: 'PUT',
      body: { [field]: newValue }
    })

    // 성공: 최신 데이터 동기화
    await selectionStore.refreshTaskDetail()
    emit('task-updated')

    // 편집 모드 종료
    editMode.value = false

    // 성공 토스트
    toast.add({
      severity: 'success',
      summary: '수정 완료',
      detail: `${field} 정보가 업데이트되었습니다.`,
      life: 3000
    })
  } catch (e) {
    // 롤백
    if (selectionStore.selectedTask) {
      selectionStore.selectedTask[field] = prevValue
    }

    // 에러 토스트
    toast.add({
      severity: 'error',
      summary: '수정 실패',
      detail: e instanceof Error ? e.message : '정보 수정에 실패했습니다.',
      life: 5000
    })
  } finally {
    updating.value = false
  }
}

// 상태 전이 실행
async function handleTransition(command: string) {
  updating.value = true
  try {
    await $fetch(`/api/tasks/${props.task.id}/transition`, {
      method: 'POST',
      body: { command }
    })

    // 성공: 최신 데이터 동기화
    const selectionStore = useSelectionStore()
    await selectionStore.refreshTaskDetail()
    emit('transition-completed')

    toast.add({
      severity: 'success',
      summary: '상태 전이 완료',
      detail: `${command} 명령이 실행되었습니다.`,
      life: 3000
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: '상태 전이 실패',
      detail: e instanceof Error ? e.message : '상태 전이에 실패했습니다.',
      life: 5000
    })
  } finally {
    updating.value = false
  }
}
```

**레이아웃 구조**:
```
PrimeVue Card (타이틀: "작업")
├── 편집 섹션
│   ├── 편집 모드 OFF: "편집" 버튼
│   └── 편집 모드 ON:
│       ├── 제목: InputText (전체 너비)
│       ├── 우선순위: Dropdown (옵션: critical/high/medium/low)
│       ├── 담당자: Dropdown (팀원 목록 with Avatar)
│       └── 액션 버튼: "저장" (모든 필드 일괄 저장) / "취소"
├── 상태 전이 섹션 (Divider)
│   └── 워크플로우 명령어 버튼들 (SplitButton 또는 ButtonGroup)
│       예: "start" / "draft" / "build" (availableActions 기반)
└── 문서 섹션 (Divider)
    └── "문서 보기" 버튼 (documents.length > 0 시 활성)
```

### 5.2 인라인 편집 UI 상세

**제목 편집**:
- 읽기 모드: `<span>{{ task.title }}</span>`
- 편집 모드: `<InputText v-model="editedValues.title" @keyup.enter="saveAll" @keyup.escape="cancelEdit" />`

**우선순위 편집**:
- 읽기 모드: `<Tag :value="task.priority" :severity="prioritySeverity" />`
- 편집 모드:
```typescript
<Dropdown
  v-model="editedValues.priority"
  :options="priorityOptions"
  optionLabel="label"
  optionValue="value"
/>

const priorityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]
```

**담당자 편집**:
- 읽기 모드: `<Avatar :label="task.assignee?.name" /> {{ task.assignee?.name }}`
- 편집 모드:
```typescript
<Dropdown
  v-model="editedValues.assignee"
  :options="teamMembers"
  optionLabel="name"
  optionValue="id"
>
  <template #value="slotProps">
    <div v-if="slotProps.value">
      <Avatar :label="getTeamMember(slotProps.value)?.name" />
      {{ getTeamMember(slotProps.value)?.name }}
    </div>
  </template>
  <template #option="slotProps">
    <div>
      <Avatar :label="slotProps.option.name" />
      {{ slotProps.option.name }}
    </div>
  </template>
</Dropdown>
```

### 5.3 상태 전이 버튼 렌더링

**워크플로우 명령어 매핑**:
```typescript
const workflowButtonConfig = {
  start: { label: '시작', icon: 'pi pi-play', severity: 'primary' },
  draft: { label: '초안 작성', icon: 'pi pi-pencil', severity: 'info' },
  build: { label: '구현', icon: 'pi pi-code', severity: 'success' },
  verify: { label: '검증', icon: 'pi pi-check', severity: 'warning' },
  done: { label: '완료', icon: 'pi pi-check-circle', severity: 'success' }
}

const availableButtons = computed(() => {
  return props.task.availableActions.map(action => ({
    ...workflowButtonConfig[action],
    command: action
  }))
})
```

**렌더링**:
```typescript
<div class="flex gap-2">
  <Button
    v-for="btn in availableButtons"
    :key="btn.command"
    :label="btn.label"
    :icon="btn.icon"
    :severity="btn.severity"
    :loading="updating"
    @click="handleTransition(btn.command)"
  />
</div>
```

---

## 6. 낙관적 업데이트 전략

### 6.1 필드별 낙관적 업데이트 (개선안)

**문제**: 여러 필드 동시 편집 시 일부 실패 처리 복잡

**해결 방안**: 필드별 개별 업데이트 + 전체 저장 옵션

**구현**:
```typescript
// 옵션 1: 필드별 즉시 저장 (Blur 또는 Enter 시)
async function handleFieldBlur(field: keyof TaskDetail) {
  if (editedValues.value[field] !== props.task[field]) {
    await handleUpdateField(field, editedValues.value[field])
  }
}

// 옵션 2: 일괄 저장 (저장 버튼 클릭 시)
async function saveAll() {
  const changes: Partial<TaskDetail> = {}

  if (editedValues.value.title !== props.task.title) {
    changes.title = editedValues.value.title
  }
  if (editedValues.value.priority !== props.task.priority) {
    changes.priority = editedValues.value.priority
  }
  if (editedValues.value.assignee !== props.task.assignee?.id) {
    changes.assignee = editedValues.value.assignee
  }

  if (Object.keys(changes).length === 0) {
    // 변경사항 없음
    editMode.value = false
    return
  }

  // 낙관적 업데이트
  const prevValues = { ...props.task }
  Object.assign(props.task, changes)

  updating.value = true
  try {
    await $fetch(`/api/tasks/${props.task.id}`, {
      method: 'PUT',
      body: changes
    })

    await selectionStore.refreshTaskDetail()
    emit('task-updated')
    editMode.value = false

    toast.add({
      severity: 'success',
      summary: '수정 완료',
      detail: '모든 변경사항이 저장되었습니다.',
      life: 3000
    })
  } catch (e) {
    // 롤백
    Object.assign(props.task, prevValues)

    toast.add({
      severity: 'error',
      summary: '수정 실패',
      detail: e instanceof Error ? e.message : '정보 수정에 실패했습니다.',
      life: 5000
    })
  } finally {
    updating.value = false
  }
}
```

**선택**: **옵션 2 (일괄 저장)** - 더 나은 원자성, 명확한 사용자 의도

### 6.2 롤백 메커니즘

**전략**:
1. API 호출 전 원본 값 저장 (`prevValues`)
2. 낙관적 업데이트로 즉시 UI 반영
3. API 성공 시: `refreshTaskDetail()`로 서버 데이터 동기화
4. API 실패 시: `prevValues`로 롤백 + 에러 토스트

**장점**:
- 빠른 사용자 피드백
- 네트워크 지연 최소화
- 실패 시에도 데이터 일관성 유지

---

## 7. 인수 기준

- [ ] AC-01: "편집" 버튼 클릭 시 편집 모드 활성화, 인라인 편집 필드 표시
- [ ] AC-02: 제목 필드 편집 가능 (InputText, Enter/Blur 저장)
- [ ] AC-03: 우선순위 Dropdown으로 변경 가능 (critical/high/medium/low)
- [ ] AC-04: 담당자 Dropdown으로 변경 가능 (팀원 목록 with Avatar)
- [ ] AC-05: "취소" 버튼 또는 Escape 키로 편집 취소 가능
- [ ] AC-06: "저장" 버튼 클릭 시 모든 변경사항 일괄 저장 (PUT /api/tasks/:id)
- [ ] AC-07: 낙관적 업데이트 적용 (즉시 UI 반영)
- [ ] AC-08: API 호출 실패 시 이전 값으로 롤백 및 에러 토스트 표시
- [ ] AC-09: API 호출 성공 시 refreshTaskDetail() 호출 및 성공 토스트 표시
- [ ] AC-10: 상태 전이 버튼들 표시 (availableActions 기반)
- [ ] AC-11: 상태 전이 버튼 클릭 시 POST /api/tasks/:id/transition 호출
- [ ] AC-12: 상태 전이 성공 시 refreshTaskDetail() 및 성공 토스트
- [ ] AC-13: 문서 열기 버튼 표시 (documents.length > 0 시 활성)
- [ ] AC-14: API 호출 중 로딩 상태 표시 (버튼 disabled + 스피너)
- [ ] AC-15: TypeScript 타입 안정성 (Props, Emits, TaskDetail)

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 낙관적 업데이트 실패 시 UX 혼란 | Medium | 명확한 롤백 메커니즘 + 상세한 에러 메시지<br>재시도 옵션 제공 |
| 여러 필드 동시 편집 시 부분 실패 | Medium | 일괄 저장 방식 채택 (원자성 보장)<br>변경 전 유효성 검증 |
| 팀원 목록 로드 실패 | Low | 빈 목록 처리 + 재시도 옵션<br>담당자 미할당 옵션 제공 |
| 워크플로우 명령어 불일치 | Low | availableActions API 응답에 의존<br>설정 기반 동적 렌더링 |
| 동시 편집 충돌 (다중 사용자) | Low | 현재 단일 사용자 환경<br>향후 낙관적 잠금 추가 고려 |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-05-01 | 선행 | TaskDetailPanel, TaskBasicInfo 구현 필요 |
| TSK-05-02 | 선행 | TaskWorkflow, TaskDocuments 구현 필요 |
| TSK-03-02 | 선행 | PUT /api/tasks/:id API 필요 |
| TSK-03-03 | 선행 | POST /api/tasks/:id/transition API 필요 |
| TSK-02-03-03 | 선행 | team.json (팀원 목록) 필요 |
| PrimeVue 4.x | 외부 | Button, InputText, Dropdown, Toast, Card, Divider |
| types/store.ts | 선행 | TaskDetail, TeamMember 타입 정의 |
| useSelectionStore | 선행 | selectedTask, refreshTaskDetail() |

---

## 9. API 인터페이스 명세

### 9.1 PUT /api/tasks/:id (Task 수정)

**요청**:
```json
{
  "title": "새로운 제목",
  "priority": "high",
  "assignee": "dev-001"
}
```

**응답 (200)**:
```json
{
  "success": true,
  "task": {
    "id": "TSK-05-03",
    "title": "새로운 제목",
    "priority": "high",
    ...
  }
}
```

**에러**:
- 400: 유효성 검증 실패
- 404: Task 없음
- 500: 저장 실패

### 9.2 POST /api/tasks/:id/transition (상태 전이)

**요청**:
```json
{
  "command": "start"
}
```

**응답 (200)**:
```json
{
  "success": true,
  "task": {
    "id": "TSK-05-03",
    "status": "[bd]",
    ...
  },
  "history": [
    {
      "timestamp": "2025-12-15T10:30:00Z",
      "action": "status_change",
      "fromStatus": "[ ]",
      "toStatus": "[bd]"
    }
  ]
}
```

**에러**:
- 400: 유효하지 않은 명령어
- 409: 워크플로우 규칙 위반
- 500: 전이 실패

---

## 10. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행 (020-detail-design.md)
- 상세설계에서 다룰 내용:
  - 컴포넌트 상세 템플릿 구조 (Vue SFC)
  - PrimeVue 컴포넌트 속성 상세 설정
  - 인라인 편집 상태 관리 로직 상세화
  - 에러 핸들링 및 낙관적 업데이트 상세 플로우
  - 접근성 (ARIA) 속성 상세화
  - 스타일링 상세 (TailwindCSS 클래스)
  - 키보드 단축키 정의

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.3.5, 8.1, 8.2, 11)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-05-03)
- 상세설계: `020-detail-design.md` (다음 단계)
- 선행 Task: TSK-05-01 (Detail Panel Structure), TSK-05-02 (Detail Sections)
- 후속 Task: TSK-05-04 (Document Viewer)
- 관련 API: TSK-03-02 (WBS API), TSK-03-03 (Workflow API)

---

<!--
author: AI Agent
Template Version: 1.0.0
-->
