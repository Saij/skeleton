"use strict";

// @IMPORTS
var Module = require("../../lib/Module");
var mongoose = require("mongoose");
var Application = require("../../lib/Application");

module.exports = class Database extends Module {

    init() {
        this.connectionString = "";

        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");

            Application.modules.webserver.addRoute("get", "/database/status", (req, res) => {
                if (mongoose.connection._readyState != 1) {
                    res.status(500);
                    return res.end("Disconnected");
                }

                res.status(200);
                return res.end("Connected");
            }, 99999);

            this.loadModels();

            resolve(this);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.log.debug("Connecting...");
            mongoose.connect(this.config.uri, (err) => {
                if (err) {
                    return reject(err);
                }

                this.log.debug("Connected");
                resolve(this);
            });

            mongoose.connection.on('error', (err) => {
                this.log.error(err);
            });
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.log.debug("Stopping...");
            mongoose.connection.close()
            resolve(this);
        });
    }

    loadModels() {
        var modelSchemas = {};

        for (let i = 0; i < Application.moduleObjs.length; i++) {
            var obj = Application.moduleObjs[i];

            if (!obj.packageJson.models) {
                continue;
            }

            for (var modelName in obj.packageJson.models) {
                var modelPath = obj.packageJson.models[modelName];
                if (modelSchemas[modelName]) {
                    this.log.error(modelName + " defined twice!");
                }

                modelSchemas[modelName] = require(obj.rootPath + modelPath);
            }
        }

        for (let modelName in modelSchemas) {
            var schema = modelSchemas[modelName];

            this.registerModel(modelName, schema);
        }
    }

    registerModel(modelName, schema) {
        this.log.debug("Loading model " + modelName);

        for (let i = 0; i < Application.moduleObjs.length; i++) {
            if (Application.moduleObjs[i].instance.modifySchema) {
                Application.moduleObjs[i].instance.modifySchema(modelName, schema);
            }
        }

        try {
            mongoose.model(modelName, schema);
        } catch (e) {
            this.log.debug("model " + modelName + " already defined");
        }
    }

}