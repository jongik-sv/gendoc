# PRD: jjiban - AI 기반 프로젝트 관리 도구

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 5.3 |
| 작성일 | 2025-12-18 |
| 상태 | Draft |

---

## 1. 제품 개요

### 1.1 제품 비전

**"jjiban - LLM과 함께 개발하는 차세대 프로젝트 관리 도구"**

개발자의 로컬 환경에서 실행되는 경량 프로젝트 관리 도구입니다. 파일 기반 데이터 저장으로 Git 친화적이며, LLM CLI가 직접 JSON 파일을 수정할 수 있어 AI와의 협업이 자연스럽습니다.

### 1.2 핵심 특징

- **로컬 실행**: `npx jjiban` 으로 바로 실행
- **파일 기반 데이터**: 분산 JSON으로 Git 친화적
- **Git 동기화**: Git push/pull이 곧 백업/동기화
- **LLM CLI 통합**: Claude Code 등이 직접 JSON 수정 가능
- **설치 불필요**: npm 설치 없이 npx로 즉시 실행

### 1.3 타겟 사용자

- **주 사용자**: 소규모 개발팀 (1-10명)
- **환경**: 로컬 개발 환경
- **사용 시나리오**:
  - Git 기반 워크플로우 선호
  - AI 기반 코드 작성 및 리뷰
  - 자동화된 설계 문서 생성
  - LLM을 활용한 테스트 코드 작성

### 1.4 운영 모델

```
GitHub (원격 저장소)
        │
   git clone (각자)
        │
┌───────┼───────┬───────────────┐
│       │       │               │
▼       ▼       ▼               ▼
홍길동   홍길동   김철수          박영희
PC-1    PC-2    노트북          회사PC
(집)    (회사)
```

- **중앙 서버 없음**: 각자 로컬에서 실행
- **동기화**: Git push/pull로 수동 동기화
- **한 사람 여러 PC 가능**: clone만 하면 됨

---

## 2. 기능 체계

### 2.1 기능 분류 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                    jjiban 기능 체계                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  핵심 기능 (Core)                        │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ │    │
│  │  │ 이슈 관리  │ │ 워크플로우 │ │ 문서 관리  │ │ LLM 통합 │ │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └──────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  뷰 기능 (Views)                         │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐              │    │
│  │  │ 칸반 보드  │ │ WBS 트리   │ │ 간트 차트  │              │    │
│  │  └───────────┘ └───────────┘ └───────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 핵심 기능 (Core Features)

### 3.1 작업 분류 체계 (WBS)

#### 3.1.1 계층 구조

| 레벨 | 명칭 | 설명 | 기간 |
|------|------|------|------|
| Level 1 | Project | 전체 프로젝트 | 6~24개월 |
| Level 2 | Work Package | 주요 기능 단위의 작업 묶음 | 1~3개월 |
| Level 3 | Activity | 세부 활동 단위 | 1~4주 |
| Level 4 | Task | 실제 수행 작업 단위 | 1일~1주 |

#### 3.1.2 계층 다이어그램

```
Project (프로젝트)
├── Work Package #1
│   ├── Activity #1.1
│   │   ├── Task #1.1.1
│   │   │   ├── Task #1.1.1-1 (Sub-Task, 진행 중 추가)
│   │   │   └── Task #1.1.1-2 (Sub-Task, 진행 중 추가)
│   │   ├── Task #1.1.2
│   │   └── Task #1.1.3
│   └── Activity #1.2
│       └── Task #1.2.1
├── Work Package #2
│   └── Activity #2.1
│       └── Task #2.1.1
└── Work Package #3
    └── Task #3.1 (Activity 생략 가능)
```

> **Sub-Task**: 프로젝트 진행 중 Task 세분화가 필요할 때 하위 Task로 추가

#### 3.1.3 Task 유형

모든 작업은 **Task**로 통합하고, `category` 필드로 구분합니다.

| 유형 | 설명 |
|------|------|
| development | 신규 기능 개발 작업 |
| defect | 결함 수정 작업 |
| infrastructure | 인프라, 리팩토링 등 기술 작업 |

#### 3.1.4 작업 관리 기능

**Project 관리**
- Project 생성, 수정, 삭제, 아카이브
- 목표 일정 설정 (시작일, 목표일)
- 진행률 자동 계산 (하위 항목 기반)

**Work Package 관리**
- 상위 Project 연결
- 일정 관리 및 진행률 추적

**Activity 관리**
- 상위 Work Package 연결
- 담당자 지정
- 산출물 정의

**Task 관리**
- 상위 Activity 또는 Work Package 연결
- 담당자 지정
- 우선순위 설정 (critical, high, medium, low)
- 예상 시간 및 실제 시간 기록
- 라벨/태그 관리

#### 3.1.5 계층별 허용 관계

| 상위 계층 | 허용되는 하위 계층 |
|----------|-------------------|
| Project | Work Package |
| Work Package | Activity, Task (모든 category) |
| Activity | Task (모든 category) |
| Task | Task (Sub-Task, 프로젝트 진행 중 추가) |

