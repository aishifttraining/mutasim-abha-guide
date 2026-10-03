const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function headerActions() {
  const match = html.match(/<div class="header__actions">[\s\S]*?<\/div>/);
  assert.ok(match, "missing header action group");
  return match[0];
}

test("places an accessible sun and moon theme button directly after AR / EN", () => {
  const actions = headerActions();
  const languageAt = actions.indexOf('id="language-switch"');
  const themeAt = actions.indexOf('id="theme-switch"');
  const menuAt = actions.indexOf('id="menu-toggle"');

  assert.ok(languageAt >= 0 && themeAt > languageAt && menuAt > themeAt);
  assert.match(actions, /<button class="theme-switch" type="button" id="theme-switch" aria-pressed="false" data-theme="light" data-i18n-aria-label="themeSwitchDark"/);
  assert.match(actions, /theme-switch__icon theme-switch__icon--sun/);
  assert.match(actions, /theme-switch__icon theme-switch__icon--moon/);
  assert.match(actions, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.match(actions, /<span class="sr-only" data-i18n="themeSwitchDark">/);
  assert.match(html, /<div class="sr-only" id="theme-status" aria-live="polite" aria-atomic="true"><\/div>/);
  assert.match(actions, /data-language-token="ar" data-active="true"[^>]*>AR<\/span>/);
  assert.match(actions, /data-language-token="en" data-active="false"[^>]*>EN<\/span>/);
});

test("persists only a valid theme independently and refreshes localized control copy", () => {
  for (const key of ["themeSwitchDark", "themeSwitchLight", "themeChangedDark", "themeChangedLight"]) {
    assert.equal((script.match(new RegExp(`${key}: "[^"]+"`, "g")) || []).length, 2, `missing bilingual ${key}`);
  }

  assert.match(script, /const themeStorageKey = "asir-guide-theme"/);
  assert.match(script, /function getStoredTheme\(\) \{[\s\S]*?localStorage\.getItem\(themeStorageKey\)[\s\S]*?storedTheme === "light" \|\| storedTheme === "dark" \? storedTheme : "light"/);
  assert.match(script, /function setStoredTheme\(theme\) \{[\s\S]*?localStorage\.setItem\(themeStorageKey, theme\)/);
  assert.match(script, /function setTheme\(theme, announce = false\) \{[\s\S]*?root\.dataset\.theme = theme;[\s\S]*?themeButton\.setAttribute\("aria-pressed", String\(theme === "dark"\)\);[\s\S]*?themeButton\.dataset\.theme = theme;[\s\S]*?setStoredTheme\(theme\);[\s\S]*?themeStatus\.textContent/);
  assert.match(script, /setTheme\(root\.dataset\.theme \|\| getStoredTheme\(\)\);[\s\S]*?setStoredLanguage\(language\);/);
  assert.match(script, /themeButton\.addEventListener\("click", \(\) => \{[\s\S]*?setTheme\(document\.documentElement\.dataset\.theme === "dark" \? "light" : "dark", true\);/);
  assert.match(script, /setTheme\(getStoredTheme\(\)\);[\s\S]*?setLanguage\(getStoredLanguage\(\)\);/);
});

test("uses semantic deep-green and navy tokens without changing slider selectors", () => {
  assert.match(styles, /:root \{[\s\S]*?--color-page: var\(--beige-50\);[\s\S]*?--color-surface: var\(--white\);[\s\S]*?--color-focus: var\(--gold\);/);
  assert.match(styles, /html\[data-theme="dark"\] \{[\s\S]*?color-scheme: dark;[\s\S]*?--color-page: #0c1a26;[\s\S]*?--color-surface: #132a32;[\s\S]*?--color-text: #f6eee0;[\s\S]*?--color-focus: #f1d88f;/);
  assert.match(styles, /body \{[^}]*color: var\(--color-text\); background: var\(--color-page\);/);
  assert.match(styles, /:focus-visible \{ outline: 3px solid var\(--color-focus\);/);
  assert.match(styles, /\.theme-switch \{[\s\S]*?width: 2\.7rem;[\s\S]*?height: 2\.7rem;[\s\S]*?background: var\(--color-header-control\);/);
  assert.match(styles, /\.theme-switch\[data-theme="light"\] \.theme-switch__icon--sun, \.theme-switch\[data-theme="dark"\] \.theme-switch__icon--moon/);
  assert.match(styles, /html\[data-theme="dark"\] \.place-card:not\(\.destination-slide\),[\s\S]*?background: var\(--color-surface\);/);
  assert.match(styles, /html\[data-theme="dark"\] \.contact \{[\s\S]*?background: linear-gradient\(124deg, var\(--color-surface-muted\), var\(--color-page\)\);/);
  assert.match(styles, /#region-hero-slider \{ height: 85vh;/);
  assert.match(styles, /#destination-slider \{ height: 100vh;/);
});

test("keeps every dark-mode region chooser state readable and keyboard-visible", () => {
  const chooserSelectors = [
    "activity-region-button",
    "food-region-button",
    "stays-region-button"
  ];

  for (const selector of chooserSelectors) {
    assert.match(styles, new RegExp(`html\\[data-theme="dark"\\] \\.${selector}[\\s\\S]*?color: var\\(--white\\);[\\s\\S]*?border-color: var\\(--green-700\\);`));
    assert.match(styles, new RegExp(`html\\[data-theme="dark"\\] \\.${selector}:hover`));
    assert.match(styles, new RegExp(`html\\[data-theme="dark"\\] \\.${selector}:focus-visible`));
    assert.match(styles, new RegExp(`html\\[data-theme="dark"\\] \\.${selector}\\[aria-pressed="true"\\]`));
  }

  assert.match(styles, /html\[data-theme="dark"\] \.activity-region-button:hover,[\s\S]*?color: var\(--white\);[\s\S]*?border-color: var\(--gold\);/);
  assert.match(styles, /html\[data-theme="dark"\] \.activity-region-button:focus-visible,[\s\S]*?outline-color: var\(--color-focus\);[\s\S]*?outline-offset: 4px;/);
  assert.match(styles, /html\[data-theme="dark"\] \.activity-region-button\[aria-pressed="true"\],[\s\S]*?color: var\(--white\);[\s\S]*?background: #235847;/);
});
