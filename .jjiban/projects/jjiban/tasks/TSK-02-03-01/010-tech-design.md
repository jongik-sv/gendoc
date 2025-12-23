# 기술설계: 기본 설정 JSON 스키마 정의

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-01 |
| Category | infrastructure |
| 상태 | [dd] 상세설계 |
| 상위 Activity | ACT-02-03 |
| 상위 Work Package | WP-02 |
| PRD 참조 | PRD 7.1 |
| 작성일 | 2025-12-14 |

---

## 1. 목적

JJIBAN 시스템의 전역 설정을 관리하기 위한 JSON 스키마를 정의합니다. 칸반 컬럼, 카테고리, 워크플로우 규칙, 상태 내 액션을 표준화된 형식으로 정의하여 시스템 전체에서 일관성 있게 사용합니다.

### 1.1 구현 범위
> WBS Task 설명에서 추출

- columns.json 스키마 (칸반 컬럼)
- categories.json 스키마 (카테고리)
- workflows.json 스키마 (워크플로우 규칙)
- actions.json 스키마 (상태 내 액션)

### 1.2 제외 범위
> 동일 PRD 섹션이지만 다른 Task에서 구현

- 설정 파일 로드/캐싱 로직 → TSK-02-03-02
- 설정 조회 API → TSK-02-03-02
- 프로젝트 메타데이터 (project.json, team.json) → TSK-02-03-03

---

## 2. 현재 상태

### 2.1 현재 구조
현재 설정 파일 없이 하드코딩된 상태:
- 칸반 컬럼: 코드 내 상수로 정의
- 카테고리: 코드 내 상수로 정의
- 워크플로우: 코드 내 조건문으로 처리
- 액션: 코드 내 조건문으로 처리

### 2.2 문제점
- 설정 변경 시 코드 수정 필요
- 프로젝트별 커스터마이징 불가
- 워크플로우 규칙 파악 어려움
- 일관성 없는 상태 관리

---

## 3. 목표 상태

### 3.1 목표 구조
```
.jjiban/
└── settings/
    ├── columns.json       # 칸반 컬럼 정의
    ├── categories.json    # 카테고리 정의
    ├── workflows.json     # 워크플로우 규칙
    └── actions.json       # 상태 내 액션 정의
```

### 3.2 개선 효과
- 설정 파일 수정으로 동작 변경 가능
- JSON 스키마로 유효성 검증 가능
- 문서화 효과 (설정 파일 자체가 문서)
- TypeScript 타입과 연동

---

## 4. 스키마 설계

### 4.1 columns.json (칸반 컬럼)

PRD 5.1 기반 6단계 칸반 컬럼 정의:

```json
{
  "$schema": "columns-schema.json",
  "version": "1.0",
  "columns": [
    {
      "id": "todo",
      "name": "Todo",
      "statusCode": "[ ]",
      "order": 1,
      "color": "#6b7280",
      "description": "대기 중인 작업"
    },
    {
      "id": "design",
      "name": "Design",
      "statusCode": "[bd]",
      "order": 2,
      "color": "#3b82f6",
      "description": "기본설계 진행 중"
    },
    {
      "id": "detail",
      "name": "Detail",
      "statusCodes": ["[dd]", "[an]"],
      "order": 3,
      "color": "#8b5cf6",
      "description": "상세설계/분석 진행 중"
    },
    {
      "id": "implement",
      "name": "Implement",
      "statusCodes": ["[im]", "[fx]"],
      "order": 4,
      "color": "#f59e0b",
      "description": "구현/수정 진행 중"
    },
    {
      "id": "verify",
      "name": "Verify",
      "statusCode": "[vf]",
      "order": 5,
      "color": "#22c55e",
      "description": "검증 진행 중"
    },
    {
      "id": "done",
      "name": "Done",
      "statusCode": "[xx]",
      "order": 6,
      "color": "#10b981",
      "description": "완료된 작업"
    }
  ]
}
```

**TypeScript 타입**:
```typescript
interface Column {
  id: string;
  name: string;
  statusCode?: string;      // 단일 상태 코드
  statusCodes?: string[];   // 복수 상태 코드
  order: number;
  color: string;
  description: string;
}

interface ColumnsConfig {
  $schema?: string;
  version: string;
  columns: Column[];
}
```

### 4.2 categories.json (카테고리)

PRD 4.3 기반 3가지 카테고리 정의:

