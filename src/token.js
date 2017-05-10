/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token.js
* Created at  : 2017-04-08
* Updated at  : 2017-05-10
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

var JeefoObject,
	jeefo_tokenizer = jeefo.module("jeefo_tokenizer", ["jeefo_core"]).run("JeefoObject", function (jo) {
		JeefoObject = jo;
	});

var Token = function () {};
Token.prototype = {
	error : function (message) {
		var error          = new SyntaxError(message);
		error.value        = this.value;
		error.lineNumber   = this.start.line;
		error.columnNumber = this.start.column;
		throw error;
	},
	error_unexpected_type : function () {
		this.error(`Unexpected ${ this.type }`);
	},
	error_unexpected_token : function () {
		this.error("Unexpected token");
	},
};

//ignore:start
module.exports = Token;
//ignore:end
