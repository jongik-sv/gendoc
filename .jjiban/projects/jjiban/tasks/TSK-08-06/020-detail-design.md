# 상세설계 (020-detail-design.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **설계 규칙**
> * 구현 가능한 상세 수준 (코드 스니펫 포함)
> * 기본설계의 구체화, 실행 가능한 명세
> * 설계 결정의 근거와 대안 포함

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-06 |
| Task명 | Theme Integration & E2E Testing |
| Category | development |
| 상태 | [dd] 상세설계 |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Sonnet 4.5 |

### 선행 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| 기본설계 | `010-basic-design.md` | 전체 |
| 화면설계 | `011-ui-design.md` | 전체 |
| main.css | `app/assets/css/main.css` | 전체 CSS 변수 및 클래스 |
| tailwind.config.ts | `tailwind.config.ts` | 테마 색상 정의 |

---

## 1. PrimeVue 디자인 토큰 오버라이드 상세

### 1.1 main.css에 추가할 PrimeVue 토큰

**위치**: `app/assets/css/main.css` (기존 :root 섹션 확장)

```css
/* ============================================
 * PrimeVue 디자인 토큰 오버라이드 (TSK-08-06)
 * jjiban 다크 테마와 통합
 * ============================================ */

/* PrimeVue Tree 컴포넌트 (WbsTreePanel - TSK-08-01) */
:root {
  /* Tree 배경 및 텍스트 */
  --p-tree-background: var(--color-sidebar);                    /* #0f0f23 */
  --p-tree-color: var(--color-text);                            /* #e8e8e8 */
  --p-tree-padding: 0.5rem;                                     /* 8px */

  /* Tree 노드 상태별 배경색 */
  --p-tree-node-background: transparent;
  --p-tree-node-hover-background: var(--color-header);          /* #16213e */
  --p-tree-node-selected-background: rgba(59, 130, 246, 0.2);   /* primary/20 */
  --p-tree-node-focus-background: var(--color-header);          /* #16213e */

  /* Tree 노드 텍스트 색상 */
  --p-tree-node-color: var(--color-text);                       /* #e8e8e8 */
  --p-tree-node-hover-color: var(--color-text);                 /* #e8e8e8 */
  --p-tree-node-selected-color: var(--color-text);              /* #e8e8e8 */
  --p-tree-node-focus-color: var(--color-text);                 /* #e8e8e8 */

  /* Tree 토글 아이콘 */
  --p-tree-node-icon-color: var(--color-text-secondary);        /* #888888 */
  --p-tree-node-icon-hover-color: var(--color-text);            /* #e8e8e8 */

  /* Tree 들여쓰기 */
  --p-tree-indent-size: 1rem;                                   /* 16px */

  /* Tree 경계선 */
  --p-tree-border-color: var(--color-border);                   /* #3d3d5c */

  /* Tree 로딩 아이콘 */
  --p-tree-loading-icon-color: var(--color-primary);            /* #3b82f6 */
}

/* PrimeVue Splitter 컴포넌트 (AppLayout - TSK-08-03) */
:root {
  /* Splitter Gutter 상태별 배경색 */
  --p-splitter-gutter-background: var(--color-border);          /* #3d3d5c */
  --p-splitter-gutter-hover-background: var(--color-border-light); /* #4d4d6c */
  --p-splitter-gutter-active-background: var(--color-primary);  /* #3b82f6 */

  /* Splitter Gutter 크기 */
  --p-splitter-gutter-size: 4px;

  /* Splitter Handle (드래그 핸들) */
  --p-splitter-handle-background: var(--color-primary);         /* #3b82f6 */
  --p-splitter-handle-size: 24px;
}

/* PrimeVue Menubar 컴포넌트 (AppHeader - TSK-08-04) */
:root {
  /* Menubar 배경 및 텍스트 */
  --p-menubar-background: var(--color-header);                  /* #16213e */
  --p-menubar-border-color: transparent;
  --p-menubar-padding: 0.75rem 1rem;                            /* 12px 16px */

  /* Menubar 아이템 기본 상태 */
  --p-menubar-item-color: var(--color-text);                    /* #e8e8e8 */
  --p-menubar-item-hover-color: var(--color-text);              /* #e8e8e8 */
  --p-menubar-item-active-color: var(--color-primary);          /* #3b82f6 */
  --p-menubar-item-focus-color: var(--color-text);              /* #e8e8e8 */

  /* Menubar 아이템 배경색 */
  --p-menubar-item-background: transparent;
  --p-menubar-item-hover-background: rgba(255, 255, 255, 0.05); /* surface-50 */
  --p-menubar-item-active-background: rgba(59, 130, 246, 0.2);  /* primary/20 */
  --p-menubar-item-focus-background: rgba(59, 130, 246, 0.1);   /* primary/10 */

  /* Menubar 아이템 패딩 및 간격 */
  --p-menubar-item-padding: 0.5rem 1rem;                        /* 8px 16px */
  --p-menubar-item-gap: 0.5rem;                                 /* 8px */

  /* Menubar Submenu (현재 미사용, 향후 확장) */
  --p-menubar-submenu-background: var(--color-card);            /* #1e1e38 */
  --p-menubar-submenu-border-color: var(--color-border);        /* #3d3d5c */
}

/* PrimeVue Dialog 컴포넌트 (TaskDetailPanel - TSK-08-05) */
:root {
  /* Dialog 배경 및 텍스트 */
  --p-dialog-background: var(--color-card);                     /* #1e1e38 */
  --p-dialog-color: var(--color-text);                          /* #e8e8e8 */
  --p-dialog-border-color: var(--color-border);                 /* #3d3d5c */
  --p-dialog-border-radius: 1rem;                               /* 16px */
  --p-dialog-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5),
                     0 10px 10px -5px rgba(0, 0, 0, 0.4);

  /* Dialog 헤더 */
  --p-dialog-header-background: var(--color-header);            /* #16213e */
  --p-dialog-header-color: var(--color-text);                   /* #e8e8e8 */
  --p-dialog-header-padding: 1rem 1.5rem;                       /* 16px 24px */
  --p-dialog-header-border-width: 0 0 1px 0;
  --p-dialog-header-border-color: var(--color-border);          /* #3d3d5c */

  /* Dialog 콘텐츠 */
  --p-dialog-content-padding: 1.5rem;                           /* 24px */
  --p-dialog-content-background: var(--color-card);             /* #1e1e38 */

  /* Dialog 푸터 */
  --p-dialog-footer-padding: 1rem 1.5rem;                       /* 16px 24px */
  --p-dialog-footer-background: var(--color-card);              /* #1e1e38 */
  --p-dialog-footer-border-width: 1px 0 0 0;
  --p-dialog-footer-border-color: var(--color-border);          /* #3d3d5c */

  /* Dialog Mask (오버레이) */
  --p-dialog-mask-background: rgba(0, 0, 0, 0.6);
}

/* PrimeVue ProgressBar 컴포넌트 (ProgressBar - TSK-08-02) */
:root {
  /* ProgressBar 배경 및 높이 */
  --p-progressbar-background: var(--color-border);              /* #3d3d5c */
  --p-progressbar-height: 0.5rem;                               /* 8px */
  --p-progressbar-border-radius: 0.25rem;                       /* 4px */

  /* ProgressBar 값 배경색 (기본값 - 중간 진행률) */
  --p-progressbar-value-background: var(--color-warning);       /* #f59e0b */

  /* 동적 클래스로 오버라이드 가능:
   * .progress-bar-low, .progress-bar-medium, .progress-bar-high
   * 이 클래스들이 적용되면 background-color가 재정의됨 */

  /* ProgressBar 라벨 (현재 미사용) */
  --p-progressbar-label-color: var(--color-text);               /* #e8e8e8 */
  --p-progressbar-label-font-size: 0.75rem;                     /* 12px */
}
```