```json
{
  "$schema": "categories-schema.json",
  "version": "1.0",
  "categories": [
    {
      "id": "development",
      "name": "Development",
      "code": "dev",
      "color": "#3b82f6",
      "icon": "pi-code",
      "description": "신규 기능 개발 작업",
      "workflowId": "development"
    },
    {
      "id": "defect",
      "name": "Defect",
      "code": "defect",
      "color": "#ef4444",
      "icon": "pi-exclamation-triangle",
      "description": "결함 수정 작업",
      "workflowId": "defect"
    },
    {
      "id": "infrastructure",
      "name": "Infrastructure",
      "code": "infra",
      "color": "#8b5cf6",
      "icon": "pi-cog",
      "description": "인프라, 리팩토링 등 기술 작업",
      "workflowId": "infrastructure"
    }
  ]
}
```

**TypeScript 타입**:
```typescript
interface Category {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
  workflowId: string;
}

interface CategoriesConfig {
  $schema?: string;
  version: string;
  categories: Category[];
}
```

### 4.3 workflows.json (워크플로우 규칙)

PRD 5.2 기반 카테고리별 상태 전이 규칙:

```json
{
  "$schema": "workflows-schema.json",
  "version": "1.0",
  "workflows": [
    {
      "id": "development",
      "name": "Development Workflow",
      "description": "신규 기능 개발 워크플로우",
      "states": ["[ ]", "[bd]", "[dd]", "[im]", "[vf]", "[xx]"],
      "initialState": "[ ]",
      "finalStates": ["[xx]"],
      "transitions": [
        {
          "from": "[ ]",
          "to": "[bd]",
          "command": "start",
          "label": "기본설계 시작",
          "document": "010-basic-design.md"
        },
        {
          "from": "[bd]",
          "to": "[dd]",
          "command": "draft",
          "label": "상세설계 시작",
          "document": "020-detail-design.md"
        },
        {
          "from": "[dd]",
          "to": "[im]",
          "command": "build",
          "label": "구현 시작",
          "document": "030-implementation.md"
        },
        {
          "from": "[im]",
          "to": "[vf]",
          "command": "verify",
          "label": "통합테스트 시작",
          "document": "070-integration-test.md"
        },
        {
          "from": "[vf]",
          "to": "[xx]",
          "command": "done",
          "label": "작업 완료",
          "document": "080-manual.md"
        }
      ]
    },
    {
      "id": "defect",
      "name": "Defect Workflow",
      "description": "결함 수정 워크플로우",
      "states": ["[ ]", "[an]", "[fx]", "[vf]", "[xx]"],
      "initialState": "[ ]",
      "finalStates": ["[xx]"],
      "transitions": [
        {
          "from": "[ ]",
          "to": "[an]",
          "command": "start",
          "label": "분석 시작",
          "document": "010-defect-analysis.md"
        },
        {
          "from": "[an]",
          "to": "[fx]",
          "command": "fix",
          "label": "수정 시작",
          "document": "030-implementation.md"
        },
        {
          "from": "[fx]",
          "to": "[vf]",
          "command": "verify",
          "label": "검증 시작",
          "document": "070-test-results.md"
        },
        {
          "from": "[vf]",
          "to": "[xx]",
          "command": "done",
          "label": "작업 완료",
          "document": null
        }
      ]
    },
    {
      "id": "infrastructure",
      "name": "Infrastructure Workflow",
      "description": "인프라/리팩토링 워크플로우",
      "states": ["[ ]", "[dd]", "[im]", "[xx]"],
      "initialState": "[ ]",
      "finalStates": ["[xx]"],
      "transitions": [
        {
          "from": "[ ]",
          "to": "[dd]",
          "command": "start",
          "label": "설계 시작",
          "document": "010-tech-design.md",
          "optional": true
        },
        {
          "from": "[ ]",
          "to": "[im]",
          "command": "skip",
          "label": "설계 생략, 구현 시작",
          "document": "030-implementation.md"
        },
        {
          "from": "[dd]",
          "to": "[im]",
          "command": "build",
          "label": "구현 시작",
          "document": "030-implementation.md"
        },
        {
          "from": "[im]",
          "to": "[xx]",
          "command": "done",
          "label": "작업 완료",
          "document": null
        }
      ]
    }
  ]
}
```

**TypeScript 타입**:
```typescript
interface WorkflowTransition {
  from: string;
  to: string;
  command: string;
  label: string;
  document: string | null;
  optional?: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  states: string[];
  initialState: string;
  finalStates: string[];
  transitions: WorkflowTransition[];
}

interface WorkflowsConfig {
  $schema?: string;
  version: string;
  workflows: Workflow[];
}
```

### 4.4 actions.json (상태 내 액션)

PRD 5.3 기반 상태 변경 없는 액션 정의:

