/**
 * 실행 가능한 Task 목록 조회 스크립트 (의존관계 분석)
 *
 * Usage:
 *   npx tsx .jjiban/script/next-task.ts [input] [options]
 *
 * Arguments:
 *   input   프로젝트ID, TaskID, 또는 project/task-id 형식
 *
 * Options:
 *   -p, --project <id>   프로젝트 ID
 *   -c, --category <cat> 카테고리 필터 (development|defect|infrastructure)
 *   -t, --table          표 형식 출력 (기본: JSON)
 *   -i, --ignore-deps    의존관계 무시 (설계 단계용)
 *
 * Output (JSON):
 *   { projectId, executable: [...], waiting: [...] }
 */

import { parseArgs } from 'node:util';
import { promises as fs, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ====================
// 타입 정의
// ====================

interface WbsNode {
  id: string;
  title: string;
  type: string;
  category?: string;
  status?: string;
  priority?: string;
  attributes: Record<string, string>;
}

interface ExecutableTask {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  nextAction: string;
}

interface WaitingTask {
  id: string;
  title: string;
  blockedBy: string[];
}

interface NextTaskResult {
  projectId: string;
  executable: ExecutableTask[];
  waiting: WaitingTask[];
}

interface Transition {
  from: string;
  to: string;
  command: string;
}

interface StateDef {
  id: string;
  label: string;
  phase: 'todo' | 'design' | 'implement' | 'done';
  [key: string]: unknown;
}

interface WorkflowDef {
  name: string;
  states: string[];
  transitions: Transition[];
}

interface WorkflowsConfig {
  version: string;
  states: Record<string, StateDef>;
  commands: Record<string, unknown>;
  workflows: Record<string, WorkflowDef>;
}

// ====================
// 상수
// ====================

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// phase 우선순위 (낮을수록 먼저)
const PHASE_ORDER: Record<string, number> = {
  todo: 0,
  design: 1,
  implement: 2,
  done: 99,
};

// ====================
// 기본 워크플로우 설정 (fallback)
// ====================

const DEFAULT_WORKFLOWS: WorkflowsConfig = {
  version: '2.0',
  states: {
    '[ ]': { id: 'todo', label: '시작 전', phase: 'todo' },
    '[bd]': { id: 'basic-design', label: '기본설계', phase: 'design' },
    '[dd]': { id: 'detail-design', label: '상세설계', phase: 'design' },
    '[ap]': { id: 'approve', label: '승인', phase: 'design' },
    '[im]': { id: 'implement', label: '구현', phase: 'implement' },
    '[vf]': { id: 'verify', label: '검증', phase: 'implement' },
    '[xx]': { id: 'done', label: '완료', phase: 'done' },
    '[an]': { id: 'analysis', label: '분석', phase: 'design' },
    '[fx]': { id: 'fix', label: '수정', phase: 'implement' },
    '[ds]': { id: 'design', label: '설계', phase: 'design' },
  },
  commands: {},
  workflows: {
    development: {
      name: 'Development Workflow',
      states: ['[ ]', '[bd]', '[dd]', '[ap]', '[im]', '[vf]', '[xx]'],
      transitions: [
        { from: '[ ]', to: '[bd]', command: 'start' },
        { from: '[bd]', to: '[dd]', command: 'draft' },
        { from: '[dd]', to: '[ap]', command: 'approve' },
        { from: '[ap]', to: '[im]', command: 'build' },
        { from: '[im]', to: '[vf]', command: 'verify' },
        { from: '[vf]', to: '[xx]', command: 'done' },
      ],
    },
    defect: {
      name: 'Defect Workflow',
      states: ['[ ]', '[an]', '[fx]', '[vf]', '[xx]'],
      transitions: [
        { from: '[ ]', to: '[an]', command: 'start' },
        { from: '[an]', to: '[fx]', command: 'fix' },
        { from: '[fx]', to: '[vf]', command: 'verify' },
        { from: '[vf]', to: '[xx]', command: 'done' },
      ],
    },
    infrastructure: {
      name: 'Infrastructure Workflow',
      states: ['[ ]', '[ds]', '[im]', '[xx]'],
      transitions: [
        { from: '[ ]', to: '[ds]', command: 'start' },
        { from: '[ ]', to: '[im]', command: 'skip' },
        { from: '[ds]', to: '[im]', command: 'build' },
        { from: '[im]', to: '[xx]', command: 'done' },
      ],
    },
  },
};

// ====================
// 워크플로우 로딩 및 액션 맵 생성
// ====================

function loadWorkflows(): WorkflowsConfig {
  const workflowsPath = join(__dirname, '../settings/workflows.json');
  try {
    const content = readFileSync(workflowsPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // 파일이 없으면 기본값 사용
    return DEFAULT_WORKFLOWS;
  }
}

function buildNextActionMap(config: WorkflowsConfig): Record<string, Record<string, string>> {

  const actionMap: Record<string, Record<string, string>> = {};

  for (const [category, workflow] of Object.entries(config.workflows)) {
    actionMap[category] = {};

    for (const transition of workflow.transitions) {
      if (!actionMap[category][transition.from]) {
        actionMap[category][transition.from] = transition.command;
      }
    }

    actionMap[category]['[xx]'] = '-';
  }

  return actionMap;
}

const workflows = loadWorkflows();
const NEXT_ACTION_MAP = buildNextActionMap(workflows);

// ====================
// WBS 파서 (경량)
// ====================

function parseWbsMarkdownSimple(markdown: string): WbsNode[] {
  const nodes: WbsNode[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  let inMetadata = true;

  for (const line of lines) {
    if (line.trim() === '---') {
      inMetadata = false;
      continue;
    }

    if (inMetadata) continue;

    const taskMatch = line.match(/^#{2,4}\s+(TSK-\d{2}(?:-\d{2}){1,2}):\s*(.*)$/);
    if (taskMatch) {
      nodes.push({
        id: taskMatch[1],
        title: taskMatch[2].trim(),
        type: 'task',
        attributes: {},
      });
      continue;
    }

    if (nodes.length > 0 && line.trim().startsWith('- ')) {
      const attrMatch = line.match(/^-\s*(\w+(?:-\w+)*):\s*(.*)$/);
      if (attrMatch) {
        const key = attrMatch[1];
        const value = attrMatch[2].trim();
        nodes[nodes.length - 1].attributes[key] = value;

        if (key === 'category') nodes[nodes.length - 1].category = value;
        if (key === 'status') nodes[nodes.length - 1].status = value;
        if (key === 'priority') nodes[nodes.length - 1].priority = value;
      }
    }
  }

  return nodes;
}

// ====================
// WBS 리더
// ====================

class WbsReader {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async getAllProjects(): Promise<string[]> {
    const projectsDir = join(this.projectRoot, '.jjiban', 'projects');
    try {
      const entries = await fs.readdir(projectsDir, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return [];
    }
  }

  async searchTaskInAllProjects(
    taskId: string
  ): Promise<Array<{ projectId: string; task: WbsNode }>> {
    const projects = await this.getAllProjects();
    const results: Array<{ projectId: string; task: WbsNode }> = [];

    for (const projectId of projects) {
      try {
        const nodes = await this.readWbs(projectId);
        const task = nodes.find((n) => n.id === taskId && n.type === 'task');
        if (task) {
          results.push({ projectId, task });
        }
      } catch {
        /* WBS 없으면 무시 */
      }
    }

    return results;
  }

  async detectProjectId(): Promise<string | null> {
    const projectsDir = join(this.projectRoot, '.jjiban', 'projects');

    try {
      const entries = await fs.readdir(projectsDir, { withFileTypes: true });
      const projectDirs = entries.filter((e) => e.isDirectory());

      if (projectDirs.length > 0) {
        return projectDirs[0].name;
      }
    } catch {
      return null;
    }

    return null;
  }

  getWbsPath(projectId: string): string {
    return join(this.projectRoot, '.jjiban', 'projects', projectId, 'wbs.md');
  }

  async readWbs(projectId: string): Promise<WbsNode[]> {
    const wbsPath = this.getWbsPath(projectId);
    const content = await fs.readFile(wbsPath, 'utf-8');
    return parseWbsMarkdownSimple(content);
  }
}

// ====================
// 유틸리티 함수
// ====================

function extractStatusCode(status: string | undefined): string {
  if (!status) return '[ ]';
  const match = status.match(/\[([^\]]+)\]/);
  return match ? `[${match[1]}]` : '[ ]';
}

function getPhase(statusCode: string): string {
  const state = workflows.states[statusCode];
  return state?.phase || 'todo';
}

function shouldCheckDeps(statusCode: string): boolean {
  const phase = getPhase(statusCode);
  return phase === 'implement';
}

function getNextAction(category: string, statusCode: string): string {
  const categoryMap = NEXT_ACTION_MAP[category];
  if (!categoryMap) return 'start';
  return categoryMap[statusCode] || 'start';
}

function sortTasks<T extends { priority?: string; id: string; status?: string }>(tasks: T[]): T[] {
  return tasks.sort((a, b) => {
    // 1. phase 우선 (todo/design이 implement보다 먼저)
    if (a.status && b.status) {
      const phaseA = PHASE_ORDER[getPhase(a.status)] ?? 2;
      const phaseB = PHASE_ORDER[getPhase(b.status)] ?? 2;
      if (phaseA !== phaseB) {
        return phaseA - phaseB;
      }
    }

    // 2. 우선순위
    const priorityA = PRIORITY_ORDER[a.priority || 'medium'] ?? 2;
    const priorityB = PRIORITY_ORDER[b.priority || 'medium'] ?? 2;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 3. WBS ID 순서
    return a.id.localeCompare(b.id);
  });
}

// ====================
// 실행 가능 Task 필터링
// ====================

interface FilterOptions {
  category?: string;
  ignoreDeps?: boolean;
}

function getExecutableTasks(
  nodes: WbsNode[],
  options: FilterOptions = {}
): { executable: ExecutableTask[]; waiting: WaitingTask[] } {
  const taskMap = new Map<string, WbsNode>();
  for (const node of nodes) {
    if (node.type === 'task') {
      taskMap.set(node.id, node);
    }
  }

  const executable: ExecutableTask[] = [];
  const waiting: Array<WaitingTask & { priority: string }> = [];

  for (const node of nodes) {
    if (node.type !== 'task') continue;

    const statusCode = extractStatusCode(node.status);

    if (statusCode === '[xx]') continue;

    if (options.category && node.category !== options.category) continue;

    const category = node.category || 'development';

    // phase 기반 의존성 체크 여부 결정
    const needsDepsCheck = shouldCheckDeps(statusCode);

    if (options.ignoreDeps || !needsDepsCheck) {
      // 의존성 체크 스킵 (todo/design 단계 또는 ignoreDeps 옵션)
      executable.push({
        id: node.id,
        title: node.title,
        category,
        status: statusCode,
        priority: node.priority || 'medium',
        nextAction: getNextAction(category, statusCode),
      });
      continue;
    }

    // 구현(implement) 단계: 의존성 체크 수행
    const blockedBy: string[] = [];
    if (node.attributes?.depends) {
      const depIds = node.attributes.depends.split(',').map((id) => id.trim());
      for (const depId of depIds) {
        const depTask = taskMap.get(depId);
        if (depTask) {
          const depStatus = extractStatusCode(depTask.status);
          if (depStatus !== '[xx]') {
            blockedBy.push(depId);
          }
        }
      }
    }

    if (blockedBy.length === 0) {
      executable.push({
        id: node.id,
        title: node.title,
        category,
        status: statusCode,
        priority: node.priority || 'medium',
        nextAction: getNextAction(category, statusCode),
      });
    } else {
      waiting.push({
        id: node.id,
        title: node.title,
        blockedBy,
        priority: node.priority || 'medium',
      });
    }
  }

  return {
    executable: sortTasks(executable),
    waiting: sortTasks(waiting).map(({ priority, ...rest }) => rest),
  };
}

// ====================
// 입력 파싱
// ====================

function parseInput(input: string | undefined): { projectId: string | null; taskId: string | null } {
  if (!input) return { projectId: null, taskId: null };

  if (input.includes('/')) {
    const [projectId, taskId] = input.split('/');
    return { projectId, taskId };
  }

  if (/^TSK-\d{2}(-\d{2}){1,2}$/.test(input)) {
    return { projectId: null, taskId: input };
  }

  return { projectId: input, taskId: null };
}

// ====================
// 출력 함수
// ====================

function printTable(projectId: string, result: { executable: ExecutableTask[]; waiting: WaitingTask[] }): void {
  const { executable, waiting } = result;

  console.log(`\n📁 프로젝트: ${projectId}`);
  console.log(`\n🎯 실행 가능한 Task (${executable.length}개)\n`);

  if (executable.length > 0) {
    console.log('  #  | Task ID        | 카테고리       | 우선순위 | 다음 액션');
    console.log(' ----+----------------+---------------+---------+----------');

    executable.forEach((task, i) => {
      const num = String(i + 1).padStart(2, ' ');
      const id = task.id.padEnd(14, ' ');
      const cat = task.category.padEnd(13, ' ');
      const pri = task.priority.padEnd(7, ' ');
      console.log(`  ${num} | ${id} | ${cat} | ${pri} | ${task.nextAction}`);
    });
  } else {
    console.log('  (없음)');
  }

  if (waiting.length > 0) {
    console.log(`\n⏳ 대기 중 (${waiting.length}개)`);
    for (const task of waiting) {
      console.log(`  - ${task.id}: ${task.blockedBy.join(', ')} 완료 대기`);
    }
  }

  console.log('');
}

function printProjectSelection(
  taskId: string,
  found: Array<{ projectId: string; task: WbsNode }>
): void {
  console.log(`\n[INFO] Task '${taskId}'가 여러 프로젝트에 존재합니다:\n`);
  found.forEach((r, i) => {
    const title = r.task.title || '(제목 없음)';
    console.log(`  ${i + 1}. ${r.projectId} - ${r.task.id}: ${title}`);
  });
  console.log(`\n다음 형식으로 재실행하세요: npx tsx .jjiban/script/next-task.ts {project}/${taskId}\n`);
}

function outputError(reason: string, message: string): void {
  console.error(JSON.stringify({ error: reason, message }));
  process.exitCode = 1;
}

// ====================
// 메인 함수
// ====================

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      project: { type: 'string', short: 'p' },
      category: { type: 'string', short: 'c' },
      table: { type: 'boolean', short: 't', default: false },
      'ignore-deps': { type: 'boolean', short: 'i', default: false },
    },
    allowPositionals: true,
  });

  const input = positionals[0];
  const projectRoot = process.cwd();
  const wbsReader = new WbsReader(projectRoot);

  let { projectId, taskId } = parseInput(input);

  if (values.project) {
    projectId = values.project;
  }

  const projects = await wbsReader.getAllProjects();

  if (projects.length === 0) {
    outputError('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다');
    return;
  }

  if (projects.length === 1) {
    projectId = projects[0];
  } else if (!projectId && taskId) {
    const found = await wbsReader.searchTaskInAllProjects(taskId);

    if (found.length === 0) {
      outputError('TASK_NOT_FOUND', `Task '${taskId}'를 찾을 수 없습니다`);
      return;
    } else if (found.length === 1) {
      projectId = found[0].projectId;
    } else {
      printProjectSelection(taskId, found);
      process.exitCode = 0;
      return;
    }
  } else if (!projectId) {
    projectId = await wbsReader.detectProjectId();
    if (!projectId) {
      outputError('PROJECT_NOT_FOUND', '프로젝트를 지정하세요');
      return;
    }
  }

  if (!projects.includes(projectId)) {
    outputError('PROJECT_NOT_FOUND', `프로젝트 '${projectId}'를 찾을 수 없습니다`);
    return;
  }

  let nodes: WbsNode[];
  try {
    nodes = await wbsReader.readWbs(projectId);
  } catch {
    outputError('WBS_NOT_FOUND', `프로젝트 WBS를 찾을 수 없습니다: ${projectId}`);
    return;
  }

  const result = getExecutableTasks(nodes, {
    category: values.category,
    ignoreDeps: values['ignore-deps'],
  });

  if (values.table) {
    printTable(projectId, result);
  } else {
    console.log(JSON.stringify({ projectId, ...result }, null, 2));
  }

  process.exitCode = 0;
}

main().catch((error) => {
  outputError('UNEXPECTED_ERROR', error instanceof Error ? error.message : 'Unexpected error');
});
