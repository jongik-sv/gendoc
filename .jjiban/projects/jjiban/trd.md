# jjiban - 기술 요구사항 정의서 (TRD)

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 2.0 |
| 작성일 | 2026-12-10 |
| 상태 | Draft |
| 복잡도 등급 | TIER 1: PoC |

---

## 1. 프로젝트 기술 요약

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | jjiban - AI 기반 프로젝트 관리 도구 |
| 타겟 사용자 | 소규모 개발팀 (1-10명) |
| 배포 환경 | 로컬 개발 환경 (npx 실행) |
| 데이터 저장 | 분산 JSON 파일 (.jjiban/ 폴더) |
| 동기화 방식 | Git push/pull |
| 목표 | PoC (Proof of Concept) - 핵심 기능 검증 |

### 1.2 핵심 기술 요구사항

| 요구사항 | 설명 |
|----------|------|
| 파일 기반 데이터 | 분산 JSON으로 WBS/Task 저장 |
| 웹 터미널 | LLM CLI 실행을 위한 브라우저 내장 터미널 |
| 문서 렌더링 | Markdown, Mermaid 다이어그램 |
| Gantt 차트 | 계층형 일정 시각화, 드래그 조정 |
| LLM CLI 통합 | Claude Code, Gemini CLI 등 CLI 도구 실행 |

---

## 2. 기술 스택 결정

### 2.1 핵심 기술 스택

| 계층 | 기술 | 버전 | 선정 근거 |
|-----|------|------|----------|
| **런타임** | Node.js | 20.x LTS | 안정적 LTS, 장기 지원 |
| **프레임워크** | Nuxt 3 | 3.18.x | Standalone 빌드, Server Routes |
| **프론트엔드** | Vue 3 | 3.5.x | Composition API |
| **데이터** | 분산 JSON | - | 파일 시스템 직접 접근 |
| **동기화** | Git | - | push/pull 기반 |

### 2.2 UI/스타일링 스택

| 구분 | 기술 | 버전 | 선정 근거 |
|-----|------|------|----------|
| **CSS 프레임워크** | TailwindCSS | 3.4.x | 유틸리티 퍼스트, PrimeVue와 병행 |
| **UI 컴포넌트** | PrimeVue | 4.x | TreeTable 내장, 풍부한 컴포넌트, **최우선 사용** |
| **아이콘** | @iconify/vue | 4.x | 다양한 아이콘셋 |
| **테마 프리셋** | @primeuix/themes | 4.x | 커스텀 테마 정의 |

### 2.3 디자인 시스템 (PrimeVue 중심)

> **핵심 원칙**: PrimeVue 컴포넌트를 **최우선**으로 사용하고, TailwindCSS는 보조 스타일링에만 사용

#### 2.3.1 컴포넌트 사용 우선순위

```
1순위: PrimeVue 컴포넌트 (Button, Card, DataTable, Dialog, etc.)
2순위: TailwindCSS 유틸리티 클래스 (레이아웃, 간격 조정)
3순위: 커스텀 CSS (불가피한 경우에만)
```

#### 2.3.2 필수 사용 PrimeVue 컴포넌트

| 기능 | PrimeVue 컴포넌트 | 사용 불가 대안 |
|-----|------------------|---------------|
| 버튼 | `<Button>` | `<button>` with custom style |
| 카드 | `<Card>` | `<div class="bg-white rounded...">` |
| 테이블 | `<DataTable>`, `<TreeTable>` | `<table>` with custom style |
| 다이얼로그 | `<Dialog>` | custom modal |
| 폼 입력 | `<InputText>`, `<Textarea>` | `<input>`, `<textarea>` |
| 셀렉트 | `<Select>`, `<Dropdown>` | `<select>` |
| 태그/뱃지 | `<Tag>`, `<Badge>` | custom span |
| 메뉴 | `<Menu>`, `<ContextMenu>` | custom dropdown |
| 트리 | `<Tree>`, `<TreeTable>` | custom tree |
| 프로그레스 | `<ProgressBar>` | custom progress |
| 토스트 | `<Toast>` | custom notification |

#### 2.3.3 기본 테마 설정 (Dark Blue)