```json
{
  "$schema": "actions-schema.json",
  "version": "1.0",
  "actions": [
    {
      "id": "ui",
      "name": "화면설계",
      "command": "ui",
      "allowedStates": ["[bd]"],
      "allowedCategories": ["development"],
      "document": "011-ui-design.md",
      "description": "화면설계 문서 작성"
    },
    {
      "id": "review",
      "name": "설계 리뷰",
      "command": "review",
      "allowedStates": ["[dd]"],
      "allowedCategories": ["development"],
      "document": "021-design-review-{llm}-{n}.md",
      "description": "LLM 설계 리뷰 수행"
    },
    {
      "id": "apply",
      "name": "리뷰 반영",
      "command": "apply",
      "allowedStates": ["[dd]"],
      "allowedCategories": ["development"],
      "document": null,
      "description": "설계 리뷰 내용 반영"
    },
    {
      "id": "test",
      "name": "TDD/E2E 테스트",
      "command": "test",
      "allowedStates": ["[im]", "[fx]"],
      "allowedCategories": ["development", "defect"],
      "document": "070-tdd-test-results.md",
      "description": "TDD/E2E 테스트 실행"
    },
    {
      "id": "audit",
      "name": "코드 리뷰",
      "command": "audit",
      "allowedStates": ["[im]", "[fx]"],
      "allowedCategories": ["development", "defect"],
      "document": "031-code-review-{llm}-{n}.md",
      "description": "LLM 코드 리뷰 수행"
    },
    {
      "id": "patch",
      "name": "코드 리뷰 반영",
      "command": "patch",
      "allowedStates": ["[im]", "[fx]"],
      "allowedCategories": ["development", "defect"],
      "document": null,
      "description": "코드 리뷰 내용 반영"
    }
  ]
}
```

**TypeScript 타입**:
```typescript
interface Action {
  id: string;
  name: string;
  command: string;
  allowedStates: string[];
  allowedCategories: string[];
  document: string | null;
  description: string;
}

interface ActionsConfig {
  $schema?: string;
  version: string;
  actions: Action[];
}
```

---

## 5. 구현 계획

### 5.1 TypeScript 타입 정의

**파일**: `types/settings.ts`

```typescript
// Column 관련 타입
export interface Column {
  id: string;
  name: string;
  statusCode?: string;
  statusCodes?: string[];
  order: number;
  color: string;
  description: string;
}

export interface ColumnsConfig {
  $schema?: string;
  version: string;
  columns: Column[];
}

// Category 관련 타입
export interface Category {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
  workflowId: string;
}

export interface CategoriesConfig {
  $schema?: string;
  version: string;
  categories: Category[];
}

// Workflow 관련 타입
export interface WorkflowTransition {
  from: string;
  to: string;
  command: string;
  label: string;
  document: string | null;
  optional?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  states: string[];
  initialState: string;
  finalStates: string[];
  transitions: WorkflowTransition[];
}

export interface WorkflowsConfig {
  $schema?: string;
  version: string;
  workflows: Workflow[];
}

// Action 관련 타입
export interface Action {
  id: string;
  name: string;
  command: string;
  allowedStates: string[];
  allowedCategories: string[];
  document: string | null;
  description: string;
}

export interface ActionsConfig {
  $schema?: string;
  version: string;
  actions: Action[];
}

// 통합 Settings 타입
export interface Settings {
  columns: ColumnsConfig;
  categories: CategoriesConfig;
  workflows: WorkflowsConfig;
  actions: ActionsConfig;
}
```

### 5.2 기본값 상수 정의

**파일**: `server/utils/settings/defaults.ts`

설정 파일이 없을 경우 사용할 기본값을 상수로 정의합니다.

### 5.3 JSON 스키마 파일 (선택)

필요시 JSON Schema 파일을 생성하여 유효성 검증에 활용할 수 있습니다.

---

## 6. 파일 목록

| 파일 경로 | 용도 |
|----------|------|
| `types/settings.ts` | TypeScript 타입 정의 |
| `server/utils/settings/defaults.ts` | 기본값 상수 정의 |
| `.jjiban/settings/columns.json` | 칸반 컬럼 설정 (생성 시) |
| `.jjiban/settings/categories.json` | 카테고리 설정 (생성 시) |
| `.jjiban/settings/workflows.json` | 워크플로우 설정 (생성 시) |
| `.jjiban/settings/actions.json` | 액션 설정 (생성 시) |

---

## 7. 수용 기준

- [ ] TypeScript 타입 정의 완료 (`types/settings.ts`)
- [ ] 기본값 상수 정의 완료 (`server/utils/settings/defaults.ts`)
- [ ] 타입과 기본값이 PRD 5.1, 5.2, 5.3과 일치
- [ ] TSK-02-03-02에서 활용 가능한 형태로 구현

---

## 8. 다음 단계

- `/wf:skip` 또는 `/wf:build` 명령어로 구현 단계 진행

---

## 관련 문서
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 5.1, 5.2, 5.3, 7.1)
- 공통 모듈: `.claude/includes/wf-common.md`
