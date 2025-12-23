# TSK-05-02 상세설계: workflowSteps 리팩토링

## 1. 설계 개요

### 1.1 목표

`cli/config/workflowSteps.js`를 정적 상수에서 동적 로드 방식으로 전환하여 설정 기반 워크플로우 시스템 구현.

### 1.2 핵심 변경사항

| 항목 | Before | After |
|------|--------|-------|
| WORKFLOW_STEPS | 정적 상수 | async 함수로 획득 |
| TARGET_MAPPING | 정적 상수 | async 함수로 획득 |
| 데이터 소스 | 하드코딩 | workflows.json |
| 로드 방식 | import 시 | 런타임 동적 로드 |

### 1.3 의존 모듈 (TSK-05-01)

```
cli/config/
├── settingsLoader.js      # 설정 파일 로드 (비동기)
├── defaultWorkflows.js    # CLI 기본값 정의
└── workflowBuilder.js     # 설정 → 단계 구조 변환
```

## 2. 아키텍처 설계

### 2.1 모듈 의존 관계

```
WorkflowPlanner.js
  ↓ (호출)
workflowSteps.js
  ├── getWorkflowSteps() ──→ settingsLoader.loadWorkflows()
  ├── getTargetMapping() ──→ settingsLoader.loadWorkflows()
  ├── getStartStepIndex() ──→ getWorkflowSteps()
  └── getStepsToTarget() ──→ getWorkflowSteps() + getTargetMapping()
```

### 2.2 데이터 플로우

```
1. 최초 호출
   getWorkflowSteps()
     ↓
   settingsLoader.loadWorkflows()
     ↓ (workflows.json 로드)
   workflowBuilder.buildSteps()
     ↓ (변환)
   WORKFLOW_STEPS 구조체
     ↓ (메모리 캐싱)
   이후 호출 시 캐시 반환

2. Target Mapping
   getTargetMapping()
     ↓ (workflows.json의 actions 활용)
   TARGET_MAPPING 구조체
     ↓ (메모리 캐싱)
   이후 호출 시 캐시 반환
```

### 2.3 캐싱 전략

```javascript
// 모듈 스코프 변수
let cachedSteps = null;
let cachedMapping = null;

// 캐시 무효화 (테스트용)
export function clearCache() {
  cachedSteps = null;
  cachedMapping = null;
}
```

## 3. API 설계

### 3.1 getWorkflowSteps()

**함수 시그니처:**
```javascript
/**
 * 워크플로우 단계 설정 가져오기
 * @returns {Promise<Object>} 카테고리별 워크플로우 단계
 * @example
 * const steps = await getWorkflowSteps();
 * // { development: [...], defect: [...], infrastructure: [...] }
 */
export async function getWorkflowSteps()
```

**반환 구조:**
```javascript
{
  development: [
    { step: 'start', command: '/wf:start', status: '[ ]', nextStatus: '[bd]' },
    { step: 'draft', command: '/wf:draft', status: '[bd]', nextStatus: '[dd]' },
    // ...
  ],
  defect: [...],
  infrastructure: [...]
}
```

**구현 로직:**
```javascript
export async function getWorkflowSteps() {
  // 캐시 확인
  if (cachedSteps) {
    return cachedSteps;
  }

  // 설정 로드 (workflows.json 또는 기본값)
  const workflows = await settingsLoader.loadWorkflows();

  // 단계 구조로 변환
  cachedSteps = workflowBuilder.buildSteps(workflows);

  return cachedSteps;
}
```

### 3.2 getTargetMapping()

**함수 시그니처:**
```javascript
/**
 * Target 단계 매핑 가져오기 (--until 옵션용)
 * @returns {Promise<Object>} Target 매핑 객체
 * @example
 * const mapping = await getTargetMapping();
 * // { 'basic-design': { targetSteps: ['start'], targetStatus: '[bd]' }, ... }
 */
export async function getTargetMapping()
```

**반환 구조:**
```javascript
{
  'basic-design': { targetSteps: ['start'], targetStatus: '[bd]' },
  'detail-design': { targetSteps: ['start', 'draft'], targetStatus: '[dd]' },
  'review': { targetSteps: ['start', 'draft', 'review'], targetStatus: '[dd]' },
  'build': { targetSteps: ['start', 'draft', 'build'], targetStatus: '[im]' },
  'verify': { targetSteps: [...], targetStatus: '[vf]' },
  'done': { targetSteps: null, targetStatus: '[xx]' }
}
```

