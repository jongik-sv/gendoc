# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-17

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-01 |
| Task명 | 전역 터미널 및 워크플로우 통합 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-17 |
| 작성자 | Claude |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban개선/prd.md` | 3.1, 5.3 |
| TRD | `.jjiban/projects/jjiban개선/trd.md` | 5.1, 5.3 |

---

## 1. 목적 및 범위

### 1.1 목적

터미널 시스템(WP-01)과 워크플로우 시스템(WP-02)의 통합을 통해 사용자가 웹 UI에서 LLM CLI 워크플로우를 직접 실행할 수 있는 환경을 제공합니다.

- AppHeader에 전역 터미널 접근점 제공
- TaskDetailPanel에 워크플로우 액션 버튼 통합
- 터미널 세션과 워크플로우 명령어의 연동

### 1.2 범위

**포함 범위**:
- AppHeader에 TerminalHeaderIcon 컴포넌트 추가
- TaskDetailPanel에 WorkflowActions 컴포넌트 추가
- 터미널 세션 생성 및 워크플로우 실행 연동
- 워크플로우 버튼 클릭 시 터미널 프롬프트 생성 및 전송

**제외 범위**:
- 터미널 UI 컴포넌트 구현 → TSK-01-02
- 서버 터미널 세션 API → TSK-01-03
- 워크플로우 액션 UI 컴포넌트 → TSK-02-01
- 워크플로우 프롬프트 생성 → TSK-02-02
- 워크플로우 타입 및 스토어 → TSK-02-03

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | AppHeader에 TerminalHeaderIcon 배치 | Critical | 3.1 |
| FR-002 | 터미널 아이콘 클릭 시 TerminalDialog 열기 | Critical | 3.2 |
| FR-003 | 실행 중 세션 개수 배지 표시 | High | 3.2 |
| FR-004 | TaskDetailPanel에 WorkflowActions 섹션 추가 | Critical | 5.3 |
| FR-005 | 워크플로우 버튼 클릭 시 터미널 세션 생성 | High | 1.4 |
| FR-006 | 워크플로우 프롬프트 터미널 자동 입력 | High | 1.4 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 버튼 반응 시간 | < 100ms |
| NFR-002 | 터미널 연결 시간 | < 500ms |
| NFR-003 | 컴포넌트 렌더링 | < 50ms |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│ AppHeader                                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Logo | Navigation | ... | [TerminalHeaderIcon + Badge]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼ (click)
┌─────────────────────────────────────────────────────────────────┐
│ TerminalDialog (전역 모달)                                       │
│ ┌──────────────┬───────────────────────────────────────────────┐│
│ │ SessionList  │ TerminalView (xterm.js)                       ││
│ └──────────────┴───────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TaskDetailPanel                                                  │
│ ├─ TaskBasicInfo                                                │
│ ├─ TaskProgress                                                 │
│ ├─ TaskDocuments                                                │
│ ├─ TaskHistory                                                  │
│ └─ WorkflowActions (신규 통합)                                   │
│     ├─ WorkflowButton (상태별 명령어)                            │
│     └─ WorkflowAutoActions (run/auto/stop)                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| AppHeader | 전역 네비게이션 | TerminalHeaderIcon 배치 |
| TerminalHeaderIcon | 터미널 접근점 | 아이콘 + 세션 배지 + 다이얼로그 트리거 |
| TerminalDialog | 터미널 관리 | 세션 목록 + 터미널 뷰 통합 |
| TaskDetailPanel | Task 상세 정보 | WorkflowActions 섹션 추가 |
| WorkflowActions | 워크플로우 실행 | 버튼 렌더링 + 명령어 실행 |

### 3.3 데이터 흐름

```
1. 워크플로우 버튼 클릭
   │
   ▼
2. WorkflowActions → terminalStore.createSession()
   │
   ▼
3. 세션 생성 성공 → 프롬프트 생성 ("/wf:{command} {project}/{taskId}")
   │
   ▼
4. terminalStore.sendInput(prompt)
   │
   ▼
5. 터미널 다이얼로그 자동 열기 (선택적)
   │
   ▼
6. SSE로 터미널 출력 스트리밍
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 터미널 접근 방식 | A) 각 Task에 임베드, B) 전역 다이얼로그 | B | Task 독립적 세션 관리, auto 명령어 지원 |
| 워크플로우 실행 | A) API 직접 호출, B) 터미널 프롬프트 | B | 기존 /wf:* 명령어 재사용, CLI 호환성 |
| 배지 상태 관리 | A) terminalStore, B) executionStore | A | 세션 정보 중앙 집중 |
| 다이얼로그 트리거 | A) 수동만, B) 워크플로우 실행 시 자동 | B | UX 개선, 즉시 피드백 |

---

## 5. 인수 기준

- [ ] AC-01: AppHeader에 터미널 아이콘이 표시된다
- [ ] AC-02: 터미널 아이콘 클릭 시 TerminalDialog가 열린다
- [ ] AC-03: 실행 중인 세션 개수가 배지로 표시된다
- [ ] AC-04: TaskDetailPanel에 WorkflowActions 섹션이 표시된다
- [ ] AC-05: 워크플로우 버튼 클릭 시 터미널 세션이 생성된다
- [ ] AC-06: 워크플로우 프롬프트가 터미널에 자동 입력된다
- [ ] AC-07: 프롬프트 실행 후 터미널 다이얼로그가 자동으로 열린다

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 선행 Task 미완료 | High | TSK-01-02, TSK-02-01 완료 확인 후 통합 |
| 스토어 충돌 | Medium | terminalStore, workflowStore 명확한 역할 분리 |
| 다이얼로그 Z-index 이슈 | Low | PrimeVue Dialog 기본 설정 활용 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-01-02 | 선행 | 터미널 UI 컴포넌트 (TerminalHeaderIcon, TerminalDialog, TerminalView) |
| TSK-02-01 | 선행 | 워크플로우 액션 UI (WorkflowActions, WorkflowButton) |
| TSK-02-03 | 선행 | 워크플로우 타입 및 스토어 |

---

## 7. 통합 포인트 상세

### 7.1 AppHeader 수정

```
현재:
<Menubar :model="menuItems" />

변경:
<Menubar :model="menuItems" />
<TerminalHeaderIcon />  <!-- 우측 끝 -->
```

### 7.2 TaskDetailPanel 수정

```
현재:
<TaskBasicInfo />
<TaskProgress />
<TaskDocuments />
<TaskHistory />

변경:
<TaskBasicInfo />
<TaskProgress />
<TaskDocuments />
<TaskHistory />
<WorkflowActions :task="selectedTask" />  <!-- 하단 추가 -->
```

### 7.3 워크플로우 실행 흐름

1. WorkflowActions에서 버튼 클릭
2. terminalStore.createSession(taskId, projectId) 호출
3. 세션 생성 완료 후 프롬프트 생성
4. terminalStore.sendInput(prompt + '\n') 호출
5. TerminalDialog visible = true 설정 (자동 열기)
6. 사용자가 터미널 출력 확인

---

## 8. 다음 단계

- `/wf:ui` 명령어로 화면설계 진행
- `/wf:draft` 명령어로 상세설계 진행

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban개선/prd.md`
- TRD: `.jjiban/projects/jjiban개선/trd.md`
- 화면설계: `011-ui-design.md` (다음 단계)
- 상세설계: `020-detail-design.md` (다음 단계)

---

<!--
author: Claude
Template Version: 1.0.0
-->
