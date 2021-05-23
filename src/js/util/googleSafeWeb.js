const axios = require("axios");
module.exports = {

    reportToGoogle: async function (url, html) {
        const nowEpoch = new Date().getTime();
        const reportBody = [url, null, null, html, [
                [url, 4, ["127.0.0.1"], "", null, false, nowEpoch, [], null, 1, false]
            ],
            []
        ];
        try {
            const res = await axios.post('https://safebrowsing.google.com/safebrowsing/clientreport/crx-report', reportBody, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36",
                    "accept-language": "nl,en-US;q=0.9,en;q=0.8",
                },
            });
            console.log(`Reported: ${url} to Google SafeSearch`, res.status);
        } catch (e) {
            console.log(`Failed to report site ${url}`)
        }
    }
}