> **Sub-Task 규칙**:
> - WBS 수립 단계에서는 Task가 최하위 단위
> - 프로젝트 진행 중 Task의 추가/수정이 필요할 때 하위 Task 생성 가능
> - Sub-Task는 부모 Task와 동일한 category를 상속
> - Sub-Task의 완료가 부모 Task 진행률에 반영됨

---

### 3.2 워크플로우 관리

#### 3.2.1 유연한 워크플로우 시스템

워크플로우는 **데이터 기반의 유연한 시스템**으로 구현됩니다. 사용자가 카테고리와 워크플로우 규칙을 직접 관리할 수 있습니다.

**핵심 설계 원칙**
- 하드코딩된 워크플로우 제거 → 데이터 기반 규칙 엔진
- 칸반 컬럼, 카테고리, 상태 전환 규칙을 JSON 파일로 관리
- 사용자가 커스텀 카테고리 및 워크플로우 추가 가능

#### 3.2.2 칸반 상태 정의 (kanban-columns.json)

```json
{
  "version": "1.3",
  "columns": [
    { "id": "todo", "codes": [" "], "name": "Todo", "order": 1, "color": "#6b7280" },
    { "id": "design", "codes": ["bd"], "name": "Design", "order": 2, "color": "#3b82f6" },
    { "id": "detail", "codes": ["dd", "an"], "name": "Detail", "order": 3, "color": "#8b5cf6" },
    { "id": "approve", "codes": ["ap"], "name": "Approve", "order": 4, "color": "#10b981" },
    { "id": "implement", "codes": ["im", "fx"], "name": "Implement", "order": 5, "color": "#f59e0b" },
    { "id": "verify", "codes": ["vf"], "name": "Verify", "order": 6, "color": "#eab308" },
    { "id": "done", "codes": ["xx"], "name": "Done", "order": 7, "color": "#22c55e" }
  ]
}

```

**칸반 컬럼 구조 (7단계)**

```
┌────────┬──────────┬──────────┬──────────┬────────────┬──────────┬────────┐
│  Todo  │  Design  │  Detail  │ Approve  │ Implement  │  Verify  │  Done  │
│  [ ]   │   [bd]   │   [dd]   │   [ap]   │    [im]    │   [vf]   │  [xx]  │
├────────┼──────────┼──────────┼──────────┼────────────┼──────────┼────────┤
│  대기   │ 기본설계  │ 상세분석  │ 설계승인  │  구현/수정  │   검증    │  완료   │
└────────┴──────────┴──────────┴──────────┴────────────┴──────────┴────────┘
```

#### 3.2.3 카테고리 정의 (categories.json)

```json
{
  "categories": [
    {
      "id": "development",
      "name": "개발",
      "description": "신규 기능 개발 작업",
      "icon": "🚀",
      "color": "#3B82F6"
    },
    {
      "id": "defect",
      "name": "결함",
      "description": "버그 수정 작업",
      "icon": "🐛",
      "color": "#EF4444"
    },
    {
      "id": "infrastructure",
      "name": "인프라",
      "description": "기술 부채, 리팩토링 등",
      "icon": "⚙️",
      "color": "#8B5CF6"
    }
  ]
}
```

#### 3.2.4 워크플로우 규칙 (workflows.json v2.0)

카테고리별 상태 전환 규칙을 `.jjiban/settings/workflows.json`에서 정의합니다.

**v2.0 스키마 구조**

워크플로우 설정 파일은 세 개의 Record 섹션으로 구성됩니다:

| 섹션 | 타입 | 설명 |
|------|------|------|
| `states` | `Record<string, StateDefinition>` | 상태 코드별 UI 정보 (label, icon, color, severity, progressWeight) |
| `commands` | `Record<string, CommandDefinition>` | 명령어별 UI 정보 (label, icon, severity, isAction) |
| `workflows` | `Record<string, WorkflowDefinition>` | 카테고리별 워크플로우 정의 (states, transitions, actions) |

**WorkflowDefinition 구조**

| 필드 | 설명 |
|------|------|
| `name` | 워크플로우 표시명 |
| `states` | 포함된 상태 코드 목록 (순서대로) |
| `transitions` | 상태 전이 규칙 배열 |
| `actions` | 상태별 허용 액션 (선택) |

**WorkflowTransition 구조**

| 필드 | 설명 |
|------|------|
| `from` | 시작 상태 코드 |
| `to` | 종료 상태 코드 |
| `command` | 전이 명령어 |
| `document` | 생성할 문서 (선택) |
| `label` | 전이 레이블 (선택) |

**development 워크플로우 규칙**

