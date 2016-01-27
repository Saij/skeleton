"use strict";

// @IMPORTS
var mongoose = require("mongoose");
var crypto = require("crypto");
var passwordHash = require('password-hash');

var schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
        options: {
            label: "E-Mail",
            type: "email"
        },
        set: function (val) {
            return val.toLowerCase().trim();
        }
    },

    username: {
        type: String,
        required: true,
        index: true,
        set: function (val) {
            return val.trim();
        }
    },

    password: {
        type: String,
        required: true,
        index: true,
        options: {
            type: "password"
        },
        set: function (val) {
            if (passwordHash.isHashed(val)) {
                return val;
            } else {
                val = val.trim();
                return passwordHash.generate(val);
            }
        }
    },

    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userGroup"
    }
}, {
    nameSingular: "User",
    namePlural: "Users",

    table: {
        pagination: true,
        head: [
            {
                path: "username",
                label: "Username"
            },
            {
                path: "email",
                label: "E-Mail"
            }
        ],
        searchFields: [
            {
                path: "username"
            },
            {
                path: "email"
            }
        ]
    },
    toJSON: {
        virtuals: true,
        transform: function (user) {
            var user = user.toObject();
            delete user.password;
            return user;
        }
    },
    toObject: {
        virtuals: true
    }
});

schema.path('username').validate(function (value, cb) {
    var self = this;

    try {
        var regexp = new RegExp("^" + value + "$", 'i');
    } catch (e) {
        cb(false);
    }

    mongoose.model("user").findOne({
        username: regexp
    }, function (err, user) {
        if (err || (user && user.id !== self.id)) {
            return cb(false);
        }
        cb(true);
    });
}, 'username duplicated');

schema.path('username').validate(function (value) {
    if (value.length < 3) {
        return false;
    }

    return true;
}, 'username is too short 3-30');

schema.path('username').validate(function (value) {
    if (value.length > 30) {
        return false;
    }

    return true;
}, 'username is too long 3-30');

schema.path('username').validate(function (value) {
    if (value.length === 0) {
        return false;
    }

    return true;
}, 'username is empty');

schema.path('password').validate(function (value) {
    if (value.length < 5) {
        return false;
    }

    return true;
}, 'password is too short');

schema.path('email').validate(function (value, cb) {
    var self = this;
    try {
        var regexp = new RegExp("^" + value + "$", 'i');
    } catch (e) {
        cb(false);
    }
    mongoose.model("user").findOne({
        email: regexp
    }, function (err, user) {
        if (err || (user && user.id !== self.id)) {
            return cb(false);
        }

        cb(true);
    });
}, 'email duplicate');

schema.methods.checkPassword = function (val) {
    return passwordHash.verify(val, this.password);
}

schema.methods.hasPermission = function (permission, model, options) {
    if (!this.group) {
        return false;
    }
    return this.group.hasPermission(permission, model, options);
}

module.exports = schema;