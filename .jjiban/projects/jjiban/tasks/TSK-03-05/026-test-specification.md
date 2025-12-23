# TSK-03-05: WBS 테스트 결과 업데이트 API - 테스트 명세

## 문서 정보
- **Task ID**: TSK-03-05
- **작성일**: 2025-12-15
- **문서 버전**: 1.0
- **목적**: 단위 테스트, 통합 테스트, E2E 테스트 명세 정의

---

## 1. 테스트 전략

### 1.1 테스트 레벨

| 레벨 | 목적 | 도구 | 커버리지 목표 |
|------|------|------|---------------|
| 단위 테스트 | 함수/모듈 단위 검증 | vitest | 라인 80%, 브랜치 75%, 함수 85% |
| 통합 테스트 | API 엔드포인트 검증 | vitest + $fetch | 주요 시나리오 100% |
| E2E 테스트 | 워크플로우 연동 검증 | Playwright | 핵심 시나리오 100% |
| 성능 테스트 | 응답 시간 검증 | vitest + 성능 측정 | NFR-001 충족 |
| 보안 테스트 | 보안 취약점 검증 | 수동 + vitest | NFR-004 충족 |

### 1.2 테스트 환경

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'server/api/projects/[id]/wbs/tasks/[taskId]/test-result.put.ts',
        'server/utils/wbs/taskService.ts'
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 85,
        statements: 80
      }
    }
  }
});
```

---

## 2. 단위 테스트 명세

### 2.1 validateTaskId 함수 테스트

**파일**: `tests/unit/api/projects/wbs/tasks/test-result.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

/**
 * TC-U-001: validateTaskId 함수 테스트
 * 커버하는 BR: BR-001
 */
describe('validateTaskId', () => {
  /**
   * TC-U-001-001: 3단계 Task ID 검증 (정상)
   * 입력: "TSK-03-05"
   * 기대 출력: true
   */
  it('TC-U-001-001: should validate 3-level task ID', () => {
    expect(validateTaskId('TSK-03-05')).toBe(true);
  });

  /**
   * TC-U-001-002: 4단계 Task ID 검증 (정상)
   * 입력: "TSK-02-01-03"
   * 기대 출력: true
   */
  it('TC-U-001-002: should validate 4-level task ID', () => {
    expect(validateTaskId('TSK-02-01-03')).toBe(true);
  });

  /**
   * TC-U-001-003: 1자리 세그먼트 거부 (비정상)
   * 입력: "TSK-3-5"
   * 기대 출력: false
   * 이유: 각 세그먼트는 최소 2자리
   */
  it('TC-U-001-003: should reject 1-digit segment', () => {
    expect(validateTaskId('TSK-3-5')).toBe(false);
  });

  /**
   * TC-U-001-004: 잘못된 접두사 거부 (비정상)
   * 입력: "TASK-03-05"
   * 기대 출력: false
   * 이유: 접두사는 "TSK"만 허용
   */
  it('TC-U-001-004: should reject wrong prefix', () => {
    expect(validateTaskId('TASK-03-05')).toBe(false);
  });

  /**
   * TC-U-001-005: 잘못된 형식 거부 (비정상)
   * 입력: "TSK-03"
   * 기대 출력: false
   * 이유: 최소 3개 세그먼트 필요
   */
  it('TC-U-001-005: should reject invalid format', () => {
    expect(validateTaskId('TSK-03')).toBe(false);
  });

  /**
   * TC-U-001-006: 빈 문자열 거부 (비정상)
   * 입력: ""
   * 기대 출력: false
   */
  it('TC-U-001-006: should reject empty string', () => {
    expect(validateTaskId('')).toBe(false);
  });

  /**
   * TC-U-001-007: null/undefined 거부 (비정상)
   * 입력: null, undefined
   * 기대 출력: false
   */
  it('TC-U-001-007: should reject null or undefined', () => {
    expect(validateTaskId(null as any)).toBe(false);
    expect(validateTaskId(undefined as any)).toBe(false);
  });
});
```

### 2.2 validateTestResult 함수 테스트

**파일**: `tests/unit/api/projects/wbs/tasks/test-result.test.ts`

```typescript
/**
 * TC-U-002: validateTestResult 함수 테스트
 * 커버하는 BR: BR-002
 */
