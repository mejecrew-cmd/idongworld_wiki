/* ============================================================
 * IDW 아이동월드 — 언어 목록 (별빛 언어 선택용)
 * 목표 69개 언어. 아래는 레퍼런스(VANNEE)에서 검증된 실제 언어 세트(시드).
 * 나머지는 스트링테이블 시트([IDW]dc1-6)에서 코드/표기를 추가하면 자동으로 별이 늘어남.
 *
 *   code : i18n 키 (페이지 언어 전환에 사용)
 *   name : 별 옆에 표시될 표기 (해당 언어 자국어 우선)
 *   rtl  : 오른쪽→왼쪽 언어 여부 (선택)
 *
 * 프로덕션에서는 languages.json 으로 분리해 fetch 해도 동일하게 동작.
 * ============================================================ */
window.IDW_LANGUAGES = [
  { code: "ko",     name: "한국어" },
  { code: "en",     name: "English" },
  { code: "ja",     name: "日本語" },
  { code: "zh-Hans",name: "简体中文" },
  { code: "zh-Hant",name: "繁體中文" },
  { code: "es",     name: "Español" },
  { code: "es-419", name: "Español (LatAm)" },
  { code: "es-MX",  name: "Español (México)" },
  { code: "es-AR",  name: "Español (Argentina)" },
  { code: "es-CL",  name: "Español (Chile)" },
  { code: "pt-BR",  name: "Português (Brasil)" },
  { code: "pt-PT",  name: "Português (Portugal)" },
  { code: "fr",     name: "Français" },
  { code: "fr-CA",  name: "Français (Québec)" },
  { code: "de",     name: "Deutsch" },
  { code: "it",     name: "Italiano" },
  { code: "nl",     name: "Nederlands" },
  { code: "ru",     name: "Русский" },
  { code: "uk",     name: "Українська" },
  { code: "pl",     name: "Polski" },
  { code: "cs-CZ",  name: "Čeština" },
  { code: "hu",     name: "Magyar" },
  { code: "sq",     name: "Shqip" },
  { code: "ca-ES",  name: "Català" },
  { code: "da",     name: "Dansk" },
  { code: "sv",     name: "Svenska" },
  { code: "id",     name: "Bahasa Indonesia" },
  { code: "ms",     name: "Bahasa Melayu" },
  { code: "tl",     name: "Filipino" },
  { code: "vi",     name: "Tiếng Việt" },
  { code: "th",     name: "ภาษาไทย" },
  { code: "hi",     name: "हिन्दी" },
  { code: "mn",     name: "Монгол" },
  { code: "mi",     name: "Māori" },
  { code: "zu",     name: "isiZulu" },
  { code: "ar",     name: "العربية", rtl: true },
  { code: "fa",     name: "فارسی",   rtl: true },
  { code: "ur",     name: "اردو",    rtl: true },
  { code: "he",     name: "עברית",   rtl: true }
];
