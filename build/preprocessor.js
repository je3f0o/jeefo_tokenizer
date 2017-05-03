/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : preprocessor.js
* Created at  : 2017-04-26
* Updated at  : 2017-05-03
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

var jeefo = require("jeefo");
require("jeefo_javascript_beautifier")(jeefo);
var pp = jeefo.module("jeefo.preprocessor", ["jeefo_javascript_beautifier"]);

/* globals */
/* exported */

//ignore:end

// Preprocessor {{{1
pp.namespace("javascript.Preprocessor", ["javascript.Beautifier"], function (JavascriptBeautifier) {

	// Scope {{{2
	var Scope = function (parent, defs) {
		this.parent   = parent;
		this.children = [];
		if (parent) {
			this.defs  = this.assign({}, parent.defs, defs);
			this.level = parent.level + 1;
		} else {
			this.defs  = this.assign({}, defs);
			this.level = 0;
		}
	},
	p = Scope.prototype;
	p.assign      = jeefo.assign;
	p.Constructor = Scope;

	p.$new = function () {
		var scope = new this.Constructor(this);
		this.children.push(scope);
		return scope;
	};
	p.$destroy = function () {
		var index = this.parent.children.indexOf(this);
		this.parent.children.splice(index, 1);
		return this.parent;
	};

	p.is_replaceable = function () {
		/* Unoptimized code {{{3
		if (this.remove_indices) {
			return false;
		}
		if (this.parent) {
			return this.parent.is_replaceable();
		}
		return true;
		}}}3 */
		return this.remove_indices ? false : this.parent ? this.parent.is_replaceable() : true;
	};
	// }}}2

	// Preprocessor {{{2
	var JavascriptPreprocessor = function (file, defs, indent, indentation) {
		this.file     = file;
		this.scope    = new this.Scope(null, defs);
		this.result   = file.code;
		this.actions  = [];
		this.compiler = new JavascriptBeautifier(indent || '', indentation || '\t');
		this.cache    = {};
	};
	p = JavascriptPreprocessor.prototype;
	p.Scope = Scope;
	p.Def = function (token, ret) {
		this.token = token;

		if (ret) {
			switch (ret.type) {
				case "Identifier" :
					this.is_return = ret.name !== "null" && ret.name !== "false";
					break;
			}
		} else {
			this.is_return = false;
		}
	};

	p.replace_between = function (def) {
		this.result = `${ this.result.substr(0, def.start) }${ def.replacement }${ this.result.substr(def.end) }`;
	};

	p.remove = function (def) {
		this.result = `${ this.result.substr(0, def.start) }${ this.result.substr(def.end) }`;
	};

	p.register = function (action, def) {
		def.type = action;
		this.actions.push(def);
	};

	// Define {{{2
	p.define = function (args, scope) {
		var i = 0, ids = [], def, j;

		switch (args[0].type) {
			case "StringLiteral":
				def = scope.defs[args[0].value] = new this.Def(args[1], args[2]);
				break;
			case "Identifier":
				def = scope.defs[args[0].name] = new this.Def(args[1], args[2]);
				break;
		}

		switch (def.token.type) {
			case "FunctionExpression":
				var params = def.params = new Array(def.token.parameters.length);

				for (i = params.length - 1; i >= 0; --i) {
					if (params.indexOf(def.token.parameters[i].name) !== -1) {
						def.token.parameters[i].error("Duplicated parameter");
					}
					params[i] = {
						ids  : [],
						name : def.token.parameters[i].name,
					};
				}

				this.find("Identifier", def.token.body, ids);

				for (i = 0; i < params.length; ++i) {
					for (j = 0; j < ids.length; ++j) {
						if (params[i].name === ids[j].name) {
							params[i].ids.push(ids[j]);
						}
					}

					params[i] = params[i].ids;
				}

				break;
			default:
				def.compiled = this.compiler.compile(def.token);
		}
	};

	// Find {{{2
	p.find = function (type, token, container, parent) {
		var i = 0;

		switch (token.type) {
			case type:
				container.push(token);
				break;
			case "Program" :
				for (; i < token.body.length; ++i) {
					this.find(type, token.body[i], container, token);
				}
				break;
			case "ObjectLiteral" :
				for (; i < token.properties.length; ++i) {
					this.find(type, token.properties[i].value, container, token);
				}
				break;
			case "ArrayLiteral" :
				for (; i < token.elements.length; ++i) {
					this.find(type, token.elements[i], container, token);
				}
				break;
			case "BinaryExpression" :
			case "LogicalExpression" :
				this.find(type, token.left, container, token);
				this.find(type, token.right, container, token);
				break;
			case "IfStatement" :
				this.find(type, token.test, container, token);
				this.find(type, token.statement, container, token);
				if (token.alternate) {
					this.find(type, token.alternate, container, token);
				}
				break;
			case "ForStatement" :
				if (token.init) {
					this.find(type, token.init, container, token);
				}
				if (token.test) {
					this.find(type, token.test, container, token);
				}
				if (token.update) {
					this.find(type, token.update, container, token);
				}
				this.find(type, token.statement, container, token);
				break;
			case "ReturnStatement" :
				if (token.argument) {
					this.find(type, token.argument, container, token);
				}
				break;
			case "BlockStatement" :
				for (; i < token.body.length; ++i) {
					this.find(type, token.body[i], container, token);
				}
				break;
			case "ExpressionStatement" :
				this.find(type, token.expression, container, token);
				break;
			case "AssignmentExpression" :
				this.find(type, token.left, container, token);
				this.find(type, token.right, container, token);
				break;
			case "MemberExpression" :
				this.find(type, token.object, container, token);
				this.find(type, token.property, container, token);
				break;
			case "NewExpression" :
				this.find(type, token.callee, container, token);
				break;
			case "CallExpression" :
				this.find(type, token.callee, container, token);
				for (; i < token["arguments"].length; ++i) {
					this.find(type, token["arguments"][i], container, token);
				}
				break;
			case "UnaryExpression" :
			case "ReturnStatement" :
				this.find(type, token.argument, container, token);
				break;
			case "VariableDeclaration" :
				for (; i < token.declarations.length; ++i) {
					if (token.declarations[i].init) {
						this.find(type, token.declarations[i].init, container, token); 
					}
				}
				break;
			case "SwitchStatement" :
				for (i = 0; i < token.cases.length; ++i) {
					this.find(type, token.cases[i], container, token);
				}
				break;
			case "SwitchCase" :
				this.find(type, token.test, container);
				for (i = 0; i < token.statements.length; ++i) {
					this.find(type, token.statements[i], container, token);
				}
				break;
			case "FunctionExpression" :
				for (; i < token.parameters.length; ++i) {
					this.find(type, token.parameters[i], container, token);
				}
				this.find(type, token.body, container, token);
				break;
		}
	};

	// Function definition {{{2
	p.call_expression = function (expression, def, scope) {
		var i = 0, j = 0, args = [], statements = [];

		this.compiler.current_indent = '';

		for (; i < expression["arguments"].length; ++i) {
			args.push(this.compiler.compile(expression["arguments"][i]));
		}

		for (i = 1; i < scope.level; ++i) {
			this.compiler.current_indent = this.compiler.current_indent + this.compiler.indentation;
		}
		
		for (i = 0; i < def.params.length; ++i) {
			for (j = 0; j < def.params[i].length; ++j) {
				def.params[i][j].compiled = args[i];
			}
		}

		if (! this.current_expression) {
			this.current_expression = expression;
		}
		this.process(def.token.body.body, scope);

		if (def.is_return) {
			LOOP:
			for (i = 0; i < def.token.body.body.length; ++i) {
				if (def.token.body.body[i].type === "ReturnStatement") {
					statements.push(
						this.compiler.compile(def.token.body.body[i].argument)
					);
					break LOOP;
				}
			}
		} else {
			for (i = 0; i < def.token.body.body.length; ++i) {
				statements.push(
					this.compiler.current_indent + this.compiler.compile(def.token.body.body[i])
				);
			}
		}

		if (this.current_expression === expression) {
			this.register("replace", {
				start       : expression.start.index,
				end         : expression.end.index,
				replacement : statements.join('\n').trim()
			});
			this.current_expression = null;
		} else {
			expression.compiled = statements.join('\n').trim();
		}
	};

	// Expression {{{2
	p.expression = function (expression, scope, t) {
		var i = 0;

		switch (expression.type) {
			case "NumberLiteral" :
			case "StringLiteral" :
			case "RegExpLiteral" :
				return;
			case "Identifier" :
				if (scope.defs[expression.name] && scope.is_replaceable()) {
					this.register("replace", {
						start       : expression.start.index,
						end         : expression.end.index,
						replacement : scope.defs[expression.name].compiled
					});
				}
				break;
			case "CallExpression" :
				switch (expression.callee.type) {
					case "MemberExpression" :
						if (expression.callee.object.name === "PP" && expression.callee.property.name === "define") {
							this.define(expression["arguments"], scope);
						} else {
							for (i = expression["arguments"].length - 1; i >= 0; --i) {
								this.expression(expression["arguments"][i], scope, expression);
							}
							this.expression(expression.callee, scope, expression);
						}
						break;
					case "Identifier":
						if (scope.defs[expression.callee.name]) {
							this.call_expression(expression, scope.defs[expression.callee.name], scope);
						} else {
							for (i = expression["arguments"].length - 1; i >= 0; --i) {
								this.expression(expression["arguments"][i], scope, expression);
							}
							this.expression(expression.callee, scope, expression);
						}
						break;
				}
				break;
			case "AssignmentExpression":
				this.expression(expression.left, scope, expression);
				this.expression(expression.right, scope, expression);
				break;
			case "BinaryExpression":
			case "LogicalExpression":
				this.expression(expression.left, scope, expression);
				this.expression(expression.right, scope, expression);
				break;
			case "FunctionExpression" :
				this.process(expression.body.body, scope.$new());
				break;
			case "MemberExpression" :
				this.expression(expression.object, scope, expression);
				this.expression(expression.property, scope, expression);
				break;
			case "NewExpression" :
				this.expression(expression.callee, scope, expression);
				for (i = expression["arguments"].length - 1; i >= 0; --i) {
					this.expression(expression["arguments"][i], scope, expression);
				}
				break;
			case "ArrayLiteral" :
			case "ObjectLiteral" :
			case "UnaryExpression" :
				break;
			case "ConditionalExpression" :
				if (expression.consequent) {
					this.expression(expression.consequent, scope, expression);
				}
				if (expression.alternate) {
					this.expression(expression.alternate, scope, expression);
				}
				break;
			case "SequenceExpression" :
				for (i = expression.expressions.length - 1; i >= 0; --i) {
					this.expression(expression.expressions[i], scope, expression);
				}
				break;
			case "VariableDeclaration" :
				this.variable_declaration(expression.declarations, scope);
				break;
			case "TemplateLiteral" :
				if (! scope.is_replaceable()) { return; }

				for (i = expression.body.length - 1; i >= 0; --i) {
					if (expression.body[i].type === "TemplateLiteralExpression") {
						this.expression(expression.body[i].expression, scope, expression);
					}
				}

				expression.compiled = this.compiler.compile(expression);

				this.register("replace", {
					start       : expression.start.index,
					end         : expression.end.index,
					replacement : expression.compiled
				});
				break;
			default:
				console.log("UNIMPLEMENTED expression", expression.type, t);
		}
	};

	// Variable declarations {{{2
	p.variable_declaration = function (declarations, scope) {
		for (var i = 0; i < declarations.length; ++i) {
			if (declarations[i].init) {
				this.expression(declarations[i].init, scope); 
			}
		}
	};

	// Statement {{{2
	p.statement = function (statement, scope) {
		switch (statement.type) {
			case "BlockStatement" :
				this.process(statement.body, scope.$new());
				break;
			case "IfStatement" :
				this.process([statement], scope);
				break;
			case "ForStatement" :
			case "SwitchStatement" :
				this.process([statement], scope);
				break;
			case "EmptyStatement" :
				break;
			default:
				console.log("UNIMPLEMENTED statement", statement.type, statement, this.file.name);
		}
	};
	// }}}2

	// Main process loop {{{2
	p.process = function (tokens, scope) {
		for (var i = 0; i < tokens.length; ++i) {

			SWITCH:
			switch (tokens[i].type) {
				// Comment {{{3
				case "Comment" :
					switch (tokens[i].comment.trim()) {
						case "ignore:start":
							if (! scope.remove_indices) {
								scope.remove_indices = {
									start : tokens[i].start.index,
									end   : tokens[i].end.index,
								};
								this.register("remove", scope.remove_indices);
							}
							break SWITCH;
						case "ignore:end":
							if (scope.remove_indices) {
								scope.remove_indices.end = tokens[i].end.index;
								scope.remove_indices = null;
							} else {
								console.warn("Unexpected ignore end.");
							}
					}
					break;

				// Statement {{{3
				case "ExpressionStatement" :
					this.expression(tokens[i].expression, scope, tokens[i]);
					break;
				case "ReturnStatement" :
					if (tokens[i].argument) {
						this.expression(tokens[i].argument, scope, tokens[i]);
					}
					break;
				case "IfStatement" :
					this.expression(tokens[i].test, scope, tokens[i]);
					this.statement(tokens[i].statement, scope);
					if (tokens[i].alternate) {
						this.statement(tokens[i].alternate, scope);
					}
					break;
				case "LabeledStatement" :
					this.statement(tokens[i].statement, scope);
					break;
				case "ForStatement" :
					if (tokens[i].init) {
						// TODO: implement var declare version
						this.expression(tokens[i].init, scope, tokens[i]);
					}
					if (tokens[i].test) {
						this.expression(tokens[i].test, scope, tokens[i]);
					}
					if (tokens[i].update) {
						this.expression(tokens[i].update, scope, tokens[i]);
					}
					this.statement(tokens[i].statement, scope);
					break;
				case "WhileStatement" :
					this.statement(tokens[i].statement, scope);
					break;
				case "SwitchStatement" :
					scope.level += 1;
					this.process(tokens[i].cases, scope);
					scope.level -= 1;
					break;
				case "TryStatement" :
					this.statement(tokens[i].block, scope);

					if (tokens[i].handler) {
						this.expression(tokens[i].handler.param, scope, tokens[i]);
						this.statement(tokens[i].handler.body, scope);
					}

					if (tokens[i].finalizer) {
						this.statement(tokens[i].finalizer, scope);
					}
					break;
				case "BreakStatement" :
				case "ContinueStatement" :
					if (tokens[i].label) {
						this.expression(tokens[i].label, scope, tokens[i]);
					}
					break;
				
				// Other {{{3
				case "VariableDeclaration" :
					this.variable_declaration(tokens[i].declarations, scope);
					break;
				case "SwitchCase" :
				case "DefaultCase" :
					this.process(tokens[i].statements, scope.$new());
					break;
				default:
					console.log("UNIMPLEMENTED token", tokens[i].type);
				// }}}3
			}
		}
	};
	// }}}2

	return JavascriptPreprocessor;
});

