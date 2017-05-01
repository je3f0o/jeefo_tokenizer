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
* Updated at  : 2017-05-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var RegionDefinition = function (definition) {
	this.type  = definition.type;
	this.name  = definition.name || definition.type;
	this.start = definition.start;
	this.end   = definition.end;

	if (definition.skip)        { this.skip        = definition.skip;        }
	if (definition.until)       { this.until       = definition.until;       }
	if (definition.keepend)     { this.keepend     = definition.keepend;     }
	if (definition.contains)    { this.contains    = definition.contains;    }
	if (definition.contained)   { this.contained   = definition.contained;   }
	if (definition.escape_char) { this.escape_char = definition.escape_char; }

	if (definition.contains) { this.contains_chars = this.find_special_characters(definition.contains); }
};
p = RegionDefinition.prototype;

p.RegionDefinition = RegionDefinition;

p.copy = function () {
	return new this.RegionDefinition(this);
};

p.find_special_characters = function (container) {
	for (var i = 0; i < container.length; ++i) {
		if (container[i].type === "SpecialCharacter") {
			return container[i].chars.join('');
		}
	}
};

var Region = function (language) {
	this.hash                   = {};
	this.language               = language;
	this.global_null_regions    = [];
	this.contained_null_regions = [];
};
p = Region.prototype;

p.sort_function = function (a, b) { return a.start.length - b.start.length; };

p.register = function (region) {
	region = new RegionDefinition(region);

	if (region.start) {
		if (this.hash[region.start[0]]) {
			this.hash[region.start[0]].push(region);

			this.hash[region.start[0]].sort(this.sort_function);
		} else {
			this.hash[region.start[0]] = [region];
		}
	} else if (region.contained) {
		this.contained_null_regions.push(region);
	} else {
		if (this.global_null_region) {
			throw Error("Overwritten global null region.");
		}
		this.global_null_region = region;
	}
};

// Find {{{1
p.find = function (parent, streamer) {
	var i         = 0,
		container = this.hash[streamer.current()],
		start, j, k;
	
	// Has parent {{{2
	if (parent && parent.contains) {

		// Search for contained regions {{{3
		if (container) {
			CONTAINER:
			for (i = container.length - 1; i >= 0; --i) {
				for (j = parent.contains.length - 1; j >= 0; --j) {
					if (container[i].type !== parent.contains[j].type) {
						continue;
					}

					for (k = 1, start = container[i].start; k < start.length; ++k) {
						if (streamer.peek(streamer.current_index + k) !== start[k]) {
							continue CONTAINER;
						}
					}

					return container[i].copy();
				}
			}
		}

		// Looking for null regions {{{3
		for (i = parent.contains.length - 1; i >= 0; --i) {
			for (j = this.contained_null_regions.length - 1; j >= 0; --j) {
				if (this.contained_null_regions[j].type === parent.contains[i].type) {
					return this.contained_null_regions[j].copy();
				}
			}
		}
		// }}}3

	// No parent {{{2
	// It means lookup for only global regions
	} else {

		// Has container {{{3
		if (container) {

			NO_PARENT_CONTAINER:
			for (i = container.length - 1; i >= 0; --i) {
				if (container[i].contained) {
					continue;
				}

				for (k = 1, start = container[i].start; k < start.length; ++k) {
					if (streamer.peek(streamer.current_index + k) !== start[k]) {
						continue NO_PARENT_CONTAINER;
					}
				}

				return container[i].copy();
			}
		}
	
		// Finally {{{3
		if (this.global_null_region) {
			return this.global_null_region.copy();
		}
		// }}}3

	}
	// }}}2

};
// }}}1

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
* Updated at  : 2017-05-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var TokenParser = function (language, regions) {
	this.lines  = [{ number : 1, index : 0 }];
	this.start  = { line : 1, column : 1 };
	this.tokens = [];
	this.stack  = [];

	this.regions  = regions;
	this.language = language;
};
p = TokenParser.prototype;

p.is_array = Array.isArray;

// Main parser {{{1
p.parse = function (source) {
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
};

// Parse number {{{1
p.parse_number = function () {
	var streamer = this.streamer, current_character;

	this.prepare_new_token(streamer.current_index);

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
	'_', "'", '\\',
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
		if (region.skip && current_character === region.skip[0]) {
			for (i = 1, is_matched = true; i < region.skip.length; ++i) {
				if (streamer.peek(streamer.current_index + i) !== region.skip[i]) {
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
};

// Parse special character {{{1
p.parse_special_character = function () {
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
};

// Check end token {{{1
p.region_end = function (region, to_add) {
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
};

p.finallzie_region = function (region) {
	for (var i = 0; i < this.stack.length; ++i) {
		if (this.stack[i].region === region) {
			this.current_token  = this.stack[i].token;
			this.current_region = this.stack[i].region;
			this.stack.splice(i, this.stack.length);
		}
	}
};

p.region_end_stack = function (region, to_add) {
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
};

p.check_end_token = function (region, end, to_add) {
	var i        = 1,
		streamer = this.streamer;

	if (streamer.current() === end[0]) {
		for (; i < end.length; ++i) {
			if (streamer.peek(streamer.current_index + i) !== end[i]) {
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

// Set value without surrounding
p.set_value = function (token, start_length, end_length) {
	token.value = this.streamer.seek(
		token.start.index + start_length,
		(token.end.index - token.start.index - start_length - end_length)
	);
};

p.set_end = function (token) {
	token.end.line   = this.lines.length;
	token.end.column = (this.streamer.current_index - this.lines[this.lines.length - 1].index);
	token.end.index  = this.streamer.current_index;
};

p.prepare_new_token = function (current_index) {
	this.start = {
		line   : this.lines.length,
		column : (current_index - this.lines[this.lines.length - 1].index) + 1,
		index  : current_index
	};
};

p.add_token = function (token) {
	if (this.current_token) {
		this.current_token.children.push(token);
	} else {
		this.tokens.push(token);
	}
};

p.make_token = function (type, name) {
	var offset = this.start.index,
		length = this.streamer.current_index - this.start.index;

	return new Token({
		type  : type,
		name  : name || type,
		value : this.streamer.seek(offset, length),
		start : this.start,
		end : {
			line           : this.lines.length,
			column         : (this.streamer.current_index - this.lines[this.lines.length - 1].index) + 1,
			virtual_column : this.lines.column,
			index          : this.streamer.current_index
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