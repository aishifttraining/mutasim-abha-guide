const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "sample-data", "food-places.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${dataSource}\nthis.__foodPlaces = asirFoodPlaces;`, context);
const places = context.__foodPlaces;

const regions = ["abha", "tanomah", "alnamas", "rijal"];
const types = ["cafe", "restaurant"];

function foodExplorer() {
  const match = html.match(/<div class="food-explorer" id="food-explorer">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/);
  assert.ok(match, "missing Food Explorer");
  return match[0];
}

test("keeps permanent AR and EN language tokens with state-driven emphasis", () => {
  const languageControl = html.match(/<button class="language-switch"[\s\S]*?<\/button>/)?.[0];

  assert.ok(languageControl, "missing language switch");
  assert.match(languageControl, /data-language-token="ar" data-active="true"[^>]*>AR<\/span>/);
  assert.match(languageControl, /data-language-token="en" data-active="false"[^>]*>EN<\/span>/);
  assert.doesNotMatch(languageControl, /data-i18n="languageSwitch"/);
  assert.doesNotMatch(script, /languageSwitch:/);
  assert.match(script, /root\.lang = language/);
  assert.match(script, /root\.dir = language === "ar" \? "rtl" : "ltr"/);
  assert.match(script, /querySelectorAll\("\[data-language-token\]"\)\.forEach/);
  assert.match(script, /token\.dataset\.active = String\(token\.dataset\.languageToken === language\)/);
  assert.match(styles, /\.language-switch__token\[data-active="true"\]/);
  assert.match(styles, /\.language-switch \{[\s\S]*direction: ltr/);
});

test("keeps food data local, bilingual, and grouped by the four current regions", () => {
  assert.ok(html.indexOf("sample-data/food-places.js") < html.indexOf("script.js"));
  assert.ok(places.length > 0);
  assert.deepEqual([...new Set(places.map((place) => place.region))], regions);

  for (const place of places) {
    assert.ok(regions.includes(place.region));
    assert.ok(types.includes(place.type));
    assert.ok(place.name.ar && place.name.en);
    assert.ok(place.description.ar && place.description.en);
    assert.ok(place.imageAlt.ar && place.imageAlt.en);
    assert.match(place.image, /^images\/food\//);
    assert.equal(fs.existsSync(path.join(root, place.image)), true, `missing image for ${place.id}`);
    assert.match(place.mapUrl, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  }
});

test("adds a bilingual surprise panel after Food filters and before the normal results", () => {
  const explorer = foodExplorer();
  const filtersAt = explorer.indexOf("food-explorer__filters");
  const surpriseAt = explorer.indexOf("data-food-surprise");
  const statusAt = explorer.indexOf("data-food-status");
  const gridAt = explorer.indexOf("data-food-place-grid");

  assert.ok(filtersAt >= 0 && surpriseAt > filtersAt && statusAt > surpriseAt && gridAt > statusAt);
  assert.match(explorer, /data-food-surprise-button data-i18n="foodSurpriseButton"/);
  assert.match(explorer, /data-food-surprise-result hidden/);
  assert.match(explorer, /data-food-surprise-again hidden data-i18n="foodSurpriseAgain"/);
  for (const key of [
    "foodSurpriseKicker",
    "foodSurpriseTitle",
    "foodSurpriseIntro",
    "foodSurpriseButton",
    "foodSurpriseAgain",
    "foodSurpriseStatus",
    "foodSurpriseEmpty"
  ]) {
    assert.equal((script.match(new RegExp(`${key}: "[^"]+"`, "g")) || []).length, 2, `missing bilingual ${key}`);
  }
});

test("uses current region and category candidates, avoids immediate repeats, and reuses safe cards", () => {
  assert.match(script, /let selectedSurprisePlaceId = null/);
  assert.match(script, /const lastSurprisePlaceIds = new Map\(\)/);
  assert.match(script, /return `\$\{selectedRegion\}:\$\{selectedCategory\}`/);
  assert.match(script, /place\.region === selectedRegion && \(selectedCategory === "all" \|\| place\.type === selectedCategory\)/);
  assert.match(script, /const eligiblePlaces = matchingPlaces\.length > 1[\s\S]*?place\.id !== previousId/);
  assert.match(script, /lastSurprisePlaceIds\.set\(scope, place\.id\)/);
  assert.match(script, /surpriseResult\.append\(badge, createPlaceCard\(selectedPlace, copy\)\)/);
  assert.match(script, /mapLink\.href = place\.mapUrl/);
  assert.match(script, /mapLink\.target = "_blank"/);
  assert.match(script, /mapLink\.rel = "noopener noreferrer"/);
  assert.match(script, /if \(foodExplorer\) foodExplorer\.refresh\(\)/);
});

test("scopes surprise presentation and larger explanatory typography without resizing headings or controls", () => {
  assert.match(styles, /\.food-explorer__surprise \{[\s\S]*border: 1px solid rgba\(200, 164, 95/);
  assert.match(styles, /\.food-explorer__surprise-result \.food-place-card/);
  assert.match(styles, /\.food-explorer__surprise-button, \.food-explorer__surprise-again \{[\s\S]*min-height: 2\.75rem/);
  assert.match(styles, /\.hero-slide__description \{[\s\S]*font-size: clamp\(1\.24rem/);
  assert.match(styles, /#about \.about__body \{[\s\S]*font-size: clamp\(1\.06rem/);
  assert.match(styles, /\.food-place-card__description \{[\s\S]*font-size: clamp\(1\.04rem/);
  assert.match(styles, /\.stay-place-card__description \{[\s\S]*font-size: clamp\(1\.04rem/);
  assert.match(styles, /#region-hero-slider \.hero-slide__description \{ font-size: clamp\(1\.12rem/);
  assert.match(styles, /#destination-slider \.place-card__content > p:not\(\.card__index\) \{[\s\S]*font-size: clamp\(1\.06rem/);
});
