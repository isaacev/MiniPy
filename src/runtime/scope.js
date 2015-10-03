// [MiniPy] /src/runtime/Scope.js

exports.Scope = (function() {
	var ErrorType = require('../enums').enums.ErrorType;
	var ValueType = require('../enums').enums.ValueType;

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
				return {
					args: value.args.map(function(arg) {
						return arg.value;
					}),
				};
			default:
				return undefined;
		}
	}

	function Scope(parent, details) {
		this.parent = parent;
		this.details = details || null;

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
				return this.parent.get(node);
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

		if (this.details !== null) {
			// include extra info about function scopes
			scope.name = this.details.name;
			scope.args = this.details.args;
		}

		if (subscope !== undefined) {
			scope.subscope = subscope;
		}

		// collect variables into JSON scope representation
		if (this.parent === null) {
			for (var name in this.globals) {
				if (this.globals.hasOwnProperty(name)) {
					if (this.globals[name].type === ValueType.FUNCTION && this.globals[name].blocking === false) {
						// skip built in functions
						continue;
					}

					scope.variables[name] = simplifyValue(this.globals[name]);
				}
			}
		} else {
			for (var name in this.locals) {
				if (this.locals.hasOwnProperty(name)) {
					if (this.locals[name].type === ValueType.FUNCTION && this.locals[name].blocking === false) {
						// skip built in functions
						continue;
					}

					scope.variables[name] = simplifyValue(this.locals[name]);
				}
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
