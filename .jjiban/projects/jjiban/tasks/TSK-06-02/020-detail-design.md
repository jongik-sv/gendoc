# 상세설계 (020-detail-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기본설계의 방향성을 구체화
> * 구현 가능한 수준의 상세 명세
> * 코드 예시 포함 (의사코드 수준)

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Testing |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (System Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 11 |
| 추적성 매트릭스 | `025-traceability-matrix.md` | 전체 |

---

## 1. 아키텍처 상세 설계

### 1.1 테스트 디렉토리 구조

```
tests/
├── fixtures/                    # 테스트 데이터 (기존)
│   ├── wbs/                    # WBS Markdown 픽스처
│   │   ├── 3level.md          # 3단계 WBS
│   │   ├── 4level.md          # 4단계 WBS
│   │   ├── complex.md         # 복잡한 WBS
│   │   ├── error.md           # 오류 케이스
│   │   └── minimal.md         # 최소 속성
│   ├── settings/              # 설정 픽스처
│   │   ├── valid-categories.json
│   │   ├── valid-columns.json
│   │   ├── valid-workflows.json
│   │   └── valid-actions.json
│   └── mock-data/             # [NEW] TypeScript Mock 데이터
│       ├── wbs-nodes.ts       # WbsNode 타입 Mock
│       ├── wbs-metadata.ts    # WBS 메타데이터
│       └── api-responses.ts   # API 응답 Mock
│
├── helpers/                    # [NEW] 테스트 헬퍼
│   ├── setup.ts               # 공통 setup
│   ├── assertions.ts          # 커스텀 matcher
│   ├── component-helpers.ts   # Vue 컴포넌트 헬퍼
│   └── e2e-helpers.ts         # Playwright 헬퍼
│
├── utils/                     # 단위 테스트 (기존)
│   ├── wbs/
│   │   ├── parser.test.ts         # WBS 파서
│   │   ├── serializer.test.ts     # WBS 시리얼라이저
│   │   ├── wbsService.test.ts     # WBS 서비스
│   │   ├── taskService.test.ts    # Task 서비스
│   │   ├── validator.test.ts      # WBS 검증
│   │   └── integration.test.ts    # 파서+시리얼라이저 통합
│   ├── workflow/
│   │   ├── workflowEngine.test.ts      # 워크플로우 엔진
│   │   ├── transitionService.test.ts   # 상태 전이
│   │   ├── documentService.test.ts     # 문서 서비스
│   │   ├── statusUtils.test.ts         # 상태 유틸
│   │   └── stateMapper.test.ts         # 상태 매퍼
│   └── projects/
│       ├── paths.test.ts              # 경로 유틸
│       └── integration.test.ts        # 프로젝트 통합
│
├── unit/                      # 컴포넌트 단위 테스트
│   ├── components/
│   │   └── wbs/
│   │       ├── WbsTreePanel.spec.ts      # [NEW] 트리 패널
│   │       ├── WbsTreeHeader.spec.ts     # [NEW] 헤더
│   │       ├── WbsSummaryCards.spec.ts   # [NEW] 요약 카드
│   │       └── WbsSearchBox.spec.ts      # [NEW] 검색 박스
│   ├── stores/
│   │   └── wbs.spec.ts        # WBS 스토어 (기존)
│   └── services/
│       ├── projectService.test.ts
│       ├── projectsListService.test.ts
│       └── teamService.test.ts
│
├── api/                       # API 테스트 (기존)
│   └── tasks/
│       ├── documents.test.ts
│       └── transition.test.ts
│
└── e2e/                       # E2E 테스트
    ├── global-setup.ts        # [NEW] E2E 글로벌 설정
    ├── global-teardown.ts     # [NEW] E2E 클린업
    ├── wbs-tree-panel.spec.ts # [NEW] WBS 트리 E2E
    ├── wbs-search.spec.ts     # [NEW] 검색 기능 E2E
    ├── wbs-actions.spec.ts    # [NEW] 트리 액션 E2E
    └── wbs.spec.ts            # [EXISTING] 기존 WBS API E2E
```

### 1.2 테스트 프레임워크 설정

#### Vitest 설정 강화

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()], // Vue 컴포넌트 테스트 지원
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/unit/**/*.spec.ts'],
    exclude: ['tests/e2e/**'],

    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'server/utils/**/*.ts',
        'app/stores/**/*.ts',
        'app/components/**/*.vue'
      ],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/*.d.ts',
        '**/index.ts',
        'nuxt.config.ts',
        'vitest.config.ts'
      ],
      // 커버리지 임계값
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },

    // 타임아웃
    testTimeout: 10000,

    // 병렬 실행
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },

    // Setup 파일
    setupFiles: ['tests/helpers/setup.ts']
  },

  resolve: {
    alias: {
      '~': '/app',
      '@': '/app'
    }
  }
});
```

#### Playwright 설정 강화

```typescript
// playwright.config.ts (강화 버전)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }], // CI용
    ['list']
  ],

  timeout: 60000,
  expect: {
    timeout: 5000
  },

  use: {
    baseURL: 'http://localhost:3333',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',

    // 접근성 테스트 설정
    contextOptions: {
      reducedMotion: 'reduce'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    }
  ],

  webServer: {
    command: 'npm run dev -- --port 3333',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      JJIBAN_BASE_PATH: process.cwd()
    }
  },

  outputDir: 'test-results/artifacts'
});
```

---

## 2. 테스트 헬퍼 상세 설계

### 2.1 공통 Setup (tests/helpers/setup.ts)

```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Pinia Mock Setup
beforeEach(() => {
  // Pinia 초기화는 각 테스트에서 수행
});

// Console 경고 무시 (테스트 노이즈 제거)
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: any[]) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('Extraneous non-props') ||
       msg.includes('Hydration'))
    ) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
```

### 2.2 컴포넌트 테스트 헬퍼 (tests/helpers/component-helpers.ts)

```typescript
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

/**
 * Vue 컴포넌트 마운트 헬퍼
 */
export function mountWithPinia<T>(
  component: any,
  options: any = {}
): VueWrapper<T> {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(component, {
    global: {
      plugins: [
        pinia,
        [PrimeVue, {
          theme: {
            preset: Aura,
            options: {
              darkModeSelector: '.dark-mode'
            }
          }
        }]
      ],
      stubs: options.stubs || {}
    },
    ...options
  });
}

