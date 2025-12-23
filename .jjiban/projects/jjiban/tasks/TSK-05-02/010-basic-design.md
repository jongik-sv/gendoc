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
| Task ID | TSK-05-02 |
| Task명 | Detail Sections |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.3.2, 6.3.3, 6.3.4, 6.3.6 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-05-02 |
| 선행 설계 | `../TSK-05-01/010-basic-design.md` | 전체 |

---

## 1. 목적 및 범위

### 1.1 목적

Task 상세 패널에서 워크플로우 흐름, 요구사항, 문서 목록, 상태 변경 이력을 시각화하는 섹션 컴포넌트를 제공하여 사용자가 Task의 전체 컨텍스트를 파악하고 문서 접근 및 이력 추적을 용이하게 한다.

**핵심 가치**:
- 워크플로우 진행 단계의 명확한 시각화
- 요구사항과 문서의 체계적인 관리 및 접근
- 상태 변경 이력의 투명한 추적
- 작업 컨텍스트의 종합적인 이해 지원

### 1.2 범위

**포함 범위**:
- TaskWorkflow: 카테고리별 워크플로우 흐름도 및 현재 상태 강조
- TaskRequirements: 요구사항 목록 표시 및 인라인 편집
- TaskDocuments: 문서 목록 (존재/예정 구분), 문서 뷰어 연동
- TaskHistory: 상태 변경 이력 타임라인

**제외 범위**:
- TaskDetailPanel, TaskBasicInfo, TaskProgress → TSK-05-01
- TaskActions (편집/전이 액션 버튼) → TSK-05-03
- DocumentViewer (마크다운 뷰어) → TSK-05-04
- 상태 전이 로직 및 문서 생성 → TSK-03-04

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | 카테고리별 워크플로우 흐름 시각화 (development/defect/infrastructure) | Critical | 섹션 6.3.2 |
| FR-002 | 현재 상태 노드 강조 표시 (색상, 크기, 아이콘) | High | 섹션 6.3.2 |
| FR-003 | 완료/미완료 상태 구분 시각화 | Medium | 섹션 6.3.2 |
| FR-004 | 요구사항 목록 표시 (마크다운 형식) | Critical | 섹션 6.3.3 |
| FR-005 | PRD 참조 섹션 링크 표시 | Medium | 섹션 6.3.3 |
| FR-006 | 요구사항 인라인 편집 (항목 추가/삭제/수정) | High | 섹션 6.3.3 |
| FR-007 | 문서 목록 표시 (파일명, 타입, 크기, 수정일) | Critical | 섹션 6.3.4 |
| FR-008 | 문서 존재/예정 상태 구분 (배경색/테두리) | High | 섹션 6.3.4 |
| FR-009 | 문서 클릭 시 뷰어 연동 (존재하는 문서만) | High | 섹션 6.3.4 |
| FR-010 | 예정 문서에 생성 가능 조건 표시 (워크플로우 명령어) | Medium | 섹션 6.3.4 |
| FR-011 | 상태 변경 이력 타임라인 표시 (시간순 역순) | Critical | 섹션 6.3.6 |
| FR-012 | 이력 엔트리별 타임스탬프, 상태 변경, 사용자 표시 | High | 섹션 6.3.6 |
| FR-013 | 문서 생성 이력 표시 (어떤 문서가 생성되었는지) | Medium | 섹션 6.3.6 |
| FR-014 | 이력 엔트리에 코멘트 표시 (있는 경우) | Low | 섹션 6.3.6 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 응답 시간 | 각 섹션 렌더링 < 100ms |
| NFR-002 | 인라인 편집 반응성 | 사용자 입력 후 즉시 반영 (낙관적 업데이트) |
| NFR-003 | 접근성 | 키보드 네비게이션, ARIA 레이블, 스크린리더 지원 |
| NFR-004 | 재사용성 | 독립적인 컴포넌트, Props/Emits 명확화 |
| NFR-005 | 유지보수성 | TypeScript 타입 안정성, 명확한 책임 분리 |
| NFR-006 | 시각적 일관성 | PrimeVue 테마, 카테고리별 색상 통일 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

