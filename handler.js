'use strict';
const axios = require('axios');
const cheerio = require('cheerio');
const WebClient = require('@slack/client').WebClient;

const token = process.env.token || '';

module.exports.post = (event, context, callback) => {

  const message = `Your function executed successfully!`;
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message,
      input: event,
    }),
  };
  scrape().then((todaysLunch) => {
    post(todaysLunch)
  })

  callback(null, response);

};

function post(message) {

  const web = new WebClient(token);
  web.chat.postMessage('lunch', message, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });

}

function scrape() {
  return new Promise(function(resolve, reject) {
    getWeeklyMenu()
      .then((weeklyMenuLink) => {
        console.log('weekly menu', weeklyMenuLink);
        return getLunch(weeklyMenuLink)
          .then((todaysLunch) => {
            console.log('lunch: ',todaysLunch);
            return resolve(todaysLunch);
          })
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
  const rightNow = new Date();
  const week = {
    0:  'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    Sunday: [],
    Monday: [13,31],
    Tuesday: [14,32],
    Wednesday: [15,33],
    Thursday: [16,34],
    Friday: [17,35],
    Saturday: [],
  }
  const today = week[rightNow.getDay()];

  console.log('fetching today\'s lunch...');
  return new Promise(function(resolve, reject) {
    axios.get(weeklyMenuLink)
      .then((response) => {
        const $ = cheerio.load(response.data);
        const cells = $('.day').toArray();
        const text = cells.map(function(el, i) {
          const menuText = $(el).children().last().text() || null;

          if (week[today].includes(i) && menuText) {
            resolve(menuText)
          }

            return menuText;
          });
  })
  .catch((err) => {
    return reject(err);
  })
})
}
