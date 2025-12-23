# UI 설계 (011-ui-design.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-15

> **설계 규칙**
> * 시각적 디자인 및 인터랙션에 집중
> * PrimeVue 4.x + TailwindCSS 활용
> * WCAG 2.1 AA 접근성 준수
> * 구현 코드는 상세설계 단계에서

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | TSK-04-03 |
| Task명 | Tree Interaction |
| Category | development |
| Domain | frontend |
| 상태 | [bd] 기본설계 |
| 작성일 | 2025-12-15 |
| 작성자 | Claude (Frontend Architect) |

### 상위 문서 참조

| 문서 유형 | 경로 | 참조 섹션 |
|----------|------|----------|
| PRD | `.jjiban/projects/jjiban/prd.md` | 섹션 6.2.3 (인터랙션), 11.2 (접근성) |
| 기본설계 | `010-basic-design.md` | 전체 (아키텍처 및 로직) |
| 의존 Task | TSK-04-02 (Tree Node) | 노드 UI 구조 |
| 디자인 시스템 | PrimeVue 4.x 문서 | Button, Tree, Icon 컴포넌트 |

---

## 1. UI 설계 목적

### 1.1 설계 목표

WBS 트리의 모든 인터랙션에 대해 **직관적이고 접근 가능한** 시각적 피드백을 제공합니다.

**핵심 원칙**:
- **명확한 상태 표현**: 펼침/접힘, 선택, 포커스 상태를 시각적으로 명확히 구분
- **부드러운 전환**: 애니메이션으로 상태 변화를 자연스럽게 표현
- **접근성 우선**: 키보드 사용자와 스크린 리더 사용자를 위한 명확한 인디케이터
- **일관된 디자인**: PrimeVue 디자인 토큰 및 TailwindCSS 유틸리티 활용

### 1.2 사용자 시나리오

| 시나리오 | UI 요구사항 |
|---------|------------|
| 마우스로 트리 탐색 | - 호버 시 배경 하이라이트<br>- 펼침/접기 버튼 명확히 표시<br>- 선택 시 강조 표시 |
| 키보드로 트리 탐색 | - 포커스 인디케이터 (outline/ring)<br>- 선택과 포커스 구분<br>- 방향키로 자동 스크롤 |
| 트리 구조 이해 | - 들여쓰기로 계층 표현<br>- 펼침/접기 아이콘으로 상태 표시<br>- 부모-자식 관계 시각화 |
| 상세 정보 확인 | - 선택된 노드 강조<br>- 상세 패널과의 시각적 연결 |

---

## 2. 컴포넌트별 UI 설계

### 2.1 펼침/접기 토글 버튼

#### 2.1.1 아이콘 선택

| 상태 | 아이콘 | PrimeVue 클래스 | 의미 |
|------|--------|----------------|------|
| 펼쳐짐 | ▼ | `pi pi-chevron-down` | 자식 노드가 보임 |
| 접혀짐 | ▶ | `pi pi-chevron-right` | 자식 노드가 숨겨짐 |
| 자식 없음 | (없음) | - | 토글 버튼 표시 안 함 |

**디자인 근거**:
- **chevron 방향**: 펼쳐진 방향을 직관적으로 표시 (아래 = 펼침, 오른쪽 = 접힘)
- **일관성**: Windows Explorer, macOS Finder 등 OS 표준과 동일
- **접근성**: 스크린 리더는 aria-expanded 속성으로 상태 인식

#### 2.1.2 버튼 스타일

```css
/* 기본 상태 */
.tree-toggle-button {
  /* PrimeVue Button 기본 스타일 활용 */
  /* size: small, text variant (배경 없음) */
  /* TailwindCSS: w-6 h-6 flex items-center justify-center */

  color: var(--text-color-secondary);  /* PrimeVue 토큰 */
  transition: color 150ms ease-in-out, transform 150ms ease-in-out;
}

/* 호버 상태 */
.tree-toggle-button:hover {
  color: var(--primary-color);
  background-color: var(--surface-hover);  /* 미세한 배경 */
  cursor: pointer;
}

/* 활성 상태 (클릭 시) */
.tree-toggle-button:active {
  transform: scale(0.95);  /* 미세한 축소 */
}

/* 포커스 상태 (키보드 네비게이션) */
.tree-toggle-button:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**TailwindCSS 클래스 조합**:
```html
<!-- PrimeVue Button 사용 -->
<Button
  text
  rounded
  size="small"
  class="w-6 h-6 transition-transform duration-150 hover:bg-gray-100 active:scale-95"
  :icon="isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
/>
```

#### 2.1.3 애니메이션

| 트리거 | 애니메이션 | Duration | Easing |
|--------|-----------|----------|--------|
| 펼침 → 접힘 | `rotate(0deg → -90deg)` | 200ms | ease-out |
| 접힘 → 펼침 | `rotate(-90deg → 0deg)` | 200ms | ease-out |
| 호버 | `color` 변화 | 150ms | ease-in-out |
| 클릭 | `scale(1.0 → 0.95 → 1.0)` | 150ms | ease-in-out |

**CSS 구현**:
```css
.tree-toggle-icon {
  transition: transform 200ms ease-out;
}

.tree-toggle-icon.collapsed {
  transform: rotate(-90deg);  /* chevron-down을 오른쪽으로 회전 */
}

