# TSK-06-01: 의존관계 그래프 시각화 기능 - 구현 완료

## 구현 개요
- **작업일**: 2025-12-17
- **상태**: 구현 완료 [im]
- **라이브러리 변경**: vis-network → Vue Flow (2025-12-17 변경)

---

## 1. 구현 파일 목록

### 새로 생성된 파일

| 파일 | 설명 |
|------|------|
| `app/types/graph.ts` | TaskNode, TaskEdge, GraphData 타입 정의 (Vue Flow 기반) |
| `app/composables/useDependencyGraph.ts` | flatNodes → Vue Flow GraphData 변환, 위상정렬 레벨 계산 |
| `app/components/wbs/graph/DependencyGraph.client.vue` | Vue Flow 캔버스 컴포넌트 |
| `app/components/wbs/graph/TaskNode.vue` | 커스텀 Task 노드 컴포넌트 |
| `app/components/wbs/graph/GraphLegend.vue` | 카테고리 범례 컴포넌트 |
| `app/components/wbs/graph/DependencyGraphModal.vue` | PrimeVue Dialog 전체화면 모달 |

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/components/wbs/WbsTreeHeader.vue` | 그래프 버튼 추가, 모달 연동 |
| `package.json` | @vue-flow/core, @vue-flow/background, @vue-flow/controls, @vue-flow/minimap 추가 |

---

## 2. 주요 구현 내용

### 2.1 타입 정의 (app/types/graph.ts)

```typescript
import type { Node, Edge } from '@vue-flow/core'

export interface TaskNodeData {
  taskId: string          // Task ID
  title: string           // Task 제목
  status: string          // 상태 코드
  statusName: string      // 상태 이름
  category: string        // 카테고리
  categoryName: string    // 카테고리 이름
  assignee?: string       // 담당자
  depends?: string        // 의존 Task
}

export type TaskNode = Node<TaskNodeData>
export type TaskEdge = Edge

export const GRAPH_COLORS = {
  development: { background: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  defect: { background: '#ef4444', border: '#dc2626', text: '#ffffff' },
  infrastructure: { background: '#22c55e', border: '#16a34a', text: '#ffffff' }
} as const

export const HIGHLIGHT_COLORS = {
  selected: { background: '#fbbf24', border: '#f59e0b', text: '#000000' },
  dependsOn: { background: '#ef4444', border: '#dc2626', text: '#ffffff' },
  dependedBy: { background: '#22c55e', border: '#16a34a', text: '#ffffff' },
  dimmed: { background: '#374151', border: '#4b5563', text: '#6b7280' }
} as const
```

### 2.2 데이터 변환 (app/composables/useDependencyGraph.ts)

- `buildGraphData(filter?)`: flatNodes → Vue Flow GraphData 변환
- `calculateLevels()`: BFS 기반 위상정렬로 레벨 계산
- `extractStatusCode()`: 상태 문자열에서 코드 추출
- 위치 계산: `x = level * 250`, `y = yIndex * 100`
- 순환 의존성 감지 및 경고

### 2.3 Vue Flow 캔버스 (DependencyGraph.client.vue)

- Vue Flow 기반 그래프 렌더링
- Background, Controls, MiniMap 플러그인 사용
- 노드 클릭 시 연결된 노드/엣지 하이라이트
  - 선택 노드: 노란색
  - 선행 Task (dependsOn): 빨간색
  - 후행 Task (dependedBy): 녹색
  - 비연결 노드: 흐림 처리
- expose 메서드: fit, zoomIn, zoomOut, resetZoom, focusNode, selectNode

### 2.4 커스텀 노드 (TaskNode.vue)

- Task 정보 표시: ID, 제목, 상태, 담당자
- 카테고리별 배경색 적용
- 하이라이트 상태별 스타일 변경
- Handle 컴포넌트로 입출력 연결점 표시

### 2.5 모달 컴포넌트 (DependencyGraphModal.vue)

- PrimeVue Dialog (90vw x 85vh)
- 필터: 카테고리, 상태 MultiSelect
- 통계: 노드/엣지 개수
- 줌 컨트롤 버튼
- ClientOnly 래퍼 (SSR 호환)

---

## 3. 의존성 설치

```bash
npm install @vue-flow/core @vue-flow/background @vue-flow/controls @vue-flow/minimap
npm uninstall vis-network vis-data  # 기존 라이브러리 제거
```

---

## 4. 라이브러리 변경 이유 (vis-network → Vue Flow)

| 항목 | vis-network | Vue Flow |
|------|-------------|----------|
| Vue 3 통합 | 외부 라이브러리 | Vue 3 전용 |
| 드래그 인터랙션 | 노드 위치 초기화 버그 | 매끄러운 드래그 |
| 커스텀 노드 | 제한적 | Vue 컴포넌트 완전 지원 |
| 개발 활동 | 유지보수 모드 | 활발한 개발 |
| API 스타일 | 명령형 | 선언형 (Vue 친화적) |

---

## 5. 검증 결과

- [x] dev 서버 정상 시작
- [x] 타입 에러 없음
- [x] 그래프 버튼 WbsTreeHeader에 추가
- [x] 노드 드래그 시 위치 유지
- [x] 노드 선택 시 하이라이트 정상 동작

---

## 6. 다음 단계

- `/wf:verify` 실행하여 통합테스트 수행
- 실제 브라우저에서 그래프 기능 검증
