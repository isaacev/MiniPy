// [MiniPy] /src/runtime/types.js

exports.Type = (function() {
	var ErrorType = require('../enums').enums.ErrorType;
	var ValueType = require('../enums').enums.ValueType;

	function BooleanValue(value) {
		this.type = 'Value';
		this.value = value;
	}

	BooleanValue.prototype.isType = function(test) {
		return (test === ValueType.BOOLEAN);
	};

	BooleanValue.prototype.get = function() {
		return this.value;
	};

	BooleanValue.prototype.operation = function(isUnary, operatorToken, operand, operandToken) {
		var a = this.value,
			b;

		if (isUnary === false) {
			if (operand.isType(ValueType.BOOLEAN) === false) {
				throw operandToken.error({
					type: ErrorType.TYPE_VIOLATION,
					message: 'Expected a boolean',
				});
			}

			// set `b` during binary operations to represent the computed
			// value of the right operand
			b = operand.get();
		}

		switch (operatorToken.getValue()) {
			case 'and':
				return new BooleanValue(a && b);
			case 'or':
				return new BooleanValue(a || b);
			case 'not':
				if (isUnary === true) {
					// negation
					return new BooleanValue(!a);
				} else {
					// operator not being used as a unary operation
					throw operatorToken.error({
						type: ErrorType.UNKNOWN_OPERATION,
						message: 'The "not" operator can only be used in the form: not <expression>',
					});
				}
			case '==':
				return new BooleanValue(a === b);
			case '!=':
				return new BooleanValue(a != b);
			default:
				throw operatorToken.error({
					type: ErrorType.UNKNOWN_OPERATION,
					message: 'Unknown operation with symbol "' + operatorToken.getValue() + '"',
				});
		}
	};

	function NumberValue(value) {
		this.type = 'Value';
		this.value = value;
	}

	NumberValue.prototype.isType = function(test) {
		return (test === ValueType.NUMBER);
	};

	NumberValue.prototype.get = function() {
		return this.value;
	};

	NumberValue.prototype.operation = function(isUnary, operatorToken, operand, operandToken) {
		var a = this.value,
			b;

		if (isUnary === false) {
			if (operand.isType(ValueType.NUMBER) === false) {
				throw operandToken.error({
					type: ErrorType.TYPE_VIOLATION,
					message: 'Expected a number',
				});
			}

			// set `b` during binary operations to represent the computed
			// value of the right operand
			b = operand.get();
		}

		switch (operatorToken.getValue()) {
			case '+':
				return new NumberValue(a + b);
			case '-':
				if (isUnary === true) {
					// negation
					return new NumberValue(-1 * a);
				} else {
					// subtraction
					return new NumberValue(a - b);
				}
			case '*':
				return new NumberValue(a * b);
			case '/':
				if (b === 0) {
					throw operatorToken.error({
						type: ErrorType.UNKNOWN_ERROR, // TODO: this is an inappropriate error type
						message: 'Cannot divide by 0',
					});
				}

				return new NumberValue(a / b);
			case '%':
				return new NumberValue(a % b);
			case '**':
				return new NumberValue(Math.pow(a, b));
			case '>':
				return new BooleanValue(a > b);
			case '>=':
				return new BooleanValue(a >= b);
			case '<':
				return new BooleanValue(a < b);
			case '<=':
				return new BooleanValue(a <= b);
			case '==':
				return new BooleanValue(a === b);
			case '!=':
				return new BooleanValue(a != b);
			default:
				throw operatorToken.error({
					type: ErrorType.UNKNOWN_OPERATION,
					message: 'Unknown operation with symbol "' + operatorToken.getValue() + '"',
				});
		}
	};

	function StringValue(value) {
		this.type = 'Value';

		// value is supplied having already been stripped of quotes
		this.value = value;
	}

	StringValue.prototype.isType = function(test) {
		return (test === ValueType.STRING);
	};

	StringValue.prototype.get = function() {
		return this.value;
	};

	StringValue.prototype.operation = function(isUnary, operatorToken, operand, operandToken) {
		if (isUnary === true) {
			// there are only binary string operations
			throw operatorToken.error({
				type: ErrorType.UNKNOWN_OPERATION,
				message: 'Not a valid string operation',
			});
		}

		function expectOperandType(type, message) {
			if (operand.isType(type) === false) {
				// expect subscript operand to be of type number
				throw operandToken.error({
					type: ErrorType.TYPE_VIOLATION,
					message: 'Expected a ' + message,
				});
			}
		}

		var a = this.value;
		var b = operand.get();

		switch (operatorToken.getValue()) {
			case '+':
				expectOperandType(ValueType.STRING, 'string');
				return new StringValue(a + b);
			case '==':
				expectOperandType(ValueType.STRING, 'string');
				return new BooleanValue(a == b);
			case '!=':
				expectOperandType(ValueType.STRING, 'string');
				return new BooleanValue(a != b);
			case '[':
				// subscript syntax
				expectOperandType(ValueType.NUMBER, 'number');

				if (b >= a.length || -b > a.length) {
					throw operandToken.error({
						type: ErrorType.OUT_OF_BOUNDS,
						message: '"' + b + '" is out of bounds',
					});
				} else if (b < 0) {
					// negative index
					return new StringValue(a[a.length + b])
				} else {
					// positive index
					return new StringValue(a[b]);
				}
			default:
				throw operatorToken.error({
					type: ErrorType.UNKNOWN_OPERATION,
					message: 'Unknown operation with symbol "' + operatorToken.getValue() + '"',
				});
		}
	};

	function ArrayValue(elements) {
		this.type = 'Value';
		this.value = elements;
	}

	ArrayValue.prototype.isType = function(test) {
		return (test === ValueType.ARRAY);
	};

	ArrayValue.prototype.get = function(index) {
		if (typeof index === 'number') {
			// TODO: check to make sure index is in-range
			return this.value[index];
		} else {
			return this.value;
		}
	};

	ArrayValue.prototype.operation = function(isUnary, operatorToken, operand, operandToken) {
		if (isUnary === true) {
			// there are only binary array operations
			throw operandToken.error({
				type: ErrorType.UNKNOWN_OPERATION,
				message: 'Not a valid array operation',
			});
		}

		function expectOperandType(type, message) {
			if (operand.isType(type) === false) {
				// expect subscript operand to be of type number
				throw operandToken.error({
					type: ErrorType.TYPE_VIOLATION,
					message: 'Expected a ' + message,
				});
			}
		}

		var a = this.value;
		var b = operand.get();

		switch (operatorToken.getValue()) {
			case '+':
				expectOperandType(ValueType.ARRAY, 'array');
				// concatentate arrays
				var concatenatedElements = [];

				// add elements from `a` to new array
				for (var i = 0, l = a.length; i < l; i++) {
					concatenatedElements.push(a[i]);
				}

				// add elements from `b` to new array
				for (var i = 0, l = b.length; i < l; i++) {
					concatenatedElements.push(b[i]);
				}

				return new ArrayValue(concatenatedElements);
			case '[':
				expectOperandType(ValueType.NUMBER, 'number');

				// subscript syntax
				if (b >= a.length || -b > a.length) {
					throw operatorToken.error({
						type: ErrorType.OUT_OF_BOUNDS,
						message: '"' + b + '" is out of bounds',
					});
				} else if (b < 0) {
					// negative index
					return a[a.length + b];
				} else {
					// positive index
					return a[b];
				}
			default:
				throw operatorToken.error({
					type: ErrorType.UNKNOWN_OPERATION,
					message: 'Unknown operation with symbol "' + operatorToken.getValue() + '"',
				});
		}
	};

	return {
		Boolean: BooleanValue,
		Number: NumberValue,
		String: StringValue,
		Array: ArrayValue,
	};
}());
