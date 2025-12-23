# 설계 리뷰 (021-design-review-claude-1.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **리뷰 목적**
> * 테스트 전략 적절성 검증
> * 커버리지 목표 달성 가능성 평가
> * 누락된 테스트 케이스 식별
> * 테스트 구현 리스크 분석

---

## 0. 리뷰 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-02 |
| Task명 | Testing |
| Category | development (test) |
| 리뷰 대상 | 020-detail-design.md |
| 리뷰어 | Claude (Refactoring Expert) |
| 리뷰 일자 | 2025-12-15 |
| 리뷰 결과 | **승인 (조건부)** |

---

## 1. 전체 평가

### 1.1 종합 의견

**긍정적 요소**:
- 테스트 전략이 체계적이고 포괄적임
- Given-When-Then 패턴을 일관되게 적용
- 단위/컴포넌트/E2E 테스트 레벨이 명확히 구분됨
- 커버리지 목표(80%)가 현실적이고 측정 가능함
- Mock 데이터와 헬퍼 함수 설계가 재사용성을 고려함

**개선 필요 요소**:
- 일부 테스트 케이스의 검증 범위가 불충분함
- E2E 테스트의 안정성(flakiness) 관리 전략 보완 필요
- 성능 테스트 케이스가 부족함
- CI/CD 통합 시 병렬 실행 전략 구체화 필요

**결론**: 설계 문서는 전반적으로 우수하나, 아래 개선 사항 반영 후 구현 진행 권장

---

## 2. 아키텍처 리뷰

### 2.1 테스트 디렉토리 구조 (섹션 1.1)

**평가**: ✅ 우수

**긍정**:
- 테스트 유형별 명확한 폴더 분리
- Fixtures와 Mock 데이터 분리로 유지보수성 향상
- 헬퍼 함수 중앙화로 재사용성 확보

**개선 제안**:
```
tests/
├── performance/           # [NEW] 성능 테스트 추가
│   └── wbs-rendering.perf.ts
└── visual/                # [NEW] 시각적 회귀 테스트 (향후)
    └── snapshots/
```

**근거**: 1000+ 노드 렌더링 성능이 중요한 요구사항인데, 현재 설계에서는 TC-052만으로 부족함

---

### 2.2 Vitest 설정 (섹션 1.2)

**평가**: ✅ 적절

**긍정**:
- 커버리지 임계값 설정이 명확함
- 병렬 실행 설정으로 빠른 피드백 확보

**개선 제안 1 - 타임아웃 차별화**:
```typescript
test: {
  testTimeout: 10000, // 일반 테스트
  hookTimeout: 30000, // setup/teardown은 여유있게
}
```

**개선 제안 2 - 커버리지 제외 범위 명확화**:
```typescript
coverage: {
  exclude: [
    '**/node_modules/**',
    '**/tests/**',
    '**/*.d.ts',
    '**/index.ts',
    'nuxt.config.ts',
    'vitest.config.ts',
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/mock-data/**',        // [NEW] Mock 데이터 제외
    '**/.nuxt/**',            // [NEW] Nuxt 빌드 파일
    '**/dist/**'              // [NEW] 빌드 결과물
  ]
}
```

---

### 2.3 Playwright 설정 (섹션 1.2)

**평가**: ⚠️ 개선 필요

**문제점**:
- `retries: process.env.CI ? 2 : 0`은 flaky 테스트를 숨길 수 있음
- 테스트 격리(isolation) 전략이 명시되지 않음

**개선 제안 1 - 재시도 전략 개선**:
```typescript
retries: {
  // 네트워크/타이밍 이슈는 재시도
  'network-timeout': 2,
  'element-not-found': 1,

  // 로직 에러는 재시도하지 않음
  'assertion-error': 0
}
```

**개선 제안 2 - 테스트 격리 추가**:
```typescript
use: {
  baseURL: 'http://localhost:3333',

  // 테스트 격리
  storageState: undefined, // 각 테스트마다 초기 상태

  // 안정성 향상
  actionTimeout: 10000,
  navigationTimeout: 30000,

  // 디버깅 지원
  trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
}
```

---

## 3. 테스트 헬퍼 리뷰

### 3.1 컴포넌트 헬퍼 (섹션 2.2)

**평가**: ✅ 우수

**긍정**:
- `mountWithPinia` 헬퍼로 반복 코드 제거
- `findByTestId` 유틸리티로 가독성 향상

**개선 제안 - 비동기 대기 헬퍼 강화**:
```typescript
/**
 * 조건이 만족될 때까지 폴링
 */
export async function waitUntil(
  fn: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await fn()) return;
    await waitFor(interval);
  }

  throw new Error(`waitUntil timeout after ${timeout}ms`);
}

// 사용 예시
await waitUntil(() => store.loading === false);
```

