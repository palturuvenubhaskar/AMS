const fs = require('fs');
const path = require('path');

const layouts = [
  'AdminLayout.jsx',
  'FacultyLayout.jsx',
  'StudentLayout.jsx'
];

layouts.forEach(layout => {
  const file = path.join(__dirname, 'src', 'components', 'layouts', layout);
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace lime green gradients with light teal
    content = content.replace(/from-\[#d4f542\]/g, 'from-palette-light');
    content = content.replace(/to-\[#a3c92e\]/g, 'to-palette-medium');
    
    // Replace lime focus rings
    content = content.replace(/focus:ring-\[#d4f542\]\/30/g, 'focus:ring-palette-medium/30');
    content = content.replace(/focus:border-\[#d4f542\]/g, 'focus:border-palette-medium');
    
    // Replace hardcoded #6b7280 with palette-light
    content = content.replace(/text-\[#6b7280\]/g, 'text-palette-light');
    
    // Replace border-white/5 with border-white/20 for better contrast on blue
    content = content.replace(/border-white\/5/g, 'border-white/20');
    content = content.replace(/bg-white\/5/g, 'bg-white/10');
    
    fs.writeFileSync(file, content);
    console.log(`Patched layout: ${layout}`);
  }
});
