# 사용자 매뉴얼: wbs.md 파서

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-01 |
| 작성일 | 2025-12-14 |
| 버전 | 1.0 |

---

## 1. 개요

### 1.1 기능 소개
wbs.md 마크다운 파일을 파싱하여 WbsNode[] 트리 구조로 변환하는 유틸리티 모듈입니다. WBS(Work Breakdown Structure)의 계층 구조와 각 노드의 속성을 추출합니다.

### 1.2 대상 사용자
- Backend 개발자
- WBS 데이터 처리가 필요한 서비스 개발자

---

## 2. 시작하기

### 2.1 사전 요구사항
- Node.js 20.x 이상
- TypeScript 5.x 이상

### 2.2 모듈 위치
```
server/utils/wbs/parser/
├── index.ts          # 메인 파서 함수
├── header.ts         # 헤더 파싱
├── attributes.ts     # 속성 파싱
├── tree.ts           # 트리 빌드
├── patterns.ts       # 정규식 패턴
└── types.ts          # 내부 타입
```

---

## 3. 사용 방법

### 3.1 기본 사용법

```typescript
import { parseWbsMarkdown } from '~/server/utils/wbs';

// wbs.md 파일 내용 읽기
const wbsContent = await fs.readFile('.jjiban/projects/myproject/wbs.md', 'utf-8');

// 파싱
const nodes: WbsNode[] = parseWbsMarkdown(wbsContent);

// 결과 사용
console.log(nodes.length); // WP 개수
console.log(nodes[0].children); // 첫 번째 WP의 자식 노드들
```

### 3.2 반환 타입

```typescript
interface WbsNode {
  id: string;           // 'WP-01', 'ACT-01-01', 'TSK-01-01-01'
  type: 'wp' | 'act' | 'task';
  title: string;
  status?: string;      // 'done [xx]', 'implement [im]'
  category?: 'development' | 'defect' | 'infrastructure';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  schedule?: { start: string; end: string };
  tags?: string[];
  depends?: string;
  requirements?: string[];
  ref?: string;
  progress?: number;    // 자동 계산된 진행률 (0-100)
  taskCount?: number;   // 하위 Task 개수
  children: WbsNode[];
}
```

### 3.3 지원 구조

**4단계 구조** (대규모 프로젝트):
```
## WP-01: Work Package
### ACT-01-01: Activity
#### TSK-01-01-01: Task
```

**3단계 구조** (소규모 프로젝트):
```
## WP-01: Work Package
### TSK-01-01: Task (ACT 없이 직접 WP 하위)
```

### 3.4 속성 파싱

지원되는 9개 속성:
| 속성 | 형식 | 예시 |
|------|------|------|
| category | `- category: {value}` | `- category: development` |
| status | `- status: {text} [{code}]` | `- status: done [xx]` |
| priority | `- priority: {value}` | `- priority: high` |
| assignee | `- assignee: {name}` | `- assignee: hong` |
| schedule | `- schedule: {start} ~ {end}` | `- schedule: 2025-01-01 ~ 2025-01-07` |
| tags | `- tags: {tag1}, {tag2}` | `- tags: api, backend` |
| depends | `- depends: {id}` | `- depends: TSK-01-01-01` |
| requirements | 들여쓰기 리스트 | `- requirements:\n  - item 1` |
| ref | `- ref: {reference}` | `- ref: PRD 7.1` |

---

## 4. 고급 기능

### 4.1 진행률 자동 계산
WP와 ACT 노드의 `progress`는 하위 Task의 완료 상태를 기반으로 자동 계산됩니다.

```typescript
// status가 'done [xx]'인 Task만 완료로 간주
// progress = (완료된 Task 수 / 전체 Task 수) * 100
```

### 4.2 에러 처리
잘못된 형식의 헤더나 속성은 무시되고 파싱이 계속됩니다.

```typescript
// 잘못된 헤더 (무시됨)
## Invalid Header Without ID

// 올바른 헤더 (파싱됨)
## WP-01: Valid Header
```

---

## 5. 자주 묻는 질문 (FAQ)

### Q1: 빈 파일을 파싱하면 어떻게 되나요?
**A**: 빈 배열 `[]`이 반환됩니다.

### Q2: 상태 코드가 없으면 어떻게 되나요?
**A**: `status` 필드는 undefined가 됩니다.

### Q3: 부모 노드가 없는 고아 노드는 어떻게 처리되나요?
**A**: 루트 레벨에 배치됩니다 (콘솔 경고 출력).

---

## 6. 참고 자료
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- PRD 7.2, 7.3

---

**문서 종료**
