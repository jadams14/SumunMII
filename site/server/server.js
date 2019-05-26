var database = require('./database/database.js')
var adminServer = require('./admin-server.js')
var path = require('path')
const express = require('express')
var bodyParser = require('body-parser')
const app = express()
var router = express.Router()
const request = require('request')
const jwt = require('jsonwebtoken')
const config = require('./config.js')
var cookieParser = require('cookie-parser')
var fs = require('fs')
const multer = require('multer')
const upload = multer({
  dest: __dirname + '/images'
})
var https = require('https')
const rp = require('request-promise')
// var certificate = fs.readFileSync('../client-key.pem').toString();
module.exports = {
  connectToServer: connectToServer,
  generateJWT: generateJWT,
  verifyUserViaAlias: verifyUserViaAlias
}
connectToServer()

// ***************** Authentication Middleware **************** //
// This is what every request to the server will have to go through first
// Before it can get through to it's respective request

// Enables REST communication with server.
app.use(bodyParser.urlencoded({
  extended: true
}))
app.set('views', path.join(__dirname, '../models/public'))
app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, '../public')))
app.use(cookieParser())
app.use(bodyParser.json())
// Used to check current user against the cookie token

async function connectToServer() {
  https.createServer({
    key: fs.readFileSync(__dirname + '/credentials/server.key'),
    cert: fs.readFileSync(__dirname + '/credentials/server.cert')
  }, app).listen(7000, 'localhost', () => {
    console.log('server: Express running → localhost:7000')
  })
}

router.use(async function (req, res, next) {
  console.log(req.method, req.url)
  if (req.method != "POST" && req.url != "/login" && req.url != "/logout") {
    let alias = await database.getCurrentUser(req, res).then(res => {
      console.log("GEts HEre!", res)
      return res
    })
    if (alias != 'Unsuccessful') {
      console.log("GEts HEre")
      next()
    } else {
      console.log("GEts HEre!!")
    }
  } else {
    next()
  }
})

/// ///////////////////////////////////////////////
// Non page requests.
/// ///////////////////////////////////////////////

router.post('/receive/deleteSnippet/', async function (req, res) {
  console.log('This is the id:', req.body.snippetid)
  await database.deleteSnippet(req.body.snippetid, req, res, false).then(response => {
    return response
  })
  res.render('receive')
})

router.get('/logout', (req, res) => {
  res.cookie('currentUser', '')
  res.render('login')
})

router.get('/snippetcontent/:id', async function (req, res) {
  console.log('server: Retrieving snippet content with id:', req.params.id)
  await database.getSnippetContent(req.params.id).then(response => {
    res.send(JSON.stringify(response[0]))
  })
})

router.post('/forward-snippet/', async function (req, res) {
  console.log('server: Forwarding snippet id:', req.body.snippetid)
  await database.forwardSnippet(req.body.snippetid, req, res).then(result => {
    return result
  })
  res.render('receive')
})

router.post('/create-snippet/', async function (req, res) {
  console.log('server: Creating snippet with content:', req.body.content, 'description:', req.body.description, 'redirectid:', req.body.redirectid)
  let snippetid = await database.createSnippet(req.body.content, req.body.description, req.body.redirectid).then(res => {
    return res
  })
  await database.addSnippetToList(req.body.redirectid, snippetid)
})

/// ///////////////////////////////////////////////
// Page requests.
/// ///////////////////////////////////////////////
router.get('/index', async function (req, res) {
  console.log("GEts Heres")
  let alias = await database.getCurrentUser(req, res).then(res => {
    return res
  })
  console.log("GEts Heres", alias)
  let username = await database.getUserByAlias(req, res).then(res => {
    return res
  })
  console.log("GEts Heres", username)
  res.render('index', {
    user: username
  })
})

router.get('/register', function (req, res) {
  res.render('register')
})

router.get('/send', async function (req, res) {
  let alias = await database.getCurrentUser(req, res).then(res => {
    return res
  })
  let username = await database.getUserByAlias(req, res).then(res => {
    return res
  })
  res.render('send', {
    from: username
  })
})

// The next 2 requests include the authentication
// Of the current user
router.get('/', async function (req, res) {
  try {
    let alias = await database.getCurrentUser(req, res).then(res => {
      return res
    })
    verifyUserViaAlias(res, res, alias)
  } catch (e) {
    res.render('login')
  }
})

router.get('/login', async function (req, res) {
  // if (config.loggedOut == true) {
  //   res.render('login')
  // }
  try {
    let alias = await database.getCurrentUser(req, res).then(res => {
      return res
    })
    verifyUserViaAlias(res, res, alias)
  } catch (e) {
    res.render('login')
  }
})

router.get('/receive', async function (req, res) {

  await renderReceive(req, res)
})

router.get('/stats/snippets/:index', async function (req, res) {

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
      res.render('stats', clientVariables)
    }, 100)
  })
})


router.get('/stats', async function (req, res) {

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
      res.render('stats', clientVariables)
    }, 100)
  })
})


router.post('/send', upload.single('fileupload'), async function (req, res) {
  const directoryPath = path.join(__dirname, 'images')
  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      return console.log('Unable to scan directory', directoryPath)
    }
    files.forEach(function (file) {
      fs.readFile(directoryPath + '/' + file, async function (err, data) {
        if (err) {
          console.log(err)
        } else {
          var base64 = data.toString('base64')
          res.render('send')
          let resultData = await uploadImage(base64, req.body.title).then(response => {
            return JSON.parse(response)
          })
          await database.sendSnippetToRandomUsers(resultData.data, res, req, false).then(response => {})
        }
      })
      // tools.sendImage(file.toString('base64'))
      fs.unlink(directoryPath + '/' + file, function (err) {
        if (err) {
          console.log(err)
        }
      })
    })
  })
})