/**
 * data-testid로 요소 찾기
 */
export function findByTestId(
  wrapper: VueWrapper<any>,
  testId: string
) {
  return wrapper.find(`[data-testid="${testId}"]`);
}

/**
 * 비동기 작업 대기 (Vue nextTick + setTimeout)
 */
export async function waitFor(ms: number = 0): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 모든 pending Promise 완료 대기
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}
```

### 2.3 E2E 테스트 헬퍼 (tests/helpers/e2e-helpers.ts)

```typescript
import { Page, expect } from '@playwright/test';

/**
 * 페이지 로드 및 안정화 대기
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * WBS 데이터 로딩 완료 대기
 */
export async function waitForWbsLoaded(page: Page): Promise<void> {
  // 로딩 스피너 사라질 때까지 대기
  await page.waitForSelector('[data-testid="wbs-loading"]', {
    state: 'hidden',
    timeout: 10000
  });

  // 트리 콘텐츠 표시 확인
  await page.waitForSelector('[data-testid="wbs-tree-content"]', {
    state: 'visible'
  });
}

/**
 * API 응답 모킹
 */
export async function mockWbsApi(
  page: Page,
  response: any,
  status: number = 200
): Promise<void> {
  await page.route('**/api/projects/*/wbs', async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * API 오류 모킹
 */
export async function mockWbsApiError(
  page: Page,
  statusCode: number = 500,
  message: string = 'Internal Server Error'
): Promise<void> {
  await page.route('**/api/projects/*/wbs', async route => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: message })
    });
  });
}

/**
 * 접근성 검증 (axe-core)
 */
export async function checkAccessibility(page: Page): Promise<void> {
  // Note: @axe-core/playwright 설치 필요
  // const results = await new AxeBuilder({ page }).analyze();
  // expect(results.violations).toEqual([]);

  // 기본 ARIA 체크
  const landmarks = await page.locator('[role]').count();
  expect(landmarks).toBeGreaterThan(0);
}

/**
 * 키보드 네비게이션 테스트
 */
export async function testKeyboardNavigation(
  page: Page,
  startSelector: string,
  targetSelector: string
): Promise<void> {
  await page.locator(startSelector).focus();
  await page.keyboard.press('Tab');
  const focused = await page.locator(targetSelector).evaluate(
    el => el === document.activeElement
  );
  expect(focused).toBe(true);
}
```

### 2.4 커스텀 Assertion (tests/helpers/assertions.ts)

```typescript
import { expect } from 'vitest';
import type { WbsNode } from '../../../types';

/**
 * WbsNode 구조 검증
 */
export function expectValidWbsNode(node: any): void {
  expect(node).toHaveProperty('id');
  expect(node).toHaveProperty('type');
  expect(node).toHaveProperty('title');
  expect(node).toHaveProperty('children');
  expect(Array.isArray(node.children)).toBe(true);
}

/**
 * 트리 구조 깊이 검증
 */
export function expectTreeDepth(
  nodes: WbsNode[],
  expectedDepth: number
): void {
  let maxDepth = 0;

  function traverse(node: WbsNode, depth: number) {
    maxDepth = Math.max(maxDepth, depth);
    node.children?.forEach(child => traverse(child, depth + 1));
  }

  nodes.forEach(node => traverse(node, 1));
  expect(maxDepth).toBe(expectedDepth);
}

/**
 * 상태 코드 유효성 검증
 */
export function expectValidStatus(status: string): void {
  const validStatuses = [
    '[ ]', '[bd]', '[dd]', '[an]', '[ds]',
    '[im]', '[fx]', '[vf]', '[xx]'
  ];
  expect(validStatuses).toContain(status);
}
```

---

## 3. Mock 데이터 상세 설계

### 3.1 WBS Node Mock (tests/fixtures/mock-data/wbs-nodes.ts)

```typescript
import type { WbsNode } from '../../../types';

/**
 * 최소 WBS 트리 (3단계)
 */
export const minimalWbsTree: WbsNode = {
  id: 'test-project',
  type: 'project',
  title: 'Test Project',
  progress: 0,
  children: [
    {
      id: 'WP-01',
      type: 'wp',
      title: 'Work Package 1',
      status: 'planned',
      priority: 'high',
      progress: 0,
      children: [
        {
          id: 'TSK-01-01',
          type: 'task',
          title: 'Task 1',
          status: '[bd]',
          category: 'development',
          priority: 'critical',
          progress: 25,
          children: []
        }
      ]
    }
  ]
};

/**
 * 복잡한 WBS 트리 (4단계, 다양한 상태)
 */
export const complexWbsTree: WbsNode = {
  id: 'complex-project',
  type: 'project',
  title: 'Complex Project',
  progress: 0,
  children: [
    {
      id: 'WP-01',
      type: 'wp',
      title: 'Infrastructure',
      status: 'planned',
      priority: 'high',
      progress: 0,
      children: [
        {
          id: 'ACT-01-01',
          type: 'act',
          title: 'Environment Setup',
          status: 'in_progress',
          progress: 0,
          children: [
            {
              id: 'TSK-01-01-01',
              type: 'task',
              title: 'Node.js Setup',
              status: '[xx]',
              category: 'infrastructure',
              priority: 'critical',
              progress: 100,
              children: []
            },
            {
              id: 'TSK-01-01-02',
              type: 'task',
              title: 'Database Setup',
              status: '[im]',
              category: 'infrastructure',
              priority: 'high',
              progress: 50,
              children: []
            }
          ]
        }
      ]
    },
    {
      id: 'WP-02',
      type: 'wp',
      title: 'Features',
      status: 'planned',
      priority: 'medium',
      progress: 0,
      children: [
        {
          id: 'TSK-02-01',
          type: 'task',
          title: 'Auth System',
          status: '[bd]',
          category: 'development',
          priority: 'high',
          progress: 25,
          children: []
        },
        {
          id: 'TSK-02-02',
          type: 'task',
          title: 'Fix Login Bug',
          status: '[an]',
          category: 'defect',
          priority: 'critical',
          progress: 0,
          children: []
        }
      ]
    }
  ]
};

/**
 * 빈 WBS 트리
 */
export const emptyWbsTree: WbsNode = {
  id: 'empty-project',
  type: 'project',
  title: 'Empty Project',
  progress: 0,
  children: []
};

