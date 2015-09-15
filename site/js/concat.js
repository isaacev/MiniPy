// [MiniPy] /site/js/shortcuts.js

var Shortcuts = (function(trap) {
	function bind(command, fn) {
		trap.bind(command, function(event) {
			fn.apply({}, [event]);
			return false;
		});
	}

	return {
		bind: bind,
	};
}(Mousetrap));
// [MiniPy] /site/js/app.js

var cm = CodeMirror(document.querySelector('#editor'), {
	mode: 'python',
	theme: 'neat',

	value: '# simple Fibonacci\n\nn1 = 1\nn2 = 1\n\nwhile n1 < 1000:\n\tprint(n1)\n\ttmp = n1\n\tn1 = n2\n\tn2 = n2 + tmp\n',

	lineNumbers: true,
	indentUnit: 4,
	smartIndent: false,
	tabSize: 4,
	indentWithTabs: true,
	electricChars: false,
});

var defaultPythonGlobals = {
	prompt_number: function() {
		var possibleNumber = parseFloat(prompt('Enter a number:'));

		if (isNaN(possibleNumber)) {
			return 0;
		} else {
			return possibleNumber;
		}
	},

	prompt_string: function() {
		return prompt('Enter a string:');
	},
};

(function(mirror) {
	var commands = {};
	var buttons = {};

	function buttonCommand(which) {
		return function() {
			if ($(buttons[which]).hasClass('disabled') === false) {
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
			var enabled = ['run', 'validate', 'step'];
			var disabled = ['stop'];
		}

		if (enabled instanceof Array) {
			for (var i = 0, l = enabled.length; i < l; i++) {
				if (buttons[enabled[i]]) {
					buttons[enabled[i]].removeClass('disabled');
				}
			}
		} else if (typeof enabled === 'string') {
			if (buttons[enabled]) {
				buttons[enabled].removeClass('disabled');
			}
		}

		if (disabled instanceof Array) {
			for (var i = 0, l = disabled.length; i < l; i++) {
				if (buttons[disabled[i]]) {
					buttons[disabled[i]].addClass('disabled');
				}
			}
		} else if (typeof disabled === 'string') {
			if (buttons[disabled]) {
				buttons[disabled].addClass('disabled');
			}
		}
	}

	function when(command, fn) {
		commands[command] = fn;
	}

	// attach command button events
	buttons['run'] = $('.control-button[data-command="run"]');
	buttons['validate'] = $('.control-button[data-command="validate"]');
	buttons['step'] = $('.control-button[data-command="step"]');
	buttons['stop'] = $('.control-button[data-command="stop"]');

	buttons['run'].click(buttonCommand('run'));
	buttons['validate'].click(buttonCommand('validate'));
	buttons['step'].click(buttonCommand('step'));
	buttons['stop'].click(buttonCommand('stop'));

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
					className: 'active-line',
					startStyle: 'active-line-left',
					endStyle: 'active-line-right',
				});
			}
		};
	}());

	function lockEditor() {
		$('#editor').addClass('locked');
		mirror.setOption('readOnly', 'nocursor');
	}

	function unlockEditor() {
		$('#editor').removeClass('locked');
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
				enable: 'stop',
				disable: ['run', 'validate', 'step'],
			});

			State.reset();
			lockEditor();

			var runHooks = {
				print: function() {
					var printExpression = this;
					var printArguments = [];

					for (var i = 0, l = arguments.length; i < l; i++) {
						printArguments.push(arguments[i]);
					}

					State.printOut({
						arguments: printArguments,
						from: printExpression.line,
						announceMutation: false,
					});
				},

				assign: function(identifier, value) {
					if (State.hasVariable(identifier) === true) {
						State.updateVariable({
							identifier: identifier,
							value: value,
							announceMutation: false,
						});
					} else {
						State.createVariable({
							identifier: identifier,
							value: value,
							announceMutation: false,
						});
					}
				},

				exit: function() {
					Banner.show({
						type: Banner.GENERIC,
						message: 'Program finished',
					});
				},
			};

			try {
				MiniPy.run(getScript(), {
					globals: defaultPythonGlobals,
					hooks: runHooks,
				});
			} catch (error) {
				// script has syntax, logic, or runtime errors
				ErrorControl.post(error);
			}

			// leave run state
			enableButtons();
			unlockEditor();
		} else {
			// script has syntax errors
			ErrorControl.post(validity);
		}
	});

	when('validate', function() {
		enableButtons({
			disable: ['run', 'validate', 'step', 'stop'],
		});

		var validity = isValid(getScript());

		if (validity === true) {
			Banner.show({
				type: Banner.OK,
				message: 'Valid syntax',
			});
		} else {
			ErrorControl.post(validity);
		}

		enableButtons({
			enable: ['run', 'validate', 'step'],
		});
	});

	function startStepping() {
		enableButtons({
			enable: ['step', 'stop'],
			disable: ['run', 'validate'],
		});

		State.reset();
		lockEditor();

		var stepHooks = {
			print: function() {
				var printExpression = this;
				var printArguments = [];

				for (var i = 0, l = arguments.length; i < l; i++) {
					printArguments.push(arguments[i]);
				}

				State.printOut({
					arguments: printArguments,
					from: printExpression.line,
				});
			},

			assign: function(identifier, value) {
				if (State.hasVariable(identifier) === true) {
					State.updateVariable({
						identifier: identifier,
						value: value,
					});
				} else {
					State.createVariable({
						identifier: identifier,
						value: value,
					});
				}
			},

			exit: function() {
				enableButtons({
					enable: ['run', 'validate', 'step'],
					disable: 'stop',
				});

				unlockEditor();
				highlightLine(null);

				Banner.show({
					type: Banner.GENERIC,
					message: 'Program finished',
				});

				when('step', startStepping);
				alert('Program finished');
			},
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

		State.clearMutationHalo();

		try {
			expression = inspector.next();
		} catch (err) {
			// script has syntax, logic, or runtime errors
			ErrorControl.post(error);
		}

		if (expression !== null) {
			highlightLine(expression.line);
		}
	}

	when('step', startStepping);

	when('stop', function() {
		enableButtons({
			enable: ['run', 'validate', 'step'],
			disable: 'stop',
		});

		unlockEditor();
		highlightLine(null);

		Banner.show({
			type: Banner.GENERIC,
			message: 'User exited program',
		});

		when('step', startStepping);

		State.clearMutationHalo();
	});

	// bind shortcuts for button commands
	Shortcuts.bind('shift+r', buttonCommand('run'));
	Shortcuts.bind('shift+v', buttonCommand('validate'));
	Shortcuts.bind('shift+s', buttonCommand('step'));
	Shortcuts.bind('shift+e', buttonCommand('stop'));

	// bind general shortcuts
	mirror.setOption('extraKeys', {
		'Esc': function() {
			mirror.getInputField().blur();
		},
	});
}(cm));
// [MiniPy] /site/js/banner.js

