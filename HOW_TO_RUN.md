# 실행 방법 (How to Run)

## ✅ 설치 완료

이미 완료된 단계:
- [x] `npm install` - 의존성 설치 완료
- [x] `.env` 파일 생성 완료
- [x] 규칙 검증 완료

## 🔑 필수: API 키 설정

**지금 바로 해야 할 것:**

1. https://console.anthropic.com/ 접속
2. API 키 생성 (무료 크레딧 있음)
3. `.env` 파일 열기
4. 다음 줄 수정:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-여기에실제키입력
   ```

## 🚀 실행 명령어

### 1. 기본 테스트 (API 연결 확인)

```bash
node src/index.js
```

성공하면 다음과 같은 출력:
```
=== PPT to HTML Agent ===

Initializing rule engine...
✓ Default rules loaded successfully
Initializing agent...
✓ Agent initialized with rules

✓ Agent ready!

Usage examples:
  - Convert PPT: node src/cli.js input.pptx -o output.html
  ...
```

### 2. PPT 변환 (기본)

PPT 파일이 있다면:

```bash
# 기본 변환
node src/cli.js convert your-file.pptx -o output.html

# 또는 짧게
node src/cli.js your-file.pptx -o output.html

# 또는 npm script 사용
npm run convert your-file.pptx -o output.html
```

### 3. PPT 변환 (커스텀 규칙 사용)

```bash
# 현재 열어둔 커스텀 규칙 사용
node src/cli.js convert your-file.pptx \
  -r src/rules/custom/example-custom-rules.yaml \
  -o output.html
```

### 4. AI 에이전트 모드

더 지능적인 변환 (추천):

```bash
node src/cli.js convert your-file.pptx \
  --use-agent \
  -o output.html
```

### 5. 규칙 편집 후 검증

커스텀 규칙을 수정한 후:

```bash
# 규칙 검증
node src/cli.js validate-rules src/rules/custom/example-custom-rules.yaml

# 병합된 규칙 확인
node src/cli.js export-rules \
  -r src/rules/custom/example-custom-rules.yaml \
  -o merged-rules.yaml

# 병합된 규칙 확인
cat merged-rules.yaml
```

### 6. PPT 파싱만 (디버그용)

HTML 생성 없이 PPT 구조만 확인:

```bash
node src/cli.js parse your-file.pptx -o parsed-data.json
cat parsed-data.json
```

## 📁 테스트용 PPT 파일 준비

PPT 파일이 없다면:

1. PowerPoint에서 간단한 슬라이드 몇 개 만들기
2. `test-presentation.pptx`로 저장
3. 위 명령어 실행

또는 샘플 PPT 다운로드:
- 회사 발표 자료
- 온라인 템플릿 사이트

## 🎯 추천 워크플로우

### 첫 실행

```bash
# 1. 규칙 검증
node src/cli.js validate-rules src/rules/custom/example-custom-rules.yaml

# 2. 간단한 PPT로 테스트
node src/cli.js convert simple-slide.pptx -o test1.html

# 3. 결과 확인 (브라우저에서 test1.html 열기)

# 4. 커스텀 규칙으로 다시 변환
node src/cli.js convert simple-slide.pptx \
  -r src/rules/custom/example-custom-rules.yaml \
  -o test2.html

# 5. 차이 확인 (test1.html vs test2.html)
```

### 규칙 커스터마이징

```bash
# 1. 커스텀 규칙 복사
cp src/rules/custom/example-custom-rules.yaml src/rules/custom/my-rules.yaml

# 2. my-rules.yaml 편집 (VSCode에서)

# 3. 검증
node src/cli.js validate-rules src/rules/custom/my-rules.yaml

# 4. 테스트
node src/cli.js convert test.pptx -r src/rules/custom/my-rules.yaml

# 5. 반복
```

## 🐛 문제 해결

### "ANTHROPIC_API_KEY is required"

→ `.env` 파일에 API 키 추가하세요

### "Failed to parse PPT file"

→ PPTX 파일 경로가 올바른지 확인
→ 파일이 손상되지 않았는지 확인

### 규칙이 적용 안 됨

```bash
# 병합된 규칙 확인
node src/cli.js export-rules -r my-rules.yaml -o check.yaml
cat check.yaml
```

### API 요청 실패

→ API 키 확인
→ 크레딧 잔액 확인
→ 네트워크 연결 확인

## 📊 출력 확인

변환 완료 후:

1. `output.html` 파일 생성됨
2. 브라우저에서 열기
3. HTML/CSS 확인
4. 필요시 규칙 수정 후 재변환

## 🎨 다음 단계

1. ✅ API 키 설정
2. ✅ 테스트 PPT로 첫 변환
3. ✅ 결과 확인
4. ✅ 커스텀 규칙 편집
5. ✅ 프로젝트에 적용

## 💡 팁

- `--verbose` 플래그로 상세 로그 확인
- `--export-data` 플래그로 파싱 결과 확인
- 간단한 PPT부터 시작하세요
- 규칙을 조금씩 수정하면서 테스트

## 📚 추가 문서

- [GETTING_STARTED.md](GETTING_STARTED.md) - 상세 가이드
- [USAGE.md](USAGE.md) - 전체 사용법
- [ARCHITECTURE.md](ARCHITECTURE.md) - 아키텍처
