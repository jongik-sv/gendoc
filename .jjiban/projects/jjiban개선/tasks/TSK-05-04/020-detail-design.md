# TSK-05-04: 통합 테스트 - 상세설계

**Task ID**: TSK-05-04
**Category**: development
**Status**: [dd]
**Date**: 2025-12-17
**Author**: Quality Engineer

---

## 1. 테스트 환경 구성

### 1.1 테스트 프로젝트 구조

```
.jjiban/projects/test-wf/
├── project.json
├── wbs.md
└── tasks/
    ├── TST-DEV-01/
    ├── TST-DFT-01/
    └── TST-INF-01/
```

### 1.2 테스트 프로젝트 메타데이터

**`.jjiban/projects/test-wf/project.json`**:
```json
{
  "id": "test-wf",
  "name": "워크플로우 통합 테스트",
  "description": "WP-05 워크플로우 유연화 통합 테스트 프로젝트",
  "start": "2025-12-17",
  "depth": 3,
  "version": "2.0"
}
```

### 1.3 초기 WBS 파일

**`.jjiban/projects/test-wf/wbs.md`**:
```markdown
> version: 2.0
> depth: 3
> updated: 2025-12-17
> start: 2025-12-17

---

## WP-TEST: 테스트 워크패키지
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- progress: 0%

### TST-DEV-01: Development 워크플로우 테스트
- category: development
- status: [ ]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, workflow
- requirements:
  - 전체 상태 전이 검증 ([ ] → [bd] → [dd] → [im] → [vf] → [xx])

### TST-DFT-01: Defect 워크플로우 테스트
- category: defect
- status: [ ]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, workflow
- requirements:
  - 전체 상태 전이 검증 ([ ] → [an] → [fx] → [vf] → [xx])

### TST-INF-01: Infrastructure 워크플로우 테스트
- category: infrastructure
- status: [ ]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, workflow
- requirements:
  - 전체 상태 전이 검증 ([ ] → [dd] → [im] → [xx])

### TST-LEG-01: 레거시 상태 코드 테스트
- category: development
- status: [ts]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, legacy
- requirements:
  - 레거시 [ts] 상태가 [vf]로 정규화되는지 검증

### TST-LEG-02: 레거시 Infrastructure 상태 테스트
- category: infrastructure
- status: [ds]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, legacy
- requirements:
  - 레거시 [ds] 상태가 [dd]로 정규화되는지 검증
```

---

## 2. 테스트 케이스 상세

### 2.1 카테고리별 워크플로우 테스트

#### TC-01: Development 워크플로우 전체 흐름

**목적**: Development 카테고리 전체 상태 전이 검증

**사전 조건**:
- `TST-DEV-01` 상태: `[ ]`
- `workflows.json` 로드 정상

**테스트 단계**:

| 단계 | 명령어 | 예상 결과 | 검증 방법 |
|------|--------|----------|----------|
| 1 | `npx jjiban workflow start test-wf TST-DEV-01` | 상태: `[bd]` | `grep "status: \[bd\]" wbs.md` |
| 2 | `npx jjiban workflow draft test-wf TST-DEV-01` | 상태: `[dd]` | `grep "status: \[dd\]" wbs.md` |
| 3 | `npx jjiban workflow build test-wf TST-DEV-01` | 상태: `[im]` | `grep "status: \[im\]" wbs.md` |
| 4 | `npx jjiban workflow verify test-wf TST-DEV-01` | 상태: `[vf]` | `grep "status: \[vf\]" wbs.md` |
| 5 | `npx jjiban workflow done test-wf TST-DEV-01` | 상태: `[xx]` | `grep "status: \[xx\]" wbs.md` |