/**
 * 검색 테스트용 WBS 트리
 */
export const searchTestTree: WbsNode = {
  id: 'search-test',
  type: 'project',
  title: 'Search Test Project',
  progress: 0,
  children: [
    {
      id: 'WP-01',
      type: 'wp',
      title: 'Backend Development',
      status: 'planned',
      priority: 'high',
      progress: 0,
      children: [
        {
          id: 'TSK-01-01',
          type: 'task',
          title: 'API Design',
          status: '[bd]',
          category: 'development',
          priority: 'high',
          progress: 25,
          children: []
        },
        {
          id: 'TSK-01-02',
          type: 'task',
          title: 'Database Schema',
          status: '[dd]',
          category: 'development',
          priority: 'medium',
          progress: 50,
          children: []
        }
      ]
    },
    {
      id: 'WP-02',
      type: 'wp',
      title: 'Frontend Development',
      status: 'planned',
      priority: 'medium',
      progress: 0,
      children: [
        {
          id: 'TSK-02-01',
          type: 'task',
          title: 'UI Components',
          status: '[ ]',
          category: 'development',
          priority: 'low',
          progress: 0,
          children: []
        }
      ]
    }
  ]
};
```

### 3.2 API Response Mock (tests/fixtures/mock-data/api-responses.ts)

```typescript
import type { WbsNode } from '../../../types';
import { complexWbsTree } from './wbs-nodes';

/**
 * GET /api/projects/:id/wbs 성공 응답
 */
export const wbsApiSuccessResponse = {
  metadata: {
    version: '1.0',
    depth: 4,
    updated: '2025-12-15',
    start: '2025-12-01'
  },
  tree: [complexWbsTree]
};

/**
 * PUT /api/projects/:id/wbs 성공 응답
 */
export const wbsSaveSuccessResponse = {
  success: true,
  message: 'WBS saved successfully'
};

/**
 * API 오류 응답 (404)
 */
export const wbsNotFoundResponse = {
  error: 'Project not found',
  statusCode: 404
};

/**
 * API 오류 응답 (500)
 */
export const wbsServerErrorResponse = {
  error: 'Internal server error',
  statusCode: 500
};
```

---

## 4. 단위 테스트 상세 설계

### 4.1 WBS 파서 테스트 (기존 강화)

**파일**: `tests/utils/wbs/parser.test.ts`

**추가 테스트 케이스**:

```typescript
describe('parseWbsMarkdown - Edge Cases', () => {
  it('TC-050: 빈 Markdown 입력 시 빈 트리 반환', () => {
    // Given: 빈 문자열
    const input = '';

    // When: 파싱
    const result = parseWbsMarkdown(input, 'test-project');

    // Then: 빈 children 배열
    expect(result.children).toEqual([]);
  });

  it('TC-051: 메타데이터만 있는 Markdown', () => {
    // Given: 메타데이터만
    const input = `# WBS
> version: 1.0
> depth: 4
---`;

    // When: 파싱
    const result = parseWbsMarkdown(input, 'test-project');

    // Then: 메타데이터 파싱, children 빈 배열
    expect(result.children).toEqual([]);
  });

  it('TC-052: 1000+ 노드 성능 테스트', () => {
    // Given: 대량 노드 Markdown
    const largeMarkdown = generateLargeWbs(1000);

    // When: 파싱 시작
    const start = Date.now();
    const result = parseWbsMarkdown(largeMarkdown, 'large-project');
    const duration = Date.now() - start;

    // Then: 2초 이내 완료
    expect(duration).toBeLessThan(2000);
    expect(result.children.length).toBeGreaterThan(0);
  });
});
```

### 4.2 워크플로우 엔진 테스트 (기존 강화)

**파일**: `tests/utils/workflow/workflowEngine.test.ts`

**추가 테스트 케이스**:

```typescript
describe('Workflow Engine - Category-specific transitions', () => {
  it('TC-100: development 카테고리 전체 플로우', async () => {
    // Given: development Task
    const task = {
      id: 'TSK-01',
      status: '[ ]',
      category: 'development'
    };

    // When/Then: Todo → Design
    let result = await executeCommand(task, 'start');
    expect(result.status).toBe('[bd]');

    // Design → Detail
    result = await executeCommand(result, 'draft');
    expect(result.status).toBe('[dd]');

    // Detail → Implement
    result = await executeCommand(result, 'build');
    expect(result.status).toBe('[im]');

    // Implement → Verify
    result = await executeCommand(result, 'verify');
    expect(result.status).toBe('[vf]');

    // Verify → Done
    result = await executeCommand(result, 'done');
    expect(result.status).toBe('[xx]');
  });

  it('TC-101: defect 카테고리 단축 플로우', async () => {
    // Given: defect Task
    const task = {
      id: 'TSK-02',
      status: '[ ]',
      category: 'defect'
    };

    // When/Then: Todo → Analyze
    let result = await executeCommand(task, 'start');
    expect(result.status).toBe('[an]');

    // Analyze → Fix (build)
    result = await executeCommand(result, 'build');
    expect(result.status).toBe('[fx]');

    // Fix → Verify
    result = await executeCommand(result, 'verify');
    expect(result.status).toBe('[vf]');

    // Verify → Done
    result = await executeCommand(result, 'done');
    expect(result.status).toBe('[xx]');
  });

  it('TC-102: infrastructure 카테고리 디자인 스킵', async () => {
    // Given: infrastructure Task
    const task = {
      id: 'TSK-03',
      status: '[ ]',
      category: 'infrastructure'
    };

    // When/Then: Todo → Implement (skip design)
    let result = await executeCommand(task, 'skip');
    expect(result.status).toBe('[im]');

    // Implement → Done (no verify)
    result = await executeCommand(result, 'done');
    expect(result.status).toBe('[xx]');
  });

  it('TC-103: 잘못된 전이 시도 시 에러', async () => {
    // Given: Detail 상태 Task
    const task = {
      id: 'TSK-04',
      status: '[dd]',
      category: 'development'
    };

    // When/Then: Detail → Verify (불가능)
    await expect(
      executeCommand(task, 'verify')
    ).rejects.toThrow('Invalid transition');
  });
});
```

---

## 5. 컴포넌트 테스트 상세 설계

### 5.1 WbsTreePanel 컴포넌트 테스트

**파일**: `tests/unit/components/wbs/WbsTreePanel.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountWithPinia, findByTestId, flushPromises } from '../../../helpers/component-helpers';
import WbsTreePanel from '../../../../app/components/wbs/WbsTreePanel.vue';
import { useWbsStore } from '../../../../app/stores/wbs';
import { complexWbsTree } from '../../../fixtures/mock-data/wbs-nodes';

