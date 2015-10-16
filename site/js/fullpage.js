// [MiniPy] /site/js/app.js

var cm = CodeMirror(document.querySelector('.mp-editor'), {
	mode: 'python',
	theme: 'neat',

	value: '# this program runs programs comprised of simple\n# Scheme arithmetic operations\n#\n# for example: (/ (* 3 (+ 2 2 (- 8 6))) 2) evaluates to 9\n\ndef nextTokenFromIndex(program, index):\n\t# consume a token (series of non-whitespace,\n\t# non-paren characters)\n\tstartIndex = index\n\t\n\tif index < len(program):\n\t\tnext = program[index]\n\telse:\n\t\treturn ["", len(program)]\n\t\n\twhile (next != " ") and (next != "(") and (next != ")"):\n\t\tindex = index + 1\n\t\t\n\t\tif index < len(program):\n\t\t\tnext = program[index]\n\t\telse:\n\t\t\t# token reaches end of program\n\t\t\treturn [program[startIndex:index], index]\n\t\n\tif startIndex == index:\n\t\t# character encountered was not a legal token character\n\t\t# either whitespace or a paren or the end of the program\n\t\tif index < len(program):\n\t\t\t# not the end of the program\n\t\t\tif program[index] == " ":\n\t\t\t\t# is whitespace\n\t\t\t\treturn nextTokenFromIndex(program, index + 1)\n\t\t\telse:\n\t\t\t\t# is paren\n\t\t\t\treturn [program[index], index + 1]\n\t\telse:\n\t\t\t# emit array representing the end of the program\n\t\t\treturn ["", len(program)]\n\telse:\n\t\treturn [program[startIndex:index], index]\n\ndef pop(tokens):\n\tif len(tokens) > 0:\n\t\ttoken = tokens[0]\n\t\ttokens[0:1] = []\n\t\treturn token\n\telse:\n\t\treturn ["", len(program)]\n\ndef parse(tokens):\n\ttok = pop(tokens)\n\texpressions = []\n\n\twhile (tok[0] != "") and (tok[0] != ")"):\n\t\tif tok[0] == "(":\n\t\t\t# start of sub-expression\n\t\t\texpressions = expressions + [parse(tokens)]\n\n\t\t\t# consume end paren\n\t\t\ttok = pop(tokens)\n\t\telse:\n\t\t\texpressions = expressions + [tok[0]]\n\t\t\ttok = pop(tokens)\n\n\treturn expressions\n\ndef evaluate(ast):\n\tif isType(ast, "string"):\n\t\treturn float(ast)\n\telse:\n\t\top = ast[0]\n\n\t\tif (op == "+") or (op == "-") or (op == "*") or (op == "/"):\n\t\t\t# handle basic arithmetic\n\t\t\t# loop over arguments, convert them to floats\n\t\t\t# and combine them\n\t\t\t\n\t\t\t# set operation-specific start value\n\t\t\tif (op == "+") or (op == "-"):\n\t\t\t\ttotal = 0\n\t\t\telif (op == "*") or (op == "/"):\n\t\t\t\ttotal = 1\n\n\t\t\targIndex = 1 # starts at 1 to account for operator\n\n\t\t\twhile argIndex < len(ast):\n\t\t\t\targ = evaluate(ast[argIndex])\n\n\t\t\t\t# combine\n\t\t\t\tif op == "+":\n\t\t\t\t\ttotal = total + arg\n\t\t\t\telif op == "-":\n\t\t\t\t\tif argIndex == 1:\n\t\t\t\t\t\tif len(ast) == 2:\n\t\t\t\t\t\t\treturn -arg\n\t\t\t\t\t\telse:\n\t\t\t\t\t\t\ttotal = arg\n\t\t\t\t\telse:\n\t\t\t\t\t\ttotal = total - arg\n\t\t\t\telif op == "*":\n\t\t\t\t\ttotal = total * arg\n\t\t\t\telif op == "/":\n\t\t\t\t\tif argIndex == 1:\n\t\t\t\t\t\tif len(ast) == 2:\n\t\t\t\t\t\t\treturn 1 / arg\n\t\t\t\t\t\telse:\n\t\t\t\t\t\t\ttotal = arg\n\t\t\t\t\telse:\n\t\t\t\t\t\ttotal = total / arg\n\t\t\t\t\n\t\t\t\targIndex = argIndex + 1\n\t\t\t\t\n\t\t\treturn total\n\t\telse:\n\t\t\tprint("unrecognized function: \'" + op + "\'")\n\ndef scheme(program):\n\ttokens = []\n\ttok = nextTokenFromIndex(program, 0)\n\n\twhile tok[0] != "":\n\t\ttokens = tokens + [tok]\n\t\ttok = nextTokenFromIndex(program, tok[1])\n\n\tast = parse(tokens)\n\treturn evaluate(ast[0])\n\nprint(scheme("(/ (* 3 (+ 2 2 (- 8 6))) 2)"))\nprint(scheme("(+ -5)"))',

	lineNumbers: true,
	indentUnit: 4,
	smartIndent: false,
	tabSize: 4,
	indentWithTabs: true,
	electricChars: false,
});

