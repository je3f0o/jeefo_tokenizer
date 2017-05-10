/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : tokenizer.js
* Created at  : 2017-05-10
* Updated at  : 2017-05-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var Tokenizer = function (language, regions) {
	this.regions                = regions || new this.Regions();
	this.language               = language;
	this.global_null_regions    = [];
	this.contained_null_regions = [];
};

// Prototypes {{{1
Tokenizer.prototype = {
	Regions       : Regions,
	Tokenizer     : Tokenizer,
	StringStream  : StringStream,
	LexicalParser : LexicalParser,

	inherit : function (language) {
		return new this.Tokenizer(language, this.regions.$copy());
	},

	parse : function (source) {
		var lexical  = new this.LexicalParser(),
			streamer = new this.StringStream(source);

		return lexical.parse(streamer, this.regions);
	},
};
// }}}1

jeefo_tokenizer.namespace("tokenizer.Token", function () {
	return Token;
}).
namespace("tokenizer.Regions", function () {
	return Regions;
}).
namespace("tokenizer.LexicalParser", function () {
	return LexicalParser;
}).
namespace("tokenizer.Tokenizer", function () {
	return Tokenizer;
});
