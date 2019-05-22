var path = require('path')
const sqlite3 = require('sqlite3').verbose()
const dbPath = path.resolve(__dirname, '../database/database.db')
const testsDbPath = path.resolve(__dirname, '../database/tests-database.db')
const bcrypt = require('bcrypt')
const saltRounds = 10
var Cookies = require('cookies')
const jwt = require('jsonwebtoken')
const config = require('./config.js')
var crypto = require('crypto')
// The functions exported here should only allow the transferral of nonsensitive information; login
// details should be strictly monitored, as well as access to redirects.
module.exports = {
  hashEntry: hashEntry,
  compareHash: compareHash,
  checkPassword: checkPassword,

  createUser: createUser,
  getUserData: getUserData,
  updateUserPassword: updateUserPassword,
  removeUser: removeUser,
  getUserByUsername: getUserByUsername,
  getUserByAlias: getUserByAlias,
  getCurrentUser: getCurrentUser,

  createRedirect: createRedirect,
  getRedirect: getRedirect,
  sqlGet: sqlGet,
  removeRedirect: removeRedirect,
  getRedirectViaAlias: getRedirectViaAlias,

  getSnippet: getSnippet,
  removeSnippet: removeSnippet,
  createSnippet: createSnippet,
  forwardSnippet: forwardSnippet,
  deleteSnippet: deleteSnippet,
  getSnippetContent: getSnippetContent,
  removeSnippetContent: removeSnippetContent,
  sendImageToRandomUsers: sendImageToRandomUsers
}

let db = connectDatabase()

// Connect to the database
function connectDatabase(testMode = false) {
  return new sqlite3.Database(testMode ? testsDbPath : dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error('ERROR while connecting database ' + err.message)
    }
  })
}

// Close the database connection.
function closeDatabase(db) {
  db.close((err) => {
    if (err) {
      return console.error(err.message)
    }
  })
}

// Hashes given input.
async function hashEntry(entry) {
  return bcrypt.hashSync(entry, saltRounds)
}

// Compares the hash and plaintext of inputs.
async function compareHash(plaintext, hash) {
  return await bcrypt.compareSync(plaintext, hash)
}

/// ///////////////////////////////////////////////
// Generalised Wrappers. Not to be made public.
/// ///////////////////////////////////////////////
// Generic SQL instruction that returns whatever is returned by the query.
function sqlGet(sqlCode, lookup, testMode = false) {
  // let db = connectDatabase(testMode)
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.all(sqlCode, lookup, function (err, result) {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
      // closeDatabase(db)
    })
  })
}

// Generic SQL instruction that returns whatever the new ID inserted is.
function sqlPut(sqlCode, sqlData, testMode = false) {
  // var db = connectDatabase(testMode)
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.run(sqlCode, sqlData, function (err, result) {
        if (err) {
          reject(err)
        } else {
          resolve(this.lastID)
        }
      })
      // closeDatabase(db)
    })
  })
}

// Generic SQL instruction that returns whatever the new ID inserted is.
function sqlDelete(sqlCode, sqlData, testMode = false) {
  // var db = connectDatabase(testMode)
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.run(sqlCode, sqlData, function (err, result) {
        if (err) {
          reject(err)
        } else {
          resolve(this.lastID)
        }
      })
      // closeDatabase(db)
    })
  })
}

// Returns a random entry from the table specified.
function sqlGetRandom(table, testMode = false) {
  var sqlCode = 'SELECT * FROM ' + table + ' ORDER BY RANDOM() LIMIT 1'
  // var db = connectDatabase(testMode)
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.all(sqlCode, function (err, result) {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
      // closeDatabase(db)
    })
  })
}



/// ///////////////////////////////////////////////
// Login Related Calls.
/// ///////////////////////////////////////////////

async function checkPassword(hash, original, salt) {
  return await compareHash(original + salt, hash)
}