var defaultPythonGlobals = {
	len: {
		args: {
			0: ['array', 'string'],
		},
		fn: function(value) {
			return value.length;
		},
	},

	str: {
		args: {
			0: ['boolean', 'number', 'string'],
		},
		fn: function(value) {
			if (typeof value === 'boolean') {
				// handle special conversion of booleans to strings
				// Python expects capitalization of first character
				if (value === true) {
					return 'True';
				} else {
					return 'False';
				}
			} else {
				return value.toString();
			}
		},
	},

	float: function(arg) {
		var attempt = parseFloat(arg);

		if (isNaN(attempt)) {
			return false;
		} else {
			return attempt;
		}
	},

	isType: function(value, typeDescription) {
		return typeof value === typeDescription;
	},

	input_num: function() {
		var possibleNumber = parseFloat(prompt('Enter a number:'));

		if (isNaN(possibleNumber)) {
			return 0;
		} else {
			return possibleNumber;
		}
	},

	input_string: function() {
		return prompt('Enter a string:');
	},
};

(function(mirror) {
	var commands = {};
	var buttons = {};

	function buttonCommand(which) {
		return function() {
			if ($(buttons[which]).hasClass('mp-button-disabled') === false) {
				// button was not disabled when clicked
				commands[which].apply({});
			}
		};
	}

	function enableButtons(options) {
		if (options) {
			var enabled = options.enable || null;
			var disabled = options.disable || null;
		} else {
			var enabled = ['run', 'validate', 'step', 'reset'];
			var disabled = ['stop'];
		}

		if (enabled instanceof Array) {
			for (var i = 0, l = enabled.length; i < l; i++) {
				if (buttons[enabled[i]]) {
					buttons[enabled[i]].removeClass('mp-button-disabled');
				}
			}
		} else if (typeof enabled === 'string') {
			if (buttons[enabled]) {
				buttons[enabled].removeClass('mp-button-disabled');
			}
		}

		if (disabled instanceof Array) {
			for (var i = 0, l = disabled.length; i < l; i++) {
				if (buttons[disabled[i]]) {
					buttons[disabled[i]].addClass('mp-button-disabled');
				}
			}
		} else if (typeof disabled === 'string') {
			if (buttons[disabled]) {
				buttons[disabled].addClass('mp-button-disabled');
			}
		}
	}

	function when(command, fn) {
		commands[command] = fn;
	}

	var BannerHandler = Banner(jQuery('.mp-editor'));
	var ErrorHandler = ErrorControl(mirror, BannerHandler);
	var StateHandler = State(jQuery('.mp-scope ul'), jQuery('.mp-stdout ul'))

	// attach command button events
	buttons['run'] = $('.mp-control-button[data-command="run"]');
	buttons['validate'] = $('.mp-control-button[data-command="validate"]');
	buttons['step'] = $('.mp-control-button[data-command="step"]');
	buttons['stop'] = $('.mp-control-button[data-command="stop"]');
	buttons['reset'] = $('.mp-control-button[data-command="reset"]');

	buttons['run'].click(buttonCommand('run'));
	buttons['validate'].click(buttonCommand('validate'));
	buttons['step'].click(buttonCommand('step'));
	buttons['stop'].click(buttonCommand('stop'));
	buttons['reset'].click(buttonCommand('reset'));

	var highlightLine = (function() {
		var markedLine = null;

		return function(line) {
			if (line === null && markedLine !== null) {
				markedLine.clear();
				return;
			}

			if (typeof line === 'number') {
				if (markedLine !== null) {
					markedLine.clear();
					markedLine = null;
				}

				var linePlainText = mirror.getLine(line);
				var leadingWhitespaceWidth = linePlainText.match(/^\s+/) || 0;

				if (leadingWhitespaceWidth !== null && leadingWhitespaceWidth[0]) {
					leadingWhitespaceWidth = leadingWhitespaceWidth[0].length;
				}

				markedLine = mirror.markText({
					line: line,
					ch: leadingWhitespaceWidth,
				}, {
					line: line,
					ch: linePlainText.length,
				}, {
					className: 'mp-active-line',
					startStyle: 'mp-active-line-left',
					endStyle: 'mp-active-line-right',
				});
			}
		};
	}());

	function lockEditor() {
		$('.mp-editor').addClass('locked');
		mirror.setOption('readOnly', 'nocursor');
	}

	function unlockEditor() {
		$('.mp-editor').removeClass('locked');
		mirror.setOption('readOnly', false);
	}

	function getScript() {
		return mirror.getValue();
	}

	function isValid(script) {
		return MiniPy.validate(mirror.getValue(), {
			globals: defaultPythonGlobals,
		});
	}

	when('run', function() {
		var validity = isValid(getScript());

		if (validity === true) {
			// script SYNTAX is valid, enter run state
			enableButtons({
				enable: ['stop', 'reset'],
				disable: ['run', 'validate', 'step'],
			});

			StateHandler.reset();
			lockEditor();

			var runHooks = {
				exit: function(scope) {
					// after execution is done, display final scope state
					StateHandler.update(scope);

					BannerHandler.show({
						type: BannerHandler.GENERIC,
						message: 'Program finished',
					});
				},
			};

			var runGlobals = defaultPythonGlobals;
			runGlobals.print = function() {
				var printArguments = [];

				// build array of print arguments
				for (var i = 0, l = arguments.length; i < l; i++) {
					printArguments.push(arguments[i]);
				}

				StateHandler.printOut({
					arguments: printArguments,
					from: this.line,
					announceMutation: false,
				});
			};

			try {
				MiniPy.run(getScript(), {
					globals: defaultPythonGlobals,
					hooks: runHooks,
				});
			} catch (error) {
				// script has syntax, logic, or runtime errors
				ErrorHandler.post(error);
			}

			// leave run state
			enableButtons();
			unlockEditor();
		} else {
			// script has syntax errors
			ErrorHandler.post(validity);
		}
	});

	when('validate', function() {
		enableButtons({
			disable: ['run', 'validate', 'step', 'stop', 'reset'],
		});

		var validity = isValid(getScript());

		if (validity === true) {
			BannerHandler.show({
				type: BannerHandler.OK,
				message: 'Valid syntax',
			});
		} else {
			ErrorHandler.post(validity);
		}

		enableButtons();
	});

	function startStepping() {
		enableButtons({
			enable: ['step', 'stop', 'reset'],
			disable: ['run', 'validate'],
		});

		StateHandler.reset();
		lockEditor();

		var stepHooks = {
			scope: function(scope) {
				StateHandler.update(scope, false);
			},

			exit: function() {
				enableButtons();

				unlockEditor();
				highlightLine(null);

				BannerHandler.show({
					type: BannerHandler.GENERIC,
					message: 'Program finished',
				});

				when('step', startStepping);
			},
		};

		var interpretGlobals = defaultPythonGlobals;
		interpretGlobals.print = function() {
			var printArguments = [];

			// build array of print arguments
			for (var i = 0, l = arguments.length; i < l; i++) {
				printArguments.push(arguments[i]);
			}

			StateHandler.printOut({
				arguments: printArguments,
				from: this.line,
				announceMutation: true,
			});
		};

		var inspector = MiniPy.inspect(getScript(), {
			globals: defaultPythonGlobals,
			hooks: stepHooks,
		});

		// first step
		step(inspector);

		// future steps
		when('step', step.bind(step, inspector));
	}

	function step(inspector) {
		var expression = null;

		StateHandler.clearMutationHalo();

		try {
			expression = inspector.next();
		} catch (err) {
			// script has syntax, logic, or runtime errors
			ErrorHandler.post(err);
		}

		if (expression !== null) {
			highlightLine(expression.range.start.line);
		}
	}

	when('step', startStepping);

	when('stop', function() {
		enableButtons();

		unlockEditor();
		highlightLine(null);

		BannerHandler.show({
			type: BannerHandler.GENERIC,
			message: 'User exited program',
		});

		when('step', startStepping);

		StateHandler.clearMutationHalo();
	});

	when('reset', function() {
		enableButtons();

		StateHandler.reset();
		unlockEditor();

		if (typeof globalDefaultScript === 'undefined' || typeof globalDefaultScript !== 'string') {
			mirror.setValue('');
		} else {
			mirror.setValue(globalDefaultScript);
		}
	});

	// bind general shortcuts
	mirror.setOption('extraKeys', {
		'Esc': function() {
			mirror.getInputField().blur();
		},
	});
}(cm));
