# 기술설계: CLI 설정 로더 생성

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-05-01 |
| Category | infrastructure |
| 상태 | [dd] 상세설계 |
| 상위 Work Package | WP-05: 워크플로우 유연화 |
| PRD 참조 | 10.3, 10.6 |
| 작성일 | 2025-12-17 |

---

## 1. 개요

### 1.1 목적

CLI에서 워크플로우 설정을 동적으로 로드하여 Server와 동일한 설정 파일(`workflows.json`)을 사용하도록 합니다. 이를 통해 하드코딩된 워크플로우 단계를 설정 기반으로 전환합니다.

### 1.2 현재 문제

| 계층 | 파일 | 상태 |
|------|------|------|
| Server | `server/utils/settings/defaults.ts` | 설정 기반 (유연) |
| CLI | `cli/config/workflowSteps.js` | 하드코딩 (경직) |

**상태 코드 불일치:**

| 상태 | Server | CLI |
|------|--------|-----|
| Verify | `[vf]` | `[ts]` |
| Infra Design | `[dd]` | `[ds]` |

### 1.3 구현 범위

> WBS Task 설명에서 추출

- `cli/config/settingsLoader.js` 신규 생성
- `cli/config/defaultWorkflows.js` 신규 생성
- `cli/config/workflowBuilder.js` 신규 생성
- `workflows.json` 로드 및 폴백 로직

### 1.4 제외 범위

- `workflowSteps.js` 리팩토링 → TSK-05-02
- 상태 코드 통일 마이그레이션 → TSK-05-03
- 통합 테스트 → TSK-05-04

---

## 2. 아키텍처

### 2.1 현재 구조

```
cli/
├── config/
│   └── workflowSteps.js      # 하드코딩된 워크플로우 단계
├── core/
│   ├── WbsReader.js          # WBS 파싱
│   ├── WorkflowPlanner.js    # 실행 계획 수립
│   └── WorkflowRunner.js     # 워크플로우 실행
└── commands/
    └── next-task.js          # 다음 Task 조회
```

### 2.2 목표 구조

```
cli/
├── config/
│   ├── workflowSteps.js      # 기존 유지 (v2에서 동적 전환)
│   ├── settingsLoader.js     # [신규] 설정 파일 로더
│   ├── defaultWorkflows.js   # [신규] CLI용 기본값
│   └── workflowBuilder.js    # [신규] 설정 → 단계 변환
└── ...
```

### 2.3 데이터 흐름

```
                  ┌─────────────────────────────┐
                  │ .jjiban/settings/           │
                  │   workflows.json            │
                  └──────────────┬──────────────┘
                                 │ (있으면)
                                 ▼
┌──────────────────────────────────────────────────┐
│           settingsLoader.js                       │
│  loadWorkflows() → JSON 파싱                      │
├──────────────────────────────────────────────────┤
│           (없으면 폴백)                            │
│                    ↓                              │
│           defaultWorkflows.js                     │
│  DEFAULT_CLI_WORKFLOWS 상수                       │
└──────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────┐
│           workflowBuilder.js                      │
│  buildWorkflowSteps(workflows) → WORKFLOW_STEPS   │
│  buildTargetMapping(workflows) → TARGET_MAPPING   │
└──────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────┐
│           workflowSteps.js (v2)                  │
│  getWorkflowSteps() → 동적 로드                   │
│  getTargetMapping() → 동적 로드                   │
└──────────────────────────────────────────────────┘
```

---

## 3. 상세 설계

### 3.1 settingsLoader.js

**책임**: 설정 파일 로드 및 캐싱

```javascript
/**
 * 설정 파일 로더
 * 책임: workflows.json 로드, 폴백 처리, 캐싱
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { DEFAULT_CLI_WORKFLOWS } from './defaultWorkflows.js';

// 캐시
let _workflowsCache = null;
let _projectRoot = null;

/**
 * 프로젝트 루트 설정
 * @param {string} root - 프로젝트 루트 경로
 */
export function setProjectRoot(root) {
  _projectRoot = root;
  _workflowsCache = null; // 캐시 초기화
}

/**
 * 프로젝트 루트 경로 가져오기
 * @returns {string} 프로젝트 루트 경로
 */
export function getProjectRoot() {
  return _projectRoot || process.cwd();
}

/**
 * workflows.json 로드
 * @returns {Promise<Object>} 워크플로우 설정
 */
export async function loadWorkflows() {
  // 캐시 반환
  if (_workflowsCache) {
    return _workflowsCache;
  }

  const settingsPath = join(
    getProjectRoot(),
    '.jjiban',
    'settings',
    'workflows.json'
  );

  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    const data = JSON.parse(content);

    // 버전 검증
    if (!data.version || !data.workflows) {
      console.warn('[WARN] workflows.json 형식 오류, 기본값 사용');
      _workflowsCache = DEFAULT_CLI_WORKFLOWS;
      return _workflowsCache;
    }

    _workflowsCache = data;
    return _workflowsCache;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 파일 없음 - 기본값 사용 (경고 없음, 정상 케이스)
      _workflowsCache = DEFAULT_CLI_WORKFLOWS;
      return _workflowsCache;
    }

    // 파싱 오류 등
    console.warn(`[WARN] workflows.json 로드 실패: ${error.message}`);
    _workflowsCache = DEFAULT_CLI_WORKFLOWS;
    return _workflowsCache;
  }
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearCache() {
  _workflowsCache = null;
}

/**
 * 카테고리 ID로 워크플로우 찾기
 * @param {string} categoryId - 카테고리 ID
 * @returns {Promise<Object|null>} 워크플로우 객체
 */
export async function getWorkflowByCategory(categoryId) {
  const workflows = await loadWorkflows();
  return workflows.workflows.find(wf => wf.id === categoryId) || null;
}
```