```typescript
// nuxt.config.ts - 테마 설정
primevue: {
  options: {
    theme: {
      preset: JjibanDarkBlue,  // 커스텀 프리셋
      options: {
        darkModeSelector: '.dark-mode',
        cssLayer: {
          name: 'primevue',
          order: 'tailwind-base, primevue, tailwind-utilities'
        }
      }
    }
  }
}
```

#### 2.3.4 테마 컬러 팔레트

| 시맨틱 색상 | 용도 | Dark Blue 테마 |
|-----------|------|----------------|
| `primary` | 주요 액션, 링크 | `#3b82f6` |
| `surface` | 배경, 카드 | `#1a1a2e` → `#1e1e38` |
| `text.color` | 주요 텍스트 | `#e8e8e8` |
| `text.secondary` | 보조 텍스트 | `#888888` |
| `border.color` | 테두리 | `#3d3d5c` |
| `green` | 성공, 완료 | `#22c55e` |
| `amber` | 경고, 진행중 | `#f59e0b` |
| `red` | 에러, 위험 | `#ef4444` |

#### 2.3.5 WBS 계층 색상 (고정)

| 계층 | 컬러 클래스 | Hex | 용도 |
|------|-----------|-----|------|
| Project | `--jjiban-project` | `#8b5cf6` | 프로젝트 아이콘/배지 |
| Work Package | `--jjiban-wp` | `#3b82f6` | WP 아이콘/배지 |
| Activity | `--jjiban-act` | `#22c55e` | Activity 아이콘/배지 |
| Task | `--jjiban-task` | `#f59e0b` | Task 아이콘/배지 |

#### 2.3.6 CSS 클래스 중앙화 원칙

> **핵심 원칙**: 컴포넌트 내 인라인 스타일(`:style`) 및 HEX 하드코딩 금지. 모든 스타일은 `main.css`의 Tailwind 클래스로 중앙 관리.

**Single Source of Truth**:
```
main.css (CSS 변수 + Tailwind 클래스)
    ↓
tailwind.config.ts (CSS 변수 참조)
    ↓
컴포넌트 (:class 바인딩만 사용)
```

**금지 패턴**:
```vue
<!-- ❌ 금지: 인라인 스타일 -->
:style="{ backgroundColor: '#3b82f6' }"
:style="{ color: getColor() }"

<!-- ❌ 금지: 컴포넌트 내 HEX 하드코딩 -->
const color = '#3b82f6'
```

**권장 패턴**:
```vue
<!-- ✅ 권장: CSS 클래스 바인딩 -->
:class="`node-icon-${type}`"
:class="{ 'workflow-completed': isCompleted }"
```

**예외 허용 케이스** (동적 계산 필수):
- `paddingLeft` (트리 들여쓰기: depth × 단위)
- 패널 크기 (드래그 리사이즈)
- Props로 전달된 동적 값 (`maxHeight` 등)

### 2.4 특수 기능 스택

| 기능 | 기술 | 버전 | 선정 근거 |
|------|------|------|----------|
| **웹 터미널** | @xterm/xterm | 5.x | VS Code 검증 터미널 |
| **Gantt 차트** | Frappe Gantt | 1.0.4 | 오픈소스, 의존성 없음 |
| **Markdown 렌더링** | marked + highlight.js | 14.x / 11.x | 경량, GFM 지원 |
| **다이어그램** | Mermaid | 11.x | Markdown 내 다이어그램 |
| **코드 에디터** | Monaco Editor | 0.52.x | VS Code 코어 |

### 2.5 개발 도구 스택

| 구분 | 기술 | 버전 | 선정 근거 |
|-----|------|------|----------|
| **언어** | TypeScript | 5.6.x | 타입 안전성 |
| **패키지 매니저** | npm | 10.x | 단순화 |
| **빌드 도구** | Vite | 6.x | Nuxt 3 기본 번들러 |
| **린터** | ESLint | 9.x | TypeScript/Vue 통합 |
| **포매터** | Prettier | 3.x | 일관된 코드 스타일 |

### 2.6 테스트 스택

| 유형 | 기술 | 버전 | 선정 근거 |
|------|------|------|----------|
| **단위 테스트** | Vitest | 2.x | Vite 네이티브 |
| **컴포넌트 테스트** | Vue Test Utils | 2.x | Vue 3 공식 |
| **E2E 테스트** | Playwright | 1.49.x | 크로스 브라우저 |

