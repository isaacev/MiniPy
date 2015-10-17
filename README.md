# MiniPy

Basic usage:

```javascript
var program = 'print(not False and x)';

MiniPy.run(program, {
  globals: {
    x: true,
    print: function(arg) {
      console.log(arg);
    }
  }
});

// logs "true"
```

## Features

MiniPy supports basic Python syntax including:

+ Number, String and Boolean literals
+ Arithmetic and boolean operations
+ Lists
+ Function calls
+ Custom functions
+ While loops
+ If/Elif/Else statements
+ Custom global functions
+ and more...

### Global Functions

To recreate the functions that are normally part of the Python runtime, the MiniPy takes named values and functions which are loaded into the MiniPy execution environment for use in the Python program. These values are passed in an object named `globals` which is passed via MiniPy's second argument:

```javascript
var globals = {
	pi: 3.14159,
	e: 2.71828,
	alwaysTrue: function() {
		return true;
	},
};

MiniPy.run('(pi > e) and alwaysTrue()', {
	globals: globals,
});
```

Global functions can optionally specify the types of their arguments:

```javascript
var globals = {
	isntTrue: {
		args: ['boolean'],
		fn: function(arg) {
			return (arg === false);
		},
	},
};

MiniPy.run('isntTrue(False)', {
	globals: globals,
});
```

The array representing argument types can distinguish between four value types: `string`, `number`, `boolean` and `list`. Any other values will be ignored and won't type-check the arguments. If an argument doesn't match the type description the interpreter will fail and produce an error message highlighting the offending argument.

Values returned by global functions must be of type `string`, `number`, `boolean` or a list consisting of these simple types. Any other returned types will produce unpredictable behavior.

### Restrictions

MiniPy was designed to be a subset of the Python language for use teaching basic programming. For this reason it deliberately restricts some more complex syntax and semmantics which would be valid in Python. Some of these restrictions include:

+ The `None` value cannot be used by the programmer
+ Functions are not allowed to return other functions
+ `print` statements require parentheses around arguments
+ Indentation must always consist of tabs

## Installation

Install with Bower:

```
bower install minipy
```

Include the library with a script tag:

```html
<script src="bower_components/minipy/dist/minipy.js"></script>
```

MiniPy is also available as a package on npm:

```
npm install minipy
```

```javascript
var MiniPy = require('minipy');
```