describe('validateTestResult', () => {
  /**
   * TC-U-002-001: "none" 값 허용 (정상)
   * 입력: "none"
   * 기대 출력: true
   */
  it('TC-U-002-001: should validate "none"', () => {
    expect(validateTestResult('none')).toBe(true);
  });

  /**
   * TC-U-002-002: "pass" 값 허용 (정상)
   * 입력: "pass"
   * 기대 출력: true
   */
  it('TC-U-002-002: should validate "pass"', () => {
    expect(validateTestResult('pass')).toBe(true);
  });

  /**
   * TC-U-002-003: "fail" 값 허용 (정상)
   * 입력: "fail"
   * 기대 출력: true
   */
  it('TC-U-002-003: should validate "fail"', () => {
    expect(validateTestResult('fail')).toBe(true);
  });

  /**
   * TC-U-002-004: 대문자 거부 (비정상)
   * 입력: "PASS", "None", "Fail"
   * 기대 출력: false
   * 이유: 대소문자 구분, 소문자만 허용
   */
  it('TC-U-002-004: should reject uppercase', () => {
    expect(validateTestResult('PASS')).toBe(false);
    expect(validateTestResult('None')).toBe(false);
    expect(validateTestResult('Fail')).toBe(false);
  });

  /**
   * TC-U-002-005: 잘못된 값 거부 (비정상)
   * 입력: "error", "success", "pending"
   * 기대 출력: false
   */
  it('TC-U-002-005: should reject invalid value', () => {
    expect(validateTestResult('error')).toBe(false);
    expect(validateTestResult('success')).toBe(false);
    expect(validateTestResult('pending')).toBe(false);
  });

  /**
   * TC-U-002-006: 빈 문자열 거부 (비정상)
   * 입력: ""
   * 기대 출력: false
   */
  it('TC-U-002-006: should reject empty string', () => {
    expect(validateTestResult('')).toBe(false);
  });

  /**
   * TC-U-002-007: null/undefined 거부 (비정상)
   * 입력: null, undefined
   * 기대 출력: false
   */
  it('TC-U-002-007: should reject null or undefined', () => {
    expect(validateTestResult(null as any)).toBe(false);
    expect(validateTestResult(undefined as any)).toBe(false);
  });
});
```

### 2.3 findTaskInTree 함수 테스트

**파일**: `tests/utils/wbs/taskService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { findTaskInTree } from '../../../server/utils/wbs/taskService';
import type { WbsNode } from '../../../types';

/**
 * TC-U-003: findTaskInTree 함수 테스트
 * 커버하는 FR: FR-002, BR: BR-003
 */
