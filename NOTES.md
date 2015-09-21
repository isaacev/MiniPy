# Notes

## TODO
+ Improve PRINT to handle more than 1 argument
+ Rework error messages and error reporting (with remedy feature?)

## IDEAS
+ Better formatting for printed complex numbers (ex: 3.0414093201713376e+64)
  given limited space of `.md-scope` and `.md-stdout`
    + Maybe truncate displayed values and let the user see the full value in
      the element `title` attribute?
    + Strings should be truncated after a certain length too
+ Classify parsing erros into Minor/Major
	+ Parser can keep parsing after Minor errors so that multiple errors
	  can be reported on a single validation pass
	+ Minor errors:
		+ Unknown binary operator
		+ Unknown character
	+ Major errors:
		+ Bad indentation
		+ Unexpected Token
		+ Unexpected EOF
+ Add error advice features
    + Many errors could come with "advice": more details for the user
      about how the error could be corrected or where to look in the
      documentation for more information
+ Change Python keywords not being used to some other token type so that their
  use as identifiers can be detected intelligently and a more helpful error
  message can be produced

## Resources
+ http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
+ http://javascript.crockford.com/tdop/tdop.html
+ http://javascript.crockford.com/tdop/index.html
+ https://www.youtube.com/watch?v=9e_oEE72d3U
