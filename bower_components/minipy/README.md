# MiniPy

Basic usage:

```html
<script src="/path/to/minipy.min.js"></script>
```

```javascript

var script = 'print(not False and x)';

MiniPy.run(script, {
  globals: {
    x: true,
    print: function(arg) {
      console.log(arg);
    }
  }
});

// logs "true"

```
