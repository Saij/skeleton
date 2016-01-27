"use strict";

// @IMPORTS
var Module = require("../../lib/Module");
var Application = require("../../lib/Application");
var mongoose = require('mongoose');
var multer = require('multer');
var fs = require('fs');
var mime = require("mime");

module.exports = class Files extends Module {
    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");

            var uploader = multer({
                dest: Application.config.rootDir + this.config.uploadDir,
                limits: {
                    fileSize: this.config.limits.fileSize * 1024 * 1024
                }
            });

            try {
                fs.accessSync(Application.config.rootDir + this.config.uploadDir, fs.R_OK);
            } catch (e) {
                fs.mkdirSync(Application.config.rootDir + this.config.uploadDir);
            }

            try {
                fs.accessSync(Application.config.rootDir + this.config.fileDir, fs.R_OK);
            } catch (e) {
                fs.mkdirSync(Application.config.rootDir + this.config.fileDir);
            }

            /*
             Routes
             */
            Application.modules.webserver.addRoute("post", "/upload", uploader.single('file'), (req, res) => {
                this.saveUploadedFile(req.file, req.body).then((data) => {
                    res.json(data);
                }, (err) => {
                    res.err(err);
                });
            }, 10);

            Application.modules.webserver.addRoute("post", "/uploads", uploader.array('files'), (req, res) => {
                res.status(500);
                res.end("@TODO");
            }, 10);

            resolve(this);
        });
    }

    saveUploadedFile(uploadedFileObj, properties) {
        properties = properties || {};

        return new Promise((resolve, reject) => {
            try {
                var model = mongoose.model("file");
                var newFile = new model({
                    name: properties.name || uploadedFileObj.originalname,
                    originalname: uploadedFileObj.originalname,
                    type: this.getTypeFromMimeType(uploadedFileObj.mimetype),
                    mimetype: uploadedFileObj.mimetype,
                    extension: this.getExtensionFromMimeType(uploadedFileObj.mimetype)
                });
            } catch (e) {
                console.log(e);
                return reject(e);
            }

            newFile.save().then(() => {
                fs.rename(uploadedFileObj.path, Application.config.rootDir + this.config.fileDir + "/" + newFile.filename, (err) => {
                    if (err) {
                        fs.unlink('./' + uploadedFileObj.path);
                        return reject(err);
                    }

                    resolve(newFile);
                });
            }, reject);
        });
    }

    saveUploadedFiles(uploadedFilesObj, properties) {

    }

    getExtensionFromMimeType(mimetype) {

        if (typeof mimetype !== "string") {
            mimetype = "";
        }

        return mime.extension(mimetype);
    }

    getTypeFromMimeType(mimetype) {

        if (typeof mimetype !== "string") {
            mimetype = "";
        }

        var imageIdentifiers = [
            "jpg",
            "jpeg",
            "gif",
            "bmp",
            "png"
        ];

        for (let i = 0; i < imageIdentifiers.length; i++) {
            let identifier = imageIdentifiers[i];

            if (mimetype.indexOf(identifier) !== -1) {
                return "image";
            }
        }

        return "misc";
    }
}