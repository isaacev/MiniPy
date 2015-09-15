// [MiniPy] /site/js/banner.js

var Banner = (function(editor) {
	var types = {
		GENERIC: 0,
		OK: 1,
		WARNING: 2,
		ERROR: 3,
	};

	var names = [
		'generic',
		'ok',
		'warning',
		'error',
	];

	var defaultDurations = {
		fadeIn: 200,
		delay: 3000,
		fadeOut: 500,
	};

	var template = '<div id="banner" class="type-{type}" style="display:none">{message}</div>';

	var currentBanner = null;

	function show(banner) {
		$('#banner').remove();

		var html = template
			.replace('{type}', names[banner.type || 0])
			.replace('{message}', banner.message || '');

		currentBanner = $(html).appendTo(editor);

		if (banner.type === types.ERROR) {
			currentBanner
				.fadeIn(defaultDurations.fadeIn)
				.delay(defaultDurations.delay * 2)
				.fadeOut(defaultDurations.fadeOut, close);
		} else {
			currentBanner
				.fadeIn(defaultDurations.fadeIn)
				.delay(defaultDurations.delay)
				.fadeOut(defaultDurations.fadeOut, close);
		}
	}

	function close() {
		if (currentBanner !== null) {
			currentBanner.remove();
		}
	}

	return {
		show: show,
		close: close,

		// banner types
		GENERIC: types.GENERIC,
		OK: types.OK,
		WARNING: types.WARNING,
		ERROR: types.ERROR,
	};
}($('#editor')));
