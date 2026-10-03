const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function destinationSection() {
  const match = html.match(/<section class="section section--tint" id="destinations"[\s\S]*?<\/section>/);
  assert.ok(match, "missing Destinations section");
  return match[0];
}

test("keeps the four-slide destination carousel and its existing controls", () => {
  const destinations = destinationSection();

  assert.match(destinations, /id="destination-slider"/);
  assert.deepEqual(
    [...destinations.matchAll(/class="place-card destination-slide[^>]*data-slide="(\d+)"/g)].map((match) => match[1]),
    ["0", "1", "2", "3"]
  );
  assert.match(destinations, /data-slider-action="previous"/);
  assert.match(destinations, /data-slider-action="next"/);
  assert.match(destinations, /data-slider-action="rotation"/);
  assert.equal((destinations.match(/data-slider-dot="\d"/g) || []).length, 4);
});

test("scopes complete-viewport geometry to only the lower destination carousel", () => {
  const destinations = destinationSection();

  assert.match(destinations, /class="section-heading section-heading--split destination-slider__heading"/);
  assert.match(styles, /#destinations \{ padding-block: 0; \}/);
  assert.match(styles, /#destinations > \.container \{ width: 100%; max-width: none; margin: 0; padding: 0; \}/);
  assert.match(styles, /#destination-slider,\s*#destination-slider > \.destination-slider__stage,\s*#destination-slider \.destination-slide \{ width: 100%; max-width: none; \}/);
  assert.match(styles, /#destination-slider \{ height: 100vh; min-height: 100vh; max-height: 100vh; height: 100dvh; min-height: 100dvh; max-height: 100dvh; margin: 0; padding: 0; border-radius: 0; \}/);
  assert.match(styles, /#destination-slider > \.destination-slider__stage \{ height: 100%; min-height: 0; margin: 0; padding: 0; border-radius: 0; \}/);
  assert.match(styles, /#destination-slider \.destination-slider__heading \{ margin: 0 auto; padding-top: clamp\(7rem, 20dvh, 12rem\); padding-bottom: 0; \}/);
  assert.match(styles, /#destination-slider \.destination-slider__heading \.eyebrow \{ margin-bottom: \.45rem; \}/);
  assert.match(styles, /#destination-slider \.destination-slider__heading h2 \{ margin: 0; font-size: clamp\(2rem, 4\.25vw, 3\.6rem\); \}/);
  assert.match(styles, /#destination-slider \.place-card__content \{ min-height: 100%; padding-top: clamp\(8\.5rem, 15vw, 10\.5rem\); \}/);
  assert.match(styles, /#destination-slider \.destination-slide \{ height: 100%; min-height: 0; margin: 0; overflow-x: hidden; overflow-y: auto; \}/);
  assert.match(styles, /@media \(max-width: 37\.99rem\) \{\s*#destination-slider \{ height: 100svh; min-height: 100svh; max-height: 100svh; height: 100dvh; min-height: 100dvh; max-height: 100dvh; \}/);
  assert.match(styles, /#destination-slider \.destination-slider__heading \{ padding-top: clamp\(6rem, 20svh, 9rem\); \}/);
  assert.match(styles, /#destination-slider \.place-card__content \{ padding-top: clamp\(7\.5rem, 16svh, 9rem\); \}/);
  assert.match(styles, /#destination-slider \.destination-slide__media img \{[\s\S]*object-fit: cover/);
  assert.match(styles, /#region-hero-slider \{ height: 85vh; min-height: 85dvh; max-height: 85dvh;/);
  assert.doesNotMatch(styles, /#destination-slider \{ height: 85vh|#destination-slider \{ height: 75vh/);
});