.tree-toggle-icon.expanded {
  transform: rotate(0deg);
}
```

**접근성 고려사항**:
- `prefers-reduced-motion: reduce` 미디어 쿼리 지원 (애니메이션 비활성화 옵션)
```css
@media (prefers-reduced-motion: reduce) {
  .tree-toggle-icon {
    transition: none;
  }
}
```

---

### 2.2 노드 선택 상태

#### 2.2.1 선택 상태별 스타일

| 상태 | 배경색 | 테두리 | 글자색 | 설명 |
|------|--------|--------|--------|------|
| **기본** (Unselected) | transparent | none | `var(--text-color)` | 평상시 |
| **호버** (Hover) | `var(--surface-hover)` | none | `var(--text-color)` | 마우스 오버 시 |
| **선택** (Selected) | `var(--primary-color)` (10% opacity) | `2px solid var(--primary-color)` | `var(--primary-color)` | 클릭/Enter로 선택 시 |
| **포커스** (Focused) | transparent | `2px dashed var(--surface-border)` | `var(--text-color)` | 키보드 탐색 시 (Tab/Arrow) |
| **선택 + 포커스** | `var(--primary-color)` (10% opacity) | `2px solid var(--primary-color)` | `var(--primary-color)` | 선택된 노드에 포커스 |

#### 2.2.2 CSS 스타일

```css
/* 기본 노드 컨테이너 */
.wbs-tree-node {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  border: 2px solid transparent;  /* 기본 투명 테두리 (레이아웃 시프트 방지) */
  transition:
    background-color 150ms ease-in-out,
    border-color 150ms ease-in-out,
    color 150ms ease-in-out;
  cursor: pointer;
}

/* 호버 상태 */
.wbs-tree-node:hover {
  background-color: var(--surface-hover);
}

/* 선택 상태 */
.wbs-tree-node.selected {
  background-color: color-mix(in srgb, var(--primary-color) 10%, transparent);
  border-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;  /* 선택된 노드 강조 */
}

/* 포커스 상태 (키보드 네비게이션) */
.wbs-tree-node:focus-visible {
  border-color: var(--surface-border);
  border-style: dashed;
  outline: none;  /* 브라우저 기본 outline 제거 */
}

/* 선택 + 포커스 (중첩 상태) */
.wbs-tree-node.selected:focus-visible {
  border-color: var(--primary-color);
  border-style: solid;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 20%, transparent);
}
```

**TailwindCSS 클래스 조합**:
```html
<div
  class="
    wbs-tree-node
    flex items-center gap-2 px-3 py-2 rounded-md
    border-2 border-transparent
    transition-all duration-150
    hover:bg-gray-100
    focus-visible:border-dashed focus-visible:border-gray-300
    cursor-pointer
  "
  :class="{
    'selected bg-primary-50 border-primary-500 text-primary-700 font-semibold': isSelected,
    'focus-visible:ring-2 focus-visible:ring-primary-300': isSelected
  }"
  tabindex="0"
/>
```

#### 2.2.3 선택 애니메이션

| 트리거 | 애니메이션 | Duration | Easing |
|--------|-----------|----------|--------|
| 선택 시 | `border-color` + `background` 전환 | 150ms | ease-in-out |
| 선택 해제 | `border-color` + `background` 전환 | 150ms | ease-out |
| 포커스 이동 | `border-style` 전환 + `box-shadow` | 100ms | ease-in-out |

**스크롤 자동 조정** (키보드 네비게이션 시):
```javascript
// scrollIntoView 옵션
element.scrollIntoView({
  behavior: 'smooth',
  block: 'nearest',  // 필요한 경우에만 스크롤
  inline: 'nearest'
})
```

---

### 2.3 키보드 포커스 인디케이터

#### 2.3.1 포커스 링 디자인

**기본 원칙**:
- **명확한 구분**: 선택 상태와 포커스 상태를 시각적으로 구분
- **접근성**: WCAG 2.1 AA 기준 충족 (3:1 대비율)
- **일관성**: PrimeVue focus-visible 패턴 따름

**포커스 인디케이터 스타일**:
```css
/* 키보드 포커스만 표시 (마우스 클릭 시 제외) */
.wbs-tree-node:focus-visible {
  outline: none;  /* 브라우저 기본 제거 */
  border: 2px dashed var(--surface-border);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent);
}

/* 선택된 노드의 포커스 (solid border로 변경) */
.wbs-tree-node.selected:focus-visible {
  border-style: solid;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary-color) 25%, transparent);
}
```

**TailwindCSS 활용**:
```html
<div
  class="
    focus-visible:outline-none
    focus-visible:border-dashed focus-visible:border-gray-400
    focus-visible:ring-2 focus-visible:ring-primary-200
  "
  :class="{
    'focus-visible:border-solid focus-visible:border-primary-500 focus-visible:ring-primary-300': isSelected
  }"