| 명령어 | 현재 상태 | 다음 상태 | 설명 | 생성 문서 |
|--------|----------|----------|------|----------|
| `start` | `todo` | `bd` | 기본설계 시작 | `010-basic-design.md` |
| `draft` | `bd` | `dd` | 상세설계 시작 | `020-detail-design.md`, `025-traceability-matrix.md`, `026-test-specification.md` |
| `approve` | `dd` | `ap` | 설계승인 | - |
| `build` | `ap` | `im` | 구현 시작 | `030-implementation.md` |
| `verify` | `im` | `vf` | 통합테스트 시작 | `070-integration-test.md` |
| `done` | `vf` | `xx` | 작업 완료 | `080-manual.md` |

**defect 워크플로우 규칙**

| 명령어 | 현재 상태 | 다음 상태 | 설명 | 생성 문서 |
|--------|----------|----------|------|----------|
| `start` | `todo` | `an` | 결함 분석 시작 | `010-defect-analysis.md` |
| `fix` | `an` | `fx` | 수정 시작 | `030-implementation.md` |
| `verify` | `fx` | `vf` | 회귀 테스트 시작 | `070-test-results.md` |
| `done` | `vf` | `xx` | 수정 완료 | - |

**infrastructure 워크플로우 규칙**

| 명령어 | 현재 상태 | 다음 상태 | 설명 | 생성 문서 |
|--------|----------|----------|------|----------|
| `start` | `todo` | `dd` | 기술 설계 시작 | `010-tech-design.md` |
| `skip` | `todo` | `im` | 설계 생략, 바로 구현 | - |
| `build` | `dd` | `im` | 구현 시작 | `030-implementation.md` |
| `done` | `im` | `xx` | 작업 완료 | - |

#### 3.2.5 상태 내 액션 (workflow-actions.json)

상태 변경 없이 반복 가능한 액션을 정의합니다.

| 명령어 | 사용 가능 상태 | 적용 카테고리 | 설명 | 생성/수정 문서 | 반복 |
|--------|---------------|--------------|------|----------------|------|
| `ui` | `[bd]` | development | 화면설계 작성 | `011-ui-design.md` | X |
| `review` | `[dd]` | development | LLM 설계 리뷰 | `021-design-review-{llm}-{n}.md` | O |
| `apply` | `[dd]` | development | 리뷰 내용 반영 | `020-detail-design.md` | O |
| `test` | `[im]` | development | TDD/E2E 테스트 실행 | `070-tdd-test-results.md`, `070-e2e-test-results.md` | O |
| `audit` | `[im]`, `[fx]` | 전체 | LLM 코드 리뷰 | `031-code-review-{llm}-{n}.md` | O |
| `patch` | `[im]`, `[fx]` | 전체 | 리뷰 내용 반영 | `030-implementation.md` | O |

#### 3.2.6 워크플로우 엔진

규칙 기반 상태 전환 엔진:

```typescript
interface WorkflowRule {
  id: string;
  category: string;
  command: string;
  currentStatus: string;
  nextStatus: string;
  llmCommand: string;
  document: string | null;
  documentTemplate: string | null;
}

class WorkflowEngine {
  // 실행 가능한 명령어 조회
  getAvailableCommands(category: string, status: string): string[];

  // 명령어 실행
  executeCommand(taskId: string, command: string): Promise<ExecuteResult>;
}
```

#### 3.2.7 카테고리별 흐름도

```
development:     [ ] → [bd] → [dd] → [ap] → [im] → [vf] → [xx]
                  │     │      │      │      │      │      │
칸반 컬럼:       Todo Design Detail Apprv  Impl  Verify Done
                  │     ╳      │      ╳      │      │      │
defect:          [ ] ──────→ [an] ──────→ [fx] → [vf] → [xx]
                  │     ╳      │      ╳      │      ╳      │
infrastructure:  [ ] ──────→ [dd]? ─────→ [im] ──────→ [xx]
```

#### 3.2.8 확장 시나리오

사용자가 커스텀 카테고리 및 워크플로우를 추가할 수 있습니다:

**예시: 문서화 카테고리**
```json
{
  "id": "documentation",
  "name": "문서화",
  "description": "문서 작성 작업",
  "icon": "📝",
  "color": "#10B981"
}
```

**예시: 프로토타입 카테고리 (2단계만)**
```json
{
  "id": "prototype",
  "name": "프로토타입",
  "description": "빠른 PoC 개발",
  "icon": "⚡",
  "color": "#F59E0B"
}
```

---

### 3.3 문서 관리

#### 3.3.1 문서 저장 구조

모든 문서는 파일 시스템에 저장됩니다.

```
.jjiban/
├── settings/              # 전역 설정
├── templates/             # 문서 템플릿
└── projects/              # 프로젝트 폴더
    └── [project-id]/
        ├── project.json   # 프로젝트 메타데이터
        ├── team.json      # 팀원 목록
        ├── wbs.md         # WBS 통합 파일
        └── tasks/         # Task 문서 폴더
            └── {TSK-ID}/
                ├── 010-basic-design.md
                ├── 020-detail-design.md
                └── 030-implementation.md
```

#### 3.3.2 Task 워크플로우 문서

