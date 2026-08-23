const fs = require('fs');
const path = require('path');

const map = {
  // Layout Backgrounds
  'bg-\\[#FDFDFD\\] dark:bg-\\[#0f172a\\]': 'bg-slate-50 dark:bg-black',
  'bg-\\[#DCD0FF\\]/70 dark:bg-gray-900/70': 'bg-white dark:bg-[#0a0a0a]',
  'border-\\[#DCD0FF\\]/50 dark:border-gray-800': 'border-slate-200 dark:border-[#222]',
  'bg-surface-base dark:bg-gray-900/40': 'bg-slate-50/80 dark:bg-black/80',
  'bg-surface-base': 'bg-slate-50 dark:bg-black',

  // Cards & Containers
  'bg-white dark:bg-gray-800': 'bg-white dark:bg-[#111111]',
  'bg-gray-50 dark:bg-gray-900': 'bg-slate-50 dark:bg-black',
  'bg-gray-100 dark:bg-gray-800': 'bg-slate-100 dark:bg-[#111111]',
  'bg-gray-200 dark:bg-gray-700': 'bg-slate-200 dark:bg-[#222]',
  
  // Opacity versions
  'bg-white/60 dark:bg-gray-800/60': 'bg-white/60 dark:bg-[#111111]/60',
  'bg-white/80 dark:bg-gray-800/80': 'bg-white/80 dark:bg-[#111111]/80',
  'bg-white/50 dark:bg-gray-800/50': 'bg-white/50 dark:bg-[#111111]/50',
  'bg-white/40 dark:bg-gray-800/40': 'bg-white/40 dark:bg-[#111111]/40',

  // Borders
  'border-gray-100 dark:border-gray-700': 'border-slate-200 dark:border-[#222]',
  'border-gray-200 dark:border-gray-700': 'border-slate-200 dark:border-[#222]',
  'border-gray-300 dark:border-gray-600': 'border-slate-300 dark:border-[#333]',
  'divide-gray-200 dark:divide-gray-700': 'divide-slate-200 dark:divide-[#222]',
  'divide-gray-100 dark:divide-gray-800': 'divide-slate-100 dark:divide-[#222]',

  // Special fixes for MyAttendance cards
  'border border-gray-100': 'border border-slate-200 dark:border-[#222]'
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
        // We can just use split and join for exact literal string replacement
        if (content.includes(oldClass)) {
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
console.log('Contrast fix applied.');
