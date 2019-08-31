/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token_definition.js
* Created at  : 2017-08-10
* Updated at  : 2019-07-18
* Author      : jeefo
* Purpose     :
* Description :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

class TokenDefinition {
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

        class Token {}
        Token.prototype.id       = token_definition.id;
        Token.prototype.priority = token_definition.priority;

        this.is         = token_definition.is;
        this.Token      = Token;
        this.initialize = token_definition.initialize;
    }
}

module.exports = TokenDefinition;