async function createLoginUser(username, password, salt, redirectid, testMode = false) {
  var sqlData = [username, password, salt, redirectid]
  var sqlCode = 'INSERT INTO login (username, password, salt, redirectid) VALUES (?, ?, ?, ?)'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function updateUserPassword(loginid, newPassword, testMode = false) {
  var salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 7)
  newPassword = hashEntry(newPassword + salt)
  var sqlData = [newPassword, loginid]
  var sqlCode = 'UPDATE login SET password = ? WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function removeUser(loginid, testMode = false) {
  var sqlData = [loginid]
  var sqlCode = 'DELETE FROM login WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

/// ///////////////////////////////////////////////
// User Related Calls.
/// ///////////////////////////////////////////////

async function getCurrentUser(req, res) {
  try {
    var token = new Cookies(req, res).get('currentUser')
    let decoded = jwt.verify(token, config.secret)
    return decoded.data
  } catch (err) {
    return "Unsuccessful"
  }
}

// Retrieves a user's login data given their username.
// TODO: Remove this and compare hashes directly without returning full user data.
async function getUserData(username, testMode = false) {
  var sqlCode = 'SELECT * FROM Login WHERE username = ?'
  return await sqlGet(sqlCode, username, testMode)
}

async function createUser(username, password, testMode = false) {
  // This will eventually have the functionality to create all rows relevant to user
  // In each table

  // This can change if there's another way of doing this that we have
  // Generate alias of 6 characters
  var alias = Math.random().toString(36).substring(2, 7)
  var redirectID = await createRedirect(alias, 1)
  // This gets the salt of size 16
  var salt = Math.random().toString(17).substring(2, 17) + Math.random().toString(5).substring(2, 5)
  password = await hashEntry(password + salt)
  await createLoginUser(username, password, salt, redirectID)
  let snippet = await createSnippet('', 'Your Basic Snippet', redirectID)
  // await addSnippetToUser(redirectID, snippet.id)
}

async function getUserByUsername(username, testMode = false) {
  sqlCode = 'SELECT * FROM login WHERE username = ?'
  sqlData = username
  let result = await sqlGet(sqlCode, sqlData, testMode)
  if (result.length < 1) {
    return false
  }
  return true
}

async function getUserByAlias(alias, testMode = false) {
  let redirect = await getRedirectViaAlias(alias, testMode).then(res => {
    return res[0]
  })
  let sqlCode = 'SELECT * FROM login WHERE redirectid = ?'
  let username = await sqlGet(sqlCode, redirect.id, testMode).then(res => {
    return res[0].username
  })
  return username
}
/// ///////////////////////////////////////////////
// Redirect Related Calls.
/// ///////////////////////////////////////////////

async function createRedirect(alias, roleid, testMode = false) {
  var sqlData = [alias, '[]', roleid]
  var sqlCode = 'INSERT INTO redirect (alias, snippetids, roleid) VALUES (?, ?, ?)'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function getRedirect(redirectid, testMode = false) {
  var sqlCode = 'SELECT * FROM redirect WHERE id = ?'
  return await sqlGet(sqlCode, redirectid, testMode)
}

async function getRedirectViaAlias(alias, testMode = false) {
  var sqlCode = 'SELECT * FROM  redirect WHERE alias = ?'
  return await sqlGet(sqlCode, alias, testMode)
}


async function removeRedirect(redirectid, testMode = false) {
  var sqlData = [redirectid]
  var sqlCode = 'DELETE FROM redirect WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

/// ///////////////////////////////////////////////
// Snippet Related Calls.
/// ///////////////////////////////////////////////

async function addSnippetToUser(redirectid, snippetid, testMode = false) {
  var result = await getRedirect(snippetid, testMode).then(res => {
    return res[0]
  })
  var currentSnippets = result.snippetids
  currentSnippets = currentSnippets.substring(0, currentSnippets.length - 1)
  currentSnippets = currentSnippets + ', "' + redirectid + '"]'
  var sqlData = [redirectid, currentSnippets]
  var sqlCode = 'UPDATE snippetids FROM snippet WHERE redirectid = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function updateRedirectSnippetList(redirectid, snippetids, testMode = false) {
  var sqlData = [snippetids, redirectid]
  var sqlCode = 'UPDATE redirect SET snippetids = ? WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function deleteSnippet(index, req, res, testMode = false) {
  let alias = await getCurrentUser(req, res).then(res => {
    return res
  })
  let redirect = await getRedirectViaAlias(alias, testMode).then(res => {
    return res[0]
  })
  let snippetList = JSON.parse(redirect.snippetids)
  if (snippetList.length == 1) {
    snippetList = []
  } else {
    snippetList.splice(index, 1)
  }
  snippetList = JSON.stringify(snippetList)
  return await updateRedirectSnippetList(redirect.id, snippetList, testMode).then(res => {
    return res
  })

  // var sqlCode = 'DELETE FROM snippet WHERE id = ?'

  // return sqlPut(sqlCode, redirect.id, testMode)

}

async function getSnippet(snippetid, testMode = false) {
  var sqlCode = 'SELECT * FROM snippet WHERE id = ?'
  return await sqlGet(sqlCode, snippetid, testMode)
}

async function removeSnippet(snippetid, testMode = false) {
  var sqlData = [snippetid]
  var sqlCode = 'DELETE FROM snippet WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function createSnippet(content, description, redirectid, testMode = false) {
  // Retrieve the redirect corresponding to the redirectid.
  var fromRedirect = await getRedirect(redirectid, testMode).then(res => {
    return res[0]
  })
  // Create a new snippet content.
  var sqlCode = 'INSERT INTO snippetcontent (content, description, forwardcount) VALUES (?, ?, ?)'
  var snippetContentID = await sqlPut(sqlCode, [content, description, 0], testMode).then(res => {
    return res
  })
  // Create a new snippet with the content, belonging to the fromRedirect and from the fromRedirect.
  var sqlData = [snippetContentID, fromRedirect.id, fromRedirect.id, fromRedirect.alias]
  sqlCode = 'INSERT INTO snippet (contentid, redirectid, firstowner, previousowner) VALUES (?, ?, ?, ?)'
  var snippetID = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })

  // Append the snippet ID to the redirects list of owned redirect IDs.
  var snippetList = JSON.parse(fromRedirect.snippetids)
  snippetList.push(snippetID.toString())
  snippetList = JSON.stringify(snippetList)
  await updateRedirectSnippetList(fromRedirect.id, snippetList, testMode).then(res => {
    return res
  })
  return snippetID
}

async function forwardSnippet(index, req, res, testMode = false) {
  // Retrieve the current snippet.

  //Gets Current User  
  let alias = await getCurrentUser(req, res).then(res => {
    return res
  })
  //Gets the redirect of current user
  let fromRedirect = await getRedirectViaAlias(alias, testMode).then(res => {
    return res[0]
  })
  var snippetid = JSON.parse(fromRedirect.snippetids)
  snippetid = snippetid[index]
  var currentSnippet = await getSnippet(snippetid, testMode).then(res => {
    return res[0]
  })
  // Retrieve the redirect of two random users.
  //Ensuring that there are no duplicates
  var toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })

  while (toRedirect0.id == fromRedirect.id) {
    toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }

  var toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })

  while (toRedirect1.id == fromRedirect.id && toRedirect1.id == toRedirect0.id) {
    toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }
  await splitSnippet(currentSnippet, toRedirect0, toRedirect1)
  // Remove the snippet ID in the original redirects list of snippet IDs.
  snippetList = JSON.parse(fromRedirect.snippetids)
  if (snippetList.length == 1) {
    snippetList = []
  } else {
    snippetList.splice(index, 1)
  }
  snippetList = JSON.stringify(snippetList)
  await updateRedirectSnippetList(fromRedirect.id, snippetList, testMode).then(res => {
    return res
  })
  // Remove the original snippet
  // await removeSnippet(currentSnippet.id, testMode).then(res => {
  //   return res
  // })
  await updateForwardCount(currentSnippet.contentid, 2, testMode = false).then(res => {
    return res
  })
  return snippetid
}

