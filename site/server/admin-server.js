var path = require('path')
const express = require('express')
var bodyParser = require('body-parser')
var database = require('./database/database.js')
const app = express()
var adminRouter = express.Router()
const request = require('request')
const jwt = require('jsonwebtoken')
const config = require('./config.js')
var cookieParser = require('cookie-parser')
var fs = require('fs')
const multer = require('multer')
const upload = multer({
  dest: __dirname + '/images'
})
const rp = require('request-promise')
// var certificate = fs.readFileSync('../client-key.pem').toString();

module.exports = {
  adminRouter: adminRouter
}

adminRouter.use(express.static(path.join(__dirname, '../public')))
adminRouter.use(cookieParser())
adminRouter.use(bodyParser.json())

adminRouter.use('/styles', express.static(__dirname + '/styles'))

adminRouter.use(async function (req, res, next) {
  if (req.method != 'POST' && req.url != '/admin/login' && req.url != '/admin/logout') {
    let alias = await database.getCurrentUser(req, res).then(res => {
      return res
    })
    if (alias != 'Unsuccessful') {
      next()
    } else {

    }
  } else {
    next()
  }
})

adminRouter.post('/admin/deleteSnippetContent/', async function (req, res) {
  console.log('server: Forwarding snippet id:', req.body.contentid)
  await database.deleteSnippetContent(req.body.contentid, req, res).then(result => {
    return result
  })
  res.render('adminSnippets')
})

adminRouter.post('/admin/sendSnippetToUser/', async function (req, res) {
  console.log('server: Forwarding snippet id:', req.body.contentid, req.body.userid)
  await database.sendSnippetToUser(req.body.contentid, req.body.userid, req, res).then(result => {
    return result
  })
  res.render('adminSnippets')
})

adminRouter.get('/admin/index', async function (req, res) {
  console.log('Gets HEre')
  res.render('adminIndex', {
    user: 'Admin'
  })
})

adminRouter.get('/admin/stats', async function (req, res) {
  var clientVariables = {}
  clientVariables.snippetcontents = []
  // Need to load snippet data from the database to display on the page.
  // For each snippet, retrieve the snippet content ID.
  // snippets.forEach(async function (entry, index) {
  await database.getTop10Snippets().then(async function (snippets) {
    // snippets = snippets[0]
    // console.log(snippets)
    for (var snip in snippets) {
      // console.log(snippets[snip])
      // Retrieve the snippet content.
      console.log('server: Rendering receive, snippetcontent.id: ', snippets[snip])
      let username = await database.getUsernameViaRedirect(snippets[snip].sender).then(res => {
        return res[0].username
      })
      clientVariables.snippetcontents.push({
        'description': snippets[snip].description,
        'content': snippets[snip].content,
        'id': snippets[snip].id,
        'forwardcount': snippets[snip].forwardcount,
        'username': username
      })
    }
    setTimeout(function () {
      res.render('adminStats', clientVariables)
    }, 100)
  })
})

adminRouter.get('/admin/snippets', async function (req, res) {
  console.log('Gets HEre!!')
  await renderReceive(req, res)
})

adminRouter.get('/admin/logout', async function (req, res) {
  res.cookie('currentUser', '')
  res.render('login')
})

adminRouter.post('/admin/reportSnippet/', async function (req, res) {
  console.log('Reporting snippet', req.body.contentid)
  await database.reportSnippet(req.body.contentid, req, res, false).then(response => {
    return response
  })
  res.render('adminSnippets')
})

async function renderReceive (req, res) {
  var clientVariables = {}
  clientVariables.snippetcontents = []
  clientVariables.users = []
  // Need to load snippet data from the database to display on the page.
  await database.getAllSnippetContents().then(async function (snippets) {
    if (snippets == null || snippets.length == 0) {
      res.render('adminSnippets', {
        noSnippetMessage: 'You currently don\'t have any snippets!'
      })
    }
    // For each snippet, retrieve the snippet content ID.
    // snippets.forEach(async function (entry, index) {
    for (var snip in snippets) {
      // Retrieve the snippet content.
      console.log('server: Rendering receive, snippetcontent.id: ', snippets[snip].id)
      let username = await database.getUsernameViaRedirect(snippets[snip].sender).then(res => {
        return res[0].username
      })
      clientVariables.snippetcontents.push({
        'description': snippets[snip].description,
        'content': snippets[snip].content,
        'id': snippets[snip].id,
        'parentid': snippets[snip].id,
        'reported': snippets[snip].report,
        'username': username
      })
    }
  })
  await database.getAllUsers().then(async function (users) {
    console.log(users)
    if (users == null || users.length == 0) {
      res.render('adminSnippets', {
        noSnippetMessage: 'You currently don\'t have any users!'
      })
    }
    // For each snippet, retrieve the snippet content ID.
    // users.forEach(async function (entry, index) {
    for (var user in users) {
      // Retrieve the snippet content.
      console.log('server: Rendering receive, snippetcontent.id: ', users[user].id)
      clientVariables.users.push({
        'username': users[user].username,
        'id': users[user].id
      })
    }
  })
  setTimeout(function () {
    res.render('adminSnippets', clientVariables)
  }, 100)
}