/>
```

#### 2.3.2 포커스 이동 애니메이션

| 키 입력 | 시각적 피드백 | Duration |
|---------|--------------|----------|
| Arrow Down/Up | - 이전 노드 포커스 아웃 (fade-out)<br>- 다음 노드 포커스 인 (fade-in)<br>- 자동 스크롤 | 100ms |
| Arrow Right | - 노드 펼쳐짐 (rotate 애니메이션)<br>- 자식 노드 슬라이드 인 | 200ms |
| Arrow Left | - 노드 접힘 (rotate 애니메이션)<br>- 자식 노드 슬라이드 아웃 | 200ms |
| Tab | - 다음 포커스 가능 요소로 이동<br>- 포커스 링 표시 | 100ms |

**접근성 고려사항**:
- **focus-visible 폴리필**: Safari 등 구형 브라우저 지원 (PrimeVue 내장)
- **:focus vs :focus-visible**: 마우스 클릭 시에는 포커스 링 표시 안 함
- **skip to content**: 트리 탐색을 건너뛸 수 있는 링크 제공 (향후 고려)

---

### 2.4 전체 펼치기/접기 버튼

#### 2.4.1 버튼 배치

**위치**: WbsTreePanel 헤더 영역 (오른쪽 상단)

**레이아웃**:
```
┌────────────────────────────────────────────┐
│  WBS Tree                  [펼치기] [접기] │  ← 헤더
├────────────────────────────────────────────┤
│  ▼ Project Root                            │
│    ▼ WP-01                                 │
│      ▶ ACT-01-01                           │
│    ▶ WP-02                                 │
└────────────────────────────────────────────┘
```

#### 2.4.2 버튼 스타일

**PrimeVue Button 사용**:
```html
<Button
  label="전체 펼치기"
  icon="pi pi-chevron-down"
  size="small"
  outlined
  @click="expandAll"
/>

<Button
  label="전체 접기"
  icon="pi pi-chevron-right"
  size="small"
  outlined
  @click="collapseAll"
/>
```

**스타일 명세**:
| 속성 | 값 | 설명 |
|------|-----|------|
| variant | outlined | 테두리만 있는 스타일 (헤더에서 돋보이지 않게) |
| size | small | 헤더에 적합한 작은 크기 |
| icon | chevron-down / chevron-right | 액션과 일치하는 아이콘 |
| color | secondary | 기본 액션이 아니므로 보조 색상 |

#### 2.4.3 버튼 애니메이션

| 트리거 | 애니메이션 | Duration |
|--------|-----------|----------|
| 클릭 시 | - 버튼 scale(0.95)<br>- 전체 트리 순차 펼침/접기 (cascading) | 300ms (전체) |
| 호버 시 | - 배경색 전환<br>- 테두리 강조 | 150ms |
| 로딩 중 | - 버튼 비활성화<br>- 스피너 아이콘 표시 | - |

**Cascading 애니메이션** (전체 펼치기/접기 시):
```css
/* 각 레벨별 지연 시간 (stagger) */
.wbs-tree-node[data-depth="0"] { animation-delay: 0ms; }
.wbs-tree-node[data-depth="1"] { animation-delay: 50ms; }
.wbs-tree-node[data-depth="2"] { animation-delay: 100ms; }
.wbs-tree-node[data-depth="3"] { animation-delay: 150ms; }

