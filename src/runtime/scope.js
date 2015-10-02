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
			case 'Function':
				return 'def (' + value.args.map(function(arg) {
					return arg.value;
				}).join(', ') + ')';
			default:
				return undefined;
		}
	}

	function Scope(parent) {
		this.parent = parent;

		if (this.parent === null) {
			this.globals = {};
		} else {
			this.locals = {};
		}
	}

	Scope.prototype.isGlobalScope = function() {
		return (this.parent === null);
	};

	Scope.prototype.owns = function(name) {
		// return true if variable with `name` exists in this scope
		if (this.isGlobalScope()) {
			return this.globals.hasOwnProperty(name);
		} else {
			return this.locals.hasOwnProperty(name);
		}
	};

	Scope.prototype.exists = function(name) {
		// return true if variable with `name` has
		// been created in any available scope
		return this.owns(name) || (!this.isGlobalScope() && this.parent.owns(name));
	};

	Scope.prototype.get = function(node) {
		var name = node.value;

		if (this.owns(name)) {
			if (this.isGlobalScope()) {
				return this.globals[name];
			} else {
				return this.locals[name];
			}
		} else {
			// this scope doesn't own the variable, check with the parent scope
			// or throw an error if it doesn't exist
			if (this.parent instanceof Scope) {
				return this.parent.get(name);
			} else {
				throw node.error({
					type: ErrorType.UNDEFINED_VARIABLE,
					message: 'No variable with identifier "' + name + '"',
				});
			}
		}
	};

	Scope.prototype.set = function(node, value, forceLocal) {
		var name = node.value || node.toString();

		if (forceLocal === true) {
			// variable is forced to be created locally (usually
			// for function arguments)
			if (this.isGlobalScope()) {
				this.globals[name] = value;
			} else {
				this.locals[name] = value;
			}
		} else if (this.exists(name)) {
			// variable already created, modify its value where it resides
			if (this.owns(name)) {
				if (this.isGlobalScope()) {
					this.globals[name] = value;
				} else {
					this.locals[name] = value;
				}
			} else {
				if (this.isGlobalScope()) {
					this.globals[name] = value;
				} else {
					this.parent.set(node, value);
				}
			}
		} else {
			// variable doesn't exist anywhere already, create it locally
			if (this.isGlobalScope()) {
				this.globals[name] = value;
			} else {
				this.locals[name] = value;
			}
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
			return this.parent.toJSON(scope);
		}
	};

	return Scope;
}());