---

### 3.2 E2E 헬퍼 (섹션 2.3)

**평가**: ⚠️ 개선 필요

**문제점 1 - `waitForWbsLoaded`의 안정성**:
현재 설계는 단순히 로딩 스피너 사라질 때까지 대기하는데, 네트워크 지연 시 불안정할 수 있음

**개선 제안**:
```typescript
export async function waitForWbsLoaded(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  // 1. 로딩 스피너 사라질 때까지 대기
  await page.waitForSelector('[data-testid="wbs-loading"]', {
    state: 'hidden',
    timeout
  });

  // 2. API 응답 완료 대기
  await page.waitForResponse(
    (response) => response.url().includes('/api/projects/') &&
                  response.url().includes('/wbs'),
    { timeout: timeout / 2 }
  );

  // 3. 트리 콘텐츠 안정화 대기
  await page.waitForSelector('[data-testid="wbs-tree-content"]', {
    state: 'visible',
    timeout
  });

  // 4. 렌더링 완료 대기 (애니메이션)
  await page.waitForTimeout(100);
}
```

**문제점 2 - `checkAccessibility` 구현 누락**:
주석으로만 표시되어 있음

**개선 제안**:
```typescript
export async function checkAccessibility(page: Page): Promise<void> {
  // 기본 ARIA 체크
  const landmarks = await page.locator('[role]').count();
  expect(landmarks).toBeGreaterThan(0);

  // 필수 ARIA 속성 체크
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const hasLabel = await button.evaluate((el) => {
      return el.hasAttribute('aria-label') ||
             el.textContent?.trim().length > 0;
    });
    expect(hasLabel).toBe(true);
  }

  // 폼 요소 레이블 체크
  const inputs = await page.locator('input').all();
  for (const input of inputs) {
    const hasLabel = await input.evaluate((el) => {
      const id = el.id;
      return el.hasAttribute('aria-label') ||
             (id && document.querySelector(`label[for="${id}"]`));
    });
    expect(hasLabel).toBe(true);
  }
}
```

---

## 4. Mock 데이터 리뷰

### 4.1 WBS Node Mock (섹션 3.1)

**평가**: ✅ 적절

**긍정**:
- 다양한 시나리오 커버 (minimal, complex, search, empty)
- 실제 WBS 구조 반영

**개선 제안 - 엣지 케이스 추가**:
```typescript
/**
 * 깊은 중첩 트리 (성능 테스트용)
 */
export function generateDeepWbsTree(depth: number): WbsNode {
  let node: WbsNode = {
    id: `TSK-${depth}`,
    type: 'task',
    title: `Deep Task ${depth}`,
    status: '[ ]',
    category: 'development',
    priority: 'low',
    progress: 0,
    children: []
  };

  for (let i = depth - 1; i > 0; i--) {
    node = {
      id: `ACT-${i}`,
      type: 'act',
      title: `Activity ${i}`,
      status: 'planned',
      progress: 0,
      children: [node]
    };
  }

  return {
    id: 'deep-project',
    type: 'project',
    title: 'Deep Nesting Test',
    progress: 0,
    children: [
      {
        id: 'WP-01',
        type: 'wp',
        title: 'Deep WP',
        status: 'planned',
        priority: 'high',
        progress: 0,
        children: [node]
      }
    ]
  };
}
```

---

## 5. 테스트 케이스 리뷰

### 5.1 컴포넌트 테스트 (섹션 5)

#### WbsTreePanel (TC-200 ~ TC-206)

**평가**: ✅ 적절

**긍정**:
- 주요 상태(로딩/에러/빈/정상) 모두 커버
- 컴포넌트 통합 테스트 포함

**개선 제안 - 테스트 누락 케이스**:
```typescript
it('TC-207: fetchWbs 실패 시 에러 상태 설정', async () => {
  // Given: fetchWbs가 reject
  const wrapper = mountWithPinia(WbsTreePanel, {
    props: { projectId: 'test-project' }
  });
  const store = useWbsStore();
  vi.spyOn(store, 'fetchWbs').mockRejectedValue(
    new Error('Network error')
  );

  // When: 컴포넌트 마운트
  await flushPromises();

  // Then: 에러 상태
  expect(store.error).toBeTruthy();
  const errorEl = findByTestId(wrapper, 'wbs-error');
  expect(errorEl.exists()).toBe(true);
});
```

#### WbsSearchBox (TC-210 ~ TC-213)

**평가**: ✅ 우수

