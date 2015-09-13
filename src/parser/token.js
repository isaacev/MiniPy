// [MiniPy] /src/parser/Token.js

var Token = (function() {
	function Token(lexer, type, value, line, column, eol) {
		this.lexer = lexer;
		this.type = type;
		this.value = value;
		this.line = line;
		this.column = column;
		this.EOL = (eol === true ? true : false);
	}

	Token.prototype.error = function(type, message) {
		return this.lexer.error({
			type: type,
			message: message,
			from: {
				line: this.line,
				column: this.column,
			},
			to: {
				line: this.line,
				column: this.column + this.value.length,
			},
		});
	};

	return Token;
}());