@keyframes expand-children {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**성능 최적화**:
- 대규모 트리 (>500 노드)에서는 애니메이션 비활성화
- `will-change: transform` 사용 (GPU 가속)

---

### 2.5 자식 노드 표시 애니메이션

#### 2.5.1 펼침 애니메이션 (Expand)

```css
/* 펼쳐질 때 슬라이드 다운 + 페이드 인 */
@keyframes slide-fade-in {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    max-height: 500px;  /* 충분히 큰 값 */
    transform: translateY(0);
  }
}

.tree-children.expanding {
  animation: slide-fade-in 200ms ease-out forwards;
}
```

#### 2.5.2 접힘 애니메이션 (Collapse)

```css
/* 접힐 때 슬라이드 업 + 페이드 아웃 */
@keyframes slide-fade-out {
  from {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-8px);
  }
}

.tree-children.collapsing {
  animation: slide-fade-out 200ms ease-in forwards;
}
```

#### 2.5.3 Vue Transition 활용

```vue
<template>
  <Transition name="tree-children">
    <div v-if="isExpanded" class="tree-children">
      <WbsTreeNode v-for="child in node.children" :key="child.id" :node="child" />
    </div>
  </Transition>
</template>

<style scoped>
/* Vue Transition 클래스 */
.tree-children-enter-active {
  animation: slide-fade-in 200ms ease-out;
}

.tree-children-leave-active {
  animation: slide-fade-out 200ms ease-in;
}
</style>
```

**접근성 고려사항**:
- `prefers-reduced-motion` 설정 시 애니메이션 비활성화
- 애니메이션 중에도 키보드 네비게이션 가능 유지

---

## 3. 상호작용 시나리오별 UI

### 3.1 마우스 인터랙션

#### 3.1.1 노드 클릭 (선택)

**동작 순서**:
1. 사용자가 노드 영역 클릭
2. 노드 배경색 전환 (transparent → primary-50)
3. 테두리 표시 (border: 2px solid primary-500)
4. 글자색 변경 (text-color → primary-700)
5. 상세 패널 슬라이드 인 (오른쪽에서)

**시각적 타임라인**:
```
0ms:   클릭 이벤트 발생
0ms:   노드 배경 전환 시작 (150ms duration)
50ms:  테두리 표시 시작
150ms: 노드 스타일 전환 완료
200ms: 상세 패널 슬라이드 인 시작 (WP-05에서 구현)
400ms: 전체 전환 완료
```

#### 3.1.2 토글 버튼 클릭 (펼침/접기)

**동작 순서**:
1. 사용자가 토글 버튼 클릭
2. 버튼 아이콘 회전 애니메이션 (0deg → -90deg 또는 반대)
3. 자식 노드 슬라이드 다운/업
4. 로컬 스토리지 자동 저장 (비동기)

**시각적 타임라인**:
```
0ms:   클릭 이벤트 발생 (event.stopPropagation()으로 선택 방지)
0ms:   아이콘 회전 시작 (200ms duration)
0ms:   자식 노드 애니메이션 시작 (200ms duration)
200ms: 아이콘 회전 완료
200ms: 자식 노드 애니메이션 완료
200ms: localStorage.setItem() 호출 (비동기)
```

#### 3.1.3 더블클릭 (토글)

**동작 순서**:
1. 사용자가 노드 영역 더블클릭
2. 첫 클릭: 노드 선택 (위 3.1.1과 동일)
3. 두 번째 클릭 (300ms 이내): 토글 버튼 클릭과 동일 (위 3.1.2)

**설정**:
- 더블클릭 감지 시간: 300ms (브라우저 기본값)
- 자식이 없는 노드: 더블클릭 무시 (첫 클릭만 선택)

---

### 3.2 키보드 인터랙션

#### 3.2.1 ArrowDown/Up (탐색)

**동작 순서**:
1. 사용자가 ArrowDown/Up 키 입력
2. 현재 포커스 노드의 border-style dashed 제거 (fade-out)
3. 다음/이전 노드로 포커스 이동 (focus())
4. 새 노드 border-style dashed 표시 (fade-in)
5. 필요 시 자동 스크롤 (scrollIntoView)

**시각적 타임라인**:
```
0ms:   키 입력 감지
0ms:   이전 노드 포커스 아웃 (100ms duration)
50ms:  다음 노드로 DOM 포커스 이동
50ms:  다음 노드 포커스 인 (100ms duration)
100ms: 스크롤 조정 시작 (smooth scroll)
150ms: 포커스 전환 완료
300ms: 스크롤 완료 (필요한 경우)
```

#### 3.2.2 ArrowRight (펼치기)

**동작 순서**:
1. 사용자가 ArrowRight 키 입력
2. **케이스 1**: 노드가 접혀있음 → 펼치기
   - 토글 버튼 클릭과 동일 (아이콘 회전 + 자식 슬라이드 다운)
3. **케이스 2**: 노드가 이미 펼쳐짐 → 첫 번째 자식으로 포커스 이동
   - ArrowDown과 동일한 포커스 전환 애니메이션
4. **케이스 3**: 자식이 없음 → 아무 동작 없음

**시각적 타임라인** (케이스 1):
```
0ms:   키 입력 감지
0ms:   아이콘 회전 + 자식 슬라이드 다운 (200ms)
200ms: 애니메이션 완료
```

**시각적 타임라인** (케이스 2):
```
0ms:   키 입력 감지
0ms:   첫 자식으로 포커스 이동 (100ms)
100ms: 포커스 전환 완료
```

#### 3.2.3 ArrowLeft (접기 또는 부모 이동)

**동작 순서**:
1. 사용자가 ArrowLeft 키 입력
2. **케이스 1**: 노드가 펼쳐짐 → 접기
   - 토글 버튼 클릭과 동일 (아이콘 회전 + 자식 슬라이드 업)
3. **케이스 2**: 노드가 이미 접혀있음 → 부모로 포커스 이동
   - ArrowUp과 동일한 포커스 전환 애니메이션
4. **케이스 3**: 이미 루트 노드 → 아무 동작 없음

#### 3.2.4 Enter (선택)

**동작 순서**:
1. 사용자가 Enter 키 입력
2. 마우스 클릭과 동일한 선택 애니메이션 (배경 + 테두리 + 글자색)
3. 상세 패널 슬라이드 인

**시각적 타임라인**:
```
0ms:   키 입력 감지
0ms:   선택 상태 전환 (150ms)
150ms: 선택 애니메이션 완료
200ms: 상세 패널 슬라이드 인 시작
```

#### 3.2.5 Space (토글)

**동작 순서**:
1. 사용자가 Space 키 입력
2. 토글 버튼 클릭과 동일 (아이콘 회전 + 자식 슬라이드)
3. 포커스는 현재 노드에 유지

**주의사항**:
- 기본 스크롤 동작 방지 (`event.preventDefault()`)

#### 3.2.6 Home/End (첫/마지막 노드)

**동작 순서**:
1. 사용자가 Home/End 키 입력
2. 첫/마지막 보이는 노드로 포커스 이동
3. 포커스 전환 애니메이션 (ArrowDown/Up과 동일)
4. 자동 스크롤 (scrollIntoView)

**시각적 타임라인**:
```
0ms:   키 입력 감지
0ms:   포커스 이동 (100ms)
100ms: 포커스 전환 완료
100ms: 스크롤 시작 (smooth)
400ms: 스크롤 완료
```

#### 3.2.7 Esc (선택 해제)

**동작 순서**:
1. 사용자가 Esc 키 입력
2. 선택된 노드의 배경 + 테두리 제거 (fade-out)
3. 상세 패널 슬라이드 아웃 (오른쪽으로)
4. 포커스는 현재 노드에 유지 (포커스 링만 표시)

**시각적 타임라인**:
```
0ms:   키 입력 감지
0ms:   선택 해제 애니메이션 (150ms)
0ms:   상세 패널 슬라이드 아웃 (200ms)
150ms: 선택 해제 완료
200ms: 상세 패널 닫힘
```

---

### 3.3 터치 인터랙션 (모바일)

#### 3.3.1 탭 (Tap)

**동작**:
- 단일 탭: 노드 선택 (클릭과 동일)
- 탭 피드백: 터치 시 배경 살짝 어두워짐 (active state)

**스타일**:
```css
.wbs-tree-node:active {
  background-color: var(--surface-ground);
}
```

#### 3.3.2 더블 탭 (Double Tap)

**동작**:
- 더블 탭: 펼침/접기 토글 (더블클릭과 동일)
- 탭 간격: 500ms 이내

#### 3.3.3 롱 프레스 (Long Press)

**동작** (향후 고려사항):
- 1초 이상 프레스: 컨텍스트 메뉴 표시 (복사, 편집 등)
- 현재 범위에서는 제외

**터치 타겟 크기**:
- 최소 44x44px (iOS HIG 기준)
- 노드 높이: 48px (padding 포함)
- 토글 버튼: 44x44px (터치 영역 확장)

---

## 4. 접근성 (Accessibility)

### 4.1 WCAG 2.1 AA 준수 사항

#### 4.1.1 키보드 접근성 (Keyboard Accessibility)

| 요구사항 | 구현 방법 | 검증 |
|---------|----------|------|
| 모든 기능 키보드 접근 | Tab, Arrow, Enter, Space 지원 | 마우스 없이 전체 기능 사용 가능 |
| 포커스 순서 | DOM 순서 = 시각적 순서 | Tab 순서가 논리적 |
| 포커스 인디케이터 | :focus-visible 스타일 | 포커스 위치 명확히 보임 |
| 키보드 트랩 방지 | Esc로 트리 벗어나기 | 포커스 갇히지 않음 |

#### 4.1.2 시각적 대비 (Visual Contrast)

| 요소 | 배경 | 전경 | 대비율 | 기준 |
|------|------|------|--------|------|
| 일반 텍스트 | #FFFFFF | #333333 | 12.6:1 | ✅ WCAG AAA (7:1) |
| 선택된 노드 | primary-50 | primary-700 | 4.8:1 | ✅ WCAG AA (4.5:1) |
| 포커스 링 | transparent | primary-500 | 3.5:1 | ✅ WCAG AA (3:1 비텍스트) |
| 토글 버튼 | transparent | text-secondary | 4.2:1 | ✅ WCAG AA (3:1 비텍스트) |

**검증 도구**:
- Chrome DevTools Lighthouse (Accessibility 점수 ≥90)
- axe DevTools (자동화 테스트)
- Contrast Checker (WebAIM)

#### 4.1.3 스크린 리더 지원

**ARIA 속성**:
```html
<!-- 트리 컨테이너 -->
<div role="tree" aria-label="WBS 프로젝트 트리">

  <!-- 트리 노드 -->
  <div
    role="treeitem"
    :aria-expanded="isExpanded ? 'true' : 'false'"
    :aria-selected="isSelected ? 'true' : 'false'"
    :aria-level="depth + 1"
    :aria-posinset="indexInParent + 1"
    :aria-setsize="parentChildrenCount"
    tabindex="0"
  >
    <!-- 토글 버튼 -->
    <button
      aria-label="펼치기/접기"
      :aria-pressed="isExpanded ? 'true' : 'false'"
    >
      <i :class="isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'" aria-hidden="true"></i>
    </button>

    <!-- 노드 레이블 -->
    <span class="node-label">{{ node.title }}</span>
  </div>
</div>
```

**스크린 리더 피드백**:
- 노드 선택 시: "WP-01, Work Package, 선택됨, 2 레벨"
- 펼침 시: "WP-01, 펼쳐짐, 3개 항목"
- 접힘 시: "WP-01, 접혀짐"
- 포커스 이동 시: "다음 항목, ACT-01-01, Activity, 3 레벨"

#### 4.1.4 애니메이션 제어

**prefers-reduced-motion 지원**:
```css
/* 사용자가 애니메이션 감소를 요청한 경우 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**사용자 설정**:
- OS 설정: Windows 접근성 > 애니메이션 표시
- macOS: 시스템 환경설정 > 접근성 > 디스플레이 > 움직임 줄이기

---

### 4.2 포커스 관리 전략

#### 4.2.1 초기 포커스

**페이지 로드 시**:
1. 트리 컨테이너에 자동 포커스 (`autoFocus` 속성)
2. 첫 번째 루트 노드에 tabindex="0" 설정
3. 나머지 노드는 tabindex="-1" (프로그램 방식 포커스만)

```vue
<template>
  <div
    ref="treeContainer"
    role="tree"
    tabindex="0"
    @focus="handleTreeFocus"
  >
    <WbsTreeNode
      v-for="(node, index) in rootNodes"
      :key="node.id"
      :node="node"
      :tabindex="index === 0 ? 0 : -1"
    />
  </div>
</template>

<script setup>
const treeContainer = ref(null)

onMounted(() => {
  treeContainer.value?.focus()
})
</script>
```

#### 4.2.2 Roving Tabindex 패턴

**동작 방식**:
- 트리 전체가 단일 탭 정지점 (Tab 순서에서 1번만 등장)
- Arrow 키로 노드 간 이동
- 현재 포커스된 노드만 tabindex="0", 나머지 tabindex="-1"

**구현**:
```typescript
// useKeyboardNav composable
const updateTabindexes = (focusedNodeId: string) => {
  // 모든 노드 tabindex를 -1로 설정
  document.querySelectorAll('[role="treeitem"]').forEach(node => {
    node.setAttribute('tabindex', '-1')
  })

  // 현재 포커스된 노드만 tabindex="0"
  const focusedElement = document.querySelector(`[data-node-id="${focusedNodeId}"]`)
  focusedElement?.setAttribute('tabindex', '0')
  focusedElement?.focus()
}
```

#### 4.2.3 포커스 복원

**시나리오**:
- 상세 패널에서 Esc로 돌아올 때 → 마지막 선택된 노드로 포커스 복원
- 전체 펼치기/접기 후 → 현재 포커스 유지
- 트리 재로드 후 → 이전 선택 노드로 포커스 복원 (localStorage)

---

## 5. 반응형 디자인 (Responsive Design)

### 5.1 브레이크포인트별 조정

| 화면 크기 | 노드 높이 | 들여쓰기 | 글자 크기 | 터치 영역 |
|----------|----------|---------|----------|----------|
| **Desktop** (>1024px) | 40px | 24px | 14px | - |
| **Tablet** (768-1023px) | 44px | 20px | 14px | 44x44px |
| **Mobile** (< 768px) | 48px | 16px | 16px | 48x48px |

**CSS 구현**:
```css
/* 기본 (Desktop) */
.wbs-tree-node {
  height: 40px;
  font-size: 14px;
}

.wbs-tree-node[data-depth="1"] { padding-left: 24px; }
.wbs-tree-node[data-depth="2"] { padding-left: 48px; }
.wbs-tree-node[data-depth="3"] { padding-left: 72px; }

/* Tablet */
@media (max-width: 1023px) {
  .wbs-tree-node {
    height: 44px;
  }

  .wbs-tree-node[data-depth="1"] { padding-left: 20px; }
  .wbs-tree-node[data-depth="2"] { padding-left: 40px; }
  .wbs-tree-node[data-depth="3"] { padding-left: 60px; }
}

/* Mobile */
@media (max-width: 767px) {
  .wbs-tree-node {
    height: 48px;
    font-size: 16px;  /* 가독성 향상 */
  }

  .wbs-tree-node[data-depth="1"] { padding-left: 16px; }
  .wbs-tree-node[data-depth="2"] { padding-left: 32px; }
  .wbs-tree-node[data-depth="3"] { padding-left: 48px; }

  /* 터치 영역 확장 */
  .tree-toggle-button {
    min-width: 48px;
    min-height: 48px;
  }
}
```

### 5.2 모바일 최적화

#### 5.2.1 스와이프 제스처 (향후 고려)

- 왼쪽 스와이프: 노드 접기
- 오른쪽 스와이프: 노드 펼치기
- 현재 범위에서는 제외 (기본 탭/더블탭만 지원)

#### 5.2.2 터치 피드백

**iOS 스타일 터치 하이라이트**:
```css
.wbs-tree-node {
  -webkit-tap-highlight-color: transparent;  /* 기본 하이라이트 제거 */
}

.wbs-tree-node:active {
  background-color: var(--surface-hover);
  transition: background-color 0ms;  /* 즉시 피드백 */
}
```

---

## 6. 성능 최적화

### 6.1 애니메이션 성능

#### 6.1.1 GPU 가속 활용

**will-change 속성**:
```css
/* 애니메이션이 빈번한 요소 */
.tree-toggle-icon {
  will-change: transform;
}

.wbs-tree-node {
  will-change: background-color, border-color;
}

/* 애니메이션 완료 후 제거 */
.wbs-tree-node.animation-complete {
  will-change: auto;
}
```

**transform/opacity 우선 사용**:
```css
/* ❌ 비효율적 (레이아웃 재계산) */
.tree-children {
  height: 0 → 200px;
}

/* ✅ 효율적 (GPU 가속) */
.tree-children {
  transform: scaleY(0) → scaleY(1);
  opacity: 0 → 1;
}
```

#### 6.1.2 대규모 트리 처리

**노드 수에 따른 애니메이션 제어**:
```typescript
const shouldAnimate = computed(() => {
  return totalNodeCount.value < 500  // 500개 이상이면 애니메이션 비활성화
})
```

**CSS 클래스 조건부 적용**:
```html
<div
  :class="{
    'animate-expand': shouldAnimate && isExpanding,
    'no-animate': !shouldAnimate
  }"
