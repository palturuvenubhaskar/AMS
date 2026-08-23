const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const newVariables = `:root {
  /* ================== LIGHT THEME (Default) ================== */
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --bg-card: #ffffff;
  --bg-card-hover: #f8fafc;
  --bg-input: #ffffff;
  --bg-sidebar: #ffffff;
  
  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;
  --text-inverse: #ffffff;
  
  --border-primary: rgba(0, 0, 0, 0.08);
  --border-hover: rgba(0, 0, 0, 0.15);
  --border-accent: rgba(99, 102, 241, 0.3);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.15);
  
  /* Shared Accent Colors */
  --accent-primary: #6366f1;
  --accent-primary-hover: #818cf8;
  --accent-secondary: #8b5cf6;
  --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  
  /* Zone Colors */
  --zone-green: #10b981;
  --zone-green-bg: rgba(16, 185, 129, 0.12);
  --zone-yellow: #f59e0b;
  --zone-yellow-bg: rgba(245, 158, 11, 0.12);
  --zone-red: #ef4444;
  --zone-red-bg: rgba(239, 68, 68, 0.12);

  /* Sizing & Constants */
  --sidebar-width: 260px;
  --header-height: 64px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}

.dark {
  /* ================== PURE BLACK DARK THEME ================== */
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-card: #111111;
  --bg-card-hover: #1a1a1a;
  --bg-input: #111111;
  --bg-sidebar: #050505;
  
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --text-inverse: #000000;
  
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.2);
  --border-accent: rgba(99, 102, 241, 0.3);

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.8);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.9);
  --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.15);
}`;

// Find the start of :root and the end of the last closing brace before * { margin: 0;
const startIdx = css.indexOf(':root {');
const endMarker = '* { margin: 0; padding: 0; box-sizing: border-box; }';
const endIdx = css.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const finalCss = css.substring(0, startIdx) + newVariables + '\n\n' + css.substring(endIdx);
  fs.writeFileSync(cssPath, finalCss, 'utf8');
  console.log('index.css successfully rebuilt!');
} else {
  console.log('Failed to find indices');
}
