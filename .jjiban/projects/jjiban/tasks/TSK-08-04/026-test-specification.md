# 테스트 명세 (026-test-specification.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **테스트 명세 목적**
> * 구현 검증을 위한 상세 테스트 케이스 정의
> * 수동 테스트, E2E 테스트, 접근성 테스트 포함
> * 회귀 테스트 시나리오 명시

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-04 |
| Task명 | AppHeader PrimeVue Menubar Migration |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 테스트 전략

### 1.1 테스트 레벨

| 테스트 레벨 | 목적 | 도구 | 우선순위 |
|-----------|------|------|---------|
| E2E 테스트 | 사용자 시나리오 검증 | Playwright | 높음 |
| 시각적 회귀 | UI 일관성 검증 | Playwright Screenshot | 중간 |
| 접근성 테스트 | ARIA 속성 검증 | axe DevTools | 높음 |
| 성능 테스트 | 호버 반응성 검증 | Chrome DevTools | 낮음 |
| 수동 테스트 | 전체 기능 검증 | 브라우저 | 높음 |

### 1.2 테스트 범위

| 범위 | 포함 | 제외 |
|------|------|------|
| 기능 | PrimeVue Menubar 통합, 메뉴 클릭, 라우팅 | 프로젝트 선택 로직 (별도 Task) |
| UI | 레이아웃, 스타일, 호버 | 모바일 반응형 (Phase 2) |
| 접근성 | ARIA 속성, 키보드 탐색 | 스크린 리더 음성 검증 (수동) |
| 성능 | CSS transition | 네트워크 성능 |
| 호환성 | E2E 테스트 회귀 | 브라우저 호환성 (Chrome만) |

---

## 2. E2E 테스트 케이스

### 2.1 TC-001: PrimeVue Menubar 렌더링

**목적**: PrimeVue Menubar 컴포넌트가 올바르게 렌더링되는지 검증

**전제 조건**:
- 애플리케이션 실행 중
- /wbs 페이지 접속

**테스트 단계**:
1. `page.getByTestId('app-header')` 요소 확인
2. PrimeVue Menubar 클래스 존재 확인 (`.app-menubar`)
3. start 슬롯 (로고) 존재 확인
4. 메뉴 아이템 4개 존재 확인
5. end 슬롯 (프로젝트명) 존재 확인

**예상 결과**:
- Header 요소 표시됨
- PrimeVue Menubar 클래스 적용됨
- 로고 "jjiban" 표시됨
- 메뉴 4개 (대시보드, 칸반, WBS, Gantt) 표시됨
- 프로젝트명 또는 안내 메시지 표시됨

**Playwright 코드**:
```typescript
test('TC-001: PrimeVue Menubar 렌더링', async ({ page }) => {
  await page.goto('/wbs')

  // Header 존재 확인
  const header = page.getByTestId('app-header')
  await expect(header).toBeVisible()

  // PrimeVue Menubar 클래스 확인
  await expect(header.locator('.app-menubar')).toBeVisible()

  // 로고 확인
  const logo = page.getByTestId('app-logo')
  await expect(logo).toHaveText('jjiban')

  // 메뉴 4개 확인
  await expect(page.getByTestId('nav-menu-dashboard')).toBeVisible()
  await expect(page.getByTestId('nav-menu-kanban')).toBeVisible()
  await expect(page.getByTestId('nav-menu-wbs')).toBeVisible()
  await expect(page.getByTestId('nav-menu-gantt')).toBeVisible()

  // 프로젝트명 확인
  const projectName = page.getByTestId('project-name')
  await expect(projectName).toBeVisible()
})
```

---

### 2.2 TC-002: MenuItem 모델 데이터 구조

**목적**: MenuItem 모델이 올바른 데이터 구조로 생성되는지 검증

**전제 조건**:
- 애플리케이션 실행 중

**테스트 단계**:
1. `/wbs` 페이지 접속
2. 각 메뉴 아이템의 data-testid 확인
3. WBS 메뉴 enabled, 나머지 disabled 확인

