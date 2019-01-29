/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-04-12
* Updated at  : 2019-01-29
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* globals */
/* exported */

//ignore:end

const StringStream    = require("./src/string_stream"),
      TokenDefinition = require("./src/token_definition");

module.exports = class JeefoTokenizer {
    constructor () {
        this.streamer          = new StringStream('');
        this.token_definitions = [];
    }

    init (source_code, tab_space) {
        this.streamer = new StringStream(source_code, tab_space);
    }

    clone () {
        const clone = new JeefoTokenizer();

        clone.token_definitions = this.token_definitions.map(token_definition => {
            return new TokenDefinition({
                is         : token_definition.is,
                initialize : token_definition.initialize,
                prototype  : token_definition.Token.prototype
            });
        });

        clone.cursor_positions_stack = this.cursor_positions_stack.map(cursor_position => Object.assign({}, cursor_position));

        return clone;
    }

    get_next_token () {
        const current_character = this.streamer.get_next_character(true);

        if (current_character === null) { return null; }

        let i = this.token_definitions.length;
        while (i--) {
            if (this.token_definitions[i].is(current_character, this.streamer)) {
                const token = new this.token_definitions[i].Token();
                this.token_definitions[i].initialize(token, current_character, this.streamer);

                return token;
            }
        }

        throw new SyntaxError("Undefined token");
    }

    register (token_definition) {
        this.token_definitions.push(new TokenDefinition(token_definition));
        this.token_definitions.sort((a, b) => a.Token.prototype.precedence - b.Token.prototype.precedence);

        return this;
    }
};
