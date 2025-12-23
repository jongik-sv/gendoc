# jjiban개선 - 기술 요구사항 정의서 (TRD)

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |
| 상태 | Draft |
| 복잡도 등급 | TIER 2: Feature Enhancement |
| 선행 TRD | jjiban TRD 2.0 |

---

## 1. 프로젝트 기술 요약

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | jjiban개선 - 웹 터미널 기반 워크플로우 실행 |
| 목표 | `/wf:*` 명령어를 웹 UI에서 직접 실행 |
| 핵심 기술 | xterm.js + node-pty + SSE |
| 통합 대상 | Claude Code, Gemini CLI 등 LLM CLI 도구 |

### 1.2 핵심 기술 요구사항

| 요구사항 | 설명 |
|----------|------|
| 웹 터미널 | xterm.js 기반 브라우저 내장 터미널 |
| 서버 프로세스 | node-pty로 쉘 프로세스 관리 |
| 실시간 스트림 | SSE (Server-Sent Events)로 출력 스트리밍 |
| 세션 관리 | Task별 독립 터미널 세션 |
| 워크플로우 버튼 | 상태 기반 명령어 버튼 UI |

---

## 2. 기술 스택 결정

### 2.1 신규 핵심 기술 스택

| 기능 | 기술 | 버전 | 선정 근거 |
|------|------|------|----------|
| **웹 터미널 UI** | xterm | ^5.x | VS Code 검증, 활발한 개발 |
| **터미널 크기 조정** | @xterm/addon-fit | ^0.8.x | xterm 공식 애드온 |
| **서버 PTY** | node-pty | ^1.0.x | 검증된 의사 터미널 라이브러리 |
| **실시간 스트림** | SSE (native) | - | Nuxt 3 기본 지원, 단순 구현 |

### 2.2 SSE vs WebSocket 결정

| 항목 | SSE | WebSocket |
|------|-----|-----------|
| Nuxt 3 호환성 | ✅ 기본 지원 | △ 추가 설정 필요 |
| 양방향 통신 | X (단방향) | ✅ 완전 지원 |
| 구현 복잡도 | 낮음 | 높음 |
| 연결 안정성 | 자동 재연결 | 수동 구현 필요 |
| HTTP/2 지원 | ✅ | △ |

**결정: SSE 채택**
- 터미널 출력 (서버→클라이언트): SSE 스트림
- 터미널 입력 (클라이언트→서버): POST API
- Nuxt 3 Standalone 모드에서 WebSocket 설정이 복잡하여 SSE가 적합

### 2.3 기존 기술 스택 (jjiban TRD 2.0 상속)

| 계층 | 기술 | 버전 |
|------|------|------|
| 런타임 | Node.js | 20.x LTS |
| 프레임워크 | Nuxt 3 | 3.18.x |
| 프론트엔드 | Vue 3 | 3.5.x |
| UI 컴포넌트 | PrimeVue | 4.x |
| 스타일링 | TailwindCSS | 3.4.x |
| 차트 | Frappe Gantt | 0.6.x |

---

## 3. 시스템 아키텍처

### 3.1 터미널 통합 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                      브라우저 (클라이언트)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Task Detail Panel                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │            워크플로우 액션 바                      │  │  │
│  │  │  [start] [draft] [build] [test] [done]...        │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │            xterm.js 터미널                        │  │  │
│  │  │  $ /wf:start TSK-01-01                          │  │  │
│  │  │  [wf:start] 기본설계 시작...                     │  │  │
│  │  │  ...                                            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
          POST /input ────────┼──────── SSE /output
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Nuxt 3 Server                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Terminal Service                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │ SessionMgr  │  │ PTY Process │  │ SSE Handler │    │  │
│  │  └─────────────┘  └──────┬──────┘  └─────────────┘    │  │
│  └──────────────────────────┼────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │ node-pty
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      시스템 Shell                            │
│              bash / zsh / PowerShell / cmd                   │
│                              │                               │
│                              ▼                               │
│              claude "/wf:start TSK-01-01"                    │
│              (Claude Code CLI 실행)                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름

