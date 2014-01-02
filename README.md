# coatcheck
a split key/value store: stash values in one store and keys in another

## usage
```js
var coatcheck = require('coatcheck')

coatcheck('my key', req, res)
  .get()
  .then(function (val) {
    console.log('i got the value from `my key`', val)
  })

coatcheck('my key', req, res)
  .set('a value')

coatcheck('my key', req, res)
  .pull()
  // returns the value and unsets it from the backing store

```

## installation

    $ npm install coatcheck


## running the tests

From package root:

    $ npm install
    $ npm test


## contributors

- jden <jason@denizac.org>


## license

MIT. (c) MMXIV jden <jason@denizac.org>. See LICENSE.md
