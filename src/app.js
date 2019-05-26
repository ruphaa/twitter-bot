require('dotenv').config();

const Twitter = require('Twitter');
const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_KEY);

const T = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_TOKEN,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var today = new Date();
var date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();

function handler ({headers, body}, context, callback) {
  let promise = new Promise((resolve, reject) => {
    base('Devtips').select({
      filterByFormula: `date = "${date}" `,
    }).eachPage(function page(records, fetchNextPage) {
      records.forEach(function(record) {
        resolve(record)
      });
    }, function done(error) {
      console.log(error)
    });
  })
  
  promise.then(function(record) {
    if(!(record.fields.used == "true")) {
      let id = record.id;
      let message = record.fields.message;
      let article = record.fields.article;
      let tag = record.fields.tag.split(',').join('');
      let tweet = `${message} ${article} ${tag}`;
      T.post('statuses/update', {status: tweet}, function(error, tweet, response) {
        if (!error) {
          base('Devtips').update(id, {
            "used": "true"
          })
          callback(null,{
            statusCode: 200,
            body: "Success"
          })
        }
      });
    }
  })
  .catch(function(error) {
    console.log('Error-->', error)
  })
}

exports.handler = handler;