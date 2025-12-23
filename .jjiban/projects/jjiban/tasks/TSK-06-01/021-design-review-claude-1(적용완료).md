# 설계 리뷰 (021-design-review-claude-1.md)

**리뷰 일시**: 2025-12-15
**리뷰어**: Claude (refactoring-expert)
**Task ID**: TSK-06-01
**Task명**: Integration

---

## 1. 리뷰 요약

| 항목 | 평가 | 비고 |
|------|------|------|
| SOLID 원칙 | Pass | 단일 책임 원칙 준수, 의존성 역전 양호 |
| 기술 부채 | Low | 체계적 설계, 복잡도 관리 우수 |
| PRD 일관성 | Pass | 요구사항 100% 매핑, 추적성 완벽 |
| 테스트 용이성 | Pass | 테스트 시나리오 완전, data-testid 체계적 |
| 보안 | Pass | 파일 기반 시스템 특성상 위험 낮음 |

**전체 평가**: 우수한 설계 품질. 명확한 책임 분리, 완전한 요구사항 추적, 체계적인 테스트 전략을 갖추고 있음. 제시된 개선사항은 대부분 선택적 최적화에 해당함.

---
 
## 2. 상세 리뷰

### 2.1 긍정적 평가 (Strengths)

**아키텍처 설계**:
- 중앙 컨트롤러 패턴(pages/wbs.vue)으로 명확한 책임 분리
- 3개 Pinia 스토어(project, wbs, selection) 간 조율 로직이 단일 위치에 집중
- 순차 로딩 패턴(프로젝트 → WBS → Task)으로 데이터 의존성 명확화

**상태 관리**:
- 반응형 상태 연동(watch, computed)으로 스토어 간 자동 동기화
- 단일 진실 공급원(Single Source of Truth) 원칙 준수
- onUnmounted 라이프사이클에서 명시적 상태 초기화로 메모리 누수 방지

**에러 핸들링**:
- 다층 에러 처리 전략: Toast + Empty State + 재시도 버튼
- 에러 코드별 사용자 친화적 메시지 매핑 체계적
- 복구 메커니즘(재시도 버튼) 제공으로 사용자 경험 향상

**테스트 전략**:
- 23개 테스트 케이스로 모든 시나리오 커버
- data-testid 속성 체계적 정의
- 단위/통합/E2E 테스트 레벨 명확히 분리
- 성능 기준(NFR-001, NFR-002) 명시적 검증 계획

**문서화 품질**:
- 요구사항 추적성 매트릭스로 PRD → 설계 → 테스트 완전 매핑
- Mermaid 다이어그램으로 시퀀스, 상태 전이 명확화
- 일관성 검증 결과(섹션 1) 명시로 상위 문서 정합성 보장

### 2.2 개선 필요 사항 (Issues)

| ID | 심각도 | 유형 | 설명 | 권고 사항 |
|----|--------|------|------|----------|
| R-001 | Medium | Architecture | 페이지 컨트롤러(pages/wbs.vue) 책임 과다 우려 | useWbsPage composable로 로직 추출 분리 |
| R-002 | Low | Code | watch 정리 로직 누락 가능성 | watch 반환값 명시적 저장 및 onUnmounted 정리 검증 |
| R-003 | Low | Test | 에러 복구 시나리오(TC-018) 테스트 데이터 불명확 | Mock 데이터 구체화 필요 (첫 번째 실패, 두 번째 성공 패턴) |
| R-004 | Medium | Architecture | 스토어 간 순환 의존성 발생 가능성 | watch 트리거 조건에 가드(guard) 추가 권장 |
| R-005 | Low | UX | 로딩 상태 전환 시 깜빡임(flicker) 가능성 | 최소 로딩 시간(min-loading-time) 전략 고려 |
| R-006 | Low | Performance | 대규모 WBS 트리 렌더링 시 성능 우려 | 가상 스크롤(virtual scroll) 고려 사항 명시 권장 |
| R-007 | Low | Test | 접근성 테스트(TC-022, TC-023) 자동화 방안 부재 | Playwright 접근성 테스트 라이브러리(axe-core) 통합 권장 |
| R-008 | Low | Security | URL 쿼리 파라미터 검증 미흡 | projectId 형식 검증(정규식) 추가 권장 |