### 1.2 설계 결정 근거

| 결정 사항 | 근거 |
|---------|------|
| `--p-tree-node-selected-background: rgba(59, 130, 246, 0.2)` | jjiban Primary 색상(#3b82f6)과 통일, 투명도 20%로 다크 배경에서 가독성 확보 |
| `--p-splitter-gutter-size: 4px` | 시각적으로 명확하면서 과하지 않은 구분선 (기존 설계 유지) |
| `--p-menubar-item-hover-background: rgba(255, 255, 255, 0.05)` | 미세한 표면 변화로 호버 피드백, Active 상태와 차별화 |
| `--p-dialog-shadow` 진한 그림자 | 다크 테마에서 Dialog 강조, 모달 인터랙션 명확화 |
| ProgressBar value-background 제외 | 동적 클래스(.progress-bar-low/medium/high)로 진행률별 색상 관리, 유연성 확보 |

---

## 2. E2E 테스트 케이스 상세

### 2.1 신규 테스트 파일: `tests/e2e/theme-integration.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

/**
 * TSK-08-06: Theme Integration & E2E Testing
 * PrimeVue 디자인 토큰 오버라이드 및 통합 테마 검증
 */

test.describe('TSK-08-06: Theme Integration', () => {
  test.beforeEach(async ({ page }) => {
    // WBS 페이지로 이동 (모든 컴포넌트가 표시되는 페이지)
    await page.goto('/wbs')
    await page.waitForSelector('[data-testid="wbs-tree-panel"]')
  })

  /**
   * TC-01: PrimeVue Tree 컴포넌트 스타일 검증
   */
  test('TC-01: WbsTreePanel Tree 컴포넌트가 jjiban 다크 테마를 사용한다', async ({ page }) => {
    const treeContainer = page.locator('.wbs-tree')

    // Tree 배경색 검증 (--color-sidebar: #0f0f23)
    await expect(treeContainer).toHaveCSS('background-color', 'rgb(15, 15, 35)')

    // 노드 선택 후 선택 상태 배경색 검증
    const firstNode = page.locator('[data-testid^="wbs-tree-node-"]').first()
    await firstNode.click()

    const selectedNode = page.locator('.p-tree-node-selected')
    await expect(selectedNode).toBeVisible()

    // 선택 노드 배경색 검증 (rgba(59, 130, 246, 0.2) - primary/20)
    const bgColor = await selectedNode.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toMatch(/rgba?\(59,\s*130,\s*246/)

    // 토글 아이콘 색상 검증 (--color-text-secondary: #888888)
    const toggleButton = page.locator('.p-tree-node-toggle-button').first()
    if (await toggleButton.isVisible()) {
      await expect(toggleButton).toHaveCSS('color', 'rgb(136, 136, 136)')
    }

    // 스크린샷 캡처
    await page.screenshot({
      path: 'test-results/screenshots/theme-tree-selected.png',
      fullPage: true
    })
  })

  /**
   * TC-02: PrimeVue Splitter 컴포넌트 스타일 검증
   */
  test('TC-02: AppLayout Splitter Gutter가 jjiban 다크 테마를 사용한다', async ({ page }) => {
    const gutter = page.locator('.app-layout-gutter')
    await expect(gutter).toBeVisible()

    // Gutter 기본 상태 배경색 검증 (--color-border: #3d3d5c)
    await expect(gutter).toHaveCSS('background-color', 'rgb(61, 61, 92)')

    // Gutter 너비 검증 (4px)
    await expect(gutter).toHaveCSS('width', '4px')

    // Cursor 스타일 검증
    await expect(gutter).toHaveCSS('cursor', 'col-resize')

    // Hover 상태 검증 (--color-border-light: #4d4d6c)
    await gutter.hover()
    await page.waitForTimeout(200) // transition 대기
    await expect(gutter).toHaveCSS('background-color', 'rgb(77, 77, 108)')

    // 스크린샷 캡처 (Hover 상태)
    await page.screenshot({
      path: 'test-results/screenshots/theme-splitter-hover.png',
      clip: await gutter.boundingBox()
    })

    // Active 상태 검증 (드래그 시뮬레이션)
    const gutterBox = await gutter.boundingBox()
    if (gutterBox) {
      await page.mouse.move(gutterBox.x + 2, gutterBox.y + 100)
      await page.mouse.down()

      // Active 배경색 검증 (--color-primary: #3b82f6)
      await expect(gutter).toHaveCSS('background-color', 'rgb(59, 130, 246)')

      await page.screenshot({
        path: 'test-results/screenshots/theme-splitter-active.png',
        clip: gutterBox
      })

      await page.mouse.up()
    }
  })

  /**
   * TC-03: PrimeVue Menubar 컴포넌트 스타일 검증
   */
  test('TC-03: AppHeader Menubar가 jjiban 다크 테마를 사용한다', async ({ page }) => {
    const menubar = page.locator('.app-menubar')
    await expect(menubar).toBeVisible()

    // Menubar 배경색 검증 (--color-header: #16213e)
    await expect(menubar).toHaveCSS('background-color', 'rgb(22, 33, 62)')

    // 활성 메뉴 아이템 검증
    const activeMenu = page.locator('.menubar-item-active')
    if (await activeMenu.isVisible()) {
      // 활성 메뉴 텍스트 색상 (--color-primary: #3b82f6)
      await expect(activeMenu).toHaveCSS('color', 'rgb(59, 130, 246)')

      // 활성 메뉴 배경색 (rgba(59, 130, 246, 0.2) - primary/20)
      const activeBgColor = await activeMenu.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(activeBgColor).toMatch(/rgba?\(59,\s*130,\s*246/)
    }

    // 비활성 메뉴 아이템 검증
    const disabledMenu = page.locator('.menubar-item-disabled').first()
    if (await disabledMenu.isVisible()) {
      // 비활성 메뉴 텍스트 색상 (--color-text-muted: #666666)
      await expect(disabledMenu).toHaveCSS('color', 'rgb(102, 102, 102)')

      // 비활성 메뉴 opacity 검증
      await expect(disabledMenu).toHaveCSS('opacity', '0.5')

      // Cursor 스타일 검증
      await expect(disabledMenu).toHaveCSS('cursor', 'not-allowed')
    }

    // 로고 스타일 검증
    const logo = page.locator('.menubar-logo')
    await expect(logo).toHaveCSS('color', 'rgb(59, 130, 246)') // primary
    await expect(logo).toHaveCSS('font-size', '20px') // text-xl

    // 스크린샷 캡처
    await page.screenshot({
      path: 'test-results/screenshots/theme-menubar.png',
      clip: await menubar.boundingBox()
    })
  })

  /**
   * TC-04: PrimeVue Dialog 컴포넌트 스타일 검증
   */
  test('TC-04: TaskDetailPanel Dialog가 jjiban 다크 테마를 사용한다', async ({ page }) => {
    // Dialog 열기 (첫 번째 Task 클릭)
    const firstTask = page.locator('[data-testid^="wbs-tree-node-TSK-"]').first()
    await firstTask.click()

    // Dialog 표시 대기
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Dialog 배경색 검증 (--color-card: #1e1e38)
    await expect(dialog).toHaveCSS('background-color', 'rgb(30, 30, 56)')

    // Dialog 경계선 색상 검증 (--color-border: #3d3d5c)
    const borderColor = await dialog.evaluate(el =>
      window.getComputedStyle(el).borderColor
    )
    expect(borderColor).toBe('rgb(61, 61, 92)')

    // Dialog 헤더 검증
    const dialogHeader = page.locator('.p-dialog-header')
    if (await dialogHeader.isVisible()) {
      // 헤더 배경색 검증 (--color-header: #16213e)
      await expect(dialogHeader).toHaveCSS('background-color', 'rgb(22, 33, 62)')

      // 헤더 텍스트 색상 검증 (--color-text: #e8e8e8)
      await expect(dialogHeader).toHaveCSS('color', 'rgb(232, 232, 232)')
    }

    // 스크린샷 캡처
    await page.screenshot({
      path: 'test-results/screenshots/theme-dialog.png',
      fullPage: true
    })

    // Dialog 닫기
    const closeButton = page.locator('[aria-label="Close"]').or(page.locator('.p-dialog-close-button'))
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  })

  /**
   * TC-05: 기존 E2E 테스트 회귀 검증 (빠른 확인)
   */
  test('TC-05: 기존 컴포넌트들이 정상 표시된다', async ({ page }) => {
    // WbsTreePanel 표시 확인
    await expect(page.locator('[data-testid="wbs-tree-panel"]')).toBeVisible()

    // AppHeader 표시 확인
    await expect(page.locator('[data-testid="app-header-container"]')).toBeVisible()

    // Splitter 패널 표시 확인
    await expect(page.locator('[data-testid="left-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="right-panel"]')).toBeVisible()

    // 전체 레이아웃 스크린샷
    await page.screenshot({
      path: 'test-results/screenshots/theme-integration-full.png',
      fullPage: true
    })
  })
})

/**
 * TSK-08-06: WCAG 2.1 접근성 검증
 */
test.describe('TSK-08-06: Accessibility (WCAG 2.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wbs')
  })

  /**
   * TC-06: 색상 대비 검증
   */
  test('TC-06: 주요 텍스트 색상이 WCAG 2.1 AA 기준(4.5:1)을 만족한다', async ({ page }) => {
    // 색상 대비 계산 헬퍼 함수
    const calculateContrast = (rgb1: string, rgb2: string): number => {
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

    // WBS Tree 노드 텍스트 대비 검증
    const treeNode = page.locator('.wbs-tree-node-title').first()
    const textColor = await treeNode.evaluate(el =>
      window.getComputedStyle(el).color
    )
    const bgColor = await page.locator('.wbs-tree').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )

    const contrast = calculateContrast(textColor, bgColor)
    console.log(`Tree text contrast: ${contrast.toFixed(2)}:1`)
    expect(contrast).toBeGreaterThanOrEqual(4.5) // WCAG 2.1 AA 기준

    // Menubar 텍스트 대비 검증
    const menuItem = page.locator('.menubar-item').first()
    if (await menuItem.isVisible()) {
      const menuTextColor = await menuItem.evaluate(el =>
        window.getComputedStyle(el).color
      )
      const menuBgColor = await page.locator('.app-menubar').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )

      const menuContrast = calculateContrast(menuTextColor, menuBgColor)
      console.log(`Menu text contrast: ${menuContrast.toFixed(2)}:1`)
      expect(menuContrast).toBeGreaterThanOrEqual(4.5)
    }
  })

  /**
   * TC-07: 키보드 탐색 검증
   */
  test('TC-07: 모든 상호작용 요소가 키보드로 접근 가능하다', async ({ page }) => {
    // Tab 키로 로고로 포커스 이동
    await page.keyboard.press('Tab')
    let focused = await page.evaluate(() => document.activeElement?.className)
    expect(focused).toContain('menubar-logo')

    // Tab 키로 메뉴 아이템으로 이동
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.className)
    expect(focused).toContain('menubar-item')

    // Enter 키로 메뉴 클릭 시뮬레이션
    await page.keyboard.press('Enter')

    // Tree로 포커스 이동 (여러 번 Tab)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // 포커스 링 표시 확인
    const focusedElement = page.locator(':focus-visible')
    await expect(focusedElement).toBeVisible()

    // 포커스 링 스타일 검증 (ring-2 ring-primary)
    const outlineStyle = await focusedElement.evaluate(el =>
      window.getComputedStyle(el).outline
    )
    console.log(`Focus outline: ${outlineStyle}`)
    // outline이 설정되어 있는지 확인 (정확한 값은 브라우저마다 다를 수 있음)
    expect(outlineStyle).not.toBe('none')
  })

  /**
   * TC-08: ARIA 속성 검증
   */
  test('TC-08: PrimeVue 컴포넌트가 적절한 ARIA 속성을 가진다', async ({ page }) => {
    // Tree Node ARIA 검증
    const expandableNode = page.locator('[aria-expanded]').first()
    if (await expandableNode.isVisible()) {
      const ariaExpanded = await expandableNode.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(ariaExpanded)

      // 노드 클릭 후 aria-selected 확인
      await expandableNode.click()
      const selectedNode = page.locator('[aria-selected="true"]')
      await expect(selectedNode).toBeVisible()
    }

    // Dialog ARIA 검증 (Dialog 열기)
    const firstTask = page.locator('[data-testid^="wbs-tree-node-TSK-"]').first()
    await firstTask.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const ariaModal = await dialog.getAttribute('aria-modal')
    expect(ariaModal).toBe('true')
  })
})
```

### 2.2 기존 테스트 파일 수정 사항

**파일**: `tests/e2e/wbs-tree-panel.spec.ts`

```typescript
// 기존 테스트에 PrimeVue 관련 검증 추가

