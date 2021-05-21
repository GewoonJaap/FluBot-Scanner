const path = require("path");
const mongoose = require("mongoose");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config()
const ScannedSites = require('./models/site');
const flubot = require('./flubotScanner.js');
const flubotScanner = require("./flubotScanner.js");

mongoose.connect(process.env.MONGODB);

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // set this to true for detailed logging:
  logger: false
});

// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

initScan();
setInterval(initScan, 1000 * 60 * 5);


// load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// Our home page route, this pulls from src/pages/index.hbs
fastify.get("/", async function(request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };
  const amountScannedSites = await ScannedSites.countDocuments();
  const amountActiveSites = await ScannedSites.countDocuments({Active: true});
  // check and see if someone asked for a random color
    // we need to load our color data file, pick one at random, and add it to the params
    params = {
      TotalSites: amountScannedSites,
      ActiveSites: amountActiveSites,
      seo: seo
    };
  reply.view("/src/pages/index.hbs", params);
});

fastify.get("/items", async function(request, reply) { 
  reply.send(await ScannedSites.find())
});

fastify.get("/search", async function(request, reply) {
  if(!request.query || !request.query.url) return reply.redirect('/');
  reply.send(request.query)
});


// A POST route to handle and react to form submissions 
fastify.post("/", function(request, reply) {
  let params = { seo: seo };
  // the request.body.color is posted with a form submission
  let color = request.body.color;
  // if it's not empty, let's try to find the color
  if (color) {

    flubot.scan(color);
    // load our color data file
    const colors = require("./src/colors.json");
    // take our form submission, remove whitespace, and convert to lowercase
    color = color.toLowerCase().replace(/\s/g, "");
    // now we see if that color is a key in our colors object
    if (colors[color]) {
      // found one!
      params = {
        color: colors[color],
        colorError: null,
        seo: seo
      };
    } else {
      // try again.
      params = {
        colorError: request.body.color,
        seo: seo
      };
    }
  }
  reply.view("/src/pages/index.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});

async function initScan(){
  const allData = await ScannedSites.find();
  allData.forEach(site => {
    flubot.scan(site.URL);
  });
}
