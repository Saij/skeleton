"use strict";

// @IMPORTS
var Module = require("../../lib/Module");
var Application = require("../../lib/Application");
var Tools = require("../../lib/Tools");
var passport = require("passport");
var localStrategy = require("passport-local");
var mongoose = require("mongoose");

module.exports = class Auth extends Module {

    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");

            /*
             Middleware
             */
            Application.modules.webserver.addMiddleware(passport.initialize(), 0);
            Application.modules.webserver.addMiddleware(passport.session({
                pauseStream: true
            }), 1);

            /*
             Serialize User
             */
            passport.serializeUser((user, done) => {
                done(null, user.id);
            });

            /*
             Deserialize user
             */
            passport.deserializeUser((id, done) => {
                var userModel = mongoose.model("user");

                userModel
                    .findOne({
                        _id: id
                    })
                    .populate([
                        "group"
                    ])
                    .exec()
                    .then((user) => {
                        if (!user) {
                            return done("couldn't find user with that id");
                        }

                        user.save().then(() => {
                            done(null, user);
                        }, (err) => {
                            done(err);
                        });

                    }, (err) => {
                        done(err);
                    });
            });

            /*
             Auth Strategy local
             */
            passport.use('local', new localStrategy((username, password, done)=> {
                var userModel = mongoose.model("user");
                userModel
                    .findOne({
                        $or: [
                            {
                                username: new RegExp("^" + Tools.escapeForRegexp(username) + "$", "i")
                            },
                            {
                                email: new RegExp("^" + Tools.escapeForRegexp(username) + "$", "i")
                            }
                        ]
                    })
                    .exec()
                    .then((user) => {
                        if (!user) {
                            return done();
                        }

                        if (user.checkPassword(password)) {
                            done(null, user);
                        } else {
                            done("invalid username or password");
                        }
                    }, (err) => {
                        done(err);
                    });
            }));

            /*
             Login route
             */
            Application.modules.webserver.addRoute("post", "/auth/login", (req, res) => {
                passport.authenticate("local", (err, user, info) => {
                    if (!user) {
                        res.status(400);
                        return res.err("Invalid username or password");
                    }

                    req.logIn(user, function (err) {
                        if (err) {
                            res.status(500);
                            return res.err(err);
                        }

                        res.json(user);
                    });
                })(req, res)
            }, 0);

            /*
             Register route
             */
            Application.modules.webserver.addRoute("post", "/auth/register", (req, res) => {
                var userModel = mongoose.model("user");

                if (req.body.password) {
                    if (req.body.password != req.body.passwordConfirm) {
                        res.status(400);
                        return res.err({
                            name: "ValidationError",
                            errors: {
                                password: {
                                    message: "The passwords do not match"
                                }
                            }
                        });
                    }
                }

                var user = new userModel(req.body);

                user.save().then(() => {
                    Application.emit("auth.register", {
                        user: user
                    });

                    res.json(user);
                }, (err) => {
                    res.status(400);
                    res.err(err);
                });
            });

            /*
             Current user route
             */
            Application.modules.webserver.addRoute("post", "/auth/current", (req, res) => {
                if (!req.user) {
                    res.status(400);
                    return res.err("not logged in");
                }

                res.json(req.user);
            });

            /*
             Logout route
             */
            Application.modules.webserver.addRoute("post", "/auth/logout", (req, res) => {
                if (!req.user) {
                    return res.end();
                }

                req.logout();
                res.end()
            });

            resolve(this);
        });
    }

}