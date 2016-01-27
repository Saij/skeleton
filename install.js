"use strict";

var fs = require("fs");
var async = require("async");
var modulesPath = __dirname + "/modules";
var exec = require('child_process').exec;

function run(cmd) {
    var child = exec(cmd, function (error, stdout, stderr) {
        if (stderr !== null) {
            console.log('' + stderr);
        }
        if (stdout !== null) {
            console.log('' + stdout);
        }
        if (error !== null) {
            console.log('' + error);
        }
    });
};

fs.readdir(modulesPath, function (err, dirs) {
    async.each(dirs, function (dir, next) {

        var modulePath = modulesPath + "/" + dir;
        var packageJsonPath = modulePath + "/package.json";

        try {
            fs.accessSync(packageJsonPath, fs.R_OK);
        } catch (e) {
            console.log("No package.json found for module " + dir + "(" + packageJsonPath + ")");
            return next();
        }

        fs.readFile(packageJsonPath, function (err, data) {

            try {
                var obj = JSON.parse(data);
            } catch (e) {
                console.error("Invalid package.json for " + dir);
                return next();
            }

            run("cd " + modulePath + " && npm install");
        });
    });
})