---

## 3. 시스템 아키텍처

### 3.1 전체 구성도

```
┌─────────────────────────────────────────────────────────┐
│                      npx jjiban                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Nuxt 3 (Standalone)                  │  │
│  │  ┌─────────────┐  ┌────────────────────────────┐  │  │
│  │  │   Pages     │  │     Server Routes          │  │  │
│  │  │  - 칸반보드  │  │  /api/projects             │  │  │
│  │  │  - WBS 트리  │  │  /api/tasks                │  │  │
│  │  │  - 간트차트  │  │  /api/wbs                  │  │  │
│  │  │  - 문서편집  │  │  → 파일 시스템 직접 접근    │  │  │
│  │  │  - 터미널   │  │                            │  │  │
│  │  └─────────────┘  └────────────────────────────┘  │  │
│  └───────────────────────────┬───────────────────────┘  │
│                              │                          │
│  ┌───────────────────────────▼───────────────────────┐  │
│  │              .jjiban/ (로컬 폴더)                  │  │
│  │  ├── project.json      # 프로젝트 메타            │  │
│  │  ├── team.json         # 팀원 목록                │  │
│  │  ├── index.json        # 칸반용 요약 (자동)       │  │
│  │  └── wbs/              # WBS 분산 JSON            │  │
│  │      └── WP-XX/ACT-XX/TSK-XXX.json               │  │
│  └───────────────────────────┬───────────────────────┘  │
└──────────────────────────────┼──────────────────────────┘
                               │
                               ▼
                        Git Push/Pull
                       (팀 동기화)
```

### 3.2 데이터 흐름

```
사용자 조작 (브라우저)
        │
        ▼
┌─────────────────┐
│  Nuxt Pages     │
│  (Vue 컴포넌트)  │
└────────┬────────┘
         │ useFetch / $fetch
         ▼
┌─────────────────┐
│ Server Routes   │
│ /api/*          │
└────────┬────────┘
         │ fs.readFile / fs.writeFile
         ▼
┌─────────────────┐
│ .jjiban/ 폴더   │
│ (JSON 파일들)   │
└─────────────────┘
```

---

## 4. 프로젝트 구조

### 4.1 디렉토리 구조

```
jjiban/                        # npm 패키지
├── bin/
│   └── jjiban.js              # CLI 엔트리포인트
├── src/
│   ├── components/            # Vue 컴포넌트
│   │   ├── kanban/            # 칸반 보드
│   │   ├── wbs/               # WBS 트리
│   │   ├── gantt/             # 간트 차트
│   │   ├── document/          # 문서 뷰어/에디터
│   │   └── terminal/          # 웹 터미널
│   ├── composables/           # Composition API 훅
│   │   ├── useProject.ts      # 프로젝트 상태
│   │   ├── useTasks.ts        # 태스크 CRUD
│   │   └── useFileSystem.ts   # 파일 시스템 접근
│   ├── layouts/               # 레이아웃
│   ├── pages/                 # 파일 기반 라우팅
│   │   ├── index.vue          # 대시보드
│   │   ├── kanban.vue         # 칸반 보드
│   │   ├── wbs.vue            # WBS 트리
│   │   ├── gantt.vue          # 간트 차트
│   │   └── task/[id].vue      # 태스크 상세
│   ├── server/
│   │   ├── api/               # Server Routes
│   │   │   ├── projects/      # 프로젝트 API
│   │   │   ├── tasks/         # 태스크 API
│   │   │   └── wbs/           # WBS API
│   │   └── utils/
│   │       ├── fileSystem.ts  # 파일 시스템 유틸
│   │       └── wbsIndex.ts    # index.json 생성
│   ├── types/                 # 공유 타입 정의
│   └── utils/                 # 클라이언트 유틸
├── templates/                 # 초기화 템플릿
│   ├── project.json
│   └── team.json
├── nuxt.config.ts
├── package.json
└── README.md
```

### 4.2 Server Routes 구조