**검증 스크립트**:
```bash
#!/bin/bash
# test-development-workflow.sh

PROJECT_ID="test-wf"
TASK_ID="TST-DEV-01"
WBS_FILE=".jjiban/projects/${PROJECT_ID}/wbs.md"

echo "=== TC-01: Development 워크플로우 테스트 ==="

# 1. 초기 상태 확인
echo "[1] 초기 상태 확인..."
if grep -q "### ${TASK_ID}:" "$WBS_FILE" && grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[ \]"; then
    echo "✓ 초기 상태: [ ]"
else
    echo "✗ 초기 상태 불일치"
    exit 1
fi

# 2. start 명령어
echo "[2] start 명령어 실행..."
npx jjiban workflow start "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[bd\]"; then
    echo "✓ start 성공: [ ] → [bd]"
else
    echo "✗ start 실패"
    exit 1
fi

# 3. draft 명령어
echo "[3] draft 명령어 실행..."
npx jjiban workflow draft "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[dd\]"; then
    echo "✓ draft 성공: [bd] → [dd]"
else
    echo "✗ draft 실패"
    exit 1
fi

# 4. build 명령어
echo "[4] build 명령어 실행..."
npx jjiban workflow build "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[im\]"; then
    echo "✓ build 성공: [dd] → [im]"
else
    echo "✗ build 실패"
    exit 1
fi

# 5. verify 명령어
echo "[5] verify 명령어 실행..."
npx jjiban workflow verify "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[vf\]"; then
    echo "✓ verify 성공: [im] → [vf]"
else
    echo "✗ verify 실패"
    exit 1
fi

# 6. done 명령어
echo "[6] done 명령어 실행..."
npx jjiban workflow done "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[xx\]"; then
    echo "✓ done 성공: [vf] → [xx]"
else
    echo "✗ done 실패"
    exit 1
fi

echo "=== TC-01: 통과 ==="
```

#### TC-02: Defect 워크플로우 전체 흐름

**목적**: Defect 카테고리 전체 상태 전이 검증

**사전 조건**:
- `TST-DFT-01` 상태: `[ ]`

**테스트 단계**:

| 단계 | 명령어 | 예상 결과 | 검증 방법 |
|------|--------|----------|----------|
| 1 | `npx jjiban workflow start test-wf TST-DFT-01` | 상태: `[an]` | `grep "status: \[an\]" wbs.md` |
| 2 | `npx jjiban workflow fix test-wf TST-DFT-01` | 상태: `[fx]` | `grep "status: \[fx\]" wbs.md` |
| 3 | `npx jjiban workflow verify test-wf TST-DFT-01` | 상태: `[vf]` | `grep "status: \[vf\]" wbs.md` |
| 4 | `npx jjiban workflow done test-wf TST-DFT-01` | 상태: `[xx]` | `grep "status: \[xx\]" wbs.md` |

**검증 스크립트**:
```bash
#!/bin/bash
# test-defect-workflow.sh

PROJECT_ID="test-wf"
TASK_ID="TST-DFT-01"
WBS_FILE=".jjiban/projects/${PROJECT_ID}/wbs.md"

echo "=== TC-02: Defect 워크플로우 테스트 ==="

# 1. start → [an]
echo "[1] start 명령어 실행..."
npx jjiban workflow start "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[an\]"; then
    echo "✓ start 성공: [ ] → [an]"
else
    echo "✗ start 실패"
    exit 1
fi

# 2. fix → [fx]
echo "[2] fix 명령어 실행..."
npx jjiban workflow fix "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[fx\]"; then
    echo "✓ fix 성공: [an] → [fx]"
else
    echo "✗ fix 실패"
    exit 1
fi

# 3. verify → [vf]
echo "[3] verify 명령어 실행..."
npx jjiban workflow verify "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[vf\]"; then
    echo "✓ verify 성공: [fx] → [vf]"
else
    echo "✗ verify 실패"
    exit 1
fi

# 4. done → [xx]
echo "[4] done 명령어 실행..."
npx jjiban workflow done "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[xx\]"; then
    echo "✓ done 성공: [vf] → [xx]"
else
    echo "✗ done 실패"
    exit 1
fi

echo "=== TC-02: 통과 ==="
```

#### TC-03: Infrastructure 워크플로우 전체 흐름

**목적**: Infrastructure 카테고리 전체 상태 전이 검증

**사전 조건**:
- `TST-INF-01` 상태: `[ ]`

**테스트 단계**:

| 단계 | 명령어 | 예상 결과 | 검증 방법 |
|------|--------|----------|----------|
| 1 | `npx jjiban workflow start test-wf TST-INF-01` | 상태: `[dd]` | `grep "status: \[dd\]" wbs.md` |
| 2 | `npx jjiban workflow build test-wf TST-INF-01` | 상태: `[im]` | `grep "status: \[im\]" wbs.md` |
| 3 | `npx jjiban workflow done test-wf TST-INF-01` | 상태: `[xx]` | `grep "status: \[xx\]" wbs.md` |

**참고**: Infrastructure는 `[vf]` 단계를 건너뜁니다.