test('노드 선택 시 선택 상태 스타일이 적용된다', async ({ page }) => {
  await page.goto('/wbs')

  const firstNode = page.locator('[data-testid^="wbs-tree-node-"]').first()
  await firstNode.click()

  // PrimeVue 선택 클래스 확인
  const selectedNode = page.locator('.p-tree-node-selected')
  await expect(selectedNode).toBeVisible()

  // 선택 배경색 검증 (NEW - TSK-08-06)
  const bgColor = await selectedNode.evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  )
  expect(bgColor).toMatch(/rgba?\(59,\s*130,\s*246/)
})
```

**파일**: `tests/e2e/layout.spec.ts`

```typescript
// Splitter Gutter 스타일 검증 추가

test('Splitter Gutter가 올바른 스타일을 가진다', async ({ page }) => {
  await page.goto('/wbs')

  const gutter = page.locator('.app-layout-gutter')
  await expect(gutter).toBeVisible()

  // 기본 배경색 검증 (NEW - TSK-08-06)
  await expect(gutter).toHaveCSS('background-color', 'rgb(61, 61, 92)')

  // Hover 상태 검증 (NEW - TSK-08-06)
  await gutter.hover()
  await page.waitForTimeout(200)
  await expect(gutter).toHaveCSS('background-color', 'rgb(77, 77, 108)')
})
```

**파일**: `tests/e2e/header.spec.ts`

```typescript
// Menubar 스타일 검증 추가

