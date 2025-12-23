# 기술 설계: 파일 읽기/쓰기 유틸리티

## Task 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-01-02 |
| Category | infrastructure |
| 상태 | [dd] 상세설계 |
| 상위 Activity | ACT-02-01: File System Service |
| 상위 Work Package | WP-02: Data Storage Layer |
| PRD 참조 | PRD 7 |
| 작성일 | 2025-12-13 |

---

## 1. 목적

jjiban 프로젝트에서 JSON 및 Markdown 파일을 안전하게 읽고 쓰기 위한 공통 유틸리티 함수들을 구현합니다. 이 유틸리티는 모든 파일 기반 데이터 접근의 기반이 됩니다.

---

## 2. 현재 상태

### 2.1 현재 구조

현재 파일 접근을 위한 표준화된 유틸리티가 없음.

### 2.2 문제점

- 각 API에서 개별적으로 fs 모듈 사용 시 중복 코드 발생
- 일관된 에러 핸들링 부재
- 파일 존재 확인, JSON 파싱 등 반복적 로직 분산

---

## 3. 목표 상태

### 3.1 목표 구조

통합된 파일 유틸리티 모듈:

```
server/
├── utils/
│   ├── file-utils.ts       # 파일 유틸리티 (신규)
│   └── jjiban-paths.ts     # 경로 헬퍼 (신규)
```

### 3.2 개선 효과

- 모든 파일 접근이 단일 모듈을 통해 이루어짐
- 일관된 에러 핸들링 및 로깅
- 타입 안전한 JSON 읽기/쓰기
- 테스트 용이성 향상

---

## 4. 구현 계획

### 4.1 변경/생성 파일

| 파일/모듈 | 변경 내용 |
|----------|----------|
| `server/utils/file-utils.ts` | 파일 읽기/쓰기 유틸리티 (신규) |
| `server/utils/jjiban-paths.ts` | JJIBAN 경로 헬퍼 (신규) |

### 4.2 기능 상세

#### 4.2.1 파일 유틸리티 함수

```typescript
// server/utils/file-utils.ts

/**
 * 파일 존재 확인
 */
export async function fileExists(filePath: string): Promise<boolean>;

/**
 * 디렉토리 존재 확인
 */
export async function directoryExists(dirPath: string): Promise<boolean>;

/**
 * 디렉토리 생성 (재귀적)
 */
export async function ensureDirectory(dirPath: string): Promise<void>;

/**
 * JSON 파일 읽기 (타입 안전)
 */
export async function readJsonFile<T>(filePath: string): Promise<T | null>;

/**
 * JSON 파일 쓰기 (포맷팅 포함)
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void>;

/**
 * Markdown 파일 읽기
 */
export async function readMarkdownFile(filePath: string): Promise<string | null>;

/**
 * Markdown 파일 쓰기
 */
export async function writeMarkdownFile(filePath: string, content: string): Promise<void>;

/**
 * 디렉토리 내 파일 목록 조회
 */
export async function listFiles(dirPath: string, extension?: string): Promise<string[]>;
```

#### 4.2.2 JJIBAN 경로 헬퍼

```typescript
// server/utils/jjiban-paths.ts

/**
 * JJIBAN 루트 경로 반환
 */
export function getJjibanRoot(): string;

/**
 * 설정 파일 경로 반환
 */
export function getSettingsPath(filename: string): string;

/**
 * 프로젝트 폴더 경로 반환
 */
export function getProjectPath(projectId: string): string;

/**
 * WBS 파일 경로 반환
 */
export function getWbsPath(projectId: string): string;

/**
 * Task 폴더 경로 반환
 */
export function getTaskFolderPath(projectId: string, taskId: string): string;

/**
 * Task 문서 경로 반환
 */
export function getTaskDocPath(projectId: string, taskId: string, docName: string): string;
```

### 4.3 에러 핸들링

```typescript
// 에러 타입 정의
export class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

export class FileWriteError extends Error {
  constructor(filePath: string, cause: Error) {
    super(`Failed to write file: ${filePath}`);
    this.name = 'FileWriteError';
    this.cause = cause;
  }
}

export class JsonParseError extends Error {
  constructor(filePath: string, cause: Error) {
    super(`Failed to parse JSON: ${filePath}`);
    this.name = 'JsonParseError';
    this.cause = cause;
  }
}
```

### 4.4 주요 특징

1. **타입 안전**: 제네릭을 활용한 타입 안전한 JSON 읽기
2. **에러 처리**: 명확한 에러 타입으로 호출자가 적절히 처리 가능
3. **비동기**: 모든 함수가 Promise 기반 비동기 처리
4. **재사용성**: 프로젝트 전반에서 사용 가능한 범용 유틸리티

---

## 5. 다음 단계

- `/wf:skip` 또는 `/wf:build`로 구현 단계 진행
- TSK-02-02-01 (wbs.md 파서)에서 이 유틸리티 활용

---

## 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` - 섹션 7
- TSK-02-01-01: .jjiban 디렉토리 구조 생성 (선행 Task)
