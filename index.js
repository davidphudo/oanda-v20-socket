'use strict';
/*
Environment           <Domain>
fxTrade               stream-fxtrade.oanda.com
fxTrade Practice      stream-fxpractice.oanda.com
sandbox               stream-sandbox.oanda.com
*/

/*
API documentation can be found here https://oanda-api-v20.readthedocs.io/
*/
require('dotenv').config();

// Replace the following variables with your personal ones
var domain = 'stream-fxtrade.oanda.com'
var access_token = process.env.APIKEY
var account_id = process.env.ACCOUNTID

/*
Add instruments from list found here: https://www.oanda.com/us-en/trading/instruments/
*/
var instrumentList = [
  'AUD_CAD', 'AUD_CHF', 'AUD_JPY', 'AUD_NZD', 'AUD_USD',
  'CAD_CHF', 'CAD_JPY',
  'CHF_JPY',
  'EUR_AUD', 'EUR_CAD', 'EUR_CHF', 'EUR_GBP', 'EUR_JPY', 'EUR_NZD', 'EUR_USD',
  'GBP_AUD', 'GBP_CAD', 'GBP_CHF', 'GBP_JPY', 'GBP_NZD', 'GBP_USD',
  'NZD_CAD', 'NZD_CHF', 'NZD_JPY', 'NZD_USD',
  'USD_CAD', 'USD_CHF', 'USD_JPY'
]

var instruments = '';
var https = null;
var heartbeat = null;

instrumentList.map(instrument => {
  instruments += instrument + '%2C'
});
instruments = instruments.substr(0, instruments.length - 3);


if (domain.indexOf('stream-sandbox') > -1) {
  https = require('http');
} else {
  https = require('https');
}

var options = {
  host: domain,
  path: '/v3/accounts/' + account_id + '/pricing/stream?instruments=' + instruments,
  method: 'GET',
  headers: {'Authorization' : 'Bearer ' + access_token},
};

console.log(new Date() + ' - Starting stream');

var request = https.request(options, function(response){
  response.on('data', function(chunk){
    // Parse and correct chunk so there are no returns
    try {
      var bodyChunk = chunk.toString().replace('/r', '').replace('/n', '');
      var data = JSON.parse(bodyChunk);
      switch(data.type){
        case 'HEARTBEAT':
          // Heartbeat gets sent approximately every 5 seconds
          heartbeat = new Date(data.time);
          break;
        case 'PRICE':
          // This is where your streamed data is outputted
          console.log(data);
          break;
        default:
          break;
      }
    } catch(err) {
      console.log(new Date() + ' - Could not parse message: ' + bodyChunk);
    }
  });
  response.on('end', function(chunk){
    var bodyChunk = chunk.toString().replace('/r', '').replace('/n', '');
    console.log(new Date() + ' - Error connecting to OANDA HTTP Rates Server');
    console.log(new Date() + ' - HTTP - ' + response.statusCode);
    console.log(new Date() + ' - ' + bodyChunk);
    process.exit(1);
  });
});

request.end();


setInterval(() => {
  //Check heartbeat every 5 seconds
  if (heartbeat === null) return;
  var offset = Math.abs(new Date().getTime() - heartbeat.getTime());
  if (offset > 10000) {
    console.log(new Date() + ' - Heartbeat is greater than ' + offset + 'ms');
  }
}, 5000)