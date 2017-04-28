/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2017-04-12
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

var p;

/* global */
/* exported */
/* exported */

//ignore:end

var StringStream = function (string) {
	this.string        = string;
	this.current_index = 0;
};
p = StringStream.prototype;

p.peek = function (index) {
	return this.string.charAt(index);
};

p.seek = function (offset, length) {
	return this.string.substring(offset, offset + length);
};

p.next = function () {
	return this.peek( (this.current_index += 1) );
};

p.current = function () {
	return this.peek(this.current_index);
};

//ignore:start
module.exports = StringStream;
//ignore:end