describe('findTaskInTree', () => {
  /**
   * 테스트용 WBS 트리 픽스처
   */
  const mockTree: WbsNode[] = [
    {
      id: 'WP-01',
      type: 'wp',
      title: 'Work Package 1',
      children: [
        {
          id: 'TSK-01-01',
          type: 'task',
          title: 'Task 1-1',
          children: []
        },
        {
          id: 'ACT-01-02',
          type: 'act',
          title: 'Activity 1-2',
          children: [
            {
              id: 'TSK-01-02-01',
              type: 'task',
              title: 'Task 1-2-1',
              attributes: {
                'test-result': 'none'
              },
              children: []
            }
          ]
        }
      ]
    },
    {
      id: 'WP-02',
      type: 'wp',
      title: 'Work Package 2',
      children: [
        {
          id: 'TSK-02-01',
          type: 'task',
          title: 'Task 2-1',
          children: []
        }
      ]
    }
  ];

  /**
   * TC-U-003-001: 깊이 2 Task 탐색 (정상)
   * 입력: tree, "TSK-01-01"
   * 기대 출력: { id: "TSK-01-01", type: "task", ... }
   */
  it('TC-U-003-001: should find task at depth 2', () => {
    const task = findTaskInTree(mockTree, 'TSK-01-01');
    expect(task).not.toBeNull();
    expect(task!.id).toBe('TSK-01-01');
    expect(task!.type).toBe('task');
    expect(task!.title).toBe('Task 1-1');
  });

  /**
   * TC-U-003-002: 깊이 3 Task 탐색 (정상)
   * 입력: tree, "TSK-01-02-01"
   * 기대 출력: { id: "TSK-01-02-01", type: "task", ... }
   */
  it('TC-U-003-002: should find task at depth 3', () => {
    const task = findTaskInTree(mockTree, 'TSK-01-02-01');
    expect(task).not.toBeNull();
    expect(task!.id).toBe('TSK-01-02-01');
    expect(task!.type).toBe('task');
    expect(task!.attributes).toHaveProperty('test-result', 'none');
  });

  /**
   * TC-U-003-003: 미존재 Task 탐색 (비정상)
   * 입력: tree, "TSK-99-99"
   * 기대 출력: null
   */
  it('TC-U-003-003: should return null for non-existent task', () => {
    const task = findTaskInTree(mockTree, 'TSK-99-99');
    expect(task).toBeNull();
  });

  /**
   * TC-U-003-004: 비Task 노드 탐색 (비정상)
   * 입력: tree, "WP-01"
   * 기대 출력: null
   * 이유: type='wp'는 task가 아님
   */
  it('TC-U-003-004: should return null for non-task node', () => {
    const task = findTaskInTree(mockTree, 'WP-01');
    expect(task).toBeNull();
  });

  /**
   * TC-U-003-005: 빈 트리 처리 (비정상)
   * 입력: [], "TSK-01-01"
   * 기대 출력: null
   */
  it('TC-U-003-005: should handle empty tree', () => {
    const task = findTaskInTree([], 'TSK-01-01');
    expect(task).toBeNull();
  });

  /**
   * TC-U-003-006: 순환 참조 방지 (에지 케이스)
   * 입력: 순환 참조가 있는 트리
   * 기대 동작: 무한 루프 없이 null 반환
   */
  it('TC-U-003-006: should handle circular reference', () => {
    const circularTree: WbsNode[] = [
      {
        id: 'WP-01',
        type: 'wp',
        title: 'Circular WP',
        children: []
      }
    ];

    // 순환 참조 생성
    circularTree[0].children.push(circularTree[0]);

    const task = findTaskInTree(circularTree, 'TSK-01-01');
    expect(task).toBeNull();
  });
});
```

### 2.4 parseMetadata 함수 테스트

**파일**: `tests/unit/api/projects/wbs/tasks/test-result.test.ts`

```typescript
/**
 * TC-U-004: parseMetadata 함수 테스트
 * 커버하는 BR: BR-005
 */
