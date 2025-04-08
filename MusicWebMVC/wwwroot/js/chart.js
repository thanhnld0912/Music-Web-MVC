//const ctx = document.getElementById('my-chart-1');
//const a = document.getElementById('my-chart-2');
const b = document.getElementById('userChart').getContext('2d');

//new Chart(ctx, {
//    type: 'bar',  
//    data: {
//        labels: ['Song 1', 'Song 2', 'Song 3', 'Song 4', 'Song 5', 'Song 6'],
//        datasets: [{
//            label: '# of Votes',
//            data: [1200, 1900, 3000, 5000, 2000, 3000]
//        }]
//    },
//    options: {
//        responsive: true,
//    }
//});

//new Chart(a, {
//    type: 'polarArea',
//    data: {
//        labels: ['Song 1', 'Song 2', 'Song 3', 'Song 4', 'Song 5', 'Song 6'],
//        datasets: [{
//            label: '# of Votes',
//            data: [1200, 1900, 3000, 5000, 2000, 3000]
//        }]
//    },
//    options: {
//        responsive: true,
//    }
//});

const userChart = new Chart(b, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Active Users',
                data: [500, 450, 470, 600, 520, 550, 580, 640, 700, 800, 900, 1000],
                backgroundColor: 'rgba(70, 130, 250, 0.5)',
                borderColor: 'rgba(70, 130, 250, 1)',
                fill: true
            },
            {
                label: 'New Visitors',
                data: [150, 160, 180, 210, 200, 220, 250, 270, 290, 320, 350, 400],
                backgroundColor: 'rgba(255, 193, 7, 0.5)',
                borderColor: 'rgba(255, 193, 7, 1)',
                fill: true
            },
            {
                label: 'Subscribers',
                data: [200, 210, 220, 240, 260, 270, 280, 300, 320, 350, 400, 450],
                backgroundColor: 'rgba(220, 53, 69, 0.5)',
                borderColor: 'rgba(220, 53, 69, 1)',
                fill: true
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

function exportChart() {
    const a = document.createElement('a');
    a.href = userChart.toBase64Image();
    a.download = 'user-statistics-chart.png';
    a.click();
}