| 단계 | 문서 | 버전 관리 |
|------|------|-----------|
| 기본설계 | 기본설계 문서 | Git |
| 상세설계 | 상세설계 문서 | Git |
| 설계 리뷰 | 설계 리뷰 문서 | LLM별 순차 누적 |
| 구현 | 구현 문서 | Git |
| 코드 리뷰 | 코드 리뷰 문서 | LLM별 순차 누적 |
| 통합 테스트 | 통합테스트 문서 | Git |
| 매뉴얼 | 매뉴얼 문서 | Git |

#### 3.3.3 문서 번호 체계

**카테고리별 문서 번호**

| 카테고리 | 단계 | 파일명 |
|---------|------|--------|
| **development** | | |
| | 기본설계 | `010-basic-design.md` |
| | 화면설계 | `011-ui-design.md` |
| | 상세설계 | `020-detail-design.md` |
| | 설계 리뷰 | `021-design-review-{llm}-{n}.md` |
| | 추적성 매트릭스 | `025-traceability-matrix.md` |
| | 테스트 명세 | `026-test-specification.md` |
| | 구현 | `030-implementation.md` |
| | 코드 리뷰 | `031-code-review-{llm}-{n}.md` |
| | 통합테스트 | `070-integration-test.md` |
| | TDD 테스트 결과 | `070-tdd-test-results.md` |
| | E2E 테스트 결과 | `070-e2e-test-results.md` |
| | 매뉴얼 | `080-manual.md` |
| **defect** | | |
| | 분석 | `010-defect-analysis.md` |
| | 구현 | `030-implementation.md` |
| | 코드 리뷰 | `031-code-review-{llm}-{n}.md` |
| | 테스트 | `070-test-results.md` |
| **infrastructure** | | |
| | 설계 | `010-tech-design.md` |
| | 구현 | `030-implementation.md` |
| | 코드 리뷰 | `031-code-review-{llm}-{n}.md` |

#### 3.3.4 문서 뷰어 기능

**Markdown 렌더링**
- GitHub Flavored Markdown 지원
- 체크리스트 지원

**코드 하이라이팅**
- 다중 언어 지원
- 라인 번호 표시
- 복사 버튼

**다이어그램 렌더링**
- Mermaid 다이어그램 지원
- 실시간 미리보기

---

### 3.4 LLM 통합

#### 3.4.1 지원 LLM

| LLM | 용도 |
|-----|------|
| Claude | Claude Code |
| Gemini | Gemini CLI |
| OpenAI | Codex CLI |

#### 3.4.2 LLM 활용 기능

**Task 레벨**
- 코드 작성
- 코드 리뷰
- 테스트 코드 생성
- 문서 생성

#### 3.4.3 LLM CLI 직접 통합

LLM CLI가 `.jjiban/` 폴더의 파일을 직접 수정할 수 있습니다.

```
사용자: "TSK-01-01 상태를 im으로 변경해줘"

Claude Code:
1. .jjiban/projects/[project-id]/wbs.md 읽기
2. TSK-01-01의 status 필드를 "[im]"으로 변경
3. 파일 저장
```

#### 3.4.4 웹 터미널

**터미널 기능**
- 실시간 출력 스트리밍
- 대화형 입력 지원
- 세션 관리 (Task별 독립 세션)
- 전체화면/분할화면 모드
- 폰트 크기 및 테마 설정

---

## 4. 뷰 기능 (View Features)

### 4.1 칸반 보드

**보드 구성**
- 워크플로우 상태별 컬럼
- 컬럼 커스터마이징

**카드 기능**
- 드래그 앤 드롭 상태 변경
- 빠른 편집
- 컨텍스트 메뉴 (LLM 명령어, 문서, 이동)
- 담당자, 우선순위, 라벨 표시

**필터링 및 검색**
- 담당자별 필터
- 카테고리별 필터
- 라벨별 필터
- 제목/설명 검색

### 4.2 WBS 트리 뷰

**트리 구성**
- 계층 구조 표시 (Project → Work Package → Activity → Task)
- 펼침/접힘 기능

**기능**
- 클릭으로 상세 보기
- 드래그로 계층 이동
- 진행률 표시

### 4.3 Gantt 차트

**차트 구성**
- 계층 구조 표시
- 타임라인 시각화

**기능**
- 드래그로 일정 조정
- 의존성 표시
- 진행률 표시

**확대/축소**
- 일/주/월/분기 뷰

---

## 5. 데이터 구조

### 5.1 디렉토리 구조

