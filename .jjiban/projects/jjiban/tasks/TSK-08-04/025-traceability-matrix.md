# 추적성 매트릭스 (025-traceability-matrix.md)

**Template Version:** 3.0.0 — **Last Updated:** 2025-12-16

> **추적성 매트릭스 목적**
> * 요구사항 → 설계 → 구현 → 테스트 간 추적성 확보
> * 모든 요구사항이 구현되고 테스트되었는지 검증
> * 누락 및 불필요한 구현 방지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-04 |
| Task명 | AppHeader PrimeVue Menubar Migration |
| 작성일 | 2025-12-16 |
| 작성자 | Claude Opus 4.5 |

---

## 1. 요구사항 추적표

### 1.1 기능 요구사항 (Functional Requirements)

| REQ ID | 요구사항 | 설계 섹션 | 구현 위치 | 테스트 케이스 | 상태 |
|--------|---------|----------|----------|-------------|------|
| REQ-01 | PrimeVue Menubar 사용 | 010-basic-design.md §3.2 | AppHeader.vue Template | TC-001 | ✅ 설계 완료 |
| REQ-02 | MenuItem 모델로 메뉴 구성 | 020-detail-design.md §2.1 | AppHeader.vue menuModel | TC-002 | ✅ 설계 완료 |
| REQ-03 | start 슬롯 로고 배치 | 020-detail-design.md §7.3 | AppHeader.vue #start | TC-003 | ✅ 설계 완료 |
| REQ-04 | 활성 라우트 하이라이팅 | 020-detail-design.md §4.4 | AppHeader.vue #item | TC-004 | ✅ 설계 완료 |
| REQ-05 | disabled 메뉴 토스트 | 020-detail-design.md §3.1 | handleMenuCommand() | TC-005 | ✅ 설계 완료 |
| REQ-06 | 접근성 (ARIA) 유지 | 020-detail-design.md §8 | AppHeader.vue Template | TC-006 | ✅ 설계 완료 |
| REQ-07 | PrimeVue 최우선 사용 | 020-detail-design.md §1.2 | AppHeader.vue Menubar | TC-001 | ✅ 설계 완료 |
| REQ-08 | CSS 클래스 중앙화 | 020-detail-design.md §6 | main.css | TC-007 | ✅ 설계 완료 |

### 1.2 비기능 요구사항 (Non-Functional Requirements)

| NFR ID | 요구사항 | 설계 섹션 | 구현 위치 | 테스트 케이스 | 상태 |
|--------|---------|----------|----------|-------------|------|
| NFR-001 | 메뉴 호버 반응성 < 100ms | 020-detail-design.md §6.1 | main.css .menubar-item | TC-008 | ✅ 설계 완료 |
| NFR-002 | 접근성 (ARIA) | 020-detail-design.md §8 | AppHeader.vue Template | TC-009 | ✅ 설계 완료 |
| NFR-003 | E2E 테스트 호환성 | 020-detail-design.md §9.2 | data-testid 유지 | TC-010 | ✅ 설계 완료 |
| NFR-004 | 다크 테마 일관성 | 020-detail-design.md §6.1 | main.css CSS 변수 | TC-011 | ✅ 설계 완료 |
| NFR-005 | 라우트 변경 반응성 | 020-detail-design.md §4.4 | isActiveRoute() | TC-012 | ✅ 설계 완료 |

---

## 2. 설계 → 구현 추적표

### 2.1 컴포넌트 구조

| 설계 요소 | 설계 위치 | 구현 파일 | 구현 함수/변수 | 상태 |
|----------|----------|----------|--------------|------|
| MenuItem 모델 | 020-detail-design.md §2.1 | AppHeader.vue | menuModel computed | 설계 완료 |
| command 핸들러 | 020-detail-design.md §3.1 | AppHeader.vue | handleMenuCommand() | 설계 완료 |
| 활성 라우트 체크 | 020-detail-design.md §4.4 | AppHeader.vue | isActiveRoute() | 설계 완료 |
| 메뉴 아이템 클래스 | 020-detail-design.md §4.5 | AppHeader.vue | getMenuItemClass() | 설계 완료 |
| 프로젝트명 표시 | 020-detail-design.md §4.1 | AppHeader.vue | displayProjectName | 설계 완료 |
| 프로젝트명 클래스 | 020-detail-design.md §4.3 | AppHeader.vue | projectNameClass | 설계 완료 |
| Pass Through 설정 | 020-detail-design.md §5.1 | AppHeader.vue | menubarPassThrough | 설계 완료 |

