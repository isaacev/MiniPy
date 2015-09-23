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
	},

	TokenType: {
		EOF: 0,

		// whitespace
		NEWLINE: 1,
		INDENT: 2,
		DEDENT: 3,

		// syntactic symbols
		PUNCTUATOR: 4,
		KEYWORD: 5,
		IDENTIFIER: 6,

		// literals
		BOOLEAN: 7,
		STRING: 8,
		NUMBER: 9,
	},

	TokenTypeStrings: [
		'EOF',
		'Newline',
		'Indent',
		'Dedent',
		'Punctuator',
		'Keyword',
		'Identifier',
		'Boolean',
		'String',
		'Number',
	],

	ValueType: {
		BOOLEAN: 0,
		NUMBER: 1,
		STRING: 2,
	},
};