### 3.2 defaultWorkflows.js

**책임**: CLI용 기본 워크플로우 정의

```javascript
/**
 * CLI용 기본 워크플로우 정의
 * Server의 defaults.ts와 동일한 구조 유지
 */

export const DEFAULT_CLI_WORKFLOWS = {
  version: '1.0',
  workflows: [
    {
      id: 'development',
      name: 'Development Workflow',
      description: '신규 기능 개발 워크플로우',
      states: ['[ ]', '[bd]', '[dd]', '[im]', '[vf]', '[xx]'],
      initialState: '[ ]',
      finalStates: ['[xx]'],
      transitions: [
        { from: '[ ]', to: '[bd]', command: 'start', document: '010-basic-design.md' },
        { from: '[bd]', to: '[dd]', command: 'draft', document: '020-detail-design.md' },
        { from: '[dd]', to: '[im]', command: 'build', document: '030-implementation.md' },
        { from: '[im]', to: '[vf]', command: 'verify', document: '070-integration-test.md' },
        { from: '[vf]', to: '[xx]', command: 'done', document: '080-manual.md' }
      ],
      // 상태 내 액션 (상태 전환 없음)
      actions: [
        { status: '[bd]', command: 'ui' },
        { status: '[dd]', command: 'review' },
        { status: '[dd]', command: 'apply' },
        { status: '[im]', command: 'test' },
        { status: '[im]', command: 'audit' },
        { status: '[im]', command: 'patch' }
      ]
    },
    {
      id: 'defect',
      name: 'Defect Workflow',
      description: '결함 수정 워크플로우',
      states: ['[ ]', '[an]', '[fx]', '[vf]', '[xx]'],
      initialState: '[ ]',
      finalStates: ['[xx]'],
      transitions: [
        { from: '[ ]', to: '[an]', command: 'start', document: '010-defect-analysis.md' },
        { from: '[an]', to: '[fx]', command: 'fix', document: '030-implementation.md' },
        { from: '[fx]', to: '[vf]', command: 'verify', document: '070-test-results.md' },
        { from: '[vf]', to: '[xx]', command: 'done', document: null }
      ],
      actions: [
        { status: '[fx]', command: 'test' },
        { status: '[fx]', command: 'audit' },
        { status: '[fx]', command: 'patch' }
      ]
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure Workflow',
      description: '인프라/리팩토링 워크플로우',
      states: ['[ ]', '[dd]', '[im]', '[xx]'],
      initialState: '[ ]',
      finalStates: ['[xx]'],
      transitions: [
        { from: '[ ]', to: '[dd]', command: 'start', document: '010-tech-design.md', optional: true },
        { from: '[ ]', to: '[im]', command: 'skip', document: '030-implementation.md' },
        { from: '[dd]', to: '[im]', command: 'build', document: '030-implementation.md' },
        { from: '[im]', to: '[xx]', command: 'done', document: null }
      ],
      actions: [
        { status: '[im]', command: 'audit' },
        { status: '[im]', command: 'patch' }
      ]
    }
  ]
};
```

### 3.3 workflowBuilder.js

**책임**: 설정 파일을 WORKFLOW_STEPS 형식으로 변환

