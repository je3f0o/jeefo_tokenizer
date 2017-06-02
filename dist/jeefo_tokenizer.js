/**
 * jeefo_tokenizer : v0.0.26
 * Author          : je3f0o, <je3f0o@gmail.com>
 * Homepage        : https://github.com/je3f0o/jeefo_tokenizer
 * License         : The MIT License
 * Copyright       : 2017
 **/
jeefo.use(function (jeefo) {

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2017-06-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var assign,
	JeefoObject,
	jeefo_tokenizer = jeefo.module("jeefo_tokenizer", ["jeefo_core"]).
	run(["object.assign", "JeefoObject"], function (a, jo) {
		assign      = a;
		JeefoObject = jo;
	});

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

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : lexical_parser.js
* Created at  : 2017-04-08
* Updated at  : 2017-06-03
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

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

});