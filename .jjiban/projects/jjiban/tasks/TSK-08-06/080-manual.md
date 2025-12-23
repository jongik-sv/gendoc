# TSK-08-06 매뉴얼

## Theme Integration & E2E Testing

### 개요
PrimeVue 디자인 토큰을 jjiban 다크 테마와 통합하고, HEX 하드코딩을 완전 제거함.

### 변경 사항

#### 1. PrimeVue 디자인 토큰 (main.css)
- `--p-tree-*`: WbsTreePanel 스타일
- `--p-splitter-*`: AppLayout 스타일
- `--p-menubar-*`: AppHeader 스타일
- `--p-dialog-*`: TaskDetailPanel 스타일
- `--p-progressbar-*`: ProgressBar 스타일

#### 2. HEX 하드코딩 제거 (16건)
- documentConfig.ts → CSS 변수
- WbsTreeNode.vue → Tailwind 클래스
- TaskProgress.vue → CSS 클래스
- 기타 컴포넌트 → CSS 변수/Tailwind

#### 3. E2E 테스트 추가
- `tests/e2e/theme-integration.spec.ts`: TC-01~08
- `tests/helpers/accessibility-helpers.ts`: WCAG 2.1 헬퍼

### 테스트 실행
```bash
npm run test:e2e
```

---
