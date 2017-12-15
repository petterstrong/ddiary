const router = require('koa-router')()
const axios = require('axios')
const crypto = require('crypto')
const url = require('url')
const oapiHost = 'https://oapi.dingtalk.com'
const nonceStr = 'abcdef'
const ticketClient = require('../cache/TicketCache')
let signedUrl = 'http://demo.firstzhang.com'

router.prefix('/api')

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.use('/auth', async (ctx, next) => {
  let tickets = await getTicketCache()
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


function getTicketCache () {
  return ticketClient.getAsync('ticket').then(data => {
    if (data) {
      console.log('get cache')
      return data
    } else {
      return false
    }
  })
}

function setTicketCache (ticket, expires) {
  return ticketClient.setAsync('ticket', ticket, 'EX', expires).then(data => {
    console.log(data, 'set cache done!')
  })
}

function fetchToken ({corpid, corpsecret}) {
  return axios.get(`${oapiHost}/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`).then(data => {
    if (!data.data.errcode) {
      console.log('fetchToken')
      return data.data.access_token
    }
  })
}

function fetchTicket (token) {
  return axios.get(`${oapiHost}/get_jsapi_ticket?access_token=${token}`).then(async data => {
    if (!data.data.errcode) {
      console.log('fetchTicket')
      let ticket = data.data.ticket
      let expires = data.data.expires_in
      await setTicketCache(ticket, expires)
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
