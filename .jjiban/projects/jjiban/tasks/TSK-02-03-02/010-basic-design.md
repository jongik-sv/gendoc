# 기본설계: 설정 서비스 구현

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-02 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 상위 Activity | ACT-02-03 |
| 상위 Work Package | WP-02 |
| PRD 참조 | PRD 8.1 |
| 작성일 | 2025-12-14 |

---

## 1. 개요

### 1.1 목적
JJIBAN 시스템의 전역 설정을 로드하고 관리하는 서비스를 구현합니다. 설정 파일이 없는 경우 기본값을 사용하며, 한 번 로드된 설정은 캐싱하여 성능을 최적화합니다.

### 1.2 구현 범위
> WBS Task 설명에서 추출

- 설정 파일 로드 (없으면 기본값 사용)
- 설정 캐싱
- 설정 조회 API

### 1.3 제외 범위
> 동일 PRD 섹션이지만 다른 Task에서 구현

- JSON 스키마 정의 → TSK-02-03-01
- 프로젝트 메타데이터 (project.json, team.json) → TSK-02-03-03
- 설정 수정 API (1차 범위 외)

---

## 2. 사용자 시나리오

### 2.1 주요 사용자
- **시스템**: 서버 시작 시 설정 로드
- **프론트엔드**: 워크플로우, 카테고리 정보 조회
- **백엔드 서비스**: 상태 전이 규칙 확인

### 2.2 사용 시나리오

**시나리오 1: 서버 시작 - 설정 파일 존재**
1. 서버가 시작됨
2. SettingsService가 `.jjiban/settings/` 폴더 확인
3. 각 설정 파일 로드 (columns.json, categories.json, workflows.json, actions.json)
4. 설정을 메모리에 캐싱
5. 서비스 준비 완료

**시나리오 2: 서버 시작 - 설정 파일 없음**
1. 서버가 시작됨
2. SettingsService가 `.jjiban/settings/` 폴더 확인
3. 설정 파일이 없음을 감지
4. 기본값(defaults)을 사용
5. 설정을 메모리에 캐싱
6. 서비스 준비 완료

**시나리오 3: 프론트엔드에서 설정 조회**
1. 프론트엔드가 워크플로우 정보 필요
2. `GET /api/settings/workflows` 호출
3. 캐시된 워크플로우 설정 반환
4. 프론트엔드가 워크플로우 시각화에 활용

---

## 3. 기능 요구사항

### 3.1 설정 파일 로드
**설명**: 전역 설정 파일을 파일 시스템에서 로드
**입력**: 설정 타입 (columns, categories, workflows, actions)
**출력**: 해당 설정 데이터 객체
**제약조건**:
- 파일이 없으면 기본값 사용
- JSON 파싱 오류 시 기본값 사용 및 경고 로그

### 3.2 설정 캐싱
**설명**: 로드된 설정을 메모리에 캐싱하여 반복 파일 I/O 방지
**입력**: 없음 (서버 시작 시 자동)
**출력**: 캐시된 설정 객체
**제약조건**:
- 서버 재시작 시 캐시 초기화
- 캐시 무효화 기능 제공 (설정 파일 수정 시 사용)

### 3.3 설정 조회 API
**설명**: REST API로 설정 정보 조회
**입력**: 설정 타입 (URL 파라미터)
**출력**: JSON 형식의 설정 데이터
**제약조건**:
- 지원 타입: columns, categories, workflows, actions
- 존재하지 않는 타입 요청 시 400 에러

---

## 4. 비즈니스 규칙

| 규칙 ID | 규칙 설명 | 적용 시점 |
|---------|----------|----------|
| BR-001 | 설정 파일이 없으면 기본값 사용 | 설정 로드 시 |
| BR-002 | JSON 파싱 오류 시 기본값으로 폴백 | 설정 로드 시 |
| BR-003 | 설정은 서버 시작 시 1회 로드 후 캐싱 | 서버 초기화 시 |
| BR-004 | 설정 타입은 4가지로 제한 | API 요청 시 |

---

## 5. 데이터 요구사항 (개념)

### 5.1 주요 데이터
| 데이터 | 설명 | 비즈니스 의미 |
|--------|------|--------------|
| ColumnsConfig | 칸반 컬럼 정의 | 칸반 보드 UI 구성 |
| CategoriesConfig | 카테고리 정의 | Task 분류 기준 |
| WorkflowsConfig | 워크플로우 규칙 | 상태 전이 규칙 |
| ActionsConfig | 상태 내 액션 | 상태 변경 없는 동작 |

### 5.2 데이터 구조
```
Settings
├── columns: ColumnsConfig
├── categories: CategoriesConfig
├── workflows: WorkflowsConfig
└── actions: ActionsConfig
```

---

## 6. 인터페이스 요구사항 (개념)

### 6.1 Server-Side Service

| 함수 | 설명 | 입력 | 출력 |
|------|------|------|------|
| loadSettings() | 전체 설정 로드 | 없음 | Settings |
| getColumns() | 칸반 컬럼 조회 | 없음 | ColumnsConfig |
| getCategories() | 카테고리 조회 | 없음 | CategoriesConfig |
| getWorkflows() | 워크플로우 조회 | 없음 | WorkflowsConfig |
| getActions() | 액션 조회 | 없음 | ActionsConfig |
| refreshCache() | 캐시 무효화 | 없음 | void |

### 6.2 REST API

| Method | Endpoint | 설명 | 응답 |
|--------|----------|------|------|
| GET | /api/settings/columns | 칸반 컬럼 조회 | ColumnsConfig |
| GET | /api/settings/categories | 카테고리 조회 | CategoriesConfig |
| GET | /api/settings/workflows | 워크플로우 조회 | WorkflowsConfig |
| GET | /api/settings/actions | 액션 조회 | ActionsConfig |

---

## 7. 수용 기준

- [ ] 설정 파일 로드 기능 정상 동작
- [ ] 설정 파일 없을 때 기본값 사용
- [ ] 설정 캐싱 동작 확인
- [ ] `/api/settings/:type` API 응답 확인
- [ ] 잘못된 타입 요청 시 400 에러 반환

---

## 8. 다음 단계
- `/wf:draft` 명령어로 상세설계 진행

---

## 관련 문서
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 7.1, 8.1)
- 선행 Task: TSK-02-03-01 (설정 스키마 정의)
- 공통 모듈: `.claude/includes/wf-common.md`
