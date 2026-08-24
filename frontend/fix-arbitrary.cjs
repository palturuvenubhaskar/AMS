const fs = require('fs');
const path = require('path');

const map = {
  'dark:bg-premium-bg': 'dark:bg-[#050505]',
  'dark:bg-premium-card': 'dark:bg-[#12141d]',
  'dark:bg-premium-hover': 'dark:bg-[#1a1c26]',
  'dark:border-premium-border': 'dark:border-[#222430]',
  'dark:divide-premium-border': 'dark:divide-[#222430]',
  'dark:bg-premium-card/50': 'dark:bg-[#12141d]/50',
  'dark:bg-premium-card/60': 'dark:bg-[#12141d]/60',
  'dark:bg-premium-card/80': 'dark:bg-[#12141d]/80',
  'dark:bg-premium-bg/50': 'dark:bg-[#050505]/50',
  'dark:bg-premium-bg/70': 'dark:bg-[#050505]/70',
  'dark:bg-premium-bg/80': 'dark:bg-[#050505]/80',
  'dark:bg-premium-bg/40': 'dark:bg-[#050505]/40',
  'dark:bg-premium-hover/50': 'dark:bg-[#1a1c26]/50',
  'dark:border-premium-border/50': 'dark:border-[#222430]/50',
  'dark:border-premium-border/60': 'dark:border-[#222430]/60',
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
        console.log(`Updated to arbitrary: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Fixed Tailwind bug using arbitrary values.');
