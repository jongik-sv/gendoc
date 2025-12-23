# 사용자 매뉴얼: wbs.md 시리얼라이저

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-02 |
| 작성일 | 2025-12-14 |
| 버전 | 1.0 |

---

## 1. 개요

### 1.1 기능 소개
WbsNode[] 트리 구조를 wbs.md 마크다운 형식으로 변환하는 유틸리티 모듈입니다. 파서의 역변환 기능을 제공하며, 데이터 수정 후 파일 저장 시 사용됩니다.

### 1.2 대상 사용자
- Backend 개발자
- WBS 데이터 저장이 필요한 서비스 개발자

---

## 2. 시작하기

### 2.1 사전 요구사항
- Node.js 20.x 이상
- TypeScript 5.x 이상

### 2.2 모듈 위치
```
server/utils/wbs/
├── serializer.ts           # 메인 시리얼라이저
└── serializer/
    ├── header.ts           # 헤더 생성
    ├── attributes.ts       # 속성 포맷팅
    └── metadata.ts         # 메타데이터 블록
```

---

## 3. 사용 방법

### 3.1 기본 사용법

```typescript
import { serializeWbs, calculateMaxDepth } from '~/server/utils/wbs';
import type { WbsNode, WbsMetadata } from '~/types';

// WBS 노드 배열
const nodes: WbsNode[] = [
  {
    id: 'WP-01',
    type: 'wp',
    title: 'Platform Infrastructure',
    status: 'planned',
    children: [/* ... */]
  }
];

// 메타데이터
const metadata: WbsMetadata = {
  version: '1.0',
  depth: calculateMaxDepth(nodes),  // 3 또는 4
  updated: '2025-12-14',
  start: '2025-12-13'
};

// 직렬화
const markdown = serializeWbs(nodes, metadata);

// 파일 저장
await fs.writeFile('.jjiban/projects/myproject/wbs.md', markdown);
```

### 3.2 옵션

```typescript
interface SerializerOptions {
  updateDate?: boolean;  // updated 필드를 현재 날짜로 갱신 (기본: true)
}

// 날짜 갱신 없이 직렬화
const markdown = serializeWbs(nodes, metadata, { updateDate: false });
```

### 3.3 출력 형식

```markdown
# WBS - Project Name

> version: 1.0
> depth: 4
> updated: 2025-12-14
> start: 2025-12-13

---

## WP-01: Platform Infrastructure
- status: planned
- priority: critical
- progress: 50%

### ACT-01-01: Project Setup
- status: in_progress

#### TSK-01-01-01: Initial Setup
- category: development
- status: done [xx]
- priority: high
- assignee: hong

---

## WP-02: Data Layer
...
```

---

## 4. 고급 기능

### 4.1 깊이 자동 계산

```typescript
import { calculateMaxDepth } from '~/server/utils/wbs';

// ACT 노드가 있거나 TSK-XX-XX-XX 패턴이면 4단계
// 그 외는 3단계
const depth = calculateMaxDepth(nodes);  // 3 | 4
```

### 4.2 속성 포맷팅 규칙
- 빈 값은 출력하지 않음
- `requirements`는 들여쓰기 리스트로 출력
- `tags`는 쉼표로 구분
- WP 사이에 `---` 구분선 삽입

### 4.3 보안 기능
- **순환 참조 검출**: 무한 루프 방지, `SerializationError` 발생
- **재귀 깊이 제한**: 최대 10단계
- **노드 수 제한**: 최대 1000개
- **제목 길이 제한**: 최대 200자

---

## 5. 자주 묻는 질문 (FAQ)

### Q1: 순환 참조가 있으면 어떻게 되나요?
**A**: `SerializationError`가 발생합니다.

```typescript
try {
  const markdown = serializeWbs(nodesWithCircularRef, metadata);
} catch (e) {
  if (e instanceof SerializationError) {
    console.error('순환 참조 감지:', e.message);
  }
}
```

### Q2: Project 노드 없이 WP만 있어도 되나요?
**A**: 네, WP 노드들만 전달해도 정상 동작합니다.

### Q3: 메타데이터가 필수인가요?
**A**: 네, 메타데이터 블록이 필수입니다.

---

## 6. 참고 자료
- 상세설계: `020-detail-design.md`
- 파서 매뉴얼: `../TSK-02-02-01/080-manual.md`
- PRD 7.2, 7.3

---

**문서 종료**
