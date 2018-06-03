/*
* Created By Gareth on 03/06/2018 19:00 using WebStorm
* Project: pm2-grafana-influxdb-metrics file config
* Licence:
* */

module.exports = {
    pm2: {
        idsToMonitor: []
    },
    influx: {
        enabled: true, // Set to false to disable
        protocol: 'http', // Set to http or https
        host: 'wolf.gaz492.uk',
        port: 8086,
        database: 'ftbw_testing',
        username: 'ftbw',
        password: ''
    }
};