async function sendImageToRandomUsers(data, res, req, testMode = false) {
  //Gets Current User
  let alias = await getCurrentUser(req, res).then(res => {
    return res
  })
  //Gets the redirect of current user
  let fromRedirect = await getRedirectViaAlias(alias, testMode).then(res => {
    return res[0]
  })
  // Retrieve the redirect of two random users.
  //Ensuring that there are no duplicates
  var toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })
  while (toRedirect0.id == fromRedirect.id) {
    toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }

  var toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })

  while (toRedirect1.id == fromRedirect.id && toRedirect1.id == toRedirect0.id) {
    toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }
  let snippetContent = await createSnippetContent(data.description, data.link, testMode).then(res => {
    return res
  })
  await createTwoSnippetsViaContent(snippetContent, fromRedirect, toRedirect0, toRedirect1, testMode).then(res => {
    return res
  })
}

async function createSnippetContent(description, url, testMode = false) {
  let sqlData = [url, description, 0]
  let sqlCode = 'INSERT INTO snippetcontent (content, description, forwardcount) VALUES (?, ?, ?)'
  return await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })

}

async function createTwoSnippetsViaContent(snippetContent, fromRedirect, redirect0, redirect1, testMode = false) {
  //Make the 2 new snippets using the current snippet
  //And the 2 redirects it is being assigned to
  var sqlData = [snippetContent, redirect0.id, fromRedirect.id, fromRedirect.id]
  sqlCode = 'INSERT INTO snippet (contentid, redirectid, firstowner, previousowner) VALUES (?, ?, ?, ?)'
  var snippetID0 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  var sqlData = [snippetContent, redirect1.id, fromRedirect.id, fromRedirect.id]
  sqlCode = 'INSERT INTO snippet (contentid, redirectid, firstowner, previousowner) VALUES (?, ?, ?, ?)'
  var snippetID1 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })

  // Append the snippet ID to each of the toRedirects list of snippet IDs.
  var snippetList = JSON.parse(redirect0.snippetids)
  snippetList.push(snippetID0.toString())
  snippetList = JSON.stringify(snippetList)
  await updateRedirectSnippetList(redirect0.id, snippetList, testMode).then(res => {
    return res
  })

  snippetList = JSON.parse(redirect1.snippetids)
  snippetList.push(snippetID1.toString())
  snippetList = JSON.stringify(snippetList)
  await updateRedirectSnippetList(redirect1.id, snippetList, testMode).then(res => {
    return res
  })
  return
}

