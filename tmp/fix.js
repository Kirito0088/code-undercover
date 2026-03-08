/* eslint-disable */
const fs = require('fs');
const file = 'c:\\code-undercover\\app\\page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
    'Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600"> Code-Undercover</span>',
    'Welcome to <br />\\n            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Code-Undercover</span>'
);
fs.writeFileSync(file, content, 'utf8');
