const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const colorMap = {
  // Hex replacements
  'bg-[#1a1d29]': 'bg-palette-dark',
  'text-[#1a1d29]': 'text-palette-dark',
  'bg-[#d4f542]': 'bg-palette-medium',
  'text-[#d4f542]': 'text-palette-medium',
  'bg-[#f3f4f6]': 'bg-palette-cream',
  'text-[#f3f4f6]': 'text-palette-cream',
  
  // Generic Tailwind replacements
  'bg-blue-600': 'bg-palette-dark',
  'hover:bg-blue-700': 'hover:bg-palette-dark/90',
  'text-blue-500': 'text-palette-medium',
  'text-blue-600': 'text-palette-dark',
  'bg-blue-50': 'bg-palette-light/20',
  'hover:bg-blue-50/30': 'hover:bg-palette-light/30',
  'border-blue-500': 'border-palette-medium',
  'ring-blue-500/20': 'ring-palette-medium/20',
  'shadow-blue-600/20': 'shadow-palette-dark/20',
  
  'bg-amber-500': 'bg-palette-medium',
  'hover:bg-amber-600': 'hover:bg-palette-medium/90',
  'text-amber-500': 'text-palette-medium',
  'text-amber-600': 'text-palette-dark',
  'bg-amber-50': 'bg-palette-light/20',
  'hover:bg-amber-50/50': 'hover:bg-palette-light/40',
  'border-amber-500': 'border-palette-medium',
  'border-amber-200': 'border-palette-medium/50',
  'border-amber-300': 'border-palette-medium/70',
  'border-amber-400': 'border-palette-medium',
  'hover:border-amber-400': 'hover:border-palette-medium',
  'ring-amber-500/20': 'ring-palette-medium/20',
  'shadow-amber-500/30': 'shadow-palette-medium/30',
  'shadow-amber-500/20': 'shadow-palette-medium/20',
  
  'bg-gray-900': 'bg-palette-dark',
  'hover:bg-black': 'hover:bg-palette-dark/90',
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
      
      for (const [oldClass, newClass] of Object.entries(colorMap)) {
        // Use a simple split/join to replace all occurrences precisely
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

processDirectory(srcDir);
console.log('Sweep complete.');