```
server/api/
├── projects/
│   ├── index.get.ts           # GET /api/projects
│   ├── index.post.ts          # POST /api/projects
│   └── [id].get.ts            # GET /api/projects/:id
├── tasks/
│   ├── index.get.ts           # GET /api/tasks (from index.json)
│   ├── [id].get.ts            # GET /api/tasks/:id
│   ├── [id].put.ts            # PUT /api/tasks/:id
│   ├── [id].delete.ts         # DELETE /api/tasks/:id
│   └── [id]/
│       └── status.put.ts      # PUT /api/tasks/:id/status
├── wbs/
│   ├── index.get.ts           # GET /api/wbs (전체 트리)
│   ├── wp/
│   │   ├── index.post.ts      # POST /api/wbs/wp
│   │   └── [id].ts            # WP CRUD
│   └── activity/
│       ├── index.post.ts      # POST /api/wbs/activity
│       └── [id].ts            # Activity CRUD
└── index/
    └── regenerate.post.ts     # POST /api/index/regenerate
```

---

## 5. LLM CLI 통합

### 5.1 CLI 실행 방식

LLM 통합은 API 호출이 아닌 **CLI 도구를 웹 터미널에서 직접 실행**하는 방식을 사용합니다.

| CLI 도구 | 설명 | 실행 예시 |
|---------|------|----------|
| **Claude Code** | Anthropic Claude CLI | `claude "코드 리뷰해줘"` |
| **Gemini CLI** | Google Gemini CLI | `gemini "설계 검토해줘"` |
| **Codex CLI** | OpenAI Codex CLI | `codex "테스트 코드 작성해줘"` |

### 5.2 터미널 세션 관리

```
브라우저 (xterm.js)
    ↓ WebSocket (Nuxt Server Route)
Nuxt Server
    ↓ node-pty
시스템 Shell (bash/zsh/powershell)
    ↓ 명령 실행
LLM CLI (claude, gemini, codex)
```

### 5.3 LLM의 직접 파일 수정

LLM CLI가 `.jjiban/` 폴더의 JSON 파일을 직접 수정할 수 있습니다.

```
사용자: "TSK-01-01 상태를 im으로 변경해줘"

Claude Code:
1. .jjiban/wbs/WP-01/ACT-01/TSK-01-01.json 읽기
2. status 필드를 "im"으로 변경
3. history에 변경 이력 추가
4. 파일 저장
```

이것이 jjiban의 핵심 가치입니다 - **LLM이 API 없이 직접 데이터를 조작**할 수 있습니다.

---

## 6. 파일 시스템 서비스

### 6.1 핵심 기능

```typescript
// server/utils/fileSystem.ts
export class FileSystemService {
  private dataDir: string

  constructor(dataDir: string) {
    this.dataDir = dataDir
  }

  // JSON 파일 읽기
  async readJson<T>(relativePath: string): Promise<T> {
    const fullPath = path.join(this.dataDir, relativePath)
    const content = await fs.readFile(fullPath, 'utf-8')
    return JSON.parse(content)
  }

  // JSON 파일 쓰기
  async writeJson<T>(relativePath: string, data: T): Promise<void> {
    const fullPath = path.join(this.dataDir, relativePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2))
  }

  // 태스크 파일 목록 조회
  async listTasks(): Promise<string[]> {
    const pattern = path.join(this.dataDir, 'wbs/**/TSK-*.json')
    return glob(pattern)
  }
}
```

### 6.2 index.json 자동 생성

```typescript
// server/utils/wbsIndex.ts
export async function generateIndex(dataDir: string) {
  const taskFiles = await glob(`${dataDir}/wbs/**/TSK-*.json`)

  const tasks = await Promise.all(
    taskFiles.map(async (file) => {
      const task = JSON.parse(await fs.readFile(file, 'utf-8'))
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        category: task.category,
        priority: task.priority,
        assignee: task.assignee,
        wpId: task.wpId,
        activityId: task.activityId
      }
    })
  )

  const summary = {
    total: tasks.length,
    byStatus: groupBy(tasks, 'status'),
    byCategory: groupBy(tasks, 'category')
  }

  const index = {
    generatedAt: new Date().toISOString(),
    projectId: path.basename(dataDir),
    tasks,
    summary
  }

  await fs.writeFile(
    path.join(dataDir, 'index.json'),
    JSON.stringify(index, null, 2)
  )

  return index
}
```

### 6.3 생성 타이밍

