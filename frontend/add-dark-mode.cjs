const fs = require('fs');
const path = require('path');

const map = {
  // Backgrounds
  'bg-white(?!/)': 'bg-white dark:bg-gray-800',
  'bg-surface-base': 'bg-surface-base dark:bg-gray-900',
  'bg-gray-50(?!/)': 'bg-gray-50 dark:bg-gray-900',
  'bg-gray-100(?!/)': 'bg-gray-100 dark:bg-gray-800',
  'bg-gray-200(?!/)': 'bg-gray-200 dark:bg-gray-700',
  'bg-white/60': 'bg-white/60 dark:bg-gray-800/60',
  'bg-white/80': 'bg-white/80 dark:bg-gray-800/80',
  'bg-white/50': 'bg-white/50 dark:bg-gray-800/50',
  'bg-white/40': 'bg-white/40 dark:bg-gray-800/40',
  
  // Text
  'text-gray-900': 'text-gray-900 dark:text-gray-100',
  'text-gray-800': 'text-gray-800 dark:text-gray-200',
  'text-gray-700': 'text-gray-700 dark:text-gray-300',
  'text-gray-600': 'text-gray-600 dark:text-gray-400',
  'text-gray-500': 'text-gray-500 dark:text-gray-400',
  
  // Borders
  'border-gray-200': 'border-gray-200 dark:border-gray-700',
  'border-gray-300': 'border-gray-300 dark:border-gray-600',
  'border-white/60': 'border-white/60 dark:border-gray-700/60',
  'border-white/20': 'border-white/20 dark:border-gray-700/20',
  'divide-gray-200': 'divide-gray-200 dark:divide-gray-700',
  'divide-gray-100': 'divide-gray-100 dark:divide-gray-800',

  // Rings
  'ring-gray-900/5': 'ring-gray-900/5 dark:ring-white/10'
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
        // Regex to replace only if the dark equivalent is not already there
        // and match standard class boundaries
        const regexStr = `\\b${oldClass}\\b(?!\\s+dark:)`;
        const regex = new RegExp(regexStr, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, newClass);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Dark mode classes applied.');