describe('WbsTreePanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('TC-200: 초기 마운트 시 fetchWbs 호출', async () => {
      // Given: Mock store
      const wrapper = mountWithPinia(WbsTreePanel, {
        props: { projectId: 'test-project' }
      });
      const store = useWbsStore();
      const fetchSpy = vi.spyOn(store, 'fetchWbs');

      // When: 컴포넌트 마운트
      await flushPromises();

      // Then: fetchWbs 호출됨
      expect(fetchSpy).toHaveBeenCalledWith('test-project');
    });

    it('TC-201: 로딩 상태 표시', async () => {
      // Given: 로딩 중 store
      const wrapper = mountWithPinia(WbsTreePanel, {
        props: { projectId: 'test-project' }
      });
      const store = useWbsStore();
      store.loading = true;

      await wrapper.vm.$nextTick();

      // Then: 로딩 스피너 표시
      const loadingEl = findByTestId(wrapper, 'wbs-loading');
      expect(loadingEl.exists()).toBe(true);
    });

    it('TC-202: 에러 상태 표시', async () => {
      // Given: 에러 상태 store
      const wrapper = mountWithPinia(WbsTreePanel, {
        props: { projectId: 'test-project' }
      });
      const store = useWbsStore();
      store.error = 'Failed to load WBS';

      await wrapper.vm.$nextTick();

      // Then: 에러 메시지 표시
      const errorEl = findByTestId(wrapper, 'wbs-error');
      expect(errorEl.exists()).toBe(true);
      expect(errorEl.text()).toContain('Failed to load WBS');
    });

    it('TC-203: 빈 데이터 상태 표시', async () => {
      // Given: 빈 트리 store
      const wrapper = mountWithPinia(WbsTreePanel, {
        props: { projectId: 'test-project' }
      });
      const store = useWbsStore();
      store.tree = [];
      store.loading = false;

      await wrapper.vm.$nextTick();

      // Then: 빈 상태 메시지 표시
      const emptyEl = findByTestId(wrapper, 'wbs-empty');
      expect(emptyEl.exists()).toBe(true);
    });

    it('TC-204: 정상 데이터 렌더링', async () => {
      // Given: 데이터 있는 store
      const wrapper = mountWithPinia(WbsTreePanel, {
        props: { projectId: 'test-project' }
      });
      const store = useWbsStore();
      store.tree = [complexWbsTree];
      store.loading = false;

      await wrapper.vm.$nextTick();

      // Then: 헤더와 트리 콘텐츠 표시
      expect(findByTestId(wrapper, 'wbs-tree-header').exists()).toBe(true);
      expect(findByTestId(wrapper, 'wbs-tree-content').exists()).toBe(true);
    });
  });

  describe('컴포넌트 통합', () => {
    it('TC-205: WbsTreeHeader 포함', async () => {
      // Given: 마운트
      const wrapper = mountWithPinia(WbsTreePanel, {
        props: { projectId: 'test-project' }
      });

      // Then: 헤더 컴포넌트 존재
      expect(wrapper.findComponent({ name: 'WbsTreeHeader' }).exists()).toBe(true);
    });

    it('TC-206: WbsSummaryCards 포함', async () => {
      // Given: 마운트
      const wrapper = mountWithPinia(WbsTreePanel, {
        props: { projectId: 'test-project' }
      });

      // Then: 요약 카드 컴포넌트 존재
      expect(wrapper.findComponent({ name: 'WbsSummaryCards' }).exists()).toBe(true);
    });
  });
});
```

### 5.2 WbsSearchBox 컴포넌트 테스트

**파일**: `tests/unit/components/wbs/WbsSearchBox.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountWithPinia, findByTestId, waitFor } from '../../../helpers/component-helpers';
import WbsSearchBox from '../../../../app/components/wbs/WbsSearchBox.vue';
import { useWbsStore } from '../../../../app/stores/wbs';

describe('WbsSearchBox Component', () => {
  describe('검색 기능', () => {
    it('TC-210: 검색어 입력 시 debounce 적용', async () => {
      // Given: 컴포넌트 마운트
      const wrapper = mountWithPinia(WbsSearchBox);
      const store = useWbsStore();
      const setSearchSpy = vi.spyOn(store, 'setSearchQuery');

      const input = findByTestId(wrapper, 'search-input');

      // When: 빠르게 타이핑
      await input.setValue('T');
      await input.setValue('TS');
      await input.setValue('TSK');

      // Then: 즉시 호출되지 않음
      expect(setSearchSpy).not.toHaveBeenCalled();

      // Wait: debounce 시간 (300ms)
      await waitFor(350);

      // Then: 한 번만 호출
      expect(setSearchSpy).toHaveBeenCalledTimes(1);
      expect(setSearchSpy).toHaveBeenCalledWith('TSK');
    });

    it('TC-211: X 버튼 클릭 시 검색어 초기화', async () => {
      // Given: 검색어 입력된 상태
      const wrapper = mountWithPinia(WbsSearchBox);
      const store = useWbsStore();

      const input = findByTestId(wrapper, 'search-input');
      await input.setValue('test query');
      await waitFor(350);

      // When: X 버튼 클릭
      const clearBtn = findByTestId(wrapper, 'search-clear');
      await clearBtn.trigger('click');

      // Then: 검색어 초기화
      expect(store.searchQuery).toBe('');
      expect((input.element as HTMLInputElement).value).toBe('');
    });

    it('TC-212: X 버튼은 검색어 있을 때만 표시', async () => {
      // Given: 빈 검색어
      const wrapper = mountWithPinia(WbsSearchBox);

      // Then: X 버튼 숨김
      let clearBtn = wrapper.find('[data-testid="search-clear"]');
      expect(clearBtn.exists()).toBe(false);

      // When: 검색어 입력
      const input = findByTestId(wrapper, 'search-input');
      await input.setValue('test');
      await wrapper.vm.$nextTick();

      // Then: X 버튼 표시
      clearBtn = findByTestId(wrapper, 'search-clear');
      expect(clearBtn.exists()).toBe(true);
    });
  });

  describe('포커스 관리', () => {
    it('TC-213: 마운트 시 자동 포커스 (선택적)', async () => {
      // Given: autofocus prop
      const wrapper = mountWithPinia(WbsSearchBox, {
        props: { autofocus: true }
      });

      await wrapper.vm.$nextTick();

      // Then: input에 포커스
      const input = findByTestId(wrapper, 'search-input');
      expect(document.activeElement).toBe(input.element);
    });
  });
});
```

### 5.3 WbsSummaryCards 컴포넌트 테스트

**파일**: `tests/unit/components/wbs/WbsSummaryCards.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mountWithPinia, findByTestId } from '../../../helpers/component-helpers';
import WbsSummaryCards from '../../../../app/components/wbs/WbsSummaryCards.vue';
import { useWbsStore } from '../../../../app/stores/wbs';
import { complexWbsTree } from '../../../fixtures/mock-data/wbs-nodes';