**긍정**:
- debounce 동작 검증이 명확함
- 조건부 렌더링(X 버튼) 테스트 포함

**개선 제안 - 경계값 테스트 추가**:
```typescript
it('TC-214: 특수문자 검색어 처리', async () => {
  const wrapper = mountWithPinia(WbsSearchBox);
  const store = useWbsStore();

  const input = findByTestId(wrapper, 'search-input');
  await input.setValue('TSK-01 [bd]');
  await waitFor(350);

  // 특수문자 포함 검색어가 정상 처리됨
  expect(store.searchQuery).toBe('TSK-01 [bd]');
});

it('TC-215: 빈 문자열 입력 시 초기화', async () => {
  const wrapper = mountWithPinia(WbsSearchBox);
  const store = useWbsStore();

  const input = findByTestId(wrapper, 'search-input');
  await input.setValue('test');
  await waitFor(350);

  await input.setValue('');
  await waitFor(350);

  expect(store.searchQuery).toBe('');
});
```

#### WbsSummaryCards (TC-220 ~ TC-225)

**평가**: ✅ 적절

**개선 제안 - 진행률 계산 검증 강화**:
```typescript
it('TC-226: 진행률 계산 정확성', async () => {
  const wrapper = mountWithPinia(WbsSummaryCards);
  const store = useWbsStore();

  // complexWbsTree: 4 TSK, 1개 완료(100%), 1개 진행중(50%)
  // 예상 진행률: (100 + 50 + 25 + 0) / 4 = 43.75%
  store.tree = [complexWbsTree];
  await wrapper.vm.$nextTick();

  const progressCard = findByTestId(wrapper, 'summary-card-progress');
  const text = progressCard.text();
  const percent = parseInt(text.match(/(\d+)%/)?.[1] || '0');

  expect(percent).toBeCloseTo(43.75, 0); // 반올림 허용
});
```

---

### 5.2 E2E 테스트 (섹션 6)

#### 기본 플로우 (E2E-001 ~ E2E-004)

**평가**: ✅ 우수

**긍정**:
- 실제 사용자 플로우 잘 반영
- 로딩 상태 전환 검증 포함

**개선 제안 - 재로드 시나리오 추가**:
```typescript
test('E2E-005: 페이지 새로고침 시 상태 복원', async ({ page }) => {
  // Given: WBS 로드 및 검색어 입력
  await page.goto('/wbs?project=test-project');
  await waitForWbsLoaded(page);

  const searchInput = page.locator('[data-testid="search-input"]');
  await searchInput.fill('TSK-01');
  await page.waitForTimeout(400);

  // When: 페이지 새로고침
  await page.reload();
  await waitForWbsLoaded(page);

  // Then: 검색 상태 유지 (localStorage 기반)
  await expect(searchInput).toHaveValue('TSK-01');
});
```

#### 에러 핸들링 (E2E-030 ~ E2E-032)

**평가**: ⚠️ 개선 필요

**문제점**: E2E-032의 재시도 로직이 불안정할 수 있음

**개선 제안**:
```typescript
test('E2E-032: 네트워크 오류 재시도', async ({ page }) => {
  let callCount = 0;

  await page.route('**/api/projects/*/wbs', async (route) => {
    callCount++;
    if (callCount === 1) {
      // 첫 호출은 지연 후 실패
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.abort('failed');
    } else {
      // 두 번째 호출은 성공
      await route.continue();
    }
  });

  await page.goto('/wbs?project=test-project');

  // 에러 표시 대기
  const errorEl = page.locator('[data-testid="wbs-error"]');
  await expect(errorEl).toBeVisible({ timeout: 5000 });

  // Retry 버튼 존재 확인
  const retryBtn = page.locator('[data-testid="retry-btn"]');
  await expect(retryBtn).toBeVisible();

  // Retry 클릭
  await retryBtn.click();

  // 성공적으로 로드
  await waitForWbsLoaded(page);
  const content = page.locator('[data-testid="wbs-tree-content"]');
  await expect(content).toBeVisible();

  // 2번 호출 확인
  expect(callCount).toBe(2);
});
```

#### 접근성 (E2E-040 ~ E2E-043)

**평가**: ⚠️ 불완전

**문제점**: `checkAccessibility` 구현이 미완성임

**개선 제안**: 섹션 3.2 참조 (이미 작성함)

---

## 6. 단위 테스트 리뷰

### 6.1 워크플로우 엔진 (TC-100 ~ TC-103)

**평가**: ✅ 우수

**긍정**:
- 카테고리별 전체 플로우 검증
- 잘못된 전이 에러 처리 포함

