"use strict";

// @IMPORTS
var mongoose = require("mongoose");

var schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },

    sysAdmin: {
        type: Boolean,
        default: false,
        index: true,
        options: {
            label: "System administrator"
        }
    },

    permissions: {
        type: Object,
        default: {},
        options: {
            label: "Permissions",
            field: "permissions"
        }
    }
}, {
    nameSingular: "Group",
    namePlural: "Groups",

    table: {
        pagination: true,
        head: [
            {
                path: "name",
                label: "Name"
            }
        ],
        searchFields: [
            {
                path: "name"
            }
        ]
    },
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

schema.methods.hasPermission = function (permission, model, options) {
    options = options || {
            canEditOwn: true,
            canDeleteOwn: true
        };

    // allow all the stuffz!
    if (this.sysAdmin) {
        return true;
    }

    return false;
}

module.exports = schema;