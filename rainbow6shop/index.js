/**
 * Created by Administrator on 2018/3/25.
 */

const Request = require('request')
const Promise = require('bluebird')
const _ = require('lodash')

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";

const DEAULT_APPID = '685A3038-2B04-47EE-9C5A-6403381A46AA'

const logger = require('../utils/logger')

require('util').inherits(Rainbow6Shop, require('events').EventEmitter)

module.exports  = Rainbow6Shop

// Rainbow6 Web shop wrapper
function Rainbow6Shop(options) {
  this.options = options || {}

  let defaultOptions = {
    appid: DEAULT_APPID,
    timeout: 50000,
    userAgent: USER_AGENT,
    location: 'en',
    ISOCode: 'US'
  }

  for (let i in defaultOptions) {
    if (!defaultOptions.hasOwnProperty(i)) {
      continue
    }

    if (typeof this.options[i] === 'undefined') {
      this.options[i] = defaultOptions[i]
    }
  }

  this._jar = Request.jar();
  this.appid = this.options.appid
  this.userAgent = this.options.userAgent
  this.location = this.options.location
  this.ISOCode = this.options.ISOCode

  let requestDefaults = {
    "jar": this._jar,
    "timeout": this.options.timeout,
    "gzip": true,
    "headers": {
      "User-Agent": this.userAgent,
      "Ubi-AppId": this.appid
    }
  }

  this.request = Request.defaults({"forever": true})
  this.request = this.request.defaults(requestDefaults)

}

// Get csrf token before buy web shop product
Rainbow6Shop.prototype.getCSRFToken = function() {
  let cookies = this._jar.getCookieString("http://webshop-r6.ubi.com").split(';');
  for(let i = 0; i < cookies.length; i++) {
    let match = cookies[i].trim().match(/([^=]+)=(.+)/);
    if (match && match[1] === 'XSRF-TOKEN') {
      return decodeURIComponent(match[2]);
    } else {
      this.loadCSRFToken().catch((err) => {
      })
    }
  }
  return null
}

// Load csrf token from web shop page
Rainbow6Shop.prototype.loadCSRFToken = function() {
  return new Promise((resolve, reject) => {
    let shopHome = `https://webshop-r6.ubi.com/${this.location}/shop/products`
    this.request.get({
      url: shopHome
    }, (err, response, body) => {
      if (err) {
        reject(new Error(`Ubi server exception`))
      } else {
        resolve(null)
      }
    })
  })
}

// login to web shop and get session token
Rainbow6Shop.prototype.connect = function (username, password) {
  logger.info(`[Rainbow6Shop] Connect to session with account: ${username}, password: ${password}`)
  return new Promise((resolve, reject) => {
    let url = `https://connect.ubi.com/ubiservices/v2/profiles/sessions`
    this.request.post({
      url: url,
      auth: {
        'user': username,
        'pass': password
      },
      json: true,
      body: {}
    }, (err, resp, body) => {
      try {
        logger.info(`[Rainbow6Shop] Get resp from connect to session with account: ${username}, password: ${password}`)

        if (err) {
          logger.error(`[Rainbow6Shop] Get error from connect to session with account: ${username}, password: ${password}`)
          logger.error(err)
          reject(new Error('Failed to login to ubi server'))
          return
        }
        
        if (resp && resp.statusCode === 200 && body && body.hasOwnProperty('ticket')) {
          resolve(body)
        } else {
          if (body && body.httpCode >= 400 && body.httpCode < 500) {
            reject(new Error(`Invalid passowrd`))
          } else {
            reject(new Error(`ubi server exception:${resp.statusCode}`))
          }
        }
      } catch (err) {
        logger.error(err)
        reject(new Error('ubi server exception'))
      }
    })
  })
}

// check out web shop product and get the pay url
Rainbow6Shop.prototype.checkout = function (steamid, productId, priceCode, country, email, sessionBody) {
  logger.info(`[Rainbow6Shop] Checkout with steamid: ${steamid}, product: ${productId}, priceCode: ${priceCode}, country: ${country}`)
  return new Promise( (resolve, reject) => {
    let mercuryUrl = 'https://webshop-r6.ubi.com/api/shop/v1/checkout?productSort=mercury'
    this.request.post({
      url: mercuryUrl,
      headers: {
        token: sessionBody.token,
        ticket: sessionBody.ticket,
        user_id: sessionBody.userId,
        sessionId: sessionBody.sessionId
      },
      form: {
        productId: productId,
        priceCode: priceCode,
        country: country,
        email: email
      },
      json: true
    }, (err, resp, body) => {
      try {
        // to be continue
        resolve('')
      } catch(err) {
        logger.error(err)
        reject(new Error('ubi server exception'))
      }
    })
  })
}

