"use strict";

// @IMPORTS
var Application = require("../../lib/Application");
var Module = require("../../lib/Module");
var mongoose = require("mongoose");
var gm = require("gm");
var fs = require("fs");

module.exports = class Imageserver extends Module {

    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");

            var fileModel = mongoose.model("file");

            Application.modules.webserver.addRoute("get", "/image/:id-:pkg.:ext", (req, res) => {
                var id = req.params.id;
                var pkg = req.params.pkg;
                var ext = req.params.ext;

                if (!id || !pkg || !ext) {
                    res.status(404);
                    return res.end();
                }

                if (!this.config.packages[pkg]) {
                    res.status(400);
                    return res.end("pkg definition missing for " + pkg);
                }

                var packageOptions = this.config.packages[pkg];

                if ([
                        "png",
                        "jpg",
                        "jpeg",
                        "bmp",
                        "gif"
                    ].indexOf(ext) === -1) {
                    res.status(400);
                    return res.end("invalid extension " + ext);
                }

                fileModel.findOne({
                    _id: id
                }).exec().then((doc) => {

                    if (!doc) {
                        res.status(404);
                        return res.end();
                    }

                    var fullFilePath = Application.config.rootDir + doc.filepath;
                    var targetPath = Application.config.rootDir + Application.modules.files.config.fileDir + "/" + doc._id + "-" + pkg + "." + ext;

                    try {
                        fs.accessSync(fullFilePath, fs.R_OK);
                    } catch (e) {
                        res.status(500);
                        return res.end("File is missing!");
                    }

                    try {
                        fs.accessSync(targetPath, fs.R_OK);

                        return res.sendFile(targetPath);
                    } catch (e) {
                    }

                    var gmObj = gm(fullFilePath);

                    if (packageOptions instanceof Array) {
                        //@TODO chain multiple commmands
                    } else {
                        if (packageOptions.type == "resize") {
                            gmObj.resize(packageOptions.width, packageOptions.height, packageOptions.options);
                        }
                        if (packageOptions.type == "recrop") {
                            gmObj
                                .resize(packageOptions.width, packageOptions.height, "^")
                                .gravity(packageOptions.gravity || "Center")
                                .crop(packageOptions.width, packageOptions.height, packageOptions.x || 0, packageOptions.y || 0);
                        }
                    }

                    gmObj.write(targetPath, (err) => {
                        if (err) {
                            return res.err(err);
                        }

                        return res.sendFile(targetPath);
                    });
                }, (err) => {
                    res.err(err);
                });

            }, 10);

            resolve(this);
        });
    }

    getUrls(doc) {
        var result = {};

        for (var pkg in this.config.packages) {
            result[pkg] = this.getPackageUrl(doc, pkg);
        }

        return result;
    }

    getPackageUrl(doc, pkg) {
        return "/image/" + doc._id + "-" + pkg + "." + doc.extension;
    }

}