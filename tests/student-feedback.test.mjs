import test from "node:test";
import assert from "node:assert/strict";
import { studentToolsMarkup, formatCalculatorResult } from "../student-tools.js";
import { parseAnswer } from "../puzzle-engine.js";

test("student guide has the formula and a short explanation of the steps",()=>{
  const html=studentToolsMarkup();
  assert.match(html,/a² \+ b² = c²/);
  assert.match(html,/How to play/);
  assert.match(html,/data-close-student-tool/);
  assert.match(html,/calculator-dialog/);
});
test("student calculator has square root, backspace, and keyboard-accessible button labels",()=>{
  const html=studentToolsMarkup();
  assert.match(html,/data-calc-key="√\("/);
  assert.match(html,/data-calc-key="backspace"/);
  assert.match(html,/data-calc-equals/);
  assert.match(html,/data-calc-use/);
});
test("calculator shares the site's safe mathematical parser",()=>{
  assert.equal(parseAnswer("√(9+16)"),5);
  assert.equal(parseAnswer("sqrt(9^2+12^2)"),15);
  assert.equal(parseAnswer("2×(3+4)"),14);
  assert.equal(parseAnswer("√(-1)"),null);
  assert.equal(parseAnswer("alert(1)"),null);
  assert.equal(formatCalculatorResult(Math.sqrt(2)), "1.414213562");
});
