const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "sample-data", "activity-places.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${dataSource}\nthis.__activityPlaces = asirActivityPlaces;`, context);
const places = context.__activityPlaces;

const regions = ["abha", "tanomah", "alnamas", "rijal"];
const categories = ["nature", "activity"];

function placeById(id) {
  return places.find((place) => place.id === id);
}

function count(region, category) {
  return places.filter((place) => place.region === region && place.category === category).length;
}

test("loads local activity data before the application script", () => {
  assert.ok(html.indexOf("sample-data/activity-places.js") < html.indexOf("script.js"));
});

test("offers exactly the four current activity regions", () => {
  const selectedRegions = [...html.matchAll(/data-activity-region="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(selectedRegions, regions);
});

test("makes Activities and Events clear before a region is chosen", () => {
  const expectedCopy = {
    ar: {
      title: "استكشف الأنشطة والفعاليات في عسير",
      intro: "استكشف المتنزهات والمواقع الطبيعية ومسارات الهايكنج والفعاليات والتجارب، مع مرافق مقترحة وروابط مباشرة إلى خرائط Google لتخطيط زيارتك.",
      prompt: "اختر المنطقة لعرض المتنزهات والفعاليات"
    },
    en: {
      title: "Explore activities and events in Asir",
      intro: "Explore parks, natural sites, hiking trails, events and experiences, with visitor facilities and direct Google Maps links to plan your visit.",
      prompt: "Choose a region to view parks and activities"
    }
  };
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

  for (const copy of Object.values(expectedCopy)) {
    assert.match(script, new RegExp(copy.title));
    assert.match(script, new RegExp(copy.intro));
    assert.match(script, new RegExp(copy.prompt));
  }

  for (const [key, label] of [
    ["activityIndicatorNature", "Parks & Nature"],
    ["activityIndicatorHiking", "Hiking & Trails"],
    ["activityIndicatorEvents", "Events & Experiences"],
    ["activityIndicatorPlan", "Plan your visit"]
  ]) {
    assert.match(html, new RegExp(`data-i18n="${key}"`));
    assert.match(script, new RegExp(`${key}: "[^"]+"`));
    assert.match(script, new RegExp(`${key}: "${label.replace(/[&]/g, "\\&")}"`));
  }
  assert.match(html, /class="activities__indicators"[\s\S]*data-i18n-aria-label="activityIndicatorsLabel"/);

  const expectedThumbnails = {
    abha: "images/destinations/abha-destination.jpg.jpg",
    tanomah: "images/destinations/tanomah-destination.jpg.jpg",
    alnamas: "images/destinations/alnamas-destination.jpg.jpg",
    rijal: "images/destinations/rijal-almaa-destination.jpg.jpg"
  };
  for (const [region, thumbnail] of Object.entries(expectedThumbnails)) {
    const button = html.match(new RegExp(`<button class="activity-region-button"[^>]*data-activity-region="${region}"[^>]*>[\\s\\S]*?</button>`));
    assert.ok(button, `missing visual ${region} region button`);
    assert.doesNotMatch(button[0].match(/<button[^>]*>/)[0], /data-i18n=/);
    assert.match(button[0], new RegExp(`src="${thumbnail}"`));
    assert.match(button[0], /class="activity-region-button__name" data-i18n="activityRegion/);
  }

  assert.match(styles, /#activities \{ padding-block:/);
  assert.match(styles, /#activities \.activities__grid:has\(#activities-photo-slider:not\(\[hidden\]\)\)/);
  assert.match(styles, /#activities \.activities-explorer__regions \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /#activities \.activity-region-button__image[\s\S]*object-fit: cover/);
  assert.match(styles, /#activities \.activity-region-button:focus-visible/);
});

test("keeps a bilingual regional catalog with expected coverage", () => {
  assert.equal(places.length, 20);
  assert.equal(new Set(places.map((place) => place.id)).size, places.length);
  assert.equal(count("abha", "nature"), 2);
  assert.equal(count("abha", "activity"), 5);
  assert.equal(count("tanomah", "nature"), 2);
  assert.equal(count("tanomah", "activity"), 2);
  assert.equal(count("alnamas", "nature"), 2);
  assert.equal(count("alnamas", "activity"), 3);
  assert.equal(count("rijal", "nature"), 2);
  assert.equal(count("rijal", "activity"), 2);

  for (const place of places) {
    assert.ok(regions.includes(place.region));
    assert.ok(categories.includes(place.category));
    assert.ok(["place", "hiking"].includes(place.kind));
    assert.ok(place.name.ar && place.name.en && place.description.ar && place.description.en);
    if (place.image) {
      assert.match(place.image, /^images\/activities\//);
      assert.ok(place.imageAlt?.ar && place.imageAlt?.en);
      assert.equal(fs.existsSync(path.join(root, place.image)), true, `missing local image for ${place.id}`);
    } else {
      assert.equal("imageAlt" in place, false);
    }
    assert.ok(place.mapsQuery);
    assert.match(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapsQuery)}`, /query=/);
    assert.equal("facilities" in place, false);
    for (const prohibitedKey of ["date", "time", "price", "booking", "organizer", "organiser"]) {
      assert.equal(prohibitedKey in place, false);
    }
    if (place.kind === "hiking") {
      assert.match(place.hikingGroupQuery, /^Hiking groups /);
      assert.match(place.hikingGroupQuery, /Saudi Arabia$/);
    } else {
      assert.equal("hikingGroupQuery" in place, false);
    }
  }
});

test("includes the requested Abha, Al-Namas, and Rijal Almaa records", () => {
  const required = [
    ["abha-cable-car", "abha", "activity", "place", "Abha Cable Car Saudi Arabia"],
    ["al-rashid-mall-abha", "abha", "activity", "place", "Al Rashid Mall, Abha, Saudi Arabia"],
    ["seven-event-abha", "abha", "activity", "place", "Seven Event, Abha, Saudi Arabia"],
    ["mist-walkway-alnamas", "alnamas", "activity", "hiking", "Mist Walkway, Al Namas, Saudi Arabia"],
    ["wadi-hali-rijal-almaa", "rijal", "nature", "place", "Wadi Hali, Rijal Almaa, Saudi Arabia"],
    ["sarawat-mountains-rijal-almaa", "rijal", "nature", "place", "Sarawat Mountains, Rijal Almaa, Saudi Arabia"],
    ["honey-hut-rijal-almaa", "rijal", "activity", "place", "Honey Hut, Rijal Almaa, Saudi Arabia"],
    ["rijal-almaa-mountain-nature-walk", "rijal", "activity", "hiking", "Rijal Almaa, Saudi Arabia"]
  ];

  for (const [id, region, category, kind, mapsQuery] of required) {
    const place = placeById(id);
    assert.ok(place, `missing ${id}`);
    assert.equal(place.region, region);
    assert.equal(place.category, category);
    assert.equal(place.kind, kind);
    assert.equal(place.mapsQuery, mapsQuery);
  }

  const mistWalkway = placeById("mist-walkway-alnamas");
  assert.equal(mistWalkway.hikingGroupQuery, "Hiking groups Al Namas, Saudi Arabia");
  assert.equal(placeById("rijal-almaa-mountain-nature-walk").hikingGroupQuery, "Hiking groups Rijal Almaa, Saudi Arabia");
});

test("maps all matching local activity images and leaves only intended cards on fallback", () => {
  const expectedImages = {
    "asir-national-park": "images/activities/abha-asir-national-park.jpg.jpg",
    "jabal-sawda": "images/activities/abha-al-soudah-mountain.jpg.jpg",
    "asir-national-park-walk": "images/activities/abha-al-soudah-hiking.jpg.jpg",
    "jabal-sawda-viewpoints": "images/activities/abha-natural-viewpoints.jpg.jpg",
    "abha-cable-car": "images/activities/Abha Cable Car, Asir _ Saudi Arabia Travel Wall Art.jpg",
    "al-rashid-mall-abha": "images/activities/abha-al-rashid-mall.jpg.jpg",
    "seven-event-abha": "images/activities/abha-seven-event.jpg.jpg",
    "tanomah-forests": "images/activities/tanomah-forests.jpg.jpg",
    "dahna-waterfalls": "images/activities/tanomah-al-dahna-waterfalls.jpg.webp",
    "tanomah-forest-walk": "images/activities/tanomah-hiking.jpg.jpg",
    "dahna-landscape-viewing": "images/activities/tanomah-waterfalls-views.jpg.webp",
    "al-namas-park": "images/activities/alnamas-park.jpg.png",
    "shafa-al-namas-park": "images/activities/alnamas-shafa-park.jpg.jpeg.jpeg",
    "shafa-al-namas-walk": "images/activities/alnamas-hiking.jpg.jpg",
    "al-namas-landscape-viewing": "images/activities/alnamas-scenic-views.jpg.jpg",
    "mist-walkway-alnamas": "images/activities/alnamas-mist-walkway.jpg.png",
    "wadi-hali-rijal-almaa": "images/activities/rijal-almaa-wadi-hili.jpg.jpg",
    "sarawat-mountains-rijal-almaa": "images/activities/rijal-almaa-sarawat-mountains.jpg.png",
    "honey-hut-rijal-almaa": "images/activities/rijal-almaa-honey-hut.jpg.jpg",
    "rijal-almaa-mountain-nature-walk": "images/activities/rijal-almaa-hiking.jpg.jpg"
  };
  const intendedFallbackIds = [];

  assert.equal(Object.keys(expectedImages).length, 20);
  const cableCar = placeById("abha-cable-car");
  assert.equal(cableCar.kind, "place");
  assert.equal(cableCar.mapsQuery, "Abha Cable Car Saudi Arabia");
  assert.equal("hikingGroupQuery" in cableCar, false);
  for (const [id, image] of Object.entries(expectedImages)) {
    const place = placeById(id);
    assert.equal(place.image, image);
    assert.ok(place.imageAlt.ar && place.imageAlt.en);
  }
  assert.deepEqual([...places.filter((place) => !place.image).map((place) => place.id)], intendedFallbackIds);
});

test("removes all Soudah and Sawda references from Rijal Almaa records", () => {
  const rijalData = JSON.stringify(places.filter((place) => place.region === "rijal"));
  assert.doesNotMatch(rijalData, /soudah|sawda|السودة/i);
});

test("declares an initially hidden accessible explorer with plan and surprise hooks", () => {
  assert.match(html, /data-activity-results hidden/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /id="activity-tab-nature"[\s\S]*aria-controls="activity-panel-nature"/);
  assert.match(html, /id="activity-tab-events"[\s\S]*aria-controls="activity-panel-events"/);
  assert.match(html, /id="activity-panel-nature"[\s\S]*role="tabpanel"[\s\S]*aria-labelledby="activity-tab-nature"/);
  assert.match(html, /id="activity-panel-events"[\s\S]*role="tabpanel"[\s\S]*aria-labelledby="activity-tab-events"/);
  assert.match(html, /data-activity-plan-list/);
  assert.match(html, /data-activity-plan-count/);
  assert.match(html, /data-activity-clear-plan disabled/);
  assert.match(html, /data-activity-surprise/);
});

test("keeps the requested region order, full-width results, and responsive activity cards", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const selectedRegions = [...html.matchAll(/data-activity-region="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(selectedRegions, regions);
  assert.match(styles, /#activities \.activities__grid:has\(#activities-photo-slider:not\(\[hidden\]\)\) \{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /#activities \.activities-photo-slider \{ grid-column: 1 \/ -1; width: 100%;/);
  assert.match(styles, /@media \(min-width: 38rem\) \{ #activities \.activities-explorer__card-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(styles, /@media \(min-width: 68rem\) \{ #activities \.activities-explorer__regions \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \} #activities \.activities-explorer__card-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
});

test("renders Maps links and keeps localized plan, surprise, refresh, and keyboard hooks", () => {
  assert.match(script, /target = "_blank"/);
  assert.match(script, /rel = "noopener noreferrer"/);
  assert.match(script, /encodeURIComponent\(query\)/);
  assert.match(script, /let plannedPlaceIds = new Set\(\)/);
  assert.match(script, /let surprisePlaceId = null/);
  assert.match(script, /place\.region === selectedRegion/);
  assert.match(script, /const alreadyPlanned = plannedPlaceIds\.has\(place\.id\)/);
  assert.match(script, /if \(!alreadyPlanned\) plannedPlaceIds\.add\(place\.id\)/);
  assert.match(script, /activitySurpriseAlreadyPlanned/);
  assert.match(script, /activitySurpriseAlreadyPlanned: "[^"]+"/);
  assert.match(script, /plannedPlaceIds = new Set\(\)/);
  assert.match(script, /plannedPlaceIds\.clear\(\)/);
  assert.match(script, /button\.dataset\.activityPlaceId = place\.id/);
  assert.match(script, /media\.src = place\.image/);
  assert.match(script, /media\.alt = place\.imageAlt\[document\.documentElement\.lang\]/);
  assert.match(script, /media\.loading = "lazy"/);
  assert.match(script, /media\.decoding = "async"/);
  assert.match(script, /activity-place-card__image--fallback/);
  assert.match(fs.readFileSync(path.join(root, "styles.css"), "utf8"), /\.activity-place-card__image[\s\S]*object-fit: cover/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /if \(activitiesExplorer\) activitiesExplorer\.refresh\(\)/);
  assert.match(script, /event\.key === "ArrowLeft" \|\| event\.key === "ArrowRight"/);
  assert.match(script, /event\.key === "Home"/);
  assert.match(script, /event\.key === "End"/);
});

test("adds a region-aware local-photo slider without changing activity cards", () => {
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(html, /id="activities-photo-slider"[\s\S]*data-activity-photo-slider hidden/);
  assert.doesNotMatch(html, /class="activities__art"/);
  assert.match(script, /function getRegionPhotoPlaces\(region\)/);
  assert.match(script, /place\.region === region && place\.image/);
  assert.match(script, /let selectedPhotoId = null/);
  assert.match(script, /selectedPhotoId = photoPlaces\[0\]\.id/);
  assert.match(script, /createMapsLink\(\{[\s\S]*className: "activities-photo-slider__map"/);
  assert.match(script, /activityPhotoCarouselLabel/);
  assert.match(script, /activityPhotoPrevious/);
  assert.match(script, /activityPhotoNext/);
  assert.match(script, /activityPhotoPause/);
  assert.match(script, /activityPhotoPlay/);
  assert.match(script, /activityPhotoGoTo/);
  assert.match(script, /activityPhotoStatus/);
  assert.match(script, /photoMotionQuery/);
  assert.match(script, /mouseenter/);
  assert.match(script, /focusin/);
  assert.match(script, /pointerdown/);
  assert.match(script, /visibilitychange/);
  assert.match(script, /photoSlider\.addEventListener\("keydown"/);
  assert.match(styles, /\.activities-photo-slider__image[\s\S]*object-fit: cover/);
  assert.match(styles, /\.activities-photo-slider__overlay/);
  assert.match(styles, /\.activities-photo-slider__stage::after \{[\s\S]*linear-gradient\(to top/);
  assert.match(styles, /\.activities-photo-slider__controls \{[\s\S]*position: absolute;[\s\S]*inset-inline-start: 50%;[\s\S]*border-radius: 999px;[\s\S]*transform: translateX\(-50%\)/);
  assert.match(styles, /\.activities-photo-slider__button, \.activities-photo-slider__dot \{[\s\S]*border-radius: 50%/);
  assert.match(styles, /\.activities-photo-slider__dots \{[\s\S]*justify-content: center/);
  assert.match(styles, /\.activities-photo-slider__dot\.is-current::before \{[\s\S]*background: var\(--gold\)/);
  assert.match(styles, /\.activities-photo-slider__button--rotation \{[\s\S]*color: #fff4cf/);
  assert.match(styles, /\[dir="rtl"\] \.activities-photo-slider__button--previous > span\[aria-hidden="true"\]/);

  for (const region of regions) {
    const sliderPlaces = places.filter((place) => place.region === region && place.image);
    const cardPlaces = places.filter((place) => place.region === region);
    assert.ok(sliderPlaces.length >= 3, `${region} needs at least three local photo slides`);
    for (const place of sliderPlaces) assert.ok(cardPlaces.includes(place));
  }
  assert.deepEqual(
    [...places.filter((place) => !place.image).map((place) => place.id)],
    []
  );
});
