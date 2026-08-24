const fs = require('fs');
const path = require('path');

const map = {
  'dark:bg-dark-bg': 'dark:bg-premium-bg',
  'dark:bg-dark-card': 'dark:bg-premium-card',
  'dark:bg-dark-hover': 'dark:bg-premium-hover',
  'dark:border-dark-border': 'dark:border-premium-border',
  'dark:divide-dark-border': 'dark:divide-premium-border',
  // Also ensure text that might have been missed gets a dark variant
  'text-slate-900': 'text-slate-900 dark:text-slate-100',
  'text-gray-900': 'text-gray-900 dark:text-slate-100',
  'text-gray-700': 'text-gray-700 dark:text-gray-300',
  'text-gray-500': 'text-gray-500 dark:text-gray-400',
  // But be careful not to double up if it already has dark:text-
  'dark:text-slate-100 dark:text-slate-100': 'dark:text-slate-100',
  'dark:text-gray-300 dark:text-gray-300': 'dark:text-gray-300',
  'dark:text-gray-400 dark:text-gray-400': 'dark:text-gray-400',
  'dark:text-slate-100 dark:text-gray-300': 'dark:text-slate-100', // Just in case
  'dark:text-slate-100 dark:text-gray-400': 'dark:text-slate-100'
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
          content = content.split(oldClass).join(newClass);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated to premium: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Fixed Tailwind variant conflict by using premium colors.');
