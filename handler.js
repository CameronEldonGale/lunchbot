'use strict';
const axios = require('axios');
const cheerio = require('cheerio');

let result = 'um something went wrong'


module.exports.post = (event, context, callback) => {
  const token = process.env.token
  const message = `Go Serverless v1.0! Your function executed successfully! result: ${ result }`;
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
    getWeeklyMenu()
      .then((weeklyMenuLink) => {
        console.log('weekly menu', weeklyMenuLink);
        getLunch(weeklyMenuLink)

      })
      .catch((err) => {
        return reject(err);
      })
  });

}

function getWeeklyMenu() {
  return new Promise(function(resolve, reject) {
    var rightNow = new Date();
    var yyyymmdd = rightNow.toISOString().slice(0,10);

    const url =`http://vivintsolar.cafebonappetit.com/cafe/the-cafe/${ yyyymmdd }`;

    axios.get(url)
      .then((response) => {
        const $ = cheerio.load(response.data);
        const menuLink = $('.hidden-small').prop('href');
        return resolve(menuLink);
      })
      .catch((err) => {
        return reject(err);
      })
  });
}

function getLunch(weeklyMenuLink) {
  console.log('fetching today\'s lunch...');
  return new Promise(function(resolve, reject) {
    axios.get(weeklyMenuLink)
      .then((response) => {
        const $ = cheerio.load(response.data);
        const table = $('.container').children('.main');
        const chefsTable = table.children();
        const cells = $('.cell_menu_item').toArray();
        const text = cells.map(function(i, el) {
            // this === el
            return $(i).children().last().text();
          });
        text.forEach((item) => {
          console.log(item);
        })
  });
})
}

scraper();