```
[1] 버튼 클릭
    │
    ▼
[2] POST /api/workflow/execute
    │
    ▼
[3] TerminalService.createSession()
    │
    ▼
[4] node-pty.spawn()
    │
    ├── stdout ──► SSE /api/terminal/session/:id/output
    │                  │
    │                  ▼
    │              [5] xterm.js 렌더링
    │
    └── exit ───► [6] 상태 업데이트 (wbs.md)
                      │
                      ▼
                  [7] UI 갱신 (Task Detail)
```

---

## 4. 서버 구현 상세

### 4.1 터미널 서비스 구조

```
server/
├── api/
│   ├── terminal/
│   │   ├── session.post.ts           # 세션 생성
│   │   ├── session.get.ts            # 세션 상태 조회
│   │   ├── session/
│   │   │   ├── [id].delete.ts        # 세션 종료
│   │   │   ├── [id]/
│   │   │   │   ├── input.post.ts     # 터미널 입력
│   │   │   │   ├── output.get.ts     # SSE 출력 스트림
│   │   │   │   └── resize.post.ts    # 터미널 크기 조정
│   │   └── workflow/
│   │       ├── execute.post.ts       # 워크플로우 실행
│   │       └── available-commands/
│   │           └── [taskId].get.ts   # Task별 가용 명령어
└── utils/
    └── terminalService.ts            # 터미널 서비스 코어
```

### 4.2 TerminalService 클래스

```typescript
// server/utils/terminalService.ts

import * as pty from 'node-pty';

interface TerminalSession {
  id: string;
  taskId: string;
  projectId: string;
  ptyProcess: pty.IPty;
  status: 'connecting' | 'connected' | 'running' | 'completed' | 'error';
  currentCommand?: string;
  createdAt: Date;
  updatedAt: Date;
  outputBuffer: string[];
  sseClients: Set<WritableStreamDefaultWriter>;
}

class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private readonly MAX_SESSIONS = 10;
  private readonly BUFFER_SIZE = 10000;
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5분

  // 세션 생성
  createSession(taskId: string, projectId: string, cols: number, rows: number): string {
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error('최대 세션 수 초과');
    }

    const sessionId = `term-${crypto.randomUUID()}`;
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: process.cwd(),
      env: process.env
    });

    const session: TerminalSession = {
      id: sessionId,
      taskId,
      projectId,
      ptyProcess,
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      outputBuffer: [],
      sseClients: new Set()
    };

    // 출력 핸들러
    ptyProcess.onData((data) => {
      this.handleOutput(sessionId, data);
    });

    // 종료 핸들러
    ptyProcess.onExit(({ exitCode }) => {
      this.handleExit(sessionId, exitCode);
    });

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  // 입력 전송
  sendInput(sessionId: string, input: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('세션 없음');
    session.ptyProcess.write(input);
    session.updatedAt = new Date();
  }

  // 크기 조정
  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('세션 없음');
    session.ptyProcess.resize(cols, rows);
  }

  // 세션 종료
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.ptyProcess.kill();
    session.sseClients.forEach(client => client.close());
    this.sessions.delete(sessionId);
  }

  // SSE 클라이언트 등록
  registerSSEClient(sessionId: string, writer: WritableStreamDefaultWriter): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('세션 없음');
    session.sseClients.add(writer);

    // 기존 버퍼 전송
    session.outputBuffer.forEach(line => {
      writer.write(`event: output\ndata: ${JSON.stringify({ text: line })}\n\n`);
    });
  }

  private handleOutput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 버퍼 저장 (최대 크기 유지)
    session.outputBuffer.push(data);
    if (session.outputBuffer.length > this.BUFFER_SIZE) {
      session.outputBuffer.shift();
    }

    // SSE 클라이언트에 전송
    const message = `event: output\ndata: ${JSON.stringify({ text: data })}\n\n`;
    session.sseClients.forEach(client => {
      client.write(message);
    });

    session.updatedAt = new Date();
  }

  private handleExit(sessionId: string, exitCode: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = exitCode === 0 ? 'completed' : 'error';

    // SSE 완료 이벤트 전송
    const message = `event: complete\ndata: ${JSON.stringify({ exitCode, success: exitCode === 0 })}\n\n`;
    session.sseClients.forEach(client => {
      client.write(message);
      client.close();
    });
  }
}

export const terminalService = new TerminalService();
```

