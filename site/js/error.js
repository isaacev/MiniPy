// [MiniPy] /site/js/error.js

var ErrorControl = (function(mirror) {
	var markOptions = {
		className: 'error-token',
		clearOnEnter: true,
	};

	function isSensicalNumber(n) {
		return (typeof n === 'number' && n >= 0);
	}

	function post (error) {
		if (error instanceof MiniPy.debug.MiniPyError) {
			// handle MiniPy error

			// display error banner
			Banner.show({
				type: Banner.ERROR,
				message: error.message,
			});

			// highlight offending token (if possible)
			var fromPos = error.from || {};
			var toPos = error.to || {};

			var markedText = null;

			if (isSensicalNumber(fromPos.line) &&
				isSensicalNumber(fromPos.column) &&
				isSensicalNumber(toPos.line) &&
				isSensicalNumber(toPos.column)) {
				// mark region of line
				markedText = mirror.markText({
					line: fromPos.line,
					ch: fromPos.column,
				}, {
					line: toPos.line,
					ch: toPos.column,
				}, markOptions);
			} else if (isSensicalNumber(fromPos.line)) {
				// mark entire line
				markedText = mirror.markText({
					line: fromPos.line,
					ch: 0,
				}, {
					line: fromPos.line,
					ch: cm.getLine(fromPos.line).length - 1,
				}, markOptions);
			}

			mirror.on('focus', function clearMarkedText() {
				if (markedText !== null) {
					markedText.clear();
				}

				mirror.off('focus', clearMarkedText);
			});
		} else {
			// error not created by script
			Banner.show({
				type: Banner.ERROR,
				message: error.message,
			});
		}
	}

	return {
		post: post,
	};
}(cm));
