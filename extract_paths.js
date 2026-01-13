const fs = require('fs');
try {
    const text = fs.readFileSync('main.js', 'utf8');
    // Match strings that look like API paths: starts with /scad, /kms, /fw, /api followed by other chars until quote
    const paths = text.match(/"\/(scad|kms|fw|api|portal)\/[^"]+"/g) || [];
    const singleQuotePaths = text.match(/'\/(scad|kms|fw|api|portal)\/[^']+'/g) || [];

    const allPaths = [...paths, ...singleQuotePaths].map(p => p.slice(1, -1)); // remove quotes
    const uniquePaths = [...new Set(allPaths)];

    console.log("Found Paths:");
    console.log(uniquePaths.join('\n'));
} catch (e) {
    console.error(e);
}