**구현 로직:**
```javascript
export async function getTargetMapping() {
  // 캐시 확인
  if (cachedMapping) {
    return cachedMapping;
  }

  // 설정 로드
  const workflows = await settingsLoader.loadWorkflows();

  // Target 매핑 생성 (actions.json 기반)
  cachedMapping = workflowBuilder.buildTargetMapping(workflows);

  return cachedMapping;
}
```

### 3.3 getStartStepIndex()

**기존 API 유지, 내부만 변경:**

```javascript
/**
 * 상태 코드에서 다음 시작 단계 찾기
 * @param {string} category - 카테고리
 * @param {string} status - 현재 상태 코드 (예: '[bd]')
 * @returns {Promise<number>} 다음 시작 단계 인덱스 (-1: 완료 상태)
 */
export async function getStartStepIndex(category, status) {
  const steps = await getWorkflowSteps(); // 동적 로드
  const categorySteps = steps[category];

  if (!categorySteps) return -1;

  // 완료 상태면 -1
  if (status === '[xx]') return -1;

  // Todo 상태면 0부터
  if (status === '[ ]') return 0;

  // 현재 상태에 해당하는 단계 찾기
  for (let i = 0; i < categorySteps.length; i++) {
    if (categorySteps[i].status === status) {
      return i;
    }
  }

  // 다음 상태에 해당하는 단계 찾기
  for (let i = 0; i < categorySteps.length; i++) {
    if (categorySteps[i].nextStatus === status) {
      return i + 1;
    }
  }

  return 0;
}
```

### 3.4 getStepsToTarget()

**기존 API 유지, 내부만 변경:**

```javascript
/**
 * 목표 단계까지 실행할 단계 목록 생성
 * @param {string} category - 카테고리
 * @param {string} currentStatus - 현재 상태 코드
 * @param {string} [target='done'] - 목표 단계
 * @returns {Promise<Array>} 실행할 단계 목록
 */
export async function getStepsToTarget(category, currentStatus, target = 'done') {
  const steps = await getWorkflowSteps();
  const categorySteps = steps[category];

  if (!categorySteps) return [];

  const startIdx = await getStartStepIndex(category, currentStatus);
  if (startIdx === -1) return []; // 이미 완료

  const targetMapping = await getTargetMapping();
  const targetInfo = targetMapping[target];

  if (!targetInfo) return [];

  // target이 'done'이면 전체 실행
  if (targetInfo.targetSteps === null) {
    return categorySteps.slice(startIdx).map(s => ({
      step: s.step,
      command: s.command
    }));
  }

  // 목표까지 실행할 단계 필터링
  const targetStepNames = new Set(targetInfo.targetSteps);
  const result = [];

  for (let i = startIdx; i < categorySteps.length; i++) {
    const s = categorySteps[i];
    if (targetStepNames.has(s.step)) {
      result.push({ step: s.step, command: s.command });
    }
    // 목표 상태에 도달하면 중단
    if (s.nextStatus === targetInfo.targetStatus || s.step === target) {
      break;
    }
  }

  return result;
}
```

### 3.5 getCommandForStep()

**기존 API 유지, 내부만 변경:**

```javascript
/**
 * 단계 이름으로 명령어 가져오기
 * @param {string} category - 카테고리
 * @param {string} stepName - 단계 이름
 * @returns {Promise<string|null>} 명령어
 */
export async function getCommandForStep(category, stepName) {
  const steps = await getWorkflowSteps();
  const categorySteps = steps[category];

  if (!categorySteps) return null;

  const step = categorySteps.find(s => s.step === stepName);
  return step ? step.command : null;
}
```

## 4. WorkflowPlanner 수정

### 4.1 현재 문제

```javascript
// WorkflowPlanner.js (현재)
import { getStepsToTarget, TARGET_MAPPING } from '../config/workflowSteps.js';

// TARGET_MAPPING을 동기적으로 사용
if (!TARGET_MAPPING[target]) {
  throw new ValidationError(...);
}
```

**문제:** TARGET_MAPPING이 이제 async 함수이므로 직접 접근 불가

### 4.2 수정 방안

**Option 1: async/await 전환 (권장)**

