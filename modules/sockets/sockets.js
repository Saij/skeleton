"use strict";

// @IMPORTS
var Module = require("../../lib/Module");
var Application = require("../../lib/Application");
var socketIo = require("socket.io");

module.exports = class Sockets extends Module {

    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");
            resolve(this);
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.log.debug("Starting...");
            this.io = socketIo(Application.modules.webserver.httpServer);
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