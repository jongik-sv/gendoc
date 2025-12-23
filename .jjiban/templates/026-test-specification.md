# 테스트 명세서 (026-test-specification.md)

**Template Version:** 1.0.0 — **Last Updated:** 2025-12-10

> **목적**: 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 및 테스트 데이터 정의
>
> **참조**: 이 문서는 `020-detail-design.md`와 `025-traceability-matrix.md`와 함께 사용됩니다.
>
> **활용 단계**: `/wf:build`, `/wf:test` 단계에서 테스트 코드 생성 기준으로 사용

---

## 0. 문서 메타데이터

| 항목 | 내용 |
|------|------|
| Task ID | [Task-ID] |
| Task명 | [Task명] |
| 상세설계 참조 | `020-detail-design.md` |
| 추적성 매트릭스 참조 | `025-traceability-matrix.md` |
| 작성일 | [오늘 날짜] |
| 작성자 | [작성자] |

---

## 1. 테스트 전략 개요

### 1.1 테스트 범위

| 테스트 유형 | 범위 | 목표 커버리지 |
|------------|------|--------------|
| 단위 테스트 | Service, Controller, Utility | 80% 이상 |
| E2E 테스트 | 주요 사용자 시나리오 | 100% 시나리오 커버 |
| 매뉴얼 테스트 | UI/UX, 접근성, 반응형 | 전체 화면 |

### 1.2 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 프레임워크 (단위) | Vitest |
| 테스트 프레임워크 (E2E) | Playwright |
| 테스트 데이터베이스 | SQLite (테스트용) |
| 브라우저 | Chromium (기본) |
| 베이스 URL | `http://localhost:3000` |

---

## 2. 단위 테스트 시나리오

### 2.1 테스트 케이스 목록

| 테스트 ID | 대상 | 시나리오 | 예상 결과 | 요구사항 |
|-----------|------|----------|----------|----------|
| UT-001 | Service.create | 정상 생성 | 생성된 객체 반환 | FR-001 |
| UT-002 | Service.create | 중복 이름 | ConflictException 발생 | BR-001 |
| UT-003 | Service.findAll | 목록 조회 (페이지네이션) | 페이지 데이터 반환 | FR-002 |
| UT-004 | Service.findOne | 단건 조회 | 객체 반환 | FR-003 |
| UT-005 | Service.update | 정상 수정 | 수정된 객체 반환 | FR-004 |
| UT-006 | Controller.delete | 권한 검증 | 권한 없으면 ForbiddenException | BR-002 |

### 2.2 테스트 케이스 상세

#### UT-001: Service.create 정상 생성

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/__tests__/[resource].service.spec.ts` |
| **테스트 블록** | `describe('[Resource]Service') → describe('create') → it('should create with valid data')` |
| **Mock 의존성** | - |
| **입력 데이터** | `{ name: '테스트', description: '설명' }` |
| **검증 포인트** | 반환 객체에 id, createdAt 포함 확인 |
| **커버리지 대상** | `create()` 메서드 정상 분기 |
| **관련 요구사항** | FR-001 |

#### UT-002: Service.create 중복 이름

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/__tests__/[resource].service.spec.ts` |
| **테스트 블록** | `describe('[Resource]Service') → describe('create') → it('should throw ConflictException for duplicate name')` |
| **Mock 의존성** | 기존 데이터 존재 상태 설정 |
| **입력 데이터** | `{ name: '기존이름' }` |
| **검증 포인트** | `ConflictException` 발생, 에러 코드 `DUPLICATE_NAME` |
| **커버리지 대상** | `create()` 메서드 중복 검증 분기 |
| **관련 요구사항** | BR-001 |

#### UT-003: Service.findAll 목록 조회

| 항목 | 내용 |
|------|------|
| **파일** | `server/utils/__tests__/[resource].service.spec.ts` |
| **테스트 블록** | `describe('[Resource]Service') → describe('findAll') → it('should return paginated list')` |
| **Mock 의존성** | - |
| **입력 데이터** | `{ page: 1, limit: 10 }` |
| **검증 포인트** | 페이지네이션 메타 정보 포함, items 배열 반환 |
| **커버리지 대상** | `findAll()` 메서드 |
| **관련 요구사항** | FR-002 |

---

## 3. E2E 테스트 시나리오

### 3.1 테스트 케이스 목록

