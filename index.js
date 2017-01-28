const http = require('http');

const morgan = require('morgan');
const finalhandler = require('finalhandler');
const httpProxy = require('http-proxy');
const httpProxyMitm = require('http-proxy-mitm');

const templates = require('bem-components-dist/desktop/bem-components.bemhtml').BEMHTML;

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({
    headers: { 'X-Proxied-By': 'bem-proxy' },
    target: 'http://127.0.0.1:55276'
});

// Apply templates on `x-content-type: x-bemjson`
proxy.on('proxyRes', httpProxyMitm({
    condition: (pRes) => (pRes.statusCode === 200 && pRes.headers['x-content-type'] === 'application/x-bemjson'),
    bodyTransform: function(body) {
        try {
            return templates.apply(JSON.parse(body));
        } catch (e) {
            console.error(e);
            return e.stack + '<br>' + body;
        }
    }
}));

const logger = morgan('combined');

// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
const server = http.createServer(function(req, res) {
    logger(req, res, (err) => {
        if (err) {
            console.error(err);
            return finalhandler(req, res)(err);
        }
    });

    proxy.web(req, res, {}, e => {
        console.error(e);
    });
});

server.listen(process.env.PORT, () => {
    console.log('Proxy server listening on ', server.address());
});