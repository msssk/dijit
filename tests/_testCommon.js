// module:
//		dijit/tests/_testCommon.js
// description:
//		A simple module to be included in dijit test pages to allow
//		for easy switching between the many many points of the test-matrix.
//
//		in your test browser, provides a way to switch between available themes,
//		and optionally enable RTL (right to left) mode, and/or dijit_a11y (high-
//		contrast/image off emulation) ... probably not a genuine test for a11y.
//
//		usage: on any dijit test_* page, press ctrl-f9 to popup links.
//
//		there are currently (3 themes * 4 tests) * (10 variations of supported browsers)
//		not including testing individual locale-strings
//
//		you should NOT be using this in a production environment. include
//		your css and set your classes manually. for test purposes only ...

require([
	"require",
	"dojo/_base/config",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"dojo/query",
	"dojo/ready",
	"dojo/_base/window"
], function(require, config, dom, domAttr, domClass, domConstruct, kernel, lang, query, ready, win){

	var dir = "",
		theme = false,
		themeModule = "dijit",
		testMode = null,
		defTheme = "claro",
		vars={};

	if(window.location.href.indexOf("?") > -1){
		var str = window.location.href.substr(window.location.href.indexOf("?")+1).split(/#/);
		var ary  = str[0].split(/&/);
		for(var i=0; i<ary.length; i++){
			var split = ary[i].split("="),
				key = split[0],
				value = (split[1]||'').replace(/[^\w]/g, "");	// replace() to prevent XSS attack
			switch(key){
				case "locale":
					// locale string | null
					kernel.locale = config.locale = locale = value;
					break;
				case "dir":
					// rtl | null
					document.getElementsByTagName("html")[0].dir = value;
					dir = value;
					break;
				case "theme":
					// tundra | soria | nihilo | claro | null
					theme = value;
					break;
				case "a11y":
					if(value){ testMode = "dijit_a11y"; }
					break;
				case "themeModule":
					// moduleName | null
					if(value){ themeModule = value; }
			}
			vars[key] = value;
		}
	}
	kernel._getVar = function(k, def){	// TODO: not sure what this is
		return vars[k] || def;
	};

	// If URL specifies a non-claro theme then pull in those theme CSS files and modify
	// <body> to point to that new theme instead of claro.
	//
	// Also defer parsing and any dojo.ready() calls that the test file makes
	// until the CSS has finished loading.
	if(theme || testMode || dir){

		if(theme){
			var themeCss = require.toUrl(themeModule+"/themes/"+theme+"/"+theme+".css");
			var themeCssRtl = require.toUrl(themeModule+"/themes/"+theme+"/"+theme+"_rtl.css");
			document.write('<link rel="stylesheet" type="text/css" href="'+themeCss+'"/>');
			document.write('<link rel="stylesheet" type="text/css" href="'+themeCssRtl+'"/>');
		}

		ready(0, function(){
			// Reset <body> to point to the specified theme
			var b = win.body();
			if(theme){
					domClass.remove(b, defTheme);
					domClass.add(b, theme);
					var n = dom.byId("themeStyles");
					if(n){ domConstruct.destroy(n); }
			}
			if(testMode){ domClass.add(b, testMode); }

			// Claro has it's own reset css but for other themes using dojo/resources/dojo.css
			if(theme){
				query("style").forEach(function(node){
					if(/claro\/document.css/.test(node.innerHTML)){
						try{
							node.innerHTML = node.innerHTML.replace("themes/claro/document.css",
								"../dojo/resources/dojo.css");
						}catch(e){
							// fails on IE6-8 for some reason, works on IE9 and other browsers
						}
					}
				});
			}
			if(dir == "rtl"){
				// pretend all the labels are in an RTL language, because
				// that affects how they lay out relative to inline form widgets
				query("label").attr("dir", "rtl");
			}
		});

		// Delay parsing and other dojo.ready() callbacks (except the one in this file)
		// until the <link>'s above have finished loading.
		// Eventually would like to use [something like]
		// https://github.com/unscriptable/curl/blob/master/src/curl/plugin/css.js
		// to load the CSS and then know exactly when it finishes loading.
		dojo.ready(1, function(){ require(["dijit/tests/delay!320"]); });
	}
});
