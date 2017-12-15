const router = require('koa-router')()
const Auth = require('../controllers/auth')

router.prefix('/api')

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.use('/auth', Auth.setAuth)
router.post('/auth', async (ctx, next) => {
  ctx.body = ctx.config
})

router.get('/diarys', Auth.getDiary)

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

module.exports = router
