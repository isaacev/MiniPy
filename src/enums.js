// [MiniPy] /src/enums.js

exports.enums = {
	ErrorType: {
		UNKNOWN_ERROR: 0,

		// compile-time errors
		UNEXPECTED_CHARACTER: 1,
		UNEXPECTED_TOKEN: 2,
		UNEXPECTED_EOF: 3,
		BAD_INDENTATION: 4,

		// runtime errors
		UNDEFINED_VARIABLE: 10,
		TYPE_VIOLATION: 11,
		EXECUTION_TIMEOUT: 12,
		UNKNOWN_OPERATION: 13,
		OUT_OF_BOUNDS: 14,
		DIVIDE_BY_ZERO: 15,
		ILLEGAL_STATEMENT: 16,
	},

	TokenType: {
		EOF: 'EOF',

		// whitespace
		NEWLINE: 'Newline',
		INDENT: 'Indent',
		DEDENT: 'Dedent',

		// syntactic symbols
		PUNCTUATOR: 'Punctuator',
		KEYWORD: 'Keyword',
		IDENTIFIER: 'Identifier',

		// literals
		BOOLEAN: 'Boolean',
		STRING: 'String',
		NUMBER: 'Number',
	},

	ValueType: {
		NONE: 'None',
		BOOLEAN: 'Boolean',
		NUMBER: 'Number',
		STRING: 'String',
		ARRAY: 'Array',
		FUNCTION: 'Function',
	},
};