| 테스트 ID | 시나리오 | 사전조건 | 실행 단계 | 예상 결과 | 요구사항 |
|-----------|----------|----------|----------|----------|----------|
| E2E-001 | 목록 조회 | 로그인 상태 | 1. 페이지 접속 | 목록 표시됨 | FR-001 |
| E2E-002 | 생성 성공 | 로그인 상태 | 1. 생성 클릭 2. 입력 3. 저장 | 목록에 추가됨 | FR-003 |
| E2E-003 | 중복 이름 오류 | 기존 항목 존재 | 동일 이름 생성 시도 | 에러 메시지 | BR-001 |
| E2E-004 | 권한 없는 삭제 | 권한 없는 사용자 | 삭제 시도 | 권한 오류 표시 | BR-002 |

### 3.2 테스트 케이스 상세

#### E2E-001: 목록 조회

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/[resource].spec.ts` |
| **테스트명** | `test('사용자가 [resource] 목록을 조회할 수 있다')` |
| **사전조건** | 로그인 (fixture 사용) |
| **data-testid 셀렉터** | |
| - 페이지 컨테이너 | `[data-testid="[resource]-list-page"]` |
| - 목록 테이블/카드 | `[data-testid="[resource]-list"]` |
| - 목록 아이템 | `[data-testid="[resource]-item"]` |
| **API 확인** | `GET /api/[resources]` → 200 |
| **검증 포인트** | `expect(page.locator('[data-testid="[resource]-list"]')).toBeVisible()` |
| **스크린샷** | `e2e-001-list.png` |
| **관련 요구사항** | FR-001 |

#### E2E-002: 생성 성공

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/[resource].spec.ts` |
| **테스트명** | `test('사용자가 새 [resource]를 생성할 수 있다')` |
| **사전조건** | 로그인 (fixture 사용) |
| **data-testid 셀렉터** | |
| - 생성 버튼 | `[data-testid="create-[resource]-btn"]` |
| - 이름 입력 | `[data-testid="[resource]-name-input"]` |
| - 설명 입력 | `[data-testid="[resource]-description-input"]` |
| - 저장 버튼 | `[data-testid="save-[resource]-btn"]` |
| **실행 단계** | |
| 1 | `await page.click('[data-testid="create-[resource]-btn"]')` |
| 2 | `await page.fill('[data-testid="[resource]-name-input"]', '새 항목')` |
| 3 | `await page.fill('[data-testid="[resource]-description-input"]', '설명')` |
| 4 | `await page.click('[data-testid="save-[resource]-btn"]')` |
| **API 확인** | `POST /api/[resources]` → 201 |
| **검증 포인트** | `expect(page.locator('[data-testid="[resource]-list"]')).toContainText('새 항목')` |
| **스크린샷** | `e2e-002-create-before.png`, `e2e-002-create-after.png` |
| **관련 요구사항** | FR-003 |

#### E2E-003: 중복 이름 오류

| 항목 | 내용 |
|------|------|
| **파일** | `tests/e2e/[resource].spec.ts` |
| **테스트명** | `test('중복 이름 입력 시 에러 메시지가 표시된다')` |
| **사전조건** | 기존 항목 '테스트' 존재 (시드 데이터) |
| **data-testid 셀렉터** | |
| - 에러 메시지 | `[data-testid="error-message"]` |
| **API 확인** | `POST /api/[resources]` → 409 |
| **검증 포인트** | `expect(page.locator('[data-testid="error-message"]')).toContainText('이미 사용 중')` |
| **스크린샷** | `e2e-003-duplicate-error.png` |
| **관련 요구사항** | BR-001 |

---

## 4. UI 테스트케이스 (매뉴얼)

### 4.1 테스트 케이스 목록

| TC-ID | 테스트 항목 | 사전조건 | 테스트 단계 | 예상 결과 | 우선순위 | 요구사항 |
|-------|-----------|---------|-----------|----------|---------|----------|
| TC-001 | 목록 조회 | 로그인 | 1. 페이지 접속 | 목록 표시됨 | High | FR-001 |
| TC-002 | 검색 기능 | 목록 존재 | 1. 검색어 입력 | 필터링됨 | Medium | FR-001 |
| TC-003 | 반응형 확인 | - | 1. 브라우저 크기 조절 | 레이아웃 적응 | Medium | - |
| TC-004 | 접근성 확인 | - | 1. 키보드만으로 탐색 | 모든 기능 접근 가능 | Medium | - |
| TC-005 | 로딩 상태 | - | 1. 느린 네트워크 시뮬레이션 | 로딩 인디케이터 표시 | Low | - |
| TC-006 | 에러 상태 | - | 1. API 오류 발생 | 에러 메시지 표시 | Medium | - |

### 4.2 매뉴얼 테스트 상세

#### TC-001: 목록 조회

**테스트 목적**: 사용자가 [resource] 목록 페이지에 접근하여 데이터를 조회할 수 있는지 확인

**테스트 단계**:
1. 로그인 완료
2. 사이드바에서 [resource] 메뉴 클릭
3. 목록 페이지가 표시되는지 확인

