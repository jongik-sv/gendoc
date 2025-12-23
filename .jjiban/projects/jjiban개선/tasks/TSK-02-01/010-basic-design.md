# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-01 |
| Task명 | 워크플로우 액션 UI |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 섹션 2.2, 3.3~3.5 |
| TRD | `.jjiban/projects/jjiban개선/trd.md` | 섹션 5.3, 6 |

---

## 1. 목적 및 범위

### 1.1 목적

Task 상세 패널에서 워크플로우 명령어(`/wf:*`)를 버튼 UI로 제공하여, 상태/카테고리 기반 필터링된 명령어를 원클릭으로 실행할 수 있도록 합니다.

### 1.2 범위

**포함 범위**:
- WorkflowButton 컴포넌트 (상태별 스타일링)
- WorkflowActions 컴포넌트 (15개 명령어 버튼 그룹)
- WorkflowAutoActions 컴포넌트 (run, auto, 중지)
- 카테고리/상태 기반 가용성 필터링

**제외 범위**:
- 프롬프트 생성 및 터미널 연동 → TSK-02-02
- 타입 정의 및 스토어 → TSK-02-03
- 터미널 통합 → TSK-01-02, TSK-01-03

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | 15개 워크플로우 명령어 버튼 렌더링 | High | 섹션 2.1 |
| FR-002 | Task 상태/카테고리 기반 버튼 가용성 필터링 | High | 섹션 2.2 |
| FR-003 | 버튼 상태 스타일링 (사용 가능/불가/실행 중/완료) | Medium | 섹션 3.5 |
| FR-004 | 자동실행 버튼 그룹 (run, auto, 중지) | Medium | 섹션 3.3 |
| FR-005 | 버튼 클릭 시 execute 이벤트 emit | High | - |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 버튼 반응 시간 | < 100ms |
| NFR-002 | 접근성 (키보드 네비게이션) | Tab 이동 지원 |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
TaskDetailPanel
└── WorkflowActions
    ├── WorkflowButton (×13개: start, ui, draft, ...)
    └── WorkflowAutoActions
        ├── Button (run)
        ├── Button (auto)
        └── Button (중지)
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| WorkflowButton | 개별 명령어 버튼 | 스타일링, 클릭 이벤트, 로딩 상태 |
| WorkflowActions | 버튼 그룹 컨테이너 | 가용성 필터링, 이벤트 전파 |
| WorkflowAutoActions | 자동실행 버튼 그룹 | run/auto/중지 버튼 렌더링 |

### 3.3 명령어 버튼 목록

| 명령어 | 라벨 | 아이콘 | severity |
|--------|------|--------|----------|
| start | 시작 | pi-play | primary |
| ui | UI설계 | pi-palette | info |
| draft | 상세설계 | pi-pencil | info |
| review | 리뷰 | pi-eye | secondary |
| apply | 적용 | pi-check | secondary |
| build | 구현 | pi-wrench | warning |
| test | 테스트 | pi-bolt | secondary |
| audit | 코드리뷰 | pi-search | secondary |
| patch | 패치 | pi-file-edit | secondary |
| verify | 검증 | pi-verified | success |
| done | 완료 | pi-check-circle | success |
| fix | 수정 | pi-wrench | danger |
| skip | 생략 | pi-forward | secondary |

### 3.4 가용성 필터링 규칙

| 상태 | development | defect | infrastructure |
|------|-------------|--------|----------------|
| `[ ]` | start | start | start, skip |
| `[bd]` | ui, draft | - | - |
| `[dd]` | review, apply, build | - | build |
| `[an]` | - | fix | - |
| `[fx]` | - | audit, patch, verify | - |
| `[im]` | test, audit, patch, verify | - | audit, patch, done |
| `[vf]` | done | done | - |

### 3.5 데이터 흐름

```
1. TaskDetailPanel → WorkflowActions (props: task)
2. WorkflowActions: 상태/카테고리 기반 필터링
3. WorkflowButton: 클릭 → emit('execute', command)
4. WorkflowActions: 상위로 이벤트 전파
5. TaskDetailPanel: execute 이벤트 처리 (TSK-02-02에서 구현)
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 버튼 컴포넌트 | PrimeVue Button, Custom | PrimeVue Button | severity, loading 내장 지원 |
| 레이아웃 | Grid, Flex | Flex wrap | 버튼 개수 가변, 반응형 지원 |
| 필터링 위치 | 컴포넌트, composable | computed (컴포넌트) | 단순, 직관적 |

---

## 5. 인수 기준

- [ ] AC-01: WorkflowButton이 label, icon, severity에 따라 렌더링된다
- [ ] AC-02: WorkflowActions가 13개 명령어 버튼을 렌더링한다
- [ ] AC-03: 비활성 버튼은 disabled 스타일과 tooltip을 표시한다
- [ ] AC-04: 실행 중 버튼은 loading spinner를 표시한다
- [ ] AC-05: WorkflowAutoActions가 run/auto/중지 버튼을 렌더링한다
- [ ] AC-06: 버튼 클릭 시 execute 이벤트가 command 이름과 함께 emit된다

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 버튼 개수 많아 UI 혼잡 | Medium | 카테고리별 그룹핑 고려 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| PrimeVue Button | 라이브러리 | 버튼 UI 컴포넌트 |
| TSK-02-02 | 후행 | 프롬프트 생성 및 터미널 연동 |

---

## 7. 다음 단계

- `/wf:ui` 명령어로 화면설계 진행 (선택)
- `/wf:draft` 명령어로 상세설계 진행

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban개선/prd.md`
- TRD: `.jjiban/projects/jjiban개선/trd.md`
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude
Template Version: 1.0.0
-->
