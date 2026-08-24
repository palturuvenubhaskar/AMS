const fs = require('fs');
const path = require('path');

const map = {
  'dark:bg-slate-900': 'dark:bg-dark-bg',
  'dark:bg-slate-800': 'dark:bg-dark-card',
  'dark:bg-slate-700': 'dark:bg-dark-hover',
  'dark:border-slate-700': 'dark:border-dark-border',
  'dark:border-slate-800': 'dark:border-dark-border',
  'dark:divide-slate-700': 'dark:divide-dark-border',
  'dark:divide-slate-800': 'dark:divide-dark-border',
  'dark:bg-slate-800/50': 'dark:bg-dark-card/50',
  'dark:bg-slate-800/60': 'dark:bg-dark-card/60',
  'dark:bg-slate-800/80': 'dark:bg-dark-card/80',
  'dark:bg-slate-900/50': 'dark:bg-dark-bg/50',
  'dark:bg-slate-900/70': 'dark:bg-dark-bg/70',
  'dark:bg-slate-900/80': 'dark:bg-dark-bg/80',
  'dark:bg-slate-900/40': 'dark:bg-dark-bg/40',
  'dark:bg-slate-700/50': 'dark:bg-dark-hover/50',
  'dark:border-slate-700/50': 'dark:border-dark-border/50',
  'dark:border-slate-700/60': 'dark:border-dark-border/60',
  // Catch any remaining hardcoded ones just in case
  'dark:bg-black': 'dark:bg-dark-bg',
  'dark:bg-[#111111]': 'dark:bg-dark-card',
  'dark:bg-[#0a0a0a]': 'dark:bg-dark-bg'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [oldClass, newClass] of Object.entries(map)) {
        if (content.includes(oldClass)) {
          // Splitting and joining ensures all instances are replaced
          content = content.split(oldClass).join(newClass);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated to new premium dark: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Applied new premium dark theme from image reference.');
