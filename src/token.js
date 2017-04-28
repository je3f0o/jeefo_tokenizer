/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token.js
* Created at  : 2017-04-08
* Updated at  : 2017-04-26
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

var Token = function (info) {
	for (var prop in info) {
		this[prop] = info[prop];
	}
};
var p = Token.prototype;

p.error = function (message) {
	var error = new SyntaxError(message);
	error.token        = this.value;
	error.lineNumber   = this.start.line;
	error.columnNumber = this.start.column;
	throw error;
};
p.error_unexpected_type = function () {
	this.error("Unexpected " + this.type);
};
p.error_unexpected_token = function () {
	this.error("Unexpected token");
};

//ignore:start
module.exports = Token;
//ignore:end