/>
```

### 6.2 렌더링 최적화

#### 6.2.1 Virtual Scrolling (향후 고려)

- 현재: 전체 노드 렌더링 (< 1000개로 충분)
- 향후: 대규모 트리 (>1000개)에서 가상 스크롤 적용 (PrimeVue VirtualScroller)

#### 6.2.2 CSS Containment

```css
.wbs-tree-node {
  contain: layout style;  /* 레이아웃 격리 */
}
```

---

## 7. 디자인 토큰 및 테마

### 7.1 PrimeVue 디자인 토큰 활용

**색상 토큰**:
```css
/* 기본 색상 */
--text-color: #333333
--text-color-secondary: #6c757d
--surface-0: #ffffff
--surface-50: #f8f9fa
--surface-100: #e9ecef
--surface-hover: #f8f9fa
--surface-ground: #eff3f8
--surface-border: #dee2e6

/* Primary 색상 (프로젝트에 따라 커스터마이즈) */
--primary-50: #f0f9ff
--primary-100: #e0f2fe
--primary-500: #0ea5e9
--primary-700: #0369a1
```

**간격 토큰**:
```css
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-5: 20px
--spacing-6: 24px
```

**애니메이션 토큰**:
```css
--transition-duration: 150ms
--transition-duration-slow: 300ms
--transition-easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### 7.2 다크 모드 지원 (향후 고려)

