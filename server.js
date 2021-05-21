const path = require("path");
const mongoose = require("mongoose");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config()
const ScannedSites = require('./models/site');
const flubot = require('./flubotScanner.js');

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

// Our home page route, this pulls from src/pages/index.hbs
fastify.get("/", async function(request, reply) {
  // params is an object we'll pass to our handlebars template
  const amountScannedSites = await ScannedSites.countDocuments();
  const amountActiveSites = await ScannedSites.countDocuments({Active: true});
  const sites = await ScannedSites.find({Active: true}).sort({createdAt: 'desc'}).limit(10).lean();
  // check and see if someone asked for a random color
    // we need to load our color data file, pick one at random, and add it to the params
    params = {
      TotalSites: amountScannedSites,
      ActiveSites: amountActiveSites,
      Sites: sites,
    };
  reply.view("/src/pages/index.hbs", params);
});

fastify.get("/items", async function(request, reply) { 
  reply.send(await ScannedSites.find())
});

fastify.get("/search", async function(request, reply) {
  if(!request.query || !request.query.url) return reply.redirect('/');
  let foundSites = await ScannedSites.find({"URL":{$regex:`.*${request.query.url}.*`}}).limit(10).lean();
  params = {
    FoundSites: foundSites,
    AmountFound: foundSites.length,
    Query: request.query.url
  }
  reply.view("/src/pages/search.hbs", params);
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
