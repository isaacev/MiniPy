// [MiniPy] /src/runtime/Interpreter.js

var Interpreter = (function(Scope) {
	// TODO:
	// + For loop
	// + Range function
	// + Change print statement to function (Python 3.0)
	// + Operation type checking

	// for preventing certain events from being called again and again
	function once(fn, context) {
		var result;

		return function() {
			if (fn) {
				result = fn.apply(context || this, arguments);
				fn = null;
			}

			return result;
		};
	}

	function Interpreter(ast, globals) {
		// create global scope
		function scopeErrorGenerator(details) {
			return ast.error(details);
		}

		var scope = new Scope();
		scope.setErrorGenerator(scopeErrorGenerator);

		// load passed global variables into scope
		globals = globals || {};
		for (var key in globals) {
			if (globals.hasOwnProperty(key)) {
				scope.set(key, globals[key]);
			}
		}

		var validEventNames = [
			'assign',
			'print',
			'exit',
		];

		// object with arrays of hook functions maped to valid event names
		var waitingHooks = [];
		var hooks = hooks || {};

		function clearWaitingHooks(expression) {
			if (waitingHooks.length > 0) {
				waitingHooks.map(function(hook) {
					hook.call({}, expression);
				});

				waitingHooks = [];
			}
		}

		var loadOnce = once(function() {
			event('load');
		});

		var exitOnce = once(function() {
			event('exit');
		});

		// function for triggering an event with an optional payload
		function event(eventName, payload) {
			if (validEventNames.indexOf(eventName) >= 0 &&
				hooks[eventName] instanceof Array) {
				hooks[eventName].forEach(function(hook) {
					if (!(payload instanceof Array)) {
						payload = [payload];
					}

					// hook.apply({}, payload);
					waitingHooks.push(function(expression) {
						hook.apply(expression || {}, payload);
					});
				});
			}
		}

		/*
		 * Isaac Evavold 9/10/15 9:00pm
		 *
		 * The following array and functions implement a system for pausing/resuming
		 * the interpreter. This enables the user to execute the program
		 * line-by-line manually for debugging/educational purposes.
		 *
		 * NOTES:
		 * Each time the interpreter is resumed it executes 1 non-empty line before
		 * pausing again. In the case of lines which don't affect flow-control
		 * (assignment, function calls, arithmetic, etc.) this usually consumes
		 * the entire statement. In the case of more complex statements (If, While,
		 * For, etc.) the interpreter executes the statement declaration line once
		 * and next begins executing the consequent block of statements as
		 * appropriate.
		 *
		 * IMPLEMENTATION:
		 * - resumeStack: [Function]
		 *      An array of functions waiting to be executed. The last function in
		 *      the stack will be executed next. If that function calls `pause`
		 *      during its execution then the a new continuation function will be
		 *      pushed onto the stack to be executed next. Once the function returns
		 *      the next function lower is popped and executed.
		 *
		 *      Put another way, when interpreting Python code the depth of the
		 *      `resumeStack` is approximate to the level of indentation + 1 at any
		 *      particular point with a different function representing the
		 *      continuation at each indentation.
		 *
		 * - pause: (Function) -> void
		 *      Functions passed to `pause` are pushed onto the `resumeStack` and
		 *      represent continuations of the program execution at a certain point.
		 *      Generally `pause` is called when a statement is performing
		 *      flow-control (If, While, For, etc.) and is executing a sub-block
		 *      of statements. It prevents `execBlock` from executing the next node
		 *      before the current flow-controlling node has finished executing.
		 *
		 * - resume: () -> Function
		 *      Returns the top function in the `resumeStack` for execution. This
		 *      function should only be called by the Intepreter librarie's `next`
		 *      or `execute` methods which are responsible for triggering the
		 *      continuation of program interpreteration.
		 *
		 *      Generally:
		 *      The Interpreter only calls `pause` and the user only calls `resume`.
		 *
		 * - exec: (AST Node object) -> value or void
		 *      Either executes a single line and returns the computed value of the
		 *      line (in the case of Literals, Arithmetic, Identifiers, etc.) or
		 *      void of the line is a statement (Print, Assignment, etc.) or void of
		 *      the line performs flow-control (If, While, For, etc.). The execution
		 *      of any line may involve calling `exec` on smaller parts of the line
		 *      though typically these smaller parts always directly return a value.
		 *
		 *      Flow-control statements call `pause` on their consequent statements
		 *      inside `exec`.
		 *
		 * - execBlock: ([AST Node object], Function?) -> Line details
		 *      The principle of `execBlock` is stolen from my limited understanding
		 *      of Haskell's method of pattern matching to lazily traverse lists.
		 *      `execBlock` is passed an array of AST Node objects and executes the
		 *      first node while passing the rest of the array to itself via the
		 *      `pause` function. When execution resumes `execBlock` will receive
		 *      the new list sans the previously executed node and continue
		 *      execution on the array of nodes.
		 *
		 */
		var resumeStack = [];

		function pause(fn) {
			resumeStack.push(fn);
		}

		function resume() {
			return resumeStack.pop();
		}

		function exec(node) {
			switch (node.type) {
				case 'Literal':
					return node.value;
				case 'Identifier':
					return scope.get(node);
				case 'AssignmentExpression':
					var left = node.left;
					var newValue = exec(node.right);
					scope.set(left, newValue);
					event('assign', [left.value, newValue]);
					break;
				case 'UnaryExpression':
					var right = exec(node.right);
					var rightType = typeof right;

					function unaryOperationIncorrectTypes(message) {
						return node.operator.error({
							type: ErrorType.UNSUPPORTED_OPERATION,
							message: message,
						});
					}

					function expectOnce(operation, expected, actual) {
						if (expected !== actual) {
							var message = 'Unsupported operation "' + operation + '" ' +
								'on type "' + actual + '"';
							throw unaryOperationIncorrectTypes(message);
						}
					}

					switch (node.operator.getValue()) {
						case '+':
							expectOnce('+', 'number', rightType);
							return right;
						case '-':
							expectOnce('-', 'number', rightType);
							return -1 * right;
						case '!':
						case 'not':
							expectOnce(node.operator.getValue(), 'boolean', rightType);
							return (right === false);
						default:
							throw node.operator.error({
								type: 'SyntaxError',
								message: 'Unknown operator: "' + node.operator.getValue() + '"',
								from: {
									line: node.line,
									column: node.column,
								},
								to: {
									line: node.line,
									column: node.column + 1,
								},
							});
					}

					break;
				case 'BinaryExpression':
					// TODO: check for type mismatch and return knowledgeable error message
					var left = exec(node.left);
					var right = exec(node.right);

					var leftType = typeof left;
					var rightType = typeof right;

					function binaryOperationIncorrectTypes(message) {
						return node.operator.error({
							type: ErrorType.UNSUPPORTED_OPERATION,
							message: message,
						});
					}

					// `el`: expected left type
					// `er`: expected right type
					// `al`: actual left type
					// `ar`: actual right type
					function expectTwice(operation, el, er, al, ar) {
						if (al !== el || er !== ar) {
							var message = 'Unsupported operation "' + operation + '" ' +
								'for type(s) "' + al + '" and "' + ar + '"';
							throw binaryOperationIncorrectTypes(message);
						}
					}

					switch (node.operator.getValue()) {
						case '+':
							return left + right;
						case '-':
							expectTwice('-', 'number', 'number', leftType, rightType);
							return left - right;
						case '*':
							expectTwice('*', 'number', 'number', leftType, rightType);
							return left * right;
						case '/':
							expectTwice('/', 'number', 'number', leftType, rightType);
							return left / right;
						case '%':
							expectTwice('%', 'number', 'number', leftType, rightType);
							return left % right;
						case '**':
							expectTwice('**', 'number', 'number', leftType, rightType);
							return Math.pow(left, right);
						case '//':
							// not technically correct, I believe Python technically
							// does integer division (and thus truncation not rounding)
							expectTwice('//', 'number', 'number', leftType, rightType);
							return Math.floor(left / right);
						case '>':
							return left > right;
						case '>=':
							return left >= right;
						case '<':
							return left < right;
						case '<=':
							return left <= right;
						case '==':
							return left === right;
						case 'and':
							expectTwice('and', 'boolean', 'boolean', leftType, rightType);
							return (left === true) && (right === true);
						case '!=':
							return left !== right;
						case 'or':
							return left || right;
						default:
							throw node.operator.error({
								type: 'SyntaxError',
								message: 'Unknown operator: "' + node.operator.getValue() + '"',
							});
					}
				case 'CallExpression':
					var calleeIdentifier = node.callee.value;

					if (calleeIdentifier === 'print') {
						event('print', exec(node.arguments[0]));
					} else {
						// get identifier's value from scope
						var fn = scope.get(node.callee);

						if (typeof fn === 'function') {
							// call global function
							var executedArguments = node.arguments.map(exec);
							return fn.apply({}, executedArguments);
						} else {
							// callee is not a function
							node.callee.error({
								type: ErrorType.UNSUPPORTED_OPERATION,
								message: '"' + calleeIdentifier + '" is not a function',
							});
						}
					}

					break;
				case 'IfStatement':
					var condition = exec(node.condition);

					if (condition === true) {
						// IF block
						pause(function() {
							return execBlock(node.ifBlock);
						});
					} else {
						// check ELIF or ELSE clauses
						var cases = [];

						if (node.elifBlocks !== null) {
							cases = node.elifBlocks;
						}

						if (node.elseBlock !== null) {
							cases.push(node.elseBlock);
						}

						var nextCase = function(cases) {
							if (cases.length > 0) {
								var thisCase = cases[0];

								if (thisCase.type === 'ElifStatement') {
									var elifCondition = exec(thisCase.condition);

									if (elifCondition === true) {
										// condition matches, execute this "elif" block
										pause(function() {
											return execBlock(thisCase.block);
										});
									} else {
										// condition did not match, try next block
										pause(function () {
											return nextCase(cases.slice(1));
										});
									}

									return {
										type: 'ElifStatement',
										line: thisCase.line,
									};
								} else if (thisCase.type === 'ElseStatement') {
									// execution of "else" block
									pause(function () {
										return execBlock(thisCase.block);
									});

									return {
										type: 'ElseStatement',
										line: thisCase.line,
									};
								}
							}
						};

						if (cases.length > 0) {
							pause(function() {
								return nextCase(cases);
							});
						}
					}

					break;
				case 'WhileStatement':
					var condition = exec(node.condition);
					var loop = function() {
						pause(function() {
							var newCondition = exec(node.condition);

							if (newCondition === true) {
								pause(function() {
									return execBlock(node.block, loop);
								});
							}

							return {
								type: 'WhileStatement',
								line: node.line,
							};
						});
					};

					if (condition === true) {
						pause(function() {
							return execBlock(node.block, loop);
						});
					}

					break;
			}
		}

		function execBlock(nodes, done) {
			if (nodes.length > 0) {
				var node = nodes[0];
				var detail = {
					type: node.type,
					line: getLine(node),
				};

				if (nodes.length > 1) {
					pause(function() {
						return execBlock(nodes.slice(1), done);
					});
				}

				exec(node);

				if (nodes.length === 1 && typeof done === 'function') {
					done();
				}

				return detail;
			}
		}

		function getLine(node) {
			switch (node.type) {
				case 'AssignmentExpression':
					return node.left.line;
				case 'PrintStatement':
					return node.arguments.line;
				case 'IfStatement':
					return node.test.line;
				case 'WhileStatement':
					return node.line;
				default:
					return node.line;
			}
		}

		function registerHook(eventName, hook) {
			// attach event hooks to hook table
			if (validEventNames.indexOf(eventName) >= 0 && typeof hook === 'function') {
				if (hooks[eventName] instanceof Array) {
					hooks[eventName].push(hook);
				} else {
					hooks[eventName] = [hook];
				}
			}
		}

		return {
			load: function(hooks) {
				hooks = hooks || {};

				// register any hooks that are passed
				for (var eventName in hooks) {
					if (hooks.hasOwnProperty(eventName)) {
						registerHook(eventName, hooks[eventName]);
					}
				}

				loadOnce();
				pause(function() {
					return execBlock(ast.body);
				});
			},

			next: function() {
				var fn = resume();

				if (typeof fn === 'function') {
					var expression = fn.apply({}, []);

					clearWaitingHooks(expression);

					return expression;
				} else {
					exitOnce();
					clearWaitingHooks(null);
					return null;
				}
			},

			on: registerHook,
		};
	}

	return Interpreter;
}(Scope));