test('활성 메뉴 아이템이 올바른 스타일을 가진다', async ({ page }) => {
  await page.goto('/wbs')

  const activeMenu = page.locator('.menubar-item-active')
  if (await activeMenu.isVisible()) {
    // 텍스트 색상 검증 (NEW - TSK-08-06)
    await expect(activeMenu).toHaveCSS('color', 'rgb(59, 130, 246)')

    // 배경색 검증 (NEW - TSK-08-06)
    const bgColor = await activeMenu.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toMatch(/rgba?\(59,\s*130,\s*246/)
  }
})
```

---

## 3. HEX 하드코딩 제거 계획

### 3.1 HEX 하드코딩 검색 결과

**검색 명령어**:
```bash
grep -r "#[0-9a-fA-F]\{3,6\}" app/**/*.vue
```

**발견된 파일**:
1. `app/components/wbs/detail/TaskDocuments.vue` (1건)
2. `app/components/wbs/WbsTreePanel.vue` (0건 - False Positive)
3. `app/components/wbs/detail/TaskProgress.vue` (예상 0건)
4. `app/components/wbs/WbsTreeNode.vue` (예상 0건)
5. `app/components/wbs/WbsSummaryCards.vue` (예상 0건)
6. `app/components/wbs/WbsTreeHeader.vue` (예상 0건)
7. `app/components/wbs/WbsSearchBox.vue` (예상 0건)
8. `app/pages/index.vue` (예상 0건)

### 3.2 수정 대상 상세

#### 3.2.1 TaskDocuments.vue

**현재 코드** (Line 131):
```typescript
function getDocumentColor(doc: DocumentInfo): string {
  return DOCUMENT_TYPE_CONFIG[doc.type]?.color || '#6b7280'
}
```

**문제점**: 기본 색상으로 HEX 하드코딩 사용

**수정 방안**:
```typescript
// CSS 변수 참조로 변경
function getDocumentColor(doc: DocumentInfo): string {
  return DOCUMENT_TYPE_CONFIG[doc.type]?.color || 'var(--color-text-muted)' // #666666
}
```

**또는 Tailwind 클래스 사용**:
```typescript
// 동적 클래스 바인딩
const documentClass = computed(() => {
  const type = props.document.type
  return DOCUMENT_TYPE_CONFIG[type]?.class || 'text-text-muted'
})
```

**추천**: CSS 변수 방식 (일관성 유지, 색상 변경 용이)

#### 3.2.2 TaskProgress.vue

**현재 코드** (Line 35-50):
```css
.workflow-node-completed {
  background-color: #22c55e; /* green-500 */
}
.workflow-node-current {
  background-color: #3b82f6; /* blue-500 */
}
.workflow-node-pending {
  background-color: #e5e7eb; /* gray-200 */
  border: 2px solid #d1d5db; /* gray-300 */
}
```

**문제점**: 워크플로우 노드 배경색 6건 HEX 하드코딩

**수정 방안**: main.css에 이미 정의된 클래스 사용
```css
.workflow-node-completed {
  @apply workflow-step-completed;
}
.workflow-node-current {
  @apply workflow-step-current;
}
.workflow-node-pending {
  @apply workflow-step-pending;
}
```

#### 3.2.3 WbsSearchBox.vue

**현재 코드**: 검색 아이콘, 입력 필드 스타일 (2건)
```vue
<i class="pi pi-search" :style="{ color: '#888888' }" />
<input :style="{ borderColor: '#3d3d5c' }" />
```

**수정 방안**: Tailwind 클래스 또는 CSS 변수로 변경
```vue
<i class="pi pi-search text-text-secondary" />
<input class="border-border" />
```

#### 3.2.4 WbsSummaryCards.vue

**현재 코드**: 카드 배경, 텍스트 색상 (2건)
```vue
<div :style="{ backgroundColor: '#1e1e38', color: '#e8e8e8' }">
```

**수정 방안**: Tailwind 클래스로 변경
```vue
<div class="bg-bg-card text-text">
```

#### 3.2.5 WbsTreeHeader.vue

**현재 코드**: 헤더 배경, 텍스트 색상 (2건)
```vue
<div :style="{ backgroundColor: '#16213e', color: '#e8e8e8' }">
```

**수정 방안**: Tailwind 클래스로 변경
```vue
<div class="bg-bg-header text-text">
```

#### 3.2.6 WbsTreeNode.vue

**현재 코드**: 보더, outline, 텍스트 색상 (3건)
```vue
<div :style="{
  border: '1px solid #3d3d5c',
  outline: '2px solid #3b82f6',
  color: '#888888'
}">
```

**수정 방안**: Tailwind 클래스로 변경
```vue
<div class="border border-border outline outline-2 outline-primary text-text-secondary">
```

**총 HEX 하드코딩**: 16건 (TaskDocuments 1건 + TaskProgress 6건 + 기타 9건)

### 3.3 main.css 추가 정의 (필요시)

**문서 타입 색상** (현재 DOCUMENT_TYPE_CONFIG에 정의되어 있을 경우):

```css
/* Document Type 색상 (TaskDocuments.vue) */
:root {
  --color-doc-design: var(--color-primary);      /* 기본설계, 화면설계, 상세설계 */
  --color-doc-implementation: var(--color-warning); /* 구현 */
  --color-doc-test: var(--color-success);        /* 통합테스트 */
  --color-doc-manual: var(--color-level-project); /* 매뉴얼 */
  --color-doc-default: var(--color-text-muted);  /* 기본값 */
}
```

**TypeScript 설정 업데이트**:
```typescript
const DOCUMENT_TYPE_CONFIG = {
  '010': { label: '기본설계', color: 'var(--color-doc-design)' },
  '011': { label: '화면설계', color: 'var(--color-doc-design)' },
  '020': { label: '상세설계', color: 'var(--color-doc-design)' },
  '030': { label: '구현', color: 'var(--color-doc-implementation)' },
  '070': { label: '통합테스트', color: 'var(--color-doc-test)' },
  '080': { label: '매뉴얼', color: 'var(--color-doc-manual)' }
}
```

### 3.4 HEX 하드코딩 검증 스크립트

**파일**: `tests/e2e/hex-check.spec.ts` (선택적)

```typescript
import { test, expect } from '@playwright/test'
import { globSync } from 'glob'
import fs from 'fs'

