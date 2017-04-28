/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token_parser.js
* Created at  : 2017-04-08
* Updated at  : 2017-04-26
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

var jeefo        = require("jeefo_core"),
	Token        = require("./token"),
	Region       = require("./region"),
	StringStream = require("./string_stream");

//ignore:end

var TokenParser = function (language, regions) {
	this.lines  = [{ number : 1, index : 0 }];
	this.start  = { line : 1, column : 1 };
	this.tokens = [];

	this.regions  = regions;
	this.language = language;
};
p = TokenParser.prototype;

// Main parser {{{1
p.parse = function (source) {
	var streamer          = this.streamer = new StringStream(source),
		current_character = streamer.current(), region;

	while (current_character) {

		// White space {{{3
		// Хэрвээ хоосон зай бол алгасна.
        if (current_character <= ' ') {
			this.handle_new_line(current_character);

		// }}}3
		} else {
			// Region {{{3
			region = this.regions.find(streamer);
			if (region) {
				this.parse_region(region);

			// Number {{{3
			} else if (current_character >= '0' && current_character <= '9') {
				this.parse_number();

			// Identifier {{{3
			} else if (this.SPECIAL_CHARACTERS.indexOf(current_character) === -1) {
				this.parse_identifier();

			// Special character {{{3
			} else {
				this.parse_special_character();
			}
			// }}}3
		}

		current_character = streamer.next();
	}

	return this.tokens;
};

// Parse number {{{1
//
// Тоо нь цэгээр эхэлж болохгүй, энэ нь програмыг уншихад улам төвөгтэй болгодог.
// Бутархай тоо тэгээр (0) эхэлж болно.
//

p.IS_FINITE = isFinite;
p.NUMBER_VALIDATION = [
	',', ';',            // separators
	'}', ']', ')',       // parentases
	'*','/','+','-','%', // math operators
	' ','\t','\r','\n',  // white spaces operators
	'<','>',             // conditions operators
	'?',':',             // ternary operatoes
	'^','&','|','/'      // binary operators
].join('');

p.parse_number = function () {
	var streamer = this.streamer, current_character;

	this.prepare_new_token(streamer.current_index);

	// Үргэлжлүүлээд дараагийн орны тоонуудыг харъя...
	// jshint curly : false
	for (current_character = streamer.next(); current_character >= '0' && current_character <= '9' ;
		current_character = streamer.next());
	// jshint curly : true

	this.add_token( this.make_token("Number") );
	this.streamer.current_index -= 1;
};

// Parse Identifier {{{1

p.SPECIAL_CHARACTERS = [
	',', '.', ';', ':',
	'<', '>', '~', '`',
	'!', '@', '#', '|', 
	'%', '^', '&', '*',
	'(', ')', '-', '+',
	'=', '[', ']', '/',
	'?', '"', '{', '}',
	'\\', '\'', '_'
].join('');

p.parse_identifier = function () {
	var streamer = this.streamer, current_character;

	this.prepare_new_token(streamer.current_index);

	// jshint curly : false
	for (current_character = streamer.next(); // initialization terminator
		current_character > ' ' && this.SPECIAL_CHARACTERS.indexOf(current_character) === -1;
		current_character = streamer.next());
	// jshint curly : true

	this.add_token( this.make_token("Identifier") );
	streamer.current_index -= 1;
};

// Parse region {{{1
p.parse_region = function (region) {
	var skip = region.skip, end = region.end,
		streamer = this.streamer,
		len = end.length,
		i, is_matched, current_character, current_token;

	this.prepare_new_token(streamer.current_index);
	streamer.current_index += region.start.length;

	if (region.contains) {
		current_token          = this.make_token(region.type);
		current_token.children = [];

		if (this.current_token) {
			region.parent        = this.current_region;
			current_token.parent = this.current_token;
			this.current_token.children.push(current_token);
		} else {
			this.tokens.push( current_token );
		}

		this.current_token  = current_token;
		this.current_region = region;
		streamer.current_index -= 1;
		return;
	}

	current_character = streamer.current();

	while (current_character) {
		this.handle_new_line(current_character);

		// skip handler
		if (skip && current_character === skip[0]) {
			is_matched = true;

			for (i = 1; i < len; ++i) {
				if (streamer.peek(streamer.current_index + i) !== skip[i]) {
					is_matched = false;
					break;
				}
			}

			if (is_matched) {
				streamer.current_index += skip.length;
				current_character = streamer.peek(streamer.current_index);
				continue;
			}
		}

		if (this.check_end_token(streamer.current_index, end)) {
			streamer.current_index += region.end.length;

			this.add_token(
				this.make_token(
					region.type,
					this.start.index + region.start.length,
					streamer.current_index - this.start.index - region.start.length - end.length
				)
			);

			streamer.current_index -= 1;
			return;
		}

		current_character = streamer.next();
	}
};