**컴포넌트 계층 구조**:

```
TaskDetailPanel (TSK-05-01)
├── TaskBasicInfo (TSK-05-01)
├── TaskProgress (TSK-05-01)
├── TaskWorkflow (TSK-05-02) ← 이 Task
│   └── WorkflowNode[] (내부 컴포넌트)
├── TaskRequirements (TSK-05-02) ← 이 Task
│   └── RequirementItem[] (내부 컴포넌트)
├── TaskDocuments (TSK-05-02) ← 이 Task
│   └── DocumentItem[] (내부 컴포넌트)
└── TaskHistory (TSK-05-02) ← 이 Task
    └── HistoryEntry[] (내부 컴포넌트)
```

**데이터 흐름**:

```
TaskDetail (from Pinia) → TaskDetailPanel → 각 섹션 컴포넌트
                                              ↓
                                          Props 전달
                                              ↓
                                    내부 상태 관리 + 편집
                                              ↓
                                          Emit 이벤트
                                              ↓
                                    TaskDetailPanel 처리
                                              ↓
                                    API 호출 + Store 갱신
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| TaskWorkflow | 워크플로우 흐름도 | - 카테고리별 워크플로우 단계 표시<br>- 현재 상태 강조<br>- 완료/미완료 시각화<br>- 읽기 전용 |
| TaskRequirements | 요구사항 관리 | - 요구사항 목록 표시<br>- PRD 참조 링크<br>- 인라인 편집 (추가/삭제/수정)<br>- 편집 이벤트 Emit |
| TaskDocuments | 문서 목록 관리 | - 문서 목록 표시<br>- 존재/예정 구분<br>- 문서 클릭 이벤트<br>- 생성 가능 조건 표시 |
| TaskHistory | 이력 타임라인 | - 상태 변경 이력 표시<br>- 타임스탬프 기준 역순 정렬<br>- 문서 생성 이력 포함<br>- 읽기 전용 |

### 3.3 데이터 흐름

**1. TaskWorkflow**:
```
props.task.category → 워크플로우 단계 결정 (computed)
                   → 현재 상태 인덱스 계산
                   → 노드 렌더링 (완료/현재/미완료 구분)
```

**2. TaskRequirements**:
```
props.task.requirements[] → 요구사항 목록 표시
                          → 사용자가 편집 (추가/삭제/수정)
                          → @update:requirements 이벤트 발생
                          → TaskDetailPanel에서 PUT /api/tasks/:id
```

**3. TaskDocuments**:
```
props.documents[] → 문서 목록 표시 (존재/예정 구분)
                 → 사용자가 문서 클릭
                 → @open-document 이벤트 발생
                 → TSK-05-04 DocumentViewer 열기
```

**4. TaskHistory**:
```
props.task.history[] → 타임스탬프 역순 정렬
                    → 이력 엔트리 렌더링 (타임라인)
                    → 상태 변경 및 문서 생성 표시
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 워크플로우 시각화 방식 | PrimeVue Steps, 커스텀 플로우차트 | **커스텀 플로우차트** | - PrimeVue Steps는 수평 흐름 제한적<br>- 현재 상태 강조 및 완료/미완료 구분 요구<br>- 화살표(→) 포함 시각화 필요 |
| 요구사항 편집 방식 | Textarea 일괄 편집, 항목별 인라인 편집 | **항목별 인라인 편집** | - 사용자 편의성 (개별 항목 수정)<br>- 명확한 추가/삭제 액션<br>- 더 나은 UX |
| 문서 목록 레이아웃 | Table, Card 리스트 | **Card 리스트** | - 존재/예정 상태 구분 용이 (배경색)<br>- 시각적 명확성<br>- PrimeVue Card 컴포넌트 활용 |
| 이력 타임라인 방식 | PrimeVue Timeline, 커스텀 리스트 | **PrimeVue Timeline** | - 프로젝트 표준 (PrimeVue 적극 사용)<br>- 타임라인 UI 제공<br>- 시간순 표시에 최적화 |
| 편집 API 호출 위치 | 각 컴포넌트 직접 호출, TaskDetailPanel 호출 | **TaskDetailPanel** | - 단일 책임 원칙<br>- 에러 핸들링 중앙화<br>- TSK-05-01과 일관성 |
| 문서 뷰어 연동 방식 | 이벤트 Emit, 라우터 이동 | **이벤트 Emit** | - TaskDetailPanel에서 통합 처리<br>- 모달/패널 형태로 유연성<br>- TSK-05-04 연동 용이 |

