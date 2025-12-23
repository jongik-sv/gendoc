# 구현 보고서: 기본 설정 JSON 스키마 정의

## 0. 문서 메타데이터

* **문서명**: `030-implementation.md`
* **Task ID**: TSK-02-03-01
* **Task 명**: 기본 설정 JSON 스키마 정의
* **작성일**: 2025-12-14
* **작성자**: Claude Code Agent
* **참조 설계서**: `./010-tech-design.md`
* **구현 상태**: ✅ 완료

### 문서 위치
```
.jjiban/projects/jjiban/tasks/TSK-02-03-01/
├── 010-tech-design.md       ← 기술설계
└── 030-implementation.md    ← 구현 보고서 (본 문서)
```

---

## 1. 구현 개요

### 1.1 구현 목적
JJIBAN 시스템의 전역 설정을 관리하기 위한 TypeScript 타입 정의 및 기본값 상수를 구현합니다. 칸반 컬럼, 카테고리, 워크플로우 규칙, 상태 내 액션을 표준화된 형식으로 정의하여 시스템 전체에서 일관성 있게 사용합니다.

### 1.2 구현 범위
- **포함된 기능**:
  - TypeScript 타입 정의 (`types/settings.ts`)
  - 기본값 상수 정의 (`server/utils/settings/defaults.ts`)
  - 헬퍼 함수 (상태→컬럼 매핑, 워크플로우 조회 등)

- **제외된 기능** (다른 Task에서 구현):
  - 설정 파일 로드/캐싱 로직 → TSK-02-03-02
  - 설정 조회 API → TSK-02-03-02
  - 프로젝트 메타데이터 (project.json, team.json) → TSK-02-03-03

### 1.3 구현 유형
- [x] Infrastructure (스키마/타입 정의)

---

## 2. 구현 결과

### 2.1 구현된 파일

| 파일 경로 | 용도 | 상태 |
|----------|------|------|
| `types/settings.ts` | TypeScript 타입 정의 | ✅ 완료 |
| `server/utils/settings/defaults.ts` | 기본값 상수 정의 | ✅ 완료 |
| `server/utils/settings/index.ts` | 모듈 내보내기 | ✅ 완료 |
| `server/utils/index.ts` | settings 모듈 추가 | ✅ 수정 |

### 2.2 타입 정의 상세 (`types/settings.ts`)

#### 2.2.1 Column (칸반 컬럼) 타입
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

#### 2.2.2 Category (카테고리) 타입
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

#### 2.2.3 Workflow (워크플로우) 타입
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

#### 2.2.4 Action (상태 내 액션) 타입
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

### 2.3 기본값 상수 상세 (`server/utils/settings/defaults.ts`)

#### 2.3.1 DEFAULT_COLUMNS (6단계 칸반 컬럼)
| ID | Name | Status Code(s) | Color |
|----|------|----------------|-------|
| todo | Todo | `[ ]` | #6b7280 |
| design | Design | `[bd]` | #3b82f6 |
| detail | Detail | `[dd]`, `[an]`, `[ds]` | #8b5cf6 |
| implement | Implement | `[im]`, `[fx]` | #f59e0b |
| verify | Verify | `[vf]` | #22c55e |
| done | Done | `[xx]` | #10b981 |

#### 2.3.2 DEFAULT_CATEGORIES (3가지 카테고리)
| ID | Name | Code | Workflow |
|----|------|------|----------|
| development | Development | dev | development |
| defect | Defect | defect | defect |
| infrastructure | Infrastructure | infra | infrastructure |

#### 2.3.3 DEFAULT_WORKFLOWS (3가지 워크플로우)
- **development**: `[ ]` → `[bd]` → `[dd]` → `[im]` → `[vf]` → `[xx]`
- **defect**: `[ ]` → `[an]` → `[fx]` → `[vf]` → `[xx]`
- **infrastructure**: `[ ]` → `[dd]`(optional) → `[im]` → `[xx]`

#### 2.3.4 DEFAULT_ACTIONS (6가지 액션)
| ID | Command | Allowed States | Allowed Categories |
|----|---------|----------------|-------------------|
| ui | ui | `[bd]` | development |
| review | review | `[dd]` | development |
| apply | apply | `[dd]` | development |
| test | test | `[im]`, `[fx]` | development, defect |
| audit | audit | `[im]`, `[fx]` | development, defect |
| patch | patch | `[im]`, `[fx]` | development, defect |

### 2.4 헬퍼 함수
| 함수명 | 설명 | 반환 타입 |
|--------|------|----------|
| `findColumnByStatus(statusCode)` | 상태 코드로 컬럼 찾기 | `Column \| undefined` |
| `findWorkflowByCategory(categoryId)` | 카테고리 ID로 워크플로우 찾기 | `Workflow \| undefined` |
| `getAvailableTransitions(workflowId, currentState)` | 사용 가능한 전이 목록 조회 | `WorkflowTransition[]` |
| `getAvailableActions(categoryId, currentState)` | 사용 가능한 액션 목록 조회 | `Action[]` |

---

## 3. 기술적 결정사항

### 3.1 타입 정의 위치
- **결정**: `types/settings.ts` 파일에 별도 정의
- **근거**: 기존 `types/index.ts`는 WBS 관련 타입이 정의되어 있으므로, 설정 관련 타입은 별도 파일로 분리하여 관심사 분리 원칙 적용

### 3.2 기본값 상수 위치
- **결정**: `server/utils/settings/defaults.ts`
- **근거**: Server-side에서 사용되는 설정 기본값이므로 server/utils 하위에 배치. TSK-02-03-02에서 설정 서비스 구현 시 활용 예정

### 3.3 Import 경로
- **결정**: server/utils에서는 상대 경로 사용 (`../../../types/settings`)
- **근거**: Nuxt의 `~/` alias는 server 폴더에서 작동하지 않음

---

## 4. 수용 기준 달성 여부

| 수용 기준 | 상태 |
|----------|------|
| TypeScript 타입 정의 완료 (`types/settings.ts`) | ✅ |
| 기본값 상수 정의 완료 (`server/utils/settings/defaults.ts`) | ✅ |
| 타입과 기본값이 PRD 5.1, 5.2, 5.3과 일치 | ✅ |
| TSK-02-03-02에서 활용 가능한 형태로 구현 | ✅ |
| TypeScript 컴파일 오류 없음 | ✅ |

---

## 5. 구현 완료 체크리스트

### Infrastructure 체크리스트
- [x] TypeScript 타입 정의 완료
- [x] 기본값 상수 정의 완료
- [x] 헬퍼 함수 구현 완료
- [x] 모듈 내보내기 설정 완료
- [x] TypeScript 컴파일 오류 없음
- [x] PRD 요구사항과 일치 확인
- [x] 구현 보고서 작성 완료
- [x] WBS 상태 업데이트 (`[dd]` → `[im]`)

---

## 6. 참고 자료

### 6.1 관련 문서
- 기술설계서: `./010-tech-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 5.1, 5.2, 5.3, 7.1)

### 6.2 소스 코드 위치
- 타입 정의: `types/settings.ts`
- 기본값 상수: `server/utils/settings/defaults.ts`
- 모듈 인덱스: `server/utils/settings/index.ts`

---

## 7. 다음 단계

### 7.1 다음 워크플로우
- `/wf:done TSK-02-03-01` - 작업 완료

### 7.2 연관 Task
- **TSK-02-03-02**: 설정 서비스 구현 (본 Task의 타입과 기본값 활용)
- **TSK-02-03-03**: 프로젝트 메타데이터 서비스

---

## 부록: 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-12-14 | Claude Code Agent | 최초 작성 |
