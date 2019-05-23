var Chart = require('chart.js');
var Color = require('color');

// var ctx = document.getElementById('graph').getContext('2d');
// window.onload = function () {
//     var red = Color.rbg(255, 0, 0),
//         green = Color.rbg(0, 0, 255),
//         blue = Color.rbg(0, 255, 0)
//     var ctx = document.getElementById("graph").getContext('2d')
//     // let data = {
//     //     labels: ["red", "green", "blue"],
//     //     datasets: [{
//     //         label: 'Number of votes',
//     //         data: [1, 1, 1],
//     //         backgroundColor: [red, green, blue],
//     //         borderColor: [green, blue, red],
//     //         borderWidth: 1
//     //     }],
//     // }
//     // var chart = new Chart(ctx).Pie(pieData)
//     var chart = new Chart(ctx, {
//         type: 'pie',
//         data: {
//             labels: ["red", "green", "blue"],
//             datasets: [{
//                 label: 'Number of votes',
//                 data: [1, 1, 1],
//                 backgroundColor: [red, green, blue],
//                 borderColor: [green, blue, red],
//                 borderWidth: 1
//             }],
//         },
//         options: {
//             title: {
//                 display: true,
//                 text: "chart",
//             },
//             legend: {
//                 position: 'bottom'
//             },
//         }
//     })
// };