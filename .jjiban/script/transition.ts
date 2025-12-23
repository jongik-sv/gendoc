/**
 * 워크플로우 상태 전환 스크립트
 *
 * Usage:
 *   npx tsx .jjiban/script/transition.ts <task-id> <command> [options]
 *
 * Arguments:
 *   task-id   Task ID (TSK-01-01 또는 project/TSK-01-01)
 *   command   워크플로우 명령 (start, draft, approve, build, verify, done, fix, skip)
 *
 * Options:
 *   -p, --project <id>  프로젝트 ID
 *   -f, --force         manual approval 시 확인 없이 실행
 *
 * Output (JSON):
 *   { success, taskId, previousStatus, newStatus, command, reason? }
 */

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 서버 유틸리티 import (wbs.md 조작용)
import { findTaskById, findTaskInProject } from '../../server/utils/wbs/taskService.js';
import { getWbsTree, saveWbsTree } from '../../server/utils/wbs/wbsService.js';

// ====================
// 타입 정의
// ====================

interface Transition {
  from: string;
  to: string;
  command: string;
  document: string | null;
}

interface Workflow {
  id: string;
  name: string;
  states: string[];
  transitions: Transition[];
}

interface WorkflowsConfig {
  version: string;
  workflows: Workflow[];
}

interface TransitionOutput {
  success: boolean;
  taskId?: string;
  previousStatus?: string;
  newStatus?: string;
  command?: string;
  reason?: string;
  message?: string;
}

interface WbsNode {
  id: string;
  type: string;
  status?: string;
  category?: string;
  completed?: Record<string, string>;
  children?: WbsNode[];
  [key: string]: unknown;
}

// ====================
// 출력 헬퍼
// ====================

function output(result: TransitionOutput): void {
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.success ? 0 : 1;
}

function outputError(reason: string, message: string): void {
  output({ success: false, reason, message });
}

// ====================
// 상태 코드 유틸리티
// ====================

function extractStatusCode(status: string | undefined): string {
  if (!status) return '';
  const match = status.match(/\[([^\]]*)\]/);
  return match ? match[1] : '';
}

function formatStatusCode(code: string): string {
  return `[${code}]`;
}

function formatCompletedTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ====================
// 워크플로우 로딩
// ====================

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadWorkflows(): Promise<WorkflowsConfig> {
  const workflowsPath = join(__dirname, '../settings/workflows.json');
  const content = await readFile(workflowsPath, 'utf-8');
  return JSON.parse(content);
}

function findTransition(
  workflows: WorkflowsConfig,
  category: string,
  currentStatus: string,
  command: string
): Transition | null {
  const workflow = workflows.workflows.find(w => w.id === category);
  if (!workflow) return null;
  return workflow.transitions.find(
    t => t.from === currentStatus && t.command === command
  ) || null;
}

// ====================
// 롤백 계산
// ====================

function calculateRollbackDeletions(
  workflows: WorkflowsConfig,
  category: string,
  currentStatus: string,
  newStatus: string
): string[] {
  const workflow = workflows.workflows.find(w => w.id === category);
  if (!workflow) return [];

  const currentIndex = workflow.states.indexOf(currentStatus);
  const newIndex = workflow.states.indexOf(newStatus);

  // 롤백 아님 (전진 또는 동일)
  if (newIndex >= currentIndex || newIndex < 0 || currentIndex < 0) {
    return [];
  }

  // 롤백 이후 단계의 상태 코드 추출
  const stateCodesToDelete: string[] = [];
  for (let i = newIndex + 1; i < workflow.states.length; i++) {
    const stateCode = extractStatusCode(workflow.states[i]);
    if (stateCode && stateCode.trim()) {
      stateCodesToDelete.push(stateCode);
    }
  }
  return stateCodesToDelete;
}

// ====================
// WBS 트리 업데이트
// ====================

function updateTaskInTree(
  nodes: WbsNode[],
  taskId: string,
  newStatus: string,
  completedTimestamp: string,
  stateCodesToDelete: string[]
): boolean {
  for (const node of nodes) {
    if (node.id === taskId && node.type === 'task') {
      // 상태 업데이트
      node.status = newStatus;

      // 롤백 시 이후 단계 completed 삭제
      if (stateCodesToDelete.length > 0 && node.completed) {
        for (const code of stateCodesToDelete) {
          delete node.completed[code];
        }
      }

      // completed 필드에 완료 시각 기록
      const newStatusCode = extractStatusCode(newStatus);
      if (newStatusCode) {
        if (!node.completed) {
          node.completed = {};
        }
        node.completed[newStatusCode] = completedTimestamp;
      }

      return true;
    }
    if (node.children && node.children.length > 0) {
      if (updateTaskInTree(node.children, taskId, newStatus, completedTimestamp, stateCodesToDelete)) {
        return true;
      }
    }
  }
  return false;
}

