// logger utils
const argv = require('yargs').option('debug', {boolean: false}).argv;

let logger = null;
const tracer = require('tracer');
const logLevel = argv.log || 'info';
tracer.setLevel(logLevel);
if (argv.debug) {
    logger = tracer.console();
} else {
  logger = tracer.dailyfile({root:'./logs/', maxLogFiles: 10, allLogsFileName: 'bot'});
}

module.exports = logger;