### 2.3 질문 사항 (Questions)

**Q1**: useWbsPage composable(섹션 5.1)이 "선택적"으로 표시되어 있는데, 구현 권장 여부는?
- **답변 권고**: 페이지 컨트롤러 책임 과다(R-001) 완화를 위해 구현 권장. 로딩/에러 로직을 composable로 추출하면 단위 테스트 용이성 향상.

**Q2**: watch 정리 로직(FR-009)이 "Vue 라이프사이클 자동 정리"에 의존하는데, 명시적 정리가 필요한 경우는?
- **답변 권고**: setup 함수 외부(global scope)에서 watch 생성 시 명시적 정리 필요. 현재 설계는 setup 내부이므로 자동 정리 의존 가능하나, 명시적 정리 추가 권장.

**Q3**: Empty State 표시 우선순위(섹션 11.2)가 명시되지 않았는데, 여러 조건 동시 발생 시 처리는?
- **답변 권고**: 우선순위 명시 필요. 권장: 프로젝트 없음 > WBS 데이터 없음 > Task 미선택 순서.

**Q4**: API 타임아웃 설정(섹션 6.1 리스크)이 구체적이지 않음. 권장 값은?
- **답변 권고**: 프로젝트 로딩 5초, WBS 로딩 10초, Task 로딩 5초 타임아웃 명시 권장.

**Q5**: 브라우저 뒤로가기 처리(섹션 4.3 제약)가 "페이지 상태 초기화"로 되어 있는데, 선택 상태 복원 고려 필요성은?
- **답변 권고**: 1차 범위에서는 초기화 전략 유지, 2차에서 sessionStorage 활용 선택 상태 복원 고려 권장.

---

## 3. 권고 사항 요약

### 필수 반영 (High Priority)

**H-001**: watch 가드(guard) 조건 추가 (R-004)
```javascript
// 개념 수준 예시 (코드 아님)
watch(currentProject, (newProject, oldProject) => {
  // 가드: 동일 프로젝트면 skip
  if (newProject?.id === oldProject?.id) return;

  // 가드: null → null 전환 skip
  if (!newProject && !oldProject) return;

  if (newProject) {
    wbsStore.fetchWbs(newProject.id);
  }
});
```

**H-002**: URL 쿼리 파라미터 검증 추가 (R-008)
```javascript
// 개념 수준 예시
const projectId = computed(() => {
  const id = route.query.projectId as string;

  // 형식 검증: 소문자, 숫자, 하이픈만 허용
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return null;
  }

  return id;
});
```

**H-003**: Empty State 우선순위 명시 (Q3)
- 상세설계 섹션 11.2에 우선순위 규칙 추가
- 템플릿에서 v-if 순서 보장

### 권장 반영 (Medium Priority)

**M-001**: useWbsPage composable 구현 (R-001)
- 로딩 상태 관리 로직 추출
- 에러 핸들링 로직 추출
- 단위 테스트 용이성 향상

**M-002**: API 타임아웃 설정 명시 (Q4)
- 상세설계 섹션 4.2에 타임아웃 값 추가
- $fetch 옵션에 timeout 파라미터 포함

**M-003**: watch 정리 로직 명시적 구현 (R-002)
```javascript
// 개념 수준 예시
const stopWatchProject = watch(currentProject, ...);
const stopWatchSelection = watch(selectedNodeId, ...);

onUnmounted(() => {
  stopWatchProject();
  stopWatchSelection();
  // 스토어 정리
  wbsStore.clearWbs();
  selectionStore.clearSelection();
});
```

### 선택 반영 (Low Priority)

**L-001**: 최소 로딩 시간 전략 (R-005)
- 200ms 미만 로딩 시 스피너 미표시
- 깜빡임 방지

