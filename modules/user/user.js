"use strict";

// @IMPORTS
var Module = require("../../lib/Module");
var Application = require("../../lib/Application");
var mongoose = require("mongoose");

module.exports = class User extends Module {

    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");
            var userModel = mongoose.model("user");
            var userGroupModel = mongoose.model("userGroup");

            Application.modules.crudApi.addModelApi("user", {
                find: {
                    populate: ["group"]
                },
                findOne: {
                    populate: ["group"]
                }
            });
            Application.modules.crudApi.addModelApi("userGroup");

            resolve();
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.log.debug("Checking for admin group and user...");
            this.setupGroups().then(() => {
                return this.setupUsers();
            }).then(resolve, (err) => {
                reject(err);
            });
        });
    }

    setupGroups() {
        var userGroupModel = mongoose.model("userGroup");
        return new Promise((resolve, reject) => {
            userGroupModel.findOne({
                sysAdmin: true
            }).exec().then((group) => {

                if (group) {
                    this.log.debug("Administrator group exists");
                    return resolve();
                }

                var adminGroup = new userGroupModel({
                    name: "Administrator",
                    sysAdmin: true
                });

                adminGroup.save().then(() => {
                    this.log.info("Created Administrator group");
                    resolve();
                }, reject);
            }, reject)
        });
    }

    setupUsers() {
        var userModel = mongoose.model("user");
        var userGroupModel = mongoose.model("userGroup");

        return new Promise((resolve, reject) => {
            userGroupModel.findOne({
                sysAdmin: true
            }).exec().then((group) => {

                if (!group) {
                    return reject(new Error("no admin group found"));
                }

                userModel.findOne({
                    group: group._id
                }).exec().then((user) => {
                    if (user) {
                        this.log.debug("Admin user exists");
                        return resolve();
                    }

                    var adminUser = new userModel({
                        username: "admin",
                        password: "admin",
                        email: "admin@example.com",
                        group: group
                    });

                    adminUser.save().then(() => {
                        this.log.info("Admin user created admin:admin");
                        resolve();
                    }, reject);

                }, reject);
            });
        });
    }

    modifySchema(modelName, schema) {
        this.log.debug("User module is modifying schema of " + modelName);

        schema.add({
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
                options: {
                    hidden: true
                },
                default: null
            },
            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
                options: {
                    hidden: true
                },
                default: null
            },
            createdAt: {
                type: Date,
                options: {
                    hidden: true
                },
                default: function () {
                    return new Date();
                }
            },
            updatedAt: {
                type: Date,
                options: {
                    hidden: true
                },
                default: function () {
                    return new Date();
                }
            }
        });

        schema.pre("save", function (next) {
            this.updatedAt = new Date();
            next();
        });
    }

    onCrudApiSave(item, req) {
        if (req.user) {
            if (!item.createdBy) {
                item.createdBy = req.user._id;
            }

            item.updatedBy = req.user._id;
        }
    }
}