**개선 제안 - 테스트 누락 케이스**:
```typescript
it('TC-104: 워크플로우 이력 기록', async () => {
  // Given: development Task
  const task = {
    id: 'TSK-01',
    status: '[ ]',
    category: 'development',
    history: []
  };

  // When: 상태 전이
  const result = await executeCommand(task, 'start');

  // Then: 이력 기록됨
  expect(result.history).toHaveLength(1);
  expect(result.history[0]).toMatchObject({
    from: '[ ]',
    to: '[bd]',
    command: 'start',
    timestamp: expect.any(String)
  });
});

it('TC-105: 동시성 제어 (낙관적 잠금)', async () => {
  // Given: Task
  const task = { id: 'TSK-01', status: '[bd]', category: 'development' };

  // When: 동시에 두 개의 전이 시도
  const [result1, result2] = await Promise.allSettled([
    executeCommand(task, 'draft'),
    executeCommand(task, 'draft')
  ]);

  // Then: 하나만 성공
  const successes = [result1, result2].filter(r => r.status === 'fulfilled');
  expect(successes).toHaveLength(1);
});
```

### 6.2 WBS 파서 (TC-050 ~ TC-052)

**평가**: ✅ 적절

**개선 제안 - 성능 테스트 강화**:
```typescript
it('TC-053: 파싱 + 시리얼라이즈 왕복 성능', async () => {
  // Given: 대량 WBS
  const largeMarkdown = generateLargeWbs(1000);

  // When: 파싱 → 수정 → 시리얼라이즈
  const start = Date.now();
  const tree = parseWbsMarkdown(largeMarkdown, 'large-project');
  tree.children[0].title = 'Modified';
  const serialized = serializeWbsTree(tree);
  const duration = Date.now() - start;

  // Then: 3초 이내 완료
  expect(duration).toBeLessThan(3000);
  expect(serialized).toContain('Modified');
});
```

---

## 7. CI/CD 통합 리뷰

### 7.1 GitHub Actions (섹션 7.1)

**평가**: ⚠️ 개선 필요

**문제점**:
- 병렬 실행 최적화 부족
- 캐싱 전략 누락

**개선 제안**:
```yaml
jobs:
  unit-tests:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]  # 4개로 분할
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Cache Vitest results
        uses: actions/cache@v4
        with:
          path: node_modules/.vitest
          key: vitest-${{ hashFiles('**/package-lock.json') }}

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests (shard ${{ matrix.shard }}/4)
        run: npm run test:coverage -- --shard=${{ matrix.shard }}/4

      - name: Upload coverage (shard)
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.shard }}
          path: coverage/

  merge-coverage:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: coverage-*
          merge-multiple: true

      - name: Merge coverage reports
        run: npx nyc merge coverage/ coverage/merged.json

      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/merged.json
```

---

## 8. 성능 최적화 리뷰

### 8.1 테스트 실행 최적화 (섹션 8.1)

**평가**: ✅ 적절

**개선 제안 - 스마트 테스트 실행**:
```json
{
  "scripts": {
    "test:affected": "vitest run --changed HEAD~1",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:benchmark": "vitest bench"
  }
}
```

---

## 9. 누락된 테스트 케이스

### 9.1 컴포넌트 라이프사이클

**누락**:
- 컴포넌트 unmount 시 리소스 정리 (EventListener, timer 등)

**추가 제안**:
```typescript
it('TC-240: 컴포넌트 unmount 시 debounce 타이머 정리', async () => {
  const wrapper = mountWithPinia(WbsSearchBox);

  const input = findByTestId(wrapper, 'search-input');
  await input.setValue('test');

  // Unmount 전에 debounce 타이머 활성화
  wrapper.unmount();

  // debounce 시간 경과 후에도 setSearchQuery 호출되지 않아야 함
  await waitFor(400);
  const store = useWbsStore();
  expect(store.setSearchQuery).not.toHaveBeenCalled();
});
```

### 9.2 스토어 상태 관리

**누락**:
- 여러 컴포넌트 간 상태 동기화
- 스토어 초기화 시나리오

**추가 제안**:
```typescript
it('TC-241: 여러 컴포넌트에서 동일한 스토어 공유', async () => {
  const wrapper1 = mountWithPinia(WbsTreePanel, {
    props: { projectId: 'test-1' }
  });
  const wrapper2 = mountWithPinia(WbsSummaryCards);

  const store = useWbsStore();
  store.tree = [complexWbsTree];

  await wrapper1.vm.$nextTick();
  await wrapper2.vm.$nextTick();

  // 두 컴포넌트 모두 같은 데이터 표시
  expect(wrapper1.text()).toContain('Complex Project');
  expect(wrapper2.text()).toContain('2'); // WP count
});
```

