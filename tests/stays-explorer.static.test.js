const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "sample-data", "stay-places.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${dataSource}\nthis.__stayPlaces = asirStayPlaces;`, context);
const places = context.__stayPlaces;

const regions = ["abha", "tanomah", "alnamas", "rijal"];
const bookingUrls = [
  "https://www.booking.com/searchresults.html?ss=Abha%2C%20Saudi%20Arabia",
  "https://www.booking.com/searchresults.html?ss=Tanomah%2C%20Saudi%20Arabia",
  "https://www.booking.com/searchresults.html?ss=Al%20Namas%2C%20Saudi%20Arabia",
  "https://www.booking.com/searchresults.html?ss=Rijal%20Almaa%2C%20Saudi%20Arabia"
];

function staysSection() {
  const match = html.match(/<div class="stays-explorer" id="stays-explorer">[\s\S]*?<\/div>\s*<div class="food-explorer"/);
  assert.ok(match, "missing standalone Stays explorer before Food Explorer");
  return match[0];
}

test("loads local stays data before the application script", () => {
  assert.ok(html.indexOf("sample-data/stay-places.js") < html.indexOf("script.js"));
  assert.ok(html.indexOf("sample-data/stay-places.js") > html.indexOf("sample-data/activity-places.js"));
});

test("offers exactly four stays regions in the requested order", () => {
  const stays = staysSection();
  const selectedRegions = [...stays.matchAll(/data-stays-region="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(selectedRegions, regions);
  assert.match(stays, /data-stays-explorer-trigger/);
  assert.match(stays, /aria-controls="stays-explorer-panel"/);
  assert.match(stays, /data-stays-results hidden/);
  assert.match(stays, /data-stays-selected-region/);
  assert.match(stays, /data-stays-count/);
  assert.match(stays, /role="status" aria-live="polite" aria-atomic="true" data-stays-status/);
});

test("uses only four verified regional Booking searches and local illustrative images", () => {
  assert.equal(places.length, 4);
  assert.deepEqual(Array.from(places, (place) => place.region), regions);
  assert.deepEqual(Array.from(places, (place) => place.bookingUrl), bookingUrls);
  assert.equal(new Set(places.map((place) => place.id)).size, 4);

  for (const place of places) {
    assert.match(place.image, /^images\/destinations\//);
    assert.equal(fs.existsSync(path.join(root, place.image)), true, `missing local image for ${place.region}`);
    assert.ok(place.title.ar && place.title.en);
    assert.ok(place.description.ar && place.description.en);
    assert.ok(place.imageAlt.ar && place.imageAlt.en);
    for (const prohibitedKey of ["hotelName", "propertyName", "type", "price", "rating", "reviews", "availability", "address", "booking"]) {
      assert.equal(prohibitedKey in place, false, `${place.region} should not define ${prohibitedKey}`);
    }
  }
});

test("renders an isolated, safe Stays explorer with one Booking action per card", () => {
  assert.match(script, /const stayPlaces = typeof asirStayPlaces === "undefined" \? \[\] : asirStayPlaces/);
  assert.match(script, /function createStaysExplorer\(\)/);
  assert.match(script, /const matchingPlaces = stayPlaces\.filter\(\(place\) => place\.region === selectedRegion\)/);
  assert.match(script, /function createPlaceCard\(place, copy\)/);
  assert.match(script, /bookingLink\.href = place\.bookingUrl/);
  assert.match(script, /bookingLink\.target = "_blank"/);
  assert.match(script, /bookingLink\.rel = "noopener noreferrer"/);
  assert.match(script, /image\.alt = place\.imageAlt\[document\.documentElement\.lang\]/);
  assert.match(script, /image\.loading = "lazy"/);
  assert.match(script, /if \(staysExplorer\) staysExplorer\.refresh\(\)/);
  assert.match(script, /const staysExplorer = createStaysExplorer\(\)/);
  assert.doesNotMatch(script, /stayPlaces\.filter\([\s\S]{0,200}(price|rating|review|availability)/i);
});

test("keeps bilingual labels, illustrative disclosure, and scoped responsive styles", () => {
  const keys = [
    "staysExplorerTrigger",
    "staysChooseRegion",
    "staysRegionsLabel",
    "staysSelectedRegion",
    "staysSearchCount",
    "staysIllustrativeImageNote",
    "staysOpenBooking",
    "staysOpenBookingAria",
    "staysNoResults"
  ];

  for (const key of keys) {
    assert.equal((script.match(new RegExp(`${key}: "[^"]+"`, "g")) || []).length, 2, `missing bilingual ${key}`);
  }

  assert.match(script, /staysExplorerTrigger: "الفنادق والسكن"/);
  assert.match(script, /staysExplorerTrigger: "Stays & Hotels"/);
  assert.match(script, /staysIllustrativeImageNote: "صورة عامة للمنطقة وليست صورة لمكان سكن\."/);
  assert.match(script, /staysIllustrativeImageNote: "General regional image — not an accommodation photo\."/);
  assert.match(styles, /\.stays-explorer \{ position: relative;/);
  assert.match(styles, /\.stays-region-button \{ min-height: 3rem;/);
  assert.match(styles, /\.stay-place-card__image \{[\s\S]*aspect-ratio: 16 \/ 9;[\s\S]*object-fit: cover/);
  assert.match(styles, /\.stay-place-card__booking \{[\s\S]*min-height: 2\.75rem/);
  assert.match(styles, /\[dir="rtl"\] \.stays-explorer__back/);
  assert.match(styles, /\.stays-explorer__regions, \.stays-explorer__place-grid/);
});