```
.jjiban/
├── settings/                      # 전역 설정 (모든 프로젝트 공통)
│   ├── projects.json              # 프로젝트 목록
│   ├── columns.json               # 칸반 컬럼 정의
│   ├── categories.json            # 카테고리 정의
│   ├── workflows.json             # 워크플로우 규칙
│   └── actions.json               # 상태 내 액션 정의
│
├── templates/                     # 문서 템플릿
│   ├── 010-basic-design.md
│   ├── 011-ui-design.md
│   ├── 020-detail-design.md
│   ├── 030-implementation.md
│   ├── 070-integration-test.md
│   └── 080-manual.md
│
└── projects/                      # 프로젝트 폴더
    └── [project-id]/              # 개별 프로젝트
        ├── project.json           # 프로젝트 메타데이터
        ├── team.json              # 팀원 목록
        ├── wbs.md                 # WBS 통합 파일 (유일한 소스)
        │
        └── tasks/                 # Task 문서 폴더
            ├── TSK-01-01/         # 3단계: WP-ACT 없이 직접
            │   ├── 010-basic-design.md
            │   └── 020-detail-design.md
            └── TSK-01-01-01/      # 4단계: WP-ACT-TSK
                ├── 010-basic-design.md
                └── 020-detail-design.md
```

> **wbs.md**: WP, ACT, TSK의 모든 메타데이터를 단일 마크다운 파일로 관리. LLM이 한 번에 전체 구조를 파악 가능
> **3단계 구조**: Project → WP → TSK (소규모 프로젝트)
> **4단계 구조**: Project → WP → ACT → TSK (대규모 프로젝트)
> **projects 폴더**: 모든 프로젝트가 여기에 저장됨
> **settings 폴더**: 전역 설정. 없으면 기본 설정을 메모리에서 생성

### 5.2 settings/projects.json (프로젝트 목록)

```json
{
  "version": "1.0",
  "projects": [
    {
      "id": "jjiban",
      "name": "JJIBAN Project Manager",
      "path": "jjiban",
      "status": "active",
      "wbsDepth": 4,
      "createdAt": "2026-01-15"
    }
  ],
  "defaultProject": "jjiban"
}
```

> **wbsDepth**: 3 (WP → TSK) 또는 4 (WP → ACT → TSK)

### 5.3 project.json (프로젝트 메타데이터)

```json
{
  "id": "jjiban",
  "name": "JJIBAN Project Manager",
  "description": "AI 기반 프로젝트 관리 도구",
  "version": "0.1.0",
  "status": "active",
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-12-12T10:00:00Z",
  "scheduledStart": "2026-01-15",
  "scheduledEnd": "2026-06-30"
}
```

> **간소화**: 설정은 전역 settings로 이동, stats는 wbs.md에서 실시간 계산

### 5.4 team.json (팀원 목록)

```json
{
  "members": [
    {
      "id": "hong",
      "name": "홍길동",
      "email": "hong@company.com",
      "active": true
    }
  ]
}
```

### 5.5 wbs.md (WBS 통합 파일)

WP, ACT, TSK의 모든 메타데이터를 단일 마크다운 파일로 관리합니다.

```markdown
# WBS - JJIBAN Project Manager

> version: 1.0
> depth: 4
> updated: 2026-12-13

---

## WP-01: 플랫폼 기반 구축
- status: in_progress
- priority: high
- schedule: 2026-01-15 ~ 2026-02-14
- progress: 25%

### ACT-01-01: 프로젝트 관리
- status: in_progress
- schedule: 2026-01-15 ~ 2026-01-22

#### TSK-01-01-01: 프로젝트 CRUD API 구현
- category: development
- status: implement [im]
- priority: high
- assignee: hong
- schedule: 2026-01-15 ~ 2026-01-21
- tags: api, backend, crud
- depends: -
- blocked-by: -

#### TSK-01-01-02: 프로젝트 목록 UI 구현
- category: development
- status: todo [ ]
- priority: high
- assignee: hong
- schedule: 2026-01-22 ~ 2026-01-25
- tags: frontend, ui
- depends: TSK-01-01-01

### ACT-01-02: 팀원 관리
- status: todo
- schedule: 2026-01-26 ~ 2026-02-02

#### TSK-01-02-01: 팀원 CRUD API 구현
- category: development
- status: todo [ ]
- priority: medium
- assignee: -

---

## WP-02: 칸반 보드
- status: planned
- priority: high
- schedule: 2026-02-15 ~ 2026-03-15

### TSK-02-01: 칸반 컴포넌트 구현
- category: development
- status: todo [ ]
- priority: high
- note: 3단계 구조 예시 (ACT 없이 WP 아래 직접 TSK)
```

#### 5.5.1 wbs.md 문법 규칙

| 레벨 | 마크다운 | ID 패턴 | 예시 |
|------|----------|---------|------|
| WP | `## WP-XX:` | `WP-{2자리}` | `## WP-01: 플랫폼 기반` |
| ACT (4단계) | `### ACT-XX-XX:` | `ACT-{WP}-{순번}` | `### ACT-01-01: 프로젝트 관리` |
| TSK (4단계) | `#### TSK-XX-XX-XX:` | `TSK-{WP}-{ACT}-{순번}` | `#### TSK-01-01-01: API 구현` |
| TSK (3단계) | `### TSK-XX-XX:` | `TSK-{WP}-{순번}` | `### TSK-02-01: 칸반 구현` |

#### 5.5.2 Task 속성