---

## 5. 컴포넌트 상세 설계

### 5.1 TaskWorkflow

**역할**: 카테고리별 워크플로우 흐름 시각화

**Props**:
```typescript
interface Props {
  task: TaskDetail  // 필수
}
```

**Emits**: 없음 (읽기 전용)

**주요 책임**:
- 카테고리별 워크플로우 단계 표시
- 현재 상태 강조 (색상, 크기, 볼드)
- 완료/현재/미완료 상태 시각화
- 화살표(→)로 흐름 연결

**레이아웃 구조**:
```
PrimeVue Panel (제목: "워크플로우 흐름")
└── 수평 플로우 (Flexbox)
    ├── WorkflowNode (완료 상태) - 초록 배경
    ├── → (화살표)
    ├── WorkflowNode (현재 상태) - 파란 배경, 볼드, 큰 크기
    ├── → (화살표)
    ├── WorkflowNode (미완료) - 회색 배경, 점선 테두리
    ├── → (화살표)
    └── ...
```

**워크플로우 단계 정의**:
```typescript
const workflowSteps = computed(() => {
  switch (props.task.category) {
    case 'development':
      return [
        { code: '[ ]', name: 'Todo', description: '시작 전' },
        { code: '[bd]', name: 'Design', description: '기본설계' },
        { code: '[dd]', name: 'Detail', description: '상세설계' },
        { code: '[im]', name: 'Implement', description: '구현' },
        { code: '[vf]', name: 'Verify', description: '검증' },
        { code: '[xx]', name: 'Done', description: '완료' }
      ]
    case 'defect':
      return [
        { code: '[ ]', name: 'Todo', description: '시작 전' },
        { code: '[an]', name: 'Analyze', description: '분석' },
        { code: '[fx]', name: 'Fix', description: '수정' },
        { code: '[vf]', name: 'Verify', description: '검증' },
        { code: '[xx]', name: 'Done', description: '완료' }
      ]
    case 'infrastructure':
      return [
        { code: '[ ]', name: 'Todo', description: '시작 전' },
        { code: '[ds]', name: 'Design', description: '설계(선택)' },
        { code: '[im]', name: 'Implement', description: '구현' },
        { code: '[xx]', name: 'Done', description: '완료' }
      ]
  }
})

const currentStepIndex = computed(() => {
  return workflowSteps.value.findIndex(step => step.code === props.task.status)
})
```

**상태별 스타일링**:
```typescript
function getNodeStyle(index: number) {
  if (index < currentStepIndex.value) {
    // 완료 상태
    return {
      backgroundColor: '#22c55e', // 초록
      color: '#ffffff',
      border: 'none'
    }
  } else if (index === currentStepIndex.value) {
    // 현재 상태
    return {
      backgroundColor: '#3b82f6', // 파란
      color: '#ffffff',
      fontWeight: 'bold',
      transform: 'scale(1.1)'
    }
  } else {
    // 미완료 상태
    return {
      backgroundColor: '#e5e7eb', // 회색
      color: '#6b7280',
      border: '2px dashed #9ca3af'
    }
  }
}
```

