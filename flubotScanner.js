const Str = require('@supercharge/strings');
const axios = require("axios");
const cheerio = require("cheerio");
const ScannedSites = require('./models/site');

module.exports = {
  scan: async function (url, tries = 0) {
    tries = tries + 1;
    if (tries > 2) return;
    console.log('Scanning', url)
    if (!module.exports.isUrlValid(url)) return;
    console.log(`Requesting`, url)
    axios
      .get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36",
          "accept-language": "nl,en-US;q=0.9,en;q=0.8",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
        }
      })
      .then(async response => {
        if (response.status != 200 || response.request._redirectable._redirectCount != 0) return;

        let $ = cheerio.load(response.data);

        if ($("body > div.content > div > div").find('a').length != 1 || $("body > div.content > div > ol").find('li').length != 2) {
          console.log(`${url} does not match HTML selectors!`);
          return;
        }

        $("a").each(async function (i, e) {
          let links = $(e).attr("href");
          console.log(links);
          let link = module.exports.getBaseUrl(links);
          console.log(`found ${link} while scanning ${url}`);
          if (module.exports.isUrlValid(link)) {

            const oldvalue = await ScannedSites.find({
              URL: link
            });

            if (!oldvalue.length) {
              console.log('saving', link)
              ScannedSites.create([{
                URL: link,
                Active: true,
              }]);
              module.exports.scan(link);
            } else if (oldvalue.length) {
              oldvalue[0].Active = true;
              oldvalue[0].save();
            } else {
              setTimeout(() => {
                module.exports.scan(module.exports.generateUrlSuffix(link), tries);
              }, 500 * tries);
            }
          }
        });
      })
      .catch(async function (e) {
        let link = module.exports.getBaseUrl(url);
        console.log(`${url} is not active!`)
        const oldvalue = await ScannedSites.findOne({
          URL: `${link}`
        });
        if (!oldvalue) return;
        if (oldvalue.Active) {
          oldvalue.Active = false;
          oldvalue.save();
        }
        return;
      });
  },

  isUrlValid: function (url) {
    if (!url.startsWith('https://')) return false;
    if (url.startsWith('/?') || url.startsWith('./') || url.startsWith('/') || url.startsWith('#') || url.startsWith('https://www.cloudflare.com')) return false;
    return true;
  },
  generateUrlSuffix: function (url) {
    return `${url}?${Str.random(10)}`;
  },
  getBaseUrl: function (url) {
    return url.split("?")[0];
  }
};