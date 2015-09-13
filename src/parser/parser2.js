// [MiniPy] /src/parser/Parser2.js

var Parser = (function() {
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
					if (token.type === 'Identifier') {
						this.type = 'Identifier';
					} else {
						this.type = 'Literal';
						this.subtype = token.type;
					}

					this.value = token.value;

					this.line = token.line;
					this.column = token.column;
					this.EOL = token.EOL || false;
				},

				Prefix: function(operator, operand) {
					this.type = 'UnaryExpression';
					this.operator = operator.value;
					this.right = operand;

					this.line = operator.line;
					this.column = operator.column;
					this.EOL = operand.EOL || false;
				},

				Infix: function(operator, operandLeft, operandRight) {
					this.type = (operator.value === '=' ? 'AssignmentExpression' : 'BinaryExpression');
					this.operator = operator.value;
					this.left = operandLeft;
					this.right = operandRight;

					this.line = operator.line;
					this.column = operator.column;
					this.EOL = operandRight.EOL || false;
				},

				// a method call
				Call: function(callee, args, EOL) {
					this.type = 'CallExpression';
					this.callee = callee;
					this.arguments = args;

					this.line = callee.line;
					this.column = callee.column;
					this.EOL = EOL || false;
				},

				// an if/elif/else statement
				If: function(ifKeywordToken, condition, ifBlock, elifBlocks, elseBlock) {
					this.type = 'IfStatement';
					this.condition = condition;
					this.ifBlock = ifBlock;
					this.elifBlocks = elifBlocks;
					this.elsBlock = elseBlock;

					this.line = ifKeywordToken.line;
					this.column = ifKeywordToken.column;
					this.EOL = true;
				},

				While: function(whileKeywordToken, condition, block) {
					this.type = 'WhileStatement';
					this.condition = condition;
					this.block = block;

					this.line = whileKeywordToken.line;
					this.column = whileKeywordToken.column;
					this.EOL = true;
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
						var rightOperand = parser.parseExpression();

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

						self.next('Punctuator', ')');

						return interior;
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				Call: function() {
					var precedence = 80;

					this.parse = function(parser, leftParenToken, calleeExpression) {
						var args = [];

						while (self.peek('Punctuator', ')') === null) {
							args.push(parser.parseExpression());

							if (self.peek('Punctuator', ',') === null) {
								break;
							} else {
								self.next('Punctuator', ',');
							}
						}

						var rightParenToken = self.next('Punctuator', ')');

						return new self.nodes.expressions.Call(calleeExpression, args, rightParenToken.EOL);
					};

					this.getPrecedence = function() {
						return precedence;
					};
				},

				If: function() {
					var precedence = 100;

					this.parse = function(parser, ifKeywordToken) {
						var condition = self.parseExpression();
						self.next('Punctuator', ':');
						var ifBlock = self.parseBlock();

						// collect the `elif` blocks (if they exist)
						var elifStatements = [];

						while (self.peek('Keyword', 'elif') !== null) {
							var elifKeywordToken = self.next('Keyword', 'elif');
							var elifCondition = self.parseExpression();
							self.next('Punctuator', ':');
							var elifBlock = self.parseBlock();

							elifStatements.push({
								type: 'ElifStatement',
								condition: elifCondition,
								block: elifBlock,

								line: elifKeywordToken.line,
								column: elifKeywordToken.column,
								EOL: true,
							});
						}

						if (elifStatements.length === 0) {
							elifStatements = null;
						}

						// collect the `else` block (if it exists)
						var elseBlock = null;

						if (self.peek('Keyword', 'else') !== null) {
							var elseKeywordToken = self.next('Keyword', 'else');
							self.next('Punctuator', ':');
							elseBlock = self.parseBlock();
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
						self.next('Punctuator', ':');
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

		infix('=', 10);

		infix('&&', 30);
		infix('||', 30);

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

		infix('**', 80);

		prefix('+', 70);
		prefix('-', 70);
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
				} else if (p.value === value) {
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
				} else if (next.value === value) {
					// token maches type and value
					return next;
				}
			}

			// token doesn't match type or value
			if (next === null) {
				var lastToken = this.lexer.peek(-1);

				throw this.lexer.error({
					type: 'SyntaxError',
					message: 'Unexpected end of file. Expected "' + (value || type) + '"',
					from: {
						line: lastToken.line,
					},
					to: {
						line: lastToken.line,
					},
				});
			} else {
				throw this.lexer.error({
					type: 'SyntaxError',
					message: 'Unexpected "' + (next.value || next.type) + '". Expected: "' + (value || type) + '"',
					from: {
						line: next.line,
						column: next.column,
					},
					to: {
						line: next.line,
						column: next.column + next.value.length,
					},
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
		if (token.type === 'Punctuator' || token.type === 'Keyword') {
			return token.value;
		} else {
			return 'Atom';
		}
	};

	// parse next expression
	Parser.prototype.parseExpression = function(precedence) {
		precedence = precedence || 0;

		var token = this.next();

		if (token === null) {
			// expression was abruptly ended by EOF
			var lastToken = this.lexer.peek(-1);

			throw this.lexer.error({
				type: 'SyntaxError',
				message: 'Unexpected end of file',
				from: {
					line: lastToken.line,
				},
				to: {
					line: lastToken.line,
				},
			});
		}

		var prefix = this.symbols.prefixParselets[this.getTokenSymbol(token)];

		if (prefix === undefined) {
			// no prefix syntax registered with `token`'s symbol
			throw this.lexer.error({
				type: 'SyntaxError',
				message: 'Unknown symbol "' + token.value + '"',
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

		var left = prefix.parse(this, token);

		// left-associate expressions based on their relative precedence
		while (precedence < this.getPrecedence()) {
			token = this.next('Punctuator');

			var infix = this.symbols.infixParselets[this.getTokenSymbol(token)];
			left = infix.parse(this, token, left);
		}

		return left;
	};

	// parse lists of single-line expressions preceeded by an Indent token and
	// followed by a Dedent token
	Parser.prototype.parseBlock = function() {
		this.next('Indent');

		var body = [];

		while (this.peek('Dedent') === null) {
			var latest = this.parseExpression();
			body.push(latest);

			if (latest.EOL === false) {
				throw this.lexer.error({
					type: 'SyntaxError',
					message: 'Expected newline after expression',
					from: {
						line: latest.line,
					},
					to: {
						line: latest.line,
					},
				});
			}
		}

		this.next('Dedent');

		return body;
	};

	Parser.prototype.parseProgram = function() {
		var body = [];

		while (this.lexer.EOF() === false) {
			var latest = this.parseExpression();
			body.push(latest);

			if (this.lexer.EOF() === true && latest.EOL === false) {
				throw this.lexer.error({
					type: 'SyntaxError',
					message: 'Expected newline after expression',
					from: {
						line: latest.line,
					},
					to: {
						line: latest.line,
					},
				});
			}
		}

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