---

### 5.2 TaskRequirements

**역할**: 요구사항 목록 표시 및 인라인 편집

**Props**:
```typescript
interface Props {
  task: TaskDetail  // 필수
}
```

**Emits**:
```typescript
interface Emits {
  'update:requirements': [requirements: string[]]
}
```

**주요 책임**:
- 요구사항 목록 표시 (불릿 포인트)
- PRD 참조 섹션 링크 표시
- 요구사항 항목 추가/삭제/수정 (인라인)
- 편집 모드 토글

**레이아웃 구조**:
```
PrimeVue Panel (제목: "요구사항")
├── PRD 참조 (링크)
│   └── "ref: PRD 6.3.2, 6.3.3"
├── 편집 버튼 (우측 상단)
└── 요구사항 목록
    ├── RequirementItem (읽기 모드)
    │   └── "• 워크플로우 흐름 시각화"
    ├── RequirementItem (편집 모드)
    │   ├── InputText (내용 수정)
    │   └── [삭제] 버튼
    └── [추가] 버튼 (편집 모드에서만)
```

**편집 상태 관리**:
```typescript
const isEditing = ref(false)
const localRequirements = ref<string[]>([])

function toggleEdit() {
  if (isEditing.value) {
    // 저장
    emit('update:requirements', localRequirements.value)
  } else {
    // 편집 시작
    localRequirements.value = [...props.task.requirements]
  }
  isEditing.value = !isEditing.value
}

function addRequirement() {
  localRequirements.value.push('')
}

function removeRequirement(index: number) {
  localRequirements.value.splice(index, 1)
}

function updateRequirement(index: number, value: string) {
  localRequirements.value[index] = value
}
```

**PRD 참조 링크**:
```typescript
const prdReference = computed(() => {
  return props.task.ref || ''
})

function openPrdSection(ref: string) {
  // PRD 문서 해당 섹션으로 이동
  // 예: "ref: PRD 6.3.2" → PRD 문서 6.3.2 섹션
}
```

---

### 5.3 TaskDocuments

**역할**: 문서 목록 표시 및 뷰어 연동

**Props**:
```typescript
interface Props {
  documents: DocumentInfo[]  // 필수 (from TaskDetail)
}
```

**Emits**:
```typescript
interface Emits {
  'open-document': [document: DocumentInfo]
}
```

**주요 책임**:
- 문서 목록 표시 (Card 형태)
- 존재/예정 상태 구분 (배경색/테두리)
- 존재하는 문서 클릭 시 뷰어 열기
- 예정 문서에 생성 가능 조건 표시 (워크플로우 명령어)

**레이아웃 구조**:
```
PrimeVue Panel (제목: "관련 문서")
└── 문서 카드 리스트 (수직 스택)
    ├── DocumentCard (존재함)
    │   ├── 📄 아이콘
    │   ├── 파일명: "010-basic-design.md"
    │   ├── 타입: "기본설계"
    │   ├── 크기: "15.5 KB"
    │   ├── 수정일: "2025-12-15 13:12"
    │   └── [열기] 버튼
    └── DocumentCard (예정)
        ├── 📄 아이콘 (회색)
        ├── 파일명: "020-detail-design.md" (점선 테두리)
        ├── 타입: "상세설계"
        ├── 생성 조건: "/wf:draft 실행 후 생성"
        └── [생성 불가] (비활성)
```

**문서 타입별 아이콘/색상**:
```typescript
const documentTypeConfig = {
  design: { icon: 'pi pi-file-edit', color: '#3b82f6' },       // 블루
  implementation: { icon: 'pi pi-code', color: '#22c55e' },    // 그린
  test: { icon: 'pi pi-check-square', color: '#f59e0b' },      // 앰버
  manual: { icon: 'pi pi-book', color: '#8b5cf6' },            // 퍼플
  analysis: { icon: 'pi pi-search', color: '#ef4444' },        // 레드
  review: { icon: 'pi pi-comments', color: '#06b6d4' }         // 시안
}
```

