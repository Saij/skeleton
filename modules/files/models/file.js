"use strict";

// @IMPORTS
var mongoose = require("mongoose");
var Application = require("../../../lib/Application");

var schema = new mongoose.Schema({

    name: {
        type: "string",
        required: true
    },

    mimetype: {
        type: "String",
        required: true
    },

    originalname: {
        type: "String",
        required: true
    },

    extension: {
        type: "String",
        required: true
    },

    type: {
        type: "String",
        required: true,
        enum: [
            "image",
            "misc"
        ],
        default: "misc"
    }

}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

schema.virtual("filename").get(function () {
    return this._id + "." + this.extension;
})

schema.virtual("filepath").get(function () {
    return Application.modules.files.config.fileDir + "/" + this.filename;
})

schema.virtual("fileurl").get(function () {
    if (this.type === "image") {
        return Application.modules.imageserver.getUrls(this);
    } else {
        return Application.modules.files.config.fileDir + "/" + this.filename;
    }
})

module.exports = schema;