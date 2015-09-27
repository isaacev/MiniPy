// [MiniPy] /src/runtime/Scope.js

exports.Scope = (function() {
	var ErrorType = require('../enums').enums.ErrorType;

	function simplifyValue(value) {
		switch (value.type) {
			case 'Boolean':
			case 'Number':
			case 'String':
				return value.value;
			case 'Array':
				var simplification = [];

				for (var i = 0, l = value.value.length; i < l; i++) {
					simplification[i] = simplifyValue(value.value[i]);
				}

				return simplification;
			default:
				return undefined;
		}
	}

	function Scope(parent) {
		this.parent = parent || null;
		this.local = {};
	}

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
				throw node.range.error({
					type: ErrorType.UNDEFINED_VARIABLE,
					message: 'No variable with identifier "' + name + '"',
					range: node.range,
				});
			}
		}
	};

	Scope.prototype.set = function(node, value) {
		var name = node.value || node.toString();

		if (this.isLocal(name)) {
			this.local[name] = value;
		} else if (this.parent !== null) {
			this.parent.set(name, value);
		} else {
			this.local[name] = value;
		}
	};

	Scope.prototype.toJSON = function(subscope) {
		var scope = {
			variables: {},
		};

		if (subscope !== undefined) {
			scope.subscope = subscope;
		}

		for (var name in this.local) {
			if (this.local.hasOwnProperty(name)) {
				scope.variables[name] = simplifyValue(this.local[name]);
			}
		}

		// recursively include parent scopes
		if (this.parent === null) {
			return scope;
		} else {
			return this.parent(scope);
		}
	};

	return Scope;
}());