**검증 스크립트**:
```bash
#!/bin/bash
# test-infrastructure-workflow.sh

PROJECT_ID="test-wf"
TASK_ID="TST-INF-01"
WBS_FILE=".jjiban/projects/${PROJECT_ID}/wbs.md"

echo "=== TC-03: Infrastructure 워크플로우 테스트 ==="

# 1. start → [dd]
echo "[1] start 명령어 실행..."
npx jjiban workflow start "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[dd\]"; then
    echo "✓ start 성공: [ ] → [dd]"
else
    echo "✗ start 실패"
    exit 1
fi

# 2. build → [im]
echo "[2] build 명령어 실행..."
npx jjiban workflow build "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[im\]"; then
    echo "✓ build 성공: [dd] → [im]"
else
    echo "✗ build 실패"
    exit 1
fi

# 3. done → [xx]
echo "[3] done 명령어 실행..."
npx jjiban workflow done "$PROJECT_ID" "$TASK_ID"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[xx\]"; then
    echo "✓ done 성공: [im] → [xx]"
else
    echo "✗ done 실패"
    exit 1
fi

echo "=== TC-03: 통과 ==="
```

---

### 2.2 호환성 테스트

#### TC-04: 레거시 [ts] 상태 정규화

**목적**: 레거시 `[ts]` 상태가 `[vf]`로 정규화되는지 검증

**사전 조건**:
- `TST-LEG-01` 상태: `[ts]` (WBS 파일에 수동 작성)

**테스트 단계**:

| 단계 | 작업 | 예상 결과 | 검증 방법 |
|------|------|----------|----------|
| 1 | WBS 파일 읽기 (CLI 내부) | `[ts]` → `[vf]` 자동 변환 | CLI 로그 확인 |
| 2 | `npx jjiban workflow done test-wf TST-LEG-01` | 정상 실행 (`[vf]` 기준) | 에러 없음 |
| 3 | WBS 파일 확인 | 상태: `[xx]` | `grep "status: \[xx\]" wbs.md` |

**검증 스크립트**:
```bash
#!/bin/bash
# test-legacy-ts.sh

PROJECT_ID="test-wf"
TASK_ID="TST-LEG-01"
WBS_FILE=".jjiban/projects/${PROJECT_ID}/wbs.md"

echo "=== TC-04: 레거시 [ts] 상태 정규화 테스트 ==="

# 1. 초기 상태 확인 (수동으로 [ts] 설정)
echo "[1] 초기 상태 확인 (레거시 [ts])..."
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[ts\]"; then
    echo "✓ 레거시 상태: [ts]"
else
    echo "✗ 레거시 상태 설정 실패"
    exit 1
fi

# 2. done 명령어 실행 ([ts]가 [vf]로 정규화되어 done 실행 가능해야 함)
echo "[2] done 명령어 실행..."
npx jjiban workflow done "$PROJECT_ID" "$TASK_ID"
if [ $? -eq 0 ]; then
    echo "✓ 레거시 상태 정규화 성공 ([ts] → [vf] → done 가능)"
else
    echo "✗ 레거시 상태 정규화 실패"
    exit 1
fi

# 3. 최종 상태 확인
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[xx\]"; then
    echo "✓ 최종 상태: [xx]"
else
    echo "✗ 최종 상태 불일치"
    exit 1
fi

echo "=== TC-04: 통과 ==="
```

#### TC-05: 레거시 [ds] 상태 정규화

**목적**: 레거시 `[ds]` 상태가 `[dd]`로 정규화되는지 검증

**사전 조건**:
- `TST-LEG-02` 상태: `[ds]` (WBS 파일에 수동 작성)

**테스트 단계**:

| 단계 | 작업 | 예상 결과 | 검증 방법 |
|------|------|----------|----------|
| 1 | WBS 파일 읽기 (CLI 내부) | `[ds]` → `[dd]` 자동 변환 | CLI 로그 확인 |
| 2 | `npx jjiban workflow build test-wf TST-LEG-02` | 정상 실행 (`[dd]` 기준) | 에러 없음 |
| 3 | WBS 파일 확인 | 상태: `[im]` | `grep "status: \[im\]" wbs.md` |

**검증 스크립트**:
```bash
#!/bin/bash
# test-legacy-ds.sh

PROJECT_ID="test-wf"
TASK_ID="TST-LEG-02"
WBS_FILE=".jjiban/projects/${PROJECT_ID}/wbs.md"

echo "=== TC-05: 레거시 [ds] 상태 정규화 테스트 ==="

# 1. 초기 상태 확인 (수동으로 [ds] 설정)
echo "[1] 초기 상태 확인 (레거시 [ds])..."
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[ds\]"; then
    echo "✓ 레거시 상태: [ds]"
else
    echo "✗ 레거시 상태 설정 실패"
    exit 1
fi

# 2. build 명령어 실행 ([ds]가 [dd]로 정규화되어 build 실행 가능해야 함)
echo "[2] build 명령어 실행..."
npx jjiban workflow build "$PROJECT_ID" "$TASK_ID"
if [ $? -eq 0 ]; then
    echo "✓ 레거시 상태 정규화 성공 ([ds] → [dd] → build 가능)"
else
    echo "✗ 레거시 상태 정규화 실패"
    exit 1
fi

# 3. 최종 상태 확인
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[im\]"; then
    echo "✓ 최종 상태: [im]"
else
    echo "✗ 최종 상태 불일치"
    exit 1
fi

echo "=== TC-05: 통과 ==="
```

