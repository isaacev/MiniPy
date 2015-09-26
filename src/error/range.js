// [MiniPy] /src/error/range.js

exports.Range = (function(programSource) {
	var MiniPyError = require('./error').MiniPyError;

	function Range(start, end) {
		this.start = start || {
			line: null,
			column: null,
		};

		this.end = end || {
			line: null,
			column: null,
		};

		if (start && end && start.line && end.line) {
			this.multiline = (end.line > start.line);
		} else {
			this.multiline = false;
		}
	}

	Range.prototype.open = function(line, column) {
		this.start.line = (typeof line === 'number' && line >= 0 ? line : null);
		this.start.column = (typeof column === 'number' && column >= 0 ? column : null);

		return this;
	};

	Range.prototype.close = function(line, column) {
		this.end.line = (typeof line === 'number' && line >= 0 ? line : null);
		this.end.column = (typeof column === 'number' && column >= 0 ? column : null);

		this.multiline = (this.end.line > this.start.line);

		return this;
	};

	Range.prototype.union = function(secondRange) {
		return new Range(this.start, secondRange.end);
	};

	Range.prototype.error = function(details) {
		return new MiniPyError(programSource, {
			type: details.type,
			message: details.message,
			from: this.start,
			to: this.end,
		});
	};

	return {
		create: function(startLine, startColumn, endLine, endColumn) {
			return new Range({
				line: startLine,
				column: startColumn,
			}, {
				line: endLine,
				column: endColumn,
			});
		},

		open: function(line, column) {
			var r = new Range();
			return r.open(line, column);
		},
	};
});