// ====================
// 프로젝트 ID 해석
// ====================

async function resolveProjectId(
  taskIdInput: string,
  projectOption?: string
): Promise<{ projectId: string; taskId: string } | null> {
  if (projectOption) {
    return { projectId: projectOption, taskId: taskIdInput };
  }

  if (taskIdInput.includes('/')) {
    const [projectId, taskId] = taskIdInput.split('/');
    return { projectId, taskId };
  }

  const taskResult = await findTaskById(taskIdInput);
  if (!taskResult) {
    return null;
  }

  return { projectId: taskResult.projectId, taskId: taskIdInput };
}

// ====================
// 상태 전환 실행
// ====================

async function executeTransition(
  taskId: string,
  command: string,
  projectId: string,
  workflows: WorkflowsConfig
): Promise<TransitionOutput> {
  // 1. Task 검색
  const taskResult = await findTaskInProject(projectId, taskId);
  if (!taskResult) {
    return { success: false, reason: 'TASK_NOT_FOUND', message: `Task를 찾을 수 없습니다: ${taskId}` };
  }

  const { task } = taskResult;
  const category = task.category as string;
  const statusCode = extractStatusCode(task.status);
  const currentStatus = formatStatusCode(statusCode);

  // 2. 전환 규칙 검색
  const transition = findTransition(workflows, category, currentStatus, command);
  if (!transition) {
    return {
      success: false,
      reason: 'INVALID_TRANSITION',
      message: `현재 상태 ${currentStatus}에서 명령어 '${command}'를 사용할 수 없습니다`,
    };
  }

  // 3. WBS 트리 조회
  const { metadata, tree } = await getWbsTree(projectId);

  // 4. 롤백 계산
  const stateCodesToDelete = calculateRollbackDeletions(
    workflows,
    category,
    currentStatus,
    transition.to
  );

  // 5. 타임스탬프 생성
  const completedTimestamp = formatCompletedTimestamp();

  // 6. 트리 업데이트
  const updated = updateTaskInTree(
    tree as WbsNode[],
    taskId,
    transition.to,
    completedTimestamp,
    stateCodesToDelete
  );

  if (!updated) {
    return { success: false, reason: 'TASK_NOT_FOUND', message: `트리에서 Task를 찾을 수 없습니다: ${taskId}` };
  }

  // 7. WBS 저장
  await saveWbsTree(projectId, metadata, tree);

  return {
    success: true,
    taskId,
    previousStatus: statusCode,
    newStatus: extractStatusCode(transition.to),
    command,
  };
}

// ====================
// 메인 함수
// ====================

async function main(): Promise<void> {
  // 인자 파싱
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      project: { type: 'string', short: 'p' },
      force: { type: 'boolean', short: 'f', default: false },
    },
    allowPositionals: true,
  });

  // 필수 인자 확인
  if (positionals.length < 2) {
    outputError('INVALID_ARGS', 'Usage: npx tsx transition.ts <task-id> <command> [-p project] [-f]');
    return;
  }

  const [taskIdInput, command] = positionals;
  const projectOption = values.project;

  // 워크플로우 로드
  let workflows: WorkflowsConfig;
  try {
    workflows = await loadWorkflows();
  } catch (error) {
    outputError('WORKFLOW_LOAD_FAILED', 'workflows.json을 로드할 수 없습니다');
    return;
  }

  // 프로젝트 ID 해석
  const resolved = await resolveProjectId(taskIdInput, projectOption);
  if (!resolved) {
    outputError('TASK_NOT_FOUND', `Task를 찾을 수 없습니다: ${taskIdInput}`);
    return;
  }

  const { projectId, taskId } = resolved;

  // 상태 전환 실행
  try {
    const result = await executeTransition(taskId, command, projectId, workflows);
    output(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    outputError('TRANSITION_FAILED', message);
  }
}

// 실행
main().catch((error) => {
  outputError('UNEXPECTED_ERROR', error instanceof Error ? error.message : 'Unexpected error');
});