#### TC-06: 기존 WBS 파일 파싱

**목적**: 다양한 WBS 형식이 정상적으로 파싱되는지 검증

**테스트 데이터**:

```markdown
# 케이스 1: 표준 형식
### TST-PARSE-01: 표준 형식
- category: development
- status: [bd]
- priority: high

# 케이스 2: 공백 변형
### TST-PARSE-02: 공백 변형
-  category:  development
-  status:  [dd]
-  priority:  high

# 케이스 3: 순서 변형
### TST-PARSE-03: 순서 변형
- priority: high
- category: development
- status: [im]

# 케이스 4: 최소 필드
### TST-PARSE-04: 최소 필드
- category: defect
- status: [an]
```

**검증 스크립트**:
```bash
#!/bin/bash
# test-wbs-parsing.sh

PROJECT_ID="test-wf"
WBS_FILE=".jjiban/projects/${PROJECT_ID}/wbs.md"

echo "=== TC-06: WBS 파일 파싱 테스트 ==="

# 각 케이스별 파싱 확인
for task_id in TST-PARSE-01 TST-PARSE-02 TST-PARSE-03 TST-PARSE-04; do
    echo "[테스트] $task_id 파싱 확인..."

    # CLI가 Task를 정상적으로 인식하는지 확인
    npx jjiban task info test-wf "$task_id" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ $task_id 파싱 성공"
    else
        echo "✗ $task_id 파싱 실패"
        exit 1
    fi
done

echo "=== TC-06: 통과 ==="
```

---

### 2.3 폴백 테스트

#### TC-07: workflows.json 없음

**목적**: `workflows.json` 파일이 없을 때 기본값 폴백 검증

**사전 조건**:
- `.jjiban/settings/workflows.json` 파일 임시 삭제

**테스트 단계**:

| 단계 | 작업 | 예상 결과 | 검증 방법 |
|------|------|----------|----------|
| 1 | 설정 파일 백업 및 삭제 | 파일 없음 | `ls` 확인 |
| 2 | CLI 명령어 실행 | 에러 없이 실행 (기본값 사용) | 에러 코드 0 |
| 3 | 상태 전이 확인 | 정상 전이 | WBS 파일 확인 |
| 4 | 설정 파일 복구 | 파일 복구 | `mv` 명령어 |

**검증 스크립트**:
```bash
#!/bin/bash
# test-fallback-no-config.sh

PROJECT_ID="test-wf"
TASK_ID="TST-DEV-01"
WORKFLOWS_FILE=".jjiban/settings/workflows.json"
BACKUP_FILE="${WORKFLOWS_FILE}.bak"

echo "=== TC-07: workflows.json 없음 폴백 테스트 ==="

# 1. 설정 파일 백업
echo "[1] 설정 파일 백업..."
if [ -f "$WORKFLOWS_FILE" ]; then
    mv "$WORKFLOWS_FILE" "$BACKUP_FILE"
    echo "✓ 백업 완료: $BACKUP_FILE"
else
    echo "⚠ 설정 파일 없음 (이미 삭제 상태)"
fi

# 2. CLI 실행 (기본값 폴백)
echo "[2] CLI 실행 (기본값 폴백)..."
npx jjiban workflow start "$PROJECT_ID" "$TASK_ID"
if [ $? -eq 0 ]; then
    echo "✓ 기본값 폴백 성공 (에러 없음)"
else
    echo "✗ 기본값 폴백 실패"
    # 복구
    [ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    exit 1
fi

# 3. 상태 전이 확인
WBS_FILE=".jjiban/projects/${PROJECT_ID}/wbs.md"
if grep -A 10 "### ${TASK_ID}:" "$WBS_FILE" | grep -q "status: \[bd\]"; then
    echo "✓ 상태 전이 정상: [ ] → [bd]"
else
    echo "✗ 상태 전이 실패"
    # 복구
    [ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    exit 1
fi

# 4. 설정 파일 복구
echo "[3] 설정 파일 복구..."
if [ -f "$BACKUP_FILE" ]; then
    mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    echo "✓ 복구 완료"
fi

echo "=== TC-07: 통과 ==="
```

