(function(root) {
	var exports = {};

	var moduleAliasNameMap = {
		error: 'MiniPyError',
		enums: 'enums',
		scanner: 'Scanner',
		token: 'Token',
		lexer: 'Lexer',
		parser: 'Parser',
		scope: 'Scope',
		interpreter: 'Interpreter',
	};

	function require(path) {
		var moduleAlias = path.match(/[a-z]+$/i);

		if (moduleAlias === null) {
			throw new Error('No module at location "' + path + '"');
		} else {
			var moduleName = moduleAliasNameMap[moduleAlias[0].toLowerCase()];

			if (moduleName === undefined) {
				throw new Error('No module with name "' + moduleAlias + '"');
			}

			var obj = {};
			obj[moduleName] = exports[moduleName];

			return obj;
		}
	}