### 4.3 SSE 출력 스트림 API

```typescript
// server/api/terminal/session/[id]/output.get.ts

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id');

  // SSE 헤더 설정
  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  // TransformStream으로 SSE 스트림 생성
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // 서비스에 SSE 클라이언트 등록
  terminalService.registerSSEClient(sessionId, writer);

  // 연결 종료 시 정리
  event.node.req.on('close', () => {
    terminalService.unregisterSSEClient(sessionId, writer);
  });

  return readable;
});
```

### 4.4 워크플로우 실행 API

```typescript
// server/api/workflow/execute.post.ts

interface ExecuteRequest {
  taskId: string;
  projectId: string;
  command: string;
  options?: {
    until?: string;
    skipReview?: boolean;
    skipAudit?: boolean;
    dryRun?: boolean;
  };
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ExecuteRequest>(event);
  const { taskId, projectId, command, options } = body;

  // 1. Task 검증
  const task = await wbsService.getTask(projectId, taskId);
  if (!task) {
    throw createError({ statusCode: 404, message: 'Task를 찾을 수 없습니다' });
  }

  // 2. 명령어 가용성 검증
  const availableCommands = getAvailableCommands(task.status, task.category);
  if (!availableCommands.includes(command)) {
    throw createError({ statusCode: 400, message: `현재 상태에서 ${command} 명령어를 사용할 수 없습니다` });
  }

  // 3. 터미널 세션 생성
  const sessionId = terminalService.createSession(taskId, projectId, 120, 30);

  // 4. 워크플로우 명령어 실행
  const fullCommand = buildWorkflowCommand(projectId, taskId, command, options);
  terminalService.sendInput(sessionId, fullCommand + '\n');

  return {
    success: true,
    sessionId,
    message: `워크플로우 ${command} 실행 시작`
  };
});

function buildWorkflowCommand(
  projectId: string,
  taskId: string,
  command: string,
  options?: ExecuteRequest['options']
): string {
  let cmd = `/wf:${command} ${projectId}/${taskId}`;

  if (options?.until) cmd += ` --until ${options.until}`;
  if (options?.skipReview) cmd += ' --skip-review';
  if (options?.skipAudit) cmd += ' --skip-audit';
  if (options?.dryRun) cmd += ' --dry-run';

  return cmd;
}
```

---

## 5. 클라이언트 구현 상세

### 5.1 컴포넌트 구조

```
app/components/
├── terminal/
│   ├── TerminalPanel.vue        # 터미널 패널 컨테이너
│   ├── TerminalView.vue         # xterm.js 래퍼
│   ├── TerminalToolbar.vue      # 툴바 (접기, 지우기, 상태)
│   └── TerminalStatus.vue       # 연결 상태 인디케이터
├── workflow/
│   ├── WorkflowActions.vue      # 워크플로우 액션 바
│   ├── WorkflowButton.vue       # 개별 명령어 버튼
│   └── WorkflowAutoActions.vue  # 자동실행 버튼 그룹
└── wbs/detail/
    └── TaskTerminalPanel.vue    # Task Detail 통합 컴포넌트
```

### 5.2 TerminalView 컴포넌트

