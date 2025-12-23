# 테스트 프레임워크 매뉴얼 (080-manual.md)

**Task ID:** TSK-06-02
**Version:** 1.0
**Last Updated:** 2025-12-16

---

## 1. 개요

이 문서는 jjiban 프로젝트의 테스트 프레임워크 사용 방법을 설명합니다.

### 1.1 테스트 도구

| 도구 | 용도 | 설정 파일 |
|------|------|----------|
| Vitest | 단위/컴포넌트 테스트 | `vitest.config.ts` |
| Playwright | E2E 테스트 | `playwright.config.ts` |
| @vue/test-utils | Vue 컴포넌트 테스트 | - |

---

## 2. 테스트 실행

### 2.1 기본 명령어

```bash
# 전체 단위 테스트 실행
npm run test

# 감시 모드 (파일 변경 시 자동 실행)
npm run test:watch

# 커버리지 측정
npm run test:coverage

# E2E 테스트 실행
npm run test:e2e
```

### 2.2 특정 테스트 실행

```bash
# 특정 파일 테스트
npx vitest run tests/helpers/e2e-helpers.ts

# 패턴으로 필터링
npx vitest run --testNamePattern "TC-210"
```

---

## 3. 테스트 헬퍼 사용법

### 3.1 컴포넌트 테스트 헬퍼

**파일:** `tests/helpers/component-helpers.ts`

```typescript
import { mountWithPinia, findByTestId, waitFor, waitUntil } from '@/tests/helpers/component-helpers';

// Pinia와 PrimeVue가 설정된 상태로 컴포넌트 마운트
const wrapper = mountWithPinia(MyComponent, {
  props: { myProp: 'value' }
});

// data-testid로 요소 찾기
const button = findByTestId(wrapper, 'submit-button');

// 비동기 작업 대기
await waitFor(350); // 350ms 대기

// 조건이 만족될 때까지 폴링
await waitUntil(() => wrapper.vm.isLoaded);
```

### 3.2 E2E 테스트 헬퍼

**파일:** `tests/helpers/e2e-helpers.ts`

```typescript
import { waitForPageReady, waitForWbsLoaded, checkAccessibility } from '@/tests/helpers/e2e-helpers';

// 페이지 로드 대기
await waitForPageReady(page);

// WBS 데이터 로딩 대기
await waitForWbsLoaded(page);

// 접근성 검증
await checkAccessibility(page);
```

### 3.3 테스트 상수

**파일:** `tests/helpers/constants.ts`

```typescript
import { TEST_TIMEOUTS, POLLING } from '@/tests/helpers/constants';

// 타임아웃 상수 사용
await page.waitForTimeout(TEST_TIMEOUTS.DEBOUNCE_WAIT + TEST_TIMEOUTS.DEBOUNCE_SAFETY_MARGIN);
await page.waitForTimeout(TEST_TIMEOUTS.ANIMATION);

// 폴링 설정
await waitUntil(condition, {
  timeout: POLLING.DEFAULT_TIMEOUT,
  interval: POLLING.DEFAULT_INTERVAL
});
```

**주요 상수:**

| 상수 | 값 | 용도 |
|------|-----|------|
| `TEST_TIMEOUTS.DEBOUNCE_WAIT` | 350ms | Debounce 대기 |
| `TEST_TIMEOUTS.DEBOUNCE_SAFETY_MARGIN` | 50ms | Debounce 안전 마진 |
| `TEST_TIMEOUTS.ANIMATION` | 200ms | 애니메이션 대기 |
| `TEST_TIMEOUTS.PAGE_READY` | 30000ms | 페이지 로드 타임아웃 |
| `TEST_TIMEOUTS.WBS_LOAD` | 15000ms | WBS 데이터 로드 타임아웃 |
| `POLLING.DEFAULT_TIMEOUT` | 5000ms | 폴링 기본 타임아웃 |
| `POLLING.DEFAULT_INTERVAL` | 50ms | 폴링 기본 간격 |

