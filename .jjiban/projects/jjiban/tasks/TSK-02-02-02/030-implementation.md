# 구현: wbs.md 시리얼라이저 구현

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-02 |
| Category | development |
| 상태 | [im] 구현 |
| 구현일 | 2025-12-14 |
| 상세설계 참조 | 020-detail-design.md |

---

## 1. 구현 개요

### 1.1 구현 범위
- WbsNode[] 트리 구조를 wbs.md 마크다운 형식으로 변환하는 시리얼라이저
- 상세설계 문서에 정의된 모든 인터페이스 및 알고리즘 구현

### 1.2 구현 파일

| 파일 경로 | 역할 |
|----------|------|
| `types/index.ts` | 타입 정의 확장 (WbsMetadata, SerializerContext, SerializerOptions, SerializationError) |
| `server/utils/wbs/serializer.ts` | 메인 시리얼라이저 |
| `server/utils/wbs/serializer/header.ts` | 헤더 생성 함수 |
| `server/utils/wbs/serializer/attributes.ts` | 속성 포맷팅 함수 |
| `server/utils/wbs/serializer/metadata.ts` | 메타데이터 생성 함수 |
| `server/utils/wbs/index.ts` | 모듈 내보내기 |
| `tests/utils/wbs/serializer.test.ts` | 단위 테스트 |

---

## 2. 타입 정의

### 2.1 추가된 타입 (types/index.ts)

```typescript
// 일정 범위
export interface ScheduleRange {
  start: string;  // YYYY-MM-DD
  end: string;    // YYYY-MM-DD
}

// WBS 메타데이터
export interface WbsMetadata {
  version: string;
  depth: 3 | 4;
  updated: string;  // YYYY-MM-DD
  start: string;    // YYYY-MM-DD
}

// 시리얼라이저 컨텍스트
export interface SerializerContext {
  currentDepth: number;
  wpCount: number;
  maxDepth: number;
  visited: Set<string>;
}

// 시리얼라이저 옵션
export interface SerializerOptions {
  updateDate?: boolean;  // updated 필드를 현재 날짜로 갱신할지 여부
}

// 시리얼라이저 에러
export class SerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}
```

### 2.2 WbsNode 확장

```typescript
export interface WbsNode {
  id: string;
  type: WbsNodeType;
  title: string;
  status?: string;  // 파서 호환을 위해 string으로 확장
  category?: TaskCategory;
  priority?: Priority;
  assignee?: string;
  schedule?: ScheduleRange;
  tags?: string[];
  depends?: string;
  requirements?: string[];
  ref?: string;
  progress?: number;
  taskCount?: number;
  children: WbsNode[];
  expanded?: boolean;
}
```

---

## 3. 구현 상세

### 3.1 serializeHeader (header.ts)

노드 타입에 따른 마크다운 헤더 생성:
- project → `# WBS - {title}`
- wp → `## {id}: {title}`
- act → `### {id}: {title}`
- task (4단계) → `#### {id}: {title}`
- task (3단계) → `### {id}: {title}`

### 3.2 serializeAttributes (attributes.ts)

노드 속성을 마크다운 목록으로 포맷팅:
- 순서: category, status, priority, assignee, schedule, tags, depends, requirements, ref, progress
- 빈 값은 출력하지 않음
- requirements는 들여쓰기 처리

### 3.3 buildMetadataBlock (metadata.ts)

메타데이터 블록 생성:
```markdown
> version: 1.0
> depth: 4
> updated: 2025-12-14
> start: 2025-12-13
```

`updateDate: false` 옵션으로 날짜 갱신 방지 가능

### 3.4 serializeWbs (serializer.ts)

메인 직렬화 함수:
1. 입력 검증 (null 체크, 노드 수 제한)
2. 최대 깊이 계산 (3단계 vs 4단계)
3. 메타데이터 블록 생성
4. 트리 순회하며 노드 직렬화
5. WP 사이 구분선 삽입
6. 최종 마크다운 문자열 조립

### 3.5 보안 기능

- 순환 참조 감지: visited Set으로 추적, 감지 시 SerializationError 발생
- 재귀 깊이 제한: 최대 10단계
- 노드 수 제한: 최대 1000개
- 제목 길이 제한: 최대 200자

---

## 4. 테스트 결과

### 4.1 테스트 실행

```bash
npm run test
```

### 4.2 테스트 통과 현황

| 테스트 그룹 | 테스트 수 | 결과 |
|------------|---------|------|
| serializeHeader | 6 | ✅ 통과 |
| serializeAttributes | 14 | ✅ 통과 |
| buildMetadataBlock | 3 | ✅ 통과 |
| calculateMaxDepth | 4 | ✅ 통과 |
| serializeWbs | 7 | ✅ 통과 |
| **Total** | **34** | **✅ 모두 통과** |

### 4.3 주요 테스트 케이스

- 4단계/3단계 구조 직렬화
- 모든 속성 포맷팅
- 순환 참조 감지
- 빈 트리 처리
- WP 구분선 삽입

---

## 5. 사용 예시

```typescript
import { serializeWbs } from '~/server/utils/wbs';
import type { WbsNode, WbsMetadata } from '~/types';

const nodes: WbsNode[] = [
  {
    id: 'jjiban',
    type: 'project',
    title: 'jjiban',
    children: [
      {
        id: 'WP-01',
        type: 'wp',
        title: 'Platform Infrastructure',
        status: 'planned',
        priority: 'critical',
        children: [...]
      }
    ]
  }
];

const metadata: WbsMetadata = {
  version: '1.0',
  depth: 4,
  updated: '2025-12-14',
  start: '2025-12-13'
};

const markdown = serializeWbs(nodes, metadata);
// 결과: wbs.md 형식의 마크다운 문자열
```

---

## 6. 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2025-12-14 | 초기 구현 | Claude |

---

## 관련 문서
- 상세설계: `020-detail-design.md`
- 기본설계: `010-basic-design.md`
- 파서 설계: `../TSK-02-02-01/020-detail-design.md`
