/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2019-03-07
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* globals */
/* exported */

//ignore:end

const __update_cursor = (streamer, current_character) => {
    if (current_character === '\n') {
        streamer.cursor.line          += 1;
        streamer.cursor.column         = 0;
        streamer.cursor.virtual_column = 0;
    } else {
        streamer.cursor.column         += 1;
        streamer.cursor.virtual_column += current_character === '\t' ? streamer.tab_space : 1;
    }
};

module.exports = class StringStream {
    constructor (string, tab_space) {
        if (typeof string !== "string") {
            throw new Error("Invalid argument: string");
        }
        if (tab_space !== undefined && typeof tab_space !== "number") {
            throw new Error("Invalid argument: tab_space");
        }

        this.string                 = string;
        this.cursor                 = { index : -1, line : 1, column : 0, virtual_column : 0 };
        this.tab_space              = tab_space || 4;
        this.cursor_positions_stack = [];
    }

	at (index) {
        const character = this.string.charAt(index);
		return character === '' ? null : character;
	}

	substring_from (offset) {
		return this.string.substring(offset, this.cursor.index + 1);
	}

	substring_from_token (token) {
		return this.string.substring(token.start.index, token.end.index + 1);
	}

	get_next_character (skip_whitespace) {
		var current_character = this.string.charAt( ++this.cursor.index );

		if (skip_whitespace) {
			while (current_character && current_character <= ' ') {
				__update_cursor(this, current_character);
				current_character = this.string.charAt( ++this.cursor.index );
			}
		}
        __update_cursor(this, current_character);

		return current_character || null;
	}

	move_cursor (length, virtual_length) {
        if (virtual_length === undefined) {
            virtual_length = length;
        }
		this.cursor.index          += length;
		this.cursor.column         += length;
		this.cursor.virtual_column += virtual_length;
	}

	get_current_character () {
		return this.string.charAt( this.cursor.index );
	}

	get_cursor () {
		return Object.assign({}, this.cursor);
	}

    save_cursor_position () {
        this.cursor_positions_stack.push(this.get_cursor());
        if (this.cursor_positions_stack.length === 10) {
            throw new Error("Exceeded max cursor positions stack");
        }
    }

    commit () {
        if (this.cursor_positions_stack.length) {
            this.cursor_positions_stack.pop();
        } else {
            throw new Error("Commiting empty cursor positions stack");
        }
    }

    rollback () {
        const last_position = this.cursor_positions_stack.pop();
        
        if (last_position) {
            this.cursor = last_position;
        } else {
            throw new Error("Rollback empty cursor positions stack");
        }
    }
};