// Parse special character {{{1
p.parse_special_character = function () {
	var current_index = this.streamer.current_index;

	if (this.current_token) {
		var ignore_chars      = this.current_region.ignore_chars,
			contains_chars    = this.current_region.contains_chars,
			current_character = this.streamer.current();

		if (this.check_end_token(current_index, this.current_region.end)) {
			this.streamer.current_index += this.current_region.end.length;

			this.set_end(this.current_token);
			this.set_value(this.current_token);
			this.current_token  = this.current_token.parent;
			this.current_region = this.current_region.parent;
			this.streamer.current_index -= 1;

			return;
		} else if (ignore_chars && ignore_chars.indexOf(current_character) >= 0) {
			return;
		} else if (! contains_chars || contains_chars.indexOf(current_character) === -1) {
			this.prepare_new_token(current_index);
			this.streamer.current_index += 1;
			this.make_token("SpecialCharacter").error_unexpected_token();
		}
	}

	this.prepare_new_token(current_index);
	this.streamer.current_index += 1;

	this.add_token( this.make_token("SpecialCharacter") );
	this.streamer.current_index -= 1;
};

// Check end token {{{1
p.check_end_token = function (current_index, end) {
	var streamer = this.streamer,
		i = 1, len = end.length, is_matched;

	if (streamer.peek(current_index) === end[0]) {
		is_matched = true;

		for (; i < len; ++i) {
			if (streamer.peek(current_index + i) !== end[i]) {
				is_matched = false;
				break;
			}
		}
	}

	return is_matched;
};
// }}}1

p.handle_new_line = function (current_character) {
	if (current_character === '\r' || current_character === '\n') {
		this.new_line();
	}
};

p.new_line = function () {
	this.lines.push({
		number : (this.lines.length + 1),
		index  : (this.streamer.current_index + 1),
	});
};

p.set_value = function (token) {
	token.value = this.streamer.seek(
		token.start.index,
		(token.end.index - token.start.index)
	);
};

p.set_end = function (token) {
	token.end = {
		line   : this.lines.length,
		column : (this.streamer.current_index - this.lines[this.lines.length - 1].index) + 1,
		index  : this.streamer.current_index
	};
};

p.prepare_new_token = function (current_index) {
	this.start    = {
		line   : this.lines.length,
		column : (current_index - this.lines[this.lines.length - 1].index) + 1,
		index  : current_index
	};
};

p.add_token = function (token) {
	var current_token = this.current_token;
	if (current_token) {
		this.set_end(current_token);
		this.set_value(current_token);
		current_token.children.push(token);
	} else {
		this.tokens.push(token);
	}
};

p.make_token = function (type, offset, length) {
	if (offset === void 0) {
		offset = this.start.index;
		length = this.streamer.current_index - this.start.index;
	}

	return new Token({
		type  : type,
		value : this.streamer.seek(offset, length),
		start : this.start,
		end : {
			line   : this.lines.length,
			column : (this.streamer.current_index - this.lines[this.lines.length - 1].index) + 1,
			index  : this.streamer.current_index
		},
	});
};

var jeefo_tokenizer = jeefo.module("jeefo_tokenizer", ["jeefo_core"]);
jeefo_tokenizer.namespace("tokenizer.Token", function () {
	return Token;
});
jeefo_tokenizer.namespace("tokenizer.Region", function () {
	return Region;
});
jeefo_tokenizer.namespace("tokenizer.TokenParser", function () {
	return TokenParser;
});
