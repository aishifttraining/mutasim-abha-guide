const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function aboutSection() {
  const match = html.match(/<section class="about section" id="about"[\s\S]*?<\/section>/);
  assert.ok(match, "missing About section");
  return match[0];
}

test("keeps a bilingual, labelled About section", () => {
  const about = aboutSection();

  assert.match(about, /aria-labelledby="about-title"/);
  assert.match(about, /<h2 id="about-title" data-i18n="aboutTitle">بين الغيوم وحكايات المكان<\/h2>/);
  assert.match(script, /aboutTitle: "بين الغيوم وحكايات المكان"/);
  assert.match(script, /aboutTitle: "Between clouds and local stories"/);
  assert.match(script, /aboutTextOne: "يساعدك Asir Guide على اكتشاف طبيعة عسير وقراها وتراثها ومذاقاتها المحلية وأنشطتها، خطوةً بخطوة\."/);
  assert.match(script, /aboutTextOne: "Asir Guide helps you discover Asir's nature, villages, heritage, local tastes, and activities, one step at a time\."/);
  assert.match(script, /aboutExplore: "استكشف"/);
  assert.match(script, /aboutExplore: "Explore"/);
});

test("turns all five About themes into correctly targeted card links", () => {
  const about = aboutSection();
  const cards = [...about.matchAll(/<a class="feature-strip__item[^>]*" href="([^"]+)"[\s\S]*?<\/a>/g)];

  assert.equal(cards.length, 5);
  assert.deepEqual(cards.map((card) => card[1]), ["#activities", "#destinations", "#gallery", "#stay", "#stay"]);

  for (const card of cards) {
    assert.doesNotMatch(card[0].match(/<a[^>]*>/)[0], /data-i18n=/);
    assert.match(card[0], /class="feature-strip__label" data-i18n="theme/);
    assert.match(card[0], /class="feature-icon [^"]+" aria-hidden="true"/);
    assert.match(card[0], /class="feature-strip__image" src="images\//);
  }

  for (const card of cards.slice(0, 4)) assert.match(card[0], /data-i18n="aboutExplore"/);

  const staysCard = cards[4][0];
  assert.match(staysCard, /src="images\/stays\/asir-stays-cover\.jpg\.png"/);
  assert.equal(fs.existsSync(path.join(root, "images/stays/asir-stays-cover.jpg.png")), true);
  assert.match(staysCard, /feature-icon feature-icon--bed/);
  assert.match(staysCard, /data-i18n="themeStays"/);
  assert.match(staysCard, /data-i18n="aboutExploreStays"/);

  for (const key of ["themeMountains", "themeVillages", "themeArt", "themeTaste", "themeStays", "aboutExploreStays"]) {
    assert.equal((script.match(new RegExp(`${key}: "[^"]+"`, "g")) || []).length, 2, `missing bilingual ${key}`);
  }
  assert.match(script, /themeStays: "الفنادق والسكن"/);
  assert.match(script, /themeStays: "Stays & Hotels"/);
  assert.match(script, /aboutExploreStays: "استكشف الإقامة"/);
  assert.match(script, /aboutExploreStays: "Explore stays"/);
});

test("scopes the About background and interactive card states to the section", () => {
  assert.match(styles, /#about \{ position: relative; isolation: isolate; overflow: hidden;/);
  assert.match(styles, /#about::before, #about::after[\s\S]*pointer-events: none/);
  assert.match(styles, /#about \.feature-strip__item:hover, #about \.feature-strip__item:focus-visible/);
  assert.match(styles, /#about \.feature-strip__item:focus-visible \{ outline-color: var\(--gold\);/);
  assert.match(styles, /#about \.feature-strip__image[\s\S]*object-fit: cover/);
  assert.match(styles, /#about \.feature-strip \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(min-width: 68rem\) \{ #about \.feature-strip \{ grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);/);
  assert.match(styles, /#about \.feature-icon--bed/);
  assert.match(styles, /\[dir="rtl"\] #about \.feature-strip__cta-arrow/);
});
