// [MiniPy] /src/parser/Parser0.js

var Parser = (function(CustomError) {
	function Parser(lexer) {
		var precedenceTable = {
			// assignment operators
			'=': 10,

			// logical operators
			'||': 20,
			'or': 20,

			'&&': 30,
			'and': 30,

			'!=': 40,
			// 'not': 40, // TODO: implement unary operators!!!!

			'<': 50,
			'>': 50,
			'<=': 50,
			'>=': 50,
			'==': 50,

			// arithmetic operators
			'+': 60,
			'-': 60,
			'*': 70,
			'/': 70,
			'//': 70,
			'%': 70,
			'**': 80,
		};

		function nextTokenMatches(type, value) {
			var p = lexer.peek();

			if (p === null) {
				return null;
			}

			if (p.type === type) {
				if (value === undefined) {
					// token matches type, no value given
					return p;
				} else if (p.value === value) {
					// token maches type and value
					return p;
				} else {
					// token matches type but not value
					return null;
				}
			} else {
				return null;
			}
		}

		function consumeNextToken(type, value) {
			var n = lexer.next();

			if ((n.type !== type) || (value !== undefined && n.value !== value)) {
				throw new CustomError({
					type: 'SyntaxError',
					message: 'Unexpected ' + token.type + ' token',
					from: {
						line: token.line,
						column: token.column,
					},
					to: {
						line: token.line,
						column: token.column + token.value.length,
					},
				});
			}

			return n;
		}

		function consumeOptionalToken(type, value) {
			var p = lexer.peek();

			if (p.type === type) {
				if (value === undefined) {
					consumeNextToken(type, value);
					return true;
				} else if (value !== undefined && p.value === value) {
					consumeNextToken(type, value);
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		}

		function parseAtomicExpression() {
			return callExpressionLookAhead(function() {
				if (nextTokenMatches('Punctuator', '(')) {
					// consume left paren
					consumeNextToken('Punctuator', '(');

					// get enclosed expression
					var expression = parseExpression();

					// consume right paren, check for EOL
					var rightParen = consumeNextToken('Punctuator', ')');

					// transfer right paren EOL state to expression
					expression.EOL = rightParen.EOL;

					return expression;
				} else if (nextTokenMatches('Keyword')) {
					switch (lexer.peek().value) {
						case 'print':
							return parsePrintStatement();
						case 'if':
							return parseIfStatement();
						case 'while':
							return parseWhileStatement();
						case 'for':
							return parseForStatement();
						default:
							var keyword = lexer.next();
							throw new CustomError({
								type: 'SyntaxError',
								message: 'Unexpected keyword: "' + keyword.value + '"',
								from: {
									line: keyword.line,
									column: keyword.column,
								},
								to: {
									line: keyword.line,
									column: keyword.column + keyword.value.length,
								},
							});
					}
				}

				var token = lexer.next();

				if (token.type === 'Identifier') {
					var expression = {
						type: 'Identifier',
						value: token.value,
						line: token.line,
						column: token.column,
						EOL: token.EOL,
					};

					return expression;
				} else if (['Numeric', 'String', 'Boolean'].indexOf(token.type) >= 0) {
					var expression = {
						type: 'Literal',
						subtype: token.type,
						value: token.value,
						line: token.line,
						column: token.column,
						EOL: token.EOL,
					};

					return expression;
				} else {
					throw new CustomError({
						type: 'SyntaxError',
						message: 'Unexpected ' + token.type + ' token',
						from: {
							line: token.line,
							column: token.column,
						},
						to: {
							line: token.line,
							column: token.column + token.value.length,
						},
					});
				}
			});
		}

		function parseCallExpression(callee) {
			var args = [];

			// consume left argument paren
			consumeNextToken('Punctuator', '(');

			if (!nextTokenMatches('Punctuator', ')')) {
				// collect arguments
				while (true) {
					// grab argument expression
					args.push(parseExpression());

					if (nextTokenMatches('Punctuator', ',')) {
						consumeNextToken('Punctuator', ',');

						if (nextTokenMatches('Punctuator', ')')) {
							// comma recently consume was a trailing comma
							break;
						} else {
							// still more arguments to consume
							continue;
						}
					} else {
						// no arguments
						break;
					}
				}
			}

			// consume right argument paren
			var rightParen = consumeNextToken('Punctuator', ')');

			return {
				type: 'CallExpression',
				callee: callee,
				arguments: args,
				line: callee.line,
				column: callee.column,
				EOL: rightParen.EOL,
			};
		}

		function callExpressionLookAhead(leftExpression) {
			leftExpression = leftExpression();
			if (nextTokenMatches('Punctuator', '(')) {
				return parseCallExpression(leftExpression);
			} else {
				return leftExpression;
			}
		}

		function binaryExpressionLookAhead(leftExpression, thisPrecedence) {
			var operatorToken = nextTokenMatches('Punctuator');

			if (operatorToken && precedenceTable[operatorToken.value] > 0) {
				var otherPrecedence = precedenceTable[operatorToken.value];

				if (otherPrecedence > thisPrecedence) {
					// consume operator token
					lexer.next();

					var rightExpression = binaryExpressionLookAhead(parseAtomicExpression(), otherPrecedence);

					if (operatorToken.value === '=') {
						if (leftExpression.type != 'Identifier') {
							throw new CustomError({
								type: 'SyntaxError',
								message: 'Illegal left side of assignment',
								from: {
									line: leftExpression.line,
								},
							});
						}

						var expression = {
							type: 'AssignmentExpression',
							operator: '=',
							left: leftExpression,
							right: rightExpression,
							line: operatorToken.line,
							column: operatorToken.column,
							EOL: rightExpression.EOL,
						};
					} else {
						var expression = {
							type: 'BinaryExpression',
							operator: operatorToken.value,
							left: leftExpression,
							right: rightExpression,
							line: operatorToken.line,
							column: operatorToken.column,
							EOL: rightExpression.EOL,
						};
					}

					return binaryExpressionLookAhead(expression, thisPrecedence);
				}
			}

			return leftExpression;
		}

		function parsePrintStatement() {
			var printKeywordToken = consumeNextToken('Keyword', 'print');
			var args = parseExpression();

			return {
				type: 'PrintStatement',
				arguments: args,
				line: printKeywordToken.line,
				column: printKeywordToken.column,
				EOL: args.EOL,
			};
		}

		function parseIfStatement() {
			var ifKeywordToken = consumeNextToken('Keyword', 'if');
			var condition = parseExpression();
			consumeNextToken('Punctuator', ':');
			var ifBlock = parseBlock();

			var elifStatements = [];

			while (nextTokenMatches('Keyword', 'elif')) {
				var elifKeywordToken = consumeNextToken('Keyword', 'elif');
				var elifCondition = parseExpression();
				consumeNextToken('Punctuator', ':');
				var elifBlock = parseBlock();

				elifStatements.push({
					type: 'ElifStatement',
					test: elifCondition,
					consequent: elifBlock,
					line: elifKeywordToken.line,
					column: elifKeywordToken.column,
					EOL: true,
				});
			}

			if (elifStatements.length === 0) {
				elifStatements = null;
			}

			if (nextTokenMatches('Keyword', 'else')) {
				consumeNextToken('Keyword', 'else');
				consumeNextToken('Punctuator', ':');
				var elseBlock = parseBlock();
			} else {
				var elseBlock = null;
			}

			return {
				type: 'IfStatement',
				test: condition,
				consequent: ifBlock,
				cases: elifStatements,
				default: elseBlock,
				line: ifKeywordToken.line,
				column: ifKeywordToken.column,
				EOL: true,
			};
		}

		function parseWhileStatement() {
			var whileKeywordToken = consumeNextToken('Keyword', 'while');
			var test = parseExpression();
			consumeNextToken('Punctuator', ':');
			var body = parseBlock();

			return {
				type: 'WhileStatement',
				test: test,
				body: body,
				line: whileKeywordToken.line,
				column: whileKeywordToken.column,
				EOL: true,
			};
		}

		function parseForStatement() {
			var forKeywordToken = consumeNextToken('Keyword', 'for');
			var identifier = consumeNextToken('Identifier');
			consumeNextToken('Keyword', 'in');
			var rightExpression = parseExpression();
			consumeNextToken('Punctuator', ':');
			var body = parseBlock();

			return {
				type: 'ForStatement',
				left: identifier,
				right: rightExpression,
				body: body,
				line: forKeywordToken.line,
				column: forKeywordToken.column,
				EOL: true,
			};
		}

		function parseBlock() {
			var expressions = [];
			consumeNextToken('Indent');

			while (!nextTokenMatches('Dedent')) {
				expressions.push(parseExpression());

				if (!lexer.EOF() && expressions[expressions.length - 1].EOL !== true) {
					// catch unexpected closure of block
					throw new CustomError({
						type: 'SyntaxError',
						message: 'Expected a newline',
						from: {
							line: expressions[expressions.length - 1].line + 1,
						},
					});
				}
			}

			consumeNextToken('Dedent');

			return expressions;
		}

		function parseExpression() {
			return callExpressionLookAhead(function() {
				return binaryExpressionLookAhead(parseAtomicExpression(), 0);
			});
		}

		function parseProgram() {
			var expressions = [];

			while (!lexer.EOF()) {
				expressions.push(parseExpression());

				if (!lexer.EOF() && expressions[expressions.length - 1].EOL !== true) {
					// catch unexpected closure of block
					throw new CustomError({
						type: 'SyntaxError',
						message: 'Expected a newline',
						from: {
							line: expressions[expressions.length - 1].line + 1,
						},
					});
				}
			}

			return {
				type: 'Program',
				body: expressions
			};
		}

		return {
			parse: function() {
				return parseProgram();
			},
		};
	}

	return Parser;
}(CustomError));