describe('parseMetadata', () => {
  /**
   * TC-U-004-001: 유효한 메타데이터 파싱 (정상)
   */
  it('TC-U-004-001: should parse valid metadata', () => {
    const markdown = `
# WBS - jjiban

> version: 1.0
> depth: 4
> updated: 2025-12-15
> start: 2025-12-13

---
`.trim();

    const metadata = parseMetadata(markdown);

    expect(metadata.version).toBe('1.0');
    expect(metadata.depth).toBe(4);
    expect(metadata.updated).toBe('2025-12-15');
    expect(metadata.start).toBe('2025-12-13');
  });

  /**
   * TC-U-004-002: 기본값 사용 (정상)
   * 일부 필드가 누락된 경우 기본값 사용
   */
  it('TC-U-004-002: should use defaults for missing fields', () => {
    const markdown = `
# WBS - jjiban

> version: 1.0

---
`.trim();

    const metadata = parseMetadata(markdown);

    expect(metadata.version).toBe('1.0');
    expect(metadata.depth).toBe(3); // 기본값
    expect(metadata.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/); // 오늘 날짜
    expect(metadata.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  /**
   * TC-U-004-003: 빈 메타데이터 처리 (정상)
   */
  it('TC-U-004-003: should handle empty metadata', () => {
    const markdown = `
# WBS - jjiban

---
`.trim();

    const metadata = parseMetadata(markdown);

    expect(metadata.version).toBe('1.0'); // 기본값
    expect(metadata.depth).toBe(3);
  });

  /**
   * TC-U-004-004: depth 값 파싱 (정상)
   */
  it('TC-U-004-004: should parse depth as number', () => {
    const markdown = `
> depth: 4
---
`.trim();

    const metadata = parseMetadata(markdown);

    expect(metadata.depth).toBe(4);
    expect(typeof metadata.depth).toBe('number');
  });
});
```

---

## 3. 통합 테스트 명세

### 3.1 정상 시나리오 테스트

**파일**: `tests/api/projects/wbs/tasks/test-result.put.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { $fetch } from '@nuxt/test-utils';
import { readMarkdownFile, writeMarkdownFile, fileExists, getWbsPath } from '~/server/utils/file';

/**
 * TC-I-001: test-result 업데이트 성공 (none → pass)
 * 커버하는 FR: FR-001~005, NFR: NFR-002
 */
describe('PUT /api/projects/:id/wbs/tasks/:taskId/test-result - Success', () => {
  const projectId = 'test-project';
  const taskId = 'TSK-01-01';
  let originalContent: string;

  beforeEach(async () => {
    // 테스트용 wbs.md 파일 생성
    const wbsContent = `
# WBS - test-project

> version: 1.0
> depth: 3
> updated: 2025-12-15
> start: 2025-12-13

---

## WP-01: Test Work Package

### TSK-01-01: Test Task
- category: development
- status: [im]
- priority: medium
- assignee: -
- test-result: none
- schedule: 2025-12-15 ~ 2025-12-16
- tags: test
- depends: -
- requirements:
  - 테스트 요구사항 1
- ref: TEST-001
`.trim();

    await writeMarkdownFile(getWbsPath(projectId), wbsContent);
    originalContent = wbsContent;
  });

  afterEach(async () => {
    // 테스트 파일 정리
    const wbsPath = getWbsPath(projectId);
    const backupPath = `${wbsPath}.bak`;

    await fs.unlink(wbsPath).catch(() => {});
    await fs.unlink(backupPath).catch(() => {});
  });

  /**
   * TC-I-001-001: test-result 업데이트 성공
   */
  it('TC-I-001-001: should update test-result successfully', async () => {
    const response = await $fetch(`/api/projects/${projectId}/wbs/tasks/${taskId}/test-result`, {
      method: 'PUT',
      body: { testResult: 'pass' }
    });

    // 1. 응답 확인
    expect(response.success).toBe(true);
    expect(response.testResult).toBe('pass');
    expect(response.updated).toBe('2025-12-15');

    // 2. 파일 내용 확인
    const updatedContent = await readMarkdownFile(getWbsPath(projectId));
    expect(updatedContent).toContain('- test-result: pass');
    expect(updatedContent).not.toContain('- test-result: none');

    // 3. 백업 파일 삭제 확인
    const backupExists = await fileExists(`${getWbsPath(projectId)}.bak`);
    expect(backupExists).toBe(false);
  });

  /**
   * TC-I-001-002: test-result를 "fail"로 업데이트
   */
  it('TC-I-001-002: should update test-result to "fail"', async () => {
    const response = await $fetch(`/api/projects/${projectId}/wbs/tasks/${taskId}/test-result`, {
      method: 'PUT',
      body: { testResult: 'fail' }
    });

    expect(response.success).toBe(true);
    expect(response.testResult).toBe('fail');

    const updatedContent = await readMarkdownFile(getWbsPath(projectId));
    expect(updatedContent).toContain('- test-result: fail');
  });

  /**
   * TC-I-001-003: test-result를 "none"으로 리셋
   */
  it('TC-I-001-003: should reset test-result to "none"', async () => {
    // 먼저 "pass"로 업데이트
    await $fetch(`/api/projects/${projectId}/wbs/tasks/${taskId}/test-result`, {
      method: 'PUT',
      body: { testResult: 'pass' }
    });

    // "none"으로 리셋
    const response = await $fetch(`/api/projects/${projectId}/wbs/tasks/${taskId}/test-result`, {
      method: 'PUT',
      body: { testResult: 'none' }
    });

    expect(response.success).toBe(true);
    expect(response.testResult).toBe('none');
  });

  /**
   * TC-I-001-004: 메타데이터 updated 필드 자동 갱신 확인
   */
  it('TC-I-001-004: should update metadata "updated" field', async () => {
    const today = new Date().toISOString().split('T')[0];

    const response = await $fetch(`/api/projects/${projectId}/wbs/tasks/${taskId}/test-result`, {
      method: 'PUT',
      body: { testResult: 'pass' }
    });

    expect(response.updated).toBe(today);

    const updatedContent = await readMarkdownFile(getWbsPath(projectId));
    expect(updatedContent).toContain(`> updated: ${today}`);
  });
});
```

### 3.2 에러 시나리오 테스트

```typescript
/**
 * TC-I-002: Task 미존재 (404)
 * 커버하는 FR: FR-002, BR: BR-003
 */
describe('PUT /api/projects/:id/wbs/tasks/:taskId/test-result - Task Not Found', () => {
  it('TC-I-002-001: should return 404 when task does not exist', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-99-99/test-result', {
        method: 'PUT',
        body: { testResult: 'pass' }
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'TASK_NOT_FOUND',
      message: expect.stringContaining('TSK-99-99')
    });
  });

  it('TC-I-002-002: should return 404 when node is not a task', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/WP-01/test-result', {
        method: 'PUT',
        body: { testResult: 'pass' }
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'TASK_NOT_FOUND'
    });
  });
});