**예상 결과**:
- 대시보드: disabled 상태
- 칸반: disabled 상태
- WBS: enabled 상태
- Gantt: disabled 상태

**Playwright 코드**:
```typescript
test('TC-002: MenuItem 모델 데이터 구조', async ({ page }) => {
  await page.goto('/wbs')

  // WBS만 활성, 나머지 비활성 확인
  const dashboard = page.getByTestId('nav-menu-dashboard')
  await expect(dashboard).toHaveAttribute('aria-disabled', 'true')

  const kanban = page.getByTestId('nav-menu-kanban')
  await expect(kanban).toHaveAttribute('aria-disabled', 'true')

  const wbs = page.getByTestId('nav-menu-wbs')
  await expect(wbs).not.toHaveAttribute('aria-disabled')

  const gantt = page.getByTestId('nav-menu-gantt')
  await expect(gantt).toHaveAttribute('aria-disabled', 'true')
})
```

---

### 2.3 TC-003: 로고 클릭 → /wbs 이동

**목적**: 로고 클릭 시 /wbs 페이지로 이동하는지 검증

**전제 조건**:
- 애플리케이션 실행 중
- 임의의 페이지 접속

**테스트 단계**:
1. `/` 페이지 접속
2. 로고 (`app-logo`) 클릭
3. URL 변경 확인

**예상 결과**:
- URL이 `/wbs`로 변경됨
- WBS 페이지 표시됨

**Playwright 코드**:
```typescript
test('TC-003: 로고 클릭 → /wbs 이동', async ({ page }) => {
  await page.goto('/')

  // 로고 클릭
  const logo = page.getByTestId('app-logo')
  await logo.click()

  // URL 확인
  await expect(page).toHaveURL('/wbs')
})
```

---

### 2.4 TC-004: 활성 라우트 하이라이팅

**목적**: 현재 페이지 메뉴가 Primary 색상으로 강조되는지 검증

**전제 조건**:
- 애플리케이션 실행 중

**테스트 단계**:
1. `/wbs` 페이지 접속
2. WBS 메뉴에 `menubar-item-active` 클래스 확인
3. WBS 메뉴에 `aria-current="page"` 확인

**예상 결과**:
- WBS 메뉴에 `menubar-item-active` 클래스 적용됨
- WBS 메뉴에 `aria-current="page"` 속성 적용됨
- 다른 메뉴는 활성 클래스 없음

**Playwright 코드**:
```typescript
test('TC-004: 활성 라우트 하이라이팅', async ({ page }) => {
  await page.goto('/wbs')

  // WBS 메뉴 활성 확인
  const wbs = page.getByTestId('nav-menu-wbs')
  await expect(wbs).toHaveClass(/menubar-item-active/)
  await expect(wbs).toHaveAttribute('aria-current', 'page')

  // 다른 메뉴 비활성 확인
  const dashboard = page.getByTestId('nav-menu-dashboard')
  await expect(dashboard).not.toHaveClass(/menubar-item-active/)
  await expect(dashboard).not.toHaveAttribute('aria-current')
})
```

---

### 2.5 TC-005: disabled 메뉴 클릭 → 토스트 표시

**목적**: 비활성 메뉴 클릭 시 "준비 중" 토스트가 표시되는지 검증

**전제 조건**:
- 애플리케이션 실행 중
- /wbs 페이지 접속

**테스트 단계**:
1. `/wbs` 페이지 접속
2. 대시보드 메뉴 클릭
3. 토스트 메시지 확인
4. URL 변경되지 않음 확인

**예상 결과**:
- "준비 중입니다" 토스트 표시됨
- severity: warn (노란색)
- URL이 `/wbs`로 유지됨 (라우팅 안 됨)

**Playwright 코드**:
```typescript
test('TC-005: disabled 메뉴 클릭 → 토스트 표시', async ({ page }) => {
  await page.goto('/wbs')

  // 대시보드 메뉴 클릭
  const dashboard = page.getByTestId('nav-menu-dashboard')
  await dashboard.click()

  // 토스트 확인
  const toast = page.locator('.p-toast-message-warn')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('준비 중입니다')

  // URL 변경 안 됨 확인
  await expect(page).toHaveURL('/wbs')
})
```