// Public funciton {{{1
pp.namespace("javascript.ES5_preprocessor", [
	"javascript.ES5_parser",
	"javascript.Preprocessor",
], function (parser, JavascriptPreprocessor) {
	var PublicJavascriptPreprocessor = function (defs, middlewares) {
		this.pp          = new JavascriptPreprocessor({}, defs);
		this.scope       = this.pp.scope;
		this.middlewares = middlewares || [];
	},
	p = PublicJavascriptPreprocessor.prototype;
	p.Scope                  = JavascriptPreprocessor.prototype.Scope;
	p.parser                 = parser;
	p.JavascriptPreprocessor = JavascriptPreprocessor;

	p.define = function (name, definition, is_return) {
		var code = `PP.define(${ name }, ${ definition.toString() }, ${ is_return });`;
		var file = parser("[IN MEMORY]", code);

		this.pp.compiler.current_indent = '';

		this.scope = new this.Scope(null, this.scope.defs);
		this.pp.process(file.program.body, this.scope);
	};

	p.$new = function () {
		return new PublicJavascriptPreprocessor(this.scope.defs, this.middlewares.concat());
	};

	p.middleware = function (middleware) {
		this.middlewares.push(middleware);
	};

	p.get_defs = function (defs) {
		return new this.Scope(this.scope, defs).defs;
	};

	p.process = function (filename, source_code, defs, indent, indentation) {
		var i    = 0,
			file = this.parser(filename, source_code),
			pp   = new this.JavascriptPreprocessor(file, this.get_defs(defs), indent, indentation);

		for (; i < this.middlewares.length; ++i) {
			this.middlewares[i](pp);
		}

		pp.process(file.program.body, pp.scope);
		pp.actions.sort(function (a, b) { return a.start - b.start; });

		for (i = pp.actions.length - 1; i >= 0; --i) {
			switch (pp.actions[i].type) {
				case "remove":
					pp.remove(pp.actions[i]);
					break;
				case "replace":
					pp.replace_between(pp.actions[i]);
					break;
			}
		}

		return pp.result;
	};

	var instance = new PublicJavascriptPreprocessor();

	instance.define("IS_NULL"      , function (x) { return x === null;   }, true);
	instance.define("IS_DEFINED"   , function (x) { return x !== void 0; }, true);
	instance.define("IS_UNDEFINED" , function (x) { return x === void 0; }, true);

	instance.define("IS_NUMBER"   , function (x) { return typeof x === "number";   } , true);
	instance.define("IS_STRING"   , function (x) { return typeof x === "string";   } , true);
	instance.define("IS_BOOLEAN"  , function (x) { return typeof x === "boolean";  } , true);
	instance.define("IS_FUNCTION" , function (x) { return typeof x === "function"; } , true);

	return instance;
});
// }}}1

// ignore:start

pp.run(["javascript.ES5_preprocessor"], function (pp) {
	module.exports = function (filename, code) {
		return pp.process(filename, code);
	};
});

if (require.main === module) {
	
pp.run(["javascript.ES5_preprocessor"], function (pp) {
	
	var fs = require("fs"),
		path = require("path");
	
	var source = `if (IS_NULL(x)) {}`;
	//var filename = path.join(__dirname, "../../jeefo_javascript_beautifier/src/beautifier.js");
	var filename = path.join(__dirname, "../src/javascript_parser.js");
	source = fs.readFileSync(filename, "utf8");


	try {
		var start = Date.now();
		var code = pp.process("[IN MEMORY]", source);
		var end = Date.now();

		console.log("-------------------------------");
		console.log(`Preprocessor in: ${ (end - start) }ms`);
		console.log("-------------------------------");

		console.log(code);
	} catch (e) {
		console.error("ERROR:", e);
		console.log(e.$stack);
		console.log(e.stack);
	}
});

module.exports = pp;

}

// ignore:end
