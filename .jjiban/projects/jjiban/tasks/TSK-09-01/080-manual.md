# TSK-09-01: 다중 프로젝트 WBS 통합 뷰 - 사용자 매뉴얼

## 기능 개요

다중 프로젝트 WBS 통합 뷰 기능은 `/wbs` 페이지에서 모든 프로젝트를 하나의 트리로 조회할 수 있게 합니다.

---

## 접근 방법

### 다중 프로젝트 모드
```
http://localhost:3000/wbs
```
- URL 파라미터 없이 접속
- 모든 프로젝트가 트리의 최상위 노드로 표시

### 단일 프로젝트 모드 (기존)
```
http://localhost:3000/wbs?project=jjiban
```
- 특정 프로젝트의 WBS만 표시
- 기존 동작 유지

---

## 화면 구성

### 1. 전체 프로젝트 트리

```
📁 jjiban (프로젝트)
  └─ 📦 WP-01: Platform Infrastructure
       └─ 📋 ACT-01-01: Project Setup
            └─ ✅ TSK-01-01-01: ...
📁 jjiban개선 (프로젝트)
  └─ 📦 WP-01: ...
```

- 프로젝트 아이콘: 보라색 폴더 (📁)
- 기본 상태: 프로젝트 노드만 펼쳐져 WP 목록 표시

### 2. 프로젝트 상세 패널

프로젝트 노드 클릭 시 우측 패널에 표시:

- **프로젝트 정보**
  - 이름, 설명
  - 예정 일정
  - WBS 깊이 (3단계/4단계)
  - 상태 (진행중/완료/보관됨)

- **진행률**
  - 전체 Task 기준 평균 진행률
  - Task 개수

- **파일 목록**
  - 프로젝트 폴더 내 파일 목록
  - 파일 클릭 시 뷰어 열림

### 3. 파일 뷰어

파일 타입별 표시:

| 타입 | 렌더링 방식 |
|------|-----------|
| `.md` | 마크다운 렌더링 |
| 이미지 | 이미지 표시 |
| `.json` | JSON 포맷팅 |
| 기타 | 텍스트 표시 |

---

## API 엔드포인트

### GET /api/wbs/all
모든 프로젝트 WBS 조회

**응답**:
```json
{
  "projects": [
    {
      "id": "jjiban",
      "type": "project",
      "title": "프로젝트명",
      "projectMeta": {...},
      "progress": 99,
      "taskCount": 41,
      "children": [...]
    }
  ]
}
```

### GET /api/projects/:id/files
프로젝트 파일 목록

**응답**:
```json
{
  "files": [
    {
      "name": "project.json",
      "type": "json",
      "size": 399,
      "updatedAt": "2025-12-15T14:56:00.626Z"
    }
  ]
}
```

### GET /api/files/content?path={filePath}
파일 내용 조회

**보안**: .jjiban 폴더 내 파일만 접근 가능

---

## 키보드 단축키

- `Enter`: 파일 열기
- `Esc`: 파일 뷰어 닫기

---

## 제한사항

1. 파일 크기 제한: 10MB
2. 외부 폴더 접근 불가 (.jjiban 폴더 내로 제한)
3. 이미지 파일은 표시만 가능 (편집 불가)

---

## 문제 해결

### Q: 프로젝트가 표시되지 않음
A: `.jjiban/settings/projects.json`에 프로젝트가 등록되어 있는지 확인

### Q: 파일 목록이 비어 있음
A: `.jjiban/projects/{projectId}/` 폴더에 파일이 있는지 확인

### Q: 파일 내용을 볼 수 없음
A: 파일이 10MB 이하인지, `.jjiban` 폴더 내에 있는지 확인

---

## 관련 문서
- 010-basic-design.md: 기본 설계
- 011-ui-design.md: 화면 설계
- 020-detail-design.md: 상세 설계
- 030-implementation.md: 구현 문서
