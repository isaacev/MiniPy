// [MiniPy] /src/parser/Lexer.js

exports.Lexer = (function() {
	var ErrorType = require('../enums').enums.ErrorType;
	var TokenType = require('../enums').enums.TokenType;

	var Token = require('./token').Token;

	function Lexer(scanner) {
		var self = this;
		var RangeBuilder = require('../error/range').Range(scanner.input);

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

			// emit Newline token
			var prevLine = sc.line;
			var prevColumn = sc.column;
			pushToken(new Token(self, TokenType.NEWLINE, sc.next(), RangeBuilder.create(prevLine, prevColumn, prevLine, prevColumn + 1)));
		}

		var tokenBuffer = [];
		var state = {
			indent: 0,
			hasPassedFirstLine: false,
		};

		function pushToken(token) {
			var prev = tokenBuffer[tokenBuffer.length - 1];

			if (!((prev && prev.type === TokenType.NEWLINE) && token.type === TokenType.NEWLINE)) {
				tokenBuffer.push(token);
			}
		}

		function nextToken() {
			if (scanner.EOF() === true) {
				if (state.indent > 0) {
					// emit Newline token
					var prevLine = scanner.line;
					var prevColumn = scanner.column;
					pushToken(new Token(self, TokenType.NEWLINE, null, RangeBuilder.create(prevLine, prevColumn, prevLine, prevColumn + 1)));

					while (state.indent > 0) {
						state.indent -= 1;
						pushToken(new Token(self, TokenType.DEDENT, null, RangeBuilder.create(scanner.line, scanner.column, scanner.line, scanner.column + 1)));
					}
				}

				pushToken(new Token(self, TokenType.EOF, null, RangeBuilder.create(scanner.line, scanner.column)));
				return false;
			} else {
				var p = scanner.peek();

				if (isNewline(p)) {
					// emit Newline token
					var prevLine = scanner.line;
					var prevColumn = scanner.column;
					pushToken(new Token(self, TokenType.NEWLINE, scanner.next(), RangeBuilder.create(prevLine, prevColumn, prevLine, prevColumn + 1)));

					var currLineIndent = 0;
					var range = RangeBuilder.open(scanner.line, 0);

					while (true) {
						p = scanner.peek();

						if (isNewline(p)) {
							// emit Newline token
							var prevLine = scanner.line;
							var prevColumn = scanner.column;
							pushToken(new Token(self, TokenType.NEWLINE, scanner.next(), RangeBuilder.create(prevLine, prevColumn, prevLine, prevColumn + 1)));

							// reset indentation counters
							currLineIndent = 0;
							range = RangeBuilder.open(scanner.line, 0);
						} else if (isWhitespace(p)) {
							// collect all indentation first
							var pureTabIndentation = true;

							while (isWhitespace(p = scanner.peek()) && !isNewline(p)) {
								if (!isTab(p)) {
									pureTabIndentation = false;
								}

								scanner.next();
								currLineIndent += 1;
							}

							if (isNewline(p) || isNull(p)) {
								// an upcoming newline or EOF means that this line was only
								// filled with whitespace so return the next token
								// and ignore this line
								break;
							} else if (isCommentStart(p)) {
								// consume comments that begin after indentation
								consumeComment(scanner);

								// reset indentation counters
								currLineIndent = 0;
								range = RangeBuilder.open(scanner.line, 0);
							} else {
								// handle non-empty line
								if (pureTabIndentation === true) {
									if (state.hasPassedFirstLine === false) {
										// first semantically significant line is
										// indented, throw an error
										throw range.close(scanner.line, scanner.column).error({
											type: ErrorType.BAD_INDENTATION,
											message: 'First line cannot be indented',
										});
									} else {
										if (currLineIndent > state.indent) {
											if (currLineIndent === state.indent + 1) {
												// current line increases level of indentation by 1
												state.indent += 1;
												pushToken(new Token(self, TokenType.INDENT, null, RangeBuilder.create(scanner.line, 0, scanner.line, currLineIndent)));
											} else {
												// current line increases by more than 1 level of
												// indentation, throw error
												throw range.close(scanner.line, scanner.column).error({
													type: ErrorType.BAD_INDENTATION,
													message: 'Too much indentation',
												});
											}
										} else if (currLineIndent < state.indent) {
											// current line has less indentation than previous lines
											// emit dedent tokens until fully resolved
											while (state.indent > currLineIndent) {
												state.indent -= 1;
												pushToken(new Token(self, TokenType.DEDENT, null, RangeBuilder.create(scanner.line, 0, scanner.line, currLineIndent)));
											}
										}
									}
								} else {
									// the next token is non-whitespace meaning this line
									// uses illegal whitespace characters in its indentation
									// TODO: currently entire indentation is flagged in error, consider
									// changing to only first flag illegal character?
									throw range.close(scanner.line, scanner.column).error({
										type: ErrorType.BAD_INDENTATION,
										message: 'Bad indentation; indent can only be composed of tab characters',
										from: {
											line: scanner.line,
										},
									});
								}
							}
						} else if (isCommentStart(p)) {
							// consume comments that begin after a newline
							consumeComment(scanner);

							// reset indentation counters
							currLineIndent = 0;
							range = RangeBuilder.open(scanner.line, 0);
						} else {
							// line starts with a non-whitespace token
							// deal with dedents when appropriate

							if (state.indent === -1 && !isCommentStart(p)) {
								// since this line has 0-level indentation (and is not
								// a comment) set indent counter to 0 to permit 1+ level
								// indentation in the future
								state.indent = 0;
							}

							if (state.indent > currLineIndent) {
								// dedent 1 or more lines
								while (state.indent > currLineIndent) {
									state.indent -= 1;
									pushToken(new Token(self, TokenType.DEDENT, null, RangeBuilder.create(scanner.line, 0, scanner.line, currLineIndent)));
								}
							}

							break;
						}
					}

					return true;
				} else if (isWhitespace(p)) {
					// handle non-newline whitespace
					if (scanner.column === 0 && scanner.line === 0) {
						// is the start of the very first line, if the first line is indented
						// and is semantically significant, throw an error. if it's only
						// whitespace or a comment, keep lexing

						// gather all the whitespaces
						var leadingWhitespace = '';
						var range = RangeBuilder.open(0, 0);

						while (isWhitespace(p = scanner.peek()) && !isNewline(p)) {
							leadingWhitespace += scanner.next();
						}

						if (isCommentStart(p)) {
							// leave the comment-parsing for later
							return true;
						} else if (isNewline(p) === false) {
							// line was indented but is significant making
							// the indentation illegal
							throw range.close(0, leadingWhitespace.length).error({
								type: ErrorType.BAD_INDENTATION,
								message: 'First line cannot be indented',
							});
						}
					} else {
						// at any other point in the program, just consume
						// the whitespace and move on
						scanner.next();
					}

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
						var range = RangeBuilder.open(scanner.line, scanner.column);
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
							var type = TokenType.PUNCTUATOR;
						} else if (isKeyword(value)) {
							var type = TokenType.KEYWORD;
						} else if (isBooleanLiteral(value)) {
							var type = TokenType.BOOLEAN;

							// in the case of boolean values, convert the string
							// to a real boolean value
							value = (value === 'True');
						} else {
							var type = TokenType.IDENTIFIER;
						}

						pushToken(new Token(self, type, value, range.close(scanner.line, scanner.column)));
						return true;
					} else if (isNumeric(p)) {
						// handle numbers
						var range = RangeBuilder.open(scanner.line, scanner.column);
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
							throw RangeBuilder.create(scanner.line, scanner.column, scanner.line, scanner.column + 1).error({
								type: ErrorType.UNEXPECTED_CHARACTER,
								message: 'Expected a digit',
							});
						}

						// try to parse the string to a real number
						var parsed = parseFloat(value);

						if (isNaN(parsed) === true) {
							// throw an error if the JS parser couldn't make
							// sense of the string
							throw range.close(scanner.line, scanner.column).error({
								type: ErrorType.UNEXPECTED_CHARACTER,
								message: 'Could not parse as number',
							});
						}

						pushToken(new Token(self, TokenType.NUMBER, parsed, range.close(scanner.line, scanner.column)));
						return true;
					} else if (p === '"' || p === '\'') {
						// handle string literals
						var range = RangeBuilder.open(scanner.line, scanner.column);
						var quoteType = scanner.next();
						var value = '';

						while (true) {
							p = scanner.peek();

							if (isNull(p)) {
								// unexpected end of line
								throw range.close(scanner.line, scanner.column).error({
									type: ErrorType.UNEXPECTED_EOF,
									message: 'Unterminated string; expecting a matching end quote instead got end of program',
								});
							} else if (p < ' ') {
								// irregular character in literal
								if (p === '\n' || p === '\r' || p === '') {
									// advance scanner to get accurate
									// line/column position
									scanner.next();

									throw range.close(scanner.line, scanner.column).error({
										type: ErrorType.UNEXPECTED_CHARACTER,
										message: 'Unterminated string, expecting a matching end quote instead the line ended',
									});
								} else {
									// catch control characters
									throw RangeBuilder.create(scanner.line, scanner.column, scanner.line, scanner.column + 1).error({
										type: ErrorType.UNEXPECTED_CHARACTER,
										message: 'Control character in string',
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

						pushToken(new Token(self, TokenType.STRING, value, range.close(scanner.line, scanner.column)));
						return true;
					} else if (contains(prefixOperatorCharacters, p) ||
						contains(punctuationCharacters, p)) {
						// handle operators
						var range = RangeBuilder.open(scanner.line, scanner.column);
						var value = scanner.next();

						if (contains(prefixOperatorCharacters, value) &&
							contains(suffixOperatorCharacters, scanner.peek())) {
							value += scanner.next();
						}

						pushToken(new Token(self, TokenType.PUNCTUATOR, value, range.close(scanner.line, scanner.column)));
						return true;
					}
				}

				// consume character for accurate line/column info

				throw RangeBuilder.create(scanner.line, scanner.column, scanner.line, scanner.column + 1).error({
					type: ErrorType.UNEXPECTED_CHARACTER,
					message: 'Unexpected character',
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
