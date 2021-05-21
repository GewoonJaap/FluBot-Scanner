module.exports = {
  scan: async function (url, tries = 0) {
    tries = tries + 1;
    if (tries > 2) return;

    const axios = require("axios");
    const cheerio = require("cheerio");
    const ScannedSites = require('./models/site');
    const {
      v4: uuidv4
    } = require("uuid");

    axios
      .get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36"
        }
      })
      .then(async response => {
        let $ = cheerio.load(response.data);
        $("a").each(async function (i, e) {
          let links = $(e).attr("href");
          console.log(links);
          let link = links.split("?")[0];
          console.log("found", link);

          const oldvalue = await ScannedSites.find({
            URL: link
          });
          if (!oldvalue.length && link.length > 5) {
            ScannedSites.create([{
              URL: link,
              Active: true
            }]);
            console.log("saved", link);
            module.exports.scan(link);
          } else {
            setTimeout(() => {
              module.exports.scan(link, tries);
            }, 500 * tries);
          }
        });
      })
      .catch(async function (e) {
        let link = url.split("?")[0];
        console.log(`${link} is not active!`)
        const oldvalue = await ScannedSites.findOne({
          URL: link
        });
        if (!oldvalue) return;
        if (oldvalue.Active) {
          oldvalue.Active = false;
          oldvalue.save();
        }
        return;
      });
  }
};