# 테스트 명세 (026-test-specification.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-06 |
| Task명 | Theme Integration & E2E Testing |
| Category | development |
| 작성일 | 2025-12-16 |

---

## 1. 테스트 범위

### 1.1 In Scope
- PrimeVue 디자인 토큰 적용 검증
- HEX 하드코딩 제거 확인
- 기존 E2E 테스트 회귀 검증
- 접근성(WCAG 2.1) 준수 확인
- 시각적 일관성 검증

### 1.2 Out of Scope
- 단위 테스트 (구현 변경 없음)
- 성능 벤치마크 (별도 Task)
- 다크/라이트 모드 전환 (현재 다크 모드만 지원)

---

## 2. 테스트 케이스: Theme Integration (TC-01 ~ TC-08)

| TC ID | 테스트 항목 | 기대 결과 | 우선순위 |
|-------|-----------|----------|---------|
| TC-01 | WbsTreePanel Tree 컴포넌트 스타일 검증 | jjiban 다크 테마 사용 | High |
| TC-02 | AppLayout Splitter Gutter 스타일 검증 | jjiban 다크 테마 사용 | High |
| TC-03 | AppHeader Menubar 스타일 검증 | jjiban 다크 테마 사용 | High |
| TC-04 | TaskDetailPanel Dialog 스타일 검증 | jjiban 다크 테마 사용 | Medium |
| TC-05 | 기존 컴포넌트 회귀 검증 | 정상 표시 | High |
| TC-06 | 색상 대비 검증 (WCAG 2.1 AA) | 4.5:1 이상 | High |
| TC-07 | 키보드 탐색 검증 | 전체 UI 접근 가능 | Medium |
| TC-08 | ARIA 속성 검증 | 적절한 값 설정 | Medium |

### TC-01: Tree 컴포넌트 상세

