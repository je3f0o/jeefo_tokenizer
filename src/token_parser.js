/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token_parser.js
* Created at  : 2017-04-08
* Updated at  : 2017-05-06
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global jeefo */
/* exported */
/* exported */

var Token        = require("./token"),
	Region       = require("./region"),
	StringStream = require("./string_stream");

//ignore:end

var TokenParser = function (language, regions) {
	this.lines  = [{ number : 1, index : 0 }];
	this.start  = { line : 1, column : 1 };
	this.tokens = [];
	this.stack  = [];

	this.regions  = regions;
	this.language = language;
};
TokenParser.prototype = {

is_array : Array.isArray,

// Main parser {{{1
parse : function (source) {
	var streamer          = this.streamer = new StringStream(source),
		current_character = streamer.current(), region;

	while (current_character) {
		if (this.current_region) {
			if (this.current_region.ignore_chars && this.current_region.ignore_chars.indexOf(current_character) !== -1) {
				current_character = streamer.next();
				continue;
			} else if (this.region_end(this.current_region)) {
				this.current_token  = this.current_token.parent;
				this.current_region = this.current_region.parent;

				current_character = streamer.next();
				continue;
			}
		}

		// Region {{{2
		region = this.regions.find(this.current_region, streamer);
		if (region) {
			this.parse_region(region);

			if (region.keepend) {
				this.stack.push({
					token  : this.current_token,
					region : region,
				});
			}

		// White space {{{2
		} else if (current_character <= ' ') {
			this.handle_new_line(current_character);

		// Number {{{2
		} else if (current_character >= '0' && current_character <= '9') {
			this.parse_number();

		// Identifier {{{2
		} else if (this.SPECIAL_CHARACTERS.indexOf(current_character) === -1) {
			this.parse_identifier();

		// Special character {{{2
		} else {
			this.parse_special_character();
		}
		// }}}2

		current_character = streamer.next();
	}

	return this.tokens;
},

// Parse number {{{1
parse_number : function () {
	var streamer = this.streamer, current_character;

	this.prepare_new_token(streamer.current_index);

	// jshint curly : false
	for (current_character = streamer.next(); current_character >= '0' && current_character <= '9' ;
		current_character = streamer.next());
	// jshint curly : true

	this.add_token( this.make_token("Number") );
	this.streamer.current_index -= 1;
},

// Parse Identifier {{{1

SPECIAL_CHARACTERS : [
	',', '.', ';', ':',
	'<', '>', '~', '`',
	'!', '@', '#', '|', 
	'%', '^', '&', '*',
	'(', ')', '-', '+',
	'=', '[', ']', '/',
	'?', '"', '{', '}',
	'_', "'", '\\',
].join(''),

parse_identifier : function () {
	var streamer = this.streamer, current_character;

	this.prepare_new_token(streamer.current_index);

	// jshint curly : false
	for (current_character = streamer.next(); // initialization terminator
		current_character > ' ' && this.SPECIAL_CHARACTERS.indexOf(current_character) === -1;
		current_character = streamer.next());
	// jshint curly : true

	this.add_token( this.make_token("Identifier") );
	streamer.current_index -= 1;
},

// Parse region {{{1
parse_region : function (region) {
	var streamer = this.streamer,
		i, is_matched, current_character, current_token;

	this.prepare_new_token(streamer.current_index);

	if (region.start) {
		streamer.current_index += region.start.length;
	}

	if (region.contains) {
		current_token          = this.make_token(region.type, region.name);
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

		if (region.start) {
			streamer.current_index -= 1;
		}
		return;
	}

	current_character = streamer.current();

	while (current_character) {
		this.handle_new_line(current_character);

		// escape handler
		if (current_character === region.escape_char) {
			streamer.current_index += 2;
			current_character = streamer.current();
			continue;
		}

		// skip handler
		if (region.skip && current_character === region.skip.charAt(0)) {
			for (i = 1, is_matched = true; i < region.skip.length; ++i) {
				if (streamer.peek(streamer.current_index + i) !== region.skip.charAt(i)) {
					is_matched = false;
					break;
				}
			}

			if (is_matched) {
				streamer.current_index += region.skip.length;
				current_character = streamer.current();
				continue;
			}
		}

		if (this.region_end(region, true)) {
			return;
		}

		current_character = streamer.next();
	}
},

// Parse special character {{{1
parse_special_character : function () {
	if (this.current_region &&
		(! this.current_region.contains_chars || this.current_region.contains_chars.indexOf(this.streamer.current()) === -1)) {
		this.prepare_new_token(this.streamer.current_index);
		this.streamer.current_index += 1;
		this.make_token("SpecialCharacter").error_unexpected_token();
	}

	this.prepare_new_token(this.streamer.current_index);
	this.streamer.current_index += 1;

	this.add_token( this.make_token("SpecialCharacter") );
	this.streamer.current_index -= 1;
},

// Check end token {{{1
region_end : function (region, to_add) {
	var i = 0;
	if (this.is_array(region.end)) {
		for (; i < region.end.length; ++i) {
			if (this.check_end_token(region, region.end[i], to_add)) {
				this.finallzie_region(region);
				return true;
			}
		}
	}

	if (this.check_end_token(region, region.end, to_add)) {
		this.finallzie_region(region);
		return true;
	}

	if (this.region_end_stack(region, to_add)) {
		return true;
	}
},

finallzie_region : function (region) {
	for (var i = 0; i < this.stack.length; ++i) {
		if (this.stack[i].region === region) {
			this.current_token  = this.stack[i].token;
			this.current_region = this.stack[i].region;
			this.stack.splice(i, this.stack.length);
		}
	}
},

region_end_stack : function (region, to_add) {
	for (var i = this.stack.length - 1, j; i >= 0; --i) {
		if (this.is_array(this.stack[i].region.end)) {
			for (j = 0; j < this.stack[i].region.end.length; ++j) {
				if (this.check_end_token(region, this.stack[i].region.end[j], to_add)) {
					this.finallzie_region(this.stack[i].region);
					return true;
				}
			}
		} else if (this.check_end_token(region, this.stack[i].region.end, to_add)) {
			this.finallzie_region(this.stack[i].region);
			return true;
		}
	}
},

check_end_token : function (region, end, to_add) {
	var i        = 1,
		streamer = this.streamer;

	if (streamer.current() === end.charAt(0)) {
		for (; i < end.length; ++i) {
			if (streamer.peek(streamer.current_index + i) !== end.charAt(i)) {
				return false;
			}
		}

		if (! region.until) {
			streamer.current_index += end.length;
		}

		if (to_add) {
			var token = this.make_token(region.type, region.name);
			this.set_value(token, region.start ? region.start.length : 0, region.until ? 0 : end.length);

			this.add_token(token);
		} else {
			this.set_end(this.current_token);
			this.set_value(this.current_token, region.start ? region.start.length : 0, region.until ? 0 : end.length);
		}

		streamer.current_index -= 1;

		return true;
	}
},
// }}}1

handle_new_line : function (current_character) {
	if (current_character === '\r' || current_character === '\n') {
		this.new_line();
	}
},

new_line : function () {
	this.lines.push({
		number : (this.lines.length + 1),
		index  : (this.streamer.current_index + 1),
	});
},

// Set value without surrounding
set_value : function (token, start_length, end_length) {
	token.value = this.streamer.seek(
		token.start.index + start_length,
		(token.end.index - token.start.index - start_length - end_length)
	);
},

set_end : function (token) {
	token.end.line   = this.lines.length;
	token.end.column = (this.streamer.current_index - this.lines[this.lines.length - 1].index);
	token.end.index  = this.streamer.current_index;
},

prepare_new_token : function (current_index) {
	this.start = {
		line   : this.lines.length,
		column : (current_index - this.lines[this.lines.length - 1].index) + 1,
		index  : current_index
	};
},

add_token : function (token) {
	if (this.current_token) {
		this.current_token.children.push(token);
	} else {
		this.tokens.push(token);
	}
},

make_token : function (type, name) {
	var offset = this.start.index,
		length = this.streamer.current_index - this.start.index,
		token  = new Token();

	token.type  = type;
	token.name  = name || type;
	token.value = this.streamer.seek(offset, length);
	token.start = this.start;
	token.end   = {
		line           : this.lines.length,
		column         : (this.streamer.current_index - this.lines[this.lines.length - 1].index) + 1,
		virtual_column : this.lines.column,
		index          : this.streamer.current_index
	};
},

};

var jeefo_tokenizer = jeefo.module("jeefo_tokenizer", ["jeefo_core"]);
jeefo_tokenizer.namespace("tokenizer.Token", function () {
	return Token;
}).
namespace("tokenizer.Region", function () {
	return Region;
}).
namespace("tokenizer.TokenParser", function () {
	return TokenParser;
});
