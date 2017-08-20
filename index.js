/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-04-12
* Updated at  : 2017-08-20
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start

/* globals */
/* exported */

//ignore:end

/*
var SPECIAL_CHARACTERS = [
	'.', ',',
	'/', '?',
	';', ':',
	"'", '"',
	'`', '~',
	'-', '_',
	'=', '+',
	'\\', '|', 
	'(', ')',
	'[', ']',
	'{', '}',
	'<', '>',
	'!', '@', '#', '$', '%', '^', '&', '*',
].join('');
*/

//ignore:end

var Parser       = require("./src/parser"),
	StringStream = require("./src/string_stream"),
	sort_handler = (a, b) => {
		return a.Token.prototype.precedence - b.Token.prototype.precedence;
	};

var Tokenizer = function (parsers) {
	this.parsers = [];

	if (parsers) {
		var i = parsers.length;
		while (i--) {
			this.parsers[i] = parsers[i];
		}
	}
};

// Prototypes {{{1
Tokenizer.prototype = {

// Init {{{2
init : function (source, tab_space) {
	this.streamer = new StringStream(source, tab_space);
},

// Clone {{{2
clone : function () {
	return new Tokenizer(this.parsers);
},

// Next {{{2
next : function () {
	var current_character = this.streamer.next(true);

	if (! current_character) { return null; }

	for (var i = this.parsers.length - 1; i >= 0; --i) {
		if (this.parsers[i].is && ! this.parsers[i].is(current_character, this.streamer)) { continue; }

		var token = new this.parsers[i].Token();
		token.initialize(current_character, this.streamer);

		return token;
	}
},

// Register {{{2
register : function (parser) {
	parser = new Parser(parser);

	this.parsers.push(parser);
	this.parsers.sort(sort_handler);

	return this;
},
// }}}2

};
// }}}1

module.exports = Tokenizer;