var Banner = (function(editor) {
	var types = {
		GENERIC: 0,
		OK: 1,
		WARNING: 2,
		ERROR: 3,
	};

	var names = [
		'generic',
		'ok',
		'warning',
		'error',
	];

	var defaultDurations = {
		fadeIn: 200,
		delay: 3000,
		fadeOut: 500,
	};

	var template = '<div id="banner" class="type-{type}" style="display:none">{message}</div>';

	var currentBanner = null;

	function show(banner) {
		$('#banner').remove();

		var html = template
			.replace('{type}', names[banner.type || 0])
			.replace('{message}', banner.message || '');

		currentBanner = $(html).appendTo(editor);

		if (banner.type === types.ERROR) {
			currentBanner
				.fadeIn(defaultDurations.fadeIn)
				.delay(defaultDurations.delay * 2)
				.fadeOut(defaultDurations.fadeOut, close);
		} else {
			currentBanner
				.fadeIn(defaultDurations.fadeIn)
				.delay(defaultDurations.delay)
				.fadeOut(defaultDurations.fadeOut, close);
		}
	}

	function close() {
		if (currentBanner !== null) {
			currentBanner.remove();
		}
	}

	return {
		show: show,
		close: close,

		// banner types
		GENERIC: types.GENERIC,
		OK: types.OK,
		WARNING: types.WARNING,
		ERROR: types.ERROR,
	};
}($('#editor')));
// [MiniPy] /site/js/state.js

