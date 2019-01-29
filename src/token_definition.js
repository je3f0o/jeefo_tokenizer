/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token_definition.js
* Created at  : 2017-08-10
* Updated at  : 2019-01-29
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
        if (typeof token_definition.type !== "string") {
            throw new Error("Invalid argument: token_definition.type");
        }
        if (typeof token_definition.precedence !== "number") {
            throw new Error("Invalid argument: token_definition.precedence");
        }
        if (typeof token_definition.is !== "function") {
            throw new Error("Invalid argument: token_definition.is");
        }
        if (typeof token_definition.initialize !== "function") {
            throw new Error("Invalid argument: token_definition.initialize");
        }

        this.Token = class Token {};
        this.Token.prototype.type       = token_definition.type;
        this.Token.prototype.precedence = token_definition.precedence;

        this.is         = token_definition.is;
        this.initialize = token_definition.initialize;
    }
};