/**
 * TC-I-003: 잘못된 test-result 값 (400)
 * 커버하는 BR: BR-002
 */
describe('PUT /api/projects/:id/wbs/tasks/:taskId/test-result - Invalid Test Result', () => {
  it('TC-I-003-001: should return 400 for invalid test-result value', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: 'error' }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_TEST_RESULT',
      message: expect.stringContaining('none, pass, fail')
    });
  });

  it('TC-I-003-002: should return 400 for uppercase value', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: 'PASS' }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_TEST_RESULT'
    });
  });

  it('TC-I-003-003: should return 400 for empty string', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: '' }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_TEST_RESULT'
    });
  });
});

/**
 * TC-I-004: 백업 실패 시 업데이트 중단 (500)
 * 커버하는 FR: FR-005, NFR: NFR-002, BR: BR-004
 */
describe('PUT /api/projects/:id/wbs/tasks/:taskId/test-result - Backup Failed', () => {
  it('TC-I-004-001: should abort update when backup fails', async () => {
    // fs.copyFile 모킹하여 에러 발생
    vi.spyOn(fs, 'copyFile').mockRejectedValueOnce(new Error('ENOSPC: no space left on device'));

    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: 'pass' }
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'BACKUP_FAILED',
      message: expect.stringContaining('ENOSPC')
    });

    // 원본 파일이 변경되지 않았는지 확인
    const content = await readMarkdownFile(getWbsPath('test-project'));
    expect(content).toContain('- test-result: none'); // 원래 값 유지
  });
});

/**
 * TC-I-005: 파일 쓰기 실패 + 롤백 성공 (500)
 * 커버하는 FR: FR-005, NFR: NFR-002, BR: BR-004
 */
describe('PUT /api/projects/:id/wbs/tasks/:taskId/test-result - Write Failed, Rollback Success', () => {
  it('TC-I-005-001: should rollback when file write fails', async () => {
    // writeMarkdownFile 모킹하여 실패
    vi.spyOn(file, 'writeMarkdownFile').mockResolvedValueOnce(false);

    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: 'pass' }
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'FILE_WRITE_ERROR',
      message: expect.stringContaining('백업에서 복원됨')
    });

    // 원본 파일이 백업에서 복원되었는지 확인
    const content = await readMarkdownFile(getWbsPath('test-project'));
    expect(content).toContain('- test-result: none'); // 원래 값 유지

    // 백업 파일 삭제 확인
    const backupExists = await fileExists(`${getWbsPath('test-project')}.bak`);
    expect(backupExists).toBe(false);
  });
});
```

---

## 4. E2E 테스트 명세

### 4.1 워크플로우 통합 테스트

**파일**: `tests/e2e/wbs-test-result-update.test.ts`

```typescript
import { test, expect } from '@playwright/test';

/**
 * TC-E2E-001: /wf:test 명령 실행 후 test-result 자동 업데이트
 * 사전 조건: TSK-03-04 (워크플로우 엔진) 구현 완료
 */
