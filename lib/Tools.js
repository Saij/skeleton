"use strict";

module.exports = class Tools {

    constructor() {
        throw "Cannot construct singleton";
    }

    static escapeForRegexp(str, delimiter) {
        if (!str) {
            return "";
        }

        str = str + "";
        return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    }

}
