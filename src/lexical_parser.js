/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : lexical_parser.js
* Created at  : 2017-04-08
* Updated at  : 2017-06-03
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start

/* globals assign, jeefo_tokenizer, StringStream */
/* exported */

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

var Parser = function (parser) {
	this.Token = function () {};
	this.assign(this.Token.prototype, this.default_protos, parser.protos);
	if (parser.is) {
		this.is = parser.is;
	}
};
Parser.prototype = {
	assign         : assign,
	default_protos : {
		type       : "UndefinedToken",
		precedence : 0,
	},
};

// Tokenizer {{{1
// Constructor {{{2
var Tokenizer = function (parsers) {
	this.parsers = parsers || [];
};
// Prototypes {{{2
Tokenizer.prototype = {

Parser       : Parser,
Tokenizer    : Tokenizer,
StringStream : StringStream,

sort_handler : function (a, b) {
	return a.Token.prototype.precedence - b.Token.prototype.precedence;
},

copy : function () {
	var i = 0, parsers = [];
	for (; i < this.parsers.length; ++i) {
		parsers[i] = this.parsers[i];
	}
	return new this.Tokenizer(parsers);
},

// Init {{{3
init : function (source, tab_space) {
	this.streamer = new this.StringStream(source, tab_space);
},

// Next {{{3
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

// Register {{{3
register : function (parser) {
	parser = new this.Parser(parser);

	this.parsers.push(parser);
	this.parsers.sort(this.sort_handler);

	return this;
},
// }}}3

};
// }}}2
// }}}1

jeefo_tokenizer.namespace("tokenizer.StringStream", function () {
	return StringStream;
}).
namespace("tokenizer.Tokenizer", function () {
	return Tokenizer;
});
