"use strict";
// @IMPORTS
var Application = require("./Application");
var merge = require("merge");

module.exports = class Module {

    constructor(name, config, moduleConfig) {
        this.name = name;
        this.config = merge.recursive({}, config);
        this.log = Application.getLogger(this.name);
        this.moduleConfig = moduleConfig;
    }

    /*
     INSTALLATION
     @TODO planned feature
     */

    install() {
        return new Promise((resolve, reject) => {
            resolve(this);
        });
    }

    update() {
        return new Promise((resolve, reject) => {
            resolve(this);
        });
    }

    remove() {
        return new Promise((resolve, reject) => {
            resolve(this);
        });
    }

    /*
     LIFECYCLE
     */

    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");
            resolve(this);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.log.debug("Starting...");
            resolve(this);
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.log.debug("Stopping...");
            resolve(this);
        });
    }

}