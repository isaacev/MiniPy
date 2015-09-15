var MiniPy = function (main) {
        var MiniPyError = function () {
        var spacesPerTabs = 4;
        function mul(c, n) {
            for (var o = ''; n > 0; n--) {
                o = o + c;
            }
            return o;
        }
        function printOffense(source, lineNumber, column, width) {
            var lines = source.split('\n');
            if (lineNumber < 0) {
                var offendingSourceLine = lines[0];
            } else if (lineNumber >= lines.length) {
                var offendingSourceLine = lines[lines.length - 1];
            } else {
                var offendingSourceLine = lines[lineNumber];
            }
            var totalTabsBefore = (offendingSourceLine.substring(0, column).match(/\t/g) || []).length;
            var spacedOffendingLine = offendingSourceLine.replace(/\t/g, mul(' ', spacesPerTabs));
            var spacedColumn = column + (spacesPerTabs - 1) * totalTabsBefore;
            var totalPadding = spacedColumn;
            var padding = mul('-', totalPadding);
            var underline = mul('^', width || 1);
            return spacedOffendingLine + '\n' + (padding + underline);
        }
        function MiniPyError(source, details) {
            this.type = details.type || 'Unknown Error';
            this.message = details.message || '';
            this.from = details.from || undefined;
            this.to = details.to || undefined;
        }
        MiniPyError.prototype.toString = function () {
            var pos = '';
            if (this.range.length > 0) {
                if (typeof this.range[0].line === 'number') {
                    pos += ' (line ' + (this.range[0].line + 1);
                }
                if (typeof this.range[0].column === 'number') {
                    pos += ', column ' + (this.range[0].column + 1) + ')';
                } else {
                    pos += ')';
                }
            }
            return this.type + ' ' + this.message + pos;
        };
        return MiniPyError;
    }();
        var Scanner = function (MiniPyError) {
        function Scanner(input) {
            this.line = 0;
            this.column = 0;
            this.nextIndex = 0;
            this.input = input;
        }
        Scanner.prototype.peek = function () {
            if (this.nextIndex < this.input.length) {
                var peekChar = this.input[this.nextIndex];
                return peekChar;
            } else {
                return null;
            }
        };
        Scanner.prototype.next = function () {
            if (this.nextIndex < this.input.length) {
                var nextChar = this.input[this.nextIndex];
                this.nextIndex++;
                if (nextChar === '\n') {
                    this.line++;
                    this.column = 0;
                } else {
                    this.column++;
                }
                return nextChar;
            } else {
                return null;
            }
        };
        Scanner.prototype.EOF = function () {
            return this.nextIndex >= this.input.length;
        };
        Scanner.prototype.error = function (details) {
            return new MiniPyError(this.input, details);
        };
        return Scanner;
    }(MiniPyError);
        var Token = function () {
        function Token(lexer, type, value, line, column, eol) {
            this.lexer = lexer;
            this.type = type;
            switch (type) {
            case 'Numeric':
                this.raw = value;
                this.value = parseFloat(value);
                if (isNaN(this.value)) {
                    throw this.error({
                        type: ErrorType.MALFORMED_NUMBER,
                        message: 'Could not parse number'
                    });
                }
                break;
            case 'Boolean':
                this.raw = value;
                this.value = value === 'True';
                break;
            case 'String':
                this.raw = '"' + value + '"';
                this.value = value;
                break;
            default:
                this.value = value;
            }
            this.line = line;
            this.column = column;
            this.EOL = eol === true ? true : false;
        }
        Token.prototype.getValue = function () {
            if (this.value !== null) {
                return this.value;
            } else {
                return this.type;
            }
        };
        Token.prototype.getLength = function () {
            if (this.raw != undefined) {
                return this.raw.length;
            } else {
                if (this.value != undefined) {
                    return this.value.length;
                } else {
                    return 0;
                }
            }
        };
        Token.prototype.error = function (details) {
            return this.lexer.error({
                type: details.type,
                message: details.message,
                from: details.from || {
                    line: this.line,
                    column: this.column
                },
                to: details.to || {
                    line: this.line,
                    column: this.column + this.getLength()
                }
            });
        };
        return Token;
    }();
        var Lexer = function (Token) {
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
                'raise',
                'return',
                'try',
                'while',
                'with',
                'yield'
            ];
            var keywordOperators = [
                'and',
                'is',
                'not',
                'or'
            ];
            var indentationStack = [0];
            var buffer = [];
            function isKeywordOperator(test) {
                return keywordOperators.indexOf(test) >= 0;
            }
            function isKeyword(test) {
                return keywords.indexOf(test) >= 0;
            }
            function isNewline(test) {
                return '\n' === test;
            }
            function isEOL() {
                if (scanner.peek() === '\n' || scanner.EOF()) {
                    return true;
                } else {
                    return false;
                }
            }
            function isAlpha(test) {
                return (test >= 'a' && test <= 'z' || test >= 'A' && test <= 'Z') && test !== null;
            }
            function isNumeric(test) {
                return test >= '0' && test <= '9' && test !== null;
            }
            function isBooleanLiteral(test) {
                return test === 'True' || test === 'False';
            }
            function contains(str, test) {
                return str.indexOf(test) >= 0;
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
                        if (p === '\n') {
                            var indentation = '';
                            scanner.next();
                            var line = scanner.line;
                            var column = scanner.column;
                            while ((p = scanner.peek()) === '\t') {
                                indentation += scanner.next();
                            }
                            if (scanner.peek() > ' ') {
                                if (indentation.length > indentationStack[0]) {
                                    indentationStack.unshift(indentation.length);
                                    buffer.push(new Token(self, 'Indent', null, line, column));
                                } else if (indentation.length < indentationStack[0]) {
                                    indentationStack.shift();
                                    buffer.push(new Token(self, 'Dedent', null, line, column));
                                }
                            } else if (scanner.EOF() && indentationStack.length > 1) {
                                while (indentationStack.length > 1) {
                                    indentationStack.shift();
                                    buffer.push(new Token(self, 'Dedent', null, line, column));
                                }
                            }
                            return readNext();
                        } else {
                            scanner.next();
                            return readNext();
                        }
                    } else if (p === '#') {
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
                            return new Token(self, type, value, line, column, isEOL());
                        } else if (isNumeric(p)) {
                            var type = 'Numeric';
                            var line = scanner.line;
                            var column = scanner.column;
                            var value = scanner.next();
                            while (p = scanner.peek()) {
                                if (!isNumeric(p)) {
                                    break;
                                } else {
                                    value += scanner.next();
                                }
                            }
                            if (p === '.') {
                                value += scanner.next();
                                while (true) {
                                    p = scanner.peek();
                                    if (!isNumeric(p)) {
                                        break;
                                    } else {
                                        value += scanner.next();
                                    }
                                }
                            }
                            if (p === 'e' || p === 'E') {
                                value += scanner.next();
                                p = scanner.peek();
                                if (p === '-' || p === '+') {
                                    value += scanner.next();
                                    p = scanner.peek();
                                }
                                if (!isNumeric(p)) {
                                    throw scanner.error({
                                        type: ErrorType.EXPECTED_DIGIT,
                                        message: 'Incorrect exponent syntax, expected a digit',
                                        from: {
                                            line: scanner.line,
                                            column: scanner.column
                                        },
                                        to: {
                                            line: scanner.line,
                                            column: scanner.column + 1
                                        }
                                    });
                                }
                                do {
                                    value += scanner.next();
                                    p = scanner.peek();
                                } while (isNumeric(p));
                            }
                            if (isAlpha(p)) {
                                throw scanner.error({
                                    type: ErrorType.EXPECTED_DIGIT,
                                    message: 'Expected a digit',
                                    from: {
                                        line: scanner.line,
                                        column: scanner.column
                                    },
                                    to: {
                                        line: scanner.line,
                                        column: scanner.column + 1
                                    }
                                });
                            }
                            return new Token(self, type, value, line, column, isEOL());
                        } else if (p === '"' || p === '\'') {
                            var type = 'String';
                            var line = scanner.line;
                            var column = scanner.column;
                            var quoteType = scanner.next();
                            var value = '';
                            while (true) {
                                p = scanner.peek();
                                if (p === null) {
                                    throw scanner.error({
                                        type: ErrorType.UNTERMINATED_STRING,
                                        message: 'Unterminated string, expecting a matching end quote instead got end of program',
                                        from: {
                                            line: line,
                                            column: column
                                        },
                                        to: {
                                            line: scanner.line,
                                            column: scanner.column + 1
                                        }
                                    });
                                } else if (p < ' ') {
                                    if (p === '\n' || p === '\r' || p === '') {
                                        scanner.next();
                                        throw scanner.error({
                                            type: ErrorType.UNTERMINATED_STRING,
                                            message: 'Unterminated string, expecting a matching end quote',
                                            from: {
                                                line: line,
                                                column: column
                                            },
                                            to: {
                                                line: scanner.line,
                                                column: scanner.column
                                            }
                                        });
                                    } else {
                                        throw scanner.error({
                                            type: ErrorType.UNEXPECTED_CHAR,
                                            message: 'Control character in string',
                                            from: {
                                                line: scanner.line,
                                                column: scanner.column
                                            },
                                            to: {
                                                line: scanner.line,
                                                column: scanner.column + 1
                                            }
                                        });
                                    }
                                } else if (p === quoteType) {
                                    scanner.next();
                                    break;
                                } else if (p === '\\') {
                                    value += scanner.next();
                                    switch (scanner.next()) {
                                    case '\n':
                                        break;
                                    case '\\':
                                        value += '\\';
                                        break;
                                    case '\'':
                                        value += '\'';
                                        break;
                                    case '"':
                                        value += '"';
                                        break;
                                    case 'a':
                                        value += 'a';
                                        break;
                                    case 'b':
                                        value += '\b';
                                        break;
                                    case 'f':
                                        value += '\f';
                                        break;
                                    case 'n':
                                        value += '\n';
                                        break;
                                    case 'r':
                                        value += '\r';
                                        break;
                                    case 't':
                                        value += '\t';
                                        break;
                                    }
                                } else {
                                    value += scanner.next();
                                }
                            }
                            return new Token(self, type, value, line, column, isEOL());
                        } else if (contains(prefixOperatorCharacters, p) || contains(punctuationCharacters, p)) {
                            var type = 'Punctuator';
                            var line = scanner.line;
                            var column = scanner.column;
                            var value = scanner.next();
                            if (contains(prefixOperatorCharacters, value) && contains(suffixOperatorCharacters, scanner.peek())) {
                                value += scanner.next();
                            }
                            return new Token(self, type, value, line, column, isEOL());
                        }
                    }
                    throw scanner.error({
                        type: ErrorType.UNEXPECTED_CHAR,
                        message: 'Unexpected character',
                        from: {
                            line: scanner.line,
                            column: scanner.column
                        },
                        to: {
                            line: scanner.line,
                            column: scanner.column + 1
                        }
                    });
                }
            }
            var history = [];
            this.peek = function (backset) {
                if (typeof backset === 'number' && backset < 1) {
                    return history[history.length + backset] || null;
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
            };
            this.next = function () {
                var next = readNext();
                if (next !== null) {
                    history.push(next);
                }
                return next;
            };
            this.EOF = function () {
                return scanner.EOF() && buffer.length === 0;
            };
            this.error = function (details) {
                return scanner.error(details);
            };
        }
        return Lexer;
    }(Token);
        var Parser = function () {
        function Parser(lexer) {
            var self = this;
            this.lexer = lexer;
            this.symbols = {
                prefixParselets: {},
                infixParselets: {}
            };
            this.nodes = {
                expressions: {
                    Program: function (block) {
                        this.type = 'Program';
                        this.body = block;
                        this.error = function (details) {
                            return self.lexer.error(details);
                        };
                    },
                    Atom: function (token) {
                        if (token.type === 'Identifier') {
                            this.type = 'Identifier';
                        } else {
                            this.type = 'Literal';
                            this.subtype = token.type;
                        }
                        this.value = token.getValue();
                        this.line = token.line;
                        this.column = token.column;
                        this.EOL = token.EOL || false;
                        this.error = function (details) {
                            return token.error(details);
                        };
                    },
                    Prefix: function (operator, operand) {
                        this.type = 'UnaryExpression';
                        this.operator = operator;
                        this.right = operand;
                        this.line = operator.line;
                        this.column = operator.column;
                        this.EOL = operand.EOL || false;
                        this.error = function (details) {
                            switch (details.type) {
                            case ErrorType.UNEXPECTED_EOF:
                            case ErrorType.EXPECTED_NEWLINE:
                                return operand.error(details);
                            default:
                                return operator.error(details);
                            }
                        };
                    },
                    Infix: function (operator, operandLeft, operandRight) {
                        this.type = operator.getValue() === '=' ? 'AssignmentExpression' : 'BinaryExpression';
                        this.operator = operator;
                        this.left = operandLeft;
                        this.right = operandRight;
                        this.line = operator.line;
                        this.column = operator.column;
                        this.EOL = operandRight.EOL || false;
                        this.error = function (details) {
                            switch (details.type) {
                            case ErrorType.UNEXPECTED_EOF:
                            case ErrorType.EXPECTED_NEWLINE:
                                return operandRight.error(details);
                            default:
                                return operator.error(details);
                            }
                        };
                    },
                    Call: function (callee, args, rightParenToken) {
                        this.type = 'CallExpression';
                        this.callee = callee;
                        this.arguments = args;
                        this.line = callee.line;
                        this.column = callee.column;
                        this.EOL = rightParenToken.EOL;
                        this.error = function (details) {
                            switch (details.type) {
                            case ErrorType.UNEXPECTED_EOF:
                            case ErrorType.EXPECTED_NEWLINE:
                                return rightParenToken.error(details);
                            default:
                                details.from = {
                                    line: callee.line,
                                    column: callee.column
                                };
                                details.to = {
                                    line: rightParenToken.line,
                                    column: rightParenToken.column + 1
                                };
                                return callee.error(details);
                            }
                        };
                    },
                    If: function (ifKeywordToken, condition, ifBlock, elifBlocks, elseBlock) {
                        this.type = 'IfStatement';
                        this.condition = condition;
                        this.ifBlock = ifBlock;
                        this.elifBlocks = elifBlocks;
                        this.elseBlock = elseBlock;
                        this.line = ifKeywordToken.line;
                        this.column = ifKeywordToken.column;
                        this.EOL = true;
                        this.error = function (details) {
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
                    While: function (whileKeywordToken, condition, block) {
                        this.type = 'WhileStatement';
                        this.condition = condition;
                        this.block = block;
                        this.line = whileKeywordToken.line;
                        this.column = whileKeywordToken.column;
                        this.EOL = true;
                        this.error = function (details) {
                            var lastExpression = block[block.length - 1];
                            switch (details.type) {
                            case ErrorType.UNEXPECTED_EOF:
                            case ErrorType.EXPECTED_NEWLINE:
                                return lastExpression.error(details);
                            default:
                                return whileKeywordToken.error(details);
                            }
                        };
                    }
                },
                parselets: {
                    Atom: function () {
                        var precedence = 0;
                        this.parse = function (parser, token) {
                            return new self.nodes.expressions.Atom(token);
                        };
                        this.getPrecedence = function () {
                            return precedence;
                        };
                    },
                    Prefix: function (precedence) {
                        this.parse = function (parser, operatorToken) {
                            var rightOperand = parser.parseExpression(precedence);
                            return new self.nodes.expressions.Prefix(operatorToken, rightOperand);
                        };
                        this.getPrecedence = function () {
                            return precedence;
                        };
                    },
                    Infix: function (precedence) {
                        this.parse = function (parser, operatorToken, leftOperand) {
                            var rightOperand = parser.parseExpression(precedence);
                            if (operatorToken.EOL === true) {
                                throw operatorToken.error({
                                    type: ErrorType.UNEXPECTED_CHAR,
                                    message: 'Right operand must be on the same line'
                                });
                            } else if (operatorToken.value === '=') {
                                if (leftOperand.type !== 'Identifier') {
                                    throw leftOperand.error({
                                        type: ErrorType.UNEXPECTED_TOKEN,
                                        message: 'Left operand must be an identifier'
                                    });
                                }
                            }
                            return new self.nodes.expressions.Infix(operatorToken, leftOperand, rightOperand);
                        };
                        this.getPrecedence = function () {
                            return precedence;
                        };
                    },
                    Group: function () {
                        var precedence = 80;
                        this.parse = function (parser, leftParenToken) {
                            var interior = parser.parseExpression();
                            self.next('Punctuator', ')');
                            return interior;
                        };
                        this.getPrecedence = function () {
                            return precedence;
                        };
                    },
                    Call: function () {
                        var precedence = 80;
                        this.parse = function (parser, leftParenToken, calleeExpression) {
                            var args = [];
                            while (self.peek('Punctuator', ')') === null) {
                                var arg = parser.parseExpression();
                                if (arg.EOL === true) {
                                    throw arg.error({
                                        type: ErrorType.UNEXPECTED_CHAR,
                                        message: 'Expected ")" after argument'
                                    });
                                }
                                args.push(arg);
                                if (self.peek('Punctuator', ',') === null) {
                                    break;
                                } else {
                                    self.next('Punctuator', ',');
                                }
                            }
                            var rightParenToken = self.next('Punctuator', ')');
                            return new self.nodes.expressions.Call(calleeExpression, args, rightParenToken);
                        };
                        this.getPrecedence = function () {
                            return precedence;
                        };
                    },
                    If: function () {
                        var precedence = 100;
                        this.parse = function (parser, ifKeywordToken) {
                            var condition = self.parseExpression();
                            self.next('Punctuator', ':');
                            var ifBlock = self.parseBlock();
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
                                    EOL: true
                                });
                            }
                            if (elifStatements.length === 0) {
                                elifStatements = null;
                            }
                            var elseBlock = null;
                            if (self.peek('Keyword', 'else') !== null) {
                                var elseKeywordToken = self.next('Keyword', 'else');
                                self.next('Punctuator', ':');
                                elseBlock = {
                                    type: 'ElseStatement',
                                    block: self.parseBlock(),
                                    line: elseKeywordToken.line,
                                    column: elseKeywordToken.column,
                                    EOL: true
                                };
                            }
                            return new self.nodes.expressions.If(ifKeywordToken, condition, ifBlock, elifStatements, elseBlock);
                        };
                        this.getPrecedence = function () {
                            return precedence;
                        };
                    },
                    While: function () {
                        var precedence = 100;
                        this.parse = function (parser, whileKeywordToken) {
                            var condition = self.parseExpression();
                            self.next('Punctuator', ':');
                            var block = self.parseBlock();
                            return new self.nodes.expressions.While(whileKeywordToken, condition, block);
                        };
                        this.getPrecedence = function () {
                            return precedence;
                        };
                    }
                }
            };
            function prefix(symbol) {
                if (typeof arguments[1] === 'number') {
                    var parselet = new self.nodes.parselets.Prefix(arguments[1]);
                } else {
                    var parselet = arguments[1];
                }
                self.register('prefix', symbol, parselet);
            }
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
            infix('**', 80);
            prefix('+', 70);
            prefix('-', 70);
            prefix('not', 70);
            prefix('!', 70);
            infix('(', new self.nodes.parselets.Call());
            prefix('if', new self.nodes.parselets.If());
            prefix('while', new self.nodes.parselets.While());
        }
        Parser.prototype.peek = function (type, value) {
            var p = this.lexer.peek();
            if (type === undefined) {
                return p;
            } else if (p === null) {
                return null;
            } else {
                if (p.type === type) {
                    if (value === undefined) {
                        return p;
                    } else if (p.getValue() === value) {
                        return p;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            }
        };
        Parser.prototype.next = function (type, value) {
            var next = this.lexer.next();
            if (type === undefined) {
                return next;
            } else {
                if (next !== null && next.type === type) {
                    if (value === undefined) {
                        return next;
                    } else if (next.getValue() === value) {
                        return next;
                    }
                }
                if (next === null) {
                    var lastToken = this.lexer.peek(-1);
                    var expectation = '"' + (value || type) + '"';
                    if (expectation === '"Indent"') {
                        expectation = 'new line and indentation';
                    } else if (expectation === '"Dedent"') {
                        expectation = 'end of line';
                    }
                    throw lastToken.error({
                        type: ErrorType.UNEXPECTED_EOF,
                        message: 'Unexpected end of file. Expected ' + expectation
                    });
                } else {
                    var token = this.lexer.peek(-2) || next;
                    var unexpected = '"' + next.getValue() + '"';
                    if (unexpected === '"Indent"') {
                        unexpected = 'new line and indentation';
                    } else if (unexpected === '"Dedent"') {
                        unexpected = 'end of line';
                    } else {
                        token = next;
                    }
                    var expectation = '"' + (value || type) + '"';
                    if (expectation === '"Indent"') {
                        expectation = 'new line and indentation';
                    } else if (expectation === '"Dedent"') {
                        expectation = 'end of line';
                    }
                    var message = 'Unexpected ' + unexpected + '. Expected ' + expectation;
                    var prev = this.lexer.peek(-2);
                    if (prev !== null) {
                        message += ' after "' + prev.getValue() + '"';
                    }
                    throw token.error({
                        type: ErrorType.UNEXPECTED_TOKEN,
                        message: message
                    });
                }
            }
        };
        Parser.prototype.register = function (fixationType, symbol, parselet) {
            if (fixationType === 'prefix') {
                this.symbols.prefixParselets[symbol] = parselet;
            } else if (fixationType === 'infix') {
                this.symbols.infixParselets[symbol] = parselet;
            }
        };
        Parser.prototype.getPrecedence = function () {
            if (this.peek() !== null) {
                var parser = this.symbols.infixParselets[this.getTokenSymbol(this.peek())];
                if (parser !== undefined) {
                    return parser.getPrecedence();
                }
            }
            return 0;
        };
        Parser.prototype.getTokenSymbol = function (token) {
            if (token.type === 'Punctuator' || token.type === 'Keyword') {
                return token.getValue();
            } else {
                return 'Atom';
            }
        };
        Parser.prototype.parseExpression = function (precedence) {
            precedence = precedence || 0;
            var token = this.next();
            if (token === null) {
                var lastToken = this.lexer.peek(-1);
                throw lastToken.error({
                    type: ErrorType.UNEXPECTED_EOF,
                    message: 'Unexpected end of file'
                });
            }
            var prefix = this.symbols.prefixParselets[this.getTokenSymbol(token)];
            if (prefix === undefined) {
                if (typeof token.type === 'string') {
                    var tokenType = token.type.toLowerCase();
                } else {
                    var tokenType = 'symbol';
                }
                throw token.error({
                    type: ErrorType.UNKNOWN_OPERATOR,
                    message: 'Unexpected ' + tokenType + ' "' + token.getValue() + '"'
                });
            }
            var left = prefix.parse(this, token);
            while (precedence < this.getPrecedence()) {
                token = this.next('Punctuator');
                var infix = this.symbols.infixParselets[this.getTokenSymbol(token)];
                left = infix.parse(this, token, left);
            }
            return left;
        };
        Parser.prototype.parseBlock = function () {
            this.next('Indent');
            var body = [];
            while (this.peek('Dedent') === null) {
                var latest = this.parseExpression();
                body.push(latest);
                if (latest.EOL === false) {
                    throw latest.error({
                        type: ErrorType.EXPECTED_NEWLINE,
                        message: 'Expected newline after ' + latest.type
                    });
                }
            }
            this.next('Dedent');
            return body;
        };
        Parser.prototype.parseProgram = function () {
            var body = [];
            while (this.lexer.EOF() === false) {
                var latest = this.parseExpression();
                body.push(latest);
                if (this.lexer.EOF() === true && latest.EOL === false) {
                    throw latest.error({
                        type: ErrorType.EXPECTED_NEWLINE,
                        message: 'Expected newline after expression'
                    });
                }
            }
            return new this.nodes.expressions.Program(body);
        };
        return function (lexer) {
            this.parse = function (rawJSON) {
                var ast = new Parser(lexer).parseProgram();
                if (rawJSON === true) {
                    return JSON.parse(JSON.stringify(ast));
                } else {
                    return ast;
                }
            };
        };
    }();
        var Scope = function () {
        function Scope(parent) {
            this.parent = parent || null;
            this.local = {};
        }
        Scope.prototype.setErrorGenerator = function (errorGenerator) {
            this.errorGenerator = errorGenerator;
        };
        Scope.prototype.isLocal = function (name) {
            if (this.local.hasOwnProperty(name)) {
                return true;
            } else {
                return false;
            }
        };
        Scope.prototype.get = function (node) {
            var name = node.value;
            if (this.isLocal(name)) {
                return this.local[name];
            } else {
                if (this.parent !== null && typeof this.parent.get === 'function') {
                    return this.parent.get(name);
                } else {
                    throw this.errorGenerator({
                        type: 'ReferenceError',
                        message: 'No variable with identifier "' + name + '"',
                        from: {
                            line: node.line,
                            column: node.column
                        },
                        to: {
                            line: node.line,
                            column: node.column + name.length
                        }
                    });
                }
            }
        };
        Scope.prototype.set = function (node, value) {
            var name = node.value || node.toString();
            if (this.isLocal(name)) {
                this.local[name] = value;
            } else if (this.parent !== null) {
                this.parent.set(name, value);
            } else {
                this.local[name] = value;
            }
        };
        return Scope;
    }();
        var Interpreter = function (Scope) {
        function once(fn, context) {
            var result;
            return function () {
                if (fn) {
                    result = fn.apply(context || this, arguments);
                    fn = null;
                }
                return result;
            };
        }
        function Interpreter(ast, globals) {
            function scopeErrorGenerator(details) {
                return ast.error(details);
            }
            var scope = new Scope();
            scope.setErrorGenerator(scopeErrorGenerator);
            globals = globals || {};
            for (var key in globals) {
                if (globals.hasOwnProperty(key)) {
                    scope.set(key, globals[key]);
                }
            }
            var validEventNames = [
                'assign',
                'print',
                'exit'
            ];
            var waitingHooks = [];
            var hooks = hooks || {};
            function clearWaitingHooks(expression) {
                if (waitingHooks.length > 0) {
                    waitingHooks.map(function (hook) {
                        hook.call({}, expression);
                    });
                    waitingHooks = [];
                }
            }
            var loadOnce = once(function () {
                event('load');
            });
            var exitOnce = once(function () {
                event('exit');
            });
            function event(eventName, payload) {
                if (validEventNames.indexOf(eventName) >= 0 && hooks[eventName] instanceof Array) {
                    hooks[eventName].forEach(function (hook) {
                        if (!(payload instanceof Array)) {
                            payload = [payload];
                        }
                        waitingHooks.push(function (expression) {
                            hook.apply(expression || {}, payload);
                        });
                    });
                }
            }
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
                    event('assign', [
                        left.value,
                        newValue
                    ]);
                    break;
                case 'UnaryExpression':
                    var right = exec(node.right);
                    var rightType = typeof right;
                    function unaryOperationIncorrectTypes(message) {
                        return node.operator.error({
                            type: ErrorType.UNSUPPORTED_OPERATION,
                            message: message
                        });
                    }
                    function expectOnce(operation, expected, actual) {
                        if (expected !== actual) {
                            var message = 'Unsupported operation "' + operation + '" ' + 'on type "' + actual + '"';
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
                        return right === false;
                    default:
                        throw node.operator.error({
                            type: 'SyntaxError',
                            message: 'Unknown operator: "' + node.operator.getValue() + '"',
                            from: {
                                line: node.line,
                                column: node.column
                            },
                            to: {
                                line: node.line,
                                column: node.column + 1
                            }
                        });
                    }
                    break;
                case 'BinaryExpression':
                    var left = exec(node.left);
                    var right = exec(node.right);
                    var leftType = typeof left;
                    var rightType = typeof right;
                    function binaryOperationIncorrectTypes(message) {
                        return node.operator.error({
                            type: ErrorType.UNSUPPORTED_OPERATION,
                            message: message
                        });
                    }
                    function expectTwice(operation, el, er, al, ar) {
                        if (al !== el || er !== ar) {
                            var message = 'Unsupported operation "' + operation + '" ' + 'for type(s) "' + al + '" and "' + ar + '"';
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
                        return left === true && right === true;
                    case '!=':
                        return left !== right;
                    case 'or':
                        return left || right;
                    default:
                        throw node.operator.error({
                            type: 'SyntaxError',
                            message: 'Unknown operator: "' + node.operator.getValue() + '"'
                        });
                    }
                case 'CallExpression':
                    var calleeIdentifier = node.callee.value;
                    if (calleeIdentifier === 'print') {
                        event('print', exec(node.arguments[0]));
                    } else {
                        var fn = scope.get(node.callee);
                        if (typeof fn === 'function') {
                            var executedArguments = node.arguments.map(exec);
                            return fn.apply({}, executedArguments);
                        } else {
                            node.callee.error({
                                type: ErrorType.UNSUPPORTED_OPERATION,
                                message: '"' + calleeIdentifier + '" is not a function'
                            });
                        }
                    }
                    break;
                case 'IfStatement':
                    var condition = exec(node.condition);
                    if (condition === true) {
                        pause(function () {
                            return execBlock(node.ifBlock);
                        });
                    } else {
                        var cases = [];
                        if (node.elifBlocks !== null) {
                            cases = node.elifBlocks;
                        }
                        if (node.elseBlock !== null) {
                            cases.push(node.elseBlock);
                        }
                        var nextCase = function (cases) {
                            if (cases.length > 0) {
                                var thisCase = cases[0];
                                if (thisCase.type === 'ElifStatement') {
                                    var elifCondition = exec(thisCase.condition);
                                    if (elifCondition === true) {
                                        pause(function () {
                                            return execBlock(thisCase.block);
                                        });
                                    } else {
                                        pause(function () {
                                            return nextCase(cases.slice(1));
                                        });
                                    }
                                    return {
                                        type: 'ElifStatement',
                                        line: thisCase.line
                                    };
                                } else if (thisCase.type === 'ElseStatement') {
                                    pause(function () {
                                        return execBlock(thisCase.block);
                                    });
                                    return {
                                        type: 'ElseStatement',
                                        line: thisCase.line
                                    };
                                }
                            }
                        };
                        if (cases.length > 0) {
                            pause(function () {
                                return nextCase(cases);
                            });
                        }
                    }
                    break;
                case 'WhileStatement':
                    var condition = exec(node.condition);
                    var loop = function () {
                        pause(function () {
                            var newCondition = exec(node.condition);
                            if (newCondition === true) {
                                pause(function () {
                                    return execBlock(node.block, loop);
                                });
                            }
                            return {
                                type: 'WhileStatement',
                                line: node.line
                            };
                        });
                    };
                    if (condition === true) {
                        pause(function () {
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
                        line: getLine(node)
                    };
                    if (nodes.length > 1) {
                        pause(function () {
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
                return node.line;
            }
            function registerHook(eventName, hook) {
                if (validEventNames.indexOf(eventName) >= 0 && typeof hook === 'function') {
                    if (hooks[eventName] instanceof Array) {
                        hooks[eventName].push(hook);
                    } else {
                        hooks[eventName] = [hook];
                    }
                }
            }
            return {
                load: function (hooks) {
                    hooks = hooks || {};
                    for (var eventName in hooks) {
                        if (hooks.hasOwnProperty(eventName)) {
                            registerHook(eventName, hooks[eventName]);
                        }
                    }
                    loadOnce();
                    pause(function () {
                        return execBlock(ast.body);
                    });
                },
                next: function () {
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
                on: registerHook
            };
        }
        return Interpreter;
    }(Scope);
    var ErrorType = {
        UNEXPECTED_EOF: 1,
        UNEXPECTED_TOKEN: 2,
        UNKNOWN_OPERATOR: 3,
        EXPECTED_NEWLINE: 4,
        EXPECTED_DIGIT: 5,
        UNTERMINATED_STRING: 6,
        UNEXPECTED_CHAR: 7,
        MALFORMED_NUMBER: 8,
        UNSUPPORTED_OPERATION: 9,
        TIMEOUT: 10
    };
    var mods = {
        MiniPyError: MiniPyError || null,
        ErrorType: ErrorType,
        Scanner: Scanner || null,
        Lexer: Lexer || null,
        Parser: Parser || null,
        Interpreter: Interpreter || null
    };
    var MiniPy = main(mods);
    if (typeof exports !== 'undefined' && typeof module !== 'undefined' && module.exports) {
        module.exports = MiniPy;
    }
    return MiniPy;
}(function (mods) {
    var defaultHooks = {
        print: function (arg1, expression) {
            console.log('PRINT: ' + arg1);
        }
    };
    var defaultMaxLinesExecuted = 2000;
    function addNewline(code) {
        return code + '\n';
    }
    function validate(code, opts) {
        code = addNewline(code);
        opts = opts || {};
        try {
            var scanner = new mods.Scanner(code);
            var lexer = new mods.Lexer(scanner);
            var parser = new mods.Parser(lexer);
            var ast = parser.parse();
            return true;
        } catch (err) {
            return err;
        }
    }
    function createInspector(code, opts) {
        code = addNewline(code);
        opts = opts || {};
        var scanner = new mods.Scanner(code);
        var lexer = new mods.Lexer(scanner);
        var parser = new mods.Parser(lexer);
        var ast = parser.parse();
        var globalVariables = opts.globals || {};
        var inspector = mods.Interpreter(ast, globalVariables);
        inspector.load(opts.hooks || defaultHooks);
        return inspector;
    }
    return {
        validate: validate,
        inspect: createInspector,
        run: function (code, opts) {
            code = addNewline(code);
            opts = opts || {};
            var inspector = createInspector(code, opts);
            var maxLinesExecuted = opts.maxLinesExecuted || defaultMaxLinesExecuted;
            var linesExecuted = 0;
            while (true) {
                var expression = inspector.next();
                linesExecuted++;
                if (expression === null) {
                    opts.hook && opts.hook.exit && typeof opts.hook.exit === 'function' && opts.hook.exit.apply({}, []);
                    break;
                } else if (linesExecuted >= maxLinesExecuted) {
                    throw new mods.MiniPyError(code, {
                        type: mods.ErrorType.TIMEOUT,
                        message: 'Program execution timed out, check for infinite loops'
                    });
                }
            }
        },
        debug: {
            getAST: function (code) {
                code = addNewline(code);
                var scanner = new mods.Scanner(code);
                var lexer = new mods.Lexer(scanner);
                var parser = new mods.Parser(lexer);
                var ast = parser.parse();
                return ast;
            },
            getScanner: function (code) {
                return new mods.Scanner(code);
            },
            getLexer: function (code) {
                var scanner = new mods.Scanner(code);
                return new mods.Lexer(scanner);
            },
            MiniPyError: mods.MiniPyError,
            ErrorType: mods.ErrorType
        }
    };
});