# TSK-09-01: 다중 프로젝트 WBS 통합 뷰 - 구현 완료

## 문서 정보
- Task ID: TSK-09-01
- 작성일: 2025-12-17
- 상태: [im] Implementation
- 선행 문서: 020-detail-design.md

---

## 구현 개요

다중 프로젝트 WBS 통합 뷰의 백엔드 API 및 서비스 계층을 구현 완료했습니다.

### 구현 범위
1. 타입 정의 (types/index.ts)
2. API 엔드포인트 3개
3. 서비스 함수 (wbsService.ts, projectFilesService.ts)

---

## 구현 파일 목록

### 1. 타입 정의 (types/index.ts)

**추가된 타입:**
- `AllWbsResponse`: 다중 프로젝트 WBS 응답
- `ProjectWbsNode`: 프로젝트 WBS 노드 (WbsNode 확장)
- `isProjectNode()`: 타입 가드 함수
- `ProjectFile`: 프로젝트 파일 정보
- `ProjectFilesResponse`: 파일 목록 응답
- `FileContentResponse`: 파일 컨텐츠 응답

**위치:** C:\project\jjiban\types\index.ts (295-343행)

### 2. API 엔드포인트

#### 2.1 GET /api/wbs/all
**파일:** server/api/wbs/all.get.ts

**기능:**
- 모든 프로젝트의 WBS 트리를 통합하여 반환
- 개별 프로젝트 로드 실패 시 해당 프로젝트만 제외 (resilience)

**테스트 결과:**
```bash
curl http://localhost:3000/api/wbs/all
# 성공: 200 OK, projects 배열 반환
```

#### 2.2 GET /api/projects/:id/files
**파일:** server/api/projects/[id]/files.get.ts

**기능:**
- 프로젝트 폴더 내 파일 목록 조회
- tasks 폴더 제외
- 심볼릭 링크 차단
- Path Traversal 검증

**테스트 결과:**
```bash
curl http://localhost:3000/api/projects/jjiban/files
# 성공: 6개 파일 반환 (prd.md, project.json, team.json 등)
```

#### 2.3 GET /api/files/content
**파일:** server/api/files/content.get.ts

**기능:**
- 파일 컨텐츠 조회
- .jjiban 폴더 외부 접근 차단
- 파일 크기 제한 (10MB)
- Path Traversal 방어

**보안 테스트:**
```bash
# 정상 접근
curl "http://localhost:3000/api/files/content?path=C:/project/jjiban/.jjiban/projects/jjiban/project.json"
# 성공: 200 OK, content 반환

# 외부 파일 접근 시도
curl "http://localhost:3000/api/files/content?path=C:/project/jjiban/package.json"
# 실패: 403 Forbidden, "ACCESS_DENIED"
```

### 3. 서비스 함수

#### 3.1 wbsService.ts 확장
**파일:** server/utils/wbs/wbsService.ts

**추가 함수:**
- `getAllProjectsWbs()`: 모든 프로젝트 WBS 조회 (병렬 처리)
- `createProjectNode()`: 프로젝트 WBS 노드 생성
- `calculateProjectStats()`: 진행률 + Task 개수 단일 순회 계산 (성능 최적화)

**성능 최적화:**
- 기존: 진행률 계산(N) + Task 개수 계산(N) = 2N
- 개선: 단일 순회로 통합 = N (50% 감소)

#### 3.2 projectFilesService.ts (신규)
**파일:** server/utils/projects/projectFilesService.ts

**함수:**
- `getProjectFiles(projectId)`: 프로젝트 파일 목록 조회
- `validateFilePath()`: Path Traversal 다층 방어
- `getFileType()`: 파일 확장자로 타입 결정

**보안 메커니즘:**
1. 절대 경로 정규화 (../ 제거)
2. 프로젝트 폴더 내부 확인
3. 실제 파일 시스템 경로 확인 (심볼릭 링크 추적)
4. 심볼릭 링크 차단 (entry.isSymbolicLink())

### 4. 에러 처리 확장
**파일:** server/utils/errors/standardError.ts

**추가 함수:**
- `createForbiddenError()`: 403 Forbidden 에러 생성

---

## API 테스트 결과

### 1. GET /api/wbs/all
**요청:**
```bash
curl http://localhost:3000/api/wbs/all
```

**응답 (일부):**
```json
{
  "projects": [
    {
      "id": "jjiban",
      "type": "project",
      "title": "jjiban - AI 기반 프로젝트 관리 도구",
      "projectMeta": {
        "name": "jjiban - AI 기반 프로젝트 관리 도구",
        "status": "active",
        "wbsDepth": 4,
        "scheduledStart": "2025-12-16",
        "scheduledEnd": "2026-01-25",
        "description": "로컬 환경에서 실행되는 파일 기반 프로젝트 관리 도구",
        "createdAt": "2025-12-13T00:00:00.000Z"
      },
      "progress": 99,
      "taskCount": 41,
      "children": [...]
    }
  ]
}
```

### 2. GET /api/projects/:id/files
**요청:**
```bash
curl http://localhost:3000/api/projects/jjiban/files
```