**색상 전환**:
```css
/* 라이트 모드 */
:root {
  --tree-node-bg: #ffffff;
  --tree-node-hover: #f8f9fa;
  --tree-node-selected: #e0f2fe;
}

/* 다크 모드 */
:root.dark {
  --tree-node-bg: #1e293b;
  --tree-node-hover: #334155;
  --tree-node-selected: #1e40af;
}
```

---

## 8. UI 컴포넌트 명세

### 8.1 WbsTreeNode 스타일 확장

```vue
<template>
  <div
    class="wbs-tree-node group"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-node-id="node.id"
    :data-depth="depth"
    role="treeitem"
    :aria-expanded="hasChildren ? (isExpanded ? 'true' : 'false') : undefined"
    :aria-selected="isSelected ? 'true' : 'false'"
    :aria-level="depth + 1"
    tabindex="-1"
    @click="handleSelect"
    @dblclick="handleDoubleClick"
  >
    <!-- 토글 버튼 -->
    <Button
      v-if="hasChildren"
      :icon="toggleIcon"
      text
      rounded
      size="small"
      class="tree-toggle-button"
      :class="{ 'rotate-0': isExpanded, '-rotate-90': !isExpanded }"
      :aria-label="isExpanded ? '접기' : '펼치기'"
      :aria-pressed="isExpanded ? 'true' : 'false'"
      @click.stop="handleToggle"
    />
    <span v-else class="tree-toggle-spacer w-6 h-6"></span>

    <!-- 노드 아이콘 (레벨별) -->
    <i :class="nodeIcon" class="mr-2 text-secondary" aria-hidden="true"></i>

    <!-- 노드 레이블 -->
    <span class="node-label flex-1 truncate">{{ node.title }}</span>

    <!-- 상태 배지 (선택 사항) -->
    <Badge v-if="node.status" :value="node.status" class="ml-2" />
  </div>

  <!-- 자식 노드 (애니메이션) -->
  <Transition name="tree-children">
    <div v-if="isExpanded && hasChildren" class="tree-children">
      <WbsTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </Transition>
</template>

<style scoped>
/* 노드 기본 스타일 */
.wbs-tree-node {
  @apply flex items-center gap-2 px-3 py-2 rounded-md;
  @apply border-2 border-transparent;
  @apply transition-all duration-150;
  @apply cursor-pointer;
  @apply focus-visible:outline-none;
  height: 40px;
}

/* 호버 */
.wbs-tree-node:hover {
  @apply bg-gray-50;
}

/* 선택 */
.wbs-tree-node.selected {
  @apply bg-primary-50 border-primary-500 text-primary-700 font-semibold;
}

/* 포커스 */
.wbs-tree-node:focus-visible {
  @apply border-dashed border-gray-300;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.wbs-tree-node.selected:focus-visible {
  @apply border-solid border-primary-500;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
}

/* 토글 버튼 */
.tree-toggle-button {
  @apply transition-transform duration-200 ease-out;
  will-change: transform;
}

.tree-toggle-button:hover {
  @apply text-primary-600;
}

/* 자식 노드 애니메이션 */
.tree-children-enter-active,
.tree-children-leave-active {
  transition: all 200ms ease-out;
  transform-origin: top;
}

.tree-children-enter-from {
  opacity: 0;
  transform: scaleY(0.95) translateY(-8px);
}

.tree-children-enter-to {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

.tree-children-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

.tree-children-leave-to {
  opacity: 0;
  transform: scaleY(0.95) translateY(-8px);
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .wbs-tree-node,
  .tree-toggle-button,
  .tree-children-enter-active,
  .tree-children-leave-active {
    transition: none !important;
    animation: none !important;
  }
}

/* 반응형 (Mobile) */
@media (max-width: 767px) {
  .wbs-tree-node {
    height: 48px;
    @apply text-base;
  }

  .tree-toggle-button {
    @apply min-w-12 min-h-12;
  }
}
</style>
```

