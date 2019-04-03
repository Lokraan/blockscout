import $ from 'jquery'
import Chart from 'chart.js'
import humps from 'humps'
import sassVariables from '../../css/app.scss'

const config = {
  type: 'line',
  responsive: true,
  data: {
    datasets: []
  },
  options: {
    legend: {
      display: false
    },
    scales: {
      xAxes: [{
        gridLines: {
          display: false,
          drawBorder: false
        },
        type: 'time',
        time: {
          unit: 'day',
          stepSize: 14
        }
      }],
      yAxes: [{
        id: 'tps',
        gridLines: {
          display: false,
          drawBorder: false
        },
        ticks: {
          beginAtZero: true,
          callback: (value, index, values) => `${value}`,
          maxTicksLimit: 4
        }
      }, {
        id: 'tpd',
        position: 'right',
        gridLines: {
          display: false,
          drawBorder: false
        },
        ticks: {
          callback: (value, index, values) => '',
          maxTicksLimit: 6,
          drawOnChartArea: false
        }
      }]
    },
    tooltips: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: ({datasetIndex, yLabel}, {datasets}) => {
          const label = datasets[datasetIndex].label
          if (datasets[datasetIndex].yAxisID === 'tps') {
            return `${label}: ${yLabel}`
          } else if (datasets[datasetIndex].yAxisID === 'tpd') {
            return `${label}: ${yLabel}`
          } else {
            return yLabel
          }
        }
      }
    }
  }
}

function sameDay (d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function getTpsData (tpdData) {
  const today = new Date()
  return tpdData.map(({ date, transactions }) =>
    ({
      x: date,
      y: sameDay(date, today) ? (transactions / 86400) : transactions / (new Date(date).getHours - today.getHours)
    }))
}

function getTpdData (tpdData) {
  return tpdData.map(({ date, transactions }) => ({x: date, y: transactions}))
}

class TransactionHistoryChart {
  constructor (el, tpdData) {
    this.tps = {
      label: window.localized['TPS'],
      yAxisID: 'tps',
      data: getTpsData(tpdData),
      fill: false,
      pointRadius: 0,
      backgroundColor: sassVariables.primary,
      borderColor: sassVariables.primary,
      lineTension: 0
    }
    this.tpd = {
      label: window.localized['TPD'],
      yAxisID: 'tpd',
      data: getTpdData(tpdData),
      fill: false,
      pointRadius: 0,
      backgroundColor: sassVariables.secondary,
      borderColor: sassVariables.secondary,
      lineTension: 0
    }
    config.data.datasets = [this.tps, this.tpd]
    this.chart = new Chart(el, config)
  }
  update (tpdData) {
    this.tpd.data = getTpdData(tpdData)
    this.tps.data = getTpsData(tpdData)
    this.chart.update()
  }
}

export function createTransactionHistoryChart (el) {
  const dataPath = el.dataset.history_chart_path
  const $chartLoading = $('[data-chart-loading-message]')
  const $chartError = $('[data-chart-error-message]')
  const chart = new TransactionHistoryChart(el, 0, [])
  $.getJSON(dataPath, {type: 'JSON'})
    .done(data => {
      const tpdData = humps.camelizeKeys(JSON.parse(data.tpd_data))
      $(el).show()
      chart.update(tpdData)
    })
    .fail(() => {
      $chartError.show()
    })
    .always(() => {
      $chartLoading.hide()
    })
  return chart
}

$('[data-chart-error-message]').on('click', _event => {
  $('[data-chart-loading-message]').show()
  $('[data-chart-error-message]').hide()
  createTransactionHistoryChart($('[data-chart="transactionHistoryChart"]')[0])
})
