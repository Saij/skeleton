"use strict";

// @IMPORTS
var fs = require("fs");
var winston = require("winston");
var moment = require("moment");
var merge = require("merge");
var EventEmitter = require('events').EventEmitter;
var emitterInstance = new EventEmitter();
require("es6-promise-series")(Promise);

module.exports = class Application {

    constructor() {
        throw "Cannot construct singleton";
    }

    static configure(config) {
        if (config.stage) {
            config.stage = config.stage.toLowerCase();
        }

        this.config = merge.recursive({
            logformat: "dddd, MMMM Do YYYY, h:mm:ss a",
        }, config);
        this.moduleObjs = [];
        this.modules = {};

        this.log = this.getLogger("application");
    }

    static getLogger(name) {

        try {
            fs.accessSync(this.config.logDir, fs.R_OK);
        } catch (e) {
            fs.mkdirSync(this.config.logDir);
        }

        return new (winston.Logger)({
            transports: [
                new winston.transports.Console({
                    level: "silly",
                    colorize: true,
                    json: false,
                    label: name.toUpperCase(),
                    timestamp: () => {
                        return moment().format(this.config.logformat);
                    }
                }),
                new winston.transports.File({
                    level: "info",
                    colorize: false,
                    json: false,
                    label: name.toUpperCase(),
                    timestamp: () => {
                        return moment().format(this.config.logformat);
                    },
                    filename: this.config.logDir + '/' + name + '.log'
                })
            ]
        });
    }

    static loadModuleConfig(moduleName, packageJson) {
        var configJsonLocation = this.config.config_path + "/" + moduleName + ".json";

        if (!fs.existsSync(configJsonLocation)) {
            fs.writeFileSync(configJsonLocation, "{}");
        }

        try {
            var config = JSON.parse(fs.readFileSync(configJsonLocation));
        } catch (e) {
            throw new Error("config of module " + moduleName + " contains invalid json data");
        }

        var stagedConfig = {};

        if (packageJson.defaultConfig) {
            stagedConfig = packageJson.defaultConfig;
        }

        var configHasStages = false;

        for (var i = 0; i < this.config.stages.length; i++) {
            var stage = this.config.stages[i];

            if (config[stage]) {
                configHasStages = true;
                stagedConfig = merge.recursive(stagedConfig, config[stage]);
            }
        }

        if (!configHasStages) {
            if (packageJson.defaultConfig) {
                config = merge.recursive(stagedConfig, config);
            }
            return config;
        } else {
            return stagedConfig;
        }
    }

    static registerModule(moduleName) {
        var packageJsonLocation = this.config.modules_path + "/" + moduleName + "/package.json";

        if (!fs.existsSync(packageJsonLocation)) {
            throw new Error("Missing package.json for module " + moduleName);
        }

        try {
            var packageJson = JSON.parse(fs.readFileSync(packageJsonLocation));
        } catch (e) {
            throw new Error("package.json of module " + moduleName + " contains invalid json data");
        }

        var mainModuleFile = this.config.modules_path + "/" + moduleName + "/" + packageJson.main;

        if (!fs.existsSync(mainModuleFile)) {
            throw new Error("Missing " + packageJson.main + " for module " + moduleName);
        }

        var moduleConfig = this.loadModuleConfig(moduleName, packageJson);

        var moduleObj = {
            name: moduleName,
            mainPath: mainModuleFile,
            rootPath: this.config.modules_path + "/" + moduleName,
            packageJson: packageJson,
            config: moduleConfig
        };

        try {
            var moduleClass = require(mainModuleFile);
            var moduleInstance = new moduleClass(moduleName, moduleConfig, moduleObj);
        } catch (e) {
            throw e;
        }

        moduleObj.instance = moduleInstance;

        this.moduleObjs.push(moduleObj);
        this.modules[moduleName] = moduleInstance;

        return moduleInstance;
    }

    static initModules() {
        return new Promise((resolve, reject) => {
            var initTasks = [];
            this.log.info("Initializing Modules");

            for (var i = 0; i < this.moduleObjs.length; i++) {
                var moduleObj = this.moduleObjs[i];
                initTasks.push(moduleObj.instance.init());
            }

            Promise.series(initTasks).then(function () {
                resolve();
            }, function (err) {
                reject(err);
            });
        });
    }

    static startModules() {
        return new Promise((resolve, reject) => {
            var startTasks = [];
            this.log.info("Starting Modules");

            for (var i = 0; i < this.moduleObjs.length; i++) {
                var moduleObj = this.moduleObjs[i];
                startTasks.push(moduleObj.instance.start());
            }

            Promise.series(startTasks).then(function () {
                resolve();
            }, function (err) {
                reject(err);
            });
        });
    }

    static run() {
        this.initModules()
            .then(() => {
                return this.startModules();
            })
            .then(() => {
                this.log.info("Application started");
            }, (err) => {
                if (!err) {
                    err = new Error("Unkown error!");
                }

                this.log.error(err);
            });
    }

    static on() {
        emitterInstance.on.apply(this, arguments);
    }

    static emit() {
        emitterInstance.emit.apply(this, arguments);
    }
}