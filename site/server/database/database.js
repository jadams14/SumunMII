var path = require('path')
const sqlite3 = require('sqlite3').verbose()
const dbPath = path.resolve(__dirname, '../../database/database.db')
const testsDbPath = path.resolve(__dirname, '../../database/tests-database.db')
const bcrypt = require('bcrypt')
const saltRounds = 10
var Cookies = require('cookies')
const jwt = require('jsonwebtoken')
const config = require('../config.js')
// The functions exported here should only allow the transferral of nonsensitive information; login
// details should be strictly monitored, as well as access to redirects.
module.exports = {
  hashEntry: hashEntry,
  compareHash: compareHash,
  checkPassword: checkPassword,

  createUser: createUser,
  getUserData: getUserData,
  updateUserPassword: updateUserPassword,
  getUserByUsername: getUserByUsername,
  getUserByAlias: getUserByAlias,
  getCurrentUser: getCurrentUser,
  getUsernameViaRedirect: getUsernameViaRedirect,
  getAllUsers: getAllUsers,
  removeUser: removeUser,

  sqlGetRandom: sqlGetRandom,
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
  getAllUserSnippets: getAllUserSnippets,
  reportSnippet: reportSnippet,
  splitSnippet: splitSnippet,

  getSnippetContent: getSnippetContent,
  removeSnippetContent: removeSnippetContent,
  getTop10Snippets: getTop10Snippets,
  sendSnippetToRandomUsers: sendSnippetToRandomUsers,
  getAllSnippetContents: getAllSnippetContents,
  deleteSnippetContent: deleteSnippetContent,
  sendSnippetToUser: sendSnippetToUser
}

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
let db = connectDatabase(false)

// Hashes given input.
async function hashEntry(entry) {
  return bcrypt.hashSync(entry, saltRounds)
}

// Compares the hash and plaintext of inputs.
async function compareHash(plaintext, hash) {
  return bcrypt.compareSync(plaintext, hash)
}

