/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-04-12
* Updated at  : 2019-08-05
* Author      : jeefo
* Purpose     :
* Description :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

//ignore:end

const StringStream    = require("./src/string_stream");
const TokenDefinition = require("./src/token_definition");

class ITokenDefinition {
    constructor () {
        throw new Error("Interface class cannot be instantiated.");
    }
};

const sort_by_priority = (a, b) => {
    return a.Token.prototype.priority - b.Token.prototype.priority;
};

class JeefoTokenizer {
    constructor () {
        this.streamer          = new StringStream('');
        this.token_definitions = [];
    }

    init (source_code, tab_space) {
        this.streamer = new StringStream(source_code, tab_space);
    }

    get_next_token () {
        const current_character = this.streamer.next(true);

        if (current_character === null) { return null; }

        let i = this.token_definitions.length;
        while (i--) {
            const token_def = this.token_definitions[i];
            if (token_def.is(current_character, this.streamer)) {
                const token = new token_def.Token();
                token_def.initialize(
                    token, current_character, this.streamer
                );

                return token;
            }
        }

        throw new SyntaxError("Undefined token");
    }

    register (token_definition) {
        if (! (token_definition instanceof ITokenDefinition)) {
            // throw Error
        }
        this.token_definitions.push(new TokenDefinition(token_definition));
        this.token_definitions.sort(sort_by_priority);

        return this;
    }
}

module.exports = JeefoTokenizer;
