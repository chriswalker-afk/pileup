/**
 * Optional, low-clutter help and calculator for Pythagoras Pile Up.
 * Neither tool supplies a puzzle answer: the calculator evaluates only
 * an expression the student enters. No eval() or third-party service.
 */
import { parseAnswer } from "./puzzle-engine.js";

const calculatorKeys = [
  ["7","7"],["8","8"],["9","9"],["÷","÷"],["√","√("],
  ["4","4"],["5","5"],["6","6"],["×","×"],["x²","^2"],
  ["1","1"],["2","2"],["3","3"],["−","−"],["(","("],
  ["0","0"],[".", "."],["+","+"],[")",")"],["⌫","backspace"]
];

export function studentToolsMarkup(){
  const keys=calculatorKeys.map(([label,value])=>
    '<button type="button" class="calculator-key" data-calc-key="'+value+
    '" aria-label="'+(label==="√"?"Square root":label==="x²"?"Square":label==="⌫"?"Backspace":label)+
    '">'+label+'</button>').join("");
  return [
    '<dialog class="student-tool-dialog" id="guide-dialog" aria-labelledby="guide-heading">',
    '  <div class="student-tool-inner">',
    '    <button class="student-tool-close" type="button" data-close-student-tool aria-label="Close guide">×</button>',
    '    <h2 id="guide-heading">How to play</h2>',
    '    <div class="guide-formula"><strong>a² + b² = c²</strong><span>c is the longest side, opposite the right angle.</span></div>',
    '    <ol class="guide-steps">',
    '      <li><strong>Look:</strong> tap a triangle or a ? length. Use Find a start if you are unsure.</li>',
    '      <li><strong>Calculate:</strong> add squares for the longest side; subtract squares for a shorter side. Take the square root.</li>',
    '      <li><strong>Check:</strong> enter the length in cm. Each correct length helps you reach x.</li>',
    '    </ol>',
    '    <p class="guide-note">Use + to zoom and the arrows or drag to move. Your working is saved on this device.</p>',
    '    <button class="student-tool-done" type="button" data-close-student-tool>START SOLVING</button>',
    '  </div>',
    '</dialog>',
    '<dialog class="student-tool-dialog calculator-dialog" id="calculator-dialog" aria-labelledby="calculator-heading">',
    '  <div class="student-tool-inner">',
    '    <button class="student-tool-close" type="button" data-close-student-tool aria-label="Close calculator">×</button>',
    '    <h2 id="calculator-heading">Calculator</h2>',
    '    <label for="calculator-expression">Your calculation</label>',
    '    <input id="calculator-expression" type="text" inputmode="decimal" maxlength="90" autocomplete="off" placeholder="e.g. √(9² + 16)" aria-describedby="calculator-note">',
    '    <div class="calculator-keys" aria-label="Calculator keys">'+keys+'</div>',
    '    <div class="calculator-result" aria-live="polite" id="calculator-result">Enter a calculation.</div>',
    '    <p id="calculator-note" class="guide-note">Supports +, −, ×, ÷, squares, brackets and square roots.</p>',
    '    <div class="calculator-actions">',
    '      <button class="calculator-clear" type="button" data-calc-clear>Clear</button>',
    '      <button class="calculator-equals" type="button" data-calc-equals>Calculate =</button>',
    '      <button class="calculator-use" type="button" data-calc-use disabled>USE RESULT</button>',
    '    </div>',
    '  </div>',
    '</dialog>'
  ].join("");
}

export function insertAtCursor(input,text,offsetFromEnd=0){
  if(!input)return;
  const start=Number.isInteger(input.selectionStart)?input.selectionStart:input.value.length;
  const end=Number.isInteger(input.selectionEnd)?input.selectionEnd:start;
  if(typeof input.setRangeText==="function"){
    input.setRangeText(text,start,end,"end");
  }else{
    input.value=input.value.slice(0,start)+text+input.value.slice(end);
  }
  const cursor=start+text.length-offsetFromEnd;
  input.setSelectionRange?.(cursor,cursor);
  input.focus?.();
  input.dispatchEvent?.(new Event("input",{bubbles:true}));
}

export function formatCalculatorResult(value){
  if(!Number.isFinite(value))return null;
  return Number(value.toPrecision(10)).toString();
}

export function installStudentTools(root){
  const getCalculator=()=>root.querySelector("#calculator-dialog");
  const clearResult=()=>{
    const dialog=getCalculator(),use=dialog?.querySelector("[data-calc-use]");
    const result=dialog?.querySelector("#calculator-result");
    if(use)use.disabled=true;
    if(result){result.textContent="Press Calculate = to check.";delete result.dataset.value;}
  };
  const calculate=()=>{
    const dialog=getCalculator();
    const raw=dialog?.querySelector("#calculator-expression")?.value||"";
    const result=dialog?.querySelector("#calculator-result");
    const use=dialog?.querySelector("[data-calc-use]");
    if(!result||!use)return;
    const number=parseAnswer(raw);
    const formatted=number===null?null:formatCalculatorResult(number);
    if(formatted===null){
      result.textContent="Check your expression. A length must be zero or positive.";
      use.disabled=true;delete result.dataset.value;
      return;
    }
    result.textContent="= "+formatted;
    result.dataset.value=formatted;
    use.disabled=!root.querySelector("#answer-input");
  };
  root.addEventListener("click",event=>{
    const button=event.target.closest?.("button");
    if(!button)return;
    if(button.matches("[data-open-guide]")){
      root.querySelector("#guide-dialog")?.showModal();
      return;
    }
    if(button.matches("[data-open-calculator]")){
      const dialog=getCalculator();
      if(!dialog)return;
      const expression=dialog.querySelector("#calculator-expression");
      if(expression)expression.value=root.querySelector("#answer-input")?.value||"";
      clearResult();
      dialog.showModal();
      expression?.focus();
      return;
    }
    if(button.matches("[data-close-student-tool]")){
      button.closest("dialog")?.close();
      return;
    }
    if(button.matches("[data-insert-sqrt]")){
      insertAtCursor(root.querySelector("#answer-input"),"√()",1);
      return;
    }
    if(button.matches("[data-calc-clear]")){
      const input=getCalculator()?.querySelector("#calculator-expression");
      if(input){input.value="";input.focus();}
      clearResult();
      return;
    }
    if(button.matches("[data-calc-equals]")){calculate();return;}
    if(button.matches("[data-calc-use]")){
      const dialog=getCalculator();
      const result=dialog?.querySelector("#calculator-result")?.dataset.value;
      const target=root.querySelector("#answer-input");
      if(result && target){
        target.value=result;target.focus();
        dialog.close();
      }
      return;
    }
    if(button.hasAttribute("data-calc-key")){
      const input=getCalculator()?.querySelector("#calculator-expression");
      if(!input)return;
      const key=button.dataset.calcKey;
      if(key==="backspace"){
        const start=input.selectionStart??input.value.length;
        const end=input.selectionEnd??start;
        const from=start===end?Math.max(0,start-1):start;
        input.setRangeText("",from,end,"end");
        input.focus();
        input.dispatchEvent(new Event("input",{bubbles:true}));
      }else insertAtCursor(input,key);
    }
  });
  root.addEventListener("input",event=>{
    if(event.target?.id==="calculator-expression")clearResult();
  });
  root.addEventListener("keydown",event=>{
    if(event.key==="Enter"&&event.target?.id==="calculator-expression"){
      event.preventDefault();calculate();
    }
  });
}