describe('WbsSummaryCards Component', () => {
  describe('통계 표시', () => {
    it('TC-220: 4개 카드 렌더링', async () => {
      // Given: 마운트
      const wrapper = mountWithPinia(WbsSummaryCards);

      // Then: 4개 카드 존재 (WP, ACT, TSK, Progress)
      const cards = wrapper.findAll('[data-testid^="summary-card-"]');
      expect(cards.length).toBe(4);
    });

    it('TC-221: WP 개수 정확히 표시', async () => {
      // Given: store에 데이터
      const wrapper = mountWithPinia(WbsSummaryCards);
      const store = useWbsStore();
      store.tree = [complexWbsTree];

      await wrapper.vm.$nextTick();

      // Then: wpCount 표시
      const wpCard = findByTestId(wrapper, 'summary-card-wp');
      expect(wpCard.text()).toContain('2'); // complexWbsTree has 2 WPs
    });

    it('TC-222: ACT 개수 정확히 표시', async () => {
      // Given: store에 데이터
      const wrapper = mountWithPinia(WbsSummaryCards);
      const store = useWbsStore();
      store.tree = [complexWbsTree];

      await wrapper.vm.$nextTick();

      // Then: actCount 표시
      const actCard = findByTestId(wrapper, 'summary-card-act');
      expect(actCard.text()).toContain('1'); // complexWbsTree has 1 ACT
    });

    it('TC-223: TSK 개수 정확히 표시', async () => {
      // Given: store에 데이터
      const wrapper = mountWithPinia(WbsSummaryCards);
      const store = useWbsStore();
      store.tree = [complexWbsTree];

      await wrapper.vm.$nextTick();

      // Then: tskCount 표시
      const tskCard = findByTestId(wrapper, 'summary-card-tsk');
      expect(tskCard.text()).toContain('4'); // complexWbsTree has 4 TSKs
    });

    it('TC-224: overallProgress 표시', async () => {
      // Given: store에 데이터
      const wrapper = mountWithPinia(WbsSummaryCards);
      const store = useWbsStore();
      store.tree = [complexWbsTree];

      await wrapper.vm.$nextTick();

      // Then: 진행률 표시
      const progressCard = findByTestId(wrapper, 'summary-card-progress');
      expect(progressCard.text()).toMatch(/\d+%/); // 숫자%
    });
  });

  describe('빈 데이터 처리', () => {
    it('TC-225: 빈 트리 시 모든 값 0', async () => {
      // Given: 빈 store
      const wrapper = mountWithPinia(WbsSummaryCards);
      const store = useWbsStore();
      store.tree = [];

      await wrapper.vm.$nextTick();

      // Then: 모든 카드 0
      expect(findByTestId(wrapper, 'summary-card-wp').text()).toContain('0');
      expect(findByTestId(wrapper, 'summary-card-act').text()).toContain('0');
      expect(findByTestId(wrapper, 'summary-card-tsk').text()).toContain('0');
      expect(findByTestId(wrapper, 'summary-card-progress').text()).toContain('0%');
    });
  });
});
```

### 5.4 WbsTreeHeader 컴포넌트 테스트

**파일**: `tests/unit/components/wbs/WbsTreeHeader.spec.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mountWithPinia, findByTestId } from '../../../helpers/component-helpers';
import WbsTreeHeader from '../../../../app/components/wbs/WbsTreeHeader.vue';
import { useWbsStore } from '../../../../app/stores/wbs';

