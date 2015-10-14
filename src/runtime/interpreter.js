// [MiniPy] /src/runtime/Interpreter.js

exports.Interpreter = (function() {
	// require type enumerations
	var enums = require('../enums').enums;

	var ErrorType = enums.ErrorType;
	var TokenType = enums.TokenType;
	var ValueType = enums.ValueType;

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
		var scope = new Scope(null);

		// load passed global variables into scope
		Object.keys(globals || {}).forEach(function(globalIdentifier) {
			scope.set(globalIdentifier, new Type.Function(false, [], function(calleeNode, argNodes, complexArgs, simpleArgs) {
				var builtin = globals[globalIdentifier];

				if (typeof builtin === 'function') {
					// no argument validation given, just pass the arguments in
					return builtin.apply({
						line: calleeNode.range.start.line,
					}, simpleArgs);
				} else {
					// method configuration specified

					// validate passed arguments in accordinance with the
					// built-in method's specification
					if (typeof builtin.args === 'object') {
						argLoop: for (var i = 0, l = argNodes.length; i < l; i++) {
							if (builtin.args[i] instanceof Array) {
								// multiple possible types stored in an array, check each successive type
								// against argument at index `i`. if the argument matches, break the loop
								// and go on to check the next argument. if the argument's type fails all
								// checks, throw an error and point to the offending argument node
								typeLoop: for (var j = 0; j < builtin.args[i].length; j++) {
									if (complexArgs[i].type.toLowerCase() === builtin.args[i][j].toLowerCase()) {
										// type successfully matched
										continue argLoop;
									}
								}

								// argument at index `i` wasn't valid so throw an error
									var typeList = builtin.args[i].map(function(type) {
									return type[0].toUpperCase() + type.substring(1);
								}).join(' or ');

								throw argNodes[i].error({
									type: ErrorType.TYPE_VIOLATION,
									message: 'Function "' + globalIdentifier + '" was expecting an argument with type ' + typeList,
								})
							} else if (typeof builtin.args[i] === 'string' && builtin.args[i] !== 'any') {
								// single possible type
							}
						}
					}

					return builtin.fn.apply({}, simpleArgs);
				}
			}));
		});

		var validEventNames = [
			'scope',
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

		var loadOnce = once(function() {
			event('load');
		});

		var exitOnce = once(function(scopeJSON) {
			event('exit', scopeJSON);
		});

		// function for triggering an event with an optional payload
		function event(eventName, payload) {
			if (validEventNames.indexOf(eventName) >= 0 &&
				hooks[eventName] instanceof Array) {

				hooks[eventName].forEach(function(hook) {
					if (!(payload instanceof Array)) {
						payload = [payload];
					}

					waitingHooks.push(function(expression) {
						hook.apply(expression || {}, payload);
					});
				});
			}
		}

		function simplifyValue(value) {
			switch (value.type) {
				case 'Boolean':
				case 'Number':
				case 'String':
					return value.value;
				case 'Array':
					var simplification = [];

					for (var i = 0, l = value.value.length; i < l; i++) {
						simplification[i] = simplifyValue(value.value[i]);
					}

					return simplification;
				case 'Function':
					throw {
						type: ErrorType.TYPE_VIOLATION,
						message: 'Functions cannot be passed or manipulated',
					};
				default:
					return undefined;
			}
		}

		/*
		 * Author:      Isaac Evavold
		 * Created:     9/10/15 9:00pm
		 * Edited:      10/2/15 1:30am
		 *
		 * The following array and functions implement a system for pausing/resuming
		 * the interpreter. This enables the user to execute the program
		 * line-by-line manually for debugging/educational purposes.
		 *
		 * NOTES:
		 * These notes detail version 2.0 of the interpretation system. As a general
		 * overview, at any time the `loadedBlocks` array behaves as a stack holding arrays
		 * of statements corresponding to different levels of indentation in the program. As
		 * interpretation moves through the program, blocks of statements are pushed or popped
		 * as required. At each turn of execution (represetned by the `nextEspression` function),
		 * one statement is popped from the topmost block of the stack and run by the `exec` function.
		 * Said statement may do math or logic, may execute interal statements, may control the
		 * program flow or many other things detailed in `exec`.
		 *
		 * IMPLEMENTATION:
		 * - ExecutionBlock: (array of statements, )
		 *      Constructs an object representing a series of statements of the same scope
		 *      and indentation level. `ExecutionBlock`s make it easier to attach events
		 *      for when the execution of a block is concluded, when a block of statements
		 *      is returned and what line in the program is being returned to.
		 *
		 * - loadBlock: (ExecutionBlock object)
		 *      Given an `ExecutionBlock`, append that object to the top of the
		 *      `loadedBlocks` stack to wait for execution.
		 *
		 * - nextExpression: ()
		 *      Pop the top block off the `loadedBlocks` stack and execute its next statement.
		 *      Once execution is complete `nextExpression` will output detail about which
		 *      corresponding line of the source code was run so that listening programs can
		 *      inform the user.
		 *
		 * - exec: (AST Node object, callback)
		 *      Processes a single AST node and passes the evaluated result back through
		 *      the callback argument. Some nodes could be executed syncronously (Literals,
		 *      built-in functions like `print` and `len`, etc.) but the possibilty of
		 *      asyncronous element execution (Function calls, Loops, If statements, etc.)
		 *      makes it necessary to maintain a similar interface for both cases. The
		 *      function returns nothing.
		 *
		 * - comprehendSeries: (accumulated elements, remaining elements, callback)
		 *      Called when a series of elements (function call arguments, element of
		 *      an array, etc. need to be evaluated in series and any of them may be
		 *      asyncronous. The first argument, "accumulated elements" should usually
		 *      be passed as an empty array. It's purpose is largely for internal
		 *      recusion since `comprehendSeries` keeps calling itself as it digests
		 *      its array of nodes.
		 *
		 * ONGOING MESSINESS:
		 * Currently, the If/Elif/Else and Function statement implementations inject
		 * statement stubs into the execution stack as a workaround for getting program
		 * execution flow to pause at the right times. Some of these injected objects
		 * have to be tagged `execute = false` to prevent execution of the statement
		 * as if it was real. It seems to work but I would like a more natural solution
		 * to this problem of specifying granular flow-control.
		 */

		function ExecutionBlock(statements, events, returnTo) {
			events = events || {};

			this.statements = statements;
			this.before = events.before || null;
			this.done = events.done || null;
			this.return = events.return || null;
			this.returnTo = returnTo || null;
		}

		ExecutionBlock.prototype.slice = function() {
			return new ExecutionBlock(this.statements.slice(1), {
				before: this.before,
				done: this.done,
				return: this.return,
			}, this.returnTo);
		};

		var loadedBlocks = [];

		function loadBlock(block) {
			loadedBlocks.push(block);
		}

		function nextExpression() {
			var poppedBlock = loadedBlocks.pop();

			if (poppedBlock === undefined) {
				exitOnce([scope.toJSON()]);

				// call hooks and pass line details
				clearWaitingHooks();

				return null;
			} else {
				if (typeof poppedBlock.before === 'function') {
					poppedBlock.before();
					poppedBlock.before = null;
				}

				if (poppedBlock.statements.length > 0) {
					var node = poppedBlock.statements[0];
					loadedBlocks.push(poppedBlock.slice());

					exec(node, function(result) {
						if (result) {
							// do nothing?
						}
					});

					var expressionLine = {
						type: node.type,
						range: node.range,
					};

					// call hooks and pass line details
					clearWaitingHooks(expressionLine);

					return expressionLine;
				} else {
					// have exhausted all statements in top block
					if (typeof poppedBlock.done === 'function') {
						var doneOuput = poppedBlock.done();

						// TODO: more specific check to make sure object has type/range fields
						if (doneOuput !== undefined) {
							return doneOuput;
						}
					}

					return nextExpression();
				}
			}
		}

		function comprehendSeries(accumulated, remaining, done) {
			if (remaining.length === 0) {
				done(new Type.Array(accumulated));
			} else {
				exec(remaining[0], function(element) {
					// disallow the passing of functions as call arguments
					// or storing functions in arrays
					if (element.type === ValueType.FUNCTION) {
						throw remaining[0].error({
							type: ErrorType.TYPE_VIOLATION,
							message: 'Functions cannot be passed as arguments or stored in arrays',
						});
					} else if (element.type === ValueType.NONE) {
						throw remaining[0].error({
							type: ErrorType.TYPE_VIOLATION,
							message: 'Cannot collect a value from a function which has returned nothing',
						});
					}

					accumulated.push(element);
					comprehendSeries(accumulated, remaining.slice(1), done);
				});
			}
		}

		function exec(node, done) {
			if (node.execute === false) {
				if (typeof node.script === 'function') {
					node.script();
				}

				done();
				return;
			}

			switch (node.type) {
				case 'Literal':
					switch (node.subtype) {
						case TokenType.BOOLEAN:
							done(new Type.Boolean(node.value));
							break;
						case TokenType.NUMBER:
							done(new Type.Number(node.value));
							break;
						case TokenType.STRING:
							done(new Type.String(node.value));
							break;
						case ValueType.ARRAY:
							// execute each element of the array, pass executed array
							// to callback once all elements have been comprehended
							comprehendSeries([], node.elements, done);
							break;
						default:
							throw node.error({
								type: ErrorType.UNEXPECTED_TOKEN,
								message: 'Unknown value',
							});
					}

					break;

				case 'Identifier':
					done(scope.get(node));
					break;

				case 'AssignmentExpression':
					var assignee = node.left;

					if (assignee.type === 'Identifier') {
						exec(node.right, function(rightValue) {
							if (rightValue.isType(ValueType.NONE)) {
								throw node.right.error({
									type: ErrorType.TYPE_VIOLATION,
									message: 'Cannot use value None in an assignment',
								});
							}

							// normal assignment to identifier
							scope.set(assignee, rightValue);

							// call `scope` event
							event('scope', [scope.toJSON()]);

							done();
						});
					} else if (assignee.type === 'Subscript') {
						exec(assignee.root, function(rootValue) {
							if (rootValue.isType(ValueType.ARRAY) === false) {
								throw assignee.root.error({
									type: ErrorType.TYPE_VIOLATION,
									message: 'Subscript assignment notation can only be used on arrays',
								});
							}

							exec(assignee.slice[0], function(startSlice) {
								if (startSlice.isType(ValueType.NUMBER) === false) {
									throw assignee.slice[0].error({
										type: ErrorType.TYPE_VIOLATION,
										message: 'Subscript value must be a number, instead was ' + startSlice.type,
									});
								}

								function compute(startSlice, endSlice) {
									if (startSlice.get() >= rootValue.get().length || -startSlice.get() > rootValue.get().length) {
										throw assignee.slice[0].error({
											type: ErrorType.OUT_OF_BOUNDS,
											message: 'Index ' + startSlice.get() + ' is out of bounds of array with length ' + rootValue.get().length,
										});
									} else {
										var positiveStart = (startSlice.get() < 0 ? rootValue.get().length + startSlice.get() : startSlice.get());

										if (assignee.slice[1] === null) {
											var sliceLength = 1;
										} else {
											var positiveEnd = (endSlice.get() < 0 ? rootValue.get().length + endSlice.get() : endSlice.get());
											var sliceLength = positiveEnd - positiveStart;
										}

										exec(node.right, function(rightValue) {
											if (rightValue.isType(ValueType.NONE)) {
												throw node.right.error({
													type: ErrorType.TYPE_VIOLATION,
													message: 'Cannot use value None in an assignment',
												});
											}

											if (assignee.slice[1] === null) {
												// simple replacement at ONE position
												rootValue.get()[positiveStart] = rightValue;
											} else {
												// replacement of entire slice
												if (rightValue.isType(ValueType.ARRAY)) {
													var rightValueUnwound = rightValue.get();
												} else {
													var rightValueUnwound = rightValue;
												}

												rootValue.value.splice.apply(rootValue.value, [positiveStart, sliceLength].concat(rightValueUnwound));
											}

											// apply changes to scope
											// TODO: check that this operation still allows for
											// pointers between variable values
											scope.set(assignee.root, rootValue);

											// call applicable event
											event('scope', [scope.toJSON()]);
										});
									}
								}

								if (assignee.slice[1] !== null) {
									exec(assignee.slice[1], function(endSlice) {
										if (endSlice.isType(ValueType.NUMBER) === false) {
											throw assignee.slice[1].error({
												type: ErrorType.TYPE_VIOLATION,
												message: 'Subscript value must be a number, instead was ' + endSlice.type,
											});
										} else if (endSlice.get() > rootValue.get().length || -endSlice.get() > rootValue.get().length) {
											throw assignee.slice[1].error({
												type: ErrorType.OUT_OF_BOUNDS,
												message: 'Index ' + endSlice.get() + ' is out of bounds of array with length ' + rootValue.get().length,
											});
										}

										compute(startSlice, endSlice);
									});
								} else {
									compute(startSlice);
								}
							});
						});
					} else {
						throw assignee.error({
							type: ErrorType.UNKNOWN_OPERATION,
							message: 'Illegal left-hande side of assignment',
						});
					}

					break;

				case 'UnaryExpression':
					var operatorSymbol = node.operator.value;

					exec(node.right, function(rightValue) {
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

						done(computedValue);
					});

					break;

				case 'BinaryExpression':
					var operatorSymbol = node.operator.value;

					exec(node.left, function(leftValue) {
						exec(node.right, function(rightValue) {
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

							done(computedValue);
						});
					});

					break;

				case 'Subscript':
					var operatorSymbol = '[';

					exec(node.root, function(rootValue) {
						exec(node.slice[0], function(sliceStart) {
							function compute(operand) {
								try {
									var isUnary = false;
									var computedValue = rootValue.operation(isUnary, operatorSymbol, operand);
								} catch (details) {
									// catch errors created by the operation and based on the error type,
									// assign the errors to the offending expressions or tokens
									switch (details.type) {
										case ErrorType.TYPE_VIOLATION:
										case ErrorType.OUT_OF_BOUNDS:
											// errors caused by the subscript index
											if (node.slice[1] === null) {
												// if only slice start specified, only hold that token in error
												throw node.slice[0].error(details);
											} else {
												// if slice start and slice end explicitly specified in program,
												// make range including both numbers the error
												throw node.slice[0].range.union(node.slice[1].range).error(details);
											}
										default:
											throw node.error(details);
									}
								}

								done(computedValue);
							}

							if (node.slice[1] === null) {
								compute(sliceStart);
							} else {
								exec(node.slice[1], function(sliceEnd) {
									compute([sliceStart, sliceEnd])
								});
							}
						});
					});

					break;

				case 'DeleteStatement':
					if (node.variable.type === 'Subscript') {
						exec(node.variable.root, function(rootValue) {
							if (rootValue.isType(ValueType.ARRAY) === false) {
								throw node.variable.root.error({
									type: ErrorType.TYPE_VIOLATION,
									message: 'Delete statement can only be used on arrays',
								});
							}

							exec(node.variable.slice[0], function(startSlice) {
								if (startSlice.isType(ValueType.NUMBER) === false) {
									throw node.variable.slice[0].error({
										type: ErrorType.TYPE_VIOLATION,
										message: 'Subscript value must be a number, instead was ' + startSlice.type,
									});
								}

								function compute(startSlice, endSlice) {
									if (startSlice.get() >= rootValue.get().length || -startSlice.get() > rootValue.get().length) {
										throw node.variable.slice[0].error({
											type: ErrorType.OUT_OF_BOUNDS,
											message: 'Index ' + startSlice.get() + ' is out of bounds for array with length ' + rootValue.get().length,
										});
									}

									var positiveStart = (startSlice.get() < 0 ? rootValue.get().length + startSlice.get() : startSlice.get());

									if (node.variable.slice[1] === null) {
										var sliceLength = 1;
									} else {
										var positiveEnd = (endSlice.get() < 0 ? rootValue.get().length + endSlice.get() : endSlice.get());
										var sliceLength = positiveEnd - positiveStart;
									}

									if (sliceLength >= 0) {
										// delete `spliceLength` elements starting at index `startSlice`
										rootValue.value.splice(positiveStart, sliceLength);
									}

									// call scope event
									event('scope', [scope.toJSON()]);
								}

								if (node.variable.slice[1] !== null) {
									exec(node.variable.slice[1], function(endSlice) {
										if (endSlice.isType(ValueType.NUMBER) === false) {
											throw node.variable.slice[1].error({
												type: ErrorType.TYPE_VIOLATION,
												message: 'Subscript value must be a number, instead was ' + endSlice.type,
											});
										} else if (endSlice.get() > rootValue.get().length || -endSlice.get() > rootValue.get().length) {
											throw node.variable.slice[1].error({
												type: ErrorType.OUT_OF_BOUNDS,
												message: 'Index ' + endSlice.get() + ' is out of bounds for array with length ' + rootValue.get().length,
											});
										}

										compute(startSlice, endSlice);
									});
								} else {
									compute(startSlice);
								}
							});
						});
					} else {
						throw node.variable.error({
							type: ErrorType.ILLEGAL_STATEMENT,
							message: 'Expecting an Array subscript',
						});
					}

					break;

				case 'IfStatement':
					exec(node.condition, function(condition) {
						if (condition.value === true) {
							loadBlock(new ExecutionBlock(node.ifBlock.statements.slice(0)));
						} else {
							var cases = (node.elifBlocks || []);

							if (node.elseBlock !== null) {
								cases.push(node.elseBlock);
							}

							if (cases.length > 0) {
								loadBlock(new ExecutionBlock(cases));
							}
						}
					});

					break;

				case 'ElifStatement':
					exec(node.condition, function(condition) {
						if (condition.value === true) {
							loadBlock(new ExecutionBlock(node.block.statements.slice(0), {
								done: function() {
									// since this condition matched, prevent execution of any
									// other `elif` or `else` blocks
									loadedBlocks.pop();
								},
							}));
						}
					});

					break;

				case 'ElseStatement':
					loadBlock(new ExecutionBlock(node.block.statements.slice(0)));
					break;

				case 'WhileStatement':
					function whileLoop() {
						exec(node.condition, function(condition) {
							if (condition.value === true) {
								loadBlock(new ExecutionBlock(node.block.statements.slice(0), {
									done: whileLoop,
								}))
							}
						});

						// point back to line with while-condition
						return {
							type: node.type,
							range: node.range,
						};
					}

					whileLoop();

					break;

				case 'FunctionStatement':
					scope.set(node.name, new Type.Function(true, node.args, function(callArgValues, callingNode, done) {
						// add debugger pointer to function declaration so that declaration
						// line will be highlighted when stepping through the program
						if (node.block.statements[0].type !== 'FunctionStatement' && node.block.statements[0].execute !== false) {
							node.block.statements.unshift({
								type: 'FunctionStatement',
								execute: false,
								range: node.range,
							});
						}

						var returnTo = {
							type: 'CallExpression',
							execute: false,
							range: callingNode.range,
						};

						var block = new ExecutionBlock(node.block.statements.slice(0), {
							before: function() {
								// new level of scope
								scope = new Scope(scope, {
									name: node.name.value,
									args: node.args.map(function(arg) {
										return arg.value;
									}),
								});

								// create function argument variables
								for (var i = 0, l = Math.min(node.args.length, callArgValues.value.length); i < l; i++) {
									var forceLocal = true;
									scope.set(node.args[i], callArgValues.value[i], forceLocal);
								}

								// update scope listeners
								event('scope', [scope.toJSON()]);
							},

							done: function() {
								// return to old scope
								scope = scope.parent;

								event('scope', [scope.toJSON()]);

								// no returned expression, pass nothing
								done(new Type.None());
							},

							return: function(output) {
								// pass any returned expression
								done(output || new Type.None());
							},
						}, returnTo);

						loadBlock(block);

						return {
							type: node.type,
							range: node.range,
						};
					}));

					event('scope', [scope.toJSON()]);

					break;

				case 'ReturnStatement':
					if (node.arg !== null) {
						exec(node.arg, function(returnValue) {
							while (loadedBlocks.length > 0) {
								var popped = loadedBlocks.pop();

								if (typeof popped.return === 'function') {
									if (popped.returnTo !== null) {
										// pop scope
										scope = scope.parent;

										popped.returnTo.script = function() {
											// return data once interpreter has returned to the calling expression
											popped.return(returnValue);
											event('scope', [scope.toJSON()]);
										};

										loadedBlocks[loadedBlocks.length - 1].statements.unshift(popped.returnTo);
									}

									done();
									return;
								}
							}

							throw node.error({
								type: ErrorType.ILLEGAL_STATEMENT,
								message: 'Can only return from inside a function',
							});
						});
					} else {
						while (loadedBlocks.length > 0) {
							var popped = loadedBlocks.pop();

							if (typeof popped.return === 'function') {
								if (popped.returnTo !== null) {
									// pop scope
									scope = scope.parent;

									popped.returnTo.script = function() {
										// return data once interpreter has returned to the called expression
										popped.return(new Type.None());
										event('scope', [scope.toJSON()]);
									};

									loadedBlocks[loadedBlocks.length - 1].statements.unshift(popped.returnTo);
								}

								done();
								return;
							}
						}

						throw node.error({
							type: ErrorType.ILLEGAL_STATEMENT,
							message: 'Can only return from inside a function',
						});
					}

					break;

				case 'CallExpression':

					var functionValue = scope.get(node.callee);

					comprehendSeries([], node.args, function(callArgValues) {
						if (functionValue.blocking === true) {
							// functions defined in-program and thus debugging execution flow
							// will pass to the function declaration to walk through
							// the function's logic line-by-line
							functionValue.exec(callArgValues, node, done);
						} else {
							// function is inline, probably build-in like `len()` or `print()` and should
							// not effect the line-by-line debugger flow
							var possibleReturnValue = functionValue.exec(node.callee, node.args, callArgValues.value, simplifyValue(callArgValues));

							// convert the return value (if it exists) to an internal represented value object
							// TODO: currently arrays are not supported
							var returnValue;
							switch (typeof possibleReturnValue) {
								case 'boolean':
									returnValue = new Type.Boolean(possibleReturnValue);
									break;
								case 'number':
									returnValue = new Type.Number(possibleReturnValue);
									break;
								case 'string':
									returnValue = new Type.String(possibleReturnValue);
									break;
								default:
									returnValue = new Type.None();
							}

							done(returnValue);
						}
					});

					break;

				default:
					throw node.error({
						type: ErrorType.ILLEGAL_STATEMENT,
						message: 'Unknown statement with type "' + node.type + '"',
					});
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

				loadBlock(new ExecutionBlock(ast.body, {
					done: function() {
						// TODO: fire `exit` event
					},
				}));
			},

			next: function() {
				return nextExpression();
			},

			on: registerHook,
		};
	}

	return Interpreter;
}());