// Login authentication
// Gets the username and password of input and calls authentication function
router.post('/login', async function (req, res) {
  var username = req.body.username
  var password = req.body.password
  if (req.body.button === 'login') {
    if (username === '' || password === '') {
      res.render('login', {
        lMessage: 'Please Enter Username and/or Password!'
      })
    }
    await authenticate(res, req, username, password)
  } else if (req.body.button == 'register') {
    res.redirect('register')
  }
})

router.post('/receive', async function (req, res) {
  await database.deleteSnippet(req.body.snippetid, req, res, false).then(response => {
    return response
  })
  if (req.body.button == 'trash-it') {

  } else if (req.body.button == 'forward-it') {
    await database.forwardSnippet(req.body.snippetid, req, res).then(res => {
      return res
    })
  }
})



router.post('/register', async function (req, res) {
  var username = req.body.username
  var password = req.body.password
  var confirmPassword = req.body.confirmPassword
  var regex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')
  if (req.body.button === 'register') {
    if (username === '' || password === '' || confirmPassword === '') {
      res.render('register', {
        rMessage: 'Please Enter Username, Password and/or Confirm Your Password!'
      })
    } else if (password === confirmPassword &&
      (await database.getUserByUsername(username) === false)) {
      console.log(password)
      if (regex.test(password)) {
        await database.createUser(username, password)
        console.log("Gets Here!!")
        res.render('login', {
          lMessage: 'Please Login Using Your New Credentials!'
        })
      } else {
        console.log("Gets Here!")
        res.render('register', {
          rMessage: 'Passwords must be between 8 and 16 characters, require atleast 1 special character, number, uppercase and a lower case letter!'
        })
      }
    }
  } else if (req.body.button == 'cancel') {
    res.redirect('/login')
  }
})

async function uploadImage(img, fileName) {
  // let image = await getDataUri(img, function (dataUri) {
  //   return dataUri
  // })
  var requestInfo = {
    uri: 'https://api.imgur.com/3/upload',
    body: JSON.stringify({
      image: img,
      type: 'base64',
      name: fileName,
      title: fileName,
      description: fileName

    }),
    method: 'POST',
    headers: {
      'Authorization': 'Client-ID 14127dd4a0535dc',
      'Content-Type': 'application/json'
    }
  }
  let result = await rp(requestInfo).then(response => {
    return response
  })
  return result
}

async function renderReceive(req, res) {
  console.log("Gets HEre")
  var clientVariables = {}
  clientVariables.snippetcontents = []
  let alias = await database.getCurrentUser(req, res).then(res => {
    return res
  })
  // Need to load snippet data from the database to display on the page.
  await database.getRedirectViaAlias(alias).then(async function (redirect) {
    redirect = redirect[0]
    var snippets = JSON.parse(redirect.snippetids)
    if (snippets == null || snippets.length == 0) {
      res.render('receive', {
        noSnippetMessage: 'You currently don\'t have any snippets!'
      })
    }
    // For each snippet, retrieve the snippet content ID.
    // snippets.forEach(async function (entry, index) {
    for (var snip in snippets) {
      await database.getSnippet(snippets[snip]).then(async function (snippet) {
        snippet = snippet[0]
        // Retrieve the snippet content.
        await database.getSnippetContent(snippet.contentid).then(snippetcontent => {
          console.log(snippetcontent)
          snippetcontent = snippetcontent[0]
          console.log('server: Rendering receive, snippetcontent.id: ', snippetcontent.id)
          clientVariables.snippetcontents.push({
            'description': snippetcontent.description,
            'content': snippetcontent.content,
            'id': snippetcontent.id,
            'parentid': snippet.id
          })
        })
      })
    }
    setTimeout(function () {
      res.render('receive', clientVariables)
    }, 100)
  })
}

async function verifyUserViaAlias(res, req, alias) {
  await database.getRedirectViaAlias(alias, false).then(async function (result) {
    if (result.length > 0) {
      if (
        result[0].alias === alias
      ) {
        if (result[0].roleid == 1) {
          let username = await database.getUserByAlias(alias, false).then(res => {
            return res
          })
          res.render('index', {
            user: username
          })
        } else if (result[0].roleid == 0) {
          res.render('adminIndex', {
            user: "Admin"
          })
        }
      } else {
        res.render('login')
      }
    } else {
      res.render('login')
    }
  })
}

// Authenticates username and password for login
async function authenticate(res, req, username, password) {
  // let sqlQuery = 'SELECT * FROM Login WHERE username = ?'
  // let sqlData = username
  console.log(username, password)
  await database.getUserData(username, false).then(async function (result) {
    if (result.length > 0) {
      if (
        result[0].username === username &&
        await database.checkPassword(result[0].password, password, result[0].salt)
      ) {
        await generateJWT(res, req, result[0].redirectid, 'currentUser')
        let role = await database.getRedirect(result[0].redirectid).then(res => {
          return res[0].roleid
        })
        if (role == 1) {
          res.render('index', {
            user: username
          })

        } else {
          res.render('adminIndex', {
            user: "Admin"
          })
        }
      } else {
        res.render('login', {
          lMessage: 'Wrong Username and/or Password!'
        })
      }
    } else {
      res.render('login', {
        lMessage: 'Wrong Username and/or Password!'
      })
    }
  })
}

async function generateJWT(res, req, redirectid, cookieName) {
  var alias = await database.getRedirect(redirectid).then(res => {
    return res[0].alias
  })
  var token = jwt.sign({
    data: alias
  }, config.secret, {
    expiresIn: config.expire
  }, {
    algorithm: 'RS256'
  })
  res.cookie(cookieName, token)
}

app.use('/', router)
app.use('/', adminServer.adminRouter)