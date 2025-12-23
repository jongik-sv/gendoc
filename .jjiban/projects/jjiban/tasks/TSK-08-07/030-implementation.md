# 구현 문서: Task Panel Enhancement - Stepper & Missing Info

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-08-07 |
| Category | development |
| 상태 | [xx] 완료 |
| 상세설계 참조 | 020-detail-design.md |
| 구현일 | 2025-12-16 |
| 수정일 | 2025-12-16 |

## 변경 이력
| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-12-16 | 초기 구현 (Popover 방식) |
| 1.1 | 2025-12-16 | **Popover→고정영역** 변경, test 액션 확장 |

---

## 1. 구현 요약

### 1.1 완료된 변경 사항 (v1.1)

| 파일 | 변경 내용 | 라인 |
|------|----------|------|
| `types/index.ts` | TaskDetail.completed 필드 추가 | 94 |
| `server/utils/wbs/taskService.ts` | getTaskDetail()에서 completed 반환 | 325 |
| `app/assets/css/main.css` | Stepper CSS 클래스 (Popover 제거) | 723-745 |
| `app/components/wbs/detail/TaskProgress.vue` | Stepper + 고정 영역 UI | 전체 |
| `app/components/wbs/detail/TaskBasicInfo.vue` | schedule, tags, depends, ref 필드 추가 | 165-216, 495-512 |

### 1.2 구현 범위

- [x] TaskDetail 타입에 completed 필드 추가
- [x] getTaskDetail() API에서 completed 반환
- [x] TaskProgress를 클릭 가능한 Stepper로 변경
- [x] Stepper 하단에 고정 영역 표시 (완료일 + 액션 버튼) - **v1.1 변경**
- [x] 항상 표시 (토글 없음) - **v1.1 변경**
- [x] Auto 버튼 추가 (wf:auto 연결)
- [x] 상태 전이 액션 버튼
- [x] 상태 내 액션 버튼 (ui, review, apply, test, audit, patch)
- [x] test 액션: 구현 이후 모든 상태에서 가능 - **v1.1 변경**
- [x] TaskBasicInfo에 schedule 표시
- [x] TaskBasicInfo에 tags 표시 (Tag 컴포넌트)
- [x] TaskBasicInfo에 depends 표시 (클릭 시 이동)
- [x] TaskBasicInfo에 ref 표시
- [x] 키보드 접근성 지원 (Tab, Enter, Space)
- [x] 다크 테마 호환

---

## 2. 상세 구현

### 2.1 타입 확장 (types/index.ts)

```typescript
// 라인 94
export interface TaskDetail {
  // ...기존 필드
  completed?: CompletedTimestamps;  // TSK-08-07: 단계별 완료 타임스탬프
}
```

### 2.2 백엔드 수정 (server/utils/wbs/taskService.ts)

```typescript
// 라인 325
return {
  // ...기존 필드
  completed: task.completed,  // TSK-08-07: 단계별 완료 타임스탬프
};
```

### 2.3 CSS 추가 (app/assets/css/main.css)

**새로운 클래스 (라인 723-745)** - v1.1 업데이트:

| 클래스 | 용도 |
|--------|------|
| `.workflow-step-clickable` | 클릭 가능한 Stepper 노드 스타일 |
| `.workflow-step-disabled` | 비활성화된 노드 스타일 |

**Scoped CSS (TaskProgress.vue)** - v1.1 변경:

| 클래스 | 용도 |
|--------|------|
| `.workflow-step-selected` | 선택된 노드 ring 하이라이트 |
| `.workflow-step-detail` | 고정 영역 컨테이너 |
| `.step-detail-header` | 단계명 + 완료일 헤더 |
| `.step-detail-actions` | 액션 버튼 그룹 |

### 2.4 TaskProgress.vue 리팩토링 (v1.1)

**주요 변경 사항**:

1. **클릭 가능한 Stepper 노드**
   - `<div>` → `<button>` 변경
   - `@click`, `@keydown.enter`, `@keydown.space` 이벤트 핸들러

2. **고정 영역 UI (v1.1 변경)**
   - Popover 제거 → `.workflow-step-detail` 고정 영역
   - 항상 표시 (토글 없음)
   - 마운트 시 현재 단계 자동 선택

3. **고정 영역 콘텐츠**
   - 단계명 + 완료일 (헤더)
   - Auto 버튼 (현재 단계만)
   - 액션 버튼들 (모든 단계 표시, 현재 단계만 enabled)

4. **접근성**
   - `role="button"`, `tabindex="0"`
   - `aria-label`, `aria-current="step"`, `aria-selected`

5. **test 액션 확장 (v1.1)**
   - [im], [vf], [xx] 상태 모두에서 test 버튼 표시

### 2.5 TaskBasicInfo.vue 확장

**추가 필드 (라인 165-216)**:

| 필드 | 컴포넌트 | 조건 |
|------|----------|------|
| schedule | 텍스트 (시작 ~ 종료) | `v-if="task.schedule"` |
| tags | Tag 컴포넌트 (복수) | `v-if="task.tags && task.tags.length > 0"` |
| depends | Button (text, 클릭→이동) | `v-if="task.depends && task.depends.length > 0"` |
| ref | 텍스트 | `v-if="task.ref"` |

**추가 메서드 (라인 495-512)**:
- `formatSchedule()`: 일정 포맷팅
- `navigateToTask()`: depends 클릭 시 Task 이동

---

## 3. 테스트

### 3.1 빌드 검증

```bash
npm run build
# ✓ Client built in 8846ms
# ✓ Server built in 6599ms
# ✓ Nuxt Nitro server built
```

### 3.2 수동 테스트 체크리스트

- [ ] Task 상세 화면에서 Stepper 렌더링 확인
- [ ] 단계 클릭 시 Popover 표시 확인
- [ ] Popover에 완료일 표시 확인
- [ ] Auto 버튼 클릭 시 wf:auto 실행 확인
- [ ] 액션 버튼 클릭 시 워크플로우 명령 실행 확인
- [ ] TaskBasicInfo에 schedule, tags, depends, ref 표시 확인
- [ ] depends 클릭 시 해당 Task로 이동 확인
- [ ] 키보드 네비게이션 (Tab, Enter, Space, Escape) 확인
- [ ] 다크 테마에서 스타일 확인

---

## 4. 관련 문서

- 기본설계: `010-basic-design.md`
- UI설계: `011-ui-design.md`
- 상세설계: `020-detail-design.md`
- PRD: `.jjiban/docs/jjiban/jjiban-prd.md` (섹션 8.3)
