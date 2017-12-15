const axios = require('axios')
const moment = require('moment')
const crypto = require('crypto')
const qs = require('querystring')
const url = require('url')
const oapiHost = 'https://oapi.dingtalk.com'
const nonceStr = 'abcdef'
const ticketClient = require('../cache/TicketCache')
const signedUrl = 'http://demo.firstzhang.com'
const queryUrl = 'https://eco.taobao.com/router/rest'


class Auth {
  async setAuth (ctx, next) {
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
  }

  async getDiary (ctx, next) {
    let query = ctx.query
    const token = await fetchToken({corpid: query.corpid, corpsecret: query.corpsecret})
    query.session = token
    const reports = await fetchReports(query)
    ctx.body = {
      data: reports
    }
    await next()
  }
}

function fetchReports ({userid, template, startTime, endTime, session}) {
  const query = {
    method: 'dingtalk.corp.report.list',
    format: 'json',
    v: '2.0',
    cursor: 0,
    size: 20,
    timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
  }
  let params = Object.assign({}, query, {
    userid,
    session,
    template_name: template,
    start_time: startTime,
    end_time: endTime
  })
  if (!params.userid) {
    delete params.userid
  }
  if (!params.template_name) {
    delete params.template_name
  }
  params = qs.stringify(params)
  console.log(params)
  return axios.get(`${queryUrl}?${params}`).then(data => {
    data = data.data
    console.log(data)
    return data
  })
}
// 获取 ticket 缓存
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
// 设置 ticket 缓存
function setTicketCache (ticket, expires) {
  return ticketClient.setAsync('ticket', ticket, 'EX', expires).then(data => {
    console.log(data, 'set cache done!')
  })
}

// 获取 token
function fetchToken ({corpid, corpsecret}) {
  return axios.get(`${oapiHost}/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`).then(data => {
    if (!data.data.errcode) {
      console.log('fetchToken')
      return data.data.access_token
    }
  })
}
// 请求 ticket
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

// 免登签名算法
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

module.exports = new Auth()