/// ///////////////////////////////////////////////
// Generalised Wrappers. Not to be made public.
/// ///////////////////////////////////////////////
// Generic SQL instruction that returns whatever is returned by the query.
async function sqlGet(sqlCode, lookup, testMode = false) {
  // var db = connectDatabase(testMode)
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
async function sqlPut(sqlCode, sqlData, testMode = false) {
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
async function sqlDelete(sqlCode, sqlData, testMode = false) {
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
async function sqlGetRandom(table, testMode = false) {
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
  return compareHash(original + salt, hash)
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

/// ///////////////////////////////////////////////
// User Related Calls.
/// ///////////////////////////////////////////////

async function getCurrentUser(req, res) {
  try {
    var token = new Cookies(req, res).get('currentUser')
    let decoded = jwt.verify(token, config.secret)
    return decoded.data
  } catch (err) {
    return 'Unsuccessful'
  }
}

// Retrieves a user's login data given their username.
// TODO: Remove this and compare hashes directly without returning full user data.
async function getUserData(username, testMode = false) {
  var sqlCode = 'SELECT * FROM Login WHERE username = ?'
  return sqlGet(sqlCode, username, testMode)
}

async function createUser(username, password, redirectID, testMode = false) {
  // This gets the salt of size 16
  var salt = Math.random().toString(17).substring(2, 17) + Math.random().toString(5).substring(2, 5)
  password = await hashEntry(password + salt)
  return createLoginUser(username, password, salt, redirectID, testMode)
}

async function getUserByUsername(username, testMode = false) {
  let sqlCode = 'SELECT * FROM login WHERE username = ?'
  let sqlData = username
  let result = await sqlGet(sqlCode, sqlData, testMode)
  if (result.length < 1) {
    return false
  }
  return true
}

async function getUserByAlias(alias, testMode = false) {
  let redirect = await getRedirectViaAlias(alias, testMode).then(result => {
    return result[0]
  })
  let sqlCode = 'SELECT * FROM login WHERE redirectid = ?'
  let username = await sqlGet(sqlCode, redirect.id, testMode).then(res => {
    return res[0].username
  })
  return username
}

async function getUsernameViaRedirect(redirectid, testMode = false) {
  var sqlCode = 'SELECT username FROM login WHERE redirectid = ?'
  return await sqlGet(sqlCode, redirectid, testMode).then(res => {
    return res
  })
}

async function getAllUsers(testMode = false) {
  var sqlCode = 'SELECT username, id FROM login ORDER BY id ASC'
  return await sqlGet(sqlCode, [], testMode).then(res => {
    return res
  })
}

async function removeUser(loginid, testMode = false) {
  var sqlData = [loginid]
  var sqlCode = 'DELETE FROM login WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}
/// ///////////////////////////////////////////////
// Redirect Related Calls.
/// ///////////////////////////////////////////////

async function createRedirect(alias, roleid, testMode = false) {
  var sqlData = [alias, roleid]
  var sqlCode = 'INSERT INTO redirect (alias, roleid) VALUES (?, ?)'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function getRedirect(redirectid, testMode = false) {
  var sqlCode = 'SELECT * FROM redirect WHERE id = ?'
  return await sqlGet(sqlCode, redirectid, testMode).then(res => {
    return res
  })
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

async function updateRedirectSnippetList(redirectid, snippetids, testMode = false) {
  var sqlData = [snippetids, redirectid]
  var sqlCode = 'UPDATE redirect SET snippetids = ? WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function deleteSnippet(index, req, res, testMode = false) {
  let sqlCode = 'DELETE FROM snippet WHERE id = ?'
  return await sqlPut(sqlCode, index, testMode)
}

async function getSnippet(snippetid, testMode = false) {
  var sqlCode = 'SELECT * FROM snippet WHERE id = ?'
  return await sqlGet(sqlCode, snippetid, testMode)
}

async function getAllUserSnippets(snippetid, testMode = false) {
  var sqlCode = 'SELECT * FROM snippet WHERE redirectid = ?'
  return await sqlGet(sqlCode, snippetid, testMode)
}

async function removeSnippet(snippetid, testMode = false) {
  var sqlData = [snippetid]
  var sqlCode = 'DELETE FROM snippet WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function reportSnippet(contentid, testMode = false) {
  var sqlData = [1, contentid]
  var sqlCode = 'UPDATE snippetcontent SET report = ? WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function createSnippet(content, description, redirectid, testMode = false) {
  // Retrieve the redirect corresponding to the redirectid.
  var fromRedirect = await getRedirect(redirectid, testMode).then(res => {
    return res[0]
  })
  // Create a new snippet content.
  var snippetContentID = await createSnippetContent(description, content, fromRedirect.id, testMode).then(res => {
    return res
  })
  var sqlData = [snippetContentID, fromRedirect.id, fromRedirect.alias]
  // Create a new snippet with the content, belonging to the fromRedirect and from the fromRedirect.
  let sqlCode = 'INSERT INTO snippet (contentid, redirectid, previousowner) VALUES (?, ?,  ?)'
  var snippetID = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  return snippetID
}

async function createSnippetAdmin(contentid, description, redirectid, testMode = false) {
  // Retrieve the redirect corresponding to the redirectid.
  var fromRedirect = await getSnippetContent(contentid, testMode).then(res => {
    return res[0]
  })

  var sqlData = [contentid, fromRedirect.id, fromRedirect.alias]
  // Create a new snippet with the content, belonging to the fromRedirect and from the fromRedirect.
  let sqlCode = 'INSERT INTO snippet (contentid, redirectid, previousowner) VALUES (?, ?,  ?)'
  var snippetID = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  return snippetID
}

async function forwardSnippet(snippetid, req, res, testMode = false) {
  // Gets Current User
  let alias = await getCurrentUser(req, res).then(res => {
    return res
  })
  // Gets the redirect of current user
  let fromRedirect = await getRedirectViaAlias(alias, testMode).then(res => {
    return res[0]
  })
  var currentSnippet = await getSnippet(snippetid, testMode).then(res => {
    return res[0]
  })
  // Retrieve the redirect of two random users.
  // Ensuring that there are no duplicates
  var toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })

  while (toRedirect0.id === fromRedirect.id) {
    toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }

  var toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })

  while (toRedirect1.id === fromRedirect.id && toRedirect1.id === toRedirect0.id) {
    toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }
  await splitSnippet(currentSnippet, toRedirect0, toRedirect1)
  await updateForwardCount(currentSnippet.contentid, 2, testMode = false).then(res => {
    return res
  })
  return await deleteSnippet(snippetid, req, res)
}

async function sendSnippetToRandomUsers(data, res, req, testMode = false) {
  // Gets Current User
  let alias = await getCurrentUser(req, res).then(res => {
    return res
  })
  // Gets the redirect of current user
  let fromRedirect = await getRedirectViaAlias(alias, testMode).then(res => {
    return res[0]
  })
  // Retrieve the redirect of two random users.
  // Ensuring that there are no duplicates
  var toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })
  while (toRedirect0.id === fromRedirect.id) {
    toRedirect0 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }

  var toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
    return res[0]
  })

  while (toRedirect1.id === fromRedirect.id && toRedirect1.id === toRedirect0.id) {
    toRedirect1 = await sqlGetRandom('redirect', testMode).then(res => {
      return res[0]
    })
  }
  let snippetContent = await createSnippetContent(data.description, data.link, fromRedirect.id, testMode).then(res => {
    return res
  })
  return await createTwoSnippetsViaContent(snippetContent, fromRedirect, toRedirect0, toRedirect1, testMode).then(res => {
    return res
  })
}