### 2.2 CSS 클래스

| CSS 클래스 | 설계 위치 | 구현 파일 | 사용 위치 | 상태 |
|-----------|----------|----------|----------|------|
| app-menubar | 020-detail-design.md §6.1 | main.css | Pass Through root | 설계 완료 |
| app-menubar-menu | 020-detail-design.md §6.1 | main.css | Pass Through menu | 설계 완료 |
| menubar-logo | 020-detail-design.md §6.2.1 | main.css | #start 슬롯 | 설계 완료 |
| menubar-item | 020-detail-design.md §6.2.2 | main.css | #item 템플릿 | 설계 완료 |
| menubar-item-active | 020-detail-design.md §6.2.3 | main.css | #item 템플릿 | 설계 완료 |
| menubar-item-disabled | 020-detail-design.md §6.2.4 | main.css | #item 템플릿 | 설계 완료 |
| menubar-project-name | 020-detail-design.md §6.2.6 | main.css | #end 슬롯 | 설계 완료 |
| menubar-project-name-empty | 020-detail-design.md §6.2.7 | main.css | #end 슬롯 | 설계 완료 |

---

## 3. 구현 → 테스트 추적표

### 3.1 기능 테스트

| 구현 기능 | 구현 위치 | 테스트 케이스 | 테스트 유형 | 상태 |
|----------|----------|-------------|-----------|------|
| PrimeVue Menubar 렌더링 | AppHeader.vue Template | TC-001 | E2E | 미구현 |
| MenuItem 모델 생성 | menuModel computed | TC-002 | Unit | 미구현 |
| 로고 클릭 → /wbs | #start NuxtLink | TC-003 | E2E | 미구현 |
| 활성 라우트 하이라이팅 | isActiveRoute() | TC-004 | E2E | 미구현 |
| disabled 메뉴 토스트 | handleMenuCommand() | TC-005 | E2E | 미구현 |
| ARIA 속성 적용 | #item 템플릿 | TC-006 | Accessibility | 미구현 |
| CSS 클래스 중앙화 | main.css | TC-007 | Code Review | 미구현 |

### 3.2 비기능 테스트

| 품질 속성 | 구현 위치 | 테스트 케이스 | 측정 방법 | 상태 |
|----------|----------|-------------|----------|------|
| 메뉴 호버 반응성 | main.css transition | TC-008 | Chrome DevTools | 미구현 |
| 접근성 (ARIA) | Template ARIA 속성 | TC-009 | axe DevTools | 미구현 |
| E2E 테스트 호환성 | data-testid | TC-010 | Playwright 회귀 | 미구현 |
| 다크 테마 일관성 | main.css CSS 변수 | TC-011 | 시각적 비교 | 미구현 |
| 라우트 변경 반응성 | isActiveRoute() | TC-012 | E2E | 미구현 |

---

## 4. 요구사항 커버리지 분석

### 4.1 기능 요구사항 커버리지

| 요구사항 카테고리 | 총 개수 | 설계 완료 | 구현 완료 | 테스트 완료 | 커버리지 |
|----------------|---------|----------|----------|-----------|----------|
| PrimeVue 통합 | 2 | 2 | 0 | 0 | 100% (설계) |
| 레이아웃 구조 | 2 | 2 | 0 | 0 | 100% (설계) |
| 메뉴 동작 | 2 | 2 | 0 | 0 | 100% (설계) |
| 접근성 | 1 | 1 | 0 | 0 | 100% (설계) |
| CSS 중앙화 | 1 | 1 | 0 | 0 | 100% (설계) |
| **전체** | **8** | **8** | **0** | **0** | **100% (설계)** |

### 4.2 비기능 요구사항 커버리지

