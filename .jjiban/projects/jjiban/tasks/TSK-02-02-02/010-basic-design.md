# 기본설계: wbs.md 시리얼라이저 구현

## 문서 정보
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-02-02 |
| Category | development |
| 상태 | [bd] 기본설계 |
| 상위 Activity | ACT-02-02 (WBS Parser) |
| 상위 Work Package | WP-02 (Data Storage Layer) |
| PRD 참조 | PRD 7.2, 7.3 |
| 작성일 | 2025-12-13 |

---

## 1. 개요

### 1.1 목적
WbsNode[] 트리 구조를 wbs.md 마크다운 형식으로 변환하는 시리얼라이저를 구현합니다. 이 시리얼라이저는 프론트엔드나 API에서 수정된 WBS 데이터를 다시 wbs.md 파일로 저장할 때 사용됩니다. 파서(TSK-02-02-01)의 역방향 기능입니다.

### 1.2 구현 범위
> WBS Task 설명에서 추출

- WbsNode[] → Markdown 문자열 변환
- 속성 포맷팅 (`- key: value`)
- 계층별 올바른 마크다운 헤딩 생성

### 1.3 제외 범위
> 동일 PRD 섹션이지만 다른 Task에서 구현

- Markdown → WbsNode[] 파싱 → TSK-02-02-01
- 유효성 검증 → TSK-02-02-03

---

## 2. 사용자 시나리오

### 2.1 주요 사용자
- **Server API**: Task 수정 후 wbs.md 파일 저장
- **프론트엔드**: 인라인 편집 후 저장 요청
- **LLM CLI**: 데이터 구조 변경 후 마크다운으로 저장

### 2.2 사용 시나리오
> 사용자 관점에서 기능 사용 흐름

**시나리오 1: Task 상태 변경 저장**
1. 사용자가 Task 상태를 변경 (예: `[ ]` → `[bd]`)
2. API가 WbsNode 객체 수정
3. 시리얼라이저가 전체 트리를 Markdown으로 변환
4. wbs.md 파일에 저장

**시나리오 2: Task 속성 인라인 편집**
1. 사용자가 상세 패널에서 속성 수정
2. 변경된 WbsNode 객체 전달
3. 시리얼라이저가 해당 노드의 속성을 포맷팅
4. 전체 wbs.md 재생성 후 저장

**시나리오 3: 새 Task 추가**
1. 사용자가 새 Task 생성
2. WbsNode 객체가 트리에 추가
3. 시리얼라이저가 새 Task를 포함한 마크다운 생성
4. wbs.md 파일 갱신

---

## 3. 기능 요구사항
> PRD 7.2, 7.3에서 범위 내 항목만 추출

### 3.1 헤더 생성
**설명**: 노드 타입과 ID에 따른 마크다운 헤더 생성
**입력**: WbsNode (id, type, title)
**출력**: 마크다운 헤더 문자열
**규칙**:
| 타입 | 헤더 형식 | 예시 |
|------|----------|------|
| wp | `## {id}: {title}` | `## WP-02: Data Storage Layer` |
| act | `### {id}: {title}` | `### ACT-02-02: WBS Parser` |
| task (4단계) | `#### {id}: {title}` | `#### TSK-02-02-01: wbs.md 파서 구현` |
| task (3단계) | `### {id}: {title}` | `### TSK-02-01: 칸반 컴포넌트` |

### 3.2 속성 포맷팅
**설명**: 노드 속성을 마크다운 목록 형식으로 포맷팅
**입력**: 속성 객체
**출력**: 속성 라인 문자열 배열
**포맷 규칙**:
| 속성 | 출력 형식 |
|------|----------|
| category | `- category: {value}` |
| status | `- status: {text} [{code}]` |
| priority | `- priority: {value}` |
| assignee | `- assignee: {value}` |
| schedule | `- schedule: {start} ~ {end}` |
| tags | `- tags: {tag1}, {tag2}, ...` |
| depends | `- depends: {taskId}` |
| requirements | `- requirements:` + 하위 목록 |
| ref | `- ref: {reference}` |

