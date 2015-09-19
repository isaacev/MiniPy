// [MiniPy] /src/error/errorType.js

exports.ErrorType = {
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
};
