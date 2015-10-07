# Notes

## TODO
+ Rework error messages and error reporting (with remedy feature?)

## IDEAS
+ For certain errors, have a "Fix" button which will make simple changes to
  fix the error
    + Unterminated string
    + Missing end paren
    + Missing end bracket?
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
