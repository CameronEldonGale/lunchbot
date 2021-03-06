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
    const lunch = formatMessage(todaysLunch);
    console.log(lunch);
    post(lunch)
  })

  callback(null, response);
};

function formatMessage(todaysMenu) {
  const obligatoryBeeping = '*BEEP BOOP BEEEEP*'
  const header = ':knife_fork_plate: *Today’s Lunch* :knife_fork_plate:';
  const { weeklyMenuLink } = todaysMenu;
  let prettyMessage = '';

  if (Array.isArray(todaysMenu.menuText)) {
    todaysMenu.menuText.forEach((menuItem)=>{
      prettyMessage += `\n${ cleanUp(menuItem) }\n`;
    })
  }else {
    prettyMessage = cleanUp(todaysMenu.menuText);
  }


  return `${ obligatoryBeeping }\n${ header }\n${ prettyMessage }\n You can view this week's menu @: ${ weeklyMenuLink}`
}

function cleanUp(message) {

  message = message.replace(/\n/, '');
  message = message.replace(/\[L\]/, '');
  message = message.trim();
  message = message.replace(/\n/g, '*RETURN*');
  message = message.replace(/\s{2,}/g, '');
  message = message.replace(/\|/g, '*RETURN*');
  message = message.replace(/(\*RETURN\*)+/g,'\n')
  message = message.replace(/\n\s\n/g, '\n');


  let lines = message.split('\n');

  lines = lines.map((line, i) => {
    line = line.trim();
    if (i > 0) {
      line = `• ${ line }`;
    }
    return line;
  })

  lines[0] = `*${lines[0]}*`;
  const prettyMessage = lines.join('\n');

  return prettyMessage;
}

function post(message) {

  const web = new WebClient(token);
  web.chat.postMessage('lunch', message, { as_user: true }, function(err, res) {
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
            // console.log('lunch: ',todaysLunch);
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
  console.log('fetching today\'s lunch...');

  return new Promise(function(resolve, reject) {
    axios.get(weeklyMenuLink)
      .then((response) => {
        const $ = cheerio.load(response.data);
        const cells = $('.day').toArray();
        const weeklyMenu = {};
        let row;

        const text = cells.map(function(el, i) {
          const menuText = $(el).children().last().text() || null;

          if (i%6 === 0 && menuText) {
            weeklyMenu[menuText] = [];
            row = menuText;
          }

          if (row && i%6 !== 0) {
            weeklyMenu[row].push(menuText)
          }

            return menuText;
          });

          delete weeklyMenu['SOUP'];
          delete weeklyMenu['FARM TO FORK SALAD BAR'];
          delete weeklyMenu['BEVERAGE'];

          // console.log(weeklyMenu);
          const today = new Date().getDay() - 1;
          const todaysMenu = [];

          for (let row in weeklyMenu) {
            if (weeklyMenu.hasOwnProperty(row)) {
              if (weeklyMenu[row][today]) {
                todaysMenu.push(weeklyMenu[row][today]);              }
            }
          }

          return resolve({ weeklyMenuLink, menuText: todaysMenu});
  })
  .catch((err) => {
    return reject(err);
  })
})
}

// scrape().then((todaysMenu) => {
//   const lunch = formatMessage(todaysMenu);
//   console.log('lunch: ', lunch);
//   // post(lunch)
// })