#### TC-08: workflows.json 형식 오류

**목적**: `workflows.json` 파일이 잘못된 형식일 때 폴백 검증

**사전 조건**:
- `.jjiban/settings/workflows.json` 파일을 잘못된 JSON으로 수정

**테스트 데이터**:
```json
{
  "version": "1.0",
  "workflows": [
    {
      "id": "development",
      "states": ["[ ]", "[bd]", "[dd]"  // 닫는 괄호 누락
}
```

**테스트 단계**:

| 단계 | 작업 | 예상 결과 | 검증 방법 |
|------|------|----------|----------|
| 1 | 설정 파일 백업 및 오류 주입 | 잘못된 JSON | JSON 파싱 실패 |
| 2 | CLI 명령어 실행 | 에러 없이 실행 (기본값 사용) | 에러 코드 0 |
| 3 | 로그 확인 | 폴백 경고 메시지 출력 | 로그 검색 |
| 4 | 설정 파일 복구 | 파일 복구 | `mv` 명령어 |

**검증 스크립트**:
```bash
#!/bin/bash
# test-fallback-malformed-config.sh

PROJECT_ID="test-wf"
TASK_ID="TST-DEV-01"
WORKFLOWS_FILE=".jjiban/settings/workflows.json"
BACKUP_FILE="${WORKFLOWS_FILE}.bak"
MALFORMED_FILE="${WORKFLOWS_FILE}.malformed"

echo "=== TC-08: workflows.json 형식 오류 폴백 테스트 ==="

# 1. 설정 파일 백업
echo "[1] 설정 파일 백업..."
if [ -f "$WORKFLOWS_FILE" ]; then
    cp "$WORKFLOWS_FILE" "$BACKUP_FILE"
    echo "✓ 백업 완료: $BACKUP_FILE"
fi

# 2. 잘못된 JSON 생성
echo "[2] 잘못된 JSON 주입..."
cat > "$WORKFLOWS_FILE" <<'EOF'
{
  "version": "1.0",
  "workflows": [
    {
      "id": "development",
      "states": ["[ ]", "[bd]", "[dd]"
}
EOF
echo "✓ 잘못된 JSON 작성 완료"

# 3. CLI 실행 (기본값 폴백)
echo "[3] CLI 실행 (기본값 폴백)..."
npx jjiban workflow start "$PROJECT_ID" "$TASK_ID" 2>&1 | tee /tmp/cli-output.log
if [ $? -eq 0 ]; then
    echo "✓ 기본값 폴백 성공 (에러 없음)"
else
    echo "✗ 기본값 폴백 실패"
    # 복구
    [ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    exit 1
fi

# 4. 폴백 경고 메시지 확인
if grep -q "fallback\|기본값\|default" /tmp/cli-output.log; then
    echo "✓ 폴백 경고 메시지 출력 확인"
else
    echo "⚠ 폴백 경고 메시지 없음 (선택 사항)"
fi

# 5. 설정 파일 복구
echo "[4] 설정 파일 복구..."
if [ -f "$BACKUP_FILE" ]; then
    mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    echo "✓ 복구 완료"
fi

echo "=== TC-08: 통과 ==="
```

#### TC-09: 부분 설정 누락

**목적**: `workflows.json`에 일부 카테고리만 정의되어 있을 때 폴백 검증

**테스트 데이터**:
```json
{
  "version": "1.0",
  "workflows": [
    {
      "id": "development",
      "states": ["[ ]", "[bd]", "[dd]", "[im]", "[vf]", "[xx]"],
      "transitions": [...]
    }
    // defect, infrastructure 누락
  ]
}
```

**테스트 단계**:

| 단계 | 작업 | 예상 결과 | 검증 방법 |
|------|------|----------|----------|
| 1 | 부분 설정 파일 작성 | development만 존재 | 파일 확인 |
| 2 | development 워크플로우 실행 | 정상 실행 (설정 사용) | 에러 없음 |
| 3 | defect 워크플로우 실행 | 정상 실행 (기본값 사용) | 에러 없음 |
| 4 | 설정 파일 복구 | 파일 복구 | `mv` 명령어 |

