/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : regions.js
* Created at  : 2017-04-08
* Updated at  : 2017-05-23
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

var Regions = function (other) {
	if (other) {
		this.hash = other.hash.$copy();

		var null_regions           = this.global_null_regions    = new this.Array(other.global_null_regions.length),
			contained_null_regions = this.contained_null_regions = new this.Array(other.contained_null_regions.length),
			i = null_regions.length - 1;

		for (; i >= 0; --i) {
			null_regions[i] = other.global_null_regions[i];
		}

		for (i = contained_null_regions.length - 1; i >= 0; --i) {
			contained_null_regions[i] = other.contained_null_regions[i];
		}
	} else {
		this.hash                   = new JeefoObject();
		this.global_null_regions    = [];
		this.contained_null_regions = [];
	}
};

Regions.prototype = {
	Array            : Array,
	Regions          : Regions,
	RegionDefinition : RegionDefinition,

	copy : function () {
		return new this.Regions(this);
	},

	sort_function : function (a, b) { return a.start.length - b.start.length; },

	// Register {{{1
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
				throw new Error("Overwritten global null region.");
			}
			this.global_null_region = region;
		}

		return this;
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

//ignore:start
module.exports = Region;
//ignore:end