async function createSnippetContent(description, url, sender, testMode = false) {
  let sqlData = [url, description, 0, sender, 0]
  let sqlCode = 'INSERT INTO snippetcontent (content, description, forwardcount, sender, report) VALUES (?, ?, ?, ?, ?)'
  return await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
}

async function createTwoSnippetsViaContent(snippetContent, fromRedirect, redirect0, redirect1, testMode = false) {
  // Make the 2 new snippets using the current snippet
  // And the 2 redirects it is being assigned to
  var sqlData = [snippetContent, redirect0.id, fromRedirect.id]
  let sqlCode = 'INSERT INTO snippet (contentid, redirectid, previousowner) VALUES (?, ?, ?)'
  var snippetID0 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  sqlData = [snippetContent, redirect1.id, fromRedirect.id]
  sqlCode = 'INSERT INTO snippet (contentid, redirectid, previousowner) VALUES (?, ?, ?)'
  var snippetID1 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  return [snippetID0, snippetID1]
}

async function splitSnippet(currentSnippet, redirect0, redirect1, testMode = false) {
  // Make the 2 new snippets using the current snippet
  // And the 2 redirects it is being assigned to
  var sqlData = [currentSnippet.contentid, redirect0.id, currentSnippet.redirectid]
  let sqlCode = 'INSERT INTO snippet (contentid, redirectid, previousowner) VALUES (?, ?, ?)'
  var snippetID0 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  sqlData = [currentSnippet.contentid, redirect1.id, currentSnippet.redirectid]
  sqlCode = 'INSERT INTO snippet (contentid, redirectid, previousowner) VALUES (?, ?, ?)'
  var snippetID1 = await sqlPut(sqlCode, sqlData, testMode).then(res => {
    return res
  })
  return [snippetID0, snippetID1]
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

async function removeSnippetContent(snippetcontentid, testMode = false) {
  var sqlData = [snippetcontentid]
  var sqlCode = 'DELETE FROM snippetcontent WHERE id = ?'
  return await sqlPut(sqlCode, sqlData, testMode)
}

async function getTop10Snippets(testMode = false) {
  let sqlCode = 'SELECT * FROM snippetcontent ORDER BY forwardcount DESC LIMIT 10'
  return await sqlGet(sqlCode, [], testMode)
}

async function getAllSnippetContents(testMode = false) {
  let sqlCode = 'SELECT * FROM snippetcontent'
  return await sqlGet(sqlCode, [], testMode)
}

async function deleteSnippetContent(contentid, testMode = false) {
  let sqlCode = 'DELETE FROM snippetcontent WHERE id = ?'
  let result = await sqlPut(sqlCode, contentid, testMode).then(res => {
    return res
  })
  sqlCode = 'DELETE FROM snippet WHERE contentid = ?'
  return await sqlPut(sqlCode, contentid, testMode)
}

async function sendSnippetToUser(contentid, userid, testMode = false) {
  let snippetContent = await getSnippetContent(contentid, testMode).then(res => {
    return res[0]
  })
  let sqlData = [contentid, userid, snippetContent.sender]
  let sqlCode = 'INSERT INTO snippet (contentid, redirectid, previousowner) VALUES (?, ?, ?)'
  return await sqlPut(sqlCode, sqlData, testMode)
}