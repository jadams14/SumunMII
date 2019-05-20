var filereader = require('filereader'),
    FileReader = new filereader

(function () {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;
                    if (!f && c) return c(i, !0);
                    if (u) return u(i, !0);
                    var a = new Error("Cannot find module '" + i + "'");
                    throw a.code = "MODULE_NOT_FOUND", a
                }
                var p = n[i] = {
                    exports: {}
                };
                e[i][0].call(p.exports, function (r) {
                    var n = e[i][1][r];
                    return o(n || r)
                }, p, p.exports, r, e, n, t)
            }
            return n[i].exports
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o
    }
    return r
})()({
    1: [function (require, module, exports) {
        // Shorthand for getting elements by ID.
        var $ = function (id) {
            return document.getElementById(id)
        }

        var fileField = $('snippetFileInput')
        var fileBackground = $('snippetFileContainer')

        // When someone uploads a file, select the file being uploaded.
        fileField.addEventListener('change', (e) => {
            // The multiple field is not allowed, so the file will always be at the 0th index.
            var selectedFile = fileField.files[0]

            // Once the file has loaded, read it.
            var reader = new FileReader()
            reader.readAsDataURL(selectedFile)

            reader.onloadend = (e) => {
                fileBackground.style.backgroundImage = 'url(' + e.target.result + ')'
                console.log(reader.result)
                // Retreive the image dimensions then scale the upload box background from there.
                var img = new window.Image()
                img.src = reader.result
                img.onload = () => {
                    // If the image is wider than it is tall, then to maximise the area occupied set the 
                    // width to the width of the divider and the height to the maxium height while keeping
                    // the correct aspect ratio. Do the opposite if the image is taller than it is wide.
                    if (img.width >= (img.height * 2.0)) {
                        fileBackground.style.height = (img.height / img.width * 400) + 'px'
                        fileBackground.style.width = 400
                    } else {
                        fileBackground.style.width = (img.width / img.height * 200) + 'px'
                        fileBackground.style.height = 200
                    }
                }
            }
            let image = fileField.toDataURL("image/png")
            // image.replace(/^data:image\/(png|jpg);base64,/, "")
            let description = $('description')
            $.ajax({
                Authorization: '14127dd4a0535dc',
                url: "https://api.imgur.com/3/upload",
                type: "POST",
                data: {
                    type: base64,
                    name: description + '.png',
                    title: description,
                    caption: description,
                    img: image
                },
                dataType: 'json'
            })
        })
    }, {}]
}, {}, [1]);