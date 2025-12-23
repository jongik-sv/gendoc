# 유저 매뉴얼 생성 절차서

## 개요

jjiban 프로젝트의 유저 매뉴얼 생성 워크플로우를 정리한 절차서입니다.
스킬 생성 전 표준화된 매뉴얼 생성 프로세스를 확립합니다.

---

## 매뉴얼 생성 5단계 워크플로우

### Phase 1: 준비 (Preparation)

**입력물**:
- Task ID 및 기능 정보
- 기본설계 문서 (010-basic-design.md)
- 화면설계 문서 (011-ui-design.md) - 있는 경우

**작업**:
1. 템플릿 확인: `.jjiban/templates/080-user-manual.md`
2. 대상 기능 범위 파악
3. 시나리오 목록 초안 작성 (3~6개)

**산출물**:
- 시나리오 목록 (사용자 관점 목표)

---

### Phase 2: 스크린샷 계획 (Screenshot Planning)

**입력물**:
- 시나리오 목록
- `screenshot-capture-guide.md` 참조

**작업**:
1. 시나리오별 필요한 스크린샷 목록 작성
2. 파일명 규칙 결정:
   ```
   {TSK-ID}-{시나리오번호}-{step번호}-{내용}.png

   예시 (TSK-04-01의 경우):
   - TSK-04-01-01-01-initial-view.png
   - TSK-04-01-01-02-click-result.png
   ```
3. 캡쳐 순서 결정

**산출물**:
- 스크린샷 체크리스트

---

### Phase 3: 스크린샷 캡쳐 (Screenshot Capture)

**입력물**:
- 스크린샷 체크리스트
- 실행 중인 애플리케이션 (localhost:3000)

**작업** (Playwright MCP 사용):
1. 브라우저 실행 및 페이지 이동
   ```
   playwright/browser_navigate → URL
   ```

2. 화면 조작 (클릭, 입력 등)
   ```
   playwright/browser_click → 요소 선택
   playwright/browser_snapshot → 현재 상태 확인
   ```

3. 스크린샷 캡쳐
   ```
   playwright/browser_take_screenshot → 파일명.png
   ```
   - **주의**: Playwright는 `.playwright-mcp/` 폴더에만 저장 가능

4. 이미지 복사
   ```bash
   cp .playwright-mcp/{파일명}.png .jjiban/projects/{project}/tasks/{TSK-ID}/manual-images/
   ```

**산출물**:
- `tasks/{TSK-ID}/manual-images/` 에 PNG 파일들

---

### Phase 4: 매뉴얼 문서 작성 (Document Writing)

**입력물**:
- 템플릿 (080-user-manual.md)
- 캡쳐된 스크린샷
- 기능 설계 문서

**작업**:
1. 템플릿 복사 및 메타데이터 작성
   ```markdown
   | Task ID | TSK-XX-XX |
   | Task명 | [기능명] |
   | 작성일 | YYYY-MM-DD |
   ```

2. 개요 섹션 작성
   - 한 문장 설명
   - ASCII 다이어그램 (화면 구성)
   - 주요 기능 요약 테이블

3. 시나리오별 사용 가이드 작성
   ```markdown
   ### 시나리오 N: [목표 동사형]

   **목표**: [사용자가 달성하고자 하는 목표]

   #### 단계별 안내

   **Step 1.** [동작 설명]

   ![설명](./manual-images/{파일명}.png)

   **Step 2.** [동작 설명]

   | 항목 | 설명 |
   |------|------|

   > **Tip**: [유용한 정보]
   ```

4. 부가 섹션 작성
   - 키보드 단축키
   - 상태별 화면
   - FAQ / 트러블슈팅
   - 접근성
   - 관련 문서
   - 변경 이력

**산출물**:
- `tasks/{TSK-ID}/080-user-manual.md`

---

### Phase 5: 검증 (Verification)

**입력물**:
- 작성된 매뉴얼 문서

**작업**:
1. 이미지 링크 검증
   ```bash
   # 모든 이미지 참조가 유효한지 확인
   grep -o './manual-images/[^)]*' {매뉴얼파일}
   ```

