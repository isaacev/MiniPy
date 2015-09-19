// [MiniPy] /src/parser/Scanner.js

exports.Scanner = (function() {
	var MiniPyError = require('../error/error').MiniPyError;

	function Scanner(input) {
		this.line = 0;
		this.column = 0;
		this.nextIndex = 0;
		this.input = input;
	}

	Scanner.prototype.peek = function() {
		if (this.nextIndex < this.input.length) {
			// return next character from input WITHOUT incrementing next index
			var peekChar = this.input[this.nextIndex];
			return peekChar;
		} else {
			return null;
		}
	};

	Scanner.prototype.next = function() {
		if (this.nextIndex < this.input.length) {
			// return next character from input and increment next index
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

	Scanner.prototype.EOF = function() {
		return (this.nextIndex >= this.input.length);
	};

	Scanner.prototype.error = function(details) {
		return new MiniPyError(this.input, details);
	};

	return Scanner;
}());