**검증 스크립트**:
```bash
#!/bin/bash
# test-fallback-partial-config.sh

PROJECT_ID="test-wf"
WORKFLOWS_FILE=".jjiban/settings/workflows.json"
BACKUP_FILE="${WORKFLOWS_FILE}.bak"

echo "=== TC-09: 부분 설정 누락 폴백 테스트 ==="

# 1. 설정 파일 백업
echo "[1] 설정 파일 백업..."
if [ -f "$WORKFLOWS_FILE" ]; then
    cp "$WORKFLOWS_FILE" "$BACKUP_FILE"
    echo "✓ 백업 완료"
fi

# 2. 부분 설정 파일 작성 (development만)
echo "[2] 부분 설정 파일 작성..."
cat > "$WORKFLOWS_FILE" <<'EOF'
{
  "version": "1.0",
  "workflows": [
    {
      "id": "development",
      "states": ["[ ]", "[bd]", "[dd]", "[im]", "[vf]", "[xx]"],
      "initialState": "[ ]",
      "finalStates": ["[xx]"],
      "transitions": [
        {"from": "[ ]", "to": "[bd]", "command": "start"},
        {"from": "[bd]", "to": "[dd]", "command": "draft"},
        {"from": "[dd]", "to": "[im]", "command": "build"},
        {"from": "[im]", "to": "[vf]", "command": "verify"},
        {"from": "[vf]", "to": "[xx]", "command": "done"}
      ]
    }
  ]
}
EOF
echo "✓ 부분 설정 작성 완료"

# 3. development 워크플로우 실행 (설정 사용)
echo "[3] development 워크플로우 실행..."
npx jjiban workflow start "$PROJECT_ID" "TST-DEV-01"
if [ $? -eq 0 ]; then
    echo "✓ development 워크플로우 정상 (설정 사용)"
else
    echo "✗ development 워크플로우 실패"
    [ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    exit 1
fi

# 4. defect 워크플로우 실행 (기본값 폴백)
echo "[4] defect 워크플로우 실행..."
npx jjiban workflow start "$PROJECT_ID" "TST-DFT-01"
if [ $? -eq 0 ]; then
    echo "✓ defect 워크플로우 정상 (기본값 폴백)"
else
    echo "✗ defect 워크플로우 실패"
    [ -f "$BACKUP_FILE" ] && mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    exit 1
fi

# 5. 설정 파일 복구
echo "[5] 설정 파일 복구..."
if [ -f "$BACKUP_FILE" ]; then
    mv "$BACKUP_FILE" "$WORKFLOWS_FILE"
    echo "✓ 복구 완료"
fi

echo "=== TC-09: 통과 ==="
```

---

## 3. 통합 테스트 실행 계획

### 3.1 테스트 실행 순서

```
준비 단계
├── 1. 선행 Task 완료 확인 (TSK-05-01, TSK-05-02, TSK-05-03)
├── 2. 테스트 프로젝트 생성
└── 3. 초기 WBS 파일 작성

카테고리별 워크플로우 테스트 (병렬 가능)
├── TC-01: Development 워크플로우
├── TC-02: Defect 워크플로우
└── TC-03: Infrastructure 워크플로우

호환성 테스트 (병렬 가능)
├── TC-04: 레거시 [ts] 상태 정규화
├── TC-05: 레거시 [ds] 상태 정규화
└── TC-06: WBS 파일 파싱

폴백 테스트 (순차 실행)
├── TC-07: workflows.json 없음
├── TC-08: workflows.json 형식 오류
└── TC-09: 부분 설정 누락

결과 정리
└── 테스트 결과 보고서 작성
```

### 3.2 통합 실행 스크립트

**`run-all-tests.sh`**:
```bash
#!/bin/bash
# run-all-tests.sh - 전체 테스트 자동 실행

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_SCRIPTS_DIR="$SCRIPT_DIR/test-scripts"
RESULTS_DIR="$SCRIPT_DIR/test-results"

mkdir -p "$RESULTS_DIR"

echo "========================================"
echo "TSK-05-04: 통합 테스트 자동 실행"
echo "========================================"
echo ""

# 테스트 결과 변수
TOTAL=0
PASSED=0
FAILED=0
FAILED_TESTS=()

# 테스트 실행 함수
run_test() {
    local test_name=$1
    local test_script=$2

    echo ">>> [$test_name] 실행 중..."
    TOTAL=$((TOTAL + 1))

    if bash "$test_script" > "$RESULTS_DIR/${test_name}.log" 2>&1; then
        echo "✓ [$test_name] 통과"
        PASSED=$((PASSED + 1))
    else
        echo "✗ [$test_name] 실패"
        FAILED=$((FAILED + 1))
        FAILED_TESTS+=("$test_name")
    fi
    echo ""
}

# 1. 카테고리별 워크플로우 테스트
echo "=== 1. 카테고리별 워크플로우 테스트 ==="
run_test "TC-01" "$TEST_SCRIPTS_DIR/test-development-workflow.sh"
run_test "TC-02" "$TEST_SCRIPTS_DIR/test-defect-workflow.sh"
run_test "TC-03" "$TEST_SCRIPTS_DIR/test-infrastructure-workflow.sh"

# 2. 호환성 테스트
echo "=== 2. 호환성 테스트 ==="
run_test "TC-04" "$TEST_SCRIPTS_DIR/test-legacy-ts.sh"
run_test "TC-05" "$TEST_SCRIPTS_DIR/test-legacy-ds.sh"
run_test "TC-06" "$TEST_SCRIPTS_DIR/test-wbs-parsing.sh"

# 3. 폴백 테스트
echo "=== 3. 폴백 테스트 ==="
run_test "TC-07" "$TEST_SCRIPTS_DIR/test-fallback-no-config.sh"
run_test "TC-08" "$TEST_SCRIPTS_DIR/test-fallback-malformed-config.sh"
run_test "TC-09" "$TEST_SCRIPTS_DIR/test-fallback-partial-config.sh"

# 결과 요약
echo "========================================"
echo "테스트 결과 요약"
echo "========================================"
echo "총 테스트: $TOTAL"
echo "통과: $PASSED"
echo "실패: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "실패한 테스트:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
        echo "    로그: $RESULTS_DIR/${test}.log"
    done
    exit 1
else
    echo "✓ 모든 테스트 통과"
    exit 0
fi
```