async function splitSnippet(currentSnippet, redirect0, redirect1, testMode = false) {
  //Make the 2 new snippets using the current snippet
  //And the 2 redirects it is being assigned to
  var sqlData = [currentSnippet.contentid, redirect0.id, currentSnippet.firstowner, currentSnippet.redirectid]
  sqlCode = 'INSERT INTO snippet (contentid, redirectid, firstowner, previousowner) VALUES (?, ?, ?, ?)'
  var snippetID0 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  var sqlData = [currentSnippet.contentid, redirect1.id, currentSnippet.firstowner, currentSnippet.redirectid]
  sqlCode = 'INSERT INTO snippet (contentid, redirectid, firstowner, previousowner) VALUES (?, ?, ?, ?)'
  var snippetID1 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })

  // Append the snippet ID to each of the toRedirects list of snippet IDs.
  var snippetList = JSON.parse(redirect0.snippetids)
  snippetList.push(snippetID0.toString())
  snippetList = JSON.stringify(snippetList)
  await updateRedirectSnippetList(redirect0.id, snippetList, testMode).then(res => {
    return res
  })

  snippetList = JSON.parse(redirect1.snippetids)
  snippetList.push(snippetID1.toString())
  snippetList = JSON.stringify(snippetList)
  await updateRedirectSnippetList(redirect1.id, snippetList, testMode).then(res => {
    return res
  })
  return
}

/// ///////////////////////////////////////////////
// Snippet Content Related Calls.
/// ///////////////////////////////////////////////

async function getSnippetContent(snippetcontentid, testMode = false) {
  var sqlCode = 'SELECT * FROM snippetcontent WHERE id = ?'
  return await sqlGet(sqlCode, snippetcontentid, testMode)
}

async function updateForwardCount(snippetContentId, addition, testMode = false) {
  var snippetContent = await getSnippetContent(snippetContentId, testMode).then(res => {
    return res[0]
  })
  var sqlData = [(snippetContent.forwardcount + 2), snippetContent.id]
  var sqlCode = 'UPDATE snippetcontent SET forwardcount = ? WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function getSnippetByContentID(snippetcontentid, testMode = false) {
  var sqlCode = 'SELECT * FROM snippet WHERE contentid = ?'
  return await sqlGet(sqlCode, snippetcontentid, testMode)
}

async function removeSnippetContent(snippetcontentid, testMode = false) {
  var sqlData = [snippetcontentid]
  var sqlCode = 'DELETE FROM snippetcontent WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}