**존재/예정 구분 스타일**:
```typescript
function getDocumentCardStyle(doc: DocumentInfo) {
  if (doc.exists) {
    return {
      backgroundColor: '#dbeafe',  // 파란 배경
      border: '1px solid #3b82f6',
      cursor: 'pointer'
    }
  } else {
    return {
      backgroundColor: '#f9fafb',  // 회색 배경
      border: '2px dashed #9ca3af',
      cursor: 'not-allowed',
      opacity: 0.6
    }
  }
}
```

**문서 열기 핸들러**:
```typescript
function handleOpenDocument(doc: DocumentInfo) {
  if (doc.exists) {
    emit('open-document', doc)
  }
}
```

---

### 5.4 TaskHistory

**역할**: 상태 변경 이력 타임라인 표시

**Props**:
```typescript
interface Props {
  history: HistoryEntry[]  // 필수 (from TaskDetail)
}
```

**Emits**: 없음 (읽기 전용)

**주요 책임**:
- 이력 엔트리 타임스탬프 기준 역순 정렬
- 타임라인 형태 렌더링
- 상태 변경 정보 표시 (from → to)
- 문서 생성 이력 표시
- 코멘트 표시 (있는 경우)

**레이아웃 구조**:
```
PrimeVue Panel (제목: "이력")
└── PrimeVue Timeline (타임스탬프 역순)
    ├── TimelineEntry (최신)
    │   ├── 타임스탬프: "2025-12-15 13:12"
    │   ├── 액션: "상태 전이"
    │   ├── 내용: "[bd] → [dd]"
    │   ├── 명령어: "/wf:draft"
    │   ├── 문서 생성: "020-detail-design.md"
    │   └── 사용자: "AI Agent"
    ├── TimelineEntry
    │   ├── 타임스탬프: "2025-12-15 09:30"
    │   ├── 액션: "상태 전이"
    │   ├── 내용: "[ ] → [bd]"
    │   ├── 명령어: "/wf:start"
    │   └── 사용자: "AI Agent"
    └── ...
```

**이력 정렬 및 필터**:
```typescript
const sortedHistory = computed(() => {
  return [...props.history].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
})
```

**타임라인 엔트리 렌더링**:
```typescript
function formatHistoryEntry(entry: HistoryEntry) {
  switch (entry.action) {
    case 'transition':
      return {
        icon: 'pi pi-arrow-right',
        color: '#3b82f6',
        title: '상태 전이',
        content: `${entry.previousStatus || entry.from} → ${entry.newStatus || entry.to}`,
        command: entry.command,
        documentCreated: entry.documentCreated
      }
    case 'update':
      return {
        icon: 'pi pi-pencil',
        color: '#22c55e',
        title: '정보 수정',
        content: entry.comment || '정보가 수정되었습니다.'
      }
    default:
      return {
        icon: 'pi pi-info-circle',
        color: '#6b7280',
        title: entry.action,
        content: entry.comment || ''
      }
  }
}
```

**타임스탬프 포맷팅**:
```typescript
function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

---

## 6. TaskDetailPanel 통합

### 6.1 TaskDetailPanel 업데이트

**TSK-05-01에서 생성된 TaskDetailPanel에 4개의 새로운 섹션 컴포넌트를 추가**:

```typescript
// TaskDetailPanel.vue (업데이트)

<template>
  <div class="task-detail-panel">
    <!-- TSK-05-01 컴포넌트 -->
    <TaskBasicInfo :task="selectedTask" @update:... />
    <TaskProgress :task="selectedTask" />

    <!-- TSK-05-02 컴포넌트 (새로 추가) -->
    <TaskWorkflow :task="selectedTask" />
    <TaskRequirements
      :task="selectedTask"
      @update:requirements="handleUpdateRequirements"
    />
    <TaskDocuments
      :documents="selectedTask.documents"
      @open-document="handleOpenDocument"
    />
    <TaskHistory :history="selectedTask.history" />
  </div>