### 3.3 트리 순회 및 출력
**설명**: WbsNode[] 트리를 깊이 우선 순회하며 마크다운 생성
**입력**: WbsNode[] (루트 노드 배열)
**출력**: 완전한 wbs.md 문자열
**순서**:
1. 문서 헤더 (`# WBS - {프로젝트명}`)
2. 메타데이터 (`> version:`, `> depth:`, `> updated:`)
3. 구분선 (`---`)
4. 각 WP 노드 (재귀적으로 하위 노드 포함)

### 3.4 들여쓰기 및 공백 관리
**설명**: 가독성을 위한 적절한 공백 삽입
**규칙**:
- WP 사이에 `---` 구분선
- 속성 목록은 헤더 바로 아래
- requirements 하위 항목은 2칸 들여쓰기

---

## 4. 비즈니스 규칙
> PRD에서 추출한 범위 내 규칙만

| 규칙 ID | 규칙 설명 | 적용 시점 |
|---------|----------|----------|
| BR-001 | 노드 타입에 따라 헤더 레벨 결정 | 헤더 생성 시 |
| BR-002 | 3단계/4단계 구조에 따라 TSK 헤더 레벨 조정 | Task 헤더 생성 시 |
| BR-003 | 상태는 `{text} [{code}]` 형식 유지 | 상태 포맷팅 시 |
| BR-004 | 빈 값 속성은 출력하지 않음 | 속성 포맷팅 시 |
| BR-005 | 노드 순서 유지 (ID 순 또는 원본 순서) | 트리 순회 시 |

---

## 5. 데이터 요구사항 (개념)
> 비즈니스 관점의 데이터 정의

### 5.1 주요 데이터

| 데이터 | 설명 | 비즈니스 의미 |
|--------|------|--------------|
| WbsNode | 입력 데이터 구조 | 트리 형태의 WBS 데이터 |
| SerializerOptions | 출력 옵션 | 포맷팅 설정 (들여쓰기, 줄바꿈 등) |
| WbsMetadata | 문서 메타데이터 | 버전, 깊이, 업데이트 일시 |

### 5.2 데이터 흐름
```mermaid
flowchart LR
    A[WbsNode 트리] --> B[시리얼라이저]
    B --> C[Markdown 문자열]
    C --> D[wbs.md 파일]
```

---

## 6. 화면 요구사항 (개념)
> 이 Task는 Backend 서비스이므로 화면 없음

해당 없음 - 순수 변환 로직 구현

---

## 7. 인터페이스 요구사항 (개념)
> 비즈니스 관점의 API 정의

| 기능 | 설명 | 입력 | 출력 |
|------|------|------|------|
| serializeWbs | WBS 트리를 Markdown으로 변환 | WbsNode[], WbsMetadata | Markdown 문자열 |
| serializeHeader | 헤더 생성 | WbsNode | 헤더 문자열 |
| serializeAttributes | 속성 포맷팅 | 속성 객체 | 속성 라인 배열 |
| serializeNode | 단일 노드 직렬화 | WbsNode | Markdown 블록 |

---

## 8. 수용 기준
> 비즈니스 관점의 완료 조건

- [ ] WbsNode[] 트리를 wbs.md 형식의 Markdown으로 변환 가능
- [ ] 4단계 구조 정상 출력 (## WP / ### ACT / #### TSK)
- [ ] 3단계 구조 정상 출력 (## WP / ### TSK)
- [ ] 모든 속성 올바른 형식으로 출력
- [ ] 파서로 다시 읽었을 때 동일한 데이터 복원 (Round-trip 보장)
- [ ] WP 사이 구분선 정상 삽입

---

## 9. 다음 단계
- `/wf:draft` 명령어로 상세설계 진행

---

## 관련 문서
- 프로젝트 정보: `.jjiban/projects/jjiban/project.json`
- PRD: `.jjiban/projects/jjiban/prd.md`
- TRD: `.jjiban/projects/jjiban/trd.md`
- 파서 설계: `.jjiban/projects/jjiban/tasks/TSK-02-02-01/010-basic-design.md`