```vue
<!-- app/components/terminal/TerminalView.vue -->
<template>
  <div ref="terminalContainer" class="terminal-view h-full" />
</template>

<script setup lang="ts">
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

const props = defineProps<{
  sessionId: string | null;
}>();

const emit = defineEmits<{
  input: [data: string];
}>();

const terminalContainer = ref<HTMLElement>();
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let eventSource: EventSource | null = null;

// xterm.js 초기화
onMounted(() => {
  terminal = new Terminal({
    theme: {
      background: '#1a1a2e',
      foreground: '#e8e8e8',
      cursor: '#3b82f6',
      selection: 'rgba(59, 130, 246, 0.3)'
    },
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    fontSize: 14,
    cursorBlink: true
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  if (terminalContainer.value) {
    terminal.open(terminalContainer.value);
    fitAddon.fit();
  }

  // 키 입력 핸들러
  terminal.onData((data) => {
    emit('input', data);
  });

  // 리사이즈 옵저버
  const resizeObserver = new ResizeObserver(() => {
    fitAddon?.fit();
  });
  if (terminalContainer.value) {
    resizeObserver.observe(terminalContainer.value);
  }
});

// SSE 연결 관리
watch(() => props.sessionId, (newId, oldId) => {
  // 기존 연결 종료
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  // 새 연결 시작
  if (newId) {
    connectSSE(newId);
  }
});

function connectSSE(sessionId: string) {
  eventSource = new EventSource(`/api/terminal/session/${sessionId}/output`);

  eventSource.addEventListener('output', (e) => {
    const { text } = JSON.parse(e.data);
    terminal?.write(text);
  });

  eventSource.addEventListener('status', (e) => {
    const { status } = JSON.parse(e.data);
    // 상태 업데이트 처리
  });

  eventSource.addEventListener('complete', (e) => {
    const { exitCode, success } = JSON.parse(e.data);
    // 완료 처리
  });

  eventSource.onerror = () => {
    // 재연결 로직
  };
}

// 정리
onUnmounted(() => {
  eventSource?.close();
  terminal?.dispose();
});
</script>
```

### 5.3 WorkflowActions 컴포넌트

```vue
<!-- app/components/workflow/WorkflowActions.vue -->
<template>
  <div class="workflow-actions">
    <!-- 워크플로우 명령어 버튼 그룹 -->
    <div class="flex flex-wrap gap-2 mb-3">
      <WorkflowButton
        v-for="cmd in filteredCommands"
        :key="cmd.name"
        :command="cmd"
        :disabled="!cmd.available || isExecuting"
        :loading="executingCommand === cmd.name"
        @click="executeCommand(cmd.name)"
      />
    </div>

    <!-- 자동 실행 버튼 -->
    <Divider />
    <div class="flex gap-2">
      <Button
        label="Run"
        icon="pi pi-play"
        severity="success"
        :disabled="isExecuting"
        @click="executeCommand('run')"
      />
      <Button
        label="Auto"
        icon="pi pi-forward"
        severity="info"
        :disabled="isExecuting"
        @click="executeCommand('auto')"
      />
      <Button
        v-if="isExecuting"
        label="중지"
        icon="pi pi-stop"
        severity="danger"
        @click="cancelExecution"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkflowCommand } from '~/types/terminal';

const props = defineProps<{
  taskId: string;
  taskStatus: string;
  taskCategory: string;
}>();

const emit = defineEmits<{
  execute: [command: string];
}>();

const workflowStore = useWorkflowStore();
const { executingCommand, isExecuting } = storeToRefs(workflowStore);

// 상태/카테고리 기반 명령어 필터링
const filteredCommands = computed(() => {
  return WORKFLOW_COMMANDS.map(cmd => ({
    ...cmd,
    available: isCommandAvailable(cmd, props.taskStatus, props.taskCategory)
  }));
});

function executeCommand(command: string) {
  emit('execute', command);
}

function cancelExecution() {
  workflowStore.cancelExecution();
}
</script>
```

### 5.4 Pinia 스토어