- **서버 시작 시**: 전체 WBS 스캔 후 index.json 생성/갱신
- **태스크 변경 시**: 해당 태스크만 index에서 업데이트
- **수동 트리거**: API 호출로 전체 재생성

---

## 7. CLI 패키징

### 7.1 bin/jjiban.js

```javascript
#!/usr/bin/env node

import path from 'path'
import fs from 'fs'
import { startServer } from '../dist/server.js'
import { initProject } from '../dist/init.js'

const args = process.argv.slice(2)
const targetDir = args.find(a => !a.startsWith('-')) || process.cwd()
const port = args.includes('--port')
  ? parseInt(args[args.indexOf('--port') + 1])
  : 3000

const jjibanDir = path.join(targetDir, '.jjiban')

async function main() {
  // .jjiban 폴더 확인
  if (!fs.existsSync(jjibanDir)) {
    const shouldInit = await prompt('📁 .jjiban 폴더가 없습니다. 초기화할까요?')
    if (shouldInit) {
      await initProject(jjibanDir)
    } else {
      process.exit(0)
    }
  }

  // 서버 시작
  await startServer({
    dataDir: jjibanDir,
    port
  })
}

main()
```

### 7.2 package.json

```json
{
  "name": "jjiban",
  "version": "0.1.0",
  "description": "AI-powered project management tool",
  "bin": {
    "jjiban": "./bin/jjiban.js"
  },
  "files": [
    "bin",
    "dist",
    "templates"
  ],
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "nuxt": "^3.18.0",
    "vue": "^3.5.0",
    "pinia": "^2.2.0",
    "@pinia/nuxt": "^0.5.0",
    "primevue": "^4.2.0",
    "@primevue/nuxt-module": "^4.2.0",
    "frappe-gantt": "^1.0.4",
    "@xterm/xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.10.0",
    "marked": "^14.0.0",
    "mermaid": "^11.0.0",
    "monaco-editor": "^0.52.0",
    "node-pty": "^1.0.0",
    "glob": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@nuxt/devtools": "^1.7.0",
    "tailwindcss": "^3.4.0",
    "@nuxtjs/tailwindcss": "^6.12.0",
    "vitest": "^2.0.0",
    "@vue/test-utils": "^2.4.0",
    "@playwright/test": "^1.49.0"
  }
}
```

---

## 8. 품질 요구사항

### 8.1 성능 목표 (PoC 기준)

| 지표 | 목표값 | 비고 |
|-----|--------|------|
| 페이지 로드 시간 | < 3초 | 개발 서버 기준 |
| API 응답 시간 | < 500ms | 일반 CRUD 작업 |
| 파일 로딩 (1,000 태스크) | < 300ms | 병렬 로딩 |
| index.json 로딩 | < 50ms | 칸반 초기 렌더링 |
| 터미널 출력 지연 | < 100ms | CLI 출력 스트리밍 |

### 8.2 파일 시스템 성능

| 태스크 수 | 파일 수 | 병렬 로딩 | index.json 방식 |
|----------|--------|----------|----------------|
| 150개 | ~210 | ~50ms | ~5ms |
| 500개 | ~600 | ~150ms | ~10ms |
| 1,000개 | ~1,200 | ~300ms | ~20ms |
| 5,000개 | ~6,000 | ~1.5s ⚠️ | ~50ms |

**결론**: 1,000개 이하면 병렬 로딩으로 충분, 5,000개 이상이면 index.json 방식 필수

---

## 9. AI 코딩 가이드라인

### 9.1 PrimeVue 컴포넌트 우선 사용 (최우선 원칙)

> **핵심**: 모든 UI 요소는 PrimeVue 컴포넌트를 **먼저** 검토하고 사용합니다.

#### 9.1.1 필수 PrimeVue 컴포넌트 매핑

| UI 요소 | 필수 사용 | 금지 (대안) |
|--------|----------|------------|
| 버튼 | `<Button>` | `<button class="...">` |
| 입력 필드 | `<InputText>`, `<Textarea>` | `<input>`, `<textarea>` |
| 선택 박스 | `<Select>`, `<Dropdown>` | `<select>` |
| 카드 | `<Card>` | `<div class="card">` |
| 테이블 | `<DataTable>`, `<Column>` | `<table>` |
| 트리 | `<Tree>`, `<TreeTable>` | 커스텀 트리 |
| 모달 | `<Dialog>` | 커스텀 모달 |
| 태그 | `<Tag>`, `<Badge>` | `<span class="tag">` |
| 메뉴 | `<Menu>`, `<Menubar>` | 커스텀 드롭다운 |
| 토스트 | `<Toast>` | 커스텀 알림 |
| 프로그레스 | `<ProgressBar>` | 커스텀 프로그레스 |
| 스켈레톤 | `<Skeleton>` | 커스텀 로딩 |
| 확인 다이얼로그 | `<ConfirmDialog>` | `window.confirm()` |

