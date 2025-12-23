# 기술 설계: .jjiban 디렉토리 구조 생성

## Task 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-01-01 |
| Category | infrastructure |
| 상태 | [dd] 상세설계 |
| 상위 Activity | ACT-02-01: File System Service |
| 상위 Work Package | WP-02: Data Storage Layer |
| PRD 참조 | PRD 7.1 |
| 작성일 | 2025-12-13 |

---

## 1. 목적

jjiban 프로젝트 관리 도구의 핵심 데이터 저장소인 `.jjiban/` 디렉토리 구조를 생성하고 초기화합니다. 이 구조는 프로젝트, 설정, 템플릿 등 모든 데이터를 파일 기반으로 관리하기 위한 기반이 됩니다.

---

## 2. 현재 상태

### 2.1 현재 구조

현재 `.jjiban/` 폴더가 존재하며 일부 프로젝트 데이터가 있으나, PRD 7.1에서 정의한 표준 구조가 완전히 구현되지 않음.

### 2.2 문제점

- 표준 디렉토리 구조 검증 로직 없음
- 디렉토리 자동 생성 유틸리티 없음
- 초기 설정 파일 자동 생성 로직 없음

---

## 3. 목표 상태

### 3.1 목표 구조

PRD 7.1에 정의된 표준 디렉토리 구조:

```
.jjiban/
├── settings/                      # 전역 설정 (모든 프로젝트 공통)
│   ├── projects.json              # 프로젝트 목록
│   ├── columns.json               # 칸반 컬럼 정의
│   ├── categories.json            # 카테고리 정의
│   ├── workflows.json             # 워크플로우 규칙
│   └── actions.json               # 상태 내 액션 정의
│
├── templates/                     # 문서 템플릿
│   ├── 010-basic-design.md
│   ├── 011-ui-design.md
│   ├── 020-detail-design.md
│   ├── 030-implementation.md
│   ├── 070-integration-test.md
│   └── 080-manual.md
│
└── projects/                      # 프로젝트 폴더
    └── {project-id}/              # 개별 프로젝트
        ├── project.json           # 프로젝트 메타데이터
        ├── team.json              # 팀원 목록
        ├── wbs.md                 # WBS 통합 파일
        └── tasks/                 # Task 문서 폴더
```

### 3.2 개선 효과

- 일관된 디렉토리 구조로 LLM CLI가 파일 위치를 예측 가능
- 필수 폴더 자동 생성으로 초기 설정 간소화
- 설정 파일 없이도 기본값으로 동작 가능

---

## 4. 구현 계획

### 4.1 변경/생성 파일

| 파일/모듈 | 변경 내용 |
|----------|----------|
| `server/utils/jjiban-init.ts` | 디렉토리 초기화 유틸리티 (신규) |
| `server/api/init.post.ts` | 초기화 API 엔드포인트 (신규) |
| `types/jjiban.ts` | 디렉토리 경로 상수 및 타입 정의 (신규) |

### 4.2 기능 상세

#### 4.2.1 디렉토리 경로 상수

```typescript
// types/jjiban.ts
export const JJIBAN_PATHS = {
  ROOT: '.jjiban',
  SETTINGS: '.jjiban/settings',
  TEMPLATES: '.jjiban/templates',
  PROJECTS: '.jjiban/projects',
} as const;

export const SETTINGS_FILES = {
  PROJECTS: 'projects.json',
  COLUMNS: 'columns.json',
  CATEGORIES: 'categories.json',
  WORKFLOWS: 'workflows.json',
  ACTIONS: 'actions.json',
} as const;
```

#### 4.2.2 초기화 유틸리티

```typescript
// server/utils/jjiban-init.ts
export async function ensureJjibanStructure(): Promise<void> {
  // 1. 필수 디렉토리 생성
  // 2. settings/ 폴더 생성 (설정 파일은 생성하지 않음 - 기본값 사용)
  // 3. templates/ 폴더 생성
  // 4. projects/ 폴더 생성
}

export async function ensureProjectStructure(projectId: string): Promise<void> {
  // 1. projects/{projectId}/ 폴더 생성
  // 2. tasks/ 하위 폴더 생성
}
```

#### 4.2.3 초기화 API

```typescript
// server/api/init.post.ts
export default defineEventHandler(async (event) => {
  await ensureJjibanStructure();
  return { success: true, message: 'JJIBAN structure initialized' };
});
```

### 4.3 주요 특징

1. **최소 초기화**: 폴더 구조만 생성, 설정 파일은 기본값 사용
2. **멱등성**: 이미 존재하는 폴더는 건너뛰기
3. **에러 처리**: 권한 문제 등 파일시스템 에러 핸들링

---

## 5. 다음 단계

- `/wf:skip` 또는 `/wf:build`로 구현 단계 진행
- TSK-02-01-02 (파일 읽기/쓰기 유틸리티)와 연계

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` - 섹션 7.1
- CLAUDE.md: 데이터 구조 정의
