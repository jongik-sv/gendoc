# [wf:review] LLM 설계 리뷰: WBS Validation

> **Review Meta**
> * **Task ID**: TSK-02-02-03
> * **Task Name**: WBS 데이터 유효성 검증
> * **Reviewer**: Gemini (Agentic)
> * **Date**: 2025-12-14
> * **Version**: 1차 리뷰

---

## 1. 리뷰 요약

| 검증 영역 | 평가 | 비고 |
|-----------|------|------|
| **문서 완전성** | ✅ **PASS** | 규격화된 모든 산출물 존재함 |
| **요구사항 추적성** | ✅ **PASS** | FR-001~005, BR-001~005 완전 매핑 |
| **아키텍처/구조** | ✅ **PASS** | Validator를 역할별로 세분화하여 확장성 확보 |
| **품질/성능** | ✅ **PASS** | O(n) 알고리즘 및 캐싱 전략 적절함 |
| **유지보수성** | ✅ **PASS** | Enum 및 패턴 상수화 계획 확인됨 |

### 이슈 분포

| 우선순위 | Critical | High | Medium | Low | Info | 합계 |
|----------|----------|------|--------|-----|------|------|
| **P1** | 0 | 0 | 0 | 0 | 0 | 0 |
| **P2** | 0 | 0 | 0 | 0 | 0 | 0 |
| **P3** | 0 | 0 | 0 | 1 | 0 | 1 |
| **P4** | 0 | 0 | 0 | 1 | 0 | 1 |
| **P5** | 0 | 0 | 0 | 0 | 1 | 1 |
| **합계** | 0 | 0 | 0 | 2 | 1 | 3 |

---

## 2. 상세 리뷰 내용

### 2.1 강점 (Strengths)

1.  **세분화된 검증 모듈**: `IdValidator`, `AttributeValidator`, `StatusValidator`, `HierarchyValidator`로 책임을 명확히 분리하여, 향후 규칙이 추가되더라도 기존 코드를 수정할 위험이 적습니다.
2.  **명확한 오류 정의**: `ValidationError`와 `ErrorType`을 체계적으로 정의하여, 클라이언트(UI)에서 구체적인 에러 메시지를 보여주기 좋습니다.
3.  **성능 고려**: `DuplicateChecker` 등에서 Map을 활용한 O(n) 접근 방식은 대용량 WBS 처리에 적합합니다.

### 2.2 개선 사항 (Improvements)

#### [P3/Low] Logic: Task ID 깊이 검증 로직 명확화
*   **위치**: `020-detail-design.md` 섹션 4.2 (`IdValidator`) 및 3.2 (ID 패턴)
*   **내용**: Task ID 패턴이 3단계(`TSK-XX-XX`)와 4단계(`TSK-XX-XX-XX`) 두 가지입니다. `validateId(id, type)` 호출 시 `type='task'`만으로는 어느 깊이의 패턴을 적용할지 모호할 수 있습니다.
*   **권장**: `validateId`에 `depth` 파라미터를 추가하거나( `validateId(id, type, depth)`), 혹은 3단계와 4단계 패턴 중 하나라도 매칭되면 통과시키도록 로직을 유연하게 작성해야 합니다. 프로젝트 메타데이터의 `depth` 설정에 따라 검증 모드가 달라져야 한다면 이를 Validator 초기화 시 주입받는 것이 좋습니다.

#### [P4/Low] Maintainability: 상수(Enum) 공유
*   **위치**: `020-detail-design.md` 섹션 4.3 (`AttributeValidator`)
*   **내용**: `'critical'`, `'high'`, `'development'` 등 매직 스트링이 검증 로직에 하드코딩될 가능성이 보입니다.
*   **권장**: `types/index.ts` 또는 별도의 상수 파일에 정의된 `PriorityEnum`, `CategoryEnum` 값을 import하여 사용하여 오타로 인한 버그를 방지하고 파서/시리얼라이저와 정합성을 유지하십시오.

#### [P5/Info] Logic: 상태 코드 확장성
*   **위치**: `020-detail-design.md` 섹션 3.2 (허용된 상태 코드)
*   **내용**: 상태 코드가 `[ ]`, `[bd]` 등으로 고정되어 있습니다.
*   **권장**: 향후 사용자 정의 상태 코드가 필요할 수 있으므로, 상태 코드 목록을 `config` 객체 등으로 분리해두면 확장에 유리합니다.

---

## 3. 종합 의견 및 다음 단계

검증 로직 설계가 매우 꼼꼼합니다. 특히 3단계/4단계 혼용에 대한 처리 전략(P3 이슈)만 구현 시 결정하면 됩니다. 승인합니다.

### Next Steps
1.  **반영 결정**: `/wf:apply TSK-02-02-03` (P3 이슈 반영 검토)
2.  **구현 시작**: `/wf:build TSK-02-02-03`