**L-002**: 대규모 WBS 성능 고려사항 명시 (R-006)
- 100개 이상 노드 시 가상 스크롤 고려
- 기본설계 또는 상세설계에 성능 제약 조건 추가

**L-003**: 접근성 테스트 자동화 (R-007)
- Playwright + axe-core 통합
- 테스트 명세에 자동화 방안 추가

**L-004**: 브라우저 뒤로가기 상태 복원 (Q5)
- 2차 범위로 연기
- sessionStorage 활용 방안 검토

---

## 4. SOLID 원칙 평가

### 단일 책임 원칙 (Single Responsibility Principle)

**평가**: Pass

| 컴포넌트 | 책임 | 평가 |
|----------|------|------|
| pages/wbs.vue | 페이지 컨트롤러, 스토어 조율 | 명확 (단, useWbsPage 추출 권장) |
| WbsTreePanel | WBS 트리 렌더링, 선택 이벤트 | 명확 |
| TaskDetailPanel | Task 상세 표시, 인라인 편집 | 명확 |
| useProjectStore | 프로젝트 상태 관리 | 명확 |
| useWbsStore | WBS 상태 관리 | 명확 |
| useSelectionStore | 선택 상태 관리 | 명확 |

**개선점**: pages/wbs.vue가 조율 + 에러 핸들링 + Toast 관리를 동시 수행. useWbsPage composable 추출 시 책임 분리 향상.

### 개방-폐쇄 원칙 (Open-Closed Principle)

**평가**: Pass

- Empty State 유형별 템플릿 확장 가능
- 에러 메시지 매핑 테이블 확장 용이
- 워크플로우 상태 추가 시 설계 변경 불필요

**개선점**: 에러 코드 → 메시지 매핑을 설정 파일 또는 상수로 분리 권장.

### 리스코프 치환 원칙 (Liskov Substitution Principle)

**평가**: N/A (상속 구조 없음)

- Vue Composition API 기반으로 상속보다 조합(composition) 사용

### 인터페이스 분리 원칙 (Interface Segregation Principle)

**평가**: Pass

- WbsTreePanel, TaskDetailPanel이 각각 필요한 이벤트만 정의
- Props 과다 전달 없음 (스토어에서 직접 조회)

**개선점**: 현재 설계 양호.

### 의존성 역전 원칙 (Dependency Inversion Principle)

**평가**: Pass

- Pinia 스토어를 통한 추상화
- PrimeVue 컴포넌트 인터페이스 의존 (구현 의존 아님)
- API 엔드포인트 의존성이 스토어 액션으로 캡슐화

**개선점**: 현재 설계 양호.

---

## 5. 기술 부채 분석

### 복잡도 분석

| 영역 | 복잡도 | 평가 | 근거 |
|------|--------|------|------|
| 페이지 로직 | Medium | 양호 | watch 2개, computed 1개, 라이프사이클 2개 수준 |
| 상태 관리 | Low | 우수 | 스토어별 명확한 책임, 순환 의존성 없음 |
| 에러 핸들링 | Medium | 양호 | 다층 전략이나 체계적 설계로 복잡도 관리됨 |
| 테스트 전략 | Low | 우수 | 23개 케이스로 체계적 커버리지 |

### 결합도 분석

| 의존성 | 결합도 | 평가 | 개선 방안 |
|--------|--------|------|----------|
| pages/wbs.vue ↔ Pinia 스토어 | Low | 우수 | storeToRefs로 반응형 참조만 사용 |
| WbsTreePanel ↔ useWbsStore | Low | 우수 | 직접 조회로 Props Drilling 회피 |
| API 엔드포인트 ↔ 페이지 | Low | 우수 | 스토어 액션으로 캡슐화 |
| PrimeVue 컴포넌트 의존성 | Medium | 양호 | 라이브러리 교체 시 영향 있으나 허용 범위 |

### 유지보수성 평가

**평가**: High (우수)

