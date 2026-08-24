const fs = require('fs');
const path = require('path');

const map = {
  'dark:bg-black': 'dark:bg-slate-900',
  'dark:bg-[#0a0a0a]': 'dark:bg-slate-900',
  'dark:bg-[#111111]': 'dark:bg-slate-800',
  'dark:border-[#222]': 'dark:border-slate-700',
  'dark:divide-[#222]': 'dark:divide-slate-700',
  'dark:bg-[#222]': 'dark:bg-slate-700',
  'dark:border-[#333]': 'dark:border-slate-600',
  'dark:bg-[#0f172a]': 'dark:bg-slate-900',
  'dark:bg-gray-900': 'dark:bg-slate-900',
  'dark:bg-gray-800': 'dark:bg-slate-800',
  'dark:bg-gray-700': 'dark:bg-slate-700',
  'dark:border-gray-700': 'dark:border-slate-700',
  'dark:border-gray-800': 'dark:border-slate-800',
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
          // Use split join to replace all occurrences
          content = content.split(oldClass).join(newClass);
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
console.log('Dark theme improved!');
