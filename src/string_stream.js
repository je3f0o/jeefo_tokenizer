/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2017-05-06
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported */
/* exported */

//ignore:end

var StringStream = function (string) {
	this.string        = string;
	this.current_index = 0;
};
StringStream.prototype = {
	peek : function (index) {
		return this.string.charAt(index);
	},
	seek : function (offset, length) {
		return this.string.substring(offset, offset + length);
	},
	next : function () {
		return this.peek( ++this.current_index );
	},
	current : function () {
		return this.peek(this.current_index);
	},
};

//ignore:start
module.exports = StringStream;
//ignore:end
