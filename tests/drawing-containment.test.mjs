import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Structural regression test for the reported canvas overflow.
 *
 * The browser scrolls the inspector; it MUST NOT impose a 100% height
 * on the drawing-mode parchment while its fixed-height drawing area
 * extends outside that parchment. These selectors are intentionally
 * mode-scoped: the Maths editor still uses flexible available height.
 */
const sheet=readFileSync(new URL("../pass-workspace-room.css",import.meta.url),"utf8");
const workspace=readFileSync(new URL("../working-space.js",import.meta.url),"utf8");
const fixes=sheet.slice(sheet.indexOf("Drawing pad containment fix."));
const blockFor=selector=>{
  const at=fixes.indexOf(selector+" {");
  assert.ok(at>=0,"Missing layout selector: "+selector);
  const start=fixes.indexOf("{",at);
  return fixes.slice(start+1,fixes.indexOf("}",start));
};

test("ink mode explicitly sets the working container to content-based sizing",()=>{
  assert.match(workspace,/container\.classList\.toggle\("ws-drawing-host",tab==="ink"\)/);
  assert.match(workspace,/root\.classList\.toggle\("ws-drawing",tab==="ink"\)/);
  const mount=blockFor('body[data-view="puzzle"] #inspector .working-pad-mount.ws-drawing-host');
  assert.match(mount,/flex:\s*0 0 auto/);
  assert.match(mount,/height:\s*auto/);
  const parchment=blockFor('body[data-view="puzzle"] #inspector .working-pad-mount.ws-drawing-host .ws-root.ws-drawing');
  assert.match(parchment,/flex:\s*0 0 auto/);
  assert.match(parchment,/height:\s*auto/);
  assert.doesNotMatch(parchment,/height:\s*100%/);
  const body=blockFor('body[data-view="puzzle"] #inspector .ws-root.ws-drawing .ws-body');
  assert.match(body,/flex:\s*0 0 auto/);
  assert.match(body,/height:\s*auto/);
});

test("both pen sizes occupy space in flow, while solution actions remain below",()=>{
  const canvas=blockFor('body[data-view="puzzle"] #inspector .ws-root.ws-drawing .ws-ink-frame');
  assert.match(canvas,/flex:\s*0 0 auto/);
  assert.match(canvas,/height:\s*clamp\(/);
  const large=blockFor('body[data-view="puzzle"] #inspector .ws-root.ws-drawing .ws-ink-frame.is-large');
  assert.match(large,/height:\s*clamp\(/);
  const actions=blockFor('body[data-view="puzzle"] #inspector .panel-actions');
  assert.match(actions,/position:\s*static/);
  assert.match(actions,/flex:\s*0 0 auto/);
  assert.match(fixes,/body\[data-view="puzzle"\] #inspector\s*{\s*overflow-y:\s*auto/);
  assert.match(fixes,/@media\s*\(max-width:\s*899px\)/);
});