2. 구조 검증
   - 모든 섹션 존재 확인 (1~8)
   - 시나리오 3개 이상 확인
   - Step 형식 일관성 확인

3. 내용 검증
   - 실제 화면과 스크린샷 일치 확인
   - 단계별 안내 정확성 확인

**산출물**:
- 검증 완료된 최종 매뉴얼

---

## 파일 구조

```
.jjiban/
├── templates/
│   └── 080-user-manual.md      # 사용자 매뉴얼 템플릿
│
└── projects/{project}/
    └── tasks/{TSK-ID}/
        ├── 080-user-manual.md  # 사용자 매뉴얼 문서
        └── manual-images/      # 스크린샷 저장 폴더
            ├── {TSK-ID}-01-01-xxx.png
            ├── {TSK-ID}-01-02-xxx.png
            └── ...
```

---

## 스크린샷 파일명 규칙

Task ID를 접두어로 사용하여 구분 용이:

```
{TSK-ID}-{시나리오번호}-{step번호}-{내용}.png

예시 (TSK-04-01의 경우):
├── TSK-04-01-01-01-initial-view.png    # 시나리오1, Step1
├── TSK-04-01-01-02-click-result.png    # 시나리오1, Step2
├── TSK-04-01-02-01-search-input.png    # 시나리오2, Step1
└── ...
```

---

## Playwright 제약사항

1. **저장 경로 제한**: `.playwright-mcp/` 폴더만 가능
2. **워크어라운드**: 캡쳐 후 `manual-images/`로 복사 필요
3. **스냅샷 우선**: 클릭 전 `browser_snapshot`으로 요소 확인

---

## 에러 처리

캡쳐 불가능 상황 시 에러 메시지 출력 후 즉시 종료:

| 상황 | 에러 메시지 |
|------|------------|
| 서버 미실행 | `[ERROR] localhost:3000 연결 실패. 서버를 먼저 실행하세요.` |
| Playwright 연결 실패 | `[ERROR] Playwright MCP 연결 실패. MCP 서버 상태를 확인하세요.` |
| 페이지 로드 실패 | `[ERROR] 페이지 로드 실패: {URL}` |
| 스크린샷 저장 실패 | `[ERROR] 스크린샷 저장 실패: {파일명}` |
| Task 폴더 없음 | `[ERROR] Task 폴더가 존재하지 않습니다: {경로}` |

**처리 규칙**:
- 에러 발생 시 진행 중단
- 에러 메시지 출력
- 부분 작업 롤백 (가능한 경우)
- 즉시 종료

---

## 체크리스트

### 매뉴얼 작성 전
- [ ] Task ID 확인
- [ ] 기능 범위 파악
- [ ] 시나리오 목록 작성 (3~6개)
- [ ] 스크린샷 목록 작성

### 스크린샷 캡쳐
- [ ] 애플리케이션 실행 확인 (localhost:3000)
- [ ] `tasks/{TSK-ID}/manual-images/` 폴더 생성
- [ ] Playwright로 화면 캡쳐
- [ ] `.playwright-mcp/` → `tasks/{TSK-ID}/manual-images/` 복사

### 문서 작성
- [ ] 메타데이터 작성
- [ ] 개요 (ASCII 다이어그램 포함)
- [ ] 시나리오별 Step 작성
- [ ] 이미지 링크 삽입 `![](./manual-images/xxx.png)`
- [ ] 키보드 단축키
- [ ] 상태별 화면
- [ ] FAQ (3개 이상)
- [ ] 접근성
- [ ] 관련 문서
- [ ] 변경 이력

### 검증
- [ ] 이미지 링크 유효성
- [ ] 구조 완전성
- [ ] 내용 정확성

---

## 관련 파일

| 파일 | 경로 |
|------|------|
| 매뉴얼 템플릿 | `.jjiban/templates/080-user-manual.md` |
| 스크린샷 가이드 | `.jjiban/projects/jjiban/screenshot-capture-guide.md` |

---

<!--
Created: 2025-12-16
Purpose: 유저 매뉴얼 생성 워크플로우 표준화
-->