| 항목 | 점수 | 근거 |
|------|------|------|
| 가독성 | 9/10 | 명확한 구조, 충분한 문서화 |
| 변경 용이성 | 8/10 | 책임 분리 우수, 일부 로직 추출 여지 |
| 확장성 | 9/10 | 새 Empty State, 에러 유형 추가 용이 |
| 테스트 가능성 | 9/10 | 완전한 테스트 명세, data-testid 체계적 |

### 기술 부채 지표

| 지표 | 현재 상태 | 목표 | 평가 |
|------|----------|------|------|
| 순환 복잡도 | Low | Low | ✅ 통과 |
| 중복 코드 | 없음 | 없음 | ✅ 통과 |
| 주석 커버리지 | Medium | High | ⚠️ 코드 주석 추가 권장 |
| 테스트 커버리지 목표 | 80% (단위) | 80% | ✅ 목표 설정 적절 |

---

## 6. PRD 일관성 검증

### 요구사항 매핑 완전성

**평가**: Pass (100% 매핑)

| PRD 섹션 | 요구사항 수 | 매핑된 FR | 검증 |
|---------|-----------|----------|------|
| 섹션 6.2 (WBS 트리 뷰) | 2개 | FR-001, FR-002 | ✅ 완전 |
| 섹션 6.3 (Task 상세 패널) | 1개 | FR-003 | ✅ 완전 |
| 섹션 9.1 (프로젝트 선택) | 1개 | FR-001 | ✅ 완전 |
| 섹션 9.3 (상태 관리) | 2개 | FR-009, FR-010 | ✅ 완전 |
| 섹션 11 (사용자 피드백) | 4개 | FR-004~FR-008 | ✅ 완전 |

### 비즈니스 규칙 일치성

**평가**: Pass

| 규칙 | PRD | 설계 | 일치성 |
|------|-----|------|--------|
| 순차 로딩 패턴 | 명시됨 | BR-001 구현 | ✅ 일치 |
| 에러 핸들링 전략 | Toast 권장 | FR-005, BR-004 구현 | ✅ 일치 |
| Empty State 표시 | 요구됨 | FR-006~008 구현 | ✅ 일치 |
| 상태 초기화 | 메모리 누수 방지 | FR-009, BR-008 구현 | ✅ 일치 |

### 용어 일관성

**평가**: Pass

- "프로젝트", "WBS", "Task", "워크플로우" 용어 통일
- 상태 코드([bd], [dd], [im], [vf], [xx]) PRD와 일치
- 칸반 컬럼명 일치 (Todo, Design, Detail, Implement, Verify, Done)

---

## 7. 테스트 용이성 평가

### 테스트 전략 완전성

**평가**: Pass

| 테스트 레벨 | 케이스 수 | 커버리지 목표 | 평가 |
|-----------|---------|--------------|------|
| 단위 테스트 | 5개 (TC-001~005) | 80% | ✅ 충분 |
| 통합 테스트 | 10개 (TC-006~015) | 70% | ✅ 충분 |
| E2E 테스트 | 6개 (TC-016~021) | 주요 시나리오 100% | ✅ 완전 |
| 접근성 테스트 | 2개 (TC-022~023) | 기본 검증 | ⚠️ 자동화 고려 |

### data-testid 체계성

**평가**: Pass

- 페이지 레벨: 7개 (loading-spinner, wbs-content, empty-state-*, error-message, retry-button, dashboard-link)
- WbsTreePanel: 6개 (wbs-tree-panel, wbs-tree, wbs-tree-node-{id}, wbs-search-box, expand-all-button, collapse-all-button)
- TaskDetailPanel: 5개 (task-detail-panel, task-title, empty-state-no-task, edit-button, transition-button-{command})

**개선점**: 모든 인터랙티브 요소에 data-testid 정의 완료. 명명 규칙 일관성 우수.

### Mock 데이터 명확성

**평가**: Warning

