const https = require('https');

const paths = [
    '/oauth/token',
    '/scad/oauth/token',
    '/fw/oauth/token',
    '/api/oauth/token',
    '/scad/api/v1/oauth/token',
    '/bry-scad/oauth/token',
    '/auth/realms/bry/protocol/openid-connect/token'
];

const host = 'cloud.bry.com.br';

console.log(`Scanning https://${host}...`);

paths.forEach(path => {
    const req = https.request({
        hostname: host,
        path: path,
        method: 'GET',
        timeout: 5000
    }, (res) => {
        console.log(`${res.statusCode} ${path}`);
    });

    req.on('error', (e) => {
        console.log(`ERR ${path}: ${e.message}`);
    });

    req.on('timeout', () => {
        req.destroy();
        console.log(`TIMEOUT ${path}`);
    });

    req.end();
});