### 8.2 WbsTreeHeader 확장 (전체 펼치기/접기)

```vue
<template>
  <div class="wbs-tree-header flex items-center justify-between px-4 py-3 border-b">
    <h2 class="text-lg font-semibold">WBS Tree</h2>

    <div class="flex gap-2">
      <Button
        label="전체 펼치기"
        icon="pi pi-chevron-down"
        size="small"
        outlined
        severity="secondary"
        @click="handleExpandAll"
      />
      <Button
        label="전체 접기"
        icon="pi pi-chevron-right"
        size="small"
        outlined
        severity="secondary"
        @click="handleCollapseAll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTreeInteraction } from '~/composables/useTreeInteraction'

const { expandAll, collapseAll } = useTreeInteraction()

const handleExpandAll = () => {
  expandAll()
}

const handleCollapseAll = () => {
  collapseAll()
}
</script>

<style scoped>
.wbs-tree-header {
  background-color: var(--surface-0);
}
</style>
```

---

## 9. 인수 기준 (Acceptance Criteria)

### 9.1 시각적 검증

- [ ] AC-UI-01: 펼침/접기 아이콘이 명확히 표시됨 (chevron-down/right)
- [ ] AC-UI-02: 아이콘 회전 애니메이션이 부드럽게 동작함 (200ms)
- [ ] AC-UI-03: 선택된 노드가 명확히 하이라이트됨 (배경 + 테두리)
- [ ] AC-UI-04: 호버 시 배경색이 변경됨
- [ ] AC-UI-05: 키보드 포커스가 명확히 보임 (dashed border + shadow)
- [ ] AC-UI-06: 자식 노드가 슬라이드 애니메이션과 함께 표시/숨김됨
- [ ] AC-UI-07: 전체 펼치기/접기 버튼이 헤더에 표시됨
- [ ] AC-UI-08: 계층 구조가 들여쓰기로 명확히 표현됨

