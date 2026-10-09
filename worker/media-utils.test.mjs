import test from "node:test";
import assert from "node:assert/strict";
import {
  inferMediaContentType,
  normalizeMediaReferences,
  resolveMediaContentType
} from "./modules/media-utils.js";

test("normalizes old Supabase public storage URLs to Worker media routes", () => {
  assert.equal(
    normalizeMediaReferences("https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/memories/couple/one.jpg"),
    "/api/media/memories/couple/one.jpg"
  );
});

test("normalizes media references inside nested arrays and objects", () => {
  const value = {
    image_url: "https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/assets/hero.webp",
    photos: [
      "https://recpvczpwybpbbntwnnk.supabase.co/storage/v1/object/public/photos/a.png",
      "https://example.com/keep-this.jpg"
    ]
  };
  assert.deepEqual(normalizeMediaReferences(value), {
    image_url: "/api/media/assets/hero.webp",
    photos: ["/api/media/photos/a.png", "https://example.com/keep-this.jpg"]
  });
});

test("infers common image MIME types from case-insensitive extensions", () => {
  assert.equal(inferMediaContentType("memories/IMG_01.JPEG"), "image/jpeg");
  assert.equal(inferMediaContentType("photos/cover.PNG"), "image/png");
  assert.equal(inferMediaContentType("photos/cover.webp?version=1"), "image/webp");
});

test("replaces generic imported MIME metadata using the media path", () => {
  assert.equal(resolveMediaContentType("application/octet-stream", "memories/photo.jpg"), "image/jpeg");
  assert.equal(resolveMediaContentType(null, "photos/photo.webp"), "image/webp");
  assert.equal(resolveMediaContentType("image/png", "photos/photo.jpg"), "image/png");
});

test("does not infer active document MIME types", () => {
  assert.equal(inferMediaContentType("assets/index.html"), null);
  assert.equal(inferMediaContentType("assets/vector.svg"), null);
});