---

## 4. 테스트 데이터 상세

### 4.1 테스트 프로젝트 초기화 스크립트

**`setup-test-project.sh`**:
```bash
#!/bin/bash
# setup-test-project.sh - 테스트 프로젝트 초기화

PROJECT_DIR=".jjiban/projects/test-wf"
PROJECT_JSON="$PROJECT_DIR/project.json"
WBS_FILE="$PROJECT_DIR/wbs.md"

echo "=== 테스트 프로젝트 초기화 ==="

# 1. 기존 프로젝트 삭제 (재실행 대비)
if [ -d "$PROJECT_DIR" ]; then
    echo "[1] 기존 테스트 프로젝트 삭제..."
    rm -rf "$PROJECT_DIR"
fi

# 2. 프로젝트 디렉토리 생성
echo "[2] 프로젝트 디렉토리 생성..."
mkdir -p "$PROJECT_DIR/tasks"

# 3. project.json 작성
echo "[3] project.json 작성..."
cat > "$PROJECT_JSON" <<'EOF'
{
  "id": "test-wf",
  "name": "워크플로우 통합 테스트",
  "description": "WP-05 워크플로우 유연화 통합 테스트 프로젝트",
  "start": "2025-12-17",
  "depth": 3,
  "version": "2.0"
}
EOF

# 4. wbs.md 작성
echo "[4] wbs.md 작성..."
cat > "$WBS_FILE" <<'EOF'
> version: 2.0
> depth: 3
> updated: 2025-12-17
> start: 2025-12-17

---

## WP-TEST: 테스트 워크패키지
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- progress: 0%

### TST-DEV-01: Development 워크플로우 테스트
- category: development
- status: [ ]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, workflow
- requirements:
  - 전체 상태 전이 검증 ([ ] → [bd] → [dd] → [im] → [vf] → [xx])

### TST-DFT-01: Defect 워크플로우 테스트
- category: defect
- status: [ ]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, workflow
- requirements:
  - 전체 상태 전이 검증 ([ ] → [an] → [fx] → [vf] → [xx])

### TST-INF-01: Infrastructure 워크플로우 테스트
- category: infrastructure
- status: [ ]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, workflow
- requirements:
  - 전체 상태 전이 검증 ([ ] → [dd] → [im] → [xx])

### TST-LEG-01: 레거시 상태 코드 테스트
- category: development
- status: [ts]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, legacy
- requirements:
  - 레거시 [ts] 상태가 [vf]로 정규화되는지 검증

### TST-LEG-02: 레거시 Infrastructure 상태 테스트
- category: infrastructure
- status: [ds]
- priority: high
- schedule: 2025-12-17 ~ 2025-12-17
- tags: test, legacy
- requirements:
  - 레거시 [ds] 상태가 [dd]로 정규화되는지 검증

### TST-PARSE-01: WBS 파싱 테스트 - 표준 형식
- category: development
- status: [bd]
- priority: high

### TST-PARSE-02: WBS 파싱 테스트 - 공백 변형
-  category:  development
-  status:  [dd]
-  priority:  high

### TST-PARSE-03: WBS 파싱 테스트 - 순서 변형
- priority: high
- category: development
- status: [im]

### TST-PARSE-04: WBS 파싱 테스트 - 최소 필드
- category: defect
- status: [an]
EOF

echo "✓ 테스트 프로젝트 초기화 완료"
echo "  - Project: $PROJECT_DIR"
echo "  - WBS: $WBS_FILE"
```

