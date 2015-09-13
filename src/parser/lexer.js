// [MiniPy] /src/parser/Lexer.js

var Lexer = (function(Token) {
	function Lexer(scanner) {
		var prefixOperatorCharacters = '=<>+-*/&|%^~!';
		var suffixOperatorCharacters = '=<>+-*/&|';
		var punctuationCharacters = ',:()[]{}';

		var keywords = [
			'and',
			'as',
			'assert',
			'break',
			'class',
			'continue',
			'def',
			'del',
			'elif',
			'else',
			'except',
			'exec',
			'finally',
			'for',
			'from',
			'global',
			'if',
			'import',
			'in',
			'is',
			'lambda',
			'not',
			'or',
			'pass',
			// 'print',
			'raise',
			'return',
			'try',
			'while',
			'with',
			'yield',
		];

		var indentationStack = [0];
		var buffer = [];

		function isKeyword(test) {
			return keywords.indexOf(test) >= 0;
		}

		function isNewline(test) {
			return ('\n' === test);
		}

		function isEOL() {
			if (scanner.peek() === '\n' || scanner.EOF()) {
				return true;
			} else {
				return false;
			}
		}

		function isAlpha(test) {
			return ((test >= 'a' && test <= 'z') || (test >= 'A' && test <= 'Z')) && (test !== null);
		}

		function isNumeric(test) {
			return (test >= '0' && test <= '9') && (test !== null);
		}

		function isBooleanLiteral(test) {
			return (test === 'True' || test === 'False');
		}

		function contains(str, test) {
			return (str.indexOf(test) >= 0);
		}

		function readNext() {
			if (buffer.length > 0) {
				return buffer.shift();
			}

			if (scanner.EOF() === true) {
				return null;
			} else {
				var c, p = scanner.peek();

				if (p <= ' ') {
					// handle whitespace
					if (p === '\n') {
						// handle newlines
						var indentation = '';

						// consume newline
						scanner.next();
						var line = scanner.line;
						var column = scanner.column;

						while ((p = scanner.peek()) === '\t') {
							indentation += scanner.next();
						}

						if (scanner.peek() > ' ') {
							// next character is NOT whitespace
							// only apply indentation if line has
							// characters other than whitespace
							if (indentation.length > indentationStack[0]) {
								// code has indented
								indentationStack.unshift(indentation.length);
								buffer.push(new Token(this, 'Indent', null, line, column));
							} else if (indentation.length < indentationStack[0]) {
								// code has dedented
								indentationStack.shift();
								buffer.push(new Token(this, 'Dedent', null, line, column));
							}
						} else if (scanner.EOF() && indentationStack.length > 1) {
							while (indentationStack.length > 1) {
								indentationStack.shift();
								buffer.push(new Token(this, 'Dedent', null, line, column));
							}
						}

						return readNext();
					} else {
						// handle non-newline whitespace

						// consume whitespace character
						scanner.next();

						return readNext();
					}
				} else if (p === '#') {
					// handle comments
					while (true) {
						p = scanner.peek();

						if (p === '' || p === '\n') {
							break;
						} else {
							scanner.next();
						}
					}

					return readNext();
				} else {
					if (isAlpha(p) || p === '_') {
						// handle words (either identifiers or keywords)
						var type = 'Identifier';
						var line = scanner.line;
						var column = scanner.column;
						var value = scanner.next();

						while (true) {
							p = scanner.peek();

							if (p !== null) {
								if (isAlpha(p) || isNumeric(p) || p === '_') {
									value += scanner.next();
								} else {
									break;
								}
							} else {
								break;
							}
						}

						if (isKeyword(value)) {
							type = 'Keyword';
						} else if (isBooleanLiteral(value)) {
							type = 'Boolean';
						}

						return new Token(this, type, value, line, column, isEOL());
					} else if (isNumeric(p)) {
						// handle numbers
						var type = 'Numeric';
						var line = scanner.line;
						var column = scanner.column;
						var value = scanner.next();

						// gather digits
						while ((p = scanner.peek())) {
							if (!isNumeric(p)) {
								// next char is not a digit
								break;
							} else {
								// append digit
								value += scanner.next();
							}
						}

						if (p === '.') {
							value += scanner.next();

							// gather [0-9]
							while (true) {
								p = scanner.peek();

								if (!isNumeric(p)) {
									// next char is not a digit
									break;
								} else {
									// append digit
									value += scanner.next();
								}
							}
						}

						if (p === 'e' || p === 'E') {
							// handle exponent
							value += scanner.next();
							p = scanner.peek();

							if (p === '-' || p === '+') {
								// exponent sign exists
								value += scanner.next();
								p = scanner.peek();
							}

							if (!isNumeric(p)) {
								// next character is not a digit
								throw scanner.error({
									type: 'SyntaxError',
									message: 'Incorrect exponent syntax, expected a digit',
									from: {
										line: scanner.line,
										column: scanner.column,
									},
									to: {
										line: scanner.line,
										column: scanner.column + 1,
									},
								});
							}

							do {
								// gather only exponent digits
								value += scanner.next();
								p = scanner.peek();
							} while (isNumeric(p))
						}

						if (isAlpha(p)) {
							throw scanner.error({
								type: 'SyntaxError',
								message: 'Expected a digit',
								from: {
									line: scanner.line,
									column: scanner.column,
								},
								to: {
									line: scanner.line,
									column: scanner.column + 1,
								},
							});
						}

						return new Token(this, type, value, line, column, isEOL());
					} else if (p === '"' || p === '\'') {
						// handle string literals
						var type = 'String';
						var line = scanner.line;
						var column = scanner.column;
						var quoteType = scanner.next();
						var value = '';

						while (true) {
							p = scanner.peek();

							if (p === null) {
								// unexpected end of line
								throw scanner.error({
									type: 'SyntaxError',
									message: 'Unterminated string, expecting a matching end quote instead got end of program',
									from: {
										line: line,
										column: column,
									},
									to: {
										line: scanner.line,
										column: scanner.column + 1,
									},
								});
							} else if (p < ' ') {
								// irregular character in literal
								if (p === '\n' || p === '\r' || p === '') {
									// advance scanner to get accurage
									// line/column position
									scanner.next();

									throw scanner.error({
										type: 'SyntaxError',
										message: 'Unterminated string, expecting a matching end quote',
										from: {
											line: line,
											column: column,
										},
										to: {
											line: scanner.line,
											column: scanner.column,
										},
									});
								} else {
									// catch control characters
									throw scanner.error({
										type: 'SyntaxError',
										message: 'Control character in string',
										from: {
											line: scanner.line,
											column: scanner.column,
										},
										to: {
											line: scanner.line,
											column: scanner.column + 1,
										},
									});
								}
							} else if (p === quoteType) {
								// consume quote, finish collecting characters
								scanner.next();
								break;
							} else if (p === '\\') {
								// consume backslash and its escaped character
								value += scanner.next();

								switch (scanner.next()) {
									// Python escape sequence docs:
									case '\n':
										// ignore escaped newline
										break;
									case '\\':
										// backslash
										value += '\\';
										break;
									case '\'':
										// single quote
										value += '\'';
										break;
									case '"':
										// double quote
										value += '\"';
										break;
									case 'a':
										// ASCII bell (BEL)
										value += '\a';
										break;
									case 'b':
										// ASCII backspace (BS)
										value += '\b';
										break;
									case 'f':
										// ASCII formfeed (FF)
										value += '\f';
										break;
									case 'n':
										// ASCII linefeed (LF)
										value += '\n';
										break;
									case 'r':
										// ASCII carriage return (CR)
										value += '\r';
										break;
									case 't':
										// ASCII horizontal tab (TAB)
										value += '\t';
										break;
								}
							} else {
								value += scanner.next();
							}
						}

						return new Token(this, type, value, line, column, isEOL());
					} else if (contains(prefixOperatorCharacters, p) ||
						contains(punctuationCharacters, p)) {
						// handle operators
						var type = 'Punctuator';
						var line = scanner.line;
						var column = scanner.column;
						var value = scanner.next();

						if (contains(prefixOperatorCharacters, value) &&
							contains(suffixOperatorCharacters, scanner.peek())) {
							value += scanner.next();
						}

						return new Token(this, type, value, line, column, isEOL());
					}
				}

				throw scanner.error({
					type: 'SyntaxError',
					message: 'Unexpected character',
					from: {
						line: scanner.line,
						column: scanner.column,
					},
					to: {
						line: scanner.line,
						column: scanner.column + 1,
					},
				});
			}
		}

		var history = [];

		return {
			peek: function(backset) {
				if (typeof backset === 'number' && backset < 1) {
					return history[history.length + backset];
				} else if (typeof backset === 'number' && backset > 1) {
					throw new Error('Cannot peek forward more than 1 token');
				} else {
					if (buffer.length > 0) {
						return buffer[0];
					} else {
						var next = readNext();

						if (next !== null) {
							buffer.push(next);
							return next;
						} else {
							return null;
						}
					}
				}
			},

			next: function() {
				var next = readNext();
				
				if (next !== null) {
					history.push(next);
				}

				return next;
			},

			EOF: function() {
				return (scanner.EOF() && buffer.length === 0);
			},

			error: function(details) {
				return scanner.error(details);
			},
		};
	}

	return Lexer;
}(Token));