| 속성 | 필수 | 설명 | 예시 |
|------|------|------|------|
| category | O | 작업 유형 | `development`, `defect`, `infrastructure` |
| status | O | 상태 + 기호 | `todo [ ]`, `implement [im]`, `done [xx]` |
| priority | O | 우선순위 | `critical`, `high`, `medium`, `low` |
| assignee | - | 담당자 ID | `hong`, `-` (미지정) |
| schedule | - | 일정 | `2026-01-15 ~ 2026-01-21` |
| tags | - | 태그 목록 | `api, backend, crud` |
| depends | - | 선행 Task | `TSK-01-01-01` |
| blocked-by | - | 차단 Task | `TSK-01-01-01` |
| note | - | 비고 | 자유 텍스트 |

> **의존성 유형**: 기본적으로 FS (Finish-to-Start) 적용. 선행 Task 완료 후 시작 가능

---

## 6. 실행 방식

### 6.1 npx 실행

```bash
# 프로젝트 폴더에서 바로 실행
cd ~/my-project
npx jjiban

# 또는 특정 폴더 지정
npx jjiban ./docs

# 포트 지정
npx jjiban --port 4000
```

### 6.2 실행 시 동작

```
$ npx jjiban

🚀 JJIBAN Project Manager v0.1.0
📁 프로젝트: ~/my-project/.jjiban
🌐 http://localhost:3000 에서 실행 중...

[Enter] 브라우저 열기 | [Ctrl+C] 종료
```

### 6.3 초기화 흐름

```bash
$ cd ~/my-project
$ npx jjiban

📁 .jjiban 폴더가 없습니다.

? 새 프로젝트를 초기화할까요? (Y/n) Y
? 프로젝트 이름: My Awesome Project

✅ .jjiban/ 폴더 생성 완료
🌐 http://localhost:3000 에서 실행 중...
```

---

## 7. Git 동기화 워크플로우

### 7.1 분산 JSON의 장점

```bash
# 홍길동 (집): TSK-001 수정
# 김철수 (회사): TSK-002 수정

# 분산 JSON → 자동 병합 성공!
# 단일 JSON → 충돌 발생!
```

| 상황 | 단일 JSON | 분산 JSON |
|------|----------|-----------|
| 다른 태스크 동시 수정 | ❌ 충돌 | ✅ 자동 병합 |
| 같은 태스크 동시 수정 | ❌ 충돌 | ❌ 충돌 (불가피) |
| 충돌 해결 난이도 | 어려움 | 쉬움 |
| PR 리뷰 | 어려움 | 명확함 |

### 7.2 권장 워크플로우

```bash
# 1. 작업 시작 전 (필수!)
git pull

# 2. 작업 중
npx jjiban  # 로컬에서 태스크 관리

# 3. 작업 완료 후
git add .jjiban
git commit -m "TSK-001 완료"
git pull --rebase  # 충돌 확인
git push
```

### 7.3 충돌 최소화 규칙

1. **작업 전 항상 pull** - 최신 상태 유지
2. **작업 후 바로 push** - 변경사항 빨리 공유
3. **태스크 분배 명확히** - 같은 태스크 동시 작업 피함

---

## 8. 화면 목록

### 8.1 메인 화면

| 화면 | 설명 | 주요 기능 |
|------|------|-----------|
| 대시보드 | 전체 현황 | 프로젝트 요약, 내 할 일, 최근 활동 |

### 8.2 작업 관리 화면

| 화면 | 설명 | 주요 기능 |
|------|------|-----------|
| 칸반 보드 | 메인 작업 화면 | 칸반, 필터, 검색, 드래그 앤 드롭 |
| WBS 트리 | 계층 구조 | 트리 뷰, 펼침/접힘 |
| Gantt 차트 | 일정 시각화 | 타임라인, 드래그 일정 조정 |

### 8.3 작업 상세 화면

| 화면 | 설명 | 주요 기능 |
|------|------|-----------|
| Task 상세 | Task 정보 | 기본 정보, 문서, LLM 터미널 |

#### 8.3.1 Task 기본 정보 패널

**표시 정보**
- Task ID, 제목, 카테고리
- 우선순위, 담당자
- 일정 (schedule): 시작일 ~ 종료일
- 태그 (tags): 복수 태그 표시
- 의존성 (depends): 선행 Task 링크 (클릭 시 해당 Task로 이동)
- 참조 문서 (ref): PRD, TRD 등 참조 문서 표시

#### 8.3.2 워크플로우 Stepper

**Stepper 구조**
- 카테고리별 워크플로우 단계를 수평 Stepper로 시각화
- 각 단계는 클릭 가능한 노드로 표시
- 현재 단계 강조 (확대, 그림자 효과)
- 완료된 단계는 체크 아이콘 표시
- 미완료 단계는 비활성화 스타일 적용

**단계 클릭 시 Popover**
1. **완료일 표시** (최상단): 해당 단계의 완료 타임스탬프 또는 "미완료"
2. **Auto 버튼**: 현재 상태에서 완료까지 자동 실행 (`wf:auto` 명령어 연결)
3. **상태 전이 액션**: start, draft, build, verify, done, fix, skip
4. **상태 내 액션**: ui, review, apply, test, audit, patch
5. **롤백 액션**: 이전 상태로 되돌리기 (선택적)