```javascript
// WorkflowPlanner.js
export class WorkflowPlanner {
  async createPlan(task, options = {}) {
    const target = options.until || 'done';

    // Target Mapping 동적 로드
    const targetMapping = await getTargetMapping();

    // Target 유효성 검증
    if (!targetMapping[target]) {
      throw new ValidationError(
        'until',
        `유효하지 않은 목표 단계: ${target}\n` +
        `가능한 값: ${Object.keys(targetMapping).join(', ')}`
      );
    }

    // 이미 완료된 경우
    if (task.status === '[xx]') {
      return {
        taskId: task.id,
        category: task.category,
        currentStatus: task.status,
        targetStep: target,
        steps: [],
        isEmpty: true,
        reason: '이미 완료된 Task입니다'
      };
    }

    // 실행할 단계 목록 생성 (이제 비동기)
    const steps = await getStepsToTarget(task.category, task.status, target);

    // 실행할 단계가 없는 경우
    if (steps.length === 0) {
      return {
        taskId: task.id,
        category: task.category,
        currentStatus: task.status,
        targetStep: target,
        steps: [],
        isEmpty: true,
        reason: `현재 상태(${task.status})에서 목표(${target})까지 실행할 단계가 없습니다`
      };
    }

    return {
      taskId: task.id,
      category: task.category,
      currentStatus: task.status,
      targetStep: target,
      steps: steps.map((s, i) => ({
        index: i,
        step: s.step,
        command: `${s.command} ${task.id}`
      })),
      isEmpty: false,
      totalSteps: steps.length
    };
  }

  async createResumePlan(savedState, task) {
    const remainingSteps = savedState.steps.slice(savedState.currentStep);

    if (remainingSteps.length === 0) {
      return {
        taskId: task.id,
        category: task.category,
        currentStatus: task.status,
        targetStep: savedState.targetStep,
        steps: [],
        isEmpty: true,
        reason: '모든 단계가 이미 완료되었습니다',
        isResume: true,
        completedSteps: savedState.completedSteps
      };
    }

    // 남은 단계에 대한 명령어 생성 (이제 비동기)
    const steps = await Promise.all(
      remainingSteps.map(async (stepName, i) => {
        const command = await this.getCommandForStep(task.category, stepName);
        return {
          index: savedState.currentStep + i,
          step: stepName,
          command: `${command} ${task.id}`
        };
      })
    );

    return {
      taskId: task.id,
      category: task.category,
      currentStatus: task.status,
      targetStep: savedState.targetStep,
      steps,
      isEmpty: false,
      totalSteps: savedState.steps.length,
      isResume: true,
      completedSteps: savedState.completedSteps,
      resumeFromStep: savedState.currentStep
    };
  }

  async getCommandForStep(category, stepName) {
    // workflowSteps.js의 함수 호출 (이제 비동기)
    return await getCommandForStep(category, stepName);
  }
}
```

### 4.3 호출자 수정 필요성

**WorkflowPlanner 사용처:**
- `cli/commands/wf.js` - wf 명령어 핸들러
- 기타 워크플로우 관련 명령어

**수정 필요:**
```javascript
// Before
const planner = new WorkflowPlanner();
const plan = planner.createPlan(task, options);

// After
const planner = new WorkflowPlanner();
const plan = await planner.createPlan(task, options); // await 추가
```

## 5. workflowBuilder 확장

### 5.1 buildTargetMapping() 함수 추가

workflowBuilder.js에 Target Mapping 생성 함수 추가 필요:

```javascript
/**
 * Target 매핑 생성 (actions.json 기반)
 * @param {Object} workflows - 로드된 워크플로우 설정
 * @returns {Object} Target 매핑 객체
 */
export function buildTargetMapping(workflows) {
  const mapping = {};

  // actions.json의 actions를 기반으로 매핑 생성
  for (const action of workflows.actions) {
    // action.id가 'basic-design', 'detail-design' 등
    const targetSteps = action.steps || null;
    const targetStatus = action.targetStatus;

    mapping[action.id] = {
      targetSteps,
      targetStatus
    };
  }

  return mapping;
}
```

### 5.2 actions.json 구조 (참조)

TSK-05-01에서 정의한 actions.json 구조:

```json
{
  "actions": [
    {
      "id": "basic-design",
      "steps": ["start"],
      "targetStatus": "[bd]"
    },
    {
      "id": "detail-design",
      "steps": ["start", "draft"],
      "targetStatus": "[dd]"
    },
    {
      "id": "done",
      "steps": null,
      "targetStatus": "[xx]"
    }
  ]
}
```

## 6. 에러 처리

### 6.1 설정 로드 실패

