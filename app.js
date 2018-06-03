/*
* Created By Gareth on 03/06/2018 19:03 using WebStorm
* Project: pm2-grafana-influxdb-metrics file app
* Licence: 
* */

const pm2 = require('pm2');
const Influx = require('influx');
const moment = require('moment');
const momentDurationFormatSetup = require("moment-duration-format");

const config = require('./config/config');
const os = require('os');

const influx = new Influx.InfluxDB({
    host: config.influx.host,
    port: config.influx.port,
    database: config.influx.database,
    username: config.influx.username,
    password: config.influx.password,
    schema: [
        {
            measurement: 'pm2_stats',
            fields: {
                memory: Influx.FieldType.FLOAT,
                cpu: Influx.FieldType.FLOAT,
                uptime: Influx.FieldType.STRING,
                status: Influx.FieldType.STRING
            },
            tags: [
                'host',
                'process_id',
                'process_name'
            ]
        },
    ]
});

function formatBytes(bytes, decimals) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

setInterval(() => {
    pm2.connect(function (err) {
        if (err) {
            console.error(err);
            process.exit(2);
        }

        pm2.list((err, details) => {
            details.forEach(process => {
                const pm_id = process.pm_id;
                const pm_name = process.name;
                const pm_cpu = process.monit.cpu;
                const pm_memory = process.monit.memory;
                const pm_uptime = moment.duration(Math.ceil((Date.now() - process.pm2_env.pm_uptime)), 'milliseconds').format('D[d] HH:mm:ss');
                let pm_status;
                if (process.pm2_env.status.toLowerCase() === 'online') {
                    pm_status = 0;
                } else if (process.pm2_env.status.toLowerCase() === 'offline' || process.pm2_env.status.toLowerCase() === 'stopped') {
                    pm_status = 2;
                } else {
                    pm_status = 1;
                }

                influx.writePoints([
                    {
                        measurement: 'pm2_stats',
                        tags: {host: os.hostname(), process_id: pm_id, process_name: pm_name},
                        fields: {
                            cpu: pm_cpu,
                            memory: pm_memory,
                            uptime: pm_uptime,
                            status: pm_status
                        }
                    }
                ]).catch(err => {
                    console.error(`Error saving data to InfluxDB! ${err.stack}`)
                })
            });
            pm2.disconnect()
        });
    });
}, 5000);

/**
 * Now, we'll make sure the database exists and boot the app.
 */
influx.getDatabaseNames()
    .then(names => {
        if (!names.includes(config.influx.database)) {
            console.log(`InfluxDB Creating Database: ${config.influx.database}`);
            return influx.createDatabase(config.influx.database)
        } else {
            console.log(`InfluxDB Database: ${config.influx.database} already exists`);
        }
    })
    .catch(err => {
        console.error(`Error creating Influx database!`);
        console.error(err)
    });