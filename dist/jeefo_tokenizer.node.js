
"use strict";

module.exports = function (jeefo) {

/**
 * jeefo_core : v0.0.8
 * Author     : je3f0o, <je3f0o@gmail.com>
 * Homepage   : https://github.com/je3f0o/jeefo_core
 * License    : The MIT License
 * Copyright  : 2017
 **/
jeefo.use(function () {

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : core.js
* Created at  : 2017-04-08
* Updated at  : 2017-05-07
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var core_module = jeefo.module("jeefo_core", []),

CAMEL_CASE_REGEXP = /[A-Z]/g,
dash_case = function (str) {
	return str.replace(CAMEL_CASE_REGEXP, function (letter, pos) {
		return (pos ? '-' : '') + letter.toLowerCase();
	});
},
snake_case = function (str) {
	return str.replace(CAMEL_CASE_REGEXP, function (letter, pos) {
		return (pos ? '_' : '') + letter.toLowerCase();
	});
},

to_string          = Object.prototype.toString,
function_to_string = Function.toString,

IS_DIGITS_SIGNED_INT      = /^\-?\d+$/,
IS_DIGITS_UNSIGNED_INT    = /^\d+$/,
IS_DIGITS_SIGNED_NUMBER   = /^\-?\d+(?:.\d+)?$/,
IS_DIGITS_UNSIGNED_NUMNER = /^\d+(?:.\d+)?$/,

// Used to detect host constructors (Safari > 4; really typed array specific)
HOST_CONSTRUCTOR_REGEX = /^\[object .+?Constructor\]$/,
/*
// Compile a regexp using a common native method as a template.
// We chose `Object#toString` because there's a good chance it is not being mucked with.
new RegExp('^' +
	// Coerce `Object#toString` to a string
	String(to_string).
		// Escape any special regexp characters
		replace(/[.*+?^${}()|[\]\/\\]/g, "\\$&").
		// Replace mentions of `toString` with `.*?` to keep the template generic.
		// Replace thing like `for ...` to support environments like Rhino which add extra info
		// such as method arity.
		replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + '$'
)
*/
NATIVE_REGEX = /^function.*?\(\) \{ \[native code\] \}$/,

is_date = function (value) {
	return to_string.call(value) === "[object Date]";
},

is_regex = function (value) {
	return to_string.call(value) === "[object RegExp]";
},

is_digits = function (value, is_unsigned) {
	return (is_unsigned ? IS_DIGITS_UNSIGNED_NUMNER : IS_DIGITS_SIGNED_NUMBER).test(value);
},

is_digits_int = function (value, is_unsigned) {
	return (is_unsigned ? IS_DIGITS_UNSIGNED_INT : IS_DIGITS_SIGNED_INT).test(value);
},

is_native = function (value) {
	var type = typeof value;
	return type === "function" ?
		// Use `Function#toString` to bypass the value's own `toString` method
		// and avoid being faked out.
		NATIVE_REGEX.test(function_to_string.call(value)) :
		// Fallback to a host object check because some environments will represent
		// things like typed arrays as DOM methods which may not conform to the
		// normal native pattern.
		(value && type === "object" && HOST_CONSTRUCTOR_REGEX.test(to_string.call(value))) || false;	
},

json_parse = function (value) {
	try {
		return JSON.parse(value);
	} catch (e) {}
};

core_module.extend("namespace", ["$injector", "make_injectable"], function (injector, make_injectable) {
	return function (full_name) {
		var namespaces = full_name.split('.'),
			name = namespaces.pop(),
			i = 0, namespace = '', part, container;

		for (; i < namespaces.length; ++i) {
			part = namespaces[i];

			if (namespace) {
				container = injector.resolve_sync(namespace);
			}

			namespace = namespace ? namespace + '.' + part : part;

			if (! injector.has(namespace)) {
				injector.register(namespace, {
					fn : function () { return {}; }
				});

				if (container) {
					container[part] = injector.resolve_sync(namespace);
				}
			}
		}

		injector.register(full_name, make_injectable.apply(null, arguments));

		if (namespace) {
			container       = injector.resolve_sync(namespace);
			container[name] = injector.resolve_sync(full_name);
		}

		return this;
	};
}).

namespace("transform.dash_case", function () {
	return dash_case;
}).

namespace("transform.snake_case", function () {
	return snake_case;
}).

extend("curry", [
	"$injector",
	"make_injectable",
	"transform.snake_case",
], function ($injector, make_injectable, snake_case) {
	return function (name) {
		$injector.register(snake_case(name + "Curry"), make_injectable.apply(null, arguments));
		return this;
	};
}).

extend("run", ["$injector", "$q", "Array"], function ($injector, $q, Arr) {
	var instance = this;

	return function (dependencies, fn) {
		if (typeof dependencies === "function") {
			dependencies.call(this);
		} else if (typeof dependencies === "string") {
			$injector.resolve(dependencies).then(function (value) {
				fn.call(instance, value);
			});
		} else {
			var	args = new Arr(dependencies.length);

			$q.for_each_async(dependencies, function (dependency, index, next) {
				$injector.resolve(dependency).then(function (value) {
					args[index] = value;
					next();
				});
			}).then(function () {
				fn.apply(instance, args);
			});
		}

		return this;
	};
}).

extend("factory", [
	"$injector",
	"make_injectable",
	"transform.snake_case",
], function ($injector, make_injectable, snake_case) {
	return function (name) {
		$injector.register(snake_case(name + "Factory"), make_injectable.apply(null, arguments));
		return this;
	};
}).

extend("service", [
	"$injector",
	"make_injectable",
	"transform.snake_case",
], function ($injector, make_injectable, snake_case) {
	return function (name) {
		var injectable = make_injectable.apply(null, arguments);
		injectable.is_constructor = true;

		$injector.register(snake_case(name + "Service"), injectable);
		return this;
	};
}).

run("$injector", function ($injector) {

	$injector.register("is_date", {
		fn : function () { return is_date; }
	}).
	register("is_regex", {
		fn : function () { return is_regex; }
	}).
	register("is_digit", {
		fn : function () { return is_digits; }
	}).
	register("is_digit_int", {
		fn : function () { return is_digits_int; }
	}).
	register("is_native", {
		fn : function () { return is_native; }
	}).
	register("json_parse", {
		fn : function () { return json_parse; }
	});

});

});

/**
 * jeefo_tokenizer : v0.0.18
 * Author          : je3f0o, <je3f0o@gmail.com>
 * Homepage        : https://github.com/je3f0o/jeefo_tokenizer
 * License         : The MIT License
 * Copyright       : 2017
 **/
jeefo.use(function () {

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token.js
* Created at  : 2017-04-08
* Updated at  : 2017-05-06
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Token = function () {};
Token.prototype = {
	error : function (message) {
		var error = new SyntaxError(message);
		error.value        = this.value;
		error.lineNumber   = this.start.line;
		error.columnNumber = this.start.column;
		throw error;
	},
	error_unexpected_type : function () {
		this.error("Unexpected " + this.type);
	},
	error_unexpected_token : function () {
		this.error("Unexpected token");
	},
};

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : region.js
* Created at  : 2017-04-08
* Updated at  : 2017-05-07
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
RegionDefinition.prototype = {
	RegionDefinition : RegionDefinition,

	copy : function () {
		return new this.RegionDefinition(this);
	},

	find_special_characters : function (container) {
		for (var i = container.length - 1; i >= 0; --i) {
			if (container[i].type === "SpecialCharacter") {
				return container[i].chars.join('');
			}
		}
	},
};

var Region = function (language) {
	this.hash                   = {};
	this.language               = language;
	this.global_null_regions    = [];
	this.contained_null_regions = [];
};
Region.prototype = {
	RegionDefinition : RegionDefinition,

	sort_function : function (a, b) { return a.start.length - b.start.length; },

	register : function (region) {
		region = new this.RegionDefinition(region);

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
	},

	// Find {{{1
	find : function (parent, streamer) {
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

						for (start = container[i].start, k = start.length - 1; k >= 1; --k) {
							if (streamer.peek(streamer.current_index + k) !== start.charAt(k)) {
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

					for (start = container[i].start, k = start.length - 1; k >= 1; --k) {
						if (streamer.peek(streamer.current_index + k) !== start.charAt(k)) {
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
	},
	// }}}1
};

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2017-05-06
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var StringStream = function (string) {
	this.string        = string;
	this.current_index = 0;
};
StringStream.prototype = {
	peek : function (index) {
		return this.string.charAt(index);
	},
	seek : function (offset, length) {
		return this.string.substring(offset, offset + length);
	},
	next : function () {
		return this.peek( ++this.current_index );
	},
	current : function () {
		return this.peek(this.current_index);
	},
};

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : token_parser.js
* Created at  : 2017-04-08
* Updated at  : 2017-05-07
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
TokenParser.prototype = {

is_array : Array.isArray,

// Main parser {{{1
parse : function (source) {
	var streamer          = this.streamer = new StringStream(source),
		current_character = streamer.current(), region;

	while (current_character) {
		if (this.current_region) {
			if (current_character === this.current_region.escape_char) {
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

	return token;
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

});

return jeefo

};