describe('WbsTreeHeader Component', () => {
  describe('렌더링', () => {
    it('TC-230: 타이틀 표시', () => {
      // Given: props
      const wrapper = mountWithPinia(WbsTreeHeader, {
        props: { title: 'Test WBS' }
      });

      // Then: 타이틀 렌더링
      expect(wrapper.text()).toContain('Test WBS');
    });

    it('TC-231: 아이콘 표시', () => {
      // Given: 마운트
      const wrapper = mountWithPinia(WbsTreeHeader);

      // Then: 아이콘 존재
      const icon = wrapper.find('.pi-sitemap');
      expect(icon.exists()).toBe(true);
    });
  });

  describe('펼치기/접기 기능', () => {
    it('TC-232: 전체 펼치기 버튼 클릭', async () => {
      // Given: 마운트
      const wrapper = mountWithPinia(WbsTreeHeader);
      const store = useWbsStore();
      const expandSpy = vi.spyOn(store, 'expandAll');

      // When: 펼치기 버튼 클릭
      const expandBtn = findByTestId(wrapper, 'expand-all-btn');
      await expandBtn.trigger('click');

      // Then: expandAll 호출
      expect(expandSpy).toHaveBeenCalled();
    });

    it('TC-233: 전체 접기 버튼 클릭', async () => {
      // Given: 마운트
      const wrapper = mountWithPinia(WbsTreeHeader);
      const store = useWbsStore();
      const collapseSpy = vi.spyOn(store, 'collapseAll');

      // When: 접기 버튼 클릭
      const collapseBtn = findByTestId(wrapper, 'collapse-all-btn');
      await collapseBtn.trigger('click');

      // Then: collapseAll 호출
      expect(collapseSpy).toHaveBeenCalled();
    });
  });

  describe('검색 박스 통합', () => {
    it('TC-234: WbsSearchBox 포함', () => {
      // Given: 마운트
      const wrapper = mountWithPinia(WbsTreeHeader);

      // Then: 검색 박스 존재
      expect(wrapper.findComponent({ name: 'WbsSearchBox' }).exists()).toBe(true);
    });
  });
});
```

---

## 6. E2E 테스트 상세 설계

### 6.1 Global Setup/Teardown

**파일**: `tests/e2e/global-setup.ts`

```typescript
import { chromium, FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🔧 E2E Global Setup...');

  // 1. 테스트 데이터 디렉토리 준비
  const testDataPath = join(process.cwd(), '.jjiban');
  await fs.mkdir(join(testDataPath, 'settings'), { recursive: true });
  await fs.mkdir(join(testDataPath, 'projects', 'test-project'), {
    recursive: true
  });

  // 2. 설정 파일 생성
  const projectsJson = {
    version: '1.0',
    projects: [
      {
        id: 'test-project',
        name: 'E2E Test Project',
        path: 'test-project',
        status: 'active',
        wbsDepth: 4,
        createdAt: new Date().toISOString()
      }
    ],
    defaultProject: 'test-project'
  };

  await fs.writeFile(
    join(testDataPath, 'settings', 'projects.json'),
    JSON.stringify(projectsJson, null, 2),
    'utf-8'
  );

  // 3. WBS 파일 생성
  const wbsContent = `# WBS - E2E Test Project

> version: 1.0
> depth: 4
> updated: 2025-12-15
> start: 2025-12-01

---

## WP-01: Test Work Package
- status: planned
- priority: high

### ACT-01-01: Test Activity
- status: in_progress

#### TSK-01-01-01: Test Task 1
- category: development
- status: [bd]
- priority: critical

#### TSK-01-01-02: Test Task 2
- category: defect
- status: [an]
- priority: high

## WP-02: Search Test WP
- status: planned
- priority: medium

### TSK-02-01: Searchable Task
- category: infrastructure
- status: [im]
- priority: medium
`;

  await fs.writeFile(
    join(testDataPath, 'projects', 'test-project', 'wbs.md'),
    wbsContent,
    'utf-8'
  );

  console.log('✅ E2E Global Setup Complete');
}

export default globalSetup;
```

**파일**: `tests/e2e/global-teardown.ts`

```typescript
import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import { join } from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2E Global Teardown...');

  // 테스트 데이터 정리 (선택적 - 디버깅 시 유지)
  if (process.env.KEEP_TEST_DATA !== 'true') {
    const testDataPath = join(process.cwd(), '.jjiban');
    await fs.rm(testDataPath, { recursive: true, force: true });
  }

  console.log('✅ E2E Global Teardown Complete');
}

export default globalTeardown;
```

### 6.2 WBS 트리 패널 E2E

**파일**: `tests/e2e/wbs-tree-panel.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';
import { waitForPageReady, waitForWbsLoaded } from '../helpers/e2e-helpers';

test.describe('WBS Tree Panel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?project=test-project');
    await waitForPageReady(page);
  });

  test('E2E-001: 페이지 로드 → WBS 데이터 표시', async ({ page }) => {
    // When: 페이지 로드
    await waitForWbsLoaded(page);

    // Then: WBS 트리 표시
    const treeContent = page.locator('[data-testid="wbs-tree-content"]');
    await expect(treeContent).toBeVisible();

    // WP 노드 존재 확인
    const wpNode = page.locator('text=WP-01: Test Work Package');
    await expect(wpNode).toBeVisible();
  });

  test('E2E-002: 헤더 요소 전체 확인', async ({ page }) => {
    // When: 페이지 로드
    await waitForWbsLoaded(page);

    // Then: 타이틀, 아이콘, 버튼 존재
    await expect(page.locator('[data-testid="wbs-tree-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="expand-all-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="collapse-all-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });

  test('E2E-003: 통계 카드 값 정확성', async ({ page }) => {
    // When: 페이지 로드
    await waitForWbsLoaded(page);

    // Then: 카드 값 검증
    const wpCard = page.locator('[data-testid="summary-card-wp"]');
    await expect(wpCard).toContainText('2'); // 2 WPs

    const actCard = page.locator('[data-testid="summary-card-act"]');
    await expect(actCard).toContainText('1'); // 1 ACT

    const tskCard = page.locator('[data-testid="summary-card-tsk"]');
    await expect(tskCard).toContainText('3'); // 3 TSKs

    const progressCard = page.locator('[data-testid="summary-card-progress"]');
    await expect(progressCard).toContainText(/%/); // 진행률
  });

  test('E2E-004: 로딩 스피너 → 콘텐츠 전환', async ({ page }) => {
    // Given: 페이지 이동
    await page.goto('/wbs?project=test-project');

    // Then: 초기 로딩 표시
    const loading = page.locator('[data-testid="wbs-loading"]');
    await expect(loading).toBeVisible();

    // When: 로딩 완료
    await waitForWbsLoaded(page);

    // Then: 로딩 숨김, 콘텐츠 표시
    await expect(loading).toBeHidden();
    const content = page.locator('[data-testid="wbs-tree-content"]');
    await expect(content).toBeVisible();
  });
});
```

### 6.3 검색 기능 E2E

**파일**: `tests/e2e/wbs-search.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady, waitForWbsLoaded } from '../helpers/e2e-helpers';

test.describe('WBS Search E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?project=test-project');
    await waitForPageReady(page);
    await waitForWbsLoaded(page);
  });

  test('E2E-010: 검색어 입력 → 필터링 결과', async ({ page }) => {
    // Given: 검색 박스
    const searchInput = page.locator('[data-testid="search-input"]');

    // When: 검색어 입력
    await searchInput.fill('TSK-01');

    // Wait: debounce (350ms)
    await page.waitForTimeout(400);

    // Then: 필터링된 결과
    const taskNode = page.locator('text=TSK-01-01-01');
    await expect(taskNode).toBeVisible();

    // WP-02는 숨김
    const wp02 = page.locator('text=WP-02');
    await expect(wp02).toBeHidden();
  });

  test('E2E-011: X 버튼 → 초기화', async ({ page }) => {
    // Given: 검색어 입력
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Search');
    await page.waitForTimeout(400);

    // When: X 버튼 클릭
    const clearBtn = page.locator('[data-testid="search-clear"]');
    await clearBtn.click();

    // Then: 검색어 초기화, 전체 트리 표시
    await expect(searchInput).toHaveValue('');
    const wp01 = page.locator('text=WP-01');
    const wp02 = page.locator('text=WP-02');
    await expect(wp01).toBeVisible();
    await expect(wp02).toBeVisible();
  });

  test('E2E-012: 대소문자 무시 검색', async ({ page }) => {
    // Given: 검색 박스
    const searchInput = page.locator('[data-testid="search-input"]');

    // When: 소문자 검색어
    await searchInput.fill('test task');
    await page.waitForTimeout(400);

    // Then: 'Test Task' 매칭
    const taskNode = page.locator('text=Test Task 1');
    await expect(taskNode).toBeVisible();
  });
});
```

### 6.4 트리 액션 E2E

**파일**: `tests/e2e/wbs-actions.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady, waitForWbsLoaded } from '../helpers/e2e-helpers';

