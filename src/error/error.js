// [MiniPy] /src/error/error.js

exports.MiniPyError = (function() {
	function MiniPyError(source, details) {
		this.type = details.type || 0;
		this.message = details.message || '';

		this.from = details.from || undefined;
		this.to = details.to || undefined;

		this.toString = function() {
			return JSON.stringify(details, null, '   ');
		}
	}

	return MiniPyError;
}());