test.describe('Workflow Integration: /wf:test command', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 프로젝트 생성 및 초기화
    await page.goto('/wbs?project=test-project');
  });

  /**
   * TC-E2E-001-001: 테스트 성공 시 test-result = "pass"
   */
  test('TC-E2E-001-001: should set test-result to "pass" on successful test', async ({ page }) => {
    // 1. Task 선택 (TSK-01-01)
    await page.click('[data-task-id="TSK-01-01"]');

    // 2. /wf:test 명령 실행
    await page.click('[data-action="wf-test"]');

    // 3. 테스트 실행 대기
    await page.waitForSelector('[data-test-status="running"]');
    await page.waitForSelector('[data-test-status="completed"]', { timeout: 10000 });

    // 4. test-result 확인
    const testResultBadge = await page.locator('[data-test-result]');
    await expect(testResultBadge).toHaveAttribute('data-test-result', 'pass');

    // 5. wbs.md 파일 확인 (API를 통해)
    const response = await page.request.get(`/api/projects/test-project/wbs/tasks/TSK-01-01`);
    const taskData = await response.json();
    expect(taskData.attributes['test-result']).toBe('pass');
  });

  /**
   * TC-E2E-001-002: 테스트 실패 시 test-result = "fail"
   */
  test('TC-E2E-001-002: should set test-result to "fail" on failed test', async ({ page }) => {
    // 테스트 실패하도록 설정 (모킹 또는 실제 실패 케이스)
    await page.evaluate(() => {
      window.__MOCK_TEST_FAILURE__ = true;
    });

    // 1. Task 선택
    await page.click('[data-task-id="TSK-01-02"]');

    // 2. /wf:test 명령 실행
    await page.click('[data-action="wf-test"]');

    // 3. 테스트 실행 대기
    await page.waitForSelector('[data-test-status="completed"]', { timeout: 10000 });

    // 4. test-result 확인
    const testResultBadge = await page.locator('[data-test-result]');
    await expect(testResultBadge).toHaveAttribute('data-test-result', 'fail');
  });
});
```

### 4.2 UI 통합 테스트

```typescript
/**
 * TC-E2E-002: WBS Tree View에서 test-result 아이콘 표시
 */
test.describe('WBS Tree View: test-result icon display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?project=test-project');
  });

  /**
   * TC-E2E-002-001: test-result="pass" 시 체크 아이콘 표시
   */
  test('TC-E2E-002-001: should display check icon for "pass"', async ({ page }) => {
    // Task의 test-result를 "pass"로 설정
    await page.request.put(`/api/projects/test-project/wbs/tasks/TSK-01-01/test-result`, {
      data: { testResult: 'pass' }
    });

    // 페이지 새로고침
    await page.reload();

    // 체크 아이콘 확인
    const icon = await page.locator('[data-task-id="TSK-01-01"] [data-test-result-icon]');
    await expect(icon).toHaveClass(/check|success/);
    await expect(icon).toBeVisible();
  });

  /**
   * TC-E2E-002-002: test-result="fail" 시 X 아이콘 표시
   */
  test('TC-E2E-002-002: should display X icon for "fail"', async ({ page }) => {
    await page.request.put(`/api/projects/test-project/wbs/tasks/TSK-01-01/test-result`, {
      data: { testResult: 'fail' }
    });

    await page.reload();

    const icon = await page.locator('[data-task-id="TSK-01-01"] [data-test-result-icon]');
    await expect(icon).toHaveClass(/times|error/);
    await expect(icon).toBeVisible();
  });

  /**
   * TC-E2E-002-003: test-result="none" 시 아이콘 없음
   */
  test('TC-E2E-002-003: should not display icon for "none"', async ({ page }) => {
    await page.request.put(`/api/projects/test-project/wbs/tasks/TSK-01-01/test-result`, {
      data: { testResult: 'none' }
    });

    await page.reload();

    const icon = await page.locator('[data-task-id="TSK-01-01"] [data-test-result-icon]');
    await expect(icon).not.toBeVisible();
  });
});
```

---

## 5. 성능 테스트 명세

### 5.1 응답 시간 테스트

**파일**: `tests/performance/test-result.perf.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

/**
 * TC-PERF-001: 소규모 프로젝트 (50 노드) 응답 시간
 * 커버하는 NFR: NFR-001
 */
describe('Performance Test: Small Project (50 nodes)', () => {
  it('TC-PERF-001-001: should respond within 200ms', async () => {
    const start = performance.now();

    await $fetch('/api/projects/small-project/wbs/tasks/TSK-01-01/test-result', {
      method: 'PUT',
      body: { testResult: 'pass' }
    });

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(200); // 200ms 이내
  });
});

/**
 * TC-PERF-002: 중규모 프로젝트 (200 노드) 응답 시간
 */