```typescript
// stores/terminal.ts

export const useTerminalStore = defineStore('terminal', () => {
  const sessions = ref<Map<string, TerminalSession>>(new Map());
  const activeSessionId = ref<string | null>(null);
  const isConnecting = ref(false);
  const error = ref<string | null>(null);

  async function createSession(taskId: string, projectId: string) {
    isConnecting.value = true;
    error.value = null;

    try {
      const { data } = await useFetch('/api/terminal/session', {
        method: 'POST',
        body: { taskId, projectId, cols: 120, rows: 30 }
      });

      if (data.value?.sessionId) {
        activeSessionId.value = data.value.sessionId;
        sessions.value.set(data.value.sessionId, {
          id: data.value.sessionId,
          taskId,
          projectId,
          status: 'connected'
        });
      }

      return data.value?.sessionId;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isConnecting.value = false;
    }
  }

  async function sendInput(input: string) {
    if (!activeSessionId.value) return;

    await useFetch(`/api/terminal/session/${activeSessionId.value}/input`, {
      method: 'POST',
      body: { input }
    });
  }

  async function closeSession(sessionId?: string) {
    const id = sessionId || activeSessionId.value;
    if (!id) return;

    await useFetch(`/api/terminal/session/${id}`, {
      method: 'DELETE'
    });

    sessions.value.delete(id);
    if (activeSessionId.value === id) {
      activeSessionId.value = null;
    }
  }

  return {
    sessions,
    activeSessionId,
    isConnecting,
    error,
    createSession,
    sendInput,
    closeSession
  };
});
```

---

## 6. 워크플로우 명령어 정의

### 6.1 명령어별 가용성 매트릭스

```typescript
// utils/workflowCommands.ts

export const WORKFLOW_COMMANDS: WorkflowCommand[] = [
  {
    name: 'start',
    label: '시작',
    icon: 'pi-play',
    severity: 'primary',
    availableStatuses: ['[ ]'],
    categories: ['development', 'defect', 'infrastructure']
  },
  {
    name: 'ui',
    label: 'UI설계',
    icon: 'pi-palette',
    severity: 'info',
    availableStatuses: ['[bd]'],
    categories: ['development']
  },
  {
    name: 'draft',
    label: '상세설계',
    icon: 'pi-pencil',
    severity: 'info',
    availableStatuses: ['[bd]'],
    categories: ['development']
  },
  {
    name: 'review',
    label: '리뷰',
    icon: 'pi-eye',
    severity: 'secondary',
    availableStatuses: ['[dd]'],
    categories: ['development']
  },
  {
    name: 'apply',
    label: '적용',
    icon: 'pi-check',
    severity: 'secondary',
    availableStatuses: ['[dd]'],
    categories: ['development']
  },
  {
    name: 'build',
    label: '구현',
    icon: 'pi-wrench',
    severity: 'warning',
    availableStatuses: ['[dd]'],
    categories: ['development', 'infrastructure']
  },
  {
    name: 'test',
    label: '테스트',
    icon: 'pi-bolt',
    severity: 'secondary',
    availableStatuses: ['[im]'],
    categories: ['development']
  },
  {
    name: 'audit',
    label: '코드리뷰',
    icon: 'pi-search',
    severity: 'secondary',
    availableStatuses: ['[im]', '[fx]'],
    categories: ['development', 'defect', 'infrastructure']
  },
  {
    name: 'patch',
    label: '패치',
    icon: 'pi-file-edit',
    severity: 'secondary',
    availableStatuses: ['[im]', '[fx]'],
    categories: ['development', 'defect', 'infrastructure']
  },
  {
    name: 'verify',
    label: '검증',
    icon: 'pi-verified',
    severity: 'success',
    availableStatuses: ['[im]', '[fx]'],
    categories: ['development', 'defect']
  },
  {
    name: 'done',
    label: '완료',
    icon: 'pi-check-circle',
    severity: 'success',
    availableStatuses: ['[vf]', '[im]'],
    categories: ['development', 'defect', 'infrastructure']
  },
  {
    name: 'fix',
    label: '수정',
    icon: 'pi-wrench',
    severity: 'danger',
    availableStatuses: ['[an]'],
    categories: ['defect']
  },
  {
    name: 'skip',
    label: '생략',
    icon: 'pi-forward',
    severity: 'secondary',
    availableStatuses: ['[ ]'],
    categories: ['infrastructure']
  }
];

export function isCommandAvailable(
  command: WorkflowCommand,
  status: string,
  category: string
): boolean {
  return (
    command.availableStatuses.includes(status) &&
    command.categories.includes(category)
  );
}
```

---

## 7. 품질 요구사항

### 7.1 성능 목표

