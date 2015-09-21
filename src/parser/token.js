// [MiniPy] /src/parser/Token.js

exports.Token = (function() {
	var ErrorType = require('../enums').enums.ErrorType;
	var TokenType = require('../enums').enums.TokenType;
	var TokenTypeStrings = require('../enums').enums.TokenTypeStrings;

	function Token(lexer, type, value, line, column) {
		this.lexer = lexer;
		this.type = type;

		switch (type) {
			case TokenType.NUMBER:
				this.raw = value;
				this.value = parseFloat(value);

				if (isNaN(this.value)) {
					throw this.error({
						type: ErrorType.MALFORMED_NUMBER,
						message: 'Could not parse number',
					});
				}

				break;
			case TokenType.BOOLEAN:
				this.raw = value;
				this.value = (value === 'True');
				break;
			case TokenType.STRING:
				this.raw = '"' + value + '"';
				this.value = value;
				break;
			default:
				this.value = value;
		}

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
		if (this.raw != undefined) {
			return this.raw.length;
		} else {
			if (this.value != undefined) {
				return this.value.length;
			} else {
				// for Indents and Dedents
				return 0;
			}
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