| 품질 속성 | 총 개수 | 설계 완료 | 구현 완료 | 테스트 완료 | 커버리지 |
|----------|---------|----------|----------|-----------|----------|
| 성능 | 1 | 1 | 0 | 0 | 100% (설계) |
| 접근성 | 1 | 1 | 0 | 0 | 100% (설계) |
| 호환성 | 1 | 1 | 0 | 0 | 100% (설계) |
| 테마 일관성 | 1 | 1 | 0 | 0 | 100% (설계) |
| 반응성 | 1 | 1 | 0 | 0 | 100% (설계) |
| **전체** | **5** | **5** | **0** | **0** | **100% (설계)** |

---

## 5. 설계 변경 이력

| 변경 일자 | 변경 사항 | 영향 범위 | 이유 |
|----------|----------|----------|------|
| 2025-12-16 | item 템플릿 props 리네임 (props → itemProps) | 020-detail-design.md §7.4 | Vue props 이름 충돌 방지 |

---

## 6. 미구현 요구사항 (Phase 2 이후)

| 요구사항 | 이유 | 예정 단계 |
|---------|------|----------|
| 메뉴 아이콘 표시 | Phase 1에서는 텍스트만 표시 | Phase 2 |
| 모바일 반응형 | 최소 너비 1200px | Phase 3 |
| 다국어 지원 | 한국어만 지원 | Phase 4 |

---

## 7. 의존성 추적

### 7.1 외부 의존성

| 의존성 | 버전 | 사용 위치 | 목적 |
|-------|------|----------|------|
| PrimeVue | 4.x | AppHeader.vue | Menubar 컴포넌트 |
| primevue/menuitem | 4.x | AppHeader.vue | MenuItem 타입 |
| primevue/usetoast | 4.x | AppHeader.vue | 토스트 알림 |

### 7.2 내부 의존성

| 의존성 | 위치 | 사용 위치 | 목적 |
|-------|------|----------|------|
| useProjectStore | stores/ | AppHeader.vue | 프로젝트명 가져오기 |
| main.css | app/assets/css/ | AppHeader.vue | CSS 클래스 정의 |
| CSS 변수 | main.css :root | main.css | 다크 테마 색상 |

### 7.3 선행 Task 의존성

| Task ID | Task명 | 의존 관계 | 이유 |
|---------|--------|----------|------|
| TSK-08-01 | NodeIcon PrimeVue 통합 | 패턴 참조 | PrimeVue 통합 패턴 재사용 |
| TSK-08-03 | AppLayout Splitter 마이그레이션 | 패턴 참조 | Pass Through API 패턴 재사용 |

---

## 8. 검증 체크리스트

### 8.1 설계 완성도 검증

| 검증 항목 | 상태 | 비고 |
|---------|------|------|
| 모든 요구사항이 설계에 반영됨 | ✅ | 8/8 기능 요구사항, 5/5 비기능 요구사항 |
| 설계 문서 간 일관성 유지 | ✅ | 010, 011, 020 문서 일관성 확인 |
| TypeScript 인터페이스 정의 완료 | ✅ | MenuItem, Props, Pass Through |
| CSS 클래스 상세 명세 완료 | ✅ | 8개 클래스 상세 정의 |
| 접근성 (ARIA) 명세 완료 | ✅ | 7개 ARIA 속성 정의 |
| 테스트 케이스 정의 완료 | ✅ | 026-test-specification.md 참조 |

### 8.2 구현 준비도 검증

| 검증 항목 | 상태 | 비고 |
|---------|------|------|
| 구현 가능 수준의 상세 설계 | ✅ | 코드 예시 포함 |
| 외부 의존성 확인 | ✅ | PrimeVue 4.x |
| 내부 의존성 확인 | ✅ | projectStore, main.css |
| 구현 순서 정의 | ✅ | 020-detail-design.md §11 |
| 검증 기준 정의 | ✅ | 수용 기준 명시 |

---

## 9. 다음 단계

- **테스트 명세**: `026-test-specification.md` 생성 완료 후 상태 업데이트
- **wbs.md 상태 업데이트**: `[bd]` → `[dd]`
- **구현 시작**: `/wf:build` 명령어로 구현 진행

---

<!--
author: Claude Opus 4.5
Template Version: 3.0.0
Created: 2025-12-16
-->