### 9.3 브라우저 호환성

**누락**:
- 다양한 브라우저 환경 테스트 (현재 Chromium만)

**추가 제안**:
```typescript
// playwright.config.ts
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] }
  },
  // [NEW]
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] }
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] }
  }
]
```

---

## 10. 리스크 분석

### 10.1 높은 리스크

| 리스크 항목 | 발생 확률 | 영향도 | 완화 전략 |
|----------|--------|------|----------|
| **E2E 테스트 불안정성 (Flakiness)** | 높음 | 높음 | - 재시도 로직 개선<br>- waitFor 헬퍼 강화<br>- 테스트 격리 철저화 |
| **커버리지 80% 미달성** | 중간 | 높음 | - 단계별 커버리지 모니터링<br>- 누락 영역 조기 식별 |
| **성능 테스트 실패** | 중간 | 중간 | - 성능 벤치마크 설정<br>- 점진적 개선 |

### 10.2 중간 리스크

| 리스크 항목 | 발생 확률 | 영향도 | 완화 전략 |
|----------|--------|------|----------|
| **CI 실행 시간 초과** | 중간 | 중간 | - 병렬 실행 최적화<br>- Sharding 적용 |
| **Mock 데이터 실제 데이터 불일치** | 낮음 | 중간 | - 실제 WBS 파일로 검증<br>- 스키마 검증 추가 |

---

## 11. 개선 권장 사항 요약

### 11.1 필수 개선 (구현 전 반영)

1. ✅ **E2E 헬퍼 `waitForWbsLoaded` 안정성 강화** (섹션 3.2)
   - API 응답 대기 로직 추가
   - 애니메이션 안정화 대기

2. ✅ **접근성 헬퍼 `checkAccessibility` 구현 완성** (섹션 3.2)
   - ARIA 속성 검증
   - 폼 레이블 검증

3. ✅ **Playwright 재시도 전략 개선** (섹션 2.3)
   - 에러 타입별 재시도 정책
   - 테스트 격리 설정

### 11.2 권장 개선 (우선순위 높음)

4. ✅ **컴포넌트 테스트 누락 케이스 추가** (섹션 5.1)
   - TC-207: fetchWbs 실패 시나리오
   - TC-214, TC-215: 검색 경계값 테스트
   - TC-226: 진행률 계산 정확성

5. ✅ **E2E 테스트 시나리오 보강** (섹션 5.2)
   - E2E-005: 페이지 새로고침
   - E2E-032 개선: 네트워크 재시도 안정화

6. ✅ **단위 테스트 강화** (섹션 6.1)
   - TC-104: 워크플로우 이력 기록
   - TC-105: 동시성 제어
   - TC-053: 왕복 성능 테스트

### 11.3 선택적 개선 (시간 여유 시)

7. ⏳ **CI/CD 병렬 실행 최적화** (섹션 7.1)
   - Sharding 적용
   - 캐싱 전략

8. ⏳ **브라우저 호환성 테스트** (섹션 9.3)
   - Firefox, Safari 추가

9. ⏳ **성능 테스트 디렉토리 추가** (섹션 2.1)
   - 렌더링 성능 측정

---

## 12. 승인 조건

다음 항목들이 반영되면 **최종 승인**:

- [x] 섹션 11.1 필수 개선 3가지 모두 반영
- [x] 섹션 11.2 권장 개선 6가지 중 4가지 이상 반영
- [x] 리스크 완화 전략 문서화

**현재 상태**: 조건부 승인 (필수 개선 사항 반영 필요)

---

## 13. 다음 단계

1. **설계 리뷰 반영** (`/wf:apply`)
   - 020-detail-design.md 업데이트
   - 누락된 테스트 케이스 추가
   - 헬퍼 함수 구현 개선

2. **구현 시작** (`/wf:build`)
   - 테스트 헬퍼부터 구현 (의존성 없음)
   - Mock 데이터 생성
   - 컴포넌트 테스트 → E2E 테스트 순서

3. **점진적 검증**
   - 각 테스트 파일 완성 후 즉시 실행
   - 커버리지 지속 모니터링
   - CI 통합 조기 테스트

---

## 관련 문서

- **리뷰 대상**: `020-detail-design.md`
- **추적성**: `025-traceability-matrix.md`
- **테스트 명세**: `026-test-specification.md`

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2025-12-15 | 초안 작성 | Claude (Refactoring Expert) |

---

<!--
author: Claude (Refactoring Expert)
Template Version: 1.0.0
Created: 2025-12-15
-->
