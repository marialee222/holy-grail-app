var express = require("express");
var redis = require("redis");
var app = express();

// Create a Redis client
var client = redis.createClient({
  host: 'localhost',
  port: 6379
});

// Check Redis connection
client.on('connect', function() {
  console.log('Connected to Redis');
});

// Error handling for Redis
client.on('error', function(err) {
  console.error('Redis error:', err);
});

// Serve static files from public directory
app.use(express.static("public"));

// Initialize values for: header, left, right, article, and footer using the Redis client
client.multi()
  .set("header", 0)
  .set("left", 0)
  .set("article", 0)
  .set("right", 0)
  .set("footer", 0)
  .exec(function(err, replies) {
    if (err) {
      console.error('Error initializing values in Redis:', err);
    } else {
      console.log('Initialized values in Redis');
    }
  });

// Get values for holy grail layout
function data() {
  return new Promise(function(resolve, reject) {
    client.mget('header', 'left', 'article', 'right', 'footer', function(err, values) {
      if (err) {
        reject(err);
      } else {
        resolve({
          header: Number(values[0]),
          left: Number(values[1]),
          article: Number(values[2]),
          right: Number(values[3]),
          footer: Number(values[4])
        });
      }
    });
  });
}

// Endpoint to update a specific key in Redis
app.get("/update/:key/:value", function(req, res) {
  const key = req.params.key;
  const value = Number(req.params.value);

  client.set(key, value, function(err, reply) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.send(`Updated ${key} to ${value}`);
    }
  });
});

// Get key data
app.get("/data", function(req, res) {
  data().then(function(data) {
    console.log(data);
    res.send(data);
  }).catch(function(err) {
    res.status(500).json({ error: err.message });
  });
});

app.listen(3000, function() {
  console.log("Running on 3000");
});

process.on("exit", function() {
  client.quit();
});
