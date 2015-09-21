// [MiniPy] /src/parser/Lexer.js

exports.Lexer = (function() {
	var ErrorType = require('../error/errorType').ErrorType;
	var Token = require('./token').Token;

	function Lexer(scanner) {
		var self = this;

		var prefixOperatorCharacters = '=<>+-*/&|%^~!';
		var suffixOperatorCharacters = '=<>+-*/&|';
		var punctuationCharacters = ',:()[]{}';

		var keywords = [
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
			'lambda',
			'pass',
			// 'print',
			'raise',
			'return',
			'try',
			'while',
			'with',
			'yield',
		];

		var keywordOperators = [
			'and',
			'is',
			'not',
			'or',
		];

		function isKeywordOperator(test) {
			return keywordOperators.indexOf(test) >= 0;
		}

		function isKeyword(test) {
			return keywords.indexOf(test) >= 0;
		}

		function isWhitespace(test) {
			return (test <= ' ') && !isNull(test);
		}

		function isNewline(test) {
			return ('\n' === test);
		}

		function isTab(test) {
			return ('\t' === test);
		}

		function isNull(test) {
			return (test === null);
		}

		function isAlpha(test) {
			return ((test >= 'a' && test <= 'z') || (test >= 'A' && test <= 'Z')) && !isNull(test);
		}

		function isNumeric(test) {
			return (test >= '0' && test <= '9') && !isNull(test);
		}

		function isBooleanLiteral(test) {
			return (test === 'True' || test === 'False');
		}

		function isCommentStart(test) {
			return (test === '#');
		}

		function contains(str, test) {
			return (str.indexOf(test) >= 0);
		}

		function consumeComment(sc) {
			var p;

			while (true) {
				p = sc.peek();

				if (isNull(p) || isNewline(p)) {
					break;
				} else {
					sc.next();
				}
			}

			pushToken(new Token(self, 'Newline', sc.next(), sc.line, null));
		}

		var tokenBuffer = [];
		var state = {
			indent: 0,
			hasPassedFirstLine: false,
		};

		function pushToken(token) {
			var prev = tokenBuffer[tokenBuffer.length - 1];

			if (!((prev && prev.type === 'Newline') && token.type === 'Newline')) {
				tokenBuffer.push(token);
			}
		}

		function nextToken() {
			if (scanner.EOF() === true) {
				if (state.indent > 0) {
					pushToken(new Token(self, 'Newline', null, null, null));

					while (state.indent > 0) {
						state.indent -= 1;
						pushToken(new Token(self, 'Dedent', null, null, null));
					}
				}

				pushToken(new Token(self, 'EOF', null, scanner.line, scanner.column));
				return false;
			} else {
				var p = scanner.peek();

				if (isNewline(p)) {
					pushToken(new Token(self, 'Newline', scanner.next(), scanner.line, null));

					var currLineIndent = 0;

					while (true) {
						p = scanner.peek();

						if (isNewline(p)) {
							// emit Newline token
							pushToken(new Token(self, 'Newline', scanner.next(), scanner.line, null));
						} else if (isTab(p)) {
							// handle indentation

							// gather consecutive tabs
							while (isTab(p = scanner.peek())) {
								scanner.next();
								currLineIndent += 1;
							}

							// handle characters AFTER TAB INDENTATION
							if (isNewline(p)) {
								// next character is newline or the start of a comment
								// thus any indentation collected is meaningless
								// so consume indentation an go on
								scanner.next();

								// reset indentation counter since the newline makes
								// any collected indentation meaningless
								currLineIndent = 0;
							} else if (isCommentStart(p)) {
								// next character is a comment so consume the comment
								// and go to the next character. also reset indentation
								// count because this line is syntactically insignificant
								consumeComment(scanner);

								p = scanner.peek();
								currLineIndent = 0;
							} else if (isWhitespace(p)) {
								// next character is not a newline or a tab, if the
								// line is non-empty, throw an error

								// consume non-newline whitespace characters
								while (isWhitespace(p = scanner.peek()) && !isNewline(p)) {
									scanner.next();
								}

								if (isNewline(p)) {
									// an upcoming newline or comment means that this line was only
									// filled with whitespace so return the next token
									// and ignore this line
									currLineIndent = 0;
									break;
								} else if (isCommentStart(p)) {
									// consume upcoming comment and add newline to buffer
									consumeComment(scanner);

									currLineIndent = 0;
									break;
								} else {
									// the next token is non-whitespace meaning this line
									// uses illegal whitespace characters in its indentation
									throw scanner.error({
										type: ErrorType.BAD_INDENTATION,
										message: 'Bad indentation; indent can only be composed of tab characters',
										from: {
											line: scanner.line,
										},
									});
								}
							} else {
								// handle non-whitespace, non-comment tokens
								if (state.hasPassedFirstLine === false) {
									// lines with 1+-level indentation are occuring before any
									// lines with 0-level indentation, throw an error
									throw scanner.error({
										type: ErrorType.BAD_INDENTATION,
										message: 'First line cannot be indented',
										from: {
											line: scanner.line,
										},
									});
								} else {
									if (currLineIndent > state.indent) {
										if (currLineIndent === state.indent + 1) {
											// current line increases level of indentation by 1
											state.indent += 1;
											pushToken(new Token(self, 'Indent', null, scanner.line, null));
										} else {
											// current line increases by more than 1 level of
											// indentation, throw error
											throw scanner.error({
												type: ErrorType.BAD_INDENTATION,
												message: 'Too much indentation',
												from: {
													line: scanner.line,
												},
											});
										}
									} else if (currLineIndent < state.indent) {
										// current line has less indentation than previous lines
										// dedent to resolve
										while (state.indent > currLineIndent) {
											state.indent -= 1;
											pushToken(new Token(self, 'Dedent', null, scanner.line, null));
										}
									}
								}

								break;
							}
						} else if (isWhitespace(p)) {
							// deal with non-tab whitespace at beginning of line
							// if the line isn't empty (has non-whitespace characters)
							// then throw an error

							// consume non-newline whitespace characters
							while (isWhitespace(p = scanner.peek()) && !isNewline(p)) {
								scanner.next();
							}

							if (isNewline(p) || isNull(p)) {
								// an upcoming newline or EOF means that this line was only
								// filled with whitespace so return the next token
								// and ignore this line
								break;
							} else {
								// the next token is non-whitespace meaning this line
								// uses illegal whitespace characters in its indentation;
								throw scanner.error({
									type: ErrorType.BAD_INDENTATION,
									message: 'Bad indentation; indent can only be composed of tab characters',
									from: {
										line: scanner.line,
									},
								});
							}
						} else if (isCommentStart(p)) {
							// consume comments that begin after a newline
							consumeComment(scanner);
						} else {
							// line starts with a non-whitespace token
							// deal with dedents when appropriate

							if (state.indent === -1 && !isCommentStart(p)) {
								// since this line has 0-level indentation (and is not
								// a comment) set indent counter to 0 to permit 1+ level
								// indentation in the future
								state.indent = 0;
							}

							if (state.indent > 0) {
								// dedent 1 or more lines
								while (state.indent > 0) {
									state.indent -= 1;
									pushToken(new Token(self, 'Dedent', null, scanner.line, null));
								}
							}

							break;
						}
					}

					return true;
				} else if (isWhitespace(p)) {
					// handle non-newline whitespace
					scanner.next();
					return true;
				} else if (isCommentStart(p)) {
					consumeComment(scanner);
					return true;
				} else {
					if (scanner.column === 0) {
						state.hasPassedFirstLine = true;
					}

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

						if (isKeywordOperator(value)) {
							type = 'Punctuator';
						} else if (isKeyword(value)) {
							type = 'Keyword';
						} else if (isBooleanLiteral(value)) {
							type = 'Boolean';
						}

						pushToken(new Token(self, type, value, line, column));
						return true;
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

						// TODO: the lexer isn't worried about multiple decimal
						// points (which constitute and illegal literal) instead
						// it relies on the JS `parseFloat` function to signal
						// the error. consider making the lexer more cognizant of
						// this possible error state

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

						if (isAlpha(p)) {
							throw scanner.error({
								type: ErrorType.UNEXPECTED_CHARACTER,
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

						pushToken(new Token(self, type, value, line, column));
						return true;
					} else if (p === '"' || p === '\'') {
						// handle string literals
						var type = 'String';
						var line = scanner.line;
						var column = scanner.column;
						var quoteType = scanner.next();
						var value = '';

						while (true) {
							p = scanner.peek();

							if (isNull(p)) {
								// unexpected end of line
								throw scanner.error({
									type: ErrorType.UNEXPECTED_EOF,
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
										type: ErrorType.UNEXPECTED_CHARACTER,
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
										type: ErrorType.UNEXPECTED_CHARACTER,
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

						pushToken(new Token(self, type, value, line, column));
						return true;
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

						pushToken(new Token(self, type, value, line, column));
						return true;
					}
				}

				throw scanner.error({
					type: ErrorType.UNEXPECTED_CHARACTER,
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

		while (true) {
			if (nextToken() !== true) {
				break;
			}
		}

		var nextTokenIndex = 0;

		this.curr = function() {
			return tokenBuffer[nextTokenIndex - 1] || null;
		};

		this.peek = function() {
			return tokenBuffer[nextTokenIndex] || null;
		};

		this.next = function() {
			return tokenBuffer[nextTokenIndex++] || null;
		};

		this.EOF = function() {
			return (scanner.EOF() && buffer.length === 0);
		};

		this.error = function(details) {
			return scanner.error(details);
		};
	}

	return Lexer;
}());
