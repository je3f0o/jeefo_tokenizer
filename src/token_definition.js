/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token_definition.js
* Created at  : 2017-08-10
* Updated at  : 2019-03-05
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

module.exports = class TokenDefinition {
    constructor (token_definition) {
        if (token_definition === null || typeof token_definition !== "object") {
            throw new Error("Invalid argument: token_definition");
        }
        if (typeof token_definition.id !== "string") {
            throw new Error("Invalid argument: token_definition.id");
        }
        if (typeof token_definition.priority !== "number") {
            throw new Error("Invalid argument: token_definition.priority");
        }
        if (typeof token_definition.is !== "function") {
            throw new Error("Invalid argument: token_definition.is");
        }
        if (typeof token_definition.initialize !== "function") {
            throw new Error("Invalid argument: token_definition.initialize");
        }

        this.Token = class Token {};
        this.Token.prototype.id       = token_definition.id;
        this.Token.prototype.priority = token_definition.priority;

        this.is         = token_definition.is;
        this.initialize = token_definition.initialize;
    }
};
