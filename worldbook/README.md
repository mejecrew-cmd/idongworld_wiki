# 아이동월드 LORE BOOK 웹 프로토타입

모바일 읽기형 로어북을 검증하기 위한 정적 웹 프로토타입입니다. 페이지 구조, 다국어 문자열, 이미지, 목차/상위/이전/다음 네비게이션을 JSON/CSV 데이터로 분리해 관리합니다.

## 실행

```powershell
cd Lorebook_IDONG_World/web
python -m http.server 5178
```

브라우저에서 `http://localhost:5178`을 엽니다.

현재 작업 환경에서는 5178 포트에 정적 서버가 떠 있으면 그대로 사용하면 됩니다.

## 구조

- `index.html`: 앱 진입점.
- `src/data/pages.json`: 페이지 구조, route, template, parent/children, hero, body block.
- `src/data/strings.csv`: 한국어 원문과 8개 번역 컬럼.
- `src/data/locales.json`: 언어, 폰트 폴백, 문서 방향 설정.
- `src/main.js`: 정적 JSON/CSV를 읽어 로어북 페이지를 렌더링.
- `src/styles/`: 모바일 로어북 스타일.
- `assets/images/`: 샘플 삽화.
- `assets/images/IMAGE_PROMPTS.md`: 이미지 생성 기록.

## 지원 블록

- `paragraph`
- `subheading`
- `quote`
- `callout`
- `list`
- `data_box`
- `codex_grid`
- `timeline`
- `image_pair`

## 목차 규칙

- `p00_01`은 표지이자 루트 목차입니다.
- `sNN_index`는 각 장의 서문 페이지이며, 하위 단일 페이지 목록을 보여줍니다.
- 자식 페이지가 있는 모든 페이지는 본문 아래에 하위 목차를 렌더링합니다.
- `상위 목록`은 현재 페이지의 부모 페이지로 이동합니다.
- 상단의 `전체 목차` 버튼은 전역 검색/탐색용 보조 화면입니다.

## 데이터 재생성

```powershell
python Lorebook_IDONG_World/tools/build_lorebook_full_data.py
```

재생성 결과물:

- `web/src/data/pages.json`
- `web/src/data/strings.csv`
- `web/src/data/locales.json`
- `../로어북_목차계층_260614.csv`
