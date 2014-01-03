var TOKEN_PREFIX = 'coatcheck'

var ncall = require('ncall')
var crypto = require('crypto')
var Promise = require('bluebird')
var cookie = require('cookie')

function hash(val) {
  return crypto.createHash('md5')
    .update(val)
    .digest('hex')
}

function hmac(val, key) {
  return crypto.createHmac('sha256', key)
    .update(val)
    .digest('base64')
}


module.exports = function (serviceStore, config) {

  var TOKEN_SECRET = config.secret

  function makeToken() {
    return ncall(crypto.randomBytes, 32)
      .then(function (random) {
        random = random.toString('base64')
        var sig = hmac(random, TOKEN_SECRET)
        return random + ':' + sig
      })
  }

  function verify(str) {
    if (!str || str === '' || str.indexOf(':') < 0) { return false }

    var tuple = str.split(':')
    var seed = tuple[0]
    var sig = tuple[1]
    var checkSig = hmac(seed, TOKEN_SECRET)
    return sig === checkSig
  }

  function Check(key, req, res) {
    if (!(this instanceof Check)) {
      return new Check(key, req, res)
    }
    this.key = hash(TOKEN_PREFIX + ':' + key)

    this.req = req
    this.res = res
    this.store = serviceStore
  }
  var proto = Check.prototype = {}

  proto.get = function () {
    var store = this.store
    var res = this.res
    var key = this.key

    var token = this.getVerifiedTokenFromCookie()
    // console.log('coatcheck get', key, token)
    if (!token) {
      return Promise.resolve()
    }

    return store.get(TOKEN_PREFIX + ':' + token)
      .then(function (val) {
        return val
      })
  }

  proto.pull = function () {
    var res = this.res
    var key = this.key

    return this.get().then(function (val) {
      // clear cookie
      res.setHeader('set-cookie', cookie.serialize(key, '', {expire: new Date(0), path: '/'}))
      return val
    })
  }

  proto.set = function (val) {
    var res = this.res
    var key = this.key
    var store = this.store

    return makeToken()
      .then(function (signedToken) {
        //console.log('coatcheck set', key, signedToken)
        res.setHeader('set-cookie', cookie.serialize(key, signedToken, {httpOnly: true, path: '/'}))
        var token = signedToken.substr(0, signedToken.indexOf(':'))
        return store.set(TOKEN_PREFIX + ':' + token, val, {expire:5*60})
      })
  }

  proto.getVerifiedTokenFromCookie = function () {
    var cookies = cookie.parse(this.req.headers.cookie || '')
    var token = cookies[this.key]
    if (!verify(token)) {
      return false
    }
    return token.substr(0, token.indexOf(':'))
  }

  return Check
}