| 테스트 케이스 | Mock 데이터 | 평가 |
|-------------|-----------|------|
| TC-001~015 | 명시적 정의 | ✅ 충분 |
| TC-016~017 | 구체적 데이터 제공 | ✅ 충분 |
| TC-018 | 불명확 (R-003) | ⚠️ 개선 필요 |
| TC-019~023 | 명시적 정의 | ✅ 충분 |

**권고**: TC-018 재시도 시나리오의 Mock 데이터 구체화 필요.

### 테스트 격리성

**평가**: Pass

- 각 테스트 케이스가 독립적 전제조건 명시
- 스토어 모킹 전략 명확
- E2E 테스트 데이터 격리 (test-results/ 폴더 분리)

---

## 8. 보안 평가

### 위험도 분석

**전체 평가**: Low Risk

| 영역 | 위험도 | 평가 | 근거 |
|------|--------|------|------|
| 인증/인가 | N/A | 해당 없음 | 로컬 환경, 단일 사용자 |
| 입력 검증 | Low | 주의 필요 | URL 쿼리 검증 추가 권장 (R-008) |
| 파일 접근 | Low | 허용 | Server Routes 통해서만 접근 (TRD 명시) |
| XSS | Low | 허용 | Vue 템플릿 자동 이스케이프 |
| CSRF | N/A | 해당 없음 | 파일 기반 시스템 |

### 취약점 분석

**V-001**: URL 쿼리 파라미터 검증 미흡 (R-008)
- **심각도**: Low
- **영향**: 잘못된 projectId로 서버 에러 발생 가능
- **완화**: 정규식 검증 추가 권장

**V-002**: 파일 경로 조작 가능성
- **심각도**: Low
- **영향**: projectId에 "../" 포함 시 경로 이탈 가능
- **완화**: Server Routes에서 경로 검증 필요 (TSK-03-01 범위)

### 보안 체크리스트

- [✅] Vue 템플릿 자동 이스케이프 활용
- [✅] Server Routes 통한 파일 접근 제한
- [⚠️] URL 쿼리 파라미터 검증 (권장)
- [✅] 에러 메시지 민감 정보 미포함 (사용자 친화적 메시지 변환)
- [N/A] HTTPS 사용 (로컬 환경)
- [N/A] 인증 토큰 관리 (단일 사용자)

---

## 9. 성능 평가

### 성능 목표

**평가**: Pass

| 지표 | 목표 | 검증 방법 | 평가 |
|------|------|----------|------|
| 페이지 초기 로딩 | < 1초 | TC-016 (E2E) | ✅ 명시적 검증 |
| 노드 선택 반응성 | < 200ms | TC-017 (E2E) | ✅ 명시적 검증 |
| Toast 자동 사라짐 | 3초 | TC-019 (E2E) | ✅ 명시적 검증 |

### 성능 리스크

**P-001**: 대규모 WBS 트리 렌더링 (R-006)
- **심각도**: Low
- **트리거**: 100개 이상 노드
- **완화**: 가상 스크롤 고려 사항 명시 권장

**P-002**: API 응답 지연 (섹션 6.1)
- **심각도**: Medium
- **완화**: 타임아웃 설정, 재시도 버튼 (구현 예정)

### 최적화 기회

| 항목 | 현재 | 개선 방안 | 우선순위 |
|------|------|----------|---------|
| watch 트리거 | 무조건 실행 | 가드 조건 추가 (H-001) | High |
| 로딩 스피너 | 즉시 표시 | 최소 로딩 시간 전략 (L-001) | Low |
| WBS 트리 렌더링 | 전체 렌더링 | 가상 스크롤 (L-002) | Low |

---

## 10. 설계 품질 지표

### 복잡도 메트릭

| 메트릭 | 값 | 기준 | 평가 |
|--------|-----|------|------|
| 순환 복잡도 | Low | Low | ✅ 통과 |
| 결합도 | Low | Low | ✅ 통과 |
| 응집도 | High | High | ✅ 통과 |
| 추상화 수준 | Appropriate | Balanced | ✅ 통과 |

### 문서화 품질

