const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function guideSection() {
  const match = html.match(/<section class="activities-explorer__guides"[\s\S]*?<\/section>/);
  assert.ok(match, "missing local guide section");
  return match[0];
}

test("shows exactly three local demonstration guide profiles", () => {
  const guides = guideSection();
  const cards = [...guides.matchAll(/<article class="activity-guide-card"[\s\S]*?<\/article>/g)];
  const imagePaths = [...guides.matchAll(/<img class="activity-guide-card__image" src="([^"]+)"/g)]
    .map((match) => match[1]);
  const chooseButtons = [...guides.matchAll(/data-activity-guide-select="([^"]+)"/g)]
    .map((match) => match[1]);

  assert.equal(cards.length, 3);
  assert.deepEqual(imagePaths, [
    "images/guide/guide-1.jpg.webp",
    "images/guide/guide-2.jpg.webp",
    "images/guide/guide-3.jpg.webp"
  ]);
  assert.deepEqual(chooseButtons, ["guide-nawaf", "guide-salem", "guide-majed"]);
  assert.equal(new Set(chooseButtons).size, 3);

  for (const imagePath of imagePaths) {
    assert.equal(fs.existsSync(path.join(root, imagePath)), true, `missing local image: ${imagePath}`);
  }

  assert.match(guides, /data-i18n="activityGuidesDisclosure"/);
  assert.match(guides, /data-i18n="activityGuideExperienceLabel"/);
  assert.match(guides, /data-i18n="activityGuideRegionLabel"/);
  assert.match(guides, /data-i18n="activityGuideChoose"/);
  assert.doesNotMatch(guides, /google|maps|mailto:|tel:|booking|rating|review|certif/i);
});

test("keeps bilingual demo-guide copy and translated portrait alternatives", () => {
  const requiredKeys = [
    "activityGuidesTitle",
    "activityGuidesDisclosure",
    "activityGuideExperienceLabel",
    "activityGuideRegionLabel",
    "activityGuideChoose",
    "activityGuideChooseAria",
    "activitySelectedGuideLabel",
    "activityGuideSelectedStatus",
    "activityGuideNawafName",
    "activityGuideSalemName",
    "activityGuideMajedName"
  ];

  for (const key of requiredKeys) {
    assert.match(script, new RegExp(`${key}: "[^"]+"`), `missing ${key}`);
  }

  assert.match(script, /activityGuidesTitle: "ابحث عن مرشد سياحي"/);
  assert.match(script, /activityGuidesTitle: "Find a local guide"/);
  assert.match(script, /activityGuideChoose: "اختيار هذا المرشد"/);
  assert.match(script, /activityGuideChoose: "Choose this guide"/);
  assert.match(script, /activityGuideNawafName: "المرشد التجريبي ١"/);
  assert.match(script, /activityGuideNawafName: "Demo guide 01"/);
  assert.match(script, /activityGuidesDisclosure: "الأسماء والصور التالية ملفات تعريف تجريبية للعرض فقط/);
  assert.match(script, /activityGuidesDisclosure: "The names and portraits below are demonstration profiles only/);
  assert.match(script, /document\.querySelectorAll\("\[data-i18n-alt\]"\)/);
});

test("uses a separate selected-guide state inside the existing regional plan", () => {
  assert.match(script, /let selectedGuideId = null/);
  assert.match(script, /function selectGuide\(guideId\)/);
  assert.match(script, /selectedGuideId = guideId/);
  assert.match(script, /function renderGuideCards\(copy\)/);
  assert.match(script, /button\.setAttribute\("aria-pressed", String\(selected\)\)/);
  assert.match(script, /renderPlan\(copy\);\s*renderGuideCards\(copy\);/);
  assert.match(script, /copy\.activitySelectedGuideLabel/);
  assert.match(script, /selectedGuideId = null;\s*surprisePlaceId = null/);
  assert.match(script, /if \(!plannedPlaceIds\.size && !selectedGuideId\) return/);
  assert.match(script, /plannedPlaceIds\.clear\(\);\s*selectedGuideId = null/);
  assert.doesNotMatch(script, /plannedPlaceIds\.add\(guide/);
  assert.match(script, /if \(activitiesExplorer\) activitiesExplorer\.refresh\(\)/);
});

test("scopes responsive guide card presentation without changing activity controls", () => {
  assert.match(styles, /#activities \.activities-explorer__guides \{ margin-top:/);
  assert.match(styles, /#activities \.activities-explorer__guide-grid \{ display: grid;/);
  assert.match(styles, /#activities \.activity-guide-card \{[\s\S]*height: 100%/);
  assert.match(styles, /#activities \.activity-guide-card__image \{[\s\S]*flex: 0 0 10rem;[\s\S]*height: 10rem; object-fit: cover; object-position: center 30%/);
  assert.match(styles, /#activities \.activity-guide-card__select \{[\s\S]*min-height: 2\.75rem/);
  assert.match(styles, /#activities \.activity-guide-card\.is-selected/);
  assert.match(styles, /@media \(min-width: 38rem\) \{ #activities \.activities-explorer__guides-heading[\s\S]*#activities \.activities-explorer__guide-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \} #activities \.activity-guide-card__image \{ flex-basis: 11\.5rem; height: 11\.5rem;/);
});
