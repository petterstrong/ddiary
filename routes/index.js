const router = require('koa-router')()
const axios = require('axios')
const crypto = require('crypto')
const url = require('url')
const oapiHost = 'https://oapi.dingtalk.com'
const nonceStr = 'abcdef'
// const ticketClient = require('../cache/TicketCache')
let signedUrl = 'http://demo.firstzhang.com'
let tickets = ''

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.use('/auth', async (ctx, next) => {
  // let tickets = await ticketClient.getAsync()
  let {corpid, corpsecret} = ctx.request.body
  let timeStamp = Date.now()
  let token
  let ticket
  if (!tickets) {
    token = await fetchToken({corpid, corpsecret})
    ticket = await fetchTicket(token)
  } else {
    ticket = tickets
  }

  let signature = sign({
    nonceStr,
    timeStamp,
    url: signedUrl,
    ticket
  })
  ctx.config = {
    signature,
    nonceStr,
    timeStamp,
    corpid
  }
  await next()
})

router.post('/auth', async (ctx, next) => {
  ctx.body = ctx.config
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

function fetchToken ({corpid, corpsecret}) {
  return axios.get(`${oapiHost}/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`).then(data => {
    if (!data.data.errcode) {
      console.log('fetchToken')
      return data.data.access_token
    }
  })
}

function fetchTicket (token) {
  return axios.get(`${oapiHost}/get_jsapi_ticket?access_token=${token}`).then(data => {
    if (!data.data.errcode) {
      console.log('fetchTicket')
      tickets = data.data.ticket
      return data.data.ticket
    }
  })
}

function sign(params) {
  let origUrl = params.url;
  let origUrlObj =  url.parse(origUrl);
  delete origUrlObj['hash'];
  let newUrl = url.format(origUrlObj);
  let plain = 'jsapi_ticket=' + params.ticket +
      '&noncestr=' + params.nonceStr +
      '&timestamp=' + params.timeStamp +
      '&url=' + newUrl;

  console.log(plain);
  let sha1 = crypto.createHash('sha1');
  sha1.update(plain, 'utf8');
  let signature = sha1.digest('hex');
  console.log('signature: ' + signature);
  return signature;
}

module.exports = router