</template>

<script setup lang="ts">
// 핸들러 추가
async function handleUpdateRequirements(requirements: string[]) {
  const prevRequirements = selectedTask.value?.requirements
  // 낙관적 업데이트
  if (selectedTask.value) {
    selectedTask.value.requirements = requirements
  }

  try {
    await $fetch(`/api/tasks/${selectedTask.value.id}`, {
      method: 'PUT',
      body: { requirements }
    })
    await selectionStore.refreshTaskDetail()
  } catch (e) {
    // 롤백
    if (selectedTask.value) {
      selectedTask.value.requirements = prevRequirements
    }
    showError('요구사항 수정에 실패했습니다.')
  }
}

function handleOpenDocument(doc: DocumentInfo) {
  // TSK-05-04 DocumentViewer 연동
  // 모달 또는 사이드 패널로 문서 표시
  documentViewerStore.openDocument(doc)
}
</script>
```

---

## 7. API 연동

### 7.1 필요한 API 엔드포인트

| 엔드포인트 | 메서드 | 용도 | 의존성 |
|----------|--------|------|--------|
| `/api/tasks/:id` | GET | Task 상세 정보 조회 (documents, history 포함) | TSK-03-02 |
| `/api/tasks/:id` | PUT | Task 정보 수정 (requirements 등) | TSK-03-02 |
| `/api/tasks/:id/documents` | GET | 문서 목록 조회 (존재/예정 구분) | TSK-03-03 |
| `/api/settings/workflows` | GET | 워크플로우 규칙 조회 (선택적) | TSK-03-03 |

### 7.2 TaskDetail 인터페이스 확장

**types/index.ts의 TaskDetail 인터페이스는 이미 필요한 필드를 포함**:

```typescript
export interface TaskDetail {
  // ... 기존 필드
  requirements: string[]        // TaskRequirements에서 사용
  documents: DocumentInfo[]     // TaskDocuments에서 사용
  history: HistoryEntry[]       // TaskHistory에서 사용
}
```

**DocumentInfo 인터페이스 확인** (이미 정의됨):
```typescript
export interface DocumentInfo {
  name: string
  path: string
  exists: boolean
  type: 'design' | 'implementation' | 'test' | 'manual' | 'analysis' | 'review'
  stage: 'current' | 'expected'
  size?: number                 // exists=true일 때만
  createdAt?: string            // exists=true일 때만
  updatedAt?: string            // exists=true일 때만
  expectedAfter?: string        // exists=false일 때만 (워크플로우 명령어)
  command?: string              // exists=false일 때만 (생성 명령어)
}
```

**HistoryEntry 인터페이스 확인** (이미 정의됨):
```typescript
export interface HistoryEntry {
  taskId?: string
  timestamp: string
  userId?: string
  action: 'transition' | 'action' | 'update' | string
  previousStatus?: string
  newStatus?: string
  command?: string
  comment?: string
  documentCreated?: string
  // 기존 호환성 유지
  from?: string
  to?: string
  user?: string | null
}
```

---

## 8. 인수 기준

- [ ] AC-01: TaskWorkflow에서 카테고리별 워크플로우 흐름 표시 (development/defect/infrastructure)
- [ ] AC-02: 현재 상태 노드를 파란색 배경, 볼드, 큰 크기로 강조
- [ ] AC-03: 완료 상태는 초록색, 미완료 상태는 회색 점선 테두리로 구분
- [ ] AC-04: TaskRequirements에서 요구사항 목록 표시 (불릿 포인트)
- [ ] AC-05: PRD 참조 섹션 링크 표시 (task.ref 필드)
- [ ] AC-06: 요구사항 편집 모드에서 항목 추가/삭제/수정 가능
- [ ] AC-07: 요구사항 편집 후 @update:requirements 이벤트 발생
- [ ] AC-08: TaskDocuments에서 문서 목록 Card 형태로 표시
- [ ] AC-09: 존재하는 문서는 파란 배경, 예정 문서는 회색 배경 + 점선 테두리
- [ ] AC-10: 존재하는 문서 클릭 시 @open-document 이벤트 발생
- [ ] AC-11: 예정 문서에 생성 가능 조건 표시 (expectedAfter 또는 command 필드)
- [ ] AC-12: TaskHistory에서 이력 엔트리를 타임스탬프 역순으로 표시
- [ ] AC-13: 타임라인 형태로 렌더링 (PrimeVue Timeline 사용)
- [ ] AC-14: 상태 전이 이력에 이전 상태 → 새 상태, 명령어, 문서 생성 표시
- [ ] AC-15: TaskDetailPanel에서 4개 컴포넌트 모두 통합
- [ ] AC-16: 요구사항 수정 시 PUT /api/tasks/:id 호출 및 낙관적 업데이트
- [ ] AC-17: 문서 열기 시 DocumentViewer 연동 (TSK-05-04)
- [ ] AC-18: TypeScript 타입 안정성 (Props, Emits, 인터페이스)
- [ ] AC-19: PrimeVue 컴포넌트 적극 사용 (Panel, Timeline, Card)
- [ ] AC-20: 접근성 지원 (키보드 네비게이션, ARIA 레이블)

---

## 9. 리스크 및 의존성

### 9.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 워크플로우 시각화 복잡도 | Medium | Computed property로 카테고리별 분기<br>재사용 가능한 WorkflowNode 컴포넌트 설계 |
| 요구사항 인라인 편집 UX | Medium | 명확한 편집/저장 모드 구분<br>에러 핸들링 및 롤백 메커니즘 |
| 문서 목록 API 응답 지연 | Low | 로딩 스켈레톤 표시<br>캐싱 전략 고려 |
| 이력 데이터 구조 변경 | Low | HistoryEntry 인터페이스 명확히 정의<br>하위 호환성 유지 (from/to 필드) |
| TaskDetailPanel 과도한 책임 | Medium | 컴포넌트 분리 유지<br>각 섹션 독립적으로 동작 |

### 9.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-05-01 | 선행 | TaskDetailPanel 컨테이너 필요 |
| TSK-03-03 | 선행 | GET /api/tasks/:id/documents API 필요 |
| TSK-03-02 | 선행 | GET/PUT /api/tasks/:id API 필요 |
| TSK-05-04 | 후속 | DocumentViewer 연동 필요 (문서 열기) |
| types/index.ts | 선행 | TaskDetail, DocumentInfo, HistoryEntry 타입 정의 |
| PrimeVue 4.x | 외부 | Panel, Timeline, Card, InputText 컴포넌트 |

---

## 10. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행 (020-detail-design.md)
- 상세설계에서 다룰 내용:
  - 각 컴포넌트별 상세 템플릿 구조
  - PrimeVue 컴포넌트 속성 상세 설정
  - 워크플로우 노드 렌더링 로직 상세화
  - 요구사항 인라인 편집 상태 관리 상세화
  - 문서 카드 레이아웃 및 스타일링 상세화
  - 타임라인 엔트리 포맷팅 로직 상세화
  - 접근성 (ARIA) 속성 상세화
  - 스타일링 상세 (TailwindCSS 클래스)

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.3.2, 6.3.3, 6.3.4, 6.3.6, 9.2, 10.1)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-05-02)
- 상세설계: `020-detail-design.md` (다음 단계)
- 선행 Task: TSK-05-01 (Detail Panel Structure)
- 선행 Task: TSK-03-03 (Workflow API & Settings)
- 후속 Task: TSK-05-04 (Document Viewer)

---

<!--
author: AI Agent
Template Version: 1.0.0
-->