---

### 2.6 TC-006: ARIA 속성 검증

**목적**: 접근성 ARIA 속성이 올바르게 적용되는지 검증

**전제 조건**:
- 애플리케이션 실행 중
- /wbs 페이지 접속

**테스트 단계**:
1. Header `role="banner"` 확인
2. 로고 `aria-label` 확인
3. WBS 메뉴 `aria-current="page"` 확인
4. 대시보드 메뉴 `aria-disabled="true"` 확인
5. 대시보드 메뉴 `aria-label` "준비 중" 포함 확인

**예상 결과**:
- 모든 ARIA 속성이 설계대로 적용됨

**Playwright 코드**:
```typescript
test('TC-006: ARIA 속성 검증', async ({ page }) => {
  await page.goto('/wbs')

  // Header role 확인
  const header = page.getByTestId('app-header')
  await expect(header).toHaveAttribute('role', 'banner')

  // 로고 aria-label 확인
  const logo = page.getByTestId('app-logo')
  await expect(logo).toHaveAttribute('aria-label', '홈으로 이동')

  // WBS 메뉴 aria-current 확인
  const wbs = page.getByTestId('nav-menu-wbs')
  await expect(wbs).toHaveAttribute('aria-current', 'page')

  // 대시보드 메뉴 aria-disabled 확인
  const dashboard = page.getByTestId('nav-menu-dashboard')
  await expect(dashboard).toHaveAttribute('aria-disabled', 'true')
  await expect(dashboard).toHaveAttribute('aria-label', /준비 중/)
})
```

---

### 2.7 TC-007: CSS 클래스 중앙화 검증

**목적**: 인라인 스타일 및 HEX 하드코딩이 없는지 검증

**전제 조건**:
- 소스 코드 접근 가능

**테스트 단계**:
1. AppHeader.vue 파일에서 `:style` 검색
2. AppHeader.vue 파일에서 HEX 코드 (`#[0-9a-f]{6}`) 검색
3. main.css에 모든 클래스 정의 확인

**예상 결과**:
- `:style` 사용 없음
- HEX 코드 하드코딩 없음
- main.css에 8개 클래스 정의됨

**검증 방법**:
```bash
# AppHeader.vue에서 :style 검색
grep -n ':style' app/components/layout/AppHeader.vue
# 결과: 0건

# AppHeader.vue에서 HEX 코드 검색
grep -nE '#[0-9a-fA-F]{6}' app/components/layout/AppHeader.vue
# 결과: 0건

# main.css에서 클래스 정의 확인
grep -n 'menubar-' app/assets/css/main.css
# 결과: 8개 클래스 정의
```

---

## 3. 시각적 회귀 테스트

### 3.1 TC-008: 메뉴 호버 스타일

**목적**: 메뉴 호버 시 스타일이 올바르게 적용되는지 검증

**전제 조건**:
- 애플리케이션 실행 중
- /wbs 페이지 접속

**테스트 단계**:
1. 초기 상태 스크린샷
2. WBS 메뉴 (현재 페이지) 호버 → 스타일 변경 없음 확인
3. 대시보드 메뉴 (disabled) 호버 → 스타일 변경 없음 확인

**예상 결과**:
- WBS 메뉴 (활성): 호버 스타일 미적용 (이미 활성 상태)
- 대시보드 메뉴 (비활성): 호버 스타일 미적용 (cursor: not-allowed)

**Playwright 코드**:
```typescript
test('TC-008: 메뉴 호버 스타일', async ({ page }) => {
  await page.goto('/wbs')

  // WBS 메뉴 호버 (활성 메뉴)
  const wbs = page.getByTestId('nav-menu-wbs')
  await wbs.hover()
  // 활성 메뉴는 호버 스타일 적용 안 됨 (CSS 확인 필요)

  // 대시보드 메뉴 호버 (비활성 메뉴)
  const dashboard = page.getByTestId('nav-menu-dashboard')
  await dashboard.hover()
  // 비활성 메뉴는 호버 스타일 적용 안 됨 (cursor: not-allowed)

  // 스크린샷 저장
  await page.screenshot({ path: 'test-results/screenshots/tc-008-hover.png' })
})
```