describe('Performance Test: Medium Project (200 nodes)', () => {
  it('TC-PERF-002-001: should respond within 400ms', async () => {
    const start = performance.now();

    await $fetch('/api/projects/medium-project/wbs/tasks/TSK-01-01/test-result', {
      method: 'PUT',
      body: { testResult: 'pass' }
    });

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(400); // 400ms 이내
  });
});

/**
 * TC-PERF-003: 대규모 프로젝트 (500 노드) 응답 시간
 */
describe('Performance Test: Large Project (500 nodes)', () => {
  it('TC-PERF-003-001: should respond within 800ms', async () => {
    const start = performance.now();

    await $fetch('/api/projects/large-project/wbs/tasks/TSK-01-01/test-result', {
      method: 'PUT',
      body: { testResult: 'pass' }
    });

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(800); // 800ms 이내
  });
});
```

---

## 6. 보안 테스트 명세

### 6.1 경로 순회 공격 테스트

```typescript
/**
 * TC-SEC-001: 경로 순회 공격 방지
 * 커버하는 NFR: NFR-004
 */
describe('Security Test: Path Traversal Attack', () => {
  it('TC-SEC-001-001: should reject path traversal in projectId', async () => {
    await expect(
      $fetch('/api/projects/../../etc/passwd/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: 'pass' }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_PROJECT_ID'
    });
  });

  it('TC-SEC-001-002: should reject URL-encoded path traversal', async () => {
    await expect(
      $fetch('/api/projects/..%2F..%2Fetc%2Fpasswd/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: 'pass' }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_PROJECT_ID'
    });
  });
});

/**
 * TC-SEC-002: 입력 검증 (testResult 값)
 */
describe('Security Test: Input Validation', () => {
  it('TC-SEC-002-001: should reject malicious testResult value', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: 'pass\n- malicious: true' }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_TEST_RESULT'
    });
  });

  it('TC-SEC-002-002: should reject SQL injection attempt', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/TSK-01-01/test-result', {
        method: 'PUT',
        body: { testResult: "'; DROP TABLE tasks; --" }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_TEST_RESULT'
    });
  });
});

/**
 * TC-SEC-003: Task ID 형식 검증
 */
describe('Security Test: Task ID Validation', () => {
  it('TC-SEC-003-001: should reject malicious Task ID', async () => {
    await expect(
      $fetch('/api/projects/test-project/wbs/tasks/../../../etc/passwd/test-result', {
        method: 'PUT',
        body: { testResult: 'pass' }
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'INVALID_TASK_ID'
    });
  });
});
```

---

## 7. 테스트 실행 가이드

### 7.1 단위 테스트 실행

```bash
# 모든 단위 테스트 실행
npm run test:unit

# 특정 파일 테스트
npm run test:unit -- tests/unit/api/projects/wbs/tasks/test-result.test.ts

# 커버리지 포함 실행
npm run test:unit -- --coverage

# watch 모드
npm run test:unit -- --watch
```

### 7.2 통합 테스트 실행

```bash
# 모든 통합 테스트 실행
npm run test:integration

# 특정 API 테스트
npm run test:integration -- tests/api/projects/wbs/tasks/test-result.put.test.ts
```

### 7.3 E2E 테스트 실행

```bash
# Playwright E2E 테스트 실행
npm run test:e2e

# 특정 E2E 테스트
npm run test:e2e -- tests/e2e/wbs-test-result-update.test.ts

# headless 모드
npm run test:e2e -- --headless
```

### 7.4 성능 테스트 실행

```bash
# 성능 테스트 실행
npm run test:performance

# 프로파일링 포함
npm run test:performance -- --reporter=verbose
```

---

## 8. 테스트 커버리지 보고서

### 8.1 커버리지 목표

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 라인 커버리지 | 80% | vitest --coverage |
| 브랜치 커버리지 | 75% | vitest --coverage |
| 함수 커버리지 | 85% | vitest --coverage |

### 8.2 커버리지 확인

```bash
# 커버리지 보고서 생성
npm run test:coverage

# HTML 보고서 열기
open coverage/index.html
```

---

## 9. 참고 자료

- **기본설계**: 010-basic-design.md
- **상세설계**: 020-detail-design.md
- **추적성 매트릭스**: 025-traceability-matrix.md
- **Vitest 문서**: https://vitest.dev/
- **Playwright 문서**: https://playwright.dev/

---

## 10. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-15 | Claude (Opus 4.5) | 초안 작성 |