test.describe('WBS Tree Actions E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?project=test-project');
    await waitForPageReady(page);
    await waitForWbsLoaded(page);
  });

  test('E2E-020: 전체 펼치기', async ({ page }) => {
    // Given: 일부 접힌 상태
    await page.locator('[data-testid="collapse-all-btn"]').click();
    await page.waitForTimeout(200);

    // When: 전체 펼치기
    await page.locator('[data-testid="expand-all-btn"]').click();
    await page.waitForTimeout(200);

    // Then: 모든 노드 표시
    await expect(page.locator('text=ACT-01-01')).toBeVisible();
    await expect(page.locator('text=TSK-01-01-01')).toBeVisible();
    await expect(page.locator('text=TSK-01-01-02')).toBeVisible();
  });

  test('E2E-021: 전체 접기', async ({ page }) => {
    // Given: 펼쳐진 상태
    await page.locator('[data-testid="expand-all-btn"]').click();
    await page.waitForTimeout(200);

    // When: 전체 접기
    await page.locator('[data-testid="collapse-all-btn"]').click();
    await page.waitForTimeout(200);

    // Then: WP만 표시, 하위 숨김
    await expect(page.locator('text=WP-01')).toBeVisible();
    await expect(page.locator('text=ACT-01-01')).toBeHidden();
  });

  test('E2E-022: 개별 노드 펼치기/접기', async ({ page }) => {
    // Given: 접힌 상태
    await page.locator('[data-testid="collapse-all-btn"]').click();
    await page.waitForTimeout(200);

    // When: WP-01 펼치기
    const wp01Toggle = page.locator('[data-node-id="WP-01"] [data-testid="toggle-btn"]');
    await wp01Toggle.click();
    await page.waitForTimeout(200);

    // Then: ACT-01-01 표시
    await expect(page.locator('text=ACT-01-01')).toBeVisible();

    // TSK는 아직 숨김 (ACT 접혀있음)
    await expect(page.locator('text=TSK-01-01-01')).toBeHidden();

    // When: ACT-01-01 펼치기
    const actToggle = page.locator('[data-node-id="ACT-01-01"] [data-testid="toggle-btn"]');
    await actToggle.click();
    await page.waitForTimeout(200);

    // Then: TSK 표시
    await expect(page.locator('text=TSK-01-01-01')).toBeVisible();
  });
});
```

### 6.5 에러 핸들링 E2E

**파일**: `tests/e2e/wbs-error-handling.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockWbsApiError } from '../helpers/e2e-helpers';

test.describe('WBS Error Handling E2E', () => {
  test('E2E-030: API 오류 → 에러 메시지 표시', async ({ page }) => {
    // Given: API 오류 모킹
    await mockWbsApiError(page, 500, 'Internal Server Error');

    // When: 페이지 로드
    await page.goto('/wbs?project=test-project');

    // Then: 에러 메시지 표시
    const errorEl = page.locator('[data-testid="wbs-error"]');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('Internal Server Error');
  });

  test('E2E-031: 404 오류 → 프로젝트 없음 메시지', async ({ page }) => {
    // Given: 404 모킹
    await mockWbsApiError(page, 404, 'Project not found');

    // When: 페이지 로드
    await page.goto('/wbs?project=non-existent');

    // Then: Not Found 메시지
    const errorEl = page.locator('[data-testid="wbs-error"]');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('Project not found');
  });

  test('E2E-032: 네트워크 오류 재시도', async ({ page }) => {
    let callCount = 0;

    // Given: 첫 호출 실패, 두 번째 성공
    await page.route('**/api/projects/*/wbs', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // When: 페이지 로드
    await page.goto('/wbs?project=test-project');

    // Then: 재시도 후 성공 (재시도 버튼 클릭)
    const retryBtn = page.locator('[data-testid="retry-btn"]');
    await retryBtn.click();

    // 성공적으로 로드
    const content = page.locator('[data-testid="wbs-tree-content"]');
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
```

### 6.6 접근성 E2E

**파일**: `tests/e2e/wbs-accessibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady, waitForWbsLoaded, checkAccessibility, testKeyboardNavigation } from '../helpers/e2e-helpers';

test.describe('WBS Accessibility E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs?project=test-project');
    await waitForPageReady(page);
    await waitForWbsLoaded(page);
  });

  test('E2E-040: ARIA 속성 검증', async ({ page }) => {
    // Then: 주요 랜드마크 존재
    await checkAccessibility(page);

    // 검색 박스 ARIA
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label');

    // 버튼 ARIA
    const expandBtn = page.locator('[data-testid="expand-all-btn"]');
    await expect(expandBtn).toHaveAttribute('aria-label');
  });

  test('E2E-041: 키보드 네비게이션', async ({ page }) => {
    // Given: 검색 박스에 포커스
    await page.locator('[data-testid="search-input"]').focus();

    // When: Tab 키 이동
    await testKeyboardNavigation(
      page,
      '[data-testid="search-input"]',
      '[data-testid="expand-all-btn"]'
    );

    // Then: 다음 버튼으로 포커스 이동
    const expandBtn = page.locator('[data-testid="expand-all-btn"]');
    await expect(expandBtn).toBeFocused();
  });

  test('E2E-042: Enter 키로 버튼 활성화', async ({ page }) => {
    // Given: 펼치기 버튼에 포커스
    await page.locator('[data-testid="expand-all-btn"]').focus();

    // When: Enter 키 입력
    await page.keyboard.press('Enter');

    // Then: expandAll 실행 (모든 노드 표시)
    await expect(page.locator('text=TSK-01-01-01')).toBeVisible();
  });

  test('E2E-043: 스크린 리더 텍스트', async ({ page }) => {
    // Then: 숨겨진 스크린 리더용 텍스트 존재
    const srText = page.locator('.sr-only, [aria-label]');
    const count = await srText.count();
    expect(count).toBeGreaterThan(0);
  });
});
```

---

## 7. CI/CD 통합 설계

### 7.1 GitHub Actions 워크플로우

**파일**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    name: Unit & Component Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests

      - name: Archive coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-reports
          path: coverage/

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: test-results/

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: test-results/artifacts/

  test-summary:
    name: Test Summary
    needs: [unit-tests, e2e-tests]
    runs-on: ubuntu-latest
    if: always()

    steps:
      - name: Check test results
        run: |
          echo "Unit tests: ${{ needs.unit-tests.result }}"
          echo "E2E tests: ${{ needs.e2e-tests.result }}"
```