---

## 5. 검증 체크리스트

### 5.1 사전 확인 체크리스트

- [ ] Node.js 20.x 설치 확인
- [ ] CLI 실행 가능 확인 (`npx jjiban --version`)
- [ ] TSK-05-01 완료 확인 (`cli/config/settingsLoader.js` 존재)
- [ ] TSK-05-02 완료 확인 (`getWorkflowSteps()` 함수 존재)
- [ ] TSK-05-03 완료 확인 (`WbsReader.js` 정규화 로직 존재)
- [ ] 테스트 프로젝트 백업 (충돌 방지)

### 5.2 테스트 실행 체크리스트

**카테고리별 워크플로우**:
- [ ] TC-01: Development 워크플로우 통과
- [ ] TC-02: Defect 워크플로우 통과
- [ ] TC-03: Infrastructure 워크플로우 통과

**호환성 테스트**:
- [ ] TC-04: 레거시 [ts] 정규화 통과
- [ ] TC-05: 레거시 [ds] 정규화 통과
- [ ] TC-06: WBS 파싱 통과

**폴백 테스트**:
- [ ] TC-07: workflows.json 없음 통과
- [ ] TC-08: workflows.json 형식 오류 통과
- [ ] TC-09: 부분 설정 누락 통과

### 5.3 사후 확인 체크리스트

- [ ] 모든 테스트 로그 저장
- [ ] 실패한 테스트 원인 분석
- [ ] WBS 파일 무결성 확인 (마크다운 구조)
- [ ] 테스트 환경 복구 (백업 파일 복원)
- [ ] 테스트 결과 보고서 작성 (`070-integration-test.md`)

---

## 6. 예상 이슈 및 대응

### 6.1 기술적 이슈

| 이슈 | 증상 | 대응 방안 |
|------|------|----------|
| CLI 명령어 찾기 실패 | `command not found` | `npx jjiban` → `node cli/index.js` 직접 실행 |
| WBS 파일 동시 쓰기 | 파일 락 에러 | 테스트 간 대기 시간 추가 (`sleep 1`) |
| 상태 코드 대소문자 | 파싱 실패 | 정규화 로직 대소문자 무시 추가 |
| JSON 파싱 에러 처리 | 프로그램 크래시 | try-catch 추가 및 폴백 로직 검증 |

### 6.2 프로세스 이슈

| 이슈 | 증상 | 대응 방안 |
|------|------|----------|
| 테스트 데이터 오염 | 이전 테스트 영향 | 각 테스트 전 초기화 스크립트 실행 |
| 설정 파일 미복구 | 다음 테스트 실패 | finally 블록에서 무조건 복구 |
| 로그 파일 누적 | 디스크 공간 부족 | 테스트 시작 시 로그 디렉토리 정리 |

---

## 7. 성능 기준

### 7.1 실행 시간 기준

| 테스트 | 예상 시간 | 최대 시간 |
|--------|----------|----------|
| TC-01 ~ TC-03 | 각 5초 | 각 10초 |
| TC-04 ~ TC-06 | 각 3초 | 각 7초 |
| TC-07 ~ TC-09 | 각 5초 | 각 10초 |
| 전체 테스트 | 40초 | 90초 |

### 7.2 성능 모니터링

```bash
# 각 테스트 스크립트 시작 시
START_TIME=$(date +%s)

# ... 테스트 실행 ...

# 테스트 종료 시
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "실행 시간: ${DURATION}초"

if [ $DURATION -gt 10 ]; then
    echo "⚠ 성능 기준 초과"
fi
```

---

## 8. 다음 단계

### 8.1 구현 단계 (TSK-05-04 [im])

1. 테스트 프로젝트 초기화 스크립트 작성
2. 개별 테스트 스크립트 작성 (TC-01 ~ TC-09)
3. 통합 실행 스크립트 작성
4. 테스트 실행 및 결과 수집

### 8.2 검증 단계 (TSK-05-04 [vf])

1. 모든 테스트 통과 확인
2. 테스트 커버리지 분석
3. 실패 케이스 원인 분석 및 수정
4. 최종 테스트 결과 보고서 작성 (`070-integration-test.md`)

### 8.3 완료 단계 (TSK-05-04 [xx])

1. WP-05 전체 완료 확인
2. 문서 정리 및 아카이빙
3. 다음 WP 계획 수립

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2025-12-17 | 상세설계 작성 | Quality Engineer |