| 검증 항목 | 기대 결과 |
|----------|----------|
| Tree 배경색 | `rgb(15, 15, 35)` (#0f0f23) |
| 노드 호버 배경색 | `rgb(22, 33, 62)` (#16213e) |
| 노드 선택 배경색 | `rgba(59, 130, 246, 0.2)` |
| 노드 텍스트 색상 | `rgb(232, 232, 232)` (#e8e8e8) |
| 토글 아이콘 색상 | `rgb(136, 136, 136)` (#888888) |

### TC-02: Splitter 컴포넌트 상세

| 검증 항목 | 기대 결과 |
|----------|----------|
| Gutter 기본 배경색 | `rgb(61, 61, 92)` (#3d3d5c) |
| Gutter 호버 배경색 | `rgb(77, 77, 108)` (#4d4d6c) |
| Gutter 활성 배경색 | `rgb(59, 130, 246)` (#3b82f6) |
| Gutter 너비 | 4px |
| Cursor 스타일 | col-resize |

### TC-03: Menubar 컴포넌트 상세

| 검증 항목 | 기대 결과 |
|----------|----------|
| Menubar 배경색 | `rgb(22, 33, 62)` (#16213e) |
| 활성 메뉴 텍스트 색상 | `rgb(59, 130, 246)` (#3b82f6) |
| 활성 메뉴 배경색 | `rgba(59, 130, 246, 0.2)` |
| 비활성 메뉴 색상 | `rgb(102, 102, 102)` (#666666) |
| 비활성 메뉴 opacity | 0.5 |

### TC-04: Dialog 컴포넌트 상세

| 검증 항목 | 기대 결과 |
|----------|----------|
| Dialog 배경색 | `rgb(30, 30, 56)` (#1e1e38) |
| Dialog 헤더 배경색 | `rgb(22, 33, 62)` (#16213e) |
| Dialog 헤더 텍스트 색상 | `rgb(232, 232, 232)` (#e8e8e8) |
| Dialog 경계선 색상 | `rgb(61, 61, 92)` (#3d3d5c) |

---

## 3. 테스트 케이스: 기존 E2E 테스트 수정

| 테스트 파일 | 추가 검증 항목 | 우선순위 |
|-----------|-------------|---------|
| detail-panel.spec.ts | Dialog 스타일 검증 | High |
| detail-sections.spec.ts | TaskWorkflow, TaskHistory, TaskDocuments 스타일 검증 | High |
| layout.spec.ts | Splitter 스타일 검증 | High |
| wbs-tree-panel.spec.ts | Tree 스타일 검증 | High |
| header.spec.ts | Menubar 스타일 검증 | High |

### detail-panel.spec.ts 추가 테스트

```typescript
test('Dialog가 올바른 다크 테마 스타일을 가진다', async ({ page }) => {
  await page.goto(`/wbs?project=${TEST_PROJECT_ID}`)

  const firstTask = page.locator('[data-testid^="wbs-tree-node-TSK-"]').first()
  await firstTask.click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  // Dialog 배경색 검증
  await expect(dialog).toHaveCSS('background-color', 'rgb(30, 30, 56)')

  // Dialog 헤더 배경색 검증
  const dialogHeader = page.locator('.p-dialog-header')
  await expect(dialogHeader).toHaveCSS('background-color', 'rgb(22, 33, 62)')
})
```

### detail-sections.spec.ts 추가 테스트

```typescript
test('TaskWorkflow 현재 단계가 강조 표시된다', async ({ page }) => {
  // Dialog 열기 후 Workflow 탭 확인
  const currentStep = page.locator('.workflow-step-current')

  // 배경색 검증
  await expect(currentStep).toHaveCSS('background-color', 'rgb(59, 130, 246)')

  // scale 효과 검증
  const transform = await currentStep.evaluate(el =>
    window.getComputedStyle(el).transform
  )
  expect(transform).toContain('matrix(1.1') // scale(1.1)
})
```

---

## 4. 테스트 헬퍼: Accessibility

**파일**: `tests/helpers/accessibility-helpers.ts` (신규)

```typescript
/**
 * WCAG 2.1 색상 대비 계산
 */
export function calculateContrast(rgb1: string, rgb2: string): number {
  const getLuminance = (rgb: string): number => {
    const [r, g, b] = rgb
      .match(/\d+/g)!
      .map(Number)
      .map(val => {
        const sRGB = val / 255
        return sRGB <= 0.03928
          ? sRGB / 12.92
          : Math.pow((sRGB + 0.055) / 1.055, 2.4)
      })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(rgb1)
  const lum2 = getLuminance(rgb2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 색상 대비 검증 헬퍼
 */
export async function verifyColorContrast(
  page: Page,
  element: Locator,
  background: Locator,
  level: 'AA' | 'AAA' = 'AA'
): Promise<void> {
  const textColor = await element.evaluate(el =>
    window.getComputedStyle(el).color
  )
  const bgColor = await background.evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  )

  const contrast = calculateContrast(textColor, bgColor)
  const threshold = level === 'AAA' ? 7.0 : 4.5

  expect(contrast).toBeGreaterThanOrEqual(threshold)
}
```

---

## 5. 테스트 케이스: HEX 하드코딩 (TC-HEX-*)

| TC ID | 테스트 항목 | 기대 결과 | 우선순위 |
|-------|-----------|----------|---------|
| TC-HEX-01 | Vue 컴포넌트 HEX 검색 | 0건 (예외 제외) | Critical |
| TC-HEX-02 | 인라인 스타일 HEX | 0건 | Critical |
| TC-HEX-03 | TypeScript HEX | 0건 (예외 제외) | High |

### 검증 명령어

```bash
# Vue 컴포넌트 HEX 검색
grep -rn "#[0-9a-fA-F]\{6\}" app/components/ --include="*.vue"

# 예외: main.css 내 정의는 허용
```

---

## 6. 테스트 케이스: 접근성 (TC-06, TC-07, TC-08)

테스트 명세는 020-detail-design.md의 TC-06, TC-07, TC-08과 동일

| TC ID | 테스트 항목 | WCAG 기준 | 우선순위 |
|-------|-----------|----------|---------|
| TC-06 | 색상 대비 검증 | 4.5:1 이상 (AA) | High |
| TC-07 | 키보드 탐색 검증 | 전체 UI 접근 가능 | Medium |
| TC-08 | ARIA 속성 검증 | 적절한 값 설정 | Medium |

상세 내용은 `020-detail-design.md` 섹션 2.1 참조

---

## 7. 테스트 환경

| 항목 | 설정 |
|------|------|
| 브라우저 | Chromium (Playwright) |
| 뷰포트 | 1920x1080 (Desktop) |
| 테스트 러너 | Playwright Test |
| 스크린샷 | test-results/screenshots/ |

---

## 8. 통과 기준

- [ ] TC-01 ~ TC-08 모든 테스트 통과
- [ ] HEX 하드코딩 16건 모두 제거
- [ ] 기존 E2E 테스트 100% 통과 (회귀 없음)
- [ ] WCAG 2.1 AA 색상 대비 기준 준수
- [ ] 접근성 헬퍼 파일 생성 완료

---

## 9. 테스트 실행 시간 예상

### 신규 테스트 (theme-integration.spec.ts)
| TC ID | 예상 소요 시간 |
|-------|-------------|
| TC-01 ~ TC-08 | 약 5분 |

### 기존 테스트 수정 (+10초씩 증가)
- layout.spec.ts: +10초 (Splitter 스타일 검증 추가)
- wbs-tree-panel.spec.ts: +10초 (Tree 스타일 검증 추가)
- header.spec.ts: +10초 (Menubar 스타일 검증 추가)
- detail-panel.spec.ts: +10초 (Dialog 스타일 검증 추가)
- detail-sections.spec.ts: +10초 (섹션 스타일 검증 추가)

**전체 E2E 테스트 예상 시간**: 약 6분 (신규 + 수정)

**최적화 방안**:
- 병렬 실행 (`--workers=4`): 약 2~3분으로 단축 가능
- 스크린샷 최소화: 필수 케이스만 캡처

---

<!-- jjiban - Test Specification -->
