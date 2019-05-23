// var ctx = document.getElementById('graph').getContext('2d');
// var chart = new Chart(ctx, {
//     // The type of chart we want to create
//     type: 'line',

//     // The data for our dataset
//     data: {
//         labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//         datasets: [{
//             label: 'My First dataset',
//             backgroundColor: 'rgb(255, 99, 132)',
//             borderColor: 'rgb(255, 99, 132)',
//             data: [0, 10, 5, 2, 20, 30, 45]
//         }]
//     },

//     // Configuration options go here
//     options: {}
// });

var $ = function (id) {
    return document.getElementById(id)
}

function addOnClick() {
    var viable = true
    var counter = 0
    while (viable) {
        var rowID = 'select-' + counter
        var rowItem = $(rowID)
        console.log('Gets Here')
        if (rowItem != null) {
            // $('selected-description').animate = 'm-page scene_element scene_element--fadeinup'
            // Complexity here required to prevent rowItem from always being the final value of the loop.
            rowItem.onclick = ((item) => {
                return () => {
                    window.location += '/snippet/' + item
                    // var form = $('<form action="' + url + '" method="post">' +
                    //     '<input type="text" name="api_url" value="' + Return_URL + '" />' +
                    //     '</form>');
                    // $('body').append(form);
                    // form.submit()
                }
            })(counter)

            counter += 1
        } else {
            viable = false
        }
    }
}

addOnClick()