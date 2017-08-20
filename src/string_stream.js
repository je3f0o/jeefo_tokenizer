/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2017-08-16
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start

/* globals */
/* exported */

//ignore:end

var assign = require("jeefo_utils/object/assign");

var StringStream = function (string, tab_space) {
	this.string    = string;
	this.cursor    = { line : 1, column : 0, virtual_column : 0, index : -1 };
	this.tab_space = tab_space || 4;
};

StringStream.prototype = {
	assign : assign,

	peek : function (index) {
		return this.string.charAt(index);
	},
	seek : function (offset, end) {
		return this.string.substring(offset, end || this.cursor.index);
	},
	next : function (skip_whitespace) {
		var current_character = this.string.charAt( ++this.cursor.index );

		if (skip_whitespace) {
			while (current_character && current_character <= ' ') {
				this.update_cursor(current_character);
				current_character = this.string.charAt( ++this.cursor.index );
			}
			this.update_cursor(current_character);
		} else {
			this.update_cursor(current_character);
		}

		if (! current_character) { return null; }

		return current_character;
	},
	current : function () {
		return this.string.charAt( this.cursor.index );
	},
	update_cursor : function (current_character) {
		if (current_character === '\r' || current_character === '\n') {
			this.cursor.line          += 1;
			this.cursor.column         = 0;
			this.cursor.virtual_column = 0;
		} else {
			this.cursor.column         += 1;
			this.cursor.virtual_column += current_character === '\t' ? this.tab_space : 1;
		}
	},
	move_right : function (length) {
		this.cursor.index          += length;
		this.cursor.column         += length;
		this.cursor.virtual_column += length;
	},
	get_cursor : function () {
		return this.assign({}, this.cursor);
	},
	end_cursor : function () {
		return {
			line           : this.cursor.line,
			index          : this.cursor.index + 1,
			column         : this.cursor.column + 1,
			virtual_column : this.cursor.virtual_column + 1,
		};
	},
};

module.exports = StringStream;
