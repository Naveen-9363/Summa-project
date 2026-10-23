# ⚡ NEO-CALC // Neubrutalist Calculator

A bold, tactile web calculator built in the **Neubrutalism (New Brutalism)** design style with rich micro-animations, synthesized audio feedback, paper tape calculation history, and multiple theme palettes.

![Neubrutalism Design](https://img.shields.io/badge/Design-Neubrutalism-FFE600?style=for-the-badge&logoColor=000&labelColor=000)
![Vanilla Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20JS-FF5E5E?style=for-the-badge&logoColor=fff&labelColor=000)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-4ADE80?style=for-the-badge&logoColor=000&labelColor=000)

---

## ✨ Features

- **💥 Neubrutalism Aesthetic**: 
  - Thick high-contrast 3.5px solid black borders
  - Hard non-diffused offset drop shadows (`5px 5px 0px #000`)
  - Tactile physical button depressions on hover and click
  - Retro-modern typography powered by **Space Grotesk** and **JetBrains Mono**
- **🎨 4 Curated Themes**:
  - **Canary Yellow** (Warm cream, sunny yellow, sky blue)
  - **Bubblegum Pop** (Pastel pink, hot magenta, electric cyan)
  - **Cyber Acid** (Vibrant chartreuse, lime green, neon purple)
  - **Dark Brutalism / Noir** (Sleek charcoal dark mode with neon accents)
- **🧾 Paper Tape Receipt (Calculation History)**:
  - Retro paper receipt roll with serrated zig-zag edges
  - Automatic timestamping and tape reference IDs
  - Click any entry or press **REUSE ↵** to load previous results directly back into the calculator
  - Calculations persist across browser refreshes via `localStorage`
- **🔊 Tactile Web Audio Synthesizer**:
  - Zero external sound files — real-time audio synthesis via the Web Audio API
  - Mechanical typewriter clicks on numeric keys, resonant pops on operators, and chords on solution
  - Toggle sound on/off with persistent preferences
- **💾 Memory Registers & Math Functions**:
  - Full memory registers: `MC` (Clear), `MR` (Recall), `M+` (Add), `M-` (Subtract)
  - `√x` (Square Root), `x²` (Square), `%` (Percentage), `±` (Toggle Sign)
  - Safe floating-point arithmetic engine (handles precision quirks like `0.1 + 0.2 = 0.3`)
- **⌨️ Keyboard Shortcuts with Visual Press Feedback**:
  - Type with your physical keyboard; keys visually press down on screen in real time
- **📋 One-Click Clipboard Copy**:
  - Copy calculation results instantly with a Neubrutalist tooltip confirmation

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` - `9` | Digits |
| `.` | Decimal point |
| `+` `-` `*` `/` | Arithmetic operators |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last digit |
| `Escape` | All Clear (`AC`) |
| `%` | Percentage |

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser — no build steps or dependencies required!

```bash
# Clone the repository
git clone https://github.com/Naveen-9363/Summa-project.git

# Navigate into directory
cd Summa-project

# Open in browser (Windows)
start index.html
```

Or run a local static server:
```bash
npx serve .
```

---

## 📄 License
MIT License. Built with ⚡ in Raw Neubrutalism Style.
