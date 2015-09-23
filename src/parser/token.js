// [MiniPy] /src/parser/Token.js

exports.Token = (function() {
	var ErrorType = require('../enums').enums.ErrorType;
	var TokenType = require('../enums').enums.TokenType;
	var TokenTypeStrings = require('../enums').enums.TokenTypeStrings;

	function Token(lexer, type, value, line, column) {
		this.lexer = lexer;
		this.type = type;
		this.value = value;

		this.line = line;
		this.column = column;
	}

	Token.prototype.getValue = function() {
		if (this.value !== null) {
			return this.value;
		} else {
			return TokenTypeStrings[this.type];
		}
	};

	Token.prototype.getLength = function() {
		if (this.value !== null) {
			return this.value.toString().length;
		} else {
			// for Indents and Dedents
			return 0;
		}
	};

	Token.prototype.error = function(details) {
		return this.lexer.error({
			type: details.type,
			message: details.message,
			from: details.from || {
				line: this.line,
				column: this.column,
			},
			to: details.to || {
				line: this.line,
				column: this.column + this.getLength(),
			},
		});
	};

	return Token;
}());
