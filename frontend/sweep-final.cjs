const fs = require('fs');
const path = require('path');

const colorMap = {
  'from-\\[#d4f542\\]/10': 'from-palette-light/30',
  'border-\\[#d4f542\\]': 'border-palette-medium',
  'ring-\\[#d4f542\\]/20': 'ring-palette-medium/20',
  'from-\\[#d4f542\\]/20': 'from-palette-medium/20',
  "'#1a1d29'": "'#31669A'",
  "'#d4f542'": "'#6EABCA'",
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
      
      for (const [oldRegexStr, newClass] of Object.entries(colorMap)) {
        const regex = new RegExp(oldRegexStr, 'g');
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
console.log('Final sweep complete.');
