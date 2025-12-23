# 사용자 매뉴얼: WBS 데이터 유효성 검증

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-03 |
| 작성일 | 2025-12-14 |
| 버전 | 1.0 |

---

## 1. 개요

### 1.1 기능 소개
WbsNode[] 트리 구조의 데이터 무결성을 검증하는 유틸리티 모듈입니다. ID 형식, 필수 속성, 상태 코드, 중복 ID, 계층 관계를 검사합니다.

### 1.2 대상 사용자
- Backend 개발자
- WBS 데이터 저장 전 유효성 검사가 필요한 서비스 개발자

---

## 2. 시작하기

### 2.1 사전 요구사항
- Node.js 20.x 이상
- TypeScript 5.x 이상

### 2.2 모듈 위치
```
server/utils/wbs/validation/
├── index.ts                    # 메인 검증 함수
├── types.ts                    # 타입 정의
└── validators/
    ├── id-validator.ts         # ID 형식 검증
    ├── attribute-validator.ts  # 필수 속성 검증
    ├── status-validator.ts     # 상태 코드 검증
    ├── hierarchy-validator.ts  # 계층 관계 검증
    └── duplicate-checker.ts    # 중복 ID 검사
```

---

## 3. 사용 방법

### 3.1 기본 사용법

```typescript
import { validateWbs } from '~/server/utils/wbs';
import type { WbsNode, ValidationResult } from '~/types';

// WBS 노드 배열
const nodes: WbsNode[] = [/* ... */];

// 검증
const result: ValidationResult = validateWbs(nodes);

if (result.isValid) {
  console.log('유효한 WBS 데이터입니다.');
} else {
  console.log('검증 오류:', result.errors);
}
```

### 3.2 반환 타입

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validatedAt: string;  // ISO 8601 timestamp
}

interface ValidationError {
  code: string;      // 'ID_FORMAT', 'MISSING_ATTR', ...
  message: string;   // 사람이 읽을 수 있는 메시지
  nodeId?: string;   // 오류가 발생한 노드 ID
  field?: string;    // 오류가 발생한 필드명
}
```

### 3.3 검증 옵션

```typescript
interface ValidationOptions {
  failFast?: boolean;  // 첫 오류 시 즉시 반환 (기본: false)
  depth?: 3 | 4;       // Task ID 검증에 사용할 깊이
}

// 첫 오류에서 중단
const result = validateWbs(nodes, { failFast: true });
```

---

## 4. 검증 규칙

### 4.1 ID 형식 검증

| 타입 | 패턴 | 예시 |
|------|------|------|
| WP | `WP-XX` | WP-01, WP-99 |
| ACT | `ACT-XX-XX` | ACT-01-01 |
| TSK (4단계) | `TSK-XX-XX-XX` | TSK-01-01-01 |
| TSK (3단계) | `TSK-XX-XX` | TSK-01-01 |

### 4.2 필수 속성 검증 (Task만)

| 속성 | 필수 여부 | 유효 값 |
|------|----------|---------|
| category | 필수 | `development`, `defect`, `infrastructure` |
| status | 필수 | `[ ]`, `[bd]`, `[dd]`, `[im]`, `[vf]`, `[xx]` 등 |
| priority | 필수 | `critical`, `high`, `medium`, `low` |

### 4.3 상태 코드 검증

유효한 상태 코드:
```
[ ]   - Todo
[bd]  - 기본설계
[dd]  - 상세설계
[an]  - 분석
[ds]  - 설계
[im]  - 구현
[fx]  - 수정
[vf]  - 검증
[xx]  - 완료
```

### 4.4 계층 관계 검증

- ACT의 ID 접두사는 부모 WP ID와 일치해야 함
- TSK의 ID 접두사는 부모 ACT 또는 WP ID와 일치해야 함

```
WP-01
├── ACT-01-01  (✅ 접두사 01 일치)
│   └── TSK-01-01-01  (✅ 접두사 01-01 일치)
└── ACT-02-01  (❌ 접두사 02 불일치)
```

### 4.5 중복 ID 검사

동일한 ID가 2개 이상 존재하면 오류

---

## 5. 에러 코드

| 코드 | 설명 | 예시 |
|------|------|------|
| `ID_FORMAT` | ID 형식 불일치 | `WP-1` (두 자리 필요) |
| `MISSING_ATTR` | 필수 속성 누락 | category 없음 |
| `INVALID_VALUE` | 잘못된 속성 값 | `category: unknown` |
| `INVALID_STATUS` | 잘못된 상태 코드 | `[invalid]` |
| `DUPLICATE_ID` | 중복 ID | WP-01이 2개 |
| `HIERARCHY_MISMATCH` | 계층 불일치 | ACT-02-01이 WP-01 하위 |

---

## 6. 개별 검증 함수

고급 사용자를 위한 개별 검증 함수:

```typescript
import {
  validateId,
  validateAttributes,
  validateStatus,
  validateHierarchy,
  checkDuplicates,
  isValidStatus
} from '~/server/utils/wbs/validation';

// 개별 ID 검증
const idError = validateId('WP-01', 'wp');

// 상태 유효성 확인
const isValid = isValidStatus('[xx]');  // true
```

---

## 7. 자주 묻는 질문 (FAQ)

### Q1: WP와 ACT 노드도 필수 속성 검증이 적용되나요?
**A**: 아니요, category/status/priority 필수 검증은 Task 노드에만 적용됩니다.

### Q2: 빈 WBS 트리도 유효한가요?
**A**: 네, 빈 배열 `[]`은 유효한 것으로 간주됩니다.

### Q3: 검증 순서가 중요한가요?
**A**: 순서에 관계없이 모든 검증이 수행됩니다 (`failFast: false` 시).

---

## 8. 참고 자료
- 상세설계: `020-detail-design.md`
- 테스트 명세: `026-test-specification.md`
- PRD 7.3, 7.4

---

**문서 종료**
