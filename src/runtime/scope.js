// [MiniPy] /src/runtime/Scope.js

var Scope = (function() {
	function Scope(parent) {
		this.parent = parent || null;
		this.local = {};
	}

	Scope.prototype.setErrorGenerator = function(errorGenerator) {
		this.errorGenerator = errorGenerator;
	};

	Scope.prototype.isLocal = function(name) {
		if (this.local.hasOwnProperty(name)) {
			return true;
		} else {
			return false;
		}
	};

	Scope.prototype.get = function(node) {
		var name = node.value;

		if (this.isLocal(name)) {
			return this.local[name];
		} else {
			if (this.parent !== null && typeof this.parent.get === 'function') {
				return this.parent.get(name);
			} else {
				throw this.errorGenerator({
					type: 'ReferenceError',
					message: 'No variable with identifier "' + name + '"',
					from: {
						line: node.line,
						column: node.column,
					},
					to: {
						line: node.line,
						column: node.column + name.length,
					},
				});
			}
		}
	};

	Scope.prototype.set = function(identifier, value) {
		var name = identifier.value;

		if (this.isLocal(name)) {
			this.local[name] = value;
		} else if (this.parent !== null) {
			this.parent.set(name, value);
		} else {
			this.local[name] = value;
		}
	};

	return Scope;
}());
