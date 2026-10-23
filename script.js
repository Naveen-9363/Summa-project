/**
 * NEO-CALC: Neubrutalism Calculator Engine
 * Features:
 *  - Floating-point safe arithmetic
 *  - Tactile Web Audio API sound synthesizer (mechanical clicks & chimes)
 *  - Paper tape calculation history with localStorage persistence
 *  - Memory registers (MC, MR, M+, M-)
 *  - Multi-theme engine (Canary, Bubblegum, Cyber, Noir)
 *  - Full keyboard shortcuts with animated physical press visual feedback
 *  - Clipboard copy with Neubrutalist tooltip
 */

(() => {
  'use strict';

  // --- State Management ---
  const state = {
    currentInput: '0',
    previousOperand: null,
    operator: null,
    waitingForSecondOperand: false,
    lastCalculated: false,
    memoryValue: 0,
    soundEnabled: true,
    currentTheme: 'canary',
    history: []
  };

  // --- DOM Elements ---
  const mainDisplay = document.getElementById('mainDisplay');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const copyBtn = document.getElementById('copyBtn');
  const copyFeedback = document.getElementById('copyFeedback');
  const memoryIndicator = document.getElementById('memoryIndicator');
  const soundToggle = document.getElementById('soundToggle');
  const soundStatus = document.getElementById('soundStatus');
  const soundIcon = document.getElementById('soundIcon');
  const themeDropdownBtn = document.getElementById('themeDropdownBtn');
  const themeDropdownWrapper = themeDropdownBtn?.parentElement;
  const currentThemeLabel = document.getElementById('currentThemeLabel');
  const themeOptions = document.querySelectorAll('.theme-option');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyPanel = document.getElementById('historyPanel');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');
  const historyCountBadge = document.getElementById('historyCountBadge');
  const keypad = document.querySelector('.keypad-grid');
  const functionsBar = document.querySelector('.functions-bar');

  // Backdrop for mobile history view
  let mobileBackdrop = null;

  // --- Web Audio Synthesizer (Zero Audio Files Needed) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type = 'click') {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      if (type === 'click') {
        // Crisp mechanical typewriter click
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'operator') {
        // Resonant pop sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'equals') {
        // Satisfying two-tone chord
        [523.25, 659.25, 783.99].forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + index * 0.04);
          gain.gain.setValueAtTime(0.2, now + index * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.2 + index * 0.04);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + index * 0.04);
          osc.stop(now + 0.25 + index * 0.04);
        });
      } else if (type === 'clear') {
        // Low dump thud
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'error') {
        // Glitch buzzy sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(110, now + 0.07);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {
      // AudioContext policy fallback gracefully
    }
  }

  // --- Display Formatting & Dynamic Text Size ---
  function formatNumber(numStr) {
    if (numStr === 'Error' || numStr === 'NaN' || numStr === 'Infinity' || numStr === '-Infinity') {
      return numStr;
    }
    // Handle floating points and trailing dot
    const parts = numStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Format integer part with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  }

  function adjustDisplayFontSize() {
    const rawLen = mainDisplay.value.length;
    mainDisplay.classList.remove('text-large', 'text-medium', 'text-small', 'text-tiny');

    if (rawLen <= 8) {
      mainDisplay.classList.add('text-large');
    } else if (rawLen <= 11) {
      mainDisplay.classList.add('text-medium');
    } else if (rawLen <= 14) {
      mainDisplay.classList.add('text-small');
    } else {
      mainDisplay.classList.add('text-tiny');
    }
  }

  function updateDisplay() {
    mainDisplay.value = formatNumber(state.currentInput);
    adjustDisplayFontSize();

    // Expression preview display
    if (state.operator && state.previousOperand !== null) {
      const formattedPrev = formatNumber(state.previousOperand.toString());
      if (state.waitingForSecondOperand) {
        expressionDisplay.textContent = `${formattedPrev} ${state.operator}`;
      } else {
        expressionDisplay.textContent = `${formattedPrev} ${state.operator} ${formatNumber(state.currentInput)}`;
      }
    } else {
      expressionDisplay.textContent = '';
    }
  }

  // --- Safe Floating-point Math Engine ---
  function safeMath(first, second, op) {
    const a = parseFloat(first);
    const b = parseFloat(second);

    if (Number.isNaN(a) || Number.isNaN(b)) return 'Error';

    let result;
    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
      case '−':
        result = a - b;
        break;
      case '×':
      case '*':
        result = a * b;
        break;
      case '÷':
      case '/':
        if (b === 0) return 'Error';
        result = a / b;
        break;
      default:
        return b;
    }

    if (!Number.isFinite(result)) return 'Error';

    // Fix JavaScript floating point rounding (e.g. 0.1 + 0.2)
    return parseFloat(result.toPrecision(12));
  }

  // --- Calculator Logic Handlers ---
  function inputDigit(digit) {
    playSound('click');

    if (state.currentInput === 'Error') {
      state.currentInput = digit;
      state.waitingForSecondOperand = false;
      state.lastCalculated = false;
      updateDisplay();
      return;
    }

    if (state.waitingForSecondOperand) {
      state.currentInput = digit;
      state.waitingForSecondOperand = false;
    } else {
      if (state.lastCalculated) {
        state.currentInput = digit;
        state.lastCalculated = false;
      } else {
        if (state.currentInput === '0') {
          state.currentInput = digit;
        } else {
          // Limit max input length
          if (state.currentInput.replace(/[-.]/g, '').length < 15) {
            state.currentInput += digit;
          }
        }
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    playSound('click');

    if (state.currentInput === 'Error' || state.lastCalculated) {
      state.currentInput = '0.';
      state.lastCalculated = false;
      state.waitingForSecondOperand = false;
      updateDisplay();
      return;
    }

    if (state.waitingForSecondOperand) {
      state.currentInput = '0.';
      state.waitingForSecondOperand = false;
      updateDisplay();
      return;
    }

    if (!state.currentInput.includes('.')) {
      state.currentInput += '.';
      updateDisplay();
    }
  }

  function handleOperator(nextOp) {
    playSound('operator');

    if (state.currentInput === 'Error') return;

    const inputValue = parseFloat(state.currentInput);

    if (state.operator && state.waitingForSecondOperand) {
      state.operator = nextOp;
      updateDisplay();
      return;
    }

    if (state.previousOperand === null && !Number.isNaN(inputValue)) {
      state.previousOperand = inputValue;
    } else if (state.operator) {
      const calculation = safeMath(state.previousOperand, inputValue, state.operator);

      if (calculation === 'Error') {
        playSound('error');
        state.currentInput = 'Error';
        state.previousOperand = null;
        state.operator = null;
        state.waitingForSecondOperand = false;
        updateDisplay();
        return;
      }

      state.currentInput = String(calculation);
      state.previousOperand = calculation;
    }

    state.waitingForSecondOperand = true;
    state.operator = nextOp;
    state.lastCalculated = false;
    updateDisplay();
  }

  function handleCalculate() {
    if (state.currentInput === 'Error') return;
    if (state.operator === null || state.previousOperand === null) {
      playSound('click');
      return;
    }

    const currentVal = parseFloat(state.currentInput);
    const expressionString = `${formatNumber(state.previousOperand.toString())} ${state.operator} ${formatNumber(state.currentInput)}`;
    const result = safeMath(state.previousOperand, currentVal, state.operator);

    if (result === 'Error') {
      playSound('error');
      state.currentInput = 'Error';
      expressionDisplay.textContent = `${expressionString} = 0 division!`;
      state.previousOperand = null;
      state.operator = null;
      state.waitingForSecondOperand = false;
      state.lastCalculated = true;
      adjustDisplayFontSize();
      return;
    }

    playSound('equals');
    const resultString = String(result);

    // Save calculation to History Paper Tape
    addHistoryEntry(expressionString, resultString);

    expressionDisplay.textContent = `${expressionString} =`;
    state.currentInput = resultString;
    state.previousOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
    state.lastCalculated = true;

    mainDisplay.value = formatNumber(resultString);
    adjustDisplayFontSize();
  }

  function handleClearAll() {
    playSound('clear');
    state.currentInput = '0';
    state.previousOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
    state.lastCalculated = false;
    updateDisplay();
  }

  function handleDelete() {
    playSound('click');
    if (state.currentInput === 'Error' || state.lastCalculated) {
      handleClearAll();
      return;
    }

    if (state.currentInput.length > 1) {
      state.currentInput = state.currentInput.slice(0, -1);
      // Clean trailing minus
      if (state.currentInput === '-') {
        state.currentInput = '0';
      }
    } else {
      state.currentInput = '0';
    }
    updateDisplay();
  }

  function handleNegate() {
    playSound('click');
    if (state.currentInput === '0' || state.currentInput === 'Error') return;

    if (state.currentInput.startsWith('-')) {
      state.currentInput = state.currentInput.slice(1);
    } else {
      state.currentInput = `-${state.currentInput}`;
    }
    updateDisplay();
  }

  function handlePercent() {
    playSound('operator');
    if (state.currentInput === 'Error') return;

    const val = parseFloat(state.currentInput);
    if (Number.isNaN(val)) return;

    let res;
    if (state.previousOperand !== null && (state.operator === '+' || state.operator === '-')) {
      // e.g. 200 + 10% = 200 + 20
      res = (state.previousOperand * val) / 100;
    } else {
      res = val / 100;
    }

    state.currentInput = String(parseFloat(res.toPrecision(12)));
    updateDisplay();
  }

  function handleSquareRoot() {
    playSound('operator');
    if (state.currentInput === 'Error') return;

    const val = parseFloat(state.currentInput);
    if (val < 0) {
      playSound('error');
      state.currentInput = 'Error';
      updateDisplay();
      return;
    }

    const res = Math.sqrt(val);
    const resultString = String(parseFloat(res.toPrecision(12)));
    addHistoryEntry(`√(${formatNumber(state.currentInput)})`, resultString);
    state.currentInput = resultString;
    state.lastCalculated = true;
    updateDisplay();
  }

  function handleSquare() {
    playSound('operator');
    if (state.currentInput === 'Error') return;

    const val = parseFloat(state.currentInput);
    const res = val * val;
    const resultString = String(parseFloat(res.toPrecision(12)));
    addHistoryEntry(`sqr(${formatNumber(state.currentInput)})`, resultString);
    state.currentInput = resultString;
    state.lastCalculated = true;
    updateDisplay();
  }

  // --- Memory Functionality ---
  function updateMemoryIndicator() {
    if (state.memoryValue !== 0) {
      memoryIndicator.classList.remove('hidden');
      memoryIndicator.title = `Memory: ${state.memoryValue}`;
    } else {
      memoryIndicator.classList.add('hidden');
    }
  }

  function handleMemory(action) {
    playSound('operator');
    const val = parseFloat(state.currentInput);

    switch (action) {
      case 'mc':
        state.memoryValue = 0;
        break;
      case 'mr':
        if (state.memoryValue !== 0) {
          state.currentInput = String(state.memoryValue);
          state.waitingForSecondOperand = false;
          state.lastCalculated = true;
          updateDisplay();
        }
        break;
      case 'm-plus':
        if (!Number.isNaN(val) && state.currentInput !== 'Error') {
          state.memoryValue = parseFloat((state.memoryValue + val).toPrecision(12));
        }
        break;
      case 'm-minus':
        if (!Number.isNaN(val) && state.currentInput !== 'Error') {
          state.memoryValue = parseFloat((state.memoryValue - val).toPrecision(12));
        }
        break;
    }
    updateMemoryIndicator();
  }

  // --- Calculation History (Paper Tape) ---
  function loadHistory() {
    try {
      const saved = localStorage.getItem('neo_calc_history');
      if (saved) {
        state.history = JSON.parse(saved);
      }
    } catch {
      state.history = [];
    }
    renderHistory();
  }

  function saveHistory() {
    try {
      localStorage.setItem('neo_calc_history', JSON.stringify(state.history.slice(0, 50)));
    } catch {
      // Storage full or private mode
    }
  }

  function addHistoryEntry(expression, result) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const entry = {
      id: Date.now(),
      time: timeStr,
      expression,
      result
    };

    state.history.unshift(entry);
    if (state.history.length > 50) {
      state.history.pop();
    }
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (!historyList) return;

    historyCountBadge.textContent = state.history.length;

    if (state.history.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <div class="empty-emoji">📝</div>
          <p><strong>Tape is empty!</strong></p>
          <span>Run a calculation and your tape receipt will print here.</span>
        </div>
      `;
      return;
    }

    historyList.innerHTML = '';
    state.history.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      itemEl.setAttribute('role', 'listitem');
      itemEl.title = 'Click to reload this result into calculator';
      itemEl.innerHTML = `
        <div class="history-item-top">
          <span class="history-time">${item.time}</span>
          <span class="history-tag">TAPE #${item.id.toString().slice(-4)}</span>
        </div>
        <div class="history-expression">${item.expression}</div>
        <div class="history-result-row">
          <span class="history-result">= ${formatNumber(item.result)}</span>
          <button class="history-reuse-btn" type="button" aria-label="Reuse calculation result">REUSE ↵</button>
        </div>
      `;

      // Clicking the item or reuse button sets current input
      itemEl.addEventListener('click', () => {
        playSound('click');
        state.currentInput = item.result;
        state.waitingForSecondOperand = false;
        state.lastCalculated = true;
        updateDisplay();

        // Flash animation
        itemEl.style.transform = 'scale(0.97)';
        setTimeout(() => { itemEl.style.transform = ''; }, 100);

        // On mobile, close drawer after selection
        if (window.innerWidth < 820 && historyPanel.classList.contains('mobile-open')) {
          toggleHistoryPanel(false);
        }
      });

      historyList.appendChild(itemEl);
    });
  }

  function clearHistory() {
    playSound('clear');
    state.history = [];
    saveHistory();
    renderHistory();
  }

  function toggleHistoryPanel(forceState) {
    playSound('click');
    const isMobile = window.innerWidth < 820;

    if (isMobile) {
      const willOpen = forceState !== undefined ? forceState : !historyPanel.classList.contains('mobile-open');
      if (willOpen) {
        historyPanel.classList.add('mobile-open');
        if (!mobileBackdrop) {
          mobileBackdrop = document.createElement('div');
          mobileBackdrop.className = 'modal-backdrop';
          mobileBackdrop.addEventListener('click', () => toggleHistoryPanel(false));
          document.body.appendChild(mobileBackdrop);
        }
      } else {
        historyPanel.classList.remove('mobile-open');
        if (mobileBackdrop) {
          mobileBackdrop.remove();
          mobileBackdrop = null;
        }
      }
    } else {
      // Desktop toggle collapse/expand
      if (historyPanel.style.display === 'none') {
        historyPanel.style.display = 'flex';
      } else {
        historyPanel.style.display = 'none';
      }
    }
  }

  // --- Clipboard Copy Feature ---
  function copyToClipboard() {
    playSound('click');
    const cleanVal = state.currentInput;
    navigator.clipboard.writeText(cleanVal).then(() => {
      copyFeedback.classList.add('show');
      setTimeout(() => {
        copyFeedback.classList.remove('show');
      }, 1600);
    }).catch(() => {
      // Fallback
      const temp = document.createElement('textarea');
      temp.value = cleanVal;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      copyFeedback.classList.add('show');
      setTimeout(() => {
        copyFeedback.classList.remove('show');
      }, 1600);
    });
  }

  // --- Sound Toggle Feature ---
  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    try {
      localStorage.setItem('neo_calc_sound', state.soundEnabled ? 'true' : 'false');
    } catch {
      // storage unavailable
    }

    if (state.soundEnabled) {
      soundStatus.textContent = 'ON';
      soundIcon.textContent = '🔊';
      soundToggle.classList.remove('muted');
      playSound('click');
    } else {
      soundStatus.textContent = 'OFF';
      soundIcon.textContent = '🔇';
      soundToggle.classList.add('muted');
    }
  }

  function loadSoundSetting() {
    try {
      const saved = localStorage.getItem('neo_calc_sound');
      if (saved !== null) {
        state.soundEnabled = saved === 'true';
      }
    } catch {
      state.soundEnabled = true;
    }
    soundStatus.textContent = state.soundEnabled ? 'ON' : 'OFF';
    soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    if (!state.soundEnabled) {
      soundToggle.classList.add('muted');
    }
  }

  // --- Theme Engine ---
  function setTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    themeOptions.forEach(opt => {
      if (opt.dataset.theme === theme) {
        opt.classList.add('active');
        if (currentThemeLabel) {
          currentThemeLabel.textContent = theme.toUpperCase();
        }
      } else {
        opt.classList.remove('active');
      }
    });

    try {
      localStorage.setItem('neo_calc_theme', theme);
    } catch {
      // LocalStorage quota/incognito
    }
  }

  function loadTheme() {
    try {
      const savedTheme = localStorage.getItem('neo_calc_theme');
      if (savedTheme && ['canary', 'bubblegum', 'cyber', 'noir'].includes(savedTheme)) {
        setTheme(savedTheme);
        return;
      }
    } catch {
      // fallback
    }
    setTheme('canary');
  }

  // --- Keyboard Shortcuts & Visual Animation Feedback ---
  function findButtonForKeyboardKey(e) {
    const key = e.key;

    if (key >= '0' && key <= '9') {
      return document.querySelector(`[data-action="number"][data-value="${key}"]`);
    }
    if (key === '.') {
      return document.querySelector('[data-action="decimal"]');
    }
    if (key === '+' || key === '-') {
      return document.querySelector(`[data-action="operator"][data-value="${key}"]`);
    }
    if (key === '*') {
      return document.querySelector('[data-action="operator"][data-value="×"]');
    }
    if (key === '/') {
      return document.querySelector('[data-action="operator"][data-value="÷"]');
    }
    if (key === 'Enter' || key === '=') {
      return document.querySelector('[data-action="calculate"]');
    }
    if (key === 'Backspace') {
      return document.querySelector('[data-action="delete"]');
    }
    if (key === 'Escape') {
      return document.querySelector('[data-action="clear-all"]');
    }
    if (key === '%') {
      return document.querySelector('[data-action="percent"]');
    }
    return null;
  }

  function handleKeyDown(e) {
    // Avoid interfering if user is focused inside an interactive field
    if (e.target && e.target.tagName === 'INPUT' && e.target !== mainDisplay) {
      return;
    }

    const targetBtn = findButtonForKeyboardKey(e);

    if (targetBtn) {
      e.preventDefault();
      // Add animated Neubrutalist push state
      targetBtn.classList.add('key-pressed');

      const action = targetBtn.dataset.action;
      const value = targetBtn.dataset.value;

      switch (action) {
        case 'number':
          inputDigit(value);
          break;
        case 'decimal':
          inputDecimal();
          break;
        case 'operator':
          handleOperator(value);
          break;
        case 'calculate':
          handleCalculate();
          break;
        case 'delete':
          handleDelete();
          break;
        case 'clear-all':
          handleClearAll();
          break;
        case 'percent':
          handlePercent();
          break;
      }
    }
  }

  function handleKeyUp(e) {
    const targetBtn = findButtonForKeyboardKey(e);
    if (targetBtn) {
      targetBtn.classList.remove('key-pressed');
    }
  }

  // --- Click & Touch Event Delegation ---
  function setupEventListeners() {
    // Keypad Clicks
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.key-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const val = btn.dataset.value;

        switch (action) {
          case 'number':
            inputDigit(val);
            break;
          case 'decimal':
            inputDecimal();
            break;
          case 'operator':
            handleOperator(val);
            break;
          case 'calculate':
            handleCalculate();
            break;
          case 'clear-all':
            handleClearAll();
            break;
          case 'delete':
            handleDelete();
            break;
          case 'negate':
            handleNegate();
            break;
          case 'percent':
            handlePercent();
            break;
        }
      });
    }

    // Extended Function & Memory Bar Clicks
    if (functionsBar) {
      functionsBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.fn-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action.startsWith('m')) {
          handleMemory(action);
        } else if (action === 'sqrt') {
          handleSquareRoot();
        } else if (action === 'square') {
          handleSquare();
        }
      });
    }

    // Screen Copy
    if (copyBtn) {
      copyBtn.addEventListener('click', copyToClipboard);
    }

    // Sound Toggle
    if (soundToggle) {
      soundToggle.addEventListener('click', toggleSound);
    }

    // Theme Picker
    if (themeDropdownBtn && themeDropdownWrapper) {
      themeDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSound('click');
        const isOpen = themeDropdownWrapper.classList.toggle('open');
        themeDropdownBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          playSound('click');
          const chosenTheme = opt.dataset.theme;
          setTheme(chosenTheme);
          themeDropdownWrapper.classList.remove('open');
          themeDropdownBtn.setAttribute('aria-expanded', 'false');
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!themeDropdownWrapper.contains(e.target)) {
          themeDropdownWrapper.classList.remove('open');
          themeDropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // History Panel Controls
    if (historyToggleBtn) {
      historyToggleBtn.addEventListener('click', () => toggleHistoryPanel());
    }
    if (closeHistoryBtn) {
      closeHistoryBtn.addEventListener('click', () => toggleHistoryPanel(false));
    }
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', clearHistory);
    }

    // Global Keyboard Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }

  // --- Initialization ---
  function init() {
    loadTheme();
    loadSoundSetting();
    loadHistory();
    updateDisplay();
    setupEventListeners();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
