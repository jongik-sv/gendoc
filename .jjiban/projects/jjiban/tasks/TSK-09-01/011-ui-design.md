# TSK-09-01: 화면설계 - 다중 프로젝트 WBS 통합 뷰

## 1. 화면 목록

| 화면ID | 화면명 | 설명 |
|--------|--------|------|
| WBS-ALL | 전체 프로젝트 트리 | `/wbs` 접속 시 모든 프로젝트 표시 |
| PRJ-DETAIL | 프로젝트 상세 패널 | 프로젝트 노드 클릭 시 표시 |
| FILE-VIEW | 파일 뷰어 | 파일 클릭 시 타입별 렌더링 |

---

## 2. WBS-ALL: 전체 프로젝트 트리

### 2.1 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠] [📊] [📋] [📅]     jjiban           [⚙️]              │
├────────────────────────┬────────────────────────────────────┤
│ 📁 jjiban              │                                    │
│   └─ 📦 WP-01          │   (선택된 노드 상세 정보)           │
│      └─ 📋 ACT-01-01   │                                    │
│         └─ ✅ TSK-01   │                                    │
│ 📁 jjiban개선          │                                    │
│   └─ 📦 WP-01          │                                    │
│      └─ ⏳ TSK-01      │                                    │
└────────────────────────┴────────────────────────────────────┘
```

### 2.2 트리 노드 스타일

| 노드 타입 | 아이콘 | 색상 | CSS 클래스 |
|-----------|--------|------|------------|
| Project | `pi-folder` | 보라색 (#8b5cf6) | `node-icon-project` |
| WP | `pi-box` | 파란색 (#3b82f6) | `node-icon-wp` |
| ACT | `pi-list` | 녹색 (#10b981) | `node-icon-act` |
| TSK | `pi-check-circle` | 상태별 | `node-icon-task` |

### 2.3 기본 펼침 상태

- 프로젝트 노드: **펼침** (WP 목록 표시)
- WP 노드: **접힘**
- ACT/TSK 노드: **접힘**

---

## 3. PRJ-DETAIL: 프로젝트 상세 패널

### 3.1 레이아웃

```
┌──────────────────────────────────────┐
│ 📁 jjiban                            │
│ ──────────────────────────────────── │
│ 📝 AI 기반 프로젝트 관리 도구        │
│                                      │
│ 📅 일정                              │
│    2024-01-01 ~ 2024-12-31           │
│                                      │
│ 📊 WBS 깊이: 4단계                   │
│                                      │
│ 📈 진행률                            │
│    ████████████░░░░░░░░ 65%          │
│                                      │
│ 📂 파일 목록                         │
│ ┌────────────────────────────────┐   │
│ │ 📄 project.json                │   │
│ │ 📄 team.json                   │   │
│ │ 📄 wbs.md                      │   │
│ │ 📄 prd.md                      │   │
│ │ 🖼️ diagram.png                 │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

### 3.2 컴포넌트 구조

```vue
<ProjectDetailPanel>
  <ProjectHeader :name :description />
  <ProjectSchedule :start :end />
  <ProjectProgress :progress :wbsDepth />
  <ProjectFileList :files @select="openFileViewer" />
</ProjectDetailPanel>
```

### 3.3 파일 목록 아이콘

| 파일 타입 | 아이콘 | 클래스 |
|-----------|--------|--------|
| `.md` | `pi-file-edit` | `file-icon-md` |
| `.json` | `pi-code` | `file-icon-json` |
| 이미지 | `pi-image` | `file-icon-image` |
| 기타 | `pi-file` | `file-icon-other` |

---

## 4. FILE-VIEW: 파일 뷰어

### 4.1 마크다운 뷰어 (`.md`)

```
┌──────────────────────────────────────┐
│ 📄 prd.md                    [✕]    │
│ ──────────────────────────────────── │
│                                      │
│ # 제목                               │
│                                      │
│ 본문 내용이 마크다운으로             │
│ 렌더링됩니다.                        │
│                                      │
│ - 목록 항목 1                        │
│ - 목록 항목 2                        │
│                                      │
└──────────────────────────────────────┘
```

### 4.2 이미지 뷰어 (`.png`, `.jpg`, `.gif`, `.svg`)

```
┌──────────────────────────────────────┐
│ 🖼️ diagram.png              [✕]    │
│ ──────────────────────────────────── │
│                                      │
│        ┌─────────────────┐           │
│        │                 │           │
│        │   [이미지]      │           │
│        │                 │           │
│        └─────────────────┘           │
│                                      │
│        크기: 800x600                 │
└──────────────────────────────────────┘
```

### 4.3 코드 뷰어 (`.json`, `.ts`, 기타)

```
┌──────────────────────────────────────┐
│ 📄 project.json              [✕]    │
│ ──────────────────────────────────── │
│  1 │ {                               │
│  2 │   "name": "jjiban",             │
│  3 │   "status": "active",           │
│  4 │   "wbsDepth": 4                 │
│  5 │ }                               │
│    │                                 │
│    │  [Monaco Editor - 읽기 전용]    │
└──────────────────────────────────────┘
```

---

## 5. 인터랙션 흐름

### 5.1 전체 프로젝트 뷰 진입

```
[/wbs 접속] → [fetchAllWbs()] → [프로젝트 목록 로드]
                                       ↓
                              [트리 렌더링 - 프로젝트 펼침]
```

### 5.2 프로젝트 선택

```
[프로젝트 노드 클릭]
       ↓
[selectionStore.selectNode(projectId)]
       ↓
[selectedNodeType === 'project']
       ↓
[ProjectDetailPanel 표시]
       ↓
[fetchProjectFiles(projectId)]
       ↓
[파일 목록 표시]
```

### 5.3 파일 열기

```
[파일 클릭]
       ↓
[파일 타입 확인]
       ↓
┌──────────────────────────────────────┐
│ .md      → MarkdownViewer            │
│ 이미지   → ImageViewer               │
│ 기타     → MonacoViewer (읽기 전용)  │
└──────────────────────────────────────┘
```

---

## 6. CSS 클래스 추가

### 6.1 main.css

```css
/* 프로젝트 노드 아이콘 */
.node-icon-project {
  @apply text-violet-500;
}

/* 프로젝트 노드 타이틀 */
.wbs-tree-node-title-project {
  @apply font-semibold text-violet-700;
}

/* 파일 목록 */
.project-file-list {
  @apply border rounded-lg divide-y;
}

.project-file-item {
  @apply flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer;
}

/* 파일 아이콘 */
.file-icon-md { @apply text-blue-500; }
.file-icon-json { @apply text-amber-500; }
.file-icon-image { @apply text-green-500; }
.file-icon-other { @apply text-gray-500; }
```

---

## 7. PrimeVue 컴포넌트 활용

| 용도 | 컴포넌트 |
|------|----------|
| 트리 | `<Tree>` (기존) |
| 패널 헤더 | `<Divider>` |
| 진행률 | `<ProgressBar>` |
| 파일 목록 | `<Listbox>` |
| 모달 | `<Dialog>` (파일 뷰어) |
| 코드 | Monaco Editor (외부) |

---

## 8. 접근성

- 키보드 네비게이션: 트리 노드 간 이동
- ARIA 레이블: 프로젝트/파일 타입 명시
- 색상 대비: WCAG 2.1 AA 준수
