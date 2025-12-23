# 추적성 매트릭스 (025-traceability-matrix.md)

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

## 1. 요구사항 → 설계 → 테스트 매핑

| 요구사항 ID | 요구사항 설명 | 설계 섹션 | 테스트 케이스 |
|------------|--------------|----------|--------------|
| REQ-01 | PrimeVue Tree 디자인 토큰 정의 | 020-1.1 | TC-TREE-01~05 |
| REQ-02 | PrimeVue Splitter 디자인 토큰 정의 | 020-1.1 | TC-SPLITTER-01~03 |
| REQ-03 | PrimeVue Menubar 디자인 토큰 정의 | 020-1.1 | TC-MENUBAR-01~04 |
| REQ-04 | PrimeVue Dialog 디자인 토큰 정의 | 020-1.1 | TC-DIALOG-01~03 |
| REQ-05 | PrimeVue ProgressBar 디자인 토큰 정의 | 020-1.1 | TC-PROGRESS-01~03 |
| REQ-06 | HEX 하드코딩 제거 검증 | 020-3 | TC-HEX-01~03 |
| REQ-07 | E2E 회귀 테스트 | 020-2 | TC-REGRESSION-01~06 |
| REQ-08 | 접근성(WCAG 2.1) 검증 | 011-5 | TC-A11Y-01~04 |

---

## 2. 컴포넌트 → 토큰 → 테스트 매핑

| 컴포넌트 | PrimeVue 토큰 | 테스트 파일 | 우선순위 |
|---------|--------------|------------|---------|
| WbsTreePanel | --p-tree-* | theme-integration.spec.ts | High |
| NodeIcon | CSS 클래스 (.node-icon-*) | theme-integration.spec.ts | High |
| StatusBadge | CSS 클래스 (.status-*) | theme-integration.spec.ts | Medium |
| AppLayout | --p-splitter-* | theme-integration.spec.ts | High |
| AppHeader | --p-menubar-* | theme-integration.spec.ts | High |
| TaskDetailPanel | --p-dialog-* | theme-integration.spec.ts | Medium |
| ProgressBar | --p-progressbar-* | theme-integration.spec.ts | Low |

---

## 3. 기존 E2E 테스트 → 회귀 검증 매핑

| 기존 테스트 파일 | 검증 항목 | 영향 컴포넌트 | 검증 방법 |
|----------------|----------|-------------|----------|
| layout.spec.ts | 레이아웃 구조 유지 | AppLayout, Splitter | 스크린샷 비교 |
| header.spec.ts | 헤더 메뉴 동작 | AppHeader, Menubar | 기능 테스트 |
| wbs-tree.spec.ts | 트리 상호작용 | WbsTreePanel, Tree | 클릭/선택 검증 |
| responsive.spec.ts | 반응형 레이아웃 | 전체 | 뷰포트별 스크린샷 |
| task-detail.spec.ts | 상세패널 동작 | TaskDetailPanel, Dialog | 열기/닫기 검증 |

---

## 4. 인수 기준 추적

| AC ID | 인수 기준 | 검증 테스트 | 상태 |
|-------|----------|------------|------|
| AC-01 | 모든 PrimeVue 토큰 main.css에 정의 | TC-TOKEN-01 | Pending |
| AC-02 | HEX 하드코딩 0건 (예외 제외) | TC-HEX-01 | Pending |
| AC-03 | E2E 회귀 테스트 100% 통과 | TC-REGRESSION-* | Pending |
| AC-04 | 색상 대비 4.5:1 이상 | TC-A11Y-01 | Pending |
| AC-05 | 키보드 네비게이션 동작 | TC-A11Y-02 | Pending |
| AC-06 | 시각적 일관성 검증 | TC-VISUAL-* | Pending |

---

## 5. 리스크 → 완화 → 테스트 매핑

| 리스크 | 완화 전략 | 검증 테스트 |
|--------|----------|------------|
| 토큰 미적용 | CSS 변수 fallback 정의 | TC-TOKEN-FALLBACK |
| 기존 테스트 실패 | 회귀 테스트 우선 실행 | TC-REGRESSION-* |
| 접근성 기준 미달 | WCAG 가이드라인 사전 검토 | TC-A11Y-* |
| 성능 저하 | CSS 변수 최적화 | TC-PERF-01 |

---

<!-- jjiban - Traceability Matrix -->
