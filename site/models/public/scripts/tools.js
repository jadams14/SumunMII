const request = require('request')
const rp = require('request-promise')
module.exports = {
  colorblack: '#000000',
  colordark: '#2f4550',
  colorprimary: '#586f7c',
  colorlight: '#b8dbd9',
  colorwhite: '#f4f4f9',
  colorshadow: '#00000080',
  retrieveSnippetContent: retrieveSnippetContent,
  forwardSnippet: forwardSnippet,
  createSnippet: createSnippet,
  deleteSnippet: deleteSnippet,
  sendSnippetToUser: sendSnippetToUser,
  deleteSnippetContent: deleteSnippetContent,
  reportSnippet: reportSnippet
}

function retrieveSnippetContent (id, _callback) {
  request('http://localhost:7000/snippetcontent/' + id, {
    json: true
  }, (err, res, body) => {
    if (err) {
      console.log('tools: error retrieving snippet content')
      return _callback(err)
    }
    return _callback(null, JSON.parse(JSON.stringify(body)))
  })
}

async function deleteSnippet (snippetid) {
  console.log('tools: deleting snippet', snippetid)
  var requestInfo = {
    uri: 'http://localhost:7000/receive/deleteSnippet/',
    body: JSON.stringify({
      snippetid: snippetid
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return rp(requestInfo).then(function (err, res) {
    if (err) {
      console.log('tools: error forwarding snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    return res.body
  })
}

async function sendSnippetToUser (contentid, userid) {
  console.log('tools: send snippet to user', contentid, userid)
  var requestInfo = {
    uri: 'http://localhost:7000/admin/sendSnippetToUser/',
    body: JSON.stringify({
      contentid: contentid,
      userid: userid
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return rp(requestInfo).then(function (err, res) {
    if (err) {
      console.log('tools: error forwarding snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    return res.body
  })
}

async function reportSnippet (contentid) {
  console.log('tools: deleting snippet content', contentid)
  var requestInfo = {
    uri: 'http://localhost:7000/reportSnippet/',
    body: JSON.stringify({
      contentid: contentid
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return rp(requestInfo).then(function (err, res) {
    if (err) {
      console.log('tools: error forwarding snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    return res.body
  })
}

async function deleteSnippetContent (contentid) {
  console.log('tools: deleting snippet content', contentid)
  var requestInfo = {
    uri: 'http://localhost:7000/admin/deleteSnippetContent/',
    body: JSON.stringify({
      contentid: contentid
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return rp(requestInfo).then(function (err, res) {
    if (err) {
      console.log('tools: error forwarding snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    return res.body
  })
}

async function forwardSnippet (snippetid) {
  console.log('tools: forwarding snippet', snippetid)

  var requestInfo = {
    uri: 'http://localhost:7000/forward-snippet/',
    body: JSON.stringify({
      snippetid: snippetid
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  return rp(requestInfo).then(function (err, res) {
    if (err) {
      console.log('tools: error forwarding snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    // res.render('/receive')
    return res.body
  })
}

async function createSnippet (content, description, redirectid, _callback) {
  console.log('tools: creating snippet content', content, 'with description', description, 'from redirect id', redirectid)

  var requestInfo = {
    uri: 'http://localhost:7000/create-snippet/',
    body: JSON.stringify({
      content: content,
      description: description,
      redirectid: redirectid
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  return rp(requestInfo).then(function (err, res) {
    if (err) {
      console.log('tools: error creating snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    return res.body
  })
}