**응답:**
```json
{
  "files": [
    {
      "name": "prd.md",
      "path": "C:\\project\\jjiban\\.jjiban\\projects\\jjiban\\prd.md",
      "relativePath": "prd.md",
      "type": "markdown",
      "size": 24531,
      "createdAt": "2025-12-16T15:11:00.662Z",
      "updatedAt": "2025-12-16T15:11:00.662Z"
    },
    {
      "name": "project.json",
      "path": "C:\\project\\jjiban\\.jjiban\\projects\\jjiban\\project.json",
      "relativePath": "project.json",
      "type": "json",
      "size": 399,
      "createdAt": "2025-12-15T14:56:00.626Z",
      "updatedAt": "2025-12-15T14:56:00.626Z"
    }
  ]
}
```

### 3. GET /api/files/content (정상)
**요청:**
```bash
curl "http://localhost:3000/api/files/content?path=C:/project/jjiban/.jjiban/projects/jjiban/project.json"
```

**응답:**
```json
{
  "content": "{\r\n  \"id\": \"jjiban\",\r\n  \"name\": \"jjiban - AI 기반 프로젝트 관리 도구\",\r\n  \"description\": \"로컬 환경에서 실행되는 파일 기반 프로젝트 관리 도구\",\r\n  \"version\": \"0.1.0\",\r\n  \"status\": \"active\",\r\n  \"wbsDepth\": 4,\r\n  \"createdAt\": \"2025-12-13T00:00:00.000Z\",\r\n  \"updatedAt\": \"2025-12-15T00:00:00.000Z\",\r\n  \"scheduledStart\": \"2025-12-13\",\r\n  \"scheduledEnd\": \"2026-01-25\"\r\n}\r\n"
}
```

### 4. GET /api/files/content (보안 테스트)
**요청:**
```bash
curl "http://localhost:3000/api/files/content?path=C:/project/jjiban/package.json"
```

**응답:**
```json
{
  "error": true,
  "statusCode": 403,
  "statusMessage": "ACCESS_DENIED",
  "message": ".jjiban 폴더 외부 접근 불가",
  "data": {
    "timestamp": "2025-12-16T15:50:04.541Z"
  }
}
```

---

## 보안 검증

### Path Traversal 방어
✅ .jjiban 폴더 외부 접근 차단
✅ 절대 경로 정규화 (../ 제거)
✅ 심볼릭 링크 차단
✅ 실제 파일 시스템 경로 검증

### 파일 크기 제한
✅ 10MB 초과 파일 거부

### 에러 응답 일관성
✅ 표준 에러 형식 (statusCode, statusMessage, message)
✅ 타임스탬프 포함

---

## 성능 최적화

### 1. 병렬 처리
```typescript
// 모든 프로젝트 WBS를 병렬로 로드
const projectsWbs = await Promise.all(
  projectsList.map(async (project) => {
    return await getWbsTree(project.id);
  })
);
```

### 2. 단일 순회 계산
```typescript
// 진행률 + Task 개수를 한 번의 트리 순회로 계산
function calculateProjectStats(tree: WbsNode[]): { progress: number; taskCount: number } {
  let totalProgress = 0;
  let taskCount = 0;

  function traverse(nodes: WbsNode[]): void {
    for (const node of nodes) {
      if (node.type === 'task') {
        totalProgress += node.progress || 0;
        taskCount++;
      }
      if (node.children?.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);

  return {
    progress: taskCount > 0 ? Math.round(totalProgress / taskCount) : 0,
    taskCount
  };
}
```

**효과:** 2N → N (50% 감소)

### 3. Resilience (회복 탄력성)
```typescript
// 개별 프로젝트 로드 실패 시 전체 API 실패 방지
projectsList.map(async (project) => {
  try {
    return await getWbsTree(project.id);
  } catch (error) {
    console.warn(`[getAllProjectsWbs] Failed to load ${project.id}:`, error);
    return null;  // 실패한 프로젝트만 제외
  }
})
```

---

## 하위 호환성

### 기존 API 유지
✅ GET /api/projects/:id/wbs (변경 없음)
✅ GET /api/projects/:id/tasks/:taskId (변경 없음)

### 타입 확장
✅ WbsNode 인터페이스 유지
✅ ProjectWbsNode는 WbsNode 확장
✅ 기존 컴포넌트는 영향 없음

---

## 다음 단계

### Phase 2: Store 확장 (프론트엔드)
- [ ] app/stores/wbs.ts: fetchAllWbs() 추가
- [ ] app/stores/selection.ts: fetchProjectFiles() 추가

### Phase 3: 컴포넌트 구현
- [ ] app/components/wbs/NodeIcon.vue: 프로젝트 아이콘 추가
- [ ] app/components/wbs/detail/ProjectDetailPanel.vue (신규)
- [ ] app/components/wbs/detail/FileViewer.vue (신규)

### Phase 4: 페이지 통합
- [ ] app/pages/wbs.vue: 조건부 로딩 (단일/다중 모드)

---

## 참고 문서
- 020-detail-design.md: 상세 설계
- 011-ui-design.md: 화면 설계
- PRD 섹션 6.5: 다중 프로젝트 통합 뷰

---

## 변경 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-17 | 1.0 | 백엔드 구현 완료 | Backend Architect |
