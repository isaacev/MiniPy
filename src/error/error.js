// [MiniPy] /src/error/error.js

exports.MiniPyError = (function() {
	// given a string `ch` and a number `n`, return a new string
	// with `ch` repeated `n` times
	function multiplyChar(ch, n) {
		var out = '';

		while (n-- > 0) {
			out += ch;
		}

		return out;
	}

	function MiniPyError(source, details) {
		this.source = source;
		this.type = details.type || 0;
		this.message = details.message || '';

		this.from = details.from || undefined;
		this.to = details.to || undefined;
	}

	MiniPyError.prototype.toString = function() {
		var self = this;
		var tab = '    ';

		var message = '';

		if (this.to && this.to.line > this.from.line) {
			// TODO: currently will print every line of source code both
			// those lines in error that those that aren't. in the future
			// there should be a few valid lines above and below the erroneous
			// lines to give context but certainly not the entire program
			var lines = this.source.split('\n');

			message += 'Error on lines ' + (this.from.line + 1) + ' through ' + (this.to.line + 1) + ': ' + this.message + '\n';

			message += lines.map(function(line, index) {
				if (index >= self.from.line && index <= self.to.line) {
					return '>>' + line.replace(/\t/g, tab);
				} else {
					return '  ' + line.replace(/\t/g, tab);
				}
			}).join('\n');
		} else {
			var line = this.source.split('\n')[this.from.line];

			var paddingWidth = line.substring(0, this.from.column).replace(/\t/g, tab).length;
			var padding = multiplyChar('_', paddingWidth);

			// var underlineWidth = line.substring(0, this.to.column || line.length).replace(/\t/g, tab).length - paddingWidth;
			var underlineWidth = this.to.column - this.from.column;
			var underline = multiplyChar('^', underlineWidth);

			console.log('underlineWidth', this.to.column - this.from.column);

			message += 'Error on line ' + (this.from.line + 1) + ': ' + this.message + '\n';

			message += line.replace(/\t/g, tab) + '\n';
			message += padding + underline + '\n';
		}

		return message;
	};

	return MiniPyError;
}());
