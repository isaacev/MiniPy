// [MiniPy] /site/js/storage.js

(function(mirror) {
	var localDbId = 'source';

	function debounce(func, wait, immediate) {
		var timeout;

		return function() {
			var context = this;
			var args = arguments;

			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};

			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);

			if (callNow) {
				func.apply(context, args);
			}
		};
	}

	function getScript() {
		return mirror.getValue();
	}

	var localSaveLimited = debounce(function() {
		localforage.setItem(localDbId, getScript(), function(err) {
			if (err) {
				console.error(err);
			} else {
				console.log('script saved locally');
			}
		});
	}, 500);

	localforage.getItem(localDbId, function(err, value) {
		if (value === null) {
			var defaultSource = '';
			localforage.setItem(localDbId, defaultSource, function(err) {
				if (err) {
					console.error(err);
				} else {
					mirror.setValue(defaultSource);
				}
			});
		} else {
			mirror.setValue(value);
		}
	});

	mirror.on('change', localSaveLimited);
}(cm));