---

### 3.2 TC-009: 다크 테마 색상 일관성

**목적**: 다크 테마 색상이 일관되게 적용되는지 검증

**전제 조건**:
- 애플리케이션 실행 중

**테스트 단계**:
1. /wbs 페이지 스크린샷 저장
2. 기존 스크린샷과 비교

**예상 결과**:
- 배경색: `--color-bg-header` (#16213e)
- 로고: `--color-primary` (#3b82f6)
- 활성 메뉴 텍스트: `--color-primary`
- 활성 메뉴 배경: `rgba(59, 130, 246, 0.2)`
- 비활성 메뉴 텍스트: `--color-text-muted` (#666666)

**Playwright 코드**:
```typescript
test('TC-009: 다크 테마 색상 일관성', async ({ page }) => {
  await page.goto('/wbs')

  // 스크린샷 저장
  await page.screenshot({ path: 'test-results/screenshots/tc-009-theme.png', fullPage: false })

  // CSS 변수 확인
  const header = page.getByTestId('app-header')
  const bgColor = await header.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor
  })

  // rgb(22, 33, 62) = #16213e
  expect(bgColor).toBe('rgb(22, 33, 62)')
})
```

---

## 4. 접근성 테스트

### 4.1 TC-010: axe DevTools 검증

**목적**: axe DevTools로 접근성 이슈가 없는지 검증

**전제 조건**:
- 애플리케이션 실행 중
- axe DevTools 설치됨

**테스트 단계**:
1. /wbs 페이지 접속
2. axe DevTools 실행
3. 접근성 이슈 확인

**예상 결과**:
- Critical/Serious 이슈 0건
- ARIA 속성 올바르게 적용됨
- 키보드 탐색 가능

**Playwright 코드**:
```typescript
import AxeBuilder from '@axe-core/playwright'

test('TC-010: axe DevTools 접근성 검증', async ({ page }) => {
  await page.goto('/wbs')

  const accessibilityScanResults = await new AxeBuilder({ page })
    .include('[data-testid="app-header"]')
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

---

### 4.2 TC-011: 키보드 탐색

**목적**: 키보드만으로 모든 메뉴를 탐색할 수 있는지 검증

**전제 조건**:
- 애플리케이션 실행 중
- /wbs 페이지 접속

**테스트 단계**:
1. Tab 키로 로고 포커스
2. Tab 키로 대시보드 메뉴 포커스
3. Tab 키로 칸반 메뉴 포커스
4. Tab 키로 WBS 메뉴 포커스
5. Tab 키로 Gantt 메뉴 포커스
6. Enter 키로 WBS 메뉴 활성화

**예상 결과**:
- 모든 요소가 Tab으로 포커스 가능
- 포커스 링 표시됨
- Enter 키로 메뉴 활성화 가능

**Playwright 코드**:
```typescript
test('TC-011: 키보드 탐색', async ({ page }) => {
  await page.goto('/wbs')

  // 로고 포커스
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('app-logo')).toBeFocused()

  // 대시보드 메뉴 포커스
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('nav-menu-dashboard')).toBeFocused()

  // 칸반 메뉴 포커스
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('nav-menu-kanban')).toBeFocused()

  // WBS 메뉴 포커스
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('nav-menu-wbs')).toBeFocused()

  // WBS 메뉴 활성화 (Enter)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/wbs')
})
```

---

## 5. 회귀 테스트

### 5.1 TC-012: 기존 E2E 테스트 회귀

**목적**: 기존 E2E 테스트가 모두 통과하는지 검증

**전제 조건**:
- 기존 E2E 테스트 스위트 존재

**테스트 단계**:
1. Playwright 실행 (`npm run test:e2e`)
2. 모든 테스트 통과 확인

**예상 결과**:
- 기존 E2E 테스트 100% 통과
- AppHeader 관련 테스트 0건 실패

**검증 방법**:
```bash
npm run test:e2e
# 결과: All tests passed
```

---

## 6. 성능 테스트

### 6.1 TC-013: 메뉴 호버 반응성

**목적**: 메뉴 호버 시 반응성이 100ms 이내인지 검증

**전제 조건**:
- Chrome DevTools Performance 탭 사용

**테스트 단계**:
1. /wbs 페이지 접속
2. Chrome DevTools Performance 기록 시작
3. 메뉴 호버 10회 반복
4. Performance 기록 중지
5. Transition duration 확인

**예상 결과**:
- CSS transition-duration: 200ms
- 실제 반응 시간 < 100ms (브라우저 최적화)

**검증 방법**:
- Chrome DevTools Performance 탭
- Frames 섹션에서 Paint 이벤트 확인
- Layout Shift 없음 확인

---

## 7. 수동 테스트 체크리스트

### 7.1 기능 검증

| 테스트 항목 | 검증 방법 | 예상 결과 | 상태 |
|----------|----------|----------|------|
| PrimeVue Menubar 렌더링 | 브라우저 확인 | 4개 메뉴 표시 | 미검증 |
| 로고 클릭 → /wbs | 수동 클릭 | /wbs 이동 | 미검증 |
| WBS 클릭 → /wbs | 수동 클릭 | /wbs 이동 | 미검증 |
| 대시보드 클릭 → 토스트 | 수동 클릭 | "준비 중" 표시 | 미검증 |
| 칸반 클릭 → 토스트 | 수동 클릭 | "준비 중" 표시 | 미검증 |
| Gantt 클릭 → 토스트 | 수동 클릭 | "준비 중" 표시 | 미검증 |
| 활성 메뉴 하이라이팅 | /wbs 접속 | WBS Primary 색상 | 미검증 |
| 프로젝트명 표시 | 프로젝트 선택 | 프로젝트명 표시 | 미검증 |
| 프로젝트 미선택 안내 | 프로젝트 미선택 | "프로젝트를 선택하세요" | 미검증 |

### 7.2 시각적 검증

| 테스트 항목 | 검증 방법 | 예상 결과 | 상태 |
|----------|----------|----------|------|
| 로고 폰트 | DevTools 확인 | 20px, Bold, Primary | 미검증 |
| 메뉴 간격 | DevTools 확인 | gap: 8px | 미검증 |
| 활성 메뉴 배경 | 시각적 확인 | Primary/20 배경 | 미검증 |
| 비활성 메뉴 opacity | 시각적 확인 | 50% opacity | 미검증 |
| 메뉴 호버 스타일 | 호버 후 확인 | 활성 메뉴만 적용 | 미검증 |
| 프로젝트명 truncate | 긴 이름 테스트 | max-w-200px | 미검증 |

### 7.3 접근성 검증

| 테스트 항목 | 검증 방법 | 예상 결과 | 상태 |
|----------|----------|----------|------|
| role="banner" | DevTools 확인 | Header에 적용 | 미검증 |
| aria-current | DevTools 확인 | WBS에 "page" | 미검증 |
| aria-disabled | DevTools 확인 | 비활성 메뉴에 "true" | 미검증 |
| aria-label (비활성) | DevTools 확인 | "(준비 중)" 포함 | 미검증 |
| aria-label (로고) | DevTools 확인 | "홈으로 이동" | 미검증 |
| 키보드 탐색 | Tab 키 테스트 | 모든 요소 포커스 가능 | 미검증 |
| 포커스 링 | Tab 키 후 확인 | Primary 색상 링 표시 | 미검증 |

---

## 8. 테스트 데이터

### 8.1 프로젝트명 테스트 데이터

| 케이스 | 프로젝트명 | 예상 결과 |
|-------|----------|----------|
| 정상 (짧음) | "jjiban" | "jjiban" 표시 |
| 정상 (중간) | "Project Management System" | "Project Management System" 표시 |
| 정상 (긴 이름) | "Very Long Project Name That Exceeds Max Width" | 200px에서 truncate |
| 빈 문자열 | "" | "프로젝트를 선택하세요" 표시 |
| null/undefined | null | "프로젝트를 선택하세요" 표시 |

### 8.2 라우트 테스트 데이터

| 시작 라우트 | 클릭 메뉴 | 예상 라우트 | 예상 동작 |
|-----------|----------|-----------|----------|
| /wbs | 로고 | /wbs | 이동 (동일 페이지) |
| / | 로고 | /wbs | 이동 |
| /wbs | WBS | /wbs | 이동 (동일 페이지) |
| /wbs | 대시보드 | /wbs | 토스트 표시, 이동 없음 |
| /wbs | 칸반 | /wbs | 토스트 표시, 이동 없음 |
| /wbs | Gantt | /wbs | 토스트 표시, 이동 없음 |

---

## 9. 테스트 실행 계획

### 9.1 실행 순서

| 순서 | 테스트 유형 | 담당 | 예상 소요 시간 |
|------|-----------|------|---------------|
| 1 | 수동 테스트 (기능) | 개발자 | 30분 |
| 2 | E2E 테스트 (TC-001~006) | Playwright | 15분 |
| 3 | 회귀 테스트 (TC-012) | Playwright | 10분 |
| 4 | 접근성 테스트 (TC-010~011) | axe + Playwright | 20분 |
| 5 | 시각적 회귀 (TC-008~009) | Playwright | 15분 |
| 6 | 성능 테스트 (TC-013) | Chrome DevTools | 15분 |
| 7 | CSS 검증 (TC-007) | Grep | 5분 |

**총 예상 소요 시간**: 1시간 50분

### 9.2 통과 기준

| 테스트 유형 | 통과 기준 |
|-----------|----------|
| E2E 테스트 | 100% 통과 (0건 실패) |
| 회귀 테스트 | 100% 통과 (0건 실패) |
| 접근성 테스트 | Critical/Serious 이슈 0건 |
| 시각적 회귀 | 기존 스크린샷과 동일 |
| 성능 테스트 | 호버 반응성 < 100ms |
| CSS 검증 | `:style` 사용 0건, HEX 하드코딩 0건 |

---

## 10. 테스트 완료 보고서 템플릿

```markdown
## TSK-08-04 테스트 완료 보고서

