const fs = require('fs');
try {
    const text = fs.readFileSync('main.js', 'utf8');
    const urls = text.match(/https:\/\/[^\"']+/g) || [];
    console.log([...new Set(urls)].join('\n'));
} catch (e) {
    console.error(e);
}
