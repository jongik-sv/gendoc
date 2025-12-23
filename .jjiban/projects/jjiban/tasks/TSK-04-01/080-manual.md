# 사용자 매뉴얼 (080-manual.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **목적**
> * WBS Tree Panel 컴포넌트 사용 가이드
> * 개발자 및 사용자를 위한 참조 문서

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | Tree Panel |
| 작성일 | 2025-12-15 |
| 버전 | 1.0.0 |

---

## 1. 개요

WBS Tree Panel은 프로젝트의 Work Breakdown Structure를 시각적으로 표시하는 컴포넌트입니다.

### 1.1 주요 기능

- WBS 트리 구조 표시 (WP → ACT → TSK 계층)
- 통계 카드 (WP/ACT/TSK 개수, 진행률)
- 검색 및 필터링
- 전체 펼치기/접기

---

## 2. 컴포넌트 구성

### 2.1 WbsTreePanel

**역할**: 메인 컨테이너, 데이터 로드 조정

**파일**: `app/components/wbs/WbsTreePanel.vue`

**기능**:
- Route에서 projectId 추출
- WBS API 호출 및 데이터 로드
- 로딩/에러/정상 상태 관리
- 에러 시 리트라이 버튼 제공

**사용 예**:
```vue
<WbsTreePanel />
```

**라우트 쿼리**:
- `projectId`: 표시할 프로젝트 ID (필수)

### 2.2 WbsTreeHeader

**역할**: 헤더 UI (검색, 액션 버튼)

**파일**: `app/components/wbs/WbsTreeHeader.vue`

**기능**:
- WbsSearchBox 포함
- 전체 펼치기/접기 버튼
- WbsSummaryCards 포함

### 2.3 WbsSummaryCards

**역할**: 통계 카드 표시

**파일**: `app/components/wbs/WbsSummaryCards.vue`

**표시 정보**:
- WP 개수
- ACT 개수
- TSK 개수
- 전체 진행률 (%)

### 2.4 WbsSearchBox

**역할**: 검색 입력 박스

**파일**: `app/components/wbs/WbsSearchBox.vue`

**기능**:
- 검색어 입력 (300ms debounce)
- X 버튼으로 검색어 초기화
- Enter 키 지원
- 스크린 리더 힌트 제공

---

## 3. 상태 관리

### 3.1 WBS Store

**파일**: `app/stores/wbs.ts`

**상태**:
- `tree`: WBS 트리 데이터
- `loading`: 로딩 상태
- `error`: 에러 메시지
- `searchQuery`: 검색어
- `expandAll`: 전체 펼침 상태

**계산된 속성**:
- `wpCount`: WP 개수
- `actCount`: ACT 개수
- `tskCount`: TSK 개수
- `overallProgress`: 전체 진행률

**액션**:
- `fetchWbs(projectId)`: WBS 데이터 로드
- `setSearchQuery(query)`: 검색어 설정
- `toggleExpandAll()`: 전체 펼침 토글
- `clearWbs()`: 상태 초기화

---

## 4. 접근성

### 4.1 지원 기능

- 모든 인터랙티브 요소에 `aria-label` 적용
- 검색 박스에 `role="searchbox"` 사용
- 로딩 상태 `aria-busy` 표시
- 스크린 리더용 힌트 (`.sr-only`)

### 4.2 키보드 지원

- Tab: 포커스 이동
- Enter: 검색 실행, 버튼 클릭
- Escape: 검색어 초기화 (X 버튼 포커스 시)

---

## 5. 테스트 ID

| 요소 | data-testid |
|------|-------------|
| 메인 패널 | `wbs-tree-panel` |
| 로딩 상태 | `loading-state` |
| 에러 상태 | `error-state` |
| 리트라이 버튼 | `retry-button` |
| 콘텐츠 | `content-state` |
| 빈 상태 | `empty-state` |
| 검색 입력 | `search-input` |
| 검색 클리어 | `search-clear` |
| 전체 펼치기 | `expand-all-btn` |
| 통계 카드 | `wbs-summary-cards` |
| WP 카드 | `wp-card` |
| ACT 카드 | `act-card` |
| TSK 카드 | `tsk-card` |
| 진행률 카드 | `progress-card` |

---

## 6. 의존성

### 6.1 필수 패키지

- PrimeVue 4.x (Card, Button, InputText, ProgressSpinner, Message)
- @vueuse/core (useDebounceFn)
- Pinia (상태 관리)

### 6.2 관련 Task

- TSK-01-01-02: PrimeVue 설정
- TSK-01-01-03: Pinia 설정
- TSK-03-02: WBS API

---

## 7. 알려진 제한사항

1. **트리 노드 렌더링**: TSK-04-02에서 구현 예정
2. **키보드 네비게이션**: TSK-04-03에서 구현 예정
3. **E2E 테스트**: API 응답에 의존하여 일부 테스트 보류

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2025-12-15 | 초기 릴리스 |

---

<!--
author: Claude
Template Version: 1.0.0
Created: 2025-12-15
-->
