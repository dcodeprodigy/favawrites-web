- This File Contain Methods which I have Used to Solve Bugs/Issues Encountered in this Project thus Far.

## HOW TO FIX ISSUES OF SyntaxError: Expected ',' or '}' after property value in JSON at position xxxx (line x column xxxx)
Supposing we have a string variable in supposed JSON returned by the model:
```var string = "{JSON from Model}"```

In some cases, simply running ```JSON.parse(string)``` throws the kind of error in the heading above.
To fix this, do this instead => 
```JSON.parse(JSON.stringify(string))```

This accurately, without errors, parse the JSON B

### Helping Model Identify JSON Errors
Grab the number the linter hinted at (e.g., 'JSON at position 4968')
Get 5 Characters before and after the character hinted at, feed to model and tell it that is where the error lies and it should do something.