### 9.2 애니메이션 검증

- [ ] AC-ANI-01: 펼침/접기 애니메이션이 200ms 이내에 완료됨
- [ ] AC-ANI-02: 포커스 이동 애니메이션이 100ms 이내에 완료됨
- [ ] AC-ANI-03: 선택 상태 전환이 150ms 이내에 완료됨
- [ ] AC-ANI-04: prefers-reduced-motion 설정 시 애니메이션이 비활성화됨
- [ ] AC-ANI-05: GPU 가속이 적용되어 애니메이션이 60fps로 동작함

### 9.3 접근성 검증

- [ ] AC-A11Y-01: 모든 기능이 키보드만으로 사용 가능함
- [ ] AC-A11Y-02: 포커스 순서가 논리적임 (DOM 순서 = 시각적 순서)
- [ ] AC-A11Y-03: 포커스 인디케이터가 명확히 보임 (3:1 대비율)
- [ ] AC-A11Y-04: ARIA 속성이 올바르게 설정됨 (role, aria-expanded, aria-selected)
- [ ] AC-A11Y-05: 스크린 리더가 노드 상태를 정확히 읽음
- [ ] AC-A11Y-06: 텍스트 대비율이 WCAG AA 기준을 충족함 (4.5:1)
- [ ] AC-A11Y-07: Lighthouse 접근성 점수 ≥90

### 9.4 반응형 검증

- [ ] AC-RES-01: 모바일 (< 768px)에서 터치 영역이 48x48px 이상임
- [ ] AC-RES-02: 태블릿 (768-1023px)에서 레이아웃이 정상 표시됨
- [ ] AC-RES-03: 데스크톱 (>1024px)에서 최적화된 레이아웃 표시됨
- [ ] AC-RES-04: 모든 화면 크기에서 텍스트가 읽기 쉬움 (14-16px)

### 9.5 성능 검증

- [ ] AC-PERF-01: 100개 노드에서 펼침/접기가 60fps로 동작함
- [ ] AC-PERF-02: 500개 노드에서 애니메이션이 30fps 이상 유지됨
- [ ] AC-PERF-03: 1000개 노드에서 애니메이션이 자동 비활성화됨
- [ ] AC-PERF-04: 로컬 스토리지 저장이 200ms 이내에 완료됨

---

## 10. 다음 단계

### 10.1 상세설계 단계 (/wf:draft)

- CSS 애니메이션 키프레임 상세 정의
- ARIA 속성 완전한 명세
- 에지 케이스별 UI 동작 정의
- 단위 테스트 시나리오 (시각적 회귀 테스트)

### 10.2 구현 단계 (/wf:build)

- WbsTreeNode 스타일 적용
- Vue Transition 컴포넌트 통합
- PrimeVue Button 커스터마이징
- TailwindCSS 유틸리티 활용
- ARIA 속성 바인딩

### 10.3 검증 단계 (/wf:verify)

- 시각적 회귀 테스트 (Percy, Chromatic)
- 접근성 자동화 테스트 (axe-core, Lighthouse)
- 키보드 네비게이션 수동 테스트
- 크로스 브라우저 테스트 (Chrome, Firefox, Safari, Edge)
- 모바일 디바이스 테스트 (iOS, Android)

---

## 11. 참고 자료

### 11.1 디자인 시스템

- [PrimeVue 4.x Documentation](https://primevue.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Material Design - Tree View](https://m3.material.io/)
- [Ant Design - Tree](https://ant.design/components/tree)

### 11.2 접근성 가이드

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices - Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 11.3 애니메이션 참고

- [Material Motion Guidelines](https://m3.material.io/styles/motion/overview)
- [CSS Triggers](https://csstriggers.com/)
- [Web Animation API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

---

## 12. 관련 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 6.2.3, 11.2)
- 기본설계: `010-basic-design.md` (아키텍처 및 로직)
- 상세설계: `020-detail-design.md` (다음 단계)
- 의존 Task:
  - TSK-04-01: `.jjiban/projects/jjiban/tasks/TSK-04-01/011-ui-design.md`
  - TSK-04-02: `.jjiban/projects/jjiban/tasks/TSK-04-02/011-ui-design.md`

---

<!--
Author: Claude (Frontend Architect)
Template Version: 1.0.0
Created: 2025-12-15
Focus: Visual design, interaction states, animations, accessibility
Tools: PrimeVue 4.x, TailwindCSS, Vue 3 Transitions
Standards: WCAG 2.1 AA, Material Design Motion
-->