### 7.2 Pre-commit Hook

**파일**: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Type check
npm run typecheck

# Run unit tests (빠른 피드백)
npm run test -- --run --reporter=dot

# E2E는 CI에서만 실행 (로컬에서는 스킵)
```

---

## 8. 성능 최적화 전략

### 8.1 테스트 실행 최적화

**병렬 실행**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4
      }
    }
  }
});
```

**선택적 실행**:
```json
// package.json
{
  "scripts": {
    "test:unit": "vitest run tests/utils tests/unit",
    "test:integration": "vitest run tests/api",
    "test:e2e": "playwright test",
    "test:quick": "vitest run --changed"
  }
}
```

### 8.2 Mock 데이터 캐싱

```typescript
// tests/helpers/cache.ts
const fixtureCache = new Map<string, any>();

export function loadCachedFixture(name: string): any {
  if (!fixtureCache.has(name)) {
    const data = loadFixture(name);
    fixtureCache.set(name, data);
  }
  return fixtureCache.get(name);
}
```

---

## 9. 인수 기준 (상세)

- [ ] **AC-01**: 단위 테스트 40개 이상 작성 및 통과
  - WBS 파서: 20개
  - 워크플로우 엔진: 15개
  - 스토어: 10개
  - 유틸리티: 5개

- [ ] **AC-02**: 컴포넌트 테스트 15개 이상 작성 및 통과
  - WbsTreePanel: 6개
  - WbsSearchBox: 3개
  - WbsSummaryCards: 5개
  - WbsTreeHeader: 4개

- [ ] **AC-03**: E2E 테스트 12개 이상 작성 및 통과
  - 기본 플로우: 4개
  - 검색 기능: 3개
  - 트리 액션: 3개
  - 에러 핸들링: 3개
  - 접근성: 4개

- [ ] **AC-04**: 코드 커버리지 >= 80%
  - `npm run test:coverage` 실행 결과 확인
  - HTML 리포트 생성 및 검토

- [ ] **AC-05**: 브랜치 커버리지 >= 75%
  - 모든 if/else, switch 분기 커버

- [ ] **AC-06**: 단위 테스트 실행 시간 < 10초
  - CI 환경에서 측정

- [ ] **AC-07**: E2E 테스트 실행 시간 < 2분
  - Playwright 리포트 확인

- [ ] **AC-08**: 접근성 검증
  - axe-core 위반 0건 (향후 통합)
  - ARIA 속성 올바르게 설정

- [ ] **AC-09**: Flaky 테스트 0개
  - 각 테스트 10회 연속 실행 시 100% 통과

- [ ] **AC-10**: CI/CD 파이프라인 통합
  - GitHub Actions 워크플로우 정상 실행
  - Coverage 리포트 자동 업로드

---

## 10. 다음 단계

### 10.1 구현 단계 (/wf:build)

1. **테스트 헬퍼 구현** (우선순위: High)
   - `tests/helpers/setup.ts`
   - `tests/helpers/component-helpers.ts`
   - `tests/helpers/e2e-helpers.ts`
   - `tests/helpers/assertions.ts`

2. **Mock 데이터 구현** (우선순위: High)
   - `tests/fixtures/mock-data/wbs-nodes.ts`
   - `tests/fixtures/mock-data/api-responses.ts`

3. **컴포넌트 테스트 구현** (우선순위: Critical)
   - WbsTreePanel.spec.ts (6개 테스트)
   - WbsSearchBox.spec.ts (3개 테스트)
   - WbsSummaryCards.spec.ts (5개 테스트)
   - WbsTreeHeader.spec.ts (4개 테스트)

4. **E2E 테스트 구현** (우선순위: High)
   - global-setup.ts / global-teardown.ts
   - wbs-tree-panel.spec.ts (4개 테스트)
   - wbs-search.spec.ts (3개 테스트)
   - wbs-actions.spec.ts (3개 테스트)
   - wbs-error-handling.spec.ts (3개 테스트)
   - wbs-accessibility.spec.ts (4개 테스트)

5. **CI/CD 설정** (우선순위: Medium)
   - `.github/workflows/test.yml`
   - `.husky/pre-commit`

6. **기존 테스트 강화** (우선순위: Low)
   - parser.test.ts 추가 엣지 케이스
   - workflowEngine.test.ts 카테고리별 플로우

### 10.2 검증 단계 (/wf:verify)

1. **전체 테스트 실행**
   ```bash
   npm run test:coverage
   npm run test:e2e
   ```

2. **커버리지 검토**
   - HTML 리포트 열기: `coverage/index.html`
   - 미커버 영역 확인 및 추가 테스트

3. **Flaky 테스트 제거**
   ```bash
   for i in {1..10}; do npm run test:e2e; done
   ```

4. **성능 벤치마크**
   - 단위 테스트: < 10초
   - E2E 테스트: < 2분

5. **접근성 검증**
   - axe-core 플러그인 통합 (향후)
   - ARIA 속성 수동 검증

---

## 관련 문서

- **기본설계**: `010-basic-design.md`
- **추적성 매트릭스**: `025-traceability-matrix.md`
- **테스트 명세**: `026-test-specification.md`
- **PRD**: `.jjiban/projects/jjiban/prd.md` (섹션 11)
- **기존 테스트**: `tests/utils/wbs/parser.test.ts`, `tests/e2e/wbs.spec.ts`

---

<!--
author: Claude (System Architect)
Template Version: 1.0.0
Created: 2025-12-15
-->