```javascript
export async function getWorkflowSteps() {
  if (cachedSteps) {
    return cachedSteps;
  }

  try {
    const workflows = await settingsLoader.loadWorkflows();
    cachedSteps = workflowBuilder.buildSteps(workflows);
    return cachedSteps;
  } catch (error) {
    console.error('워크플로우 설정 로드 실패:', error.message);
    console.error('기본값을 사용합니다.');

    // 폴백: 기본값 사용 (settingsLoader 내부에서 처리됨)
    const defaultWorkflows = await settingsLoader.loadWorkflows();
    cachedSteps = workflowBuilder.buildSteps(defaultWorkflows);
    return cachedSteps;
  }
}
```

### 6.2 잘못된 카테고리/상태

```javascript
export async function getStartStepIndex(category, status) {
  const steps = await getWorkflowSteps();
  const categorySteps = steps[category];

  if (!categorySteps) {
    console.warn(`알 수 없는 카테고리: ${category}`);
    return -1;
  }

  // ... 나머지 로직
}
```

## 7. 테스트 설계

### 7.1 단위 테스트

**test/cli/config/workflowSteps.test.js**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWorkflowSteps,
  getTargetMapping,
  getStartStepIndex,
  getStepsToTarget,
  getCommandForStep,
  clearCache
} from '../../../cli/config/workflowSteps.js';