**버튼 활성화 규칙**
| 단계 상태 | 활성화 버튼 |
|----------|------------|
| 현재 단계 | 모든 관련 액션 |
| 완료된 단계 | 롤백만 (선택적) |
| 미완료 단계 | 모든 버튼 비활성화 |

#### 8.3.3 Auto 실행 기능

- **명령어**: `wf:auto`
- **동작**: 현재 상태에서 [xx] 완료까지 순차적 자동 전이
- **문서 생성**: 각 워크플로우 단계에서 subagent가 자동 생성
- **UI 표시**: 번개 아이콘, 보라색 강조 버튼

### 8.4 문서 화면

| 화면 | 설명 | 주요 기능 |
|------|------|-----------|
| 문서 뷰어 | 문서 보기 | Markdown 렌더링, 다이어그램 |
| 문서 편집기 | 문서 편집 | Markdown 편집, 실시간 미리보기 |

### 8.5 설정 화면

| 화면 | 설명 | 주요 기능 |
|------|------|-----------|
| 카테고리 관리 | 카테고리 설정 | 카테고리 목록, 추가/수정/삭제, 사용 현황 |
| 워크플로우 관리 | 워크플로우 설정 | 칸반 컬럼 관리, 규칙 관리, 플로우차트 시각화 |

**카테고리 관리 화면 기능**
- 카테고리 목록 표시 (테이블/카드 뷰)
- 카테고리 추가 (ID, 이름, 설명, 아이콘, 색상)
- 카테고리 수정/삭제 (사용 중인 Task 없을 때만 삭제 가능)
- 해당 카테고리를 사용하는 Task 수 표시

**워크플로우 관리 화면 기능**
- 칸반 컬럼 관리 (추가/수정/순서변경/삭제)
- 워크플로우 규칙 시각화 (플로우차트)
- 규칙 추가/수정 (현재상태 → 명령어 → 다음상태 매핑)
- 액션 관리 (반복 가능 여부 포함)
- 규칙 검증 (순환 참조, 도달 불가능 상태 등)

---

## 9. 카테고리별 전용 필드

### 9.1 defect 카테고리 전용 필드

| 필드 | 설명 | 값 |
|------|------|-----|
| severity | 심각도 | critical, major, minor, trivial |
| reproducibility | 재현성 | always, sometimes, rare, unable |
| affectedVersion | 발생 버전 | 버전 문자열 |

---

## 10. 테마 시스템

### 10.1 테마 개요

jjiban은 다중 테마 지원 시스템을 제공하여 사용자 환경과 선호도에 맞는 UI를 제공합니다.

#### 10.1.1 기본 테마 (Dark Blue - 기본값)

WBS 트리 목업을 기반으로 한 다크 블루 테마를 기본 테마로 사용합니다.

**색상 팔레트**

| 용도 | 색상 | Hex |
|------|------|-----|
| 배경 (Background) | 딥 네이비 | `#1a1a2e` |
| 헤더 (Header) | 다크 블루 | `#16213e` |
| 사이드바 (Sidebar) | 딥 다크 | `#0f0f23` |
| 카드 배경 (Cards) | 퍼플 네이비 | `#1e1e38` |
| 프라이머리 (Primary) | 블루 | `#3b82f6` |
| 성공 (Success) | 그린 | `#22c55e` |
| 경고 (Warning) | 앰버 | `#f59e0b` |
| 위험 (Danger) | 레드 | `#ef4444` |
| 텍스트 (Primary Text) | 라이트 그레이 | `#e8e8e8` |
| 텍스트 (Secondary Text) | 미디엄 그레이 | `#888888` |
| 보더 (Border) | 퍼플 그레이 | `#3d3d5c` |

**폰트 설정**

| 용도 | 폰트 | 크기 |
|------|------|------|
| 로고 | Arial Bold | 18px |
| 헤더 | Arial Bold | 14px |
| 본문 | Arial | 12px |
| 보조 텍스트 | Arial | 10-11px |
| 상태 태그 | Arial | 9px |

#### 10.1.2 지원 테마 목록

| 테마 ID | 테마명 | 설명 |
|---------|--------|------|
| `dark-blue` | Dark Blue | 기본 다크 테마 (WBS 목업 기반) |
| `light` | Light | 밝은 테마 |
| `dark` | Dark | 순수 다크 테마 |
| `system` | System | 시스템 설정 따름 |

#### 10.1.3 테마 컴포넌트

**계층 구조 아이콘 색상**

| 계층 | 아이콘 색상 | Hex |
|------|------------|-----|
| Project | 퍼플 | `#8b5cf6` |
| Work Package | 블루 | `#3b82f6` |
| Activity | 그린 | `#22c55e` |
| Task | 앰버 | `#f59e0b` |

**상태 태그 색상**

