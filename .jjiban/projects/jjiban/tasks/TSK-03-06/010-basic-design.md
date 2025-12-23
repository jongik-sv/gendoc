# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-03-06 |
| Task명 | completed 필드 지원 (Parser/Serializer/API) |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 7.4, 7.5 |
| WBS | `.jjiban/projects/jjiban/wbs.md` | TSK-03-06 요구사항 |

---

## 1. 목적 및 범위

### 1.1 목적

워크플로우 상태 전이 시 각 단계별 완료 시각을 자동으로 기록하고 조회할 수 있도록 `completed` 필드를 지원합니다. 이를 통해 Task의 진행 이력을 추적하고, 실제 소요 시간을 분석할 수 있는 데이터를 확보합니다.

### 1.2 범위

**포함 범위**:
- WBS Parser: wbs.md에서 completed 필드 파싱 (중첩 리스트 형식)
- WBS Serializer: completed 필드를 wbs.md에 직렬화
- Transition API: 상태 전이 시 자동 타임스탬프 기록
- 롤백 처리: 이전 단계로 롤백 시 이후 단계 completed 삭제
- TypeScript 타입 정의 업데이트

**제외 범위**:
- UI 컴포넌트 구현 (Timeline 표시 등) → 향후 Task
- 통계 분석 기능 (평균 소요 시간 계산 등) → 향후 Task
- 이력 조회 API (별도 API로 분리 가능) → 향후 Task

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WBS Parser가 중첩 리스트 형식의 completed 필드 파싱 | High | 섹션 7.5 |
| FR-002 | WBS Serializer가 completed 필드를 올바른 형식으로 직렬화 | High | 섹션 7.5 |
| FR-003 | Transition API 호출 시 자동으로 현재 상태의 완료 시각 기록 | High | 섹션 7.5 |
| FR-004 | 롤백 시 이후 단계의 completed 항목 자동 삭제 | Medium | 섹션 7.5 |
| FR-005 | TypeScript 타입 CompletedTimestamps 정의 및 활용 | High | 코드 품질 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 타임스탬프 형식 일관성 | YYYY-MM-DD HH:mm (로컬 시간) |
| NFR-002 | 기존 wbs.md 파일 호환성 | 100% 하위 호환 |
| NFR-003 | 파싱 성능 | 기존 대비 5% 이내 오버헤드 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

completed 필드는 WBS 데이터 파이프라인 전체에 걸쳐 지원됩니다:

```
wbs.md (마크다운)
    ↓ (파싱)
WbsNode 객체 (completed: CompletedTimestamps)
    ↓ (메모리 상 처리)
Transition API (자동 기록)
    ↓ (직렬화)
wbs.md (마크다운 저장)
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| parseCompleted() | completed 필드 파싱 | 중첩 리스트를 CompletedTimestamps 객체로 변환 |
| serializeAttributes() | completed 필드 직렬화 | CompletedTimestamps 객체를 마크다운 목록으로 변환 |
| executeTransition() | 타임스탬프 자동 기록 | 상태 전이 시 현재 시각을 completed에 추가 |
| handleRollback() | 롤백 처리 로직 | 이후 단계 completed 항목 삭제 (미래 확장) |

### 3.3 데이터 흐름

**파싱 (wbs.md → WbsNode)**
```
- completed:
  - bd: 2025-12-15 10:30
  - dd: 2025-12-15 14:20

↓ parseCompleted()

{ bd: "2025-12-15 10:30", dd: "2025-12-15 14:20" }
```

**직렬화 (WbsNode → wbs.md)**
```
{ bd: "2025-12-15 10:30", dd: "2025-12-15 14:20" }

↓ serializeAttributes()

- completed:
  - bd: 2025-12-15 10:30
  - dd: 2025-12-15 14:20
```

**상태 전이 시 자동 기록**
```
Transition API: [ ] → [bd] (start 명령어)
↓
현재 시각: 2025-12-15 15:30
↓
completed = { bd: "2025-12-15 15:30" }
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 타임스탬프 형식 | ISO 8601 vs YYYY-MM-DD HH:mm | YYYY-MM-DD HH:mm | PRD 7.5 명시, 가독성 우선 |
| 저장 위치 | 별도 파일 vs wbs.md 내부 | wbs.md 내부 | 단일 소스 원칙, Git diff 편의성 |
| 롤백 처리 시점 | 즉시 삭제 vs 보존 | 즉시 삭제 | 데이터 일관성, PRD 요구사항 |
| 파싱 방식 | 정규식 vs 라인별 순회 | 라인별 순회 | 기존 requirements 파싱과 동일 패턴 |

---

## 5. 영향 범위 분석

### 5.1 수정 대상 파일

**Parser (server/utils/wbs/parser/)**
- `_attributes.ts`: parseCompleted() 함수 이미 구현됨 (확인 필요)
- `_types.ts`: NodeAttributes 인터페이스 (이미 completed 포함)

