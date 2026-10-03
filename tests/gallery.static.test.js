const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

const galleryImages = [
  ["gallery-card--one", "images/gallery/asir-mountain-horizon.jpg.jpg", "735", "1086", "galleryOneCaption"],
  ["gallery-card--two", "images/gallery/asir-qatt-patterns.jpg.jpg", "697", "523", "galleryTwoCaption"],
  ["gallery-card--three", "images/gallery/asir-heritage-details.jpg.jpg", "736", "920", "galleryThreeCaption"],
  ["gallery-card--four", "images/gallery/asir-open-air.jpg.jpg", "736", "925", "galleryFourCaption"]
];

function gallerySection() {
  const match = html.match(/<section class="section gallery" id="gallery"[\s\S]*?<\/section>/);
  assert.ok(match, "missing Gallery section");
  return match[0];
}

test("uses the four requested local photographs in the existing gallery order", () => {
  const gallery = gallerySection();
  const cards = [...gallery.matchAll(/<figure class="gallery-card ([^"]+)"[\s\S]*?<\/figure>/g)];

  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map((card) => card[1]), galleryImages.map(([card]) => card));

  for (let index = 0; index < galleryImages.length; index += 1) {
    const [, image, width, height, caption] = galleryImages[index];
    const card = cards[index][0];

    assert.match(card, new RegExp(`src="${image}"`));
    assert.match(card, new RegExp(`width="${width}" height="${height}" loading="lazy" decoding="async"`));
    assert.match(card, /alt=""/);
    assert.match(card, new RegExp(`data-i18n="${caption}"`));
    assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
  }
});

test("removes only gallery placeholder visual badges and preserves gallery text hooks", () => {
  const gallery = gallerySection();

  assert.doesNotMatch(gallery, /gallery-visual--/);
  assert.doesNotMatch(gallery, /class="visual-label"/);
  assert.doesNotMatch(gallery, /data-i18n="placeholderLabel"/);
  for (const key of ["galleryOneLabel", "galleryTwoLabel", "galleryThreeLabel", "galleryFourLabel"]) {
    assert.match(gallery, new RegExp(`data-i18n-aria-label="${key}"`));
  }
});

test("uses a balanced responsive grid, shared image frames, and compact captions", () => {
  assert.match(styles, /\.gallery-grid \{ display: grid; grid-template-columns: 1fr; gap: \.8rem; \}/);
  assert.match(styles, /@media \(min-width: 38rem\) \{[\s\S]*?\.gallery-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}[\s\S]*?\.gallery-card__image \{ aspect-ratio: 4 \/ 3; \}[\s\S]*?\.gallery-card__image img \{ height: 100%; object-fit: cover; \}/);
  assert.match(styles, /@media \(min-width: 68rem\) \{[\s\S]*?\.gallery-grid \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  assert.match(styles, /\.gallery-card \{ display: flex; flex-direction: column; min-width: 0;/);
  assert.match(styles, /\.gallery-card__image img \{[\s\S]*width: 100%;[\s\S]*height: auto;/);
  assert.match(styles, /\.gallery-card__image img \{ height: 100%; object-fit: cover; \}/);
  assert.match(styles, /\.gallery-card figcaption \{ display: flex; flex: 0 0 2\.75rem; align-items: center; box-sizing: border-box; padding: \.45rem \.8rem;/);
  assert.match(styles, /\.gallery-card--one \.gallery-card__image img \{ object-position: center 48%;/);
  assert.match(styles, /\.gallery-card--two \.gallery-card__image img \{ object-position: center center;/);
  assert.match(styles, /\.gallery-card--three \.gallery-card__image img \{ object-position: center 42%;/);
  assert.match(styles, /\.gallery-card--four \.gallery-card__image img \{ object-position: center 38%;/);
  assert.doesNotMatch(styles, /\.gallery-card--one, \.gallery-card--four \{ grid-row:/);
  assert.doesNotMatch(styles, /\.gallery-card--(?:one|two|three|four) \.gallery-card__image \{ min-height:/);
});
