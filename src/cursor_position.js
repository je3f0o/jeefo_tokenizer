/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : cursor_position.js
* Created at  : 2019-03-15
* Updated at  : 2019-06-23
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

class CursorPosition {
    constructor (cursor_position) {
        this.index          = cursor_position.index;
        this.line           = cursor_position.line;
        this.column         = cursor_position.column;
        this.virtual_column = cursor_position.virtual_column;
    }

    clone () {
		return new CursorPosition(this);
    }
}

module.exports = CursorPosition;
