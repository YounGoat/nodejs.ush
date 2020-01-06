#!/usr/bin/env node

var MODULE_REQUIRE
	
/* built-in */
	, child_process = require('child_process')
	, fs = require('fs')
	, path = require('path')

	/* NPM */
	, noda = require('noda')
	, colors = require('colors')
	, if2 = require('if2')

	/* in-package */
	, META = noda.inRequire('meta')
	;

var _print = function(line) {
	console.log(line ? line : '');
};

var _footer = function(pkg) {
	_print();
	_print(colors.dim('--------'));

	if (pkg) {
		_print(colors.dim('Powered by ') + pkg.name + '@' + pkg.version);	
	}

	_print(colors.dim('Recommended by ush@' + noda.currentPackage().version));
	_print();
};

var _warn404 = function(name) {
	_print(colors.yellow('Command ' + colors.bold(name) + ' not found in USH.'));
};

var _help = function(name) {
	var info = META.commands[name];
	if (!info) {
		_warn404(name);
	}
	else {
		_print(colors.red(name) + ' ' + colors.green(if2(info.args, '')))	;
		_print('    ' + info.desc);

		var alias = [];
		for (var aname in META.alias) {
			if (META.alias[aname] == name) alias.push(colors.blue(aname));
		}
		if (alias.length) {
			_print('    ' + colors.dim('ALIAS:') + ' ' + alias.join(','));
		}
	}

	_print();
};

_print();
var pkg = null;
if (process.argv[2] == 'help' && process.argv[3]) {
	var name = process.argv[3], names = [];

	if (META.commands[name]) {
		_help(name);
		names.push(name);
	}
	else if (META.alias[name]) {
		_help(META.alias[name]);
		names.push(META.alias[name]);
	}

	var matched = [];
	var keys = [].concat(Object.keys(META.commands), Object.keys(META.alias));
	keys.forEach(function(key) {
		if (key.indexOf(name) >= 0) {
			matched.push(key);
		}
	});
	matched = matched.sort(function(a, b) {
		return a.length > b.length;
	});
	matched.forEach(function(matchedName) {
		matchedName = if2(META.alias[matchedName], matchedName);
		if (names.indexOf(matchedName) == -1) {
			_help(matchedName);
			names.push(matchedName);
		}
	});

	if (names.length == 0) {
		_warn404(name);
	}
}

else if ([undefined, 'help', '-h', '/h', '--help', '-?', '/?'].indexOf(process.argv[2]) >= 0) {
	_print(colors.italic('ush') + ' recommends useful cli tools to you.');
	_print();

	for (var name in META.commands) {
		_help(name);
	}
}

else {
	var name = process.argv[2];

	var pathname = noda.inResolve('node_modules', '.bin', name);
	var args = process.argv.slice(3);

	if (!fs.existsSync(pathname)) {
		_warn404(name);
	}
	else {
		var ret = child_process.spawnSync(pathname, args, {
			stdio: [ process.stdin, process.stdout, process.stderr ]
		});

		try {		
			var linkname = path.resolve(path.dirname(pathname), fs.readlinkSync(pathname));
			pkg = noda.packageOf(linkname, module);
		} catch (error) {
			// DO NOTHING.
		}
		
	}
}

_footer(pkg);
