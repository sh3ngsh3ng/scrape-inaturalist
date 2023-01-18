const cheerio = require('cheerio')
const axios = require('axios')

async function scraperV1() {
    let response = await axios.get("https://www.inaturalist.org/observations?nelat=1.3046128097445413&nelng=103.85494125618739&place_id=any&subview=map&swlat=1.2961637496835838&swlng=103.8490226572699&view=species")
    let html = response.data
    const $ = cheerio.load(html)
    $('a', html).each(function() {
        console.log($(this).text())
    })
}


scraperV1()