// [MiniPy] /src/minipy.js

var MiniPy = (function(main) {
	var mods = {
		MiniPyError: MiniPyError || null,
		Scanner: Scanner || null,
		Lexer: Lexer || null,
		Parser: Parser || null,
		Interpreter: Interpreter || null,
	};

	var MiniPy = main(mods);

	if (typeof exports !== 'undefined' && typeof module !== 'undefined' && module.exports) {
		// environment is Node-like
		module.exports = MiniPy;
	}

	return MiniPy;
}(function(mods) {
	var defaultHooks = {
		print: function(arg) {
			console.log('PRINT: ' + arg);
		},
	};

	var defaultMaxLinesExecuted = 2000;

	function validate(code, done) {
		try {
			var scanner = new mods.Scanner(code);
			var lexer = new mods.Lexer(scanner);
			var parser = new mods.Parser(lexer);
			var ast = parser.parse();

			done(null, true);
		} catch (err) {
			done(err, false);
		}
	}

	function createInspector(code, opts) {
		opts = opts || {};

		var scanner = new mods.Scanner(code);
		var lexer = new mods.Lexer(scanner);
		var parser = new mods.Parser(lexer);
		var ast = parser.parse();

		var globalVariables = {};
		var inspector = mods.Interpreter(ast, globalVariables);

		inspector.load(opts.hooks || defaultHooks);

		return inspector;
	}

	return {
		validate: validate,

		inspect: createInspector,

		run: function(code, opts) {
			opts = opts || {};

			var inspector = createInspector(code, opts);
			var maxLinesExecuted = opts.maxLinesExecuted || defaultMaxLinesExecuted;
			var linesExecuted = 0;

			while (true) {
				var expression = inspector.next();
				linesExecuted++;

				if (expression === null) {
					break;
				} else if (linesExecuted >= maxLinesExecuted) {
					throw new mods.MiniPyError({
						type: 'RuntimeError',
						message: 'Script execution timed out, possibly because of an infinite loop',
					});
				}
			}
		},

		debug: {
			getAST: function(code) {
				var scanner = new mods.Scanner(code);
				var lexer = new mods.Lexer(scanner);
				var parser = new mods.Parser(lexer);
				var ast = parser.parse();
				
				return ast;
			},

			getScanner: function(code) {
				return new mods.Scanner(code);
			},

			getLexer: function(code) {
				var scanner = new mods.Scanner(code);
				return new mods.Lexer(scanner);
			},

			MiniPyError: mods.MiniPyError,
		},
	};
}));
