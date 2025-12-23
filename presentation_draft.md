# jjiban 개발 보고서 (발표용 초안)

## 목차 (Table of Contents)

1. **제품 개요 (Product Overview)**
   - 제품 비전 및 컨셉
   - 타겟 사용자 및 해결 과제
2. **핵심 특징 (Key Features)**
   - 로컬 기반 & Git 친화적 구조
   - LLM 협업 (AI-Native)
   - 주요 기능 (WBS, Kanban, Workflow)
3. **기술 아키텍처 (Technical Architecture)**
   - 기술 스택 (Tech Stack)
   - 시스템 구조 및 데이터 흐름
4. **데이터 및 워크플로우 (Data & Workflow)**
   - 파일 기반 데이터 구조
   - 유연한 워크플로우 엔진
5. **향후 계획 (Roadmap)**

---

## 슬라이드별 상세 내용

### 1. 제품 개요 (Product Overview)

**Slide 1: 타이틀**
- **제목**: jjiban - AI와 함께하는 차세대 프로젝트 관리 도구
- **부제**: 개발자 친화적 로컬 기반 PM 도구
- **발표자**: [발표자 성명]

**Slide 2: 제품 비전**
- **비전**: "LLM과 함께 개발하는 차세대 프로젝트 관리 도구"
- **핵심 가치**:
  - **Local First**: 내 컴퓨터에서 `npx jjiban`으로 즉시 실행
  - **Git Friendly**: 모든 데이터는 파일로 저장, Git으로 동기화
  - **AI Native**: LLM(Claude, Gemini 등)이 직접 프로젝트 관리 데이터 수정 가능

**Slide 3: 타겟 사용자 및 해결 과제**
- **타겟**: 1~10인 규모의 소규모 개발팀
- **현재의 문제점**:
  - 기존 PM 도구(Jira, Notion)는 무겁고 설정이 복잡함
  - AI 코딩 도구와 PM 도구 간의 단절 (Context Switching)
  - 데이터 주권 및 보안 우려 (SaaS 의존)
- **jjiban의 해결책**:
  - 설치 없는 가벼운 실행
  - 개발 도구(IDE, Terminal)와의 완벽한 통합
  - 텍스트 기반 데이터로 AI가 이해하고 수정하기 쉬움

---

### 2. 핵심 특징 (Key Features)

**Slide 4: 로컬 & 파일 기반 (Local & File-based)**
- **No Database**: 별도의 DB 설치 없이 JSON/Markdown 파일로 저장
- **Git Sync**: `git push/pull`이 곧 백업이자 팀 동기화 방식
- **Conflict Resolution**: 분산 JSON 구조로 동시 수정 시 충돌 최소화
- **장점**: 오프라인 작업 가능, 완벽한 히스토리 관리, 벤더 종속성 탈피

**Slide 5: LLM 협업 (AI Integration)**
- **CLI 통합**: Claude Code, Gemini CLI 등과 자연스러운 연동
- **직접 제어**: LLM이 파일 시스템을 통해 Task 상태 변경, 문서 작성 가능
  - 예: "이 버그 수정했어, 상태 완료로 바꿔줘" → LLM이 JSON 수정
- **Context 유지**: 프로젝트 문맥을 파일로 제공하여 LLM의 이해도 향상

**Slide 6: 주요 기능 요약**
- **WBS 트리 뷰**: 계층형 작업 관리 (Project > WP > Activity > Task)
- **칸반 보드**: 직관적인 상태 시각화 및 드래그 앤 드롭 관리
- **워크플로우 엔진**: 사용자 정의 가능한 상태 전이 규칙
- **문서 관리**: Markdown 기반의 설계/구현 문서 통합 관리

---

### 3. 기술 아키텍처 (Technical Architecture)

**Slide 7: 기술 스택 (Tech Stack)**
- **Runtime**: Node.js 20.x (안정성)
- **Framework**: Nuxt 3 (Standalone 모드, Server Routes)
- **Frontend**: Vue 3 + PrimeVue (UI 컴포넌트) + TailwindCSS (스타일링)
- **Data**: File System (JSON + Markdown)

**Slide 8: 시스템 구조 (System Architecture)**
- **구조도**:
  - User (Browser) ↔ Nuxt Server ↔ File System (`.jjiban/`) ↔ Git
- **데이터 흐름**:
  - API 호출 없이 파일 시스템 직접 읽기/쓰기
  - Server Routes가 로컬 파일 시스템에 대한 인터페이스 역할 수행
- **특징**: 가볍고 빠른 반응 속도, 복잡한 인프라 불필요

---

### 4. 데이터 및 워크플로우 (Data & Workflow)

**Slide 9: 데이터 구조 (Data Structure)**
- **디렉토리 구조 (`.jjiban/`)**:
  - `projects/`: 프로젝트별 데이터
  - `settings/`: 전역 설정 (워크플로우, 카테고리 등)
  - `templates/`: 문서 템플릿
- **핵심 파일**:
  - `wbs.md`: 전체 구조를 한눈에 파악하는 통합 문서
  - 분산 JSON: 개별 Task의 상세 정보 및 상태 저장

**Slide 10: 워크플로우 엔진 (Workflow Engine)**
- **유연성**: `workflows.json`을 통해 상태 및 규칙 정의
- **자동화**: 상태 변경 시 필요한 문서 템플릿 자동 생성
- **확장성**: 개발(Development), 결함(Defect), 인프라(Infrastructure) 등 카테고리별 다른 워크플로우 적용 가능

---

### 5. 향후 계획 (Roadmap)

**Slide 11: 로드맵 (Roadmap)**
- **현재 (PoC/Alpha)**:
  - 핵심 WBS, 칸반, 파일 기반 저장소 구현 완료
  - 기본 LLM 연동 검증
- **단기 계획 (Beta)**:
  - Gantt 차트 구현
  - 웹 터미널 통합 (xterm.js)
  - 다중 프로젝트 지원 강화
- **장기 계획 (v1.0)**:
  - 플러그인 시스템
  - 다양한 LLM CLI 공식 지원 확대

**Slide 12: Q&A**
- 질의응답
