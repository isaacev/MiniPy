// [MiniPy] /src/runtime/Interpreter.js

exports.Interpreter = (function() {
	// TODO:
	// + For loop
	// + Range function
	// + Change print statement to function (Python 3.0)
	// + Operation type checking

	var TokenType = require('../enums').enums.TokenType;
	var ErrorType = require('../enums').enums.ErrorType;
	var ValueType = require('../enums').enums.ValueType;

	var Type = require('./types').Type;
	var Scope = require('./scope').Scope;

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
		var scope = new Scope();

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
					switch (node.subtype) {
						case TokenType.BOOLEAN:
							return new Type.Boolean(node.value);
						case TokenType.NUMBER:
							return new Type.Number(node.value);
						case TokenType.STRING:
							return new Type.String(node.value);
						case ValueType.ARRAY:
							var executedElements = node.elements.map(function(element) {
								return exec(element);
							});

							return new Type.Array(executedElements);
						default:
							throw node.error({
								type: ErrorType.UNEXPECTED_TOKEN,
								message: 'Unknown value',
							});
					}

					break;
				case 'Identifier':
					return scope.get(node);
				case 'AssignmentExpression':
					var assignee = node.left;

					if (assignee.type === 'Subscript') {
						// value (array or string) on the left-hande side
						// of the assignment
						var root = exec(assignee.root);
						var indexToChange = exec(assignee.subscript).value;

						if (root instanceof Type.Array) {
							if (indexToChange >= root.value.length || -indexToChange > root.value.length) {
								throw assignee.subscript.error({
									type: ErrorType.OUT_OF_BOUNDS,
									message: 'Index ' + indexToChange + ' is out of bounds of array with length ' + root.value.length,
								});
							} else if (indexToChange < 0) {
								// negative index (index telative to end of array)
								root.value[root.value.length + indexToChange] = exec(node.right);
							} else {
								// positive index (index relative to start of array)
								root.value[indexToChange] = exec(node.right);
							}

							// apply changes to scope
							scope.set(assignee.root, root);

							event('assign', [assignee.value, root]);
						} else if (root instanceof Type.String) {
							// strings are static, subscript notation cannot be used to modify them
							throw assignee.error({
								type: ErrorType.TYPE_VIOLATION,
								message: 'String does not support item assignment',
							});
						} else {
							// any other type values, general error message
							throw assignee.error({
								type: ErrorType.TYPE_VIOLATION,
								message: 'Can only use subscript assignment on Arrays',
							});
						}
					} else if (assignee.type === 'Identifier') {
						// normal assignment to identifier
						var value = exec(node.right);
						scope.set(assignee, value);
						event('assign', [assignee.value, value]);
					} else {
						throw assignee.error({
							type: UNKNOWN_OPERATION,
							message: 'Illegal left-hande side of assignment',
						});
					}

					break;
				case 'UnaryExpression':
					var operatorSymbol = node.operator.value;
					var rightValue = exec(node.right);

					try {
						var isUnary = true;
						var computedValue = rightValue.operation(isUnary, operatorSymbol);
					} catch (details) {
						// catch errors created by the operation and based on the error type,
						// assign the errors to the offending expressions or tokens
						switch (details.type) {
							case ErrorType.TYPE_VIOLATION:
								// errors caused by the operand
								throw node.right.error(details);
							case ErrorType.UNKNOWN_OPERATION:
								// unknown operation for `rightValue`
								throw node.operator.error(details);
							default:
								if (typeof details.type === 'number' && typeof details.message === 'string') {
									// thrown object is { type: Number, message: String } and can be converted
									throw node.error(details);
								} else {
									throw details;
								}
						}
					}

					return computedValue;
				case 'BinaryExpression':
					var operatorSymbol = node.operator.value;
					var leftValue = exec(node.left);
					var rightValue = exec(node.right);

					try {
						var isUnary = false;
						var computedValue = leftValue.operation(isUnary, operatorSymbol, rightValue);
					} catch (details) {
						// catch errors created by the operation and based on the error type,
						// assign the errors to the offending expressions or tokens
						switch (details.type) {
							case ErrorType.TYPE_VIOLATION:
							case ErrorType.DIVIDE_BY_ZERO:
								// errors caused by the right-hande operand
								throw node.right.error(details);
							case ErrorType.UNKNOWN_OPERATION:
								// unknown operation for `leftValue`
								throw node.operator.error(details);
							default:
								throw node.error(details);
						}
					}

					return computedValue;
				case 'Subscript':
					var operatorSymbol = node.operator.value;
					var rootValue = exec(node.root);
					var subscriptValue = exec(node.subscript);

					try {
						var isUnary = false;
						var computedValue = rootValue.operation(isUnary, operatorSymbol, subscriptValue);
					} catch (details) {
						// catch errors created by the operation and based on the error type,
						// assign the errors to the offending expressions or tokens
						switch (details.type) {
							case ErrorType.TYPE_VIOLATION:
							case ErrorType.OUT_OF_BOUNDS:
								// errors caused by the subscript index
								throw node.subscript.error(details);
							default:
								throw node.error(details);
						}
					}

					return computedValue;
				case 'CallExpression':
					var calleeIdentifier = node.callee.value;

					if (calleeIdentifier === 'print') {
						var printArguments = [];

						for (var i = 0, l = node.arguments.length; i < l; i++) {
							var argument = exec(node.arguments[i]);

							if (['Boolean', 'Number', 'String'].indexOf(argument.type) >= 0) {
								printArguments.push(argument.get());
							} else {
								throw node.arguments[i].error({
									type: ErrorType.TYPE_VIOLATION,
									message: 'Only concrete values (ex: booleans, numbers, strings) can be printed',
								});
							}
						}

						event('print', printArguments);
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
								type: ErrorType.TYPE_VIOLATION,
								message: '"' + calleeIdentifier + '" is not a function',
							});
						}
					}

					break;
				case 'IfStatement':
					var condition = exec(node.condition);

					if (condition.value === true) {
						// IF block
						pause(function() {
							return execBlock(node.ifBlock.statements);
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

									if (elifCondition.value === true) {
										// condition matches, execute this "elif" block
										pause(function() {
											return execBlock(thisCase.block.statements);
										});
									} else {
										// condition did not match, try next block
										pause(function() {
											return nextCase(cases.slice(1));
										});
									}

									return {
										type: 'ElifStatement',
										range: thisCase.range,
									};
								} else if (thisCase.type === 'ElseStatement') {
									// execution of "else" block
									pause(function() {
										return execBlock(thisCase.block.statements);
									});

									return {
										type: 'ElseStatement',
										range: thisCase.range,
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

							if (newCondition.value === true) {
								pause(function() {
									return execBlock(node.block.statements, loop);
								});
							}

							return {
								type: 'WhileStatement',
								range: node.range,
							};
						});
					};

					if (condition.value === true) {
						pause(function() {
							return execBlock(node.block.statements, loop);
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
					range: node.range,
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
}());
