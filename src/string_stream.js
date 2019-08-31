/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2019-08-21
* Author      : jeefo
* Purpose     :
* Description :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

//ignore:end

const Cursor   = require("./cursor");
//const readonly = require("@jeefo/utils/object/readonly");

function object_readonly (object, property, value) {
    Object.defineProperty(object, property, {
        value      : value,
        writable   : false,
        enumerable : true
    });
}

const __update_cursor_position = (cursor_position, tab_space, character) => {
    if (character === '\n') {
        cursor_position.line          += 1;
        cursor_position.column         = 0;
        cursor_position.virtual_column = 0;
    } else {
        const vc = character === '\t' ? tab_space : 1;
        cursor_position.column         += 1;
        cursor_position.virtual_column += vc;
    }
};

class StringStream {
    constructor (string, tab_space) {
        if (typeof string !== "string") {
            throw new Error("Invalid argument: string");
        }
        if (tab_space !== undefined && typeof tab_space !== "number") {
            throw new Error("Invalid argument: tab_space");
        }

        object_readonly(this, "string", string);
        object_readonly(this, "cursor", new Cursor());
        this.tab_space = tab_space || 4;
    }

	at (index) {
        const character = this.string.charAt(index);
		return character === '' ? null : character;
	}

	substring_from_offset (offset) {
		return this.string.substring(offset, this.cursor.position.index + 1);
	}

	substring_from_token (token) {
		return this.string.substring(token.start.index, token.end.index + 1);
	}

    eat_until_eol () {
        const start_index  = this.cursor.position.index;
        let length         = 0;
        let virtual_length = 0;
        let next_char      = this.string.charAt(start_index);

        while (next_char && next_char !== '\n') {
            length         += 1;
            virtual_length += next_char === '\t' ? this.tab_space : 1;
            next_char = this.string.charAt(start_index + length);
        }

        this.cursor.move(length, virtual_length);
        return this.string.substring(start_index, start_index + length + 1);
    }

    next (skip_whitespace) {
        const cursor_pos = this.cursor.position;
        if (this.get_current_character() === '\n') {
            __update_cursor_position(cursor_pos, 0, '\n');
        }
		let next_char = this.string.charAt( ++this.cursor.position.index );

        if (skip_whitespace) {
            while (next_char && next_char <= ' ') {
                __update_cursor_position(
                    cursor_pos, this.tab_space, next_char
                );
                next_char = this.string.charAt(++this.cursor.position.index);
            }
        }
        __update_cursor_position(cursor_pos, this.tab_space, next_char);

		return next_char || null;
    }

    is_next_character (character) {
		return this.string.charAt(this.cursor.position.index+1) === character;
    }

    clone_cursor_position () {
        return this.cursor.position.clone();
    }

	get_next_character () {
		return this.string.charAt(this.cursor.position.index + 1) || null;
	}

	get_current_character () {
		return this.string.charAt(this.cursor.position.index) || null;
	}
}

module.exports = StringStream;
