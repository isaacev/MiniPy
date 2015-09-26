// [MiniPy] /src/parser/Token.js

exports.Token = (function() {
	var ErrorType = require('../enums').enums.ErrorType;
	var TokenType = require('../enums').enums.TokenType;

	function Token(lexer, type, value, range) {
		this.lexer = lexer;
		this.type = type;
		this.value = value;
		this.range = range;
	}

	Token.prototype.getValue = function() {
		if (this.value !== null) {
			return this.value;
		} else {
			return this.type;
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
			from: details.from || this.range.start,
			to: details.to || this.range.end,
		});
	};

	return Token;
}());
