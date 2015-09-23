// [MiniPy] /src/parser/Parser.js

exports.Parser = (function() {
	var ErrorType = require('../enums').enums.ErrorType;
	var TokenType = require('../enums').enums.TokenType;
	var TokenTypeStrings = require('../enums').enums.TokenTypeStrings;

	function Parser(lexer) {
		var self = this;
		this.lexer = lexer;

		this.symbols = {
			prefixParselets: {},
			infixParselets: {},
		};

		this.nodes = {
			expressions: {
				// wrapper for entire parsed AST
				Program: function(block) {
					this.type = 'Program';
					this.body = block;

					this.error = function(details) {
						return self.lexer.error(details);
					};
				},

				// a syntactically static token (Literal, Identifier, etc.)
				Atom: function(token) {
					if (token.type === TokenType.IDENTIFIER) {
						this.type = 'Identifier';
					} else {
						this.type = 'Literal';
						this.subtype = token.type;
					}

					this.value = token.getValue();

					this.line = token.line;
					this.column = token.column;

					this.error = function(details) {
						return token.error(details);
					};
				},

				Prefix: function(operator, operand) {
					this.type = 'UnaryExpression';
					this.operator = operator;
					this.right = operand;

					this.line = operator.line;
					this.column = operator.column;

					this.error = function(details) {
						switch (details.type) {
							case ErrorType.UNEXPECTED_EOF:
							case ErrorType.EXPECTED_NEWLINE:
								return operand.error(details);
							default:
								return operator.error(details);
						}
					};
				},

				Infix: function(operator, operandLeft, operandRight) {
					this.type = (operator.getValue() === '=' ? 'AssignmentExpression' : 'BinaryExpression');
					this.operator = operator;
					this.left = operandLeft;
					this.right = operandRight;

					this.line = operator.line;
					this.column = operator.column;

					this.error = function(details) {
						switch (details.type) {
							case ErrorType.UNEXPECTED_EOF:
							case ErrorType.EXPECTED_NEWLINE:
								return operandRight.error(details);
							default:
								return operator.error(details);
						}
					};
				},

				Array: function(elements) {
					this.type = 'Literal';
					this.subtype = TokenType.ARRAY;
					this.elements = elements;

					this.error = function(details) {
						return elements[0].error(details);
					};
				},

				// a method call
				Call: function(callee, args, rightParenToken) {
					this.type = 'CallExpression';
					this.callee = callee;
					this.arguments = args;

					this.line = callee.line;
					this.column = callee.column;

					this.error = function(details) {
						switch (details.type) {
							case ErrorType.UNEXPECTED_EOF:
							case ErrorType.EXPECTED_NEWLINE:
								return rightParenToken.error(details);
							default:
								details.from = {
									line: callee.line,
									column: callee.column,
								};

								details.to = {
									line: rightParenToken.line,
									column: rightParenToken.column + 1,
								};

								return callee.error(details);
						}
					};
				},

				// an if/elif/else statement
				If: function(ifKeywordToken, condition, ifBlock, elifBlocks, elseBlock) {
					this.type = 'IfStatement';
					this.condition = condition;
					this.ifBlock = ifBlock;
					this.elifBlocks = elifBlocks;
					this.elseBlock = elseBlock;

					this.line = ifKeywordToken.line;
					this.column = ifKeywordToken.column;

					this.error = function(details) {
						var lastBlock = ifBlock;

						if (elseBlock !== null) {
							lastBlock = elseBlock.block;
						} else if (elifBlocks.length !== null && elifBlocks.length > 0) {
							lastBlock = elifBlocks[elifBlocks.length - 1];
						}

						var lastExpression = lastBlock[lastBlock.length - 1];

						switch (details.type) {
							case ErrorType.UNEXPECTED_EOF:
							case ErrorType.EXPECTED_NEWLINE:
								return lastExpression.error(details);
							default:
								return ifKeywordToken.error(details);
						}
					};
				},

				While: function(whileKeywordToken, condition, block) {
					this.type = 'WhileStatement';
					this.condition = condition;
					this.block = block;

					this.line = whileKeywordToken.line;
					this.column = whileKeywordToken.column;

					this.error = function(details) {
						var lastExpression = block[block.length - 1];

						switch (details.type) {
							case ErrorType.UNEXPECTED_EOF:
							case ErrorType.EXPECTED_NEWLINE:
								return lastExpression.error(details);
							default:
								return whileKeywordToken.error(details);
						}
					};
				},
			},

			parselets: {
				Atom: function() {
					var precedence = 0;

					this.parse = function(parser, token) {
						return new self.nodes.expressions.Atom(token);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				Prefix: function(precedence) {
					this.parse = function(parser, operatorToken) {
						var rightOperand = parser.parseExpression(precedence);

						return new self.nodes.expressions.Prefix(operatorToken, rightOperand);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				Infix: function(precedence) {
					this.parse = function(parser, operatorToken, leftOperand) {
						var rightOperand = parser.parseExpression(precedence);

						return new self.nodes.expressions.Infix(operatorToken, leftOperand, rightOperand);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				// grouping an expression within parentheses creates a Group
				Group: function() {
					var precedence = 80;

					this.parse = function(parser, leftParenToken) {
						var interior = parser.parseExpression();

						self.next(TokenType.PUNCTUATOR, ')');

						return interior;
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				Array: function() {
					var precedence = 80;

					this.parse = function(parser, leftBracketToken) {
						var elements = [];

						while (true) {
							if (self.peek(TokenType.PUNCTUATOR, ']')) {
								// break loop when end bracket encountered
								self.next(TokenType.PUNCTUATOR);
								break;
							}

							elements.push(parser.parseExpression());

							if (self.peek(TokenType.PUNCTUATOR, ',')) {
								self.next(TokenType.PUNCTUATOR, ',');
							} else if (self.peek(TokenType.PUNCTUATOR, ']')) {
								self.next(TokenType.PUNCTUATOR);
								break;
							}
						}

						return new self.nodes.expressions.Array(elements);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				Call: function() {
					var precedence = 80;

					this.parse = function(parser, leftParenToken, calleeExpression) {
						var args = [];

						while (self.peek(TokenType.PUNCTUATOR, ')') === null) {
							var arg = parser.parseExpression();
							args.push(arg);

							if (self.peek(TokenType.PUNCTUATOR, ',') === null) {
								break;
							} else {
								self.next(TokenType.PUNCTUATOR, ',');
							}
						}

						var rightParenToken = self.next(TokenType.PUNCTUATOR, ')');

						return new self.nodes.expressions.Call(calleeExpression, args, rightParenToken);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				If: function() {
					var precedence = 100;

					this.parse = function(parser, ifKeywordToken) {
						var condition = self.parseExpression();

						self.next(TokenType.PUNCTUATOR, ':');
						self.next(TokenType.NEWLINE);

						var ifBlock = self.parseBlock();

						// collect the `elif` blocks (if they exist)
						var elifStatements = [];

						while (self.peek(TokenType.KEYWORD, 'elif') !== null) {
							var elifKeywordToken = self.next(TokenType.KEYWORD, 'elif');
							var elifCondition = self.parseExpression();

							self.next(TokenType.PUNCTUATOR, ':');
							self.next(TokenType.NEWLINE);

							var elifBlock = self.parseBlock();

							elifStatements.push({
								type: 'ElifStatement',
								condition: elifCondition,
								block: elifBlock,

								line: elifKeywordToken.line,
								column: elifKeywordToken.column,
							});
						}

						if (elifStatements.length === 0) {
							elifStatements = null;
						}

						// collect the `else` block (if it exists)
						var elseBlock = null;

						if (self.peek(TokenType.KEYWORD, 'else') !== null) {
							var elseKeywordToken = self.next(TokenType.KEYWORD, 'else');

							self.next(TokenType.PUNCTUATOR, ':');
							self.next(TokenType.NEWLINE);

							elseBlock = {
								type: 'ElseStatement',
								block: self.parseBlock(),

								line: elseKeywordToken.line,
								column: elseKeywordToken.column,
							};

							// TODO: bundle elseKeywordToken line/column data with IfStatement
						}

						return new self.nodes.expressions.If(ifKeywordToken, condition, ifBlock, elifStatements, elseBlock);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				While: function() {
					var precedence = 100;

					this.parse = function(parser, whileKeywordToken) {
						var condition = self.parseExpression();

						self.next(TokenType.PUNCTUATOR, ':');
						self.next(TokenType.NEWLINE);

						var block = self.parseBlock();

						return new self.nodes.expressions.While(whileKeywordToken, condition, block);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},
			}
		};


		//
		// GRAMMAR DESCRIPTION
		//

		// streamlines construction of prefix rules
		function prefix(symbol) {
			if (typeof arguments[1] === 'number') {
				var parselet = new self.nodes.parselets.Prefix(arguments[1]);
			} else {
				var parselet = arguments[1];
			}

			self.register('prefix', symbol, parselet);
		}

		// streamlines construction of infix rules
		function infix(symbol) {
			if (typeof arguments[1] === 'number') {
				var parselet = new self.nodes.parselets.Infix(arguments[1]);
			} else {
				var parselet = arguments[1];
			}

			self.register('infix', symbol, parselet);
		}

		prefix('Atom', new self.nodes.parselets.Atom());
		prefix('(', new self.nodes.parselets.Group());
		prefix('[', new self.nodes.parselets.Array());

		infix('=', 10);

		infix('and', 30);
		infix('or', 30);

		infix('>', 30);
		infix('>=', 30);
		infix('<', 30);
		infix('<=', 30);
		infix('==', 30);
		infix('!=', 30);

		infix('+', 50);
		infix('-', 50);
		infix('*', 60);
		infix('/', 60);
		infix('%', 60);

		infix('**', 80);

		prefix('+', 70);
		prefix('-', 70);
		prefix('not', 70);
		prefix('!', 70);

		infix('(', new self.nodes.parselets.Call());

		prefix('if', new self.nodes.parselets.If());
		prefix('while', new self.nodes.parselets.While());
	}

	// given optional matching requirements, return next token
	// without advancing the lexer
	Parser.prototype.peek = function(type, value) {
		var p = this.lexer.peek();

		if (type === undefined) {
			// no matching arguments, return any token
			return p;
		} else if (p === null) {
			// lexer has been exhausted
			return null;
		} else {
			if (p.type === type) {
				if (value === undefined) {
					// token matches type, no value given
					return p;
				} else if (p.getValue() === value) {
					// token maches type and value
					return p;
				} else {
					// token matches type but not value
					return null;
				}
			} else {
				// token doesn't match type
				return null;
			}
		}
	};

	// given optional matching requirements, return next token
	// AND advance the lexer
	// 
	// if given matching requirements are not met, throw an error
	Parser.prototype.next = function(type, value) {
		var next = this.lexer.next();

		if (type === undefined) {
			// no matching arguments, return any token
			return next;
		} else {
			if (next !== null && next.type === type) {
				if (value === undefined) {
					// token matches type, no value given
					return next;
				} else if (next.getValue() === value) {
					// token maches type and value
					return next;
				}
			}

			// token doesn't match type or value
			if (next.type === TokenType.EOF || next === null) {
				var curr = this.lexer.curr();
				throw curr.error({
					type: ErrorType.UNEXPECTED_EOF,
					message: 'Unexpected end of file. Expected ' + value.toUpperCase(),
				});
			} else {
				var curr = this.lexer.curr();
				throw curr.error({
					type: ErrorType.UNEXPECTED_TOKEN,
					message: 'Unexpected ' + TokenTypeStrings[curr.type] + '. Expected ' + value.toUpperCase(),
				});
			}
		}
	};

	// maps symbols to their appropriate parselet functions in either the
	// infix or prefix symbol tables
	Parser.prototype.register = function(fixationType, symbol, parselet) {
		if (fixationType === 'prefix') {
			this.symbols.prefixParselets[symbol] = parselet;
		} else if (fixationType === 'infix') {
			this.symbols.infixParselets[symbol] = parselet;
		}
	};

	Parser.prototype.getPrecedence = function() {
		if (this.peek() !== null) {
			var parser = this.symbols.infixParselets[this.getTokenSymbol(this.peek())];

			if (parser !== undefined) {
				return parser.getPrecedence();
			}
		}

		return 0;
	};

	// make it easier to reason about the binding powers of tokens by grouping
	// Numeric, Boolean, String, Keyword, Identifer tokens under the "Atom" umbrella
	// and differentiating Punctuator tokens by their individual values
	Parser.prototype.getTokenSymbol = function(token) {
		if (token.type === TokenType.PUNCTUATOR || token.type === TokenType.KEYWORD) {
			return token.getValue();
		} else {
			return 'Atom';
		}
	};

	// parse next expression
	Parser.prototype.parseExpression = function(precedence) {
		precedence = precedence || 0;

		if (this.peek(TokenType.EOF)) {
			// expression was abruptly ended by EOF
			throw token.error({
				type: ErrorType.UNEXPECTED_EOF,
				message: 'Unexpected end of program',
			});
		}

		var token = this.next();
		var prefix = this.symbols.prefixParselets[this.getTokenSymbol(token)];

		if (prefix === undefined) {
			// no prefix syntax registered with `token`'s symbol
			throw token.error({
				type: ErrorType.UNEXPECTED_TOKEN,
				message: 'Unexpected ' + TokenTypeStrings[token.type] + ' with value "' + token.getValue() + '"',
			});
		}

		var left = prefix.parse(this, token);

		// left-associate expressions based on their relative precedence
		while (precedence < this.getPrecedence()) {
			token = this.next(TokenType.PUNCTUATOR);

			var infix = this.symbols.infixParselets[this.getTokenSymbol(token)];
			left = infix.parse(this, token, left);
		}

		return left;
	};

	// parse lists of single-line expressions preceeded by an Indent token and
	// followed by a Dedent token
	Parser.prototype.parseBlock = function() {
		this.next(TokenType.INDENT);

		var body = [];

		while (true) {
			var latest = this.parseExpression();
			body.push(latest);

			// look for end-of-line token after expression
			if (this.peek(TokenType.NEWLINE)) {
				this.next(TokenType.NEWLINE);

				if (this.peek(TokenType.DEDENT)) {
					this.next(TokenType.DEDENT);
					break;
				} else {
					continue;
				}
			} else if (this.peek(TokenType.DEDENT)) {
				this.next(TokenType.DEDENT);
				break;
			} else if (this.peek(TokenType.INDENT) || this.peek(TokenType.EOF) || this.peek() === null) {
				var next = this.next();
				throw next.error({
					type: ErrorType.UNEXPECTED_TOKEN,
					message: 'Expected end of indentation',
				});
			}
		}

		return body;
	};

	Parser.prototype.parseProgram = function() {
		var body = [];

		// consume first newline if it exists
		if (this.peek(TokenType.NEWLINE)) {
			this.next(TokenType.NEWLINE);
		}

		// run until loop is broken of encounters EOF/null token. this
		// condition is largely for semantically empty programs which
		// may only have a Newline token followed by an EOF token
		while (this.peek(TokenType.EOF) === null && this.peek() !== null) {
			var latest = this.parseExpression();
			body.push(latest);

			if (this.lexer.curr().type === TokenType.DEDENT) {
				if (this.peek(TokenType.EOF)) {
					break;
				} else {
					continue;
				}
			} else if (this.peek(TokenType.NEWLINE)) {
				// expression followed by a Newline token
				this.next(TokenType.NEWLINE);

				if (this.peek(TokenType.EOF)) {
					// Newline token followed by an EOF token
					break;
				}
			} else if (this.peek(TokenType.EOF)) {
				// expression followed by an EOF token
				break;
			} else {
				// expression followed by an illegal token
				var next = this.next();

				if (next !== null) {
					throw next.error({
						type: ErrorType.UNEXPECTED_TOKEN,
						message: 'Expected the end of the program',
					});
				} else {
					throw latest.error({
						type: ErrorType.UNEXPECTED_EOF,
						message: 'Expression was followed by an unexpected end of the program',
					});
				}
			}
		}

		this.next(TokenType.EOF);

		return new this.nodes.expressions.Program(body);
	};

	// hide implementation methods, only expose `parse` command
	return function(lexer) {
		this.parse = function(rawJSON) {
			var ast = (new Parser(lexer)).parseProgram();

			if (rawJSON === true) {
				return JSON.parse(JSON.stringify(ast));
			} else {
				return ast;
			}
		};
	};
}());