#### 9.1.2 올바른 컴포넌트 사용 예시

```vue
<!-- ✅ 권장: PrimeVue 컴포넌트 사용 -->
<template>
  <Card>
    <template #title>프로젝트 목록</template>
    <template #content>
      <DataTable :value="projects">
        <Column field="name" header="이름" />
        <Column field="status" header="상태">
          <template #body="{ data }">
            <Tag :value="data.status" :severity="getSeverity(data.status)" />
          </template>
        </Column>
      </DataTable>
    </template>
    <template #footer>
      <Button label="새 프로젝트" icon="pi pi-plus" @click="create" />
    </template>
  </Card>
</template>

<!-- ❌ 금지: 커스텀 스타일링 -->
<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-bold">프로젝트 목록</h2>
    <table class="w-full">...</table>
    <button class="bg-blue-500 text-white px-4 py-2 rounded">
      새 프로젝트
    </button>
  </div>
</template>
```

### 9.2 일반 권장 사항

| 항목 | 지침 |
|------|------|
| **컴포넌트 작성** | Vue 3 Composition API (`<script setup>`) 사용 |
| **상태 관리** | Pinia 스토어, 컴포저블 분리 |
| **API 호출** | useFetch/useAsyncData (Nuxt) |
| **타입 정의** | types/ 폴더에 공유 타입 정의 |
| **파일 접근** | server/utils/fileSystem.ts 서비스 사용 |
| **UI 컴포넌트** | PrimeVue 컴포넌트 최우선 사용 |
| **스타일링** | TailwindCSS는 레이아웃/간격에만 사용 |

### 9.3 금지 사항

| 항목 | 이유 |
|------|------|
| Options API | Composition API 일관성 유지 |
| `any` 타입 남용 | 타입 안전성 저해 |
| 직접 DOM 조작 | Vue 반응성 시스템 우회 |
| 클라이언트에서 파일 접근 | Server Routes 통해서만 접근 |
| 커스텀 버튼/폼 요소 | PrimeVue 컴포넌트 사용 필수 |
| `<div class="card">` | `<Card>` 컴포넌트 사용 |
| `<table>` 직접 사용 | `<DataTable>` 컴포넌트 사용 |
| 커스텀 모달 | `<Dialog>` 컴포넌트 사용 |

### 9.4 코드 스타일

```typescript
// ✅ 권장: Composition API with <script setup>
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task } from '~/types'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  update: [task: Task]
}>()

const isEditing = ref(false)
const taskTitle = computed(() => props.task.title)
</script>

// ✅ 권장: Server Route
export default defineEventHandler(async (event) => {
  const { dataDir } = useRuntimeConfig()
  const fs = new FileSystemService(dataDir)

  const taskId = getRouterParam(event, 'id')
  const task = await fs.readJson<Task>(`wbs/**/${taskId}.json`)

  return task
})
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 2.0 | 2026-12-12 | 디자인 시스템 섹션 추가: PrimeVue 중심 컴포넌트 전략, Dark Blue 테마, AI 코딩 가이드라인 강화 |
| 1.0 | 2026-12-10 | 초기 버전 작성 |

---

## 참고 자료

### 공식 문서
- [Vue 3 공식 문서](https://vuejs.org/)
- [Nuxt 3 공식 문서](https://nuxt.com/)
- [PrimeVue 공식 문서](https://primevue.org/)

### 버전 정보 출처
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [Nuxt Releases](https://github.com/nuxt/nuxt/releases)
- [Vue Releases](https://github.com/vuejs/core/releases)
- [PrimeVue npm](https://www.npmjs.com/package/primevue)
- [Frappe Gantt](https://frappe.io/gantt)
- [xterm.js](https://xtermjs.org/)
