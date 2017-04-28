!function(e){var n=e.module("jeefo_core",[]),r=function(e){return function(n,r,t,c){return"function"===typeof r?(c=t,t=r,r=[]):"string"===typeof r&&(r=[r]),void 0===c&&(c=!0),e.call(this,n,{fn:t,dependencies:r,resolve_once:c})}},t=function(e){var n=function(n,r){return(r?e:"")+n.toLowerCase()};return function(){return this.replace(/[A-Z]/g,n)}};String.prototype.dash_case=t("-"),String.prototype.snake_case=t("_"),n.extend("curry",["$injector"],function(e){return r(function(n,r){e.register((n+"Curry").snake_case(),r)})}),n.curry("makeInjectable",function(){return r}),n.extend("run",["$injector"],function(e){var n=Array;return function(r,t){var c,o,i=0;if("function"===typeof r)t=r,o=[];else if("string"===typeof r)o=[e.resolve_sync(r)];else for(i=0,c=r.length,o=new n(c);i<c;++i)o[i]=e.resolve_sync(r[i]);return t.apply(this,o)}}),n.extend("namespace",["$injector","make_injectable_curry"],function(e,n){return n(function(n,r){for(var t,c,o=n.split("."),i=o.pop(),s=0,u=o.length,a="";s<u;++s)t=o[s],a&&(c=e.resolve_sync(a)),a=a?a+"."+t:t,e.has(a)||(e.register(a,{dependencies:[],resolve_once:!0,fn:function(){return{}}}),c&&(c[t]=e.resolve_sync(a)));e.register(n,r),a&&(c=e.resolve_sync(a),c[i]=e.resolve_sync(n))})}),n.extend("factory",["$injector","make_injectable_curry"],function(e,n){return n(function(n,r){e.register((n+"Factory").snake_case(),r)})}),n.extend("service",["$injector","make_injectable_curry"],function(e,n){return n(function(n,r){r.is_constructor=!0,e.register((n+"Service").snake_case(),r)})})}(jeefo);

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token.js
* Created at  : 2017-04-08
* Updated at  : 2017-04-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

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

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : region.js
* Created at  : 2017-04-08
* Updated at  : 2017-04-20
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var RegionDefinition = function (type, name, start, end, skip, contains, ignore) {
	this.type     = type;
	this.name     = name;
	this.start    = start;
	this.end      = end;
	this.skip     = skip     || null;
	this.contains = contains || null;
	this.ignore   = ignore   || null;

	if (contains) {
		this.contains_chars = this.find_special_characters(contains);
	}
	if (ignore) {
		this.ignore_chars = this.find_special_characters(ignore);
	}
};
RegionDefinition.prototype.find_special_characters = function (container) {
	for (var i = 0, len = container.length; i < len; ++i) {
		if (container[i].type === "SpecialCharacter") {
			return container[i].chars.join('');
		}
	}
};

var Region = function (language) {
	this.language  = language;
	this.container = [];
};
p = Region.prototype;

p.register = function (region) {
	this.container.push(new RegionDefinition(
		region.type,
		region.name,
		region.start,
		region.end,
		region.skip,
		region.contains,
		region.ignore
	));
};

p.find = function (streamer) {
	var container  = this.container,
		i = 0, i_len = container.length,
		current_index = streamer.current_index,
		is_matched, start, j, j_len;

	for (; i < i_len; ++i) {
		start = container[i].start;

		is_matched = true;

		for (j = 0, j_len = start.length; j < j_len; ++j) {
			if (streamer.peek(current_index + j) !== start[j]) {
				is_matched = false;
				break;
			}
		}

		if (is_matched) {
			return new RegionDefinition(
				container[i].type,
				container[i].name,
				container[i].start,
				container[i].end,
				container[i].skip,
				container[i].contains,
				container[i].ignore
			);
		}
	}

	return null;
};

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2017-04-12
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

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

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token_parser.js
* Created at  : 2017-04-08
* Updated at  : 2017-04-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

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