const express = require('express');
const i18n = require('i18n-2');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// ----

var config = {};

// The PORT used by 
config.port = 8004;
config.host = 'proxy.docker';

config.proxy = {
    enabled: false,
    host: '',
    secured: false,
    port: 80
};

// Set this var to undefined if you don't want the server to listen on HTTPS
config.https = {
    enabled: false,
    certFile: 'cert/cert.crt',
    keyFile: 'cert/key.key',
    caFile: 'cert/ca.crt',
    port: 443
};

// Express configuration
config.proxyPrefix = '';
config.portalPrefix = '';
config.logInPath = '/login';
config.logOutPath = '/logOut';
config.sessionSecret = 'keyboard cat';
config.theme = '';

// OAuth2 configuration
//'server': 'http://34.213.26.168:8000/',
config.oauth2 = {
    server: 'http://idm.docker:3000',
    clientID: 'f0ab257d-7456-41e8-bb0a-002148ac0217',
    clientSecret: 'd5ea8cce-08ea-4cb2-8379-66bb35020cee',
    callbackURL: 'http://proxy.docker:8004/auth/fiware/callback',
    isLegacy: false,
    roles: {
        admin: 'admin',
        customer: 'customer',
        seller: 'seller',
        orgAdmin: 'manager'
    }
};

// Customer Role Required to buy items
config.customerRoleRequired = false;

// MongoDB
config.mongoDb = {
    server: 'mongo',
    port: 27017,
    user: '',
    password: '',
    db: 'belp'
};

// Configure endpoints
config.endpoints = {
    management: {
        path: 'management',
        host: 'localhost',
        port: config.port,
        appSsl: config.https.enabled
    },
    catalog: {
        path: 'DSProductCatalog',
        host: 'apis.docker',
        port: '8080',
        appSsl: false
    },
    ordering: {
        path: 'DSProductOrdering',
        host: 'apis.docker',
        port: '8080',
        appSsl: false
    },
    inventory: {
        path: 'DSProductInventory',
        host: 'apis.docker',
        port: '8080',
        appSsl: false
    },
    charging: {
        path: 'charging',
        host: 'charging.docker',
        port: '8006',
        appSsl: false
    },
    rss: {
        path: 'DSRevenueSharing',
        host: 'rss.docker',
        port: '8080',
        appSsl: false
    },
    party: {
        path: 'DSPartyManagement',
        host: 'apis.docker',
        port: '8080',
        appSsl: false
    },
    billing: {
        path: 'DSBillingManagement',
        host: 'apis.docker',
        port: '8080',
        appSsl: false
    },
    customer: {
        path: 'DSCustomerManagement',
        host: 'apis.docker',
        port: '8080',
        appSsl: false
    },
    usage:  {
        path: 'DSUsageManagement',
        host: 'apis.docker',
        port: '8080',
        appSsl: false
    },
    sla: {
        path: 'SLAManagement',
        host: 'localhost',
        port: config.port,
        appSsl: false
    },
    reputation: {
        path: 'REPManagement',
        host: 'localhost',
        port: config.port,
        appSsl: false
    }
};

// Percentage of the generated revenues that belongs to the system
config.revenueModel = 0;

// Tax rate
config.taxRate = 50;

// Billing Account owner role
config.billingAccountOwnerRole = 'bill receiver';

// list of paths that will not check authentication/authorization
// example: ['/public/*', '/static/css/']
config.publicPaths = [];

config.indexes = {
    'engine': 'elasticsearch', // local or elasticsearch
    'elasticHost': 'elastic.docker:9200',
    'apiVersion': '7.5'
};

config.magicKey = undefined;

config.usageChartURL = '';


// ---


var app = express();
app.set('port', 8004);

// Attach i18n to express
i18n.expressBind(app, {
    locales: ['en', 'es']
});

console.log(config.sessionSecret);

// Session
app.use(
    session({
        secret: config.sessionSecret,
        resave: true,
        saveUninitialized: true
    })
);

app.use(cookieParser());

app.use(function(req, res, next) {
    req.i18n.setLocaleFromCookie();
    next();
});

// Logging Handler
app.use(function(req, res, next) {
    next();
});

const staticPath = '/static';

app.use('/', express.static(__dirname + staticPath + '/public'));
app.set('views', __dirname + staticPath + '/views');
app.set('view engine', 'jade');

var importPath = './static/public/imports';
var imports = require(importPath).imports;

var renderTemplate = function(req, res, viewName) {
    var options = {
        user: req.user,
        contextPath: config.portalPrefix,
        proxyPath: config.proxyPrefix,
        catalogPath: config.endpoints.catalog.path,
        orderingPath: config.endpoints.ordering.path,
        inventoryPath: config.endpoints.inventory.path,
        chargingPath: config.endpoints.charging.path,
        partyPath: config.endpoints.party.path,
        billingPath: config.endpoints.billing.path,
        customerPath: config.endpoints.customer.path,
        shoppingCartPath: config.shoppingCartPath,
        authorizeServicePath: config.authorizeServicePath,
        rssPath: config.endpoints.rss.path,
        platformRevenue: config.revenueModel,
        cssFilesToInject: imports.cssFilesToInject,
        jsDepFilesToInject: imports.jsDepFilesToInject,
        jsAppFilesToInject: imports.jsAppFilesToInject,
        accountHost: config.oauth2.server,
        usageChartURL: config.usageChartURL,
        orgAdmin: config.oauth2.roles.orgAdmin,
        seller: config.oauth2.roles.seller,
        customer: config.oauth2.roles.customer,
        admin: config.oauth2.roles.admin
    };

    options.jsAppFilesToInject = options.jsAppFilesToInject.concat(imports.jsStockFilesToInject);

    res.render(viewName, options);
    res.end();
};

app.get(config.portalPrefix + '/', function(req, res) {
    renderTemplate(req, res, 'app');
});

app.listen(app.get('port'), () => {
    console.log('Running');
});
