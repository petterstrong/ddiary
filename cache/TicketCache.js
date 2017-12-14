const redis = require('redis')
const bluebird = require('bluebird')
bluebird.promisifyAll(redis.RedisClient.prototype)

const config = {
  db: 8,
  prefix: 'ticket: '
}
const ticket = redis.createClient(config)

ticket.on('connect', function () {
  console.log('cache - ticket connect')
});

ticket.on('error', function (err) {
  console.log('Error ' + err);
  debug('Error:' + err)
});

module.exports = ticket
