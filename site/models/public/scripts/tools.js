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
  sendImage: sendImage
}

function retrieveSnippetContent(id, _callback) {
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

async function getDataUri(img, callback) {
  // var image = new canvas;

  // image.onload = function () {
  var canvas = document.createElement('canvas');
  var dataURL = canvas.toDataURL(img, 1.0).replace(/^data:image\/(png|jpg);base64,/, '')
  // canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
  // canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

  // canvas.getContext('2d').drawImage(this, 0, 0);

  // Get raw image data
  callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
  // callback(dataURL)
  // ... or get as Data URI
  // callback(canvas.toDataURL('image/png'));
  // };

  // image.src = url;
}

async function sendImage(img, fileName, _callback) {
  // let image = await getDataUri(img, function (dataUri) {
  //   return dataUri
  // })
  console.log(img)
  var requestInfo = {
    uri: 'https://api.imgur.com/3/upload',
    body: JSON.stringify({
      image: img,
      type: 'base64',
      name: fileName,
    }),
    method: 'POST',
    headers: {
      'Authorization': 'Client-ID 14127dd4a0535dc',
      'Content-Type': 'application/json',
    }
  }
  console.log("Image", img)

  console.log("requestInfo", requestInfo)
  request(requestInfo, (err, res, body) => {
    if (err) {
      console.log('tools: error forwarding snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', body)
    return body
  })
}

async function deleteSnippet(snippetid, _callback) {
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

  await rp(requestInfo).then(async function (err, res) {
    if (err) {
      console.log('tools: error forwarding snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    return res.body
  })
}

async function forwardSnippet(snippetid, _callback) {
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
  await rp(requestInfo).then(function (err, res) {
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

async function createSnippet(content, description, redirectid, _callback) {
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
  await rp(requestInfo).then(function (err, res) {
    if (err) {
      console.log('tools: error creating snippet')
      return false
    }
    console.log('tools: error to client: ', err)
    console.log('tools: body response to client: ', res.body)
    return res.body
  })
}