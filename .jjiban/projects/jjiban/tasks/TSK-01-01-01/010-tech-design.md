# 기술설계: Nuxt 3 프로젝트 초기화

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01-01 |
| Category | infrastructure |
| 상태 | [ds] 설계 |
| 상위 Activity | ACT-01-01 (Project Setup) |
| 상위 Work Package | WP-01 (Platform Infrastructure) |
| PRD 참조 | PRD 3 (기술 스택) |
| 작성일 | 2025-12-13 |

---

## 1. 목적

### 1.1 배경

jjiban 프로젝트는 로컬 환경에서 실행되는 파일 기반 프로젝트 관리 도구입니다. `npx jjiban`으로 즉시 실행 가능해야 하며, 이를 위해 Nuxt 3 Standalone 모드가 필요합니다.

### 1.2 목표

- Nuxt 3 프로젝트 구조 생성
- TypeScript 기반 개발 환경 설정
- Standalone 모드 설정 (nitro preset)으로 `npx` 실행 가능

### 1.3 제외 범위

| 제외 항목 | 담당 Task |
|----------|----------|
| PrimeVue + TailwindCSS 설정 | TSK-01-01-02 |
| Pinia 상태 관리 설정 | TSK-01-01-03 |
| 디렉토리 구조 상세 설정 | TSK-01-01-04 |

---

## 2. 현재 상태

### 2.1 현재 프로젝트 구조

현재 프로젝트는 문서(`.jjiban/`, `.claude/`) 위주로 구성되어 있으며, 실제 Nuxt 애플리케이션 코드는 없는 상태입니다.

### 2.2 요구사항

- Node.js 20.x 런타임
- Nuxt 3 최신 버전
- TypeScript 필수
- Standalone 배포 (단일 실행 파일)

---

## 3. 목표 상태

### 3.1 목표 디렉토리 구조

```
jjiban/
├── .jjiban/                    # 기존 프로젝트 관리 데이터
├── .nuxt/                      # Nuxt 빌드 캐시 (gitignore)
├── .output/                    # Standalone 빌드 결과 (gitignore)
├── app.vue                     # 루트 Vue 컴포넌트
├── nuxt.config.ts              # Nuxt 설정
├── tsconfig.json               # TypeScript 설정
├── package.json                # 프로젝트 메타데이터
└── README.md                   # 프로젝트 설명
```

### 3.2 핵심 설정

**nuxt.config.ts**

```typescript
export default defineNuxtConfig({
  // Standalone 모드 설정
  nitro: {
    preset: 'node-server'
  },

  // TypeScript 엄격 모드
  typescript: {
    strict: true,
    typeCheck: true
  },

  // SSR 활성화 (기본값)
  ssr: true,

  // 개발 서버 설정
  devServer: {
    port: 3000
  },

  // 호환성 날짜
  compatibilityDate: '2024-11-01'
})
```

**package.json**

```json
{
  "name": "jjiban",
  "version": "0.1.0",
  "description": "AI 기반 프로젝트 관리 도구",
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## 4. 구현 계획

### 4.1 실행 단계

| 단계 | 작업 | 명령어/파일 |
|------|------|------------|
| 1 | Nuxt 프로젝트 초기화 | `npx nuxi init .` 또는 수동 생성 |
| 2 | package.json 설정 | 의존성 및 스크립트 설정 |
| 3 | nuxt.config.ts 작성 | Standalone preset 설정 |
| 4 | TypeScript 설정 | tsconfig.json 설정 |
| 5 | 기본 app.vue 생성 | 루트 컴포넌트 |
| 6 | 의존성 설치 | `npm install` |
| 7 | 빌드 테스트 | `npm run build` |

### 4.2 주요 의존성

```json
{
  "devDependencies": {
    "nuxt": "^3.14.0",
    "typescript": "^5.6.0",
    "vue": "^3.5.0",
    "vue-router": "^4.4.0"
  }
}
```

### 4.3 nitro preset 옵션

Standalone 실행을 위한 preset 선택:

| Preset | 설명 | 적합성 |
|--------|------|--------|
| `node-server` | Node.js 서버 (권장) | 로컬 실행에 최적 |
| `node-cluster` | 멀티 프로세스 | 과도한 설정 |
| `node` | 기본 Node | node-server와 동일 |

**선택**: `node-server` - npx 실행에 가장 적합

---

## 5. 검증 기준

### 5.1 성공 기준

- [ ] `npm run dev` 실행 시 http://localhost:3000 접속 가능
- [ ] `npm run build` 성공
- [ ] `.output/` 디렉토리에 standalone 빌드 결과 생성
- [ ] TypeScript 컴파일 에러 없음

### 5.2 검증 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과 실행
node .output/server/index.mjs

# TypeScript 검사
npx nuxi typecheck
```

---

## 6. 위험 요소 및 대응

| 위험 | 영향 | 대응 방안 |
|------|------|----------|
| Nuxt 버전 호환성 | 빌드 실패 | 안정 버전 (3.14.x) 사용 |
| TypeScript 엄격 모드 | 초기 에러 증가 | 점진적 strict 적용 |
| Standalone 빌드 크기 | 배포 용량 | tree-shaking 최적화 |

---

## 7. 다음 단계

Task 완료 후 다음 Task 진행:

- **TSK-01-01-02**: PrimeVue 4.x + TailwindCSS 설정
- **TSK-01-01-03**: Pinia 상태 관리 설정
- **TSK-01-01-04**: 프로젝트 디렉토리 구조 설정

---

## 8. 참조 문서

- PRD: `.jjiban/projects/jjiban/prd.md` (섹션 3: 기술 스택)
- Nuxt 공식 문서: https://nuxt.com/docs/getting-started/installation
- Nitro 배포 가이드: https://nitro.unjs.io/deploy/node
