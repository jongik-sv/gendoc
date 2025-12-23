# TSK-01-01: 터미널 패키지 설치 및 설정 - 기술설계

## 문서 정보

| 항목 | 내용 |
|------|------|
| Task ID | TSK-01-01 |
| 문서 버전 | 1.0 |
| 작성일 | 2025-12-17 |
| 카테고리 | infrastructure |
| 상태 | 설계 [dd] |

---

## 1. 개요

### 1.1 목적

xterm.js와 node-pty를 설치하고 Nuxt 3 환경에서 웹 터미널 기능을 구현하기 위한 기반 패키지를 설정합니다.

### 1.2 범위

| 포함 | 제외 |
|------|------|
| xterm ^5.x 설치 | 터미널 UI 컴포넌트 구현 |
| @xterm/addon-fit 설치 | 서버 API 구현 |
| node-pty ^1.0.x 설치 | 워크플로우 통합 |
| Nuxt 3 nitro 통합 확인 | 세션 관리 로직 |

### 1.3 참조 문서

- PRD 7.1: 신규 패키지
- TRD 2.1: 신규 핵심 기술 스택
- TRD 4.2: TerminalService 클래스

---

## 2. 설치 패키지

### 2.1 클라이언트 패키지 (devDependencies)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| xterm | ^5.5.0 | 터미널 UI 렌더링 |
| @xterm/addon-fit | ^0.10.0 | 터미널 크기 자동 조정 |

### 2.2 서버 패키지 (dependencies)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| node-pty | ^1.0.0 | 의사 터미널 프로세스 관리 |

### 2.3 설치 명령어

```bash
# 클라이언트 패키지
npm install xterm @xterm/addon-fit

# 서버 패키지 (네이티브 모듈)
npm install node-pty
```

---

## 3. 호환성 확인

### 3.1 Node.js 버전

- 필수: Node.js 20.x LTS
- node-pty 빌드 요구사항: Python 3.x, C++ 빌드 도구

### 3.2 플랫폼별 요구사항

| 플랫폼 | 빌드 요구사항 |
|--------|-------------|
| Windows | Visual Studio Build Tools, Python 3.x |
| macOS | Xcode Command Line Tools |
| Linux | build-essential, python3 |

### 3.3 Nuxt 3 통합

- **Nitro 서버**: node-pty는 서버 사이드에서만 사용
- **SSR 호환**: xterm은 클라이언트 사이드에서만 렌더링 (ClientOnly)
- **번들링**: node-pty는 external로 설정하여 번들링 제외

---

## 4. Nuxt 설정

### 4.1 nuxt.config.ts 수정사항

```typescript
export default defineNuxtConfig({
  // 기존 설정 유지...

  nitro: {
    // node-pty를 external로 설정 (네이티브 모듈)
    externals: {
      external: ['node-pty']
    }
  },

  vite: {
    // xterm CSS를 최적화에서 제외
    optimizeDeps: {
      include: ['xterm', '@xterm/addon-fit']
    }
  }
})
```

### 4.2 TypeScript 타입 설정

```typescript
// types/terminal.d.ts
declare module 'node-pty' {
  // node-pty 타입 정의는 @types/node-pty에서 제공
}
```

---

## 5. 검증 테스트

### 5.1 패키지 로드 테스트

```typescript
// tests/setup/terminal-packages.test.ts

import { describe, it, expect } from 'vitest'

describe('터미널 패키지 설치 검증', () => {
  it('xterm 모듈 로드', async () => {
    const { Terminal } = await import('xterm')
    expect(Terminal).toBeDefined()
  })

  it('@xterm/addon-fit 모듈 로드', async () => {
    const { FitAddon } = await import('@xterm/addon-fit')
    expect(FitAddon).toBeDefined()
  })

  it('node-pty 모듈 로드 (서버 환경)', async () => {
    // 서버 환경에서만 테스트
    if (typeof window === 'undefined') {
      const pty = await import('node-pty')
      expect(pty.spawn).toBeDefined()
    }
  })
})
```

### 5.2 xterm 렌더링 테스트

```typescript
// 클라이언트에서 xterm 인스턴스 생성 테스트
describe('xterm 렌더링', () => {
  it('Terminal 인스턴스 생성', () => {
    const { Terminal } = require('xterm')
    const term = new Terminal({
      cols: 80,
      rows: 24,
      theme: {
        background: '#1e1e2e',
        foreground: '#cdd6f4'
      }
    })
    expect(term).toBeDefined()
    expect(term.cols).toBe(80)
    expect(term.rows).toBe(24)
  })
})
```

### 5.3 node-pty 프로세스 테스트

```typescript
// 서버에서 PTY 프로세스 생성 테스트
describe('node-pty 프로세스', () => {
  it('쉘 프로세스 spawn', () => {
    const pty = require('node-pty')
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: process.env
    })

    expect(ptyProcess.pid).toBeGreaterThan(0)
    ptyProcess.kill()
  })
})
```

---

## 6. 구현 체크리스트

### 6.1 설치 단계

- [ ] npm install xterm @xterm/addon-fit
- [ ] npm install node-pty
- [ ] package.json 의존성 확인

### 6.2 설정 단계

- [ ] nuxt.config.ts nitro.externals 추가
- [ ] vite.optimizeDeps 설정
- [ ] TypeScript 타입 파일 확인

### 6.3 검증 단계

- [ ] 패키지 import 테스트
- [ ] xterm Terminal 인스턴스 생성 테스트
- [ ] node-pty spawn 테스트
- [ ] Nuxt dev 서버 실행 확인
- [ ] Nuxt build 성공 확인

---

## 7. 예상 이슈 및 해결방안

### 7.1 node-pty 빌드 실패

**문제**: Windows에서 네이티브 모듈 빌드 실패

**해결**:
```bash
# Windows Build Tools 설치
npm install --global windows-build-tools

# 또는 Visual Studio Build Tools 설치 후
npm config set msvs_version 2022
npm rebuild node-pty
```

### 7.2 Nuxt 빌드 시 node-pty 오류

**문제**: 클라이언트 번들에 node-pty 포함 시도

**해결**: nuxt.config.ts에서 external 설정
```typescript
nitro: {
  externals: {
    external: ['node-pty']
  }
}
```

### 7.3 xterm CSS 누락

**문제**: 터미널 스타일이 적용되지 않음

**해결**: 컴포넌트에서 CSS import
```typescript
import 'xterm/css/xterm.css'
```

---

## 8. 다음 단계

- **TSK-01-02**: 터미널 UI 컴포넌트 (xterm.js 래퍼)
- **TSK-01-03**: 서버 터미널 세션 API (node-pty 통합)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-12-17 | 초안 작성 |