**예상 결과**:
- 목록 테이블/카드가 표시됨
- 페이지네이션 컨트롤이 존재함
- 각 항목에 필요한 정보가 표시됨

**검증 기준**:
- [ ] 목록이 정상적으로 로드됨
- [ ] 빈 목록일 경우 Empty State 표시
- [ ] 페이지네이션 동작 확인

---

## 5. 테스트 데이터 (Fixture)

### 5.1 단위 테스트용 Mock 데이터

| 데이터 ID | 용도 | 값 |
|-----------|------|-----|
| MOCK-USER-01 | 일반 사용자 | `{ id: 'user-1', email: 'user@test.com', role: 'USER' }` |
| MOCK-USER-ADMIN | 관리자 사용자 | `{ id: 'user-admin', email: 'admin@test.com', role: 'ADMIN' }` |
| MOCK-[RESOURCE]-01 | 정상 [resource] | `{ id: '[resource]-1', name: '테스트', status: 'ACTIVE' }` |
| MOCK-[RESOURCE]-02 | 아카이브된 [resource] | `{ id: '[resource]-2', name: '아카이브', status: 'ARCHIVED' }` |

### 5.2 E2E 테스트용 시드 데이터

| 시드 ID | 용도 | 생성 방법 | 포함 데이터 |
|---------|------|----------|------------|
| SEED-E2E-BASE | 기본 E2E 환경 | 자동 시드 | 사용자 2명, [resource] 5개 |
| SEED-E2E-EMPTY | 빈 환경 (목록 없음) | 자동 시드 | 사용자 1명 |
| SEED-E2E-DUPLICATE | 중복 테스트용 | 자동 시드 | '테스트' 이름의 [resource] 존재 |

### 5.3 테스트 계정

| 계정 ID | 이메일 | 비밀번호 | 역할 | 용도 |
|---------|--------|----------|------|------|
| TEST-USER | user@test.com | test1234 | USER | 일반 사용자 기능 테스트 |
| TEST-ADMIN | admin@test.com | test1234 | ADMIN | 관리자 기능 테스트 |

---

## 6. data-testid 목록

> 프론트엔드 컴포넌트에 적용할 `data-testid` 속성 정의

### 6.1 페이지별 셀렉터

#### [Resource] 목록 페이지

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `[resource]-list-page` | 페이지 컨테이너 | 페이지 로드 확인 |
| `[resource]-list` | 목록 컨테이너 | 목록 표시 확인 |
| `[resource]-item` | 목록 아이템 | 아이템 개수 확인 |
| `[resource]-item-{id}` | 특정 아이템 | 특정 아이템 선택 |
| `create-[resource]-btn` | 생성 버튼 | 생성 모달 열기 |
| `search-input` | 검색 입력 | 검색 기능 |
| `filter-dropdown` | 필터 드롭다운 | 필터링 기능 |
| `pagination` | 페이지네이션 | 페이지 이동 |

#### [Resource] 생성/수정 모달

| data-testid | 요소 | 용도 |
|-------------|------|------|
| `[resource]-modal` | 모달 컨테이너 | 모달 표시 확인 |
| `[resource]-name-input` | 이름 입력 | 이름 입력 |
| `[resource]-description-input` | 설명 입력 | 설명 입력 |
| `save-[resource]-btn` | 저장 버튼 | 저장 액션 |
| `cancel-[resource]-btn` | 취소 버튼 | 취소 액션 |
| `error-message` | 에러 메시지 | 에러 표시 확인 |

---

## 7. 테스트 커버리지 목표

### 7.1 단위 테스트 커버리지

| 대상 | 목표 | 최소 |
|------|------|------|
| Lines | 80% | 70% |
| Branches | 75% | 65% |
| Functions | 85% | 75% |
| Statements | 80% | 70% |

### 7.2 E2E 테스트 커버리지

| 구분 | 목표 |
|------|------|
| 주요 사용자 시나리오 | 100% |
| 기능 요구사항 (FR) | 100% 커버 |
| 비즈니스 규칙 (BR) | 100% 커버 |
| 에러 케이스 | 80% 커버 |

---

## 관련 문서

- 상세설계: `020-detail-design.md`
- 추적성 매트릭스: `025-traceability-matrix.md`
- 기본설계: `010-basic-design.md`

---

<!--
author: 장종익 
Template Version History:
- v1.0.0 (2025-12-10): 신규 생성
  - detail-design-template.md 섹션 13에서 분리
  - 단위 테스트, E2E 테스트, 매뉴얼 테스트 시나리오 포함
  - 테스트 데이터(Fixture) 정의 포함
  - data-testid 목록 섹션 추가
  - 테스트 커버리지 목표 섹션 추가
-->
