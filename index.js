require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const dns = require('dns')
const mongoose = require('mongoose');
const url = require('url');
const urls = require('./helpers/url')
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// MongoDB connection
mongoose.connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Eror connecting to MongoDB: ", err))


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });

});

app.post('/api/shorturl', async (req, res) => {
  const longUrl = req.body.url;
  const validUrlFormat = /^(https?:\/\/)?(?:www\.)?([^\/\n]+)/i;;

  if (!validUrlFormat.test(longUrl)) {
    return res.status(403).json({ error: 'Please enter a valid URL '})
  }

  // Extract hostname for DNS lookup
  const parsedUrl = url.parse(longUrl);
  const hostname = parsedUrl.hostname;

  dns.lookup(hostname, async(err) => {
    if (err) {
      console.log(ip)
      return res.json({ error: 'Invalid URL' });
    }

    try {
      const shortUrl = await urls.shortenAndSaveUrl(longUrl);
      if (shortUrl) {
        return res.status(200).json({ original_url: longUrl, short_url: shortUrl})
      } else {
        return res.status(500).json({ error: 'Failed to shorten URL'});
      }
    } catch (err) {
      console.error("Error in shortening URL:", err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});


app.get('/api/shorturl/:id?', async  (req, res) => {
  const urlId = req.params.id;

  try {
    const decodedId = parseInt(urlId);
    const longUrl = await urls.findOneById(decodedId);

    if (longUrl) {
      return res.redirect(301, longUrl)
    } else {
      return res.status(404).json({ error: `No shortened url with id ${urlId}`})
    }
  } catch (err) {
    console.error("Error in finding long URL");
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