---

## 4. Mock 데이터

### 4.1 WBS 노드 Mock

**파일:** `tests/fixtures/mock-data/wbs-nodes.ts`

```typescript
import { minimalWbsTree, complexWbsTree, emptyWbsTree, searchTestTree } from '@/tests/fixtures/mock-data/wbs-nodes';

// 최소 트리 (3단계)
const tree = minimalWbsTree;

// 복잡한 트리 (4단계, 다양한 상태)
const tree = complexWbsTree;

// 빈 트리
const tree = emptyWbsTree;

// 검색 테스트용 트리
const tree = searchTestTree;

// 대량 데이터 생성 (성능 테스트용)
import { generateLargeWbs } from '@/tests/fixtures/mock-data/wbs-nodes';
const largeMarkdown = generateLargeWbs(1000); // 1000개 노드
```

### 4.2 API 응답 Mock

**파일:** `tests/fixtures/mock-data/api-responses.ts`

```typescript
import { successResponse, errorResponse } from '@/tests/fixtures/mock-data/api-responses';
```

---

## 5. 테스트 작성 가이드

### 5.1 Given-When-Then 패턴

모든 테스트는 Given-When-Then 패턴을 따릅니다:

```typescript
it('TC-210: 검색어 입력 시 debounce 적용', async () => {
  // Given: 컴포넌트 마운트
  const wrapper = mountWithPinia(WbsSearchBox);
  const input = findByTestId(wrapper, 'search-input');

  // When: 검색어 입력
  await input.setValue('TSK');

  // Then: debounce 후 store 업데이트
  await waitFor(TEST_TIMEOUTS.DEBOUNCE_WAIT + TEST_TIMEOUTS.DEBOUNCE_SAFETY_MARGIN);
  expect(store.searchQuery).toBe('TSK');
});
```

### 5.2 테스트 케이스 ID 규칙

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `UT-` | 단위 테스트 | `UT-001`, `UT-TASK-01-01` |
| `TC-` | 컴포넌트 테스트 | `TC-201`, `TC-210` |
| `E2E-` | E2E 테스트 | `E2E-010`, `E2E-020` |
| `AT-` | API 테스트 | `AT-001` |

---

## 6. 접근성 테스트

### 6.1 자동 접근성 검증

`checkAccessibility()` 함수는 다음을 검증합니다:

1. **ARIA role 유효성**: 유효한 ARIA role만 사용
2. **버튼 레이블**: 모든 버튼에 접근 가능한 레이블
3. **입력 요소 레이블**: 모든 입력 요소에 레이블 또는 aria-label
4. **포커스 가능 요소**: 키보드 접근 가능 요소 존재

```typescript
// E2E 테스트에서 사용
test('E2E-030: 접근성 검증', async ({ page }) => {
  await page.goto('/wbs?project=test');
  await waitForPageReady(page);
  await checkAccessibility(page);
});
```

---

## 7. 문제 해결

### 7.1 Flaky 테스트 방지

- 매직 넘버 대신 `TEST_TIMEOUTS` 상수 사용
- `waitForWbsLoaded()` 등 안정성 강화 헬퍼 사용
- 명시적 대기보다 조건 기반 대기 선호

### 7.2 콘솔 경고 필터링

`tests/helpers/setup.ts`에서 테스트 노이즈를 필터링합니다:

```typescript
// 필터링되는 경고
SUPPRESSED_WARNINGS = [
  'Extraneous non-props',
  'Hydration',
  'experimental'
];

// 필터링되는 에러
SUPPRESSED_ERRORS = [
  'Not implemented: HTMLFormElement.prototype.submit',
  'Not implemented: navigation'
];
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2025-12-16 | 초안 작성 | Claude |

---

<!--
author: Claude
Template Version: 1.0.0
Created: 2025-12-16
-->
