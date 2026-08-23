const fs = require('fs');
const path = require('path');

const layoutsDir = path.join(__dirname, 'src', 'components', 'layouts');
const files = fs.readdirSync(layoutsDir);

for (const file of files) {
  if (!file.endsWith('Layout.jsx')) continue;
  const fullPath = path.join(layoutsDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix hardcoded backgrounds
  content = content.replace(/bg-\[#FDFDFD\]/g, 'bg-[#FDFDFD] dark:bg-[#0f172a]');
  content = content.replace(/bg-\[#DCD0FF\]\/70/g, 'bg-[#DCD0FF]/70 dark:bg-gray-900/70');
  content = content.replace(/border-\[#DCD0FF\]\/50/g, 'border-[#DCD0FF]/50 dark:border-gray-800');

  // If this file does NOT have the theme toggle, add it
  if (!content.includes('toggleTheme')) {
    // 1. Add useTheme import if missing
    if (!content.includes("from '../../contexts/ThemeContext'")) {
      content = content.replace(
        /import { Outlet.*? } from 'react-router-dom';/,
        "import { Outlet, useLocation, useNavigate } from 'react-router-dom';\nimport { useTheme } from '../../contexts/ThemeContext';"
      );
    }
    
    // 2. Add Moon, Sun to lucide-react imports
    if (content.includes('lucide-react')) {
      if (!content.includes('Sun,')) content = content.replace(/} from 'lucide-react';/, ', Sun } from \'lucide-react\';');
      if (!content.includes('Moon,')) content = content.replace(/} from 'lucide-react';/, ', Moon } from \'lucide-react\';');
    }

    // 3. Extract useTheme hook inside component
    content = content.replace(
      /const location = useLocation\(\);/,
      "const location = useLocation();\n  const { theme, toggleTheme } = useTheme();"
    );

    // 4. Inject button before NotificationBell
    const buttonHtml = `<button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-glass flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-purple hover:scale-105 transition-all border border-gray-100 dark:border-gray-700">
                {theme === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
              </button>\n              `;
    
    content = content.replace(
      /(<NotificationBell className="[^"]+" \/>)/,
      buttonHtml + "$1"
    );
  } else {
    // StudentLayout already has the toggle, but let's make sure its border has a dark variant
    content = content.replace(/border-gray-100">/, 'border-gray-100 dark:border-gray-700">');
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Patched ${file}`);
}