```javascript
/**
 * 워크플로우 빌더
 * 책임: workflows.json 형식 → workflowSteps.js 형식 변환
 */

/**
 * 워크플로우 설정에서 WORKFLOW_STEPS 형식으로 변환
 * @param {Object} workflowsConfig - workflows.json 형식
 * @returns {Object} WORKFLOW_STEPS 형식
 */
export function buildWorkflowSteps(workflowsConfig) {
  const result = {};

  for (const workflow of workflowsConfig.workflows) {
    const steps = [];

    // transitions을 step 형식으로 변환
    for (const transition of workflow.transitions) {
      steps.push({
        step: transition.command,
        command: `/wf:${transition.command}`,
        status: transition.from,
        nextStatus: transition.to
      });
    }

    // actions을 step 형식으로 추가 (상태 유지)
    if (workflow.actions) {
      for (const action of workflow.actions) {
        // 중복 방지: 동일 command가 이미 있으면 스킵
        if (!steps.find(s => s.step === action.command)) {
          steps.push({
            step: action.command,
            command: `/wf:${action.command}`,
            status: action.status,
            nextStatus: action.status // 상태 유지
          });
        }
      }
    }

    result[workflow.id] = steps;
  }

  return result;
}

/**
 * 워크플로우 설정에서 TARGET_MAPPING 형식으로 변환
 * @param {Object} workflowsConfig - workflows.json 형식
 * @returns {Object} TARGET_MAPPING 형식
 */
export function buildTargetMapping(workflowsConfig) {
  // development 워크플로우 기준으로 타겟 매핑 생성
  const devWorkflow = workflowsConfig.workflows.find(wf => wf.id === 'development');
  if (!devWorkflow) {
    return getDefaultTargetMapping();
  }

  const transitions = devWorkflow.transitions;
  const actions = devWorkflow.actions || [];

  // 단계별 타겟 매핑 생성
  const mapping = {
    'basic-design': {
      targetSteps: ['start'],
      targetStatus: '[bd]'
    },
    'detail-design': {
      targetSteps: ['start', 'draft'],
      targetStatus: '[dd]'
    },
    'review': {
      targetSteps: ['start', 'draft', 'review'],
      targetStatus: '[dd]'
    },
    'apply': {
      targetSteps: ['start', 'draft', 'review', 'apply'],
      targetStatus: '[dd]'
    },
    'build': {
      targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test'],
      targetStatus: '[im]'
    },
    'audit': {
      targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test', 'audit'],
      targetStatus: '[im]'
    },
    'patch': {
      targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test', 'audit', 'patch'],
      targetStatus: '[im]'
    },
    'verify': {
      targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test', 'audit', 'patch', 'verify'],
      targetStatus: '[vf]'
    },
    'done': {
      targetSteps: null, // 전체 실행
      targetStatus: '[xx]'
    }
  };

  return mapping;
}

/**
 * 기본 TARGET_MAPPING 반환 (폴백용)
 */
function getDefaultTargetMapping() {
  return {
    'basic-design': { targetSteps: ['start'], targetStatus: '[bd]' },
    'detail-design': { targetSteps: ['start', 'draft'], targetStatus: '[dd]' },
    'review': { targetSteps: ['start', 'draft', 'review'], targetStatus: '[dd]' },
    'apply': { targetSteps: ['start', 'draft', 'review', 'apply'], targetStatus: '[dd]' },
    'build': { targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test'], targetStatus: '[im]' },
    'audit': { targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test', 'audit'], targetStatus: '[im]' },
    'patch': { targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test', 'audit', 'patch'], targetStatus: '[im]' },
    'verify': { targetSteps: ['start', 'draft', 'review', 'apply', 'build', 'test', 'audit', 'patch', 'verify'], targetStatus: '[vf]' },
    'done': { targetSteps: null, targetStatus: '[xx]' }
  };
}

/**
 * 상태 코드 정규화
 * CLI 레거시 상태 코드를 표준 상태 코드로 변환
 * @param {string} statusCode - 입력 상태 코드
 * @returns {string} 정규화된 상태 코드
 */
export function normalizeStatusCode(statusCode) {
  const mapping = {
    '[ts]': '[vf]', // 레거시 테스트 → 검증
    '[ds]': '[dd]'  // 레거시 인프라 설계 → 상세설계
  };

  return mapping[statusCode] || statusCode;
}

/**
 * 역방향 상태 코드 매핑 (호환성용)
 * 표준 상태 코드를 레거시 상태 코드로 변환
 * @param {string} statusCode - 표준 상태 코드
 * @param {string} category - 카테고리
 * @returns {string} 카테고리에 맞는 상태 코드
 */
export function denormalizeStatusCode(statusCode, category) {
  // 현재는 정규화만 수행, 역변환 필요 시 확장
  return statusCode;
}
```

---

## 4. 파일 구조

### 4.1 신규 파일

| 파일 | 설명 | 라인 수 (예상) |
|------|------|---------------|
| `cli/config/settingsLoader.js` | 설정 파일 로더 | ~80 |
| `cli/config/defaultWorkflows.js` | CLI용 기본값 | ~100 |
| `cli/config/workflowBuilder.js` | 설정 → 단계 변환 | ~120 |

### 4.2 의존성

