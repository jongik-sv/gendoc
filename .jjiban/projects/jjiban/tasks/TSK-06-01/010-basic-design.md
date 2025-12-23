# 기본설계 (010-basic-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 기능 중심 설계에 집중
> * 구현 코드 포함 금지
> * PRD/TRD와 일관성 유지

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-06-01 |
| Task명 | Integration |
| Category | development |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | AI Agent |
 
### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 9.1, 9.3, 11 |
| TRD | `.jjiban/projects/jjiban/trd.md` | 전체 |

---

## 1. 목적 및 범위

### 1.1 목적

TSK-04-03 (Tree Interaction)과 TSK-05-03 (Detail Actions)에서 구현된 WBS 트리 패널과 Task 상세 패널을 통합하여 완전한 WBS 페이지를 구성한다. 프로젝트 스토어, WBS 스토어, 선택 스토어 간의 상태 연동을 구현하고, 에러 핸들링, 로딩 상태, 빈 상태 등 사용자 경험을 완성한다.

**핵심 가치**:
- WBS 트리와 Task 상세 패널의 원활한 연동
- 통합된 상태 관리로 일관된 사용자 경험
- 안정적인 에러 핸들링과 사용자 피드백
- 완성도 높은 로딩 및 빈 상태 처리

### 1.2 범위

**포함 범위**:
- WBS 페이지 통합 (pages/wbs.vue 개선)
- 패널 레이아웃 통합 (WbsTreePanel + TaskDetailPanel)
- 상태 관리 통합 (project, wbs, selection 스토어 연동)
- 에러 핸들링 (토스트 메시지, 에러 상태 표시)
- 로딩 상태 (스피너, 스켈레톤 UI)
- 빈 상태 (Empty State: 프로젝트 없음, WBS 없음, Task 미선택)
- Toast 통합 (성공/에러/경고 메시지)
- 라이프사이클 관리 (onMounted, onUnmounted, watch)

**제외 범위**:
- WbsTreePanel 내부 구현 → TSK-04-03 (Tree Interaction)
- TaskDetailPanel 내부 구현 → TSK-05-03 (Detail Actions)
- API 엔드포인트 구현 → TSK-03-01, TSK-03-02 (Backend API)
- 워크플로우 엔진 → TSK-03-04 (Workflow Engine)

---

## 2. 요구사항 분석

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | PRD 참조 |
|----|----------|----------|----------|
| FR-001 | WBS 페이지에서 프로젝트 ID를 URL 쿼리에서 읽어 로드 | High | 섹션 9.1 |
| FR-002 | 프로젝트 로드 후 WBS 데이터 자동 조회 | High | 섹션 9.1, 9.3 |
| FR-003 | WBS 트리 노드 선택 시 상세 패널 자동 업데이트 | High | 섹션 9.3 |
| FR-004 | 로딩 중 스피너 표시 (프로젝트, WBS, Task) | Medium | 섹션 11 |
| FR-005 | 에러 발생 시 Toast 메시지 표시 | High | 섹션 11 |
| FR-006 | 프로젝트 없음 상태 처리 (Empty State) | Medium | 섹션 11 |
| FR-007 | WBS 데이터 없음 상태 처리 (Empty State) | Medium | 섹션 11 |
| FR-008 | Task 미선택 상태 처리 (Empty State) | Medium | 섹션 11 |
| FR-009 | 페이지 언마운트 시 상태 초기화 | Low | 섹션 9.3 |
| FR-010 | 스토어 간 반응형 상태 연동 (watch) | High | 섹션 9.3 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-001 | 페이지 초기 로딩 시간 | < 1초 |
| NFR-002 | 노드 선택 → 상세 패널 표시 시간 | < 200ms |
| NFR-003 | 에러 발생 시 복구 가능성 | 100% (재시도 버튼 제공) |
| NFR-004 | Toast 메시지 자동 사라짐 시간 | 3초 |
| NFR-005 | 반응형 레이아웃 최소 너비 | 1200px |

---

## 3. 설계 방향

### 3.1 아키텍처 개요

WBS 페이지는 중앙 컨트롤러 역할을 하며, 3개의 Pinia 스토어(project, wbs, selection)를 조율하여 좌우 패널을 동기화한다. 데이터 로딩은 순차적(프로젝트 → WBS → Task)으로 진행되며, 각 단계에서 에러가 발생하면 적절한 Empty State 또는 에러 메시지를 표시한다.

**핵심 원칙**:
- 단일 진실 공급원 (Single Source of Truth): Pinia 스토어
- 반응형 상태 관리 (Reactive State): computed, watch 활용
- 에러 회복성 (Error Resilience): try-catch + Toast + 재시도
- 사용자 피드백 (User Feedback): 로딩, 에러, 빈 상태 명확히 표시

### 3.2 핵심 컴포넌트

