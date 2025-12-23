# 구현 보고서: Nuxt 3 프로젝트 초기화

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-01 |
| Category | infrastructure |
| 구현 상태 | [im] 구현 |
| 참조 설계서 | 010-tech-design.md |
| 구현일 | 2025-12-13 |

---

## 1. 구현 개요

### 1.1 목적

Nuxt 3 프로젝트를 초기화하여 jjiban 프로젝트의 기반 환경을 구축합니다.

### 1.2 구현 범위

- Nuxt 3 프로젝트 구조 생성
- TypeScript 기반 개발 환경 설정
- Standalone 모드 설정 (nitro preset: node-server)
- **소스 코드 분리** (`srcDir: 'app'` 설정)
- 기본 빌드 테스트 완료

### 1.3 기술 스택

| 항목 | 버전 | 비고 |
|------|------|------|
| Nuxt | 3.20.2 | 설치된 버전 |
| Nitro | 2.12.9 | Standalone 서버 |
| Vite | 7.2.7 | 빌드 도구 |
| Vue | 3.5.25 | 프레임워크 |
| TypeScript | 5.6.x | 타입 시스템 |

---

## 2. 구현 결과

### 2.1 생성된 파일

| 파일 | 설명 |
|------|------|
| `package.json` | 프로젝트 메타데이터, 스크립트, 의존성 정의 |
| `nuxt.config.ts` | Nuxt 설정 (srcDir, Standalone 모드, TypeScript) |
| `tsconfig.json` | TypeScript 설정 (Nuxt 확장) |
| `app/app.vue` | 루트 Vue 컴포넌트 |
| `app/pages/index.vue` | 기본 인덱스 페이지 |

### 2.2 package.json 설정

```json
{
  "name": "jjiban",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 2.3 nuxt.config.ts 설정

```typescript
export default defineNuxtConfig({
  // 소스 코드 디렉토리 (개발 코드 분리)
  srcDir: 'app',

  nitro: {
    preset: 'node-server'  // Standalone 모드
  },
  typescript: {
    strict: true,
    typeCheck: false  // 다른 Task 완료 후 활성화 예정
  },
  ssr: true,
  devServer: {
    port: 3000
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
```

### 2.4 빌드 결과

| 항목 | 결과 |
|------|------|
| Client 빌드 | 성공 (1.33초) |
| Server 빌드 | 성공 (0.41초) |
| 총 빌드 크기 | 1.86 MB (gzip: 458 KB) |
| 출력 경로 | `.output/` |
| 실행 방법 | `node .output/server/index.mjs` |

---

## 3. 검증 결과

### 3.1 검증 체크리스트

- [x] `npm install` 성공 (618개 패키지)
- [x] `npm run build` 성공
- [x] `.output/` 디렉토리 생성 확인
- [x] nitro preset: `node-server` 적용 확인
- [x] TypeScript 설정 적용 확인

### 3.2 빌드 출력

```
Nuxt 3.20.2 (with Nitro 2.12.9, Vite 7.2.7 and Vue 3.5.25)
Nitro preset: node-server
✓ Client built in 1345ms
✓ Server built in 411ms
✔ Build complete!
```

---

## 4. 기술적 결정사항

### 4.1 TypeScript 타입 체크 비활성화

**결정**: `typescript.typeCheck: false`

**사유**:
- 현재 Task 범위는 Nuxt 3 초기화만 포함
- PrimeVue, Pinia 등 다른 Task 의존성 완료 후 활성화 예정
- TSK-01-01-02 (PrimeVue 설정) 완료 시 재활성화

### 4.2 소스 코드 디렉토리 분리

**결정**: `srcDir: 'app'` 설정으로 소스 코드 분리

**사유**:
- 개발 코드와 프로젝트 관리 데이터(`.jjiban/`) 명확한 분리
- 루트 디렉토리 정리 (설정 파일만 루트에 배치)
- 확장성 확보 (후속 Task에서 components, composables 등 추가 예정)

**구조**:
```
jjiban/
├── app/           # srcDir - 개발 코드
├── .jjiban/       # 프로젝트 관리 데이터
├── .claude/       # Claude 설정
└── [설정파일들]    # nuxt.config.ts, package.json 등
```

### 4.3 app.vue 단순화

**결정**: 최소한의 app.vue 구조 사용

**사유**:
- 기존 파일에 PrimeVue, Pinia 의존성 존재
- 해당 Task 완료 후 복원 예정

---

## 5. 알려진 이슈

### 5.1 의존성 이슈

| 이슈 | 영향 | 해결 방안 |
|------|------|----------|
| TypeScript 타입 체크 비활성화 | 타입 오류 감지 불가 | TSK-01-01-02 완료 후 활성화 |
| DEP0155 경고 | 없음 (경고만) | Node.js 향후 버전에서 수정 예정 |

### 5.2 제약사항

- TypeScript 빌드 타입 체크는 후속 Task 완료 후 활성화 필요
- 전체 레이아웃은 TSK-01-02-01 (AppLayout) Task에서 구현

---

## 6. 다음 단계

| Task ID | 내용 | 상태 |
|---------|------|------|
| TSK-01-01-02 | PrimeVue 4.x + TailwindCSS 설정 | 대기 |
| TSK-01-01-03 | Pinia 상태 관리 설정 | 대기 |
| TSK-01-01-04 | 프로젝트 디렉토리 구조 설정 | 대기 |

---

## 7. 참고 자료

### 7.1 관련 문서

- 기술설계서: `.jjiban/projects/jjiban/tasks/TSK-01-01-01/010-tech-design.md`
- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 3: 기술 스택)

### 7.2 소스 파일 위치

```
jjiban/
├── package.json           # 프로젝트 설정
├── nuxt.config.ts         # Nuxt 설정 (srcDir: 'app')
├── tsconfig.json          # TypeScript 설정
├── app/                   # 소스 코드 디렉토리
│   ├── app.vue            # 루트 컴포넌트
│   └── pages/
│       └── index.vue      # 인덱스 페이지
└── .jjiban/               # 프로젝트 관리 데이터
```

### 7.3 빌드 결과 위치

```
.output/
├── public/
└── server/
    └── index.mjs  # Standalone 서버 실행 파일
```
