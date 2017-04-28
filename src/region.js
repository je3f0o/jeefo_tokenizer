/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : region.js
* Created at  : 2017-04-08
* Updated at  : 2017-04-20
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

//ignore:end

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

//ignore:start
module.exports = Region;
//ignore:end