| 항목 | 완성도 | 평가 |
|------|--------|------|
| 요구사항 추적성 | 100% | ✅ 우수 |
| 아키텍처 다이어그램 | 5개 (Mermaid) | ✅ 충분 |
| API 계약 명세 | 2개 엔드포인트 | ✅ 완전 |
| 테스트 시나리오 | 23개 케이스 | ✅ 완전 |
| 에러 처리 명세 | 6개 에러 유형 | ✅ 완전 |

### 설계 패턴 적용

| 패턴 | 적용 위치 | 평가 |
|------|----------|------|
| Controller Pattern | pages/wbs.vue | ✅ 적절 |
| Store Pattern | Pinia 스토어 | ✅ 적절 |
| Observer Pattern | watch, computed | ✅ 적절 |
| Strategy Pattern | 에러 핸들링 (Toast + Empty State) | ✅ 적절 |

---

## 11. 추가 권장 사항

### 문서 개선

**D-001**: 코드 주석 가이드라인 추가
- 상세설계에 JSDoc 형식 주석 규칙 명시
- 복잡한 watch 로직에 주석 필수화

**D-002**: 성능 제약 조건 명시
- 대규모 WBS(100개 이상 노드) 시 성능 고려사항 추가
- 가상 스크롤 도입 기준 명시

**D-003**: 에러 코드 전역 상수화
- 에러 코드 → 메시지 매핑을 별도 상수 파일로 분리
- 다국어 지원 대비

### 구현 가이드

**I-001**: watch 가드 패턴 예시 추가
- 상세설계에 가드 조건 구현 예시 추가
- 순환 트리거 방지 패턴 문서화

**I-002**: 타임아웃 설정 명시
- $fetch 옵션에 timeout 파라미터 추가
- 네트워크 에러 vs 타임아웃 에러 구분

**I-003**: Empty State 우선순위 규칙 명시
- v-if 순서 보장 방법 구체화
- 템플릿 구조 예시 추가

### 향후 고려사항

**F-001**: 상태 복원 전략 (2차 범위)
- 브라우저 뒤로가기 시 선택 상태 복원
- sessionStorage 활용 방안 검토

**F-002**: 패널 크기 조정 기능 (2차 범위)
- 리사이즈 가능한 Splitter 컴포넌트 도입
- 사용자 설정 저장 (localStorage)

**F-003**: 오프라인 지원 (3차 범위)
- Service Worker 활용
- 로컬 캐싱 전략

---

## 12. 결론

**설계 품질**: 우수 (Excellent)

**주요 강점**:
1. 명확한 책임 분리 (SOLID 원칙 준수)
2. 완전한 요구사항 추적성 (100% 매핑)
3. 체계적인 테스트 전략 (23개 케이스)
4. 낮은 기술 부채 (복잡도 관리 우수)
5. 우수한 문서화 품질 (다이어그램, 추적성 매트릭스, 테스트 명세 완비)

**개선 권고**:
- 필수 반영 3건 (H-001~H-003): watch 가드, URL 검증, Empty State 우선순위
- 권장 반영 3건 (M-001~M-003): useWbsPage 추출, 타임아웃 설정, watch 정리
- 선택 반영 4건 (L-001~L-004): 로딩 UX 개선, 성능 최적화, 접근성 자동화

**최종 판정**: ✅ **조건부 승인 (Conditionally Approved)**

**조건**: 필수 반영 사항 3건 (H-001~H-003) 반영 후 구현 단계 진행 가능. 권장/선택 사항은 구현 단계 또는 2차 개선에서 반영 권장.

**다음 단계**:
- 필수 반영 사항 상세설계 문서 업데이트
- `/wf:build` 명령어로 구현 단계 진행

---

## 관련 문서

- 기본설계: `010-basic-design.md`
- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 테스트 명세: `026-test-specification.md`
- PRD: `.jjiban/projects/jjiban/prd.md`
- TRD: `.jjiban/projects/jjiban/trd.md`

---

<!--
author: Claude (refactoring-expert)
review-date: 2025-12-15
review-version: 1.0
template-version: design-review-1.0
-->
