
(() => {
  const $ = id => document.getElementById(id);
  const card = $('calcCard'), expEl = $('expDisplay'), resEl = $('resDisplay'), list = $('histList');
  let exp = '', res = '0', ans = 0, isRad = false, isInv = false, evaluated = false, history = [];

  const fact = n => (n < 0 || !Number.isInteger(n)) ? NaN : (n <= 1 ? 1 : n * fact(n - 1));
  const toRad = v => isRad ? v : (v * Math.PI) / 180;
  const toDeg = v => isRad ? v : (v * 180) / Math.PI;

  const ctx = {
    Math, fact,
    sin: v => Math.sin(toRad(v)), cos: v => Math.cos(toRad(v)), tan: v => Math.tan(toRad(v)),
    asin: v => toDeg(Math.asin(v)), acos: v => toDeg(Math.acos(v)), atan: v => toDeg(Math.atan(v)),
    ln: Math.log, log: Math.log10
  };

  const tokens = ['asin(', 'acos(', 'atan(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', '√(', '^(1/', 'Ans'];

  const calc = str => {
    if (!str.trim()) return '0';
    const s = str
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/π/g, 'Math.PI').replace(/e(?![a-zA-Z0-9])/g, 'Math.E')
      .replace(/Ans/g, `(${ans})`)
      .replace(/(\d+(\.\d+)?|\([^\(\)]+\))!/g, 'fact($1)')
      .replace(/√\(/g, 'Math.sqrt(').replace(/\^/g, '**')
      .replace(/(\d)(\()/g, '$1*$2').replace(/(\))(\d)/g, '$1*$2').replace(/(\))(\()/g, '$1*$2');

    try {
      const val = new Function('c', `with(c){ return ${s}; }`)(ctx);
      return (typeof val === 'number' && Number.isFinite(val))
        ? Number(parseFloat(val.toPrecision(12)).toFixed(10)).toString()
        : (val?.toString() || '');
    } catch {
      return '';
    }
  };

  const render = () => {
    expEl.textContent = exp;
    resEl.textContent = res || '0';
  };

  const pushVal = v => {
    if (evaluated) {
      exp = ['+', '−', '×', '÷', '%', '^'].includes(v) ? res + v : v;
      evaluated = false;
    } else exp += v;
    const preview = calc(exp);
    if (preview) res = preview;
    render();
  };

  const backspace = () => {
    if (evaluated) {
      exp = '';
      res = '0';
      evaluated = false;
    } else {
      const matched = tokens.find(t => exp.endsWith(t));
      exp = matched ? exp.slice(0, -matched.length) : exp.slice(0, -1);
      res = calc(exp) || '0';
    }
    render();
  };

  const compute = () => {
    if (!exp && res !== '0') exp = res;
    const r = calc(exp);
    if (r) {
      history.unshift({ exp, res: r });
      ans = Number(r);
      res = r;
    } else {
      res = 'Error';
    }
    evaluated = true;
    render();
  };

  const renderHistory = () => {
    list.innerHTML = history.length
      ? history.map((h, i) => `
          <div class="history-item" data-idx="${i}">
            <div class="history-item-exp">${h.exp} =</div>
            <div class="history-item-res">${h.res}</div>
          </div>`).join('')
      : '<div class="history-empty">No calculations yet</div>';
  };

  // Keypad Event Delegation
  $('keypad').onclick = e => {
    const btn = e.target.closest('.calc-btn');
    if (!btn) return;
    const { act, val, invVal } = btn.dataset;

    if (act === 'deg-rad') { isRad = !isRad; card.classList.toggle('is-rad', isRad); return; }
    if (act === 'inv') { isInv = !isInv; card.classList.toggle('is-inv', isInv); return; }
    if (act === 'clear') { exp = ''; res = '0'; evaluated = false; render(); return; }
    if (act === 'back') { backspace(); return; }
    if (act === 'eq') { compute(); return; }
    if (act === 'ans') { pushVal('Ans'); return; }

    const insert = isInv && invVal ? invVal : val;
    if (insert) pushVal(insert);
  };

  // History Controls
  $('histToggle').onclick = () => { renderHistory(); card.classList.add('has-history'); };
  $('histClose').onclick = () => card.classList.remove('has-history');
  $('histClear').onclick = () => { history = []; renderHistory(); };
  list.onclick = e => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    exp = res = history[item.dataset.idx].res.toString();
    evaluated = false;
    render();
    card.classList.remove('has-history');
  };

  // Keyboard Shortcuts
  const keyMap = { '+': '+', '-': '−', '*': '×', '/': '÷', '(': '(', ')': ')', '%': '%' };
  window.onkeydown = e => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') pushVal(e.key);
    else if (keyMap[e.key]) { e.preventDefault(); pushVal(keyMap[e.key]); }
    else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); compute(); }
    else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
    else if (e.key === 'Escape') { exp = ''; res = '0'; evaluated = false; render(); }
  };
})();
