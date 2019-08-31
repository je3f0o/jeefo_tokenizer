/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : cursor.js
* Created at  : 2019-03-15
* Updated at  : 2019-06-28
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

const MAX_HISTORY_LENGTH = 10;

// ignore:end

const CursorPosition = require("./cursor_position");

class Cursor {
    constructor () {
        this.position = new CursorPosition({
            index          : -1,
            line           : 1,
            column         : 0,
            virtual_column : 0
        });

        this.history = [];
    }

    has_saved_position () {
        return this.history.length > 0;
    }

    move_next () {
		this.position.index          += 1;
		this.position.column         += 1;
		this.position.virtual_column += 1;
    }

    move (length, virtual_length) {
		this.position.index          += length;
		this.position.column         += length;
		this.position.virtual_column += virtual_length || length;
    }

    save () {
        this.history.push(this.position.clone());
        if (this.history.length === MAX_HISTORY_LENGTH) {
            throw new Error("Exceeded max cursor positions history");
        }
    }

    commit () {
        if (this.history.length) {
            this.history.pop();
        } else {
            throw new Error("Commiting empty cursor position history");
        }
    }

    rollback () {
        if (this.history.length) {
            this.position = this.history.pop();
        } else {
            throw new Error("Rollback empty cursor position history");
        }
    }
}

module.exports = Cursor;
