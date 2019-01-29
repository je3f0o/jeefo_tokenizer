/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
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

const __update_cursor = (streamer, current_character) => {
    if (current_character === '\r' || current_character === '\n') {
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
        this.cursor                 = { line : 1, column : 0, virtual_column : 0, index : -1 };
        this.tab_space              = tab_space || 4;
        this.cursor_positions_stack = [];
    }

	at (index) {
		return this.string.charAt(index);
	}

	substring_from (offset) {
		return this.string.substring(offset, this.cursor.index);
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

	current_character () {
		return this.string.charAt( this.cursor.index );
	}

	move_right (length) {
		this.cursor.index          += length;
		this.cursor.column         += length;
		this.cursor.virtual_column += length;
	}

	get_cursor () {
		return Object.assign({}, this.cursor);
	}

	get_end_cursor () {
		return {
			line           : this.cursor.line,
			index          : this.cursor.index + 1,
			column         : this.cursor.column + 1,
			virtual_column : this.cursor.virtual_column + 1,
		};
	}

    save_cursor_position () {
        this.cursor_positions_stack.push(this.get_cursor());
    }

    restore_cursor_position () {
        const last_position = this.cursor_positions_stack.pop();

        if (last_position) {
            Object.assign(this.cursor, last_position);
        } else {
            throw new Error("Empty cursor positions stack");
        }
    }
};
