/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-04-28
* Updated at  : 2017-04-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported */
/* exported */

//ignore:end

var fse      = require("fs-extra"),
	path     = require("path"),
	uglify   = require("uglify-js"),
	_package = require("../package");

var IGNORE_REGEX = /\/\/ignore\:start(?:(?!\/\/ignore\:end)[.\s\S])+.*\n/ig;

var get_filesize  = function (path) {
	return fse.statSync(path).size;
};

var source_files = require("../source_files");

var source = source_files.map(function (file) {
	var code = fse.readFileSync(`./${ file }`, "utf8").replace(IGNORE_REGEX, '');

	if (file.startsWith("node_modules")) {
		code = `${ code.replace(/^[^\(]+/, '!function') }(jeefo);`;
	}

	return code.trim();
}).join("\n\n");

// Compile

var browser_source = `(function (jeefo, $window, $document) { "use strict";\n\n${ source }\n\n}(window.jeefo, window, document));`;
var build_source   = `function fn (jeefo) {${ source }}`;
var node_source    = `"use strict";module.exports=function (jeefo) {${ source }};`;

browser_source = uglify.minify(browser_source, _package.uglify_config).code;
build_source   = uglify.minify(build_source, _package.uglify_config).code;
node_source    = uglify.minify(node_source, _package.uglify_config).code;

// Final step
var output_filename  = path.resolve(__dirname, `../dist/${ _package.name }.js`);
var node_filename    = path.resolve(__dirname, `../dist/${ _package.name }.node.js`);
var build_filename   = path.resolve(__dirname, `../dist/${ _package.name }.build.js`);
var browser_filename = path.resolve(__dirname, `../dist/${ _package.name }.min.js`);

var MAX_LENGTH = _package.name.length > "copyright".length ? _package.name.length : "copyright".length;
var align = function (str, value) {
	var i = 0, space = '', len = MAX_LENGTH - str.length;

	for (; i < len; ++i) {
		space += ' ';
	}

	return `${ str }${ space } : ${ value }`;
};

var license = `The ${ _package.license } license`;

browser_source = `/**
 * ${ align(_package.name, 'v' + _package.version) }
 * ${ align("Author", _package.author) }
 * ${ align("Homepage", _package.homepage) }
 * ${ align("License", license) }
 * ${ align("Copyright", _package.copyright) }
 **/
${ browser_source }`;


fse.outputFileSync(output_filename, source);
fse.outputFileSync(node_filename, node_source);
fse.outputFileSync(build_filename, build_source);
fse.outputFileSync(browser_filename, browser_source);

console.log(`Raw source: ${ get_filesize(output_filename) } bytes.`);
console.log(`Node source: ${ get_filesize(build_filename) } bytes.`);
console.log(`Build source: ${ get_filesize(build_filename) } bytes.`);
console.log(`Browser source: ${ get_filesize(browser_filename) } bytes.`);

// License
var license_path = path.resolve(__dirname, "../LICENSE");
license = `${ license }

Copyright (c) ${ _package.copyright } - ${ _package.name }, ${ _package.homepage }

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`;

fse.outputFileSync(license_path, license);
