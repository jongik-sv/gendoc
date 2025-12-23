# 사용자 매뉴얼: 설정 서비스

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-02 |
| Category | development |
| 상태 | [xx] 완료 |
| 작성일 | 2025-12-14 |

---

## 1. 개요

설정 서비스는 JJIBAN 시스템의 전역 설정을 로드하고 관리합니다.

### 1.1 주요 기능

- 4가지 설정 타입 지원: `columns`, `categories`, `workflows`, `actions`
- 설정 파일이 없는 경우 기본값 자동 사용
- 메모리 캐싱으로 성능 최적화
- REST API를 통한 설정 조회

---

## 2. API 엔드포인트

### 2.1 설정 조회

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/settings/columns` | 칸반 컬럼 설정 |
| GET | `/api/settings/categories` | 카테고리 설정 |
| GET | `/api/settings/workflows` | 워크플로우 설정 |
| GET | `/api/settings/actions` | 액션 설정 |

### 2.2 응답 예시

**GET /api/settings/columns**

```json
{
  "version": "1.0",
  "columns": [
    {
      "id": "todo",
      "name": "Todo",
      "statusCode": "[ ]",
      "order": 1,
      "color": "#6b7280",
      "description": "대기 중인 작업"
    },
    ...
  ]
}
```

**GET /api/settings/categories**

```json
{
  "version": "1.0",
  "categories": [
    {
      "id": "development",
      "name": "Development",
      "code": "dev",
      "color": "#3b82f6",
      "icon": "pi-code",
      "description": "신규 기능 개발 작업",
      "workflowId": "development"
    },
    ...
  ]
}
```

### 2.3 에러 응답

**잘못된 설정 타입 (400)**

```json
{
  "statusCode": 400,
  "statusMessage": "INVALID_SETTINGS_TYPE",
  "message": "Invalid settings type: invalid. Valid types are: columns, categories, workflows, actions",
  "data": {
    "timestamp": "2025-12-14T10:30:00.000Z"
  }
}
```

---

## 3. 설정 파일 구조

### 3.1 파일 위치

```
.jjiban/
└── settings/
    ├── columns.json      # 칸반 컬럼 설정
    ├── categories.json   # 카테고리 설정
    ├── workflows.json    # 워크플로우 설정
    └── actions.json      # 액션 설정
```

### 3.2 기본값 사용

설정 파일이 없는 경우 시스템은 자동으로 기본값을 사용합니다:

- 6단계 칸반 컬럼 (Todo → Design → Detail → Implement → Verify → Done)
- 3가지 카테고리 (development, defect, infrastructure)
- 카테고리별 워크플로우 규칙
- 상태 내 액션 정의

---

## 4. 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `JJIBAN_BASE_PATH` | jjiban 기본 경로 | `process.cwd()` |

### 4.1 사용 예시

```bash
# Windows
set JJIBAN_BASE_PATH=C:\my-projects && npm run dev

# macOS/Linux
JJIBAN_BASE_PATH=/home/user/projects npm run dev
```

---

## 5. 코드 사용법

### 5.1 서비스 함수

```typescript
import {
  loadSettings,
  getColumns,
  getCategories,
  getWorkflows,
  getActions,
  getSettingsByType,
  refreshCache,
} from '~/server/utils/settings';

// 전체 설정 로드
const settings = await loadSettings();

// 개별 설정 조회
const columns = await getColumns();
const categories = await getCategories();
const workflows = await getWorkflows();
const actions = await getActions();

// 타입별 조회
const columnsConfig = await getSettingsByType('columns');

// 캐시 무효화 (설정 재로드 필요 시)
refreshCache();
```

### 5.2 헬퍼 함수

```typescript
import {
  findColumnByStatus,
  findWorkflowByCategory,
  getAvailableTransitions,
  getAvailableActions,
} from '~/server/utils/settings';

// 상태 코드로 컬럼 찾기
const column = findColumnByStatus('[im]');
// { id: 'implement', name: 'Implement', ... }

// 카테고리로 워크플로우 찾기
const workflow = findWorkflowByCategory('development');
// { id: 'development', name: 'Development Workflow', ... }

// 현재 상태에서 가능한 전이 목록
const transitions = getAvailableTransitions('development', '[bd]');
// [{ from: '[bd]', to: '[dd]', command: 'draft', ... }]

// 현재 상태에서 가능한 액션 목록
const actions = getAvailableActions('development', '[dd]');
// [{ id: 'review', command: 'review', ... }]
```

---

## 6. 문제 해결

### 6.1 설정이 로드되지 않음

1. `.jjiban/settings/` 디렉토리가 존재하는지 확인
2. 설정 파일이 없으면 기본값이 사용됨 (정상 동작)
3. JSON 파싱 오류 시 콘솔에 경고 메시지 출력됨

### 6.2 캐시 갱신

설정 파일을 수정한 후 반영이 안 되면:

```typescript
import { refreshCache, loadSettings } from '~/server/utils/settings';

// 캐시 무효화 후 재로드
refreshCache();
const settings = await loadSettings();
```

### 6.3 경로 관련 오류

`JJIBAN_BASE_PATH` 환경변수에 `..` (상위 디렉토리 참조)가 포함되면 보안상 무시됩니다.
콘솔에 `[Security] Path traversal detected` 경고가 출력됩니다.

---

## 7. 관련 문서

| 문서 | 위치 |
|------|------|
| 기본설계 | 010-basic-design.md |
| 상세설계 | 020-detail-design.md |
| 설계리뷰 | 021-design-review-claude-1(적용완료).md |
| 코드리뷰 | 031-code-review-claude-1.md |
| 테스트 명세 | 026-test-specification.md |
| 통합테스트 | 070-integration-test.md |

---

**문서 종료**