**Serializer (server/utils/wbs/serializer/)**
- `_attributes.ts`: serializeAttributes() 함수에 completed 처리 추가 (이미 구현됨 확인 필요)

**Transition API (server/)**
- `api/tasks/[id]/transition.post.ts`: API 진입점 (수정 불필요)
- `utils/workflow/transitionService.ts`: executeTransition() 함수에 타임스탬프 기록 로직 추가 (이미 구현됨 확인 필요)

**Types (types/)**
- `index.ts`: CompletedTimestamps 타입 (이미 정의됨)

### 5.2 기존 구현 확인 사항

**파서 (_attributes.ts 라인 82-84)**
```typescript
case 'completed':
  // TSK-03-06: completed 속성 (중첩 리스트 형식)
  attributes.completed = parseCompleted(lines, i + 1);
  break;
```
→ **이미 구현됨** (라인 223-254에 parseCompleted 함수 존재)

**시리얼라이저 (_attributes.ts 라인 66-72)**
```typescript
// TSK-03-06: completed (단계별 완료시각)
if (node.completed && Object.keys(node.completed).length > 0) {
  lines.push(`- completed:`);
  for (const [key, value] of Object.entries(node.completed)) {
    lines.push(`  - ${key}: ${value}`);
  }
}
```
→ **이미 구현됨**

**Transition API (transitionService.ts 라인 199-219)**
```typescript
// TSK-03-06: 현재 시각을 "YYYY-MM-DD HH:mm" 형식으로 포맷
const now = new Date();
const completedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

// 트리에서 Task 노드 찾아서 상태 업데이트
function updateTaskStatus(nodes: any[]): boolean {
  for (const node of nodes) {
    if (node.id === taskId && node.type === 'task') {
      node.status = newStatus;

      // TSK-03-06: completed 필드에 완료 시각 기록
      const newStatusCode = extractStatusCode(newStatus);
      if (newStatusCode) {
        if (!node.completed) {
          node.completed = {};
        }
        node.completed[newStatusCode] = completedTimestamp;
      }
      return true;
    }
    // ... 재귀 탐색
  }
}
```
→ **이미 구현됨**

**타입 정의 (types/index.ts 라인 28, 49)**
```typescript
export type CompletedTimestamps = Record<string, string>;

export interface WbsNode {
  // ...
  completed?: CompletedTimestamps;
}
```
→ **이미 정의됨**

---

## 6. 구현 세부 사항

### 6.1 Parser 구현 (parseCompleted)

**이미 구현됨 확인:**
- 위치: `server/utils/wbs/parser/_attributes.ts` (라인 223-254)
- 기능: 중첩 리스트 형식 파싱
- 반환: `CompletedTimestamps` 객체

**검증 항목:**
- [ ] 빈 completed 필드 처리 (빈 객체 반환)
- [ ] 잘못된 형식 라인 무시
- [ ] 새로운 속성 시작 시 파싱 중단
- [ ] 빈 줄 처리

### 6.2 Serializer 구현 (serializeAttributes)

**이미 구현됨 확인:**
- 위치: `server/utils/wbs/serializer/_attributes.ts` (라인 66-72)
- 기능: CompletedTimestamps를 마크다운 목록으로 변환
- 정렬: Object.entries() 순서 (삽입 순서 유지)

**검증 항목:**
- [ ] 빈 completed 객체 처리 (출력 안 함)
- [ ] 키-값 쌍 올바른 들여쓰기
- [ ] 다른 속성과의 순서 (completed는 ref 다음)

### 6.3 Transition API 구현 (executeTransition)

**이미 구현됨 확인:**
- 위치: `server/utils/workflow/transitionService.ts` (라인 199-219)
- 기능: 상태 전이 시 자동 타임스탬프 기록
- 형식: `YYYY-MM-DD HH:mm` (로컬 시간)

**검증 항목:**
- [ ] 기존 completed 객체 보존
- [ ] 새 상태 코드 키로 타임스탬프 추가
- [ ] 중복 전이 시 덮어쓰기 동작

### 6.4 롤백 처리 (미래 확장)

**현재 미구현 사항:**
- 롤백 시나리오: `[im]` → `[dd]`로 되돌릴 때
- 기대 동작: `im`, `vf`, `xx` 완료 시각 삭제
- 구현 위치: `transitionService.ts`의 executeTransition()

**설계 방향:**
1. 카테고리별 워크플로우 단계 순서 정의 (WORKFLOW_STEPS 활용)
2. 롤백 감지: 새 상태가 현재 상태보다 앞선 경우
3. 이후 단계의 completed 키 삭제

**구현 예시 (의사 코드):**
```typescript
// 워크플로우 순서 가져오기
const workflow = WORKFLOW_STEPS[category];
const currentIndex = workflow.findIndex(s => s.code === currentStatus);
const newIndex = workflow.findIndex(s => s.code === newStatus);

// 롤백인 경우
if (newIndex < currentIndex) {
  // newIndex 이후의 모든 단계 키 삭제
  for (let i = newIndex + 1; i < workflow.length; i++) {
    const stepCode = extractStatusCode(workflow[i].code);
    if (stepCode && node.completed) {
      delete node.completed[stepCode];
    }
  }
}
```

