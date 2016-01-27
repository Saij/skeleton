'use strict';

// @IMPORTS
var Application = require('./lib/Application');

Application.configure({
    rootDir: __dirname,
    modules_path: __dirname + '/modules',
    config_path: __dirname + '/config',
    stage: process.env.STAGE || process.env.NODE_ENV || 'dev',
    logformat: 'DD.MM.YYYY h:mm:ss',
    logDir: __dirname + '/logs',
    stages: [
        'dev',
        'view',
        'prod'
    ]
});

// resources
Application.registerModule('webserver');
Application.registerModule('sockets');
Application.registerModule('database');
Application.registerModule('user');
Application.registerModule('files');
Application.registerModule('imageserver');
Application.registerModule('auth');

Application.run();

process.on('exit', function () {
    Application.stop();
});