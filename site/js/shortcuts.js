// [MiniPy] /site/js/shortcuts.js

var Shortcuts = (function(trap) {
	function bind(command, fn) {
		trap.bind(command, function(event) {
			fn.apply({}, [event]);
			return false;
		});
	}

	return {
		bind: bind,
	};
}(Mousetrap));
