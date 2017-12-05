'use strict';
const axios = require('axios');
const cheerio = require('cheerio');


module.exports.post = (event, context, callback) => {
  const token = process.env.token
  const message = `Go Serverless v1.0! Your function executed successfully! value: ${ token }`;
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message,
      input: event,
    }),
  };
  scraper()

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

function scraper() {
  return new Promise(function(resolve, reject) {
    var rightNow = new Date();
    var yyyymmdd = rightNow.toISOString().slice(0,10);

    const url =`http://vivintsolar.cafebonappetit.com/cafe/the-cafe/${ yyyymmdd }`;

    axios.get(url)
      .then((response) => {
        console.log(response);
      })
  });
}