---

## 7. 인수 기준

- [ ] AC-01: wbs.md에 completed 필드가 있는 Task를 파싱하여 CompletedTimestamps 객체로 변환
- [ ] AC-02: WbsNode의 completed 객체를 wbs.md에 올바른 형식으로 직렬화
- [ ] AC-03: Transition API 호출 시 현재 상태의 완료 시각이 completed 필드에 자동 기록
- [ ] AC-04: 타임스탬프 형식이 "YYYY-MM-DD HH:mm"로 일관성 있게 저장됨
- [ ] AC-05: 기존 completed 항목이 새 전이 시에도 보존됨
- [ ] AC-06: 단위 테스트로 Parser, Serializer, Transition 기능 검증
- [ ] AC-07: E2E 테스트로 전체 워크플로우 실행 후 completed 필드 확인

---

## 8. 리스크 및 의존성

### 8.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 기존 wbs.md 파일에 completed 없음 | Low | 하위 호환성 유지 (completed 없으면 빈 객체) |
| 타임존 불일치 (서버 시간 vs 로컬 시간) | Medium | 명확히 로컬 시간 사용, 문서화 |
| 롤백 시나리오 미구현 | Low | 향후 Task로 분리 가능 |

### 8.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-02-02-01 | 선행 | WBS Parser 기본 구현 |
| TSK-02-02-02 | 선행 | WBS Serializer 기본 구현 |
| TSK-03-03 | 선행 | Transition API 기본 구현 |
| TSK-03-04 | 선행 | Workflow Engine (WORKFLOW_STEPS 활용) |

---

## 9. 테스트 전략

### 9.1 단위 테스트

**Parser 테스트 (parseCompleted)**
- 정상 케이스: 여러 단계 완료 시각 파싱
- 빈 completed 필드
- 잘못된 형식 라인 무시
- 새로운 속성 시작 시 중단

**Serializer 테스트 (serializeAttributes)**
- 정상 케이스: completed 객체를 마크다운으로 변환
- 빈 completed 객체 (출력 안 함)
- 여러 단계 타임스탬프 순서 유지

**Transition API 테스트 (executeTransition)**
- 상태 전이 시 타임스탬프 자동 기록
- 기존 completed 항목 보존
- 새 completed 객체 생성 (최초 전이)

### 9.2 통합 테스트

- wbs.md 파싱 → WbsNode → 직렬화 → wbs.md (왕복 테스트)
- Transition API 호출 → wbs.md 저장 → 재파싱하여 completed 확인

### 9.3 E2E 테스트

- 전체 워크플로우 실행: [ ] → [bd] → [dd] → [im] → [vf] → [xx]
- 각 단계 완료 후 wbs.md에서 completed 필드 확인
- UI에서 Task 상세 패널의 이력 표시 (향후)

---

## 10. 구현 검증 사항

### 10.1 기존 코드 리뷰

이미 구현된 기능들이 올바르게 동작하는지 확인이 필요합니다:

**파서 검증:**
- [ ] `parseCompleted()` 함수가 올바른 형식으로 파싱하는지
- [ ] INDENT_LIST_PATTERN이 "  - bd: 2025-12-15 10:30" 형식을 올바르게 매칭하는지
- [ ] 새로운 속성이나 빈 줄에서 올바르게 중단하는지

**시리얼라이저 검증:**
- [ ] completed 필드가 올바른 위치에 출력되는지 (ref 다음)
- [ ] 들여쓰기가 2칸 공백으로 정확히 적용되는지
- [ ] 빈 completed 객체가 출력되지 않는지

**Transition API 검증:**
- [ ] extractStatusCode()가 "[bd]" → "bd" 변환을 올바르게 수행하는지
- [ ] 타임스탬프 형식이 "YYYY-MM-DD HH:mm"로 정확한지
- [ ] completed 객체가 없을 때 초기화하는지
- [ ] 기존 completed 항목을 보존하는지

### 10.2 새로 구현할 기능 (향후)

- [ ] 롤백 처리 로직 (이후 단계 completed 삭제)
- [ ] UI에서 completed 필드 표시 (Timeline 컴포넌트)
- [ ] 통계 분석 (평균 소요 시간 계산)

---

## 11. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행
- 기존 구현 코드 리뷰 및 테스트 작성
- 롤백 처리 로직 설계 (필요 시 별도 Task 생성)

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 7.4, 7.5)
- WBS: `.jjiban/projects/jjiban/wbs.md` (TSK-03-06)
- 상세설계: `020-detail-design.md` (다음 단계)
- Parser 구현: `server/utils/wbs/parser/_attributes.ts`
- Serializer 구현: `server/utils/wbs/serializer/_attributes.ts`
- Transition API: `server/utils/workflow/transitionService.ts`

---

<!--
author: AI Agent
Template Version: 1.0.0
-->