| 지표 | 목표값 | 비고 |
|------|--------|------|
| 터미널 연결 시간 | < 500ms | 세션 생성 + PTY 스폰 |
| 출력 렌더링 지연 | < 50ms | SSE → xterm.js |
| 버튼 반응 시간 | < 100ms | 클릭 → 명령어 전송 |
| 터미널 스크롤 | 60fps | 대량 출력 시에도 유지 |
| SSE 재연결 | < 2s | 네트워크 끊김 복구 |

### 7.2 확장성

| 항목 | 제한 |
|------|------|
| 동시 세션 수 | 최대 10개 |
| 출력 버퍼 | 세션당 10,000줄 |
| SSE 연결 | Task당 1개 |
| 세션 타임아웃 | 5분 (비활성) |

### 7.3 안정성

| 시나리오 | 처리 방식 |
|----------|----------|
| 네트워크 끊김 | 자동 재연결 (3회, 1s/2s/4s 간격) |
| 서버 재시작 | 세션 복구 불가 → 새 세션 생성 |
| 브라우저 탭 닫힘 | 세션 자동 정리 (5분 타임아웃) |
| PTY 프로세스 크래시 | 에러 상태 표시 + 재시작 버튼 |
| 명령어 실패 | 에러 메시지 표시 + 재시도 버튼 |

### 7.4 보안

| 항목 | 구현 방식 |
|------|----------|
| 세션 접근 | 세션 ID 기반 (UUID) |
| 명령어 제한 | `/wf:*` 패턴만 허용 |
| 입력 검증 | 제어 문자 필터링 |
| XSS 방지 | xterm.js 기본 이스케이프 |

---

## 8. 테스트 전략

### 8.1 단위 테스트

```typescript
// tests/unit/terminalService.test.ts

describe('TerminalService', () => {
  it('세션 생성', async () => {
    const sessionId = terminalService.createSession('TSK-01-01', 'jjiban', 80, 24);
    expect(sessionId).toMatch(/^term-/);
    expect(terminalService.getSession(sessionId)).toBeDefined();
  });

  it('최대 세션 수 제한', () => {
    for (let i = 0; i < 10; i++) {
      terminalService.createSession(`TSK-01-0${i}`, 'jjiban', 80, 24);
    }
    expect(() => terminalService.createSession('TSK-01-11', 'jjiban', 80, 24))
      .toThrow('최대 세션 수 초과');
  });

  it('입력 전송', () => {
    const sessionId = terminalService.createSession('TSK-01-01', 'jjiban', 80, 24);
    expect(() => terminalService.sendInput(sessionId, 'ls\n')).not.toThrow();
  });
});
```

### 8.2 E2E 테스트

```typescript
// tests/e2e/terminal.spec.ts

test('워크플로우 명령어 실행', async ({ page }) => {
  // Task 상세 페이지로 이동
  await page.goto('/wbs?task=TSK-01-01');

  // start 버튼 클릭
  await page.click('button:has-text("시작")');

  // 터미널 출력 확인
  await expect(page.locator('.terminal-view')).toContainText('[wf:start]');

  // 완료 대기
  await page.waitForSelector('.terminal-status:has-text("완료")');
});
```

---

## 9. 의존성 목록

### 9.1 신규 패키지

```json
{
  "dependencies": {
    "xterm": "^5.5.0",
    "@xterm/addon-fit": "^0.8.0",
    "node-pty": "^1.0.0"
  }
}
```

### 9.2 Windows 빌드 요구사항

node-pty는 네이티브 모듈이므로 Windows에서 빌드 도구가 필요합니다:

```bash
# Windows Build Tools 설치
npm install --global windows-build-tools

# 또는 Visual Studio Build Tools 설치
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초기 버전 작성 (웹 터미널 + 워크플로우 실행) |
| 1.1 | 2025-12-17 | **터미널 구현 방식 변경**: xterm.js + node-pty 제거, child_process.spawn() + SSE 스트리밍으로 변경. 사유: xterm.js 렌더링 문제(viewport 스크롤 이슈), node-pty 네이티브 빌드 복잡성. 새 방식은 단순 텍스트 출력으로 Claude Code CLI 실행 결과만 표시. |
