"use strict";module.exports=function(e){!function(e){var n=e.module("jeefo_core",[]),t=function(e){return function(n,t,r,i){return"function"===typeof t?(i=r,r=t,t=[]):"string"===typeof t&&(t=[t]),void 0===i&&(i=!0),e.call(this,n,{fn:r,dependencies:t,resolve_once:i})}},r=function(e){var n=function(n,t){return(t?e:"")+n.toLowerCase()};return function(){return this.replace(/[A-Z]/g,n)}};String.prototype.dash_case=r("-"),String.prototype.snake_case=r("_"),n.extend("curry",["$injector"],function(e){return t(function(n,t){e.register((n+"Curry").snake_case(),t)})}),n.curry("makeInjectable",function(){return t}),n.extend("run",["$injector"],function(e){var n=Array;return function(t,r){var i,s,o=0;if("function"===typeof t)r=t,s=[];else if("string"===typeof t)s=[e.resolve_sync(t)];else for(o=0,i=t.length,s=new n(i);o<i;++o)s[o]=e.resolve_sync(t[o]);return r.apply(this,s)}}),n.extend("namespace",["$injector","make_injectable_curry"],function(e,n){return n(function(n,t){for(var r,i,s=n.split("."),o=s.pop(),c=0,a=s.length,u="";c<a;++c)r=s[c],u&&(i=e.resolve_sync(u)),u=u?u+"."+r:r,e.has(u)||(e.register(u,{dependencies:[],resolve_once:!0,fn:function(){return{}}}),i&&(i[r]=e.resolve_sync(u)));e.register(n,t),u&&(i=e.resolve_sync(u),i[o]=e.resolve_sync(n))})}),n.extend("factory",["$injector","make_injectable_curry"],function(e,n){return n(function(n,t){e.register((n+"Factory").snake_case(),t)})}),n.extend("service",["$injector","make_injectable_curry"],function(e,n){return n(function(n,t){t.is_constructor=!0,e.register((n+"Service").snake_case(),t)})})}(e);var n=function(e){for(var n in e)this[n]=e[n]},t=n.prototype;t.error=function(e){var n=new SyntaxError(e);throw n.token=this.value,n.lineNumber=this.start.line,n.columnNumber=this.start.column,n},t.error_unexpected_type=function(){this.error("Unexpected "+this.type)},t.error_unexpected_token=function(){this.error("Unexpected token")};var r=function(e,n,t,r,i,s,o){this.type=e,this.name=n,this.start=t,this.end=r,this.skip=i||null,this.contains=s||null,this.ignore=o||null,s&&(this.contains_chars=this.find_special_characters(s)),o&&(this.ignore_chars=this.find_special_characters(o))};r.prototype.find_special_characters=function(e){for(var n=0,t=e.length;n<t;++n)if("SpecialCharacter"===e[n].type)return e[n].chars.join("")};var i=function(e){this.language=e,this.container=[]};t=i.prototype,t.register=function(e){this.container.push(new r(e.type,e.name,e.start,e.end,e.skip,e.contains,e.ignore))},t.find=function(e){for(var n,t,i,s,o=this.container,c=0,a=o.length,u=e.current_index;c<a;++c){for(t=o[c].start,n=!0,i=0,s=t.length;i<s;++i)if(e.peek(u+i)!==t[i]){n=!1;break}if(n)return new r(o[c].type,o[c].name,o[c].start,o[c].end,o[c].skip,o[c].contains,o[c].ignore)}return null};var s=function(e){this.string=e,this.current_index=0};t=s.prototype,t.peek=function(e){return this.string.charAt(e)},t.seek=function(e,n){return this.string.substring(e,e+n)},t.next=function(){return this.peek(this.current_index+=1)},t.current=function(){return this.peek(this.current_index)};var o=function(e,n){this.lines=[{number:1,index:0}],this.start={line:1,column:1},this.tokens=[],this.regions=n,this.language=e};t=o.prototype,t.parse=function(e){for(var n,t=this.streamer=new s(e),r=t.current();r;)r<=" "?this.handle_new_line(r):(n=this.regions.find(t),n?this.parse_region(n):r>="0"&&r<="9"?this.parse_number():-1===this.SPECIAL_CHARACTERS.indexOf(r)?this.parse_identifier():this.parse_special_character()),r=t.next();return this.tokens},t.IS_FINITE=isFinite,t.NUMBER_VALIDATION=[",",";","}","]",")","*","/","+","-","%"," ","\t","\r","\n","<",">","?",":","^","&","|","/"].join(""),t.parse_number=function(){var e,n=this.streamer;for(this.prepare_new_token(n.current_index),e=n.next();e>="0"&&e<="9";e=n.next());this.add_token(this.make_token("Number")),this.streamer.current_index-=1},t.SPECIAL_CHARACTERS=[",",".",";",":","<",">","~","`","!","@","#","|","%","^","&","*","(",")","-","+","=","[","]","/","?",'"',"{","}","\\","'","_"].join(""),t.parse_identifier=function(){var e,n=this.streamer;for(this.prepare_new_token(n.current_index),e=n.next();e>" "&&-1===this.SPECIAL_CHARACTERS.indexOf(e);e=n.next());this.add_token(this.make_token("Identifier")),n.current_index-=1},t.parse_region=function(e){var n,t,r,i,s=e.skip,o=e.end,c=this.streamer,a=o.length;if(this.prepare_new_token(c.current_index),c.current_index+=e.start.length,e.contains)return i=this.make_token(e.type),i.children=[],this.current_token?(e.parent=this.current_region,i.parent=this.current_token,this.current_token.children.push(i)):this.tokens.push(i),this.current_token=i,this.current_region=e,void(c.current_index-=1);for(r=c.current();r;){if(this.handle_new_line(r),s&&r===s[0]){for(t=!0,n=1;n<a;++n)if(c.peek(c.current_index+n)!==s[n]){t=!1;break}if(t){c.current_index+=s.length,r=c.peek(c.current_index);continue}}if(this.check_end_token(c.current_index,o))return c.current_index+=e.end.length,this.add_token(this.make_token(e.type,this.start.index+e.start.length,c.current_index-this.start.index-e.start.length-o.length)),void(c.current_index-=1);r=c.next()}},t.parse_special_character=function(){var e=this.streamer.current_index;if(this.current_token){var n=this.current_region.ignore_chars,t=this.current_region.contains_chars,r=this.streamer.current();if(this.check_end_token(e,this.current_region.end))return this.streamer.current_index+=this.current_region.end.length,this.set_end(this.current_token),this.set_value(this.current_token),this.current_token=this.current_token.parent,this.current_region=this.current_region.parent,void(this.streamer.current_index-=1);if(n&&n.indexOf(r)>=0)return;t&&-1!==t.indexOf(r)||(this.prepare_new_token(e),this.streamer.current_index+=1,this.make_token("SpecialCharacter").error_unexpected_token())}this.prepare_new_token(e),this.streamer.current_index+=1,this.add_token(this.make_token("SpecialCharacter")),this.streamer.current_index-=1},t.check_end_token=function(e,n){var t,r=this.streamer,i=1,s=n.length;if(r.peek(e)===n[0])for(t=!0;i<s;++i)if(r.peek(e+i)!==n[i]){t=!1;break}return t},t.handle_new_line=function(e){"\r"!==e&&"\n"!==e||this.new_line()},t.new_line=function(){this.lines.push({number:this.lines.length+1,index:this.streamer.current_index+1})},t.set_value=function(e){e.value=this.streamer.seek(e.start.index,e.end.index-e.start.index)},t.set_end=function(e){e.end={line:this.lines.length,column:this.streamer.current_index-this.lines[this.lines.length-1].index+1,index:this.streamer.current_index}},t.prepare_new_token=function(e){this.start={line:this.lines.length,column:e-this.lines[this.lines.length-1].index+1,index:e}},t.add_token=function(e){var n=this.current_token;n?(this.set_end(n),this.set_value(n),n.children.push(e)):this.tokens.push(e)},t.make_token=function(e,t,r){return void 0===t&&(t=this.start.index,r=this.streamer.current_index-this.start.index),new n({type:e,value:this.streamer.seek(t,r),start:this.start,end:{line:this.lines.length,column:this.streamer.current_index-this.lines[this.lines.length-1].index+1,index:this.streamer.current_index}})};var c=e.module("jeefo_tokenizer",["jeefo_core"]);c.namespace("tokenizer.Token",function(){return n}),c.namespace("tokenizer.Region",function(){return i}),c.namespace("tokenizer.TokenParser",function(){return o})};