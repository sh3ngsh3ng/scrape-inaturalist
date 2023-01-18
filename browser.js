const puppeteer = require('puppeteer')

async function getBrowser() {
    let browser;
    try {
        console.log("Opening browser...")
        browser = await puppeteer.launch({
            headless: false,
            args : [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        })
    } catch (e) {
        console.log("ERROR LOG:", e)
    }

    return browser
}

module.exports = {
    getBrowser
}