### 실행 정보
- 실행 일시: YYYY-MM-DD HH:MM
- 실행자: [이름]
- 환경: Chrome [버전], Node.js [버전]

### 테스트 결과

| 테스트 유형 | 총 개수 | 통과 | 실패 | 통과율 |
|-----------|---------|------|------|--------|
| E2E 테스트 | 6 | X | Y | Z% |
| 회귀 테스트 | 1 | X | Y | Z% |
| 접근성 테스트 | 2 | X | Y | Z% |
| 시각적 회귀 | 2 | X | Y | Z% |
| 성능 테스트 | 1 | X | Y | Z% |
| CSS 검증 | 1 | X | Y | Z% |
| **전체** | **13** | **X** | **Y** | **Z%** |

### 실패 케이스

| TC ID | 테스트명 | 실패 이유 | 조치 계획 |
|-------|---------|----------|----------|
| TC-XXX | ... | ... | ... |

### 스크린샷
- TC-008: `test-results/screenshots/tc-008-hover.png`
- TC-009: `test-results/screenshots/tc-009-theme.png`

### 접근성 검증
- axe DevTools: X건 이슈 (Critical: Y, Serious: Z)

### 성능 측정
- 메뉴 호버 반응성: XX ms (기준: < 100ms)

### 최종 결론
- [ ] 모든 테스트 통과 → 구현 완료
- [ ] 일부 테스트 실패 → 수정 필요

### 다음 단계
- [x] 매뉴얼 작성 (`080-manual.md`)
- [x] wbs.md 상태 업데이트 (`[dd]` → `[vf]`)
```

---

## 11. 다음 단계

- **구현 시작**: `/wf:build` 명령어로 구현 진행
- **테스트 실행**: 구현 완료 후 테스트 케이스 실행
- **완료 보고서**: 테스트 완료 후 보고서 작성
- **wbs.md 상태 업데이트**: `[dd]` → `[im]` (구현 완료 후 `[vf]`)

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
