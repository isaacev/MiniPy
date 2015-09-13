// [MiniPy] /src/error.js

var MiniPyError = (function() {
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
		var spacedColumn = column + ((spacesPerTabs - 1) * totalTabsBefore);

		// calculate padding
		var totalPadding = spacedColumn;
		var padding = mul(' ', totalPadding);

		var underline = mul('^', width || 1);

		console.log(spacedOffendingLine);
		console.log(padding + underline);
	}

	function MiniPyError(source, details) {
		this.type = details.type || 'Unknown Error';
		this.message = details.message || '';

		this.from = details.from || undefined;
		this.to = details.to || undefined;
	}

	MiniPyError.prototype.toString = function() {
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
}());
