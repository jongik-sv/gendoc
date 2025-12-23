# TSK-05-02 기본설계: workflowSteps 리팩토링

## 1. 비즈니스 요구사항

### 1.1 배경

현재 CLI의 워크플로우 단계는 `cli/config/workflowSteps.js`에 하드코딩되어 있습니다. 이는 다음과 같은 문제를 발생시킵니다:

| 문제 | 설명 | 영향 |
|------|------|------|
| Server-CLI 불일치 | Server는 `[vf]`, CLI는 `[ts]` 사용 | 상태 코드 혼란 |
| 설정 경직성 | 워크플로우 변경 시 코드 수정 필요 | 유지보수 부담 |
| 단일 소스 부재 | workflows.json과 workflowSteps.js 중복 | 일관성 결여 |
| 커스터마이징 불가 | 프로젝트별 워크플로우 조정 어려움 | 유연성 제한 |

### 1.2 목적

`workflows.json`을 유일한 워크플로우 정의 소스로 사용하도록 CLI를 리팩토링하여 설정 기반의 유연한 워크플로우 시스템을 구축합니다.

### 1.3 핵심 가치

| 가치 | 설명 |
|------|------|
| 단일 진실의 원천 | workflows.json이 유일한 워크플로우 정의 |
| 하위 호환성 | 기존 코드 동작 유지 |
| 유연성 | 설정 파일로 워크플로우 커스터마이징 |
| 일관성 | Server-CLI 상태 코드 통일 (`[vf]` 기준) |

## 2. 사용자 시나리오

### 2.1 기본 시나리오: 워크플로우 명령어 실행

**사용자 행동:**
```bash
npx jjiban wf build TSK-05-02
```

**시스템 동작:**
1. WorkflowPlanner가 workflowSteps.js의 getWorkflowSteps() 호출
2. getWorkflowSteps()가 settingsLoader를 통해 workflows.json 로드
3. workflowBuilder가 설정을 단계 구조로 변환
4. 변환된 단계 구조를 반환
5. 기존 로직대로 워크플로우 계획 수립

**결과:** 설정 파일 기반으로 워크플로우가 동작하지만, 사용자는 기존과 동일한 경험을 가짐

### 2.2 시나리오: 워크플로우 커스터마이징

**관리자 행동:**
1. `.jjiban/settings/workflows.json` 편집
2. development 워크플로우에 새로운 단계 추가
3. CLI 재실행 (코드 수정 없음)

**결과:** 설정 변경만으로 워크플로우 동작이 변경됨

### 2.3 시나리오: 하위 호환성

**기존 프로젝트:**
- workflows.json 없음
- 기존 `[ts]` 상태 코드 사용

**시스템 동작:**
1. settingsLoader가 workflows.json 없음을 감지
2. defaultWorkflows.js의 기본값 사용
3. `[ts]` → `[vf]` 자동 매핑 (정규화)
4. 기존 동작 유지

**결과:** 설정 파일 없어도 기존 프로젝트가 정상 동작

## 3. 기능 요구사항

### 3.1 함수화 전환

| 기존 | 변경 후 | 이유 |
|------|---------|------|
| `export const WORKFLOW_STEPS` | `export async function getWorkflowSteps()` | 동적 로드 지원 |
| `export const TARGET_MAPPING` | `export async function getTargetMapping()` | 동적 로드 지원 |
| 직접 import | 함수 호출로 획득 | 설정 기반 전환 |

### 3.2 설정 로드 플로우

```
WorkflowPlanner
  ↓ 호출
getWorkflowSteps()
  ↓ 내부 호출
settingsLoader.loadWorkflows()
  ↓ 로드
workflows.json (없으면 defaultWorkflows)
  ↓ 변환
workflowBuilder.buildSteps()
  ↓ 반환
WORKFLOW_STEPS 구조체
```

### 3.3 API 일관성

**기존 API 유지:**
- `getStartStepIndex(category, status)` - 함수 시그니처 동일
- `getStepsToTarget(category, currentStatus, target)` - 함수 시그니처 동일
- `getCommandForStep(category, stepName)` - 함수 시그니처 동일

**변경사항:**
- 내부 구현만 변경 (설정 로드 방식)
- 외부 호출자는 변경 불필요

### 3.4 상태 코드 정규화

| 구분 | 표준 | 구버전 | 처리 |
|------|------|--------|------|
| Verify | `[vf]` | `[ts]` | 런타임 매핑 |
| Infra Design | `[dd]` | `[ds]` | 런타임 매핑 |

**정규화 위치:** settingsLoader 또는 WbsReader

## 4. 비기능 요구사항

### 4.1 성능

| 항목 | 요구사항 | 구현 |
|------|----------|------|
| 설정 로드 | 최초 1회만 로드 | 메모리 캐싱 |
| 응답 시간 | <100ms | 동기 파일 읽기 |
| 메모리 사용 | <1MB 추가 | 경량 설정 구조 |

### 4.2 안정성

- 설정 파일 없을 시 기본값 폴백
- 잘못된 설정 시 명확한 에러 메시지
- 기존 하드코딩 방식과 동일한 동작 보장

### 4.3 유지보수성

- 설정 변경 시 코드 수정 불필요
- 명확한 에러 메시지로 디버깅 용이
- 단일 파일(workflows.json)만 관리

## 5. 제약사항

### 5.1 기술적 제약

| 제약 | 설명 | 대응 |
|------|------|------|
| ESM 모듈 | Top-level await 사용 제한 | 비동기 함수로 감싸기 |
| 하위 호환 | 기존 호출자 변경 최소화 | API 시그니처 유지 |
| 캐싱 전략 | 설정 변경 시 재로드 | 메모리 캐싱 + 수동 reload |

### 5.2 범위 제약

**이번 Task 범위:**
- workflowSteps.js 리팩토링
- WorkflowPlanner.js 수정 (설정 주입)
- TSK-05-01에서 만든 모듈 활용

**범위 외 (다른 Task에서):**
- WbsReader.js 상태 코드 정규화 (TSK-05-03)
- 전체 CLI 통합 테스트 (TSK-05-04)

## 6. 성공 기준

### 6.1 기능 검증

| 기준 | 검증 방법 |
|------|----------|
| 설정 기반 동작 | workflows.json 수정 → 워크플로우 변경 확인 |
| 기본값 폴백 | workflows.json 삭제 → 기본 동작 확인 |
| 하위 호환성 | 기존 명령어 모두 정상 동작 |
| 상태 코드 통일 | `[vf]` 기준으로 통일 |

### 6.2 품질 검증

- 기존 단위 테스트 모두 통과
- 새로운 단위 테스트 추가 (설정 로드, 폴백)
- ESLint 경고 없음
- JSDoc 문서화 완료

## 7. 마일스톤

| 단계 | 산출물 | 상태 |
|------|--------|------|
| 기본설계 | 010-basic-design.md | ✅ 현재 |
| 상세설계 | 020-detail-design.md | 🔄 다음 |
| 구현 | workflowSteps.js 리팩토링 | 예정 |
| 테스트 | 단위 테스트 + 통합 테스트 | 예정 |

## 8. 참조 문서

- PRD 섹션 10.3: CLI 워크플로우 설정 통합
- TSK-05-01: CLI 설정 로더 생성 (의존성)
- `.jjiban/settings/workflows.json`: 워크플로우 설정 파일
- `server/utils/settings/defaults.ts`: Server 측 설정 구조