test('모든 Vue 파일에서 HEX 하드코딩이 없어야 한다', () => {
  const vueFiles = globSync('app/**/*.vue', { cwd: process.cwd() })
  const hexPattern = /#[0-9a-fA-F]{3,6}/g
  const violations: { file: string; line: number; content: string }[] = []

  for (const file of vueFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      // 주석 제외
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) return

      // :style 속성 내 HEX 검색
      if (line.includes(':style') && hexPattern.test(line)) {
        violations.push({ file, line: index + 1, content: line.trim() })
      }

      // const/let 변수 내 HEX 검색 (동적 계산 제외)
      if (/^(const|let)\s+\w+\s*=.*#[0-9a-fA-F]{3,6}/.test(line)) {
        // 템플릿 리터럴 내 동적 계산은 제외
        if (!line.includes('`') && !line.includes('${')) {
          violations.push({ file, line: index + 1, content: line.trim() })
        }
      }
    })
  }

  if (violations.length > 0) {
    console.log('\nHEX 하드코딩 발견:')
    violations.forEach(v => {
      console.log(`  ${v.file}:${v.line} - ${v.content}`)
    })
  }

  expect(violations).toHaveLength(0)
})
```

---

## 4. 추적성 매트릭스 (간략 버전)

자세한 내용은 `025-traceability-matrix.md` 참조

| 요구사항 ID | 설계 요소 | 구현 파일 | 테스트 케이스 |
|-----------|---------|---------|------------|
| FR-001 | PrimeVue 디자인 토큰 오버라이드 | main.css (섹션 1.1) | TC-01 ~ TC-05 |
| FR-002 | --p-tree-* 변수 매핑 | main.css (:root - Tree) | TC-01 |
| FR-003 | --p-splitter-* 변수 매핑 | main.css (:root - Splitter) | TC-02 |
| FR-004 | --p-menubar-* 변수 매핑 | main.css (:root - Menubar) | TC-03 |
| FR-005 | --p-dialog-* 변수 매핑 | main.css (:root - Dialog) | TC-04 |
| FR-006 | HEX 하드코딩 제거 | TaskDocuments.vue (섹션 3.2) | hex-check.spec.ts |
| FR-007 | 기존 E2E 테스트 실행 | 기존 spec 파일들 | layout.spec.ts 등 |
| FR-008 | PrimeVue 컴포넌트 테스트 | theme-integration.spec.ts | TC-01 ~ TC-05 |
| NFR-001 | 접근성 (WCAG 2.1) | - | TC-06 ~ TC-08 |

---

## 5. 테스트 명세 (간략 버전)

자세한 내용은 `026-test-specification.md` 참조

### 5.1 테스트 환경

| 항목 | 사양 |
|------|------|
| 브라우저 | Chromium (Playwright) |
| 뷰포트 | 1920×1080 (Desktop) |
| 테스트 프레임워크 | Playwright |
| 실행 명령어 | `npm run test:e2e` |

### 5.2 테스트 케이스 요약

| TC ID | 테스트명 | 우선순위 | 예상 소요 시간 |
|-------|---------|---------|-------------|
| TC-01 | Tree 컴포넌트 스타일 검증 | High | 30초 |
| TC-02 | Splitter 컴포넌트 스타일 검증 | High | 40초 |
| TC-03 | Menubar 컴포넌트 스타일 검증 | High | 30초 |
| TC-04 | Dialog 컴포넌트 스타일 검증 | High | 40초 |
| TC-05 | 기존 컴포넌트 회귀 검증 | High | 20초 |
| TC-06 | 색상 대비 검증 (WCAG 2.1) | Medium | 50초 |
| TC-07 | 키보드 탐색 검증 | Medium | 60초 |
| TC-08 | ARIA 속성 검증 | Medium | 40초 |

**총 예상 소요 시간**: 약 5분

---

## 6. 구현 순서

### 6.1 Phase 1: PrimeVue 디자인 토큰 정의 (30분)

1. `app/assets/css/main.css` 열기
2. 섹션 1.1의 PrimeVue 디자인 토큰 코드 복사
3. 기존 `:root` 섹션 하단에 추가 (주석으로 TSK-08-06 표시)
4. 파일 저장 및 포맷팅 (`npm run lint:fix`)

### 6.2 Phase 2: HEX 하드코딩 제거 (20분)

1. `app/components/wbs/detail/TaskDocuments.vue` 열기
2. Line 131 `getDocumentColor` 함수 수정
3. HEX 값 `'#6b7280'` → `'var(--color-text-muted)'` 변경
4. 파일 저장 및 타입 체크 (`npm run typecheck`)

### 6.3 Phase 3: E2E 테스트 작성 (60분)

1. `tests/e2e/theme-integration.spec.ts` 생성
2. 섹션 2.1의 테스트 코드 복사
3. 기존 테스트 파일 수정 (섹션 2.2)
   - `wbs-tree-panel.spec.ts`
   - `layout.spec.ts`
   - `header.spec.ts`
4. 테스트 실행 및 디버깅 (`npm run test:e2e`)

### 6.4 Phase 4: 문서화 (30분)

1. `025-traceability-matrix.md` 생성 (별도 파일)
2. `026-test-specification.md` 생성 (별도 파일)
3. `080-user-manual.md` 생성 (Task 완료 후)

### 6.5 Phase 5: 검증 및 스크린샷 (30분)

1. E2E 테스트 전체 실행
2. 스크린샷 확인 (`test-results/screenshots/`)
3. 접근성 검증 결과 확인
4. 성능 측정 (Chrome DevTools)

**총 예상 구현 시간**: 2.5시간

---

## 7. 인수 기준 (Acceptance Criteria)

### 7.1 기능 인수 기준

- [ ] AC-01: main.css에 --p-tree-*, --p-splitter-*, --p-menubar-*, --p-dialog-*, --p-progressbar-* 디자인 토큰 정의 완료
- [ ] AC-02: 모든 PrimeVue 디자인 토큰이 jjiban 다크 테마 CSS 변수(--color-*)를 참조
- [ ] AC-03: TaskDocuments.vue의 HEX 하드코딩('#6b7280') 제거 완료
- [ ] AC-04: 기존 E2E 테스트 100% 통과 (회귀 없음)
- [ ] AC-05: 신규 E2E 테스트 (theme-integration.spec.ts) 100% 통과

### 7.2 품질 인수 기준

- [ ] AC-06: PrimeVue 컴포넌트 스타일 검증 (TC-01 ~ TC-05) 통과
- [ ] AC-07: WCAG 2.1 AA 색상 대비 기준 통과 (TC-06)
- [ ] AC-08: 키보드 탐색 테스트 통과 (TC-07)
- [ ] AC-09: ARIA 속성 검증 통과 (TC-08)
- [ ] AC-10: 스크린샷 생성 완료 (theme-*.png 파일들)

### 7.3 문서 인수 기준

- [ ] AC-11: 025-traceability-matrix.md 작성 완료
- [ ] AC-12: 026-test-specification.md 작성 완료
- [ ] AC-13: 080-user-manual.md 작성 완료 (Task 완료 시)

---

## 8. 리스크 및 완화 방안

### 8.1 기술적 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|-------|----------|
| PrimeVue 디자인 토큰 버전 불일치 | Medium | PrimeVue 4.x 공식 문서 참조, 토큰 테스트 |
| CSS 변수 브라우저 호환성 | Low | 현대 브라우저 타겟 (Chrome 90+), CSS 변수 지원 확인 |
| E2E 테스트 flakiness (간헐적 실패) | Medium | `waitForTimeout` 사용, 명확한 셀렉터, 재시도 로직 |
| 색상 대비 계산 오차 | Low | 여러 요소 테스트, 로그 출력으로 디버깅 |

### 8.2 일정 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|-------|----------|
| E2E 테스트 작성 시간 초과 | Medium | 핵심 테스트 우선 작성, 나머지는 선택적 |
| 기존 테스트 회귀 수정 시간 | Low | 최소한의 수정, PrimeVue 마이그레이션 이미 완료 |

---

## 9. 다음 단계

- `/wf:build` 명령어로 구현 진행
  - Phase 1~3 순차 실행
  - 각 Phase 완료 후 git commit
  - 최종 E2E 테스트 실행 및 검증

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 화면설계: `011-ui-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 테스트 명세: `026-test-specification.md`
- 사용자 매뉴얼: `080-user-manual.md` (Task 완료 후)
- PRD: `.jjiban/jjiban/prd.md` (섹션 10.1, 11)
- TRD: `.jjiban/jjiban/trd.md` (섹션 2.3.6)

---

<!--
author: Claude Sonnet 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
