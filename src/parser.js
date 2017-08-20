/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parser.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-16
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var assign = require("jeefo_utils/object/assign");

var default_protos = {
	type       : "UndefinedToken",
	precedence : 0,
};

var Parser = function (parser) {
	this.Token = function () {};
	assign(this.Token.prototype, default_protos, parser.protos);
	if (parser.is) {
		this.is = parser.is;
	}
};

module.exports = Parser;