| 컴포넌트 | 역할 | 책임 |
|----------|------|------|
| pages/wbs.vue | 페이지 컨트롤러 | - URL 쿼리 파싱<br>- 프로젝트/WBS 로딩 조율<br>- 에러 핸들링<br>- 상태 간 연동<br>- Toast 관리 |
| WbsTreePanel | 좌측 패널 (60%) | - WBS 트리 렌더링<br>- 노드 선택 이벤트 발생<br>- 검색/필터링<br>- 펼침/접기 상태 관리 |
| TaskDetailPanel | 우측 패널 (40%) | - Task 상세 정보 표시<br>- 인라인 편집<br>- 상태 전이<br>- 문서 링크 |
| useProjectStore | 프로젝트 상태 관리 | - currentProject 제공<br>- loadProject() 액션 |
| useWbsStore | WBS 상태 관리 | - tree, filteredTree 제공<br>- fetchWbs() 액션 |
| useSelectionStore | 선택 상태 관리 | - selectedNodeId, selectedTask 제공<br>- selectNode() 액션 |
| PrimeVue Toast | 알림 메시지 | - 성공/에러/경고 메시지 표시<br>- 자동 사라짐 |

### 3.3 데이터 흐름

```
URL 쿼리 (?projectId=xxx)
  ↓
pages/wbs.vue (onMounted)
  ↓
projectStore.loadProject(projectId)
  ↓ (성공)
wbsStore.fetchWbs(projectId)
  ↓ (성공)
WbsTreePanel 렌더링
  ↓ (사용자 노드 선택)
selectionStore.selectNode(nodeId)
  ↓ (Task 타입인 경우)
selectionStore.loadTaskDetail(taskId)
  ↓ (성공)
TaskDetailPanel 렌더링

[에러 발생 시]
  ↓
pages/wbs.vue (catch)
  ↓
Toast 에러 메시지 표시
  ↓
Empty State 또는 재시도 버튼 표시
```

---

## 4. 기술적 결정

| 결정 | 고려 옵션 | 선택 | 근거 |
|------|----------|------|------|
| 상태 관리 전략 | 1) Props Drilling, 2) Provide/Inject, 3) Pinia | Pinia | 이미 구현되어 있으며, 반응형 상태 관리가 명확함 |
| 에러 핸들링 방식 | 1) 로컬 상태, 2) Toast만, 3) Toast + Empty State | Toast + Empty State | 사용자에게 명확한 피드백 제공, 재시도 옵션 포함 |
| 로딩 UI | 1) 스피너만, 2) 스켈레톤만, 3) 혼합 사용 | 혼합 사용 | 짧은 로딩(스피너), 긴 로딩(스켈레톤) 구분 |
| 패널 크기 조정 | 1) 고정, 2) 리사이즈 가능 | 고정 (60%/40%) | 1차 범위에서는 고정, 2차에서 리사이즈 구현 |
| URL 쿼리 관리 | 1) props, 2) useRoute | useRoute | Nuxt 표준 패턴, SSR 호환 |
| Toast 라이브러리 | 1) 커스텀, 2) PrimeVue Toast | PrimeVue Toast | UI 통일성, 이미 설치된 라이브러리 활용 |

---

## 5. 인수 기준

- [ ] AC-01: URL 쿼리에서 projectId를 읽어 프로젝트 로딩
- [ ] AC-02: 프로젝트 로딩 성공 후 WBS 데이터 자동 조회
- [ ] AC-03: WBS 트리 노드 선택 시 상세 패널 즉시 업데이트
- [ ] AC-04: 프로젝트 없음 시 "프로젝트를 선택하세요" Empty State 표시
- [ ] AC-05: WBS 데이터 없음 시 "WBS 데이터가 없습니다" Empty State 표시
- [ ] AC-06: Task 미선택 시 "Task를 선택하세요" Empty State 표시
- [ ] AC-07: 로딩 중 스피너 표시 (프로젝트, WBS, Task)
- [ ] AC-08: 에러 발생 시 Toast 메시지 표시 및 재시도 버튼 제공
- [ ] AC-09: 페이지 언마운트 시 상태 초기화 (메모리 누수 방지)
- [ ] AC-10: 모든 상태 변경이 반응형으로 즉시 반영됨

---

## 6. 리스크 및 의존성

### 6.1 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| API 응답 지연 (>5초) | High | 타임아웃 설정, 로딩 스피너, 재시도 버튼 |
| 스토어 간 상태 불일치 | Medium | watch로 자동 동기화, 단일 진실 공급원 원칙 |
| 메모리 누수 (watch 미정리) | Low | onUnmounted에서 watch 정리, Nuxt 자동 정리 활용 |
| Empty State 혼란 | Low | 명확한 메시지, 재시도 버튼 제공 |

### 6.2 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| TSK-04-03 | 선행 | WbsTreePanel 컴포넌트 구현 완료 필요 |
| TSK-05-03 | 선행 | TaskDetailPanel 컴포넌트 구현 완료 필요 |
| TSK-03-01 | 선행 | GET /api/projects/:id API 구현 완료 필요 |
| TSK-03-02 | 선행 | GET /api/projects/:id/wbs API 구현 완료 필요 |
| TSK-01-01-03 | 선행 | Pinia 스토어 구조 완료 필요 |

---

## 7. 다음 단계

- `/wf:draft` 명령어로 상세설계 진행

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md`
- TRD: `.jjiban/projects/jjiban/trd.md`
- 상세설계: `020-detail-design.md` (다음 단계)
- TSK-04-03 상세설계: `.jjiban/projects/jjiban/tasks/TSK-04-03/020-detail-design.md`
- TSK-05-03 상세설계: `.jjiban/projects/jjiban/tasks/TSK-05-03/020-detail-design.md`

---

<!--
author: AI Agent
Template Version: 1.0.0
-->