describe('workflowSteps', () => {
  beforeEach(() => {
    clearCache(); // 각 테스트 전 캐시 초기화
  });

  describe('getWorkflowSteps', () => {
    it('워크플로우 단계를 올바르게 로드해야 함', async () => {
      const steps = await getWorkflowSteps();

      expect(steps).toHaveProperty('development');
      expect(steps).toHaveProperty('defect');
      expect(steps).toHaveProperty('infrastructure');
      expect(steps.development).toBeInstanceOf(Array);
    });

    it('두 번째 호출 시 캐시를 사용해야 함', async () => {
      const steps1 = await getWorkflowSteps();
      const steps2 = await getWorkflowSteps();

      expect(steps1).toBe(steps2); // 동일한 객체 참조
    });
  });

  describe('getTargetMapping', () => {
    it('Target 매핑을 올바르게 로드해야 함', async () => {
      const mapping = await getTargetMapping();

      expect(mapping).toHaveProperty('basic-design');
      expect(mapping).toHaveProperty('done');
      expect(mapping['basic-design'].targetStatus).toBe('[bd]');
    });
  });

  describe('getStartStepIndex', () => {
    it('Todo 상태는 0을 반환해야 함', async () => {
      const index = await getStartStepIndex('development', '[ ]');
      expect(index).toBe(0);
    });

    it('완료 상태는 -1을 반환해야 함', async () => {
      const index = await getStartStepIndex('development', '[xx]');
      expect(index).toBe(-1);
    });

    it('현재 상태에 맞는 인덱스를 반환해야 함', async () => {
      const index = await getStartStepIndex('development', '[bd]');
      expect(index).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStepsToTarget', () => {
    it('Todo에서 done까지 모든 단계를 반환해야 함', async () => {
      const steps = await getStepsToTarget('development', '[ ]', 'done');
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('step');
      expect(steps[0]).toHaveProperty('command');
    });

    it('이미 완료된 경우 빈 배열을 반환해야 함', async () => {
      const steps = await getStepsToTarget('development', '[xx]', 'done');
      expect(steps).toEqual([]);
    });

    it('basic-design 목표는 start 단계만 포함해야 함', async () => {
      const steps = await getStepsToTarget('development', '[ ]', 'basic-design');
      expect(steps.length).toBeGreaterThanOrEqual(1);
      expect(steps.some(s => s.step === 'start')).toBe(true);
    });
  });

  describe('getCommandForStep', () => {
    it('단계 이름으로 명령어를 반환해야 함', async () => {
      const command = await getCommandForStep('development', 'start');
      expect(command).toBe('/wf:start');
    });

    it('존재하지 않는 단계는 null을 반환해야 함', async () => {
      const command = await getCommandForStep('development', 'nonexistent');
      expect(command).toBeNull();
    });
  });
});
```

### 7.2 통합 테스트

**test/cli/core/WorkflowPlanner.test.js** (기존 테스트 수정)

```javascript
import { describe, it, expect } from 'vitest';
import { WorkflowPlanner } from '../../../cli/core/WorkflowPlanner.js';

describe('WorkflowPlanner (with dynamic loading)', () => {
  it('개발 Task에 대한 계획을 생성해야 함', async () => {
    const planner = new WorkflowPlanner();
    const task = {
      id: 'TSK-01-01',
      category: 'development',
      status: '[ ]'
    };

    const plan = await planner.createPlan(task, { until: 'done' });

    expect(plan.isEmpty).toBe(false);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps[0].command).toContain('/wf:');
    expect(plan.steps[0].command).toContain('TSK-01-01');
  });

  it('완료된 Task는 빈 계획을 반환해야 함', async () => {
    const planner = new WorkflowPlanner();
    const task = {
      id: 'TSK-01-01',
      category: 'development',
      status: '[xx]'
    };

    const plan = await planner.createPlan(task);

    expect(plan.isEmpty).toBe(true);
    expect(plan.reason).toContain('완료');
  });
});
```

## 8. 마이그레이션 가이드

### 8.1 호출자 코드 수정

**Before:**
```javascript
import { getStepsToTarget, TARGET_MAPPING } from './config/workflowSteps.js';

const steps = getStepsToTarget(category, status, target);
if (TARGET_MAPPING[target]) { ... }
```

**After:**
```javascript
import { getStepsToTarget, getTargetMapping } from './config/workflowSteps.js';

const steps = await getStepsToTarget(category, status, target);
const mapping = await getTargetMapping();
if (mapping[target]) { ... }
```

### 8.2 필요한 수정 파일

| 파일 | 수정 내용 |
|------|----------|
| `cli/config/workflowSteps.js` | 전체 리팩토링 (상수 → 함수) |
| `cli/core/WorkflowPlanner.js` | async/await 추가 |
| `cli/commands/wf.js` | await 추가 |
| `test/cli/**/*.test.js` | async/await 추가 |

## 9. 성능 고려사항

### 9.1 캐싱 효과

```
첫 호출: settingsLoader (~10ms) + workflowBuilder (~5ms) = ~15ms
이후 호출: 캐시 반환 (~0.1ms)

평균 성능 향상: 99% (대부분 캐시 히트)
```

### 9.2 메모리 사용

```
cachedSteps: ~50KB (모든 카테고리 워크플로우)
cachedMapping: ~5KB (Target 매핑)

총 추가 메모리: ~55KB (무시 가능)
```

## 10. 하위 호환성 보장

### 10.1 API 시그니처

모든 기존 함수는 시그니처 유지 (동기 → 비동기로만 변경):

```javascript
// 기존: 동기 함수
function getStartStepIndex(category, status) { ... }

// 변경: 비동기 함수 (시그니처는 동일)
async function getStartStepIndex(category, status) { ... }
```

### 10.2 반환값 구조

모든 반환값 구조 동일하게 유지:

```javascript
// Before & After - 동일한 구조
{
  step: 'start',
  command: '/wf:start',
  status: '[ ]',
  nextStatus: '[bd]'
}
```

### 10.3 상태 코드 정규화

`[ts]` → `[vf]` 자동 매핑은 settingsLoader 또는 WbsReader에서 처리 (TSK-05-03에서 구현)

## 11. 롤백 계획

문제 발생 시 롤백 가능하도록:

1. 기존 workflowSteps.js를 workflowSteps.legacy.js로 백업
2. Git tag로 롤백 포인트 생성
3. 설정 로드 실패 시 자동으로 기본값(하드코딩) 폴백

## 12. 다음 단계 (TSK-05-03)

- WbsReader.js에서 상태 코드 정규화 (`[ts]` → `[vf]`)
- CLI 전체 통합 테스트
- 문서 업데이트 (wf-common-lite.md)

## 13. 체크리스트

### 구현 전

- [ ] TSK-05-01 완료 확인 (settingsLoader, workflowBuilder)
- [ ] 기존 workflowSteps.js 백업
- [ ] 단위 테스트 작성

### 구현 중

- [ ] getWorkflowSteps() 구현
- [ ] getTargetMapping() 구현
- [ ] getStartStepIndex() 리팩토링
- [ ] getStepsToTarget() 리팩토링
- [ ] getCommandForStep() 리팩토링
- [ ] clearCache() 구현
- [ ] WorkflowPlanner.js 수정
- [ ] workflowBuilder.js에 buildTargetMapping() 추가

### 구현 후

- [ ] 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] ESLint 검사
- [ ] JSDoc 문서화
- [ ] 실제 wf 명령어 테스트 (수동)

## 14. 참조

- TSK-05-01: CLI 설정 로더 생성 (의존 모듈)
- PRD 섹션 10: CLI 워크플로우 설정 통합
- `cli/config/workflowSteps.js` (현재 구현)
- `cli/core/WorkflowPlanner.js` (수정 대상)