| 상태 | 색상 | Hex |
|------|------|-----|
| 대기 | 그레이 | `#6b7280` |
| 진행중 | 앰버 | `#f59e0b` |
| 완료 | 그린 | `#22c55e` |
| development | 블루 | `#3b82f6` |
| infrastructure | 앰버 | `#f59e0b` |

**프로그레스 바**

- 배경: `#2d2d44`
- 채우기: 상태에 따른 색상
- 모서리: 3px 라운드

### 10.2 테마 관리 기능

#### 10.2.1 테마 전환

- **헤더 메뉴**: 테마 선택 드롭다운
- **설정 페이지**: 상세 테마 설정
- **로컬 저장**: localStorage에 사용자 선택 저장

#### 10.2.2 테마 커스터마이징

- 프라이머리 색상 변경
- 폰트 크기 조절 (소/중/대)
- 사이드바 너비 조절

---

## 11. 비기능 요구사항

### 11.1 성능

- 페이지 로딩 시간: 3초 이내
- 파일 로딩: 1,000개 태스크 300ms 이내

### 11.2 호환성

- 브라우저: Chrome, Firefox, Safari, Edge (최신 2버전)
- 플랫폼: Windows, macOS, Linux
- Node.js: 20.x 이상

---

## 12. 부록

### A. 명령어 요약

#### A.1 development 카테고리 명령어

**상태 전환 명령어**

| 명령어 | 설명 | 상태 전환 |
|--------|------|----------|
| `start` | 기본설계 시작 | Todo → 기본설계 |
| `draft` | 상세설계 시작 | 기본설계 → 상세설계 |
| `approve` | 설계승인 | 상세설계 → 설계승인 |
| `build` | 구현 시작 | 설계승인 → 구현 |
| `verify` | 통합테스트 시작 | 구현 → 통합테스트 |
| `done` | 작업 완료 | 통합테스트 → 완료 |

**상태 내 액션 (상태 변경 없음, 반복 가능)**

| 명령어 | 사용 가능 상태 | 설명 |
|--------|---------------|------|
| `ui` | 기본설계 | 화면설계 작성, 화면설계 문서 생성 |
| `review` | 상세설계 | LLM 설계 리뷰 실행, 리뷰문서 생성 |
| `apply` | 상세설계 | 리뷰 내용을 설계서에 반영 |
| `test` | 구현 | TDD/E2E 테스트 실행, 테스트 결과서 생성 |
| `audit` | 구현 | LLM 코드 리뷰 실행, 리뷰문서 생성 |
| `patch` | 구현 | 리뷰 내용을 코드에 반영 |

#### A.2 defect 카테고리 명령어

**상태 전환 명령어**

| 명령어 | 설명 | 상태 전환 |
|--------|------|----------|
| `start` | 결함 분석 시작 | Todo → 분석 |
| `fix` | 수정 시작 | 분석 → 수정 |
| `verify` | 회귀 테스트 시작 | 수정 → 테스트 |
| `done` | 수정 완료 | 테스트 → 완료 |

#### A.3 infrastructure 카테고리 명령어

**상태 전환 명령어**

| 명령어 | 설명 | 상태 전환 |
|--------|------|----------|
| `start` | 기술 설계 시작 | Todo → 설계 |
| `skip` | 설계 생략, 바로 구현 | Todo → 구현 |
| `build` | 구현 시작 | 설계 → 구현 |
| `done` | 작업 완료 | 구현 → 완료 |

### B. 상태 기호 요약

#### B.1 칸반 통합 상태

| 칸반 컬럼 | 통합 상태 | 의미 |
|-----------|-----------|------|
| Todo | `[ ]` | 대기 |
| Design | `[bd]` | 기본설계 |
| Detail | `[dd]` | 상세분석 |
| Approve | `[ap]` | 설계승인 |
| Implement | `[im]` | 구현/수정 |
| Verify | `[vf]` | 검증 |
| Done | `[xx]` | 완료 |

#### B.2 카테고리별 세부 상태

| 기호 | 의미 | 사용 워크플로우 | 칸반 매핑 |
|------|------|----------------|-----------|
| `[ ]` | Todo (대기) | 공통 | Todo |
| `[bd]` | 기본설계 | development | Design |
| `[dd]` | 상세설계/설계 | development, infrastructure | Detail |
| `[an]` | 분석 | defect | Detail |
| `[ap]` | 설계승인 | development | Approve |
| `[im]` | 구현 | development, infrastructure | Implement |
| `[fx]` | 수정 | defect | Implement |
| `[vf]` | 검증 | development, defect | Verify |
| `[xx]` | 완료 | 공통 | Done |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 5.3 | 2025-12-18 | **워크플로우 스키마 v2.0**: 섹션 3.2.4 업데이트. Record 기반 스키마 구조 설명 추가 (states, commands, workflows 섹션) |
| 5.2 | 2025-12-18 | 설계승인(approve) 단계 추가: [ap] 상태, Approve 컬럼 |
| 5.1 | 2025-12-13 | 초기 버전 |
