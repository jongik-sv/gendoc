# 설계 리뷰 결과: TSK-02-03-03

## 리뷰 메타데이터
| 항목 | 내용 |
|------|------|
| Task ID | TSK-02-03-03 |
| 리뷰 대상 | 상세설계 (020-detail-design.md) |
| 리뷰어 | Claude (refactoring-expert) |
| 리뷰 일시 | 2025-12-14 |
| 리뷰 회차 | 1차 |

## 1. 리뷰 요약
- 총 지적사항: 11건
- 심각도별: Critical 1, Major 4, Minor 4, Info 2
- 권장사항: 5건
- 전체 평가: **조건부 승인 (Critical 1건 필수 수정 후 구현 가능)**

---

## 2. 지적사항 상세

### [DR-001] 경로 하드코딩 위험
- 심각도: **Critical**
- 위치: 섹션 5.3 (외부 의존성), 섹션 6.3 (파일 저장 위치)
- 문제: `.jjiban/projects/{id}/` 경로가 하드코딩되어 있으며, TSK-02-03-02에서 구현한 경로 관리 패턴 (paths.ts)을 활용하지 않음
- 권장 조치:
  1. `server/utils/projects/paths.ts` 모듈 신규 생성
  2. `getProjectBasePath()`, `getProjectDir(projectId)`, `getProjectFilePath(projectId, fileName)` 함수 구현
  3. `nuxt.config.ts`의 `jjibanBasePath` runtimeConfig 활용
  4. 모든 서비스에서 경로 생성 시 paths.ts 사용
- 관련 원칙: DIP (의존성 역전), OCP (확장에 열려있고 수정에 닫혀있음)
- 참조: TSK-02-03-02 상세설계 섹션 5.1.1 (설정 경로 관리 패턴)

**개선 예시**:
```typescript
// server/utils/projects/paths.ts
import { join } from 'path';

export function getProjectsBasePath(): string {
  const config = useRuntimeConfig();
  return join(config.jjibanBasePath || process.cwd(), '.jjiban', 'projects');
}

export function getProjectDir(projectId: string): string {
  return join(getProjectsBasePath(), projectId);
}

export function getProjectFilePath(projectId: string, fileName: 'project.json' | 'team.json'): string {
  return join(getProjectDir(projectId), fileName);
}
```

---

### [DR-002] 서비스 간 결합도 증가 우려
- 심각도: **Major**
- 위치: 섹션 5.1 (모듈 역할 및 책임), 섹션 5.3 (외부 의존성)
- 문제: ProjectService가 ProjectsListService에 직접 의존하여 단일 책임 원칙 위반 가능성
- 권장 조치:
  1. 프로젝트 생성 시 목록 업데이트 로직을 별도 Facade 패턴으로 분리
  2. `ProjectFacadeService` 생성하여 ProjectService와 ProjectsListService 조율
  3. 또는 이벤트 기반 아키텍처 고려 (프로젝트 생성 이벤트 발행 → 목록 업데이트 구독)
- 관련 원칙: SRP (단일 책임), ISP (인터페이스 분리)

**개선 예시**:
```typescript
// server/utils/projects/projectFacade.ts
export async function createProjectWithRegistration(data: CreateProjectDto): Promise<ProjectDetail> {
  // 1. 프로젝트 생성 (ProjectService)
  const project = await ProjectService.createProject(data);

  // 2. 목록 등록 (ProjectsListService)
  await ProjectsListService.addProject({
    id: project.id,
    name: project.name,
    path: project.id,
    status: project.status,
    wbsDepth: data.wbsDepth || 4,
    createdAt: project.createdAt
  });

  // 3. 팀 정보 조회 (TeamService)
  const team = await TeamService.getTeam(project.id);

  return { project, team };
}
```

---

### [DR-003] 중복 검증 로직 분산
- 심각도: **Major**
- 위치: 섹션 7.4 (POST /api/projects), 섹션 10 (비즈니스 규칙 구현)
- 문제: 중복 ID 검증이 API Handler와 ProjectService에 중복 가능성
- 권장 조치:
  1. 검증 로직을 `server/utils/validators/projectValidators.ts`로 집중
  2. Zod 스키마로 입력 검증 표준화
  3. 비즈니스 검증(중복 체크)는 서비스 계층에서만 수행