```
settingsLoader.js
├── defaultWorkflows.js (폴백용)
└── (외부) .jjiban/settings/workflows.json

workflowBuilder.js
├── settingsLoader.js (loadWorkflows)
└── (없음)

workflowSteps.js (v2, TSK-05-02에서 수정)
├── settingsLoader.js
└── workflowBuilder.js
```

---

## 5. 인터페이스

### 5.1 settingsLoader.js

| 함수 | 파라미터 | 반환 | 설명 |
|------|---------|------|------|
| `setProjectRoot` | `root: string` | `void` | 프로젝트 루트 설정 |
| `getProjectRoot` | - | `string` | 프로젝트 루트 반환 |
| `loadWorkflows` | - | `Promise<Object>` | 워크플로우 설정 로드 |
| `clearCache` | - | `void` | 캐시 초기화 |
| `getWorkflowByCategory` | `categoryId: string` | `Promise<Object\|null>` | 카테고리별 워크플로우 조회 |

### 5.2 workflowBuilder.js

| 함수 | 파라미터 | 반환 | 설명 |
|------|---------|------|------|
| `buildWorkflowSteps` | `workflowsConfig: Object` | `Object` | WORKFLOW_STEPS 형식 변환 |
| `buildTargetMapping` | `workflowsConfig: Object` | `Object` | TARGET_MAPPING 형식 변환 |
| `normalizeStatusCode` | `statusCode: string` | `string` | 상태 코드 정규화 |
| `denormalizeStatusCode` | `statusCode: string, category: string` | `string` | 역방향 매핑 |

---

## 6. workflows.json 스키마

### 6.1 파일 위치

`.jjiban/settings/workflows.json`

### 6.2 스키마

```json
{
  "version": "1.0",
  "workflows": [
    {
      "id": "development",
      "name": "Development Workflow",
      "description": "설명",
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
        }
      ],
      "actions": [
        {
          "status": "[bd]",
          "command": "ui"
        }
      ]
    }
  ]
}
```

### 6.3 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `version` | string | Y | 스키마 버전 |
| `workflows` | array | Y | 워크플로우 배열 |
| `workflows[].id` | string | Y | 워크플로우 ID (= 카테고리 ID) |
| `workflows[].states` | string[] | Y | 허용 상태 목록 |
| `workflows[].transitions` | array | Y | 상태 전이 규칙 |
| `workflows[].transitions[].from` | string | Y | 시작 상태 |
| `workflows[].transitions[].to` | string | Y | 종료 상태 |
| `workflows[].transitions[].command` | string | Y | 명령어 |
| `workflows[].actions` | array | N | 상태 내 액션 |

---

## 7. 에러 처리

### 7.1 에러 케이스

| 케이스 | 처리 | 로그 레벨 |
|--------|------|----------|
| workflows.json 없음 | 기본값 폴백 | 없음 (정상) |
| JSON 파싱 오류 | 기본값 폴백 | WARN |
| 스키마 형식 오류 | 기본값 폴백 | WARN |
| 워크플로우 ID 없음 | null 반환 | 없음 |

### 7.2 에러 메시지

```javascript
// 경고 메시지 형식
console.warn('[WARN] workflows.json 로드 실패: {message}');
console.warn('[WARN] workflows.json 형식 오류, 기본값 사용');
```

---

## 8. 하위 호환성

### 8.1 레거시 상태 코드 매핑

| 레거시 | 표준 | 카테고리 |
|--------|------|---------|
| `[ts]` | `[vf]` | development, defect |
| `[ds]` | `[dd]` | infrastructure |

### 8.2 호환성 전략

1. **입력 정규화**: WbsReader에서 상태 코드 읽을 때 정규화
2. **출력 유지**: wbs.md 저장 시 표준 상태 코드 사용
3. **점진적 마이그레이션**: 기존 WBS 파일은 그대로 동작

---

## 9. 테스트 계획

### 9.1 단위 테스트

| 테스트 | 케이스 |
|--------|--------|
| settingsLoader | workflows.json 로드 성공 |
| settingsLoader | workflows.json 없음 → 폴백 |
| settingsLoader | 캐싱 동작 확인 |
| workflowBuilder | transitions → steps 변환 |
| workflowBuilder | actions → steps 변환 |
| workflowBuilder | 상태 코드 정규화 |

### 9.2 통합 테스트

→ TSK-05-04에서 수행

---

## 10. 다음 단계

- TSK-05-02: workflowSteps.js 리팩토링 (동적 로드 전환)
- TSK-05-03: 상태 코드 통일
- TSK-05-04: 통합 테스트

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban개선/prd.md` 섹션 10
- Server defaults: `server/utils/settings/defaults.ts`
- 현재 workflowSteps: `cli/config/workflowSteps.js`
