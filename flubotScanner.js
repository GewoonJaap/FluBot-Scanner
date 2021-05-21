module.exports = {
  scan: function(url, tries = 0) {
    tries = tries + 1;
    if (tries > 20) return;

    const axios = require("axios");
    const cheerio = require("cheerio");
    const low = require("lowdb");
    const FileSync = require("lowdb/adapters/FileSync");
    const adapter = new FileSync("./data/sites.json");
    const db = low(adapter);
    const { v4: uuidv4 } = require("uuid");
    db.defaults({ url: [] }).write();

    axios
      .get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36"
        }
      })
      .then(response => {
        let $ = cheerio.load(response.data);
        $("a").each(function(i, e) {
          let links = $(e).attr("href");
          console.log(links);
          let link = links.split("?")[0];
          console.log("found", link);

          const oldvalue = db
            .get("url")
            .find({ url: link })
            .value();
          if (!oldvalue) {
            db.get("url")
              .push({ id: uuidv4(), url: link })
              .write();
            console.log("saved", link);
            module.exports.scan(link);
          } else {
            setTimeout(() => {
              module.exports.scan(link, tries);
            }, 500 * tries);
          }
        });
      })
      .catch(function(e) {
        console.log(e);
      });
  }
};