var State = (function(scopeElementList, stdoutElementList) {
	var knownVariables = {};

	var variableTemplate = '<li data-identifier={identifier}><span class="identifier">{identifier}</span><span class="value {type}">{value}</span></li>';
	var printTemplate = '<li><span class="value {type}">{output}</span><span class="origin">{line}</span></li>';

	function hasVariable(identifier) {
		return (knownVariables[identifier] === true);
	}

	function updateVariable(variable) {
		var variableElem = scopeElementList.children('[data-identifier="' + variable.identifier.toString() + '"]');

		if (variable.announceMutation !== false) {
			// give modified variable element a mutation halo
			scopeElementList.children('.mutating').removeClass('mutating');
			variableElem.addClass('mutating');
		}

		var newType = typeof variable.value;
		var newValue = variable.value.toString();

		// update DOM with new values
		variableElem
			.removeClass('number string boolean')
			.addClass(newType)
			.children('.value').text(newValue);
	}

	function createVariable(variable) {
		// add identifier to list of known variables
		knownVariables[variable.identifier.toString()] = true;

		var html = variableTemplate
			.replace('{identifier}', variable.identifier)
			.replace('{identifier}', variable.identifier)
			.replace('{type}', typeof variable.value)
			.replace('{value}', variable.value.toString());

		// add to DOM
		var variableElem = $(html).appendTo(scopeElementList);

		if (variable.announceMutation !== false) {
			// give new variable element a mutation halo
			scopeElementList.children('.mutating').removeClass('mutating');
			variableElem.addClass('mutating');
		}
	}

	function clearMutationHalo() {
		scopeElementList.children('.mutating').removeClass('mutating');
		stdoutElementList.children('.mutating').removeClass('mutating');
	}

	function printOut(results) {
		// TODO: only prints one print argument currently
		var value = results.arguments[0];

		var html = printTemplate
			.replace('{type}', typeof value)
			.replace('{output}', value.toString())
			// switch from 0-based line count (MiniPy) to 1-based (visual editor)
			.replace('{line}', results.from + 1);

		var println = $(html).prependTo(stdoutElementList);

		if (results.announceMutation !== false) {
			// give printed line element a mutation halo
			stdoutElementList.children('.mutating').removeClass('mutating');
			println.addClass('mutating');
		}
	}

	function reset() {
		knownVariables = {};
		scopeElementList.empty();
		stdoutElementList.empty();
	}

	return {
		hasVariable: hasVariable,
		updateVariable: updateVariable,
		createVariable: createVariable,
		clearMutationHalo: clearMutationHalo,
		printOut: printOut,
		reset: reset,
	};
}($('#scope ul'), $('#stdout ul')));
// [MiniPy] /site/js/error.js

var ErrorControl = (function(mirror) {
	var markOptions = {
		className: 'error-token',
		clearOnEnter: true,
	};

	function isSensicalNumber(n) {
		return (typeof n === 'number' && n >= 0);
	}

	function post (error) {
		if (error instanceof MiniPy.debug.MiniPyError) {
			// handle MiniPy error

			// display error banner
			Banner.show({
				type: Banner.ERROR,
				message: error.message,
			});

			// highlight offending token (if possible)
			var fromPos = error.from || {};
			var toPos = error.to || {};

			var markedText = null;

			if (isSensicalNumber(fromPos.line) &&
				isSensicalNumber(fromPos.column) &&
				isSensicalNumber(toPos.line) &&
				isSensicalNumber(toPos.column)) {
				// mark region of line
				markedText = mirror.markText({
					line: fromPos.line,
					ch: fromPos.column,
				}, {
					line: toPos.line,
					ch: toPos.column,
				}, markOptions);
			} else if (isSensicalNumber(fromPos.line)) {
				// mark entire line
				markedText = mirror.markText({
					line: fromPos.line,
					ch: 0,
				}, {
					line: fromPos.line,
					ch: cm.getLine(fromPos.line).length - 1,
				}, markOptions);
			}

			mirror.on('focus', function clearMarkedText() {
				if (markedText !== null) {
					markedText.clear();
				}

				mirror.off('focus', clearMarkedText);
			});
		} else {
			// error not created by script
			Banner.show({
				type: Banner.ERROR,
				message: error.message,
			});
		}
	}

	return {
		post: post,
	};
}(cm));
// [MiniPy] /site/js/storage.js

(function(mirror) {
	var localDbId = 'source';

	function debounce(func, wait, immediate) {
		var timeout;

		return function() {
			var context = this;
			var args = arguments;

			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};

			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);

			if (callNow) {
				func.apply(context, args);
			}
		};
	}

	function getScript() {
		return mirror.getValue();
	}

	var localSaveLimited = debounce(function() {
		localforage.setItem(localDbId, getScript(), function(err) {
			if (err) {
				console.error(err);
			} else {
				console.log('script saved locally');
			}
		});
	}, 500);

	localforage.getItem(localDbId, function(err, value) {
		if (value === null) {
			var defaultSource = '';
			localforage.setItem(localDbId, defaultSource, function(err) {
				if (err) {
					console.error(err);
				} else {
					mirror.setValue(defaultSource);
				}
			});
		} else {
			mirror.setValue(value);
		}
	});

	mirror.on('change', localSaveLimited);
}(cm));
