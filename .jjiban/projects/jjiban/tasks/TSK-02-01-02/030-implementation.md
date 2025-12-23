# 구현 보고서: 파일 읽기/쓰기 유틸리티

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-01-02 |
| Category | infrastructure |
| 상태 | [im] 구현 |
| 참조 설계서 | 010-tech-design.md |
| 구현일 | 2025-12-13 |

---

## 1. 구현 개요

### 1.1 목적
jjiban 프로젝트에서 JSON 및 Markdown 파일을 안전하게 읽고 쓰기 위한 공통 유틸리티 함수들을 구현했습니다.

### 1.2 구현 범위
- 파일 존재 확인 함수
- JSON 파일 읽기/쓰기 함수
- Markdown 파일 읽기/쓰기 함수
- 디렉토리 관련 함수
- JJIBAN 경로 헬퍼 함수

### 1.3 기술 스택
- Node.js fs/promises
- TypeScript (제네릭 타입)

---

## 2. 구현 결과

### 2.1 파일 유틸리티 함수

**파일**: `server/utils/file.ts`

| 함수 | 반환 타입 | 설명 |
|------|----------|------|
| `readJsonFile<T>(path)` | `Promise<T \| null>` | JSON 파일 읽기 (타입 안전) |
| `writeJsonFile<T>(path, data)` | `Promise<boolean>` | JSON 파일 쓰기 (포맷팅 포함) |
| `readMarkdownFile(path)` | `Promise<string \| null>` | Markdown 파일 읽기 |
| `writeMarkdownFile(path, content)` | `Promise<boolean>` | Markdown 파일 쓰기 |
| `fileExists(path)` | `Promise<boolean>` | 파일 존재 확인 |
| `dirExists(path)` | `Promise<boolean>` | 디렉토리 존재 확인 |
| `ensureDir(path)` | `Promise<boolean>` | 디렉토리 생성 (재귀) |
| `listFiles(dirPath, extension?)` | `Promise<string[]>` | 파일 목록 조회 |
| `listDirs(dirPath)` | `Promise<string[]>` | 하위 디렉토리 목록 조회 |

### 2.2 JJIBAN 경로 헬퍼 함수

| 함수 | 반환 값 | 설명 |
|------|---------|------|
| `getJjibanRoot()` | `.jjiban` | 루트 경로 |
| `getSettingsPath()` | `.jjiban/settings` | 설정 폴더 |
| `getProjectsPath()` | `.jjiban/projects` | 프로젝트 폴더 |
| `getTemplatesPath()` | `.jjiban/templates` | 템플릿 폴더 |
| `getProjectPath(projectId)` | `.jjiban/projects/{id}` | 특정 프로젝트 |
| `getWbsPath(projectId)` | `.jjiban/projects/{id}/wbs.md` | WBS 파일 |
| `getProjectJsonPath(projectId)` | `.jjiban/projects/{id}/project.json` | 프로젝트 메타 |
| `getTeamJsonPath(projectId)` | `.jjiban/projects/{id}/team.json` | 팀 정보 |
| `getTaskFolderPath(projectId, taskId)` | `.jjiban/projects/{id}/tasks/{taskId}` | Task 폴더 |
| `getTaskDocPath(projectId, taskId, docName)` | `.jjiban/projects/{id}/tasks/{taskId}/{docName}` | Task 문서 |
| `getSettingFilePath(settingType)` | `.jjiban/settings/{type}.json` | 설정 파일 |

### 2.3 에러 타입

```typescript
// 파일 미발견
export class FileNotFoundError extends Error {
  constructor(filePath: string)
}

// 파일 쓰기 실패
export class FileWriteError extends Error {
  constructor(filePath: string, cause?: Error)
}

// JSON 파싱 실패
export class JsonParseError extends Error {
  constructor(filePath: string, cause?: Error)
}
```

---

## 3. 품질 검증

### 3.1 타입 안전성
- 제네릭을 활용한 타입 안전한 JSON 읽기
- 명확한 반환 타입으로 호출자가 결과 예측 가능

### 3.2 에러 처리
- 모든 함수에서 try-catch로 에러 핸들링
- null 또는 false 반환으로 실패 상태 전달
- 커스텀 에러 타입으로 세분화된 에러 구분

### 3.3 비동기 처리
- 모든 함수가 Promise 기반 비동기
- 동시 파일 접근 지원

---

## 4. 생성/수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `server/utils/file.ts` | 파일 유틸리티 통합 모듈 |
| `server/utils/index.ts` | re-export |

---

## 5. 사용 예시

```typescript
import {
  readJsonFile,
  writeJsonFile,
  getWbsPath,
  ensureDir
} from '~/server/utils/file';

// JSON 파일 읽기
const project = await readJsonFile<Project>(getProjectJsonPath('jjiban'));

// Markdown 파일 읽기
const wbsContent = await readMarkdownFile(getWbsPath('jjiban'));

// 디렉토리 생성
await ensureDir(getTaskFolderPath('jjiban', 'TSK-01-01-01'));
```

---

## 6. 다음 단계

- `/wf:done TSK-02-01-02` - 작업 완료
- TSK-02-02-01에서 이 유틸리티 활용

---

## 관련 문서

- 기술 설계: `010-tech-design.md`
- 디렉토리 초기화: TSK-02-01-01