- 관련 원칙: DRY (Don't Repeat Yourself), SRP

**개선 예시**:
```typescript
// server/utils/validators/projectValidators.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, '프로젝트 ID는 영소문자, 숫자, 하이픈만 허용됩니다'),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  wbsDepth: z.enum([3, 4]).default(4),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
```

---

### [DR-004] 에러 처리 일관성 부족
- 심각도: **Major**
- 위치: 섹션 11 (오류/예외 처리)
- 문제: TSK-02-03-02에서 추가한 timestamp 필드가 에러 응답 명세에 누락됨
- 권장 조치:
  1. 섹션 11.1의 모든 에러 응답에 timestamp 필드 추가
  2. 표준 에러 응답 헬퍼 함수 구현 (`createStandardError`)
  3. TSK-02-03-02의 에러 처리 패턴 일관성 유지
- 관련 원칙: 일관성 (Consistency)
- 참조: TSK-02-03-02 상세설계 섹션 10.2 (에러 응답 형식)

**개선 예시**:
```typescript
// server/utils/errors/standardError.ts
export function createStandardError(
  statusCode: number,
  statusMessage: string,
  message: string
) {
  return createError({
    statusCode,
    statusMessage,
    message,
    data: {
      timestamp: new Date().toISOString()
    }
  });
}
```

---

### [DR-005] ProjectsListService 책임 과다
- 심각도: **Major**
- 위치: 섹션 5.1 (모듈 역할 및 책임)
- 문제: ProjectsListService가 projects.json CRUD와 중복 검증, defaultProject 관리까지 담당하여 SRP 위반
- 권장 조치:
  1. 중복 검증은 별도 Validator로 분리
  2. defaultProject 관리는 별도 메서드로 명확히 구분
  3. 또는 ProjectsListService를 ProjectsListReader와 ProjectsListWriter로 분리 고려
- 관련 원칙: SRP (단일 책임)

---

### [DR-006] 파일 시스템 동시성 고려 부족
- 심각도: **Minor**
- 위치: 섹션 4.3 (제약), 섹션 8.1 (프로젝트 생성 프로세스)
- 문제: 동시 쓰기 시나리오(여러 사용자가 동시에 프로젝트 생성) 고려 부족
- 권장 조치:
  1. 제약사항에 "단일 사용자 환경 가정" 명시 (이미 존재하지만 강조 필요)
  2. 향후 확장 시 파일 락 메커니즘 또는 DB 마이그레이션 필요성 문서화
  3. 중복 ID 생성 시 Race Condition 가능성 주석 추가
- 관련 원칙: 확장성 (Scalability)

---

### [DR-007] 캐싱 전략 부재
- 심각도: **Minor**
- 위치: 섹션 5.1 (모듈 구조)
- 문제: TSK-02-03-02는 settings 캐싱을 구현했으나, 이 Task는 캐싱 전략이 없음
- 권장 조치:
  1. projects.json은 변경 빈도가 낮으므로 캐싱 고려
  2. 또는 캐싱 미구현 이유를 설계 문서에 명시 (예: 파일 크기 작음, 조회 빈도 낮음)
  3. 향후 성능 이슈 발생 시 TSK-02-03-02의 cache.ts 패턴 적용 가능
- 관련 원칙: Performance Optimization

---

### [DR-008] 입력 검증 스키마 구체성 부족
- 심각도: **Minor**
- 위치: 섹션 7.4, 7.5 (API 상세)
- 문제: description 필드의 "최대 1000자" 제약이 API 명세에는 있지만 섹션 6.1 엔티티 정의와 불일치
- 권장 조치:
  1. 섹션 6.1의 ProjectConfig 엔티티에 description 최대 길이 명시
  2. Zod 스키마에 정확한 검증 규칙 반영
  3. 클라이언트와 서버 검증 규칙 일치 확인
- 관련 원칙: Data Integrity

---

### [DR-009] 보안 취약점: 경로 탐색 공격 미대응
- 심각도: **Minor**
- 위치: 섹션 7 (인터페이스 계약)
- 문제: 프로젝트 ID로 `../` 같은 상위 디렉토리 탐색 시도 방지 로직 부재
- 권장 조치:
  1. 프로젝트 ID 검증 정규식 `/^[a-z0-9-]+$/`을 엄격히 적용 (이미 BR-001에 존재하지만 보안 관점 강조 필요)
  2. 파일 경로 생성 전 path.normalize() 및 경로 검증 추가
  3. 보안 테스트 케이스에 경로 탐색 공격 시나리오 추가
- 관련 원칙: Security by Design

**개선 예시**:
```typescript
// server/utils/projects/paths.ts
export function validateProjectId(id: string): void {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw createStandardError(400, 'INVALID_PROJECT_ID', '프로젝트 ID는 영소문자, 숫자, 하이픈만 허용됩니다');
  }

  // 경로 탐색 방지
  const normalized = path.normalize(id);
  if (normalized !== id || normalized.includes('..')) {
    throw createStandardError(400, 'INVALID_PROJECT_ID', '잘못된 프로젝트 ID 형식입니다');
  }
}
```

---

### [DR-010] 테스트 명세 누락 항목
- 심각도: **Info**
- 위치: 테스트 명세 (026-test-specification.md)
- 문제: 동시성 테스트, 경로 탐색 공격 테스트 케이스 부재
- 권장 조치:
  1. UT-011: 경로 탐색 공격 입력 시 검증 실패 테스트
  2. E2E-006: 중복 생성 요청 동시 처리 테스트 (선택사항)
  3. TC-009: 보안 테스트 시나리오 추가
- 관련 원칙: Test Coverage

---

### [DR-011] 모듈 구조 파일 누락
- 심각도: **Info**
- 위치: 섹션 5.2 (모듈 구조도)
- 문제: `server/utils/validators/projectValidators.ts`가 모듈 구조도에 누락
- 권장 조치:
  1. 섹션 5.2에 validators 폴더 추가
  2. 섹션 5.3 (외부 의존성)에 Zod 라이브러리 추가
- 관련 원칙: Documentation Completeness

---

## 3. 긍정적 평가

### 3.1 설계 품질
- **추적성 매트릭스 완벽**: 요구사항-설계-테스트 간 100% 추적 가능
- **일관성 검증 통과**: PRD, 기본설계, TRD와 완벽히 정합
- **API 설계 명확**: RESTful 규칙 준수, 엔드포인트 체계적
- **데이터 모델 명확**: ERD와 필드 정의가 상세하고 일관됨

### 3.2 문서 품질
- **시퀀스 다이어그램 우수**: 프로젝트 생성 및 조회 흐름이 명확
- **테스트 명세 상세**: 단위/E2E/매뉴얼 테스트 케이스 구체적
- **비즈니스 규칙 명확**: BR-001~BR-005가 구현 방법과 함께 명시
- **에러 처리 체계적**: 예상 오류 상황과 복구 전략 정의

### 3.3 아키텍처 준수
- **Server Routes 패턴 준수**: Nuxt 3 표준 아키텍처 준수
- **레이어 분리 양호**: API Handler - Service - FileSystem 계층 구분 명확
- **타입 안전성**: TypeScript 타입 정의 체계적

---

## 4. 권장사항 (선택 구현)

### [R-001] DTO 명시적 정의
- 설명: API 요청/응답 DTO를 별도 타입으로 명시적 정의
- 목적: API 계약 명확화, 클라이언트 타입 생성 용이
- 구현 위치: `types/api/projects.ts`

### [R-002] 프로젝트 생성 트랜잭션
- 설명: 프로젝트 생성 중 오류 발생 시 롤백 메커니즘
- 목적: 데이터 일관성 보장
- 구현 방법: try-catch 블록에서 생성된 폴더/파일 삭제

### [R-003] 감사 로그
- 설명: 프로젝트 생성/수정 이력 로깅
- 목적: 추적성 및 디버깅 용이
- 구현 방법: Winston 또는 Pino 로거 사용

### [R-004] OpenAPI 문서 자동 생성
- 설명: API 명세를 OpenAPI 3.0 형식으로 자동 생성
- 목적: API 문서 자동화, Swagger UI 제공
- 구현 도구: Nuxt OpenAPI 모듈

### [R-005] 캐시 무효화 전략
- 설명: 프로젝트 생성/수정 시 projects.json 캐시 무효화
- 목적: 데이터 일관성
- 구현 조건: 향후 캐싱 도입 시

---

## 5. 결론 및 권장사항

### 5.1 전체 평가
이 설계는 전반적으로 **잘 구성되어 있으며**, 요구사항 추적성과 문서화 품질이 우수합니다. 하지만 **Critical 1건**과 **Major 4건**의 지적사항이 있어 **조건부 승인**을 권고합니다.

### 5.2 필수 수정 사항 (구현 전 완료)
1. **[DR-001] 경로 하드코딩 제거** (Critical)
   - paths.ts 모듈 생성 및 runtimeConfig 활용
   - 예상 수정 시간: 2시간

2. **[DR-004] 에러 처리 일관성 확보** (Major)
   - timestamp 필드 추가, 표준 에러 헬퍼 구현
   - 예상 수정 시간: 1시간

### 5.3 권장 수정 사항 (구현 중 반영)
3. **[DR-002] 서비스 결합도 개선** (Major)
   - Facade 패턴 도입 또는 책임 명확화
   - 예상 수정 시간: 3시간

4. **[DR-003] 검증 로직 집중화** (Major)
   - Zod 스키마 구현, validators 모듈 생성
   - 예상 수정 시간: 2시간

5. **[DR-009] 경로 탐색 공격 방어** (Minor, 보안)
   - 경로 검증 로직 추가
   - 예상 수정 시간: 1시간

### 5.4 향후 개선 사항 (1차 릴리스 후)
- **[DR-007] 캐싱 전략 도입** (성능 모니터링 후 결정)
- **[R-002] 트랜잭션 롤백** (데이터 무결성 강화)
- **[R-003] 감사 로그** (운영 편의성)

### 5.5 다음 단계
1. **즉시 조치**: [DR-001], [DR-004] Critical/Major 이슈 해결
2. **설계 문서 업데이트**: 수정 사항 반영하여 020-detail-design.md v2 작성
3. **2차 리뷰**: 수정 완료 후 간단한 검증 리뷰
4. **구현 진행**: `/wf:build` 명령어로 구현 시작

### 5.6 리스크 평가
| 리스크 | 영향도 | 완화 방안 |
|--------|--------|----------|
| 경로 하드코딩으로 인한 환경 이식성 문제 | High | [DR-001] 필수 수정 |
| 파일 시스템 동시성 이슈 | Medium | 단일 사용자 환경 가정 명시, 향후 DB 마이그레이션 고려 |
| 보안 취약점 (경로 탐색) | Medium | [DR-009] 검증 로직 추가 |
| 서비스 결합도로 인한 유지보수 어려움 | Low | [DR-002] Facade 패턴 도입 |

---

## 6. 체크리스트

### 6.1 SOLID 원칙 준수
- [ ] **SRP**: ProjectsListService 책임 과다 ([DR-005])
- [x] **OCP**: 확장 가능한 구조 (새 설정 타입 추가 용이)
- [x] **LSP**: 인터페이스 일관성 준수
- [x] **ISP**: 인터페이스 적절히 분리
- [ ] **DIP**: 경로 하드코딩으로 인한 위반 ([DR-001])

### 6.2 기술 부채 식별
- [ ] 경로 하드코딩 (Critical)
- [ ] 캐싱 전략 부재 (Minor)
- [ ] 동시성 미고려 (Minor)

### 6.3 유지보수성
- [x] 명확한 모듈 구조
- [ ] 검증 로직 분산 ([DR-003])
- [x] 명명 규칙 일관성

### 6.4 보안 취약점
- [ ] 경로 탐색 공격 방어 미흡 ([DR-009])
- [x] 입력 검증 규칙 정의 (BR-001)
- [x] 에러 메시지 적절 (민감 정보 노출 없음)

### 6.5 상위 문서 일관성
- [x] PRD 요구사항 100% 반영
- [x] 기본설계 정합성 통과
- [x] TRD 기술 스택 준수
- [ ] TSK-02-03-02 패턴 일관성 ([DR-001], [DR-004])

---

**리뷰 완료**

이 설계는 필수 수정사항([DR-001], [DR-004]) 반영 후 구현 진행을 권고합니다. 전반적인 설계 품질은 우수하며, 지적사항들은 대부분 구현 중 반영 가능한 수준입니다.

---

<!--
author: Claude (refactoring-expert)
Created: 2025-12-14
Task: TSK-02-03-03 설계 리뷰 1차
Review Focus: SOLID, Technical Debt, Maintainability, Security, Consistency
-->
