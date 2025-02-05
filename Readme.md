## Writing ID and Classes
All ID and Classes in html must have an hyphen '-' if need be. That is, when we need to separate its completion

## Writing 'name' attribute
This should be done in camel case

## Making Node JS "require" and "import" statements work without 'relative...' errors
It is quite simple. I installed 'Web Dev Server' using 'npm i --save-dev @web/dev-server'.
See Website below - Solution gotton from stackoverflow:
[Modern Web](https://modern-web.dev/docs/dev-server/overview/)

## Optional / Potential Features
- Upload the book "The neuroscience of selling". Have the AI analyze it, store the information analyzed and have it to use that information to include things / language in the book to tap into emotions.
Basically, you tell the AI how to tap into the emotions of users to get them to buy. This will probably be very useful when prompting AI to write the book description to be put on Amazon

## forEach()
Note that this method expects a synchronous operation and does not wait for promises

## Deep Copy Objects to Retain Functions
I used the NPM library; lodash, to achive this seemlessly

## When Using JS Concat() METHOD
The concat() method joins two or more strings.

The concat() method does not change the existing strings.

The concat() method returns a new string.

Use command ```npm cache verify``` to automatically fix cache issues/unexpected issues with node_modules. Use ```npm cache clean --force``` to remove cache. 
Avoid using ```npm rm -rf cache``` as it is considered to be potentially dangerous.