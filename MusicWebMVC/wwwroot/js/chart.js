const labels = @Html.Raw(Json.Serialize(ViewBag.MonthlyLabels));
const dataUsers = @Html.Raw(Json.Serialize(ViewBag.MonthlyUsers));
const dataVIPs = @Html.Raw(Json.Serialize(ViewBag.MonthlyVIPs));
const dataActive = @Html.Raw(Json.Serialize(ViewBag.MonthlyActive));

const ctx = document.getElementById('userChart').getContext('2d');
const userChart = new Chart(ctx, {
    type: 'line',
data: {
    labels: labels,
datasets: [
{
    label: 'Total Users',
data: dataUsers,
backgroundColor: 'rgba(70, 130, 250, 0.5)',
borderColor: 'rgba(70, 130, 250, 1)',
fill: true
            },
{
    label: 'VIP Users',
data: dataVIPs,
backgroundColor: 'rgba(255, 193, 7, 0.5)',
borderColor: 'rgba(255, 193, 7, 1)',
fill: true
            },
{
    label: 'Active Users',
data: dataActive,
backgroundColor: 'rgba(220, 53, 69, 0.5)',
borderColor: 'rgba(220, 53, 69, 1)',
fill: true
            }
]
    },
options: {
    responsive: true,
plugins: {
    legend: {position: 'bottom' }
        },
scales: {
    y: {beginAtZero: true }
        }
    }
});

