const browserObject = require('./browser')
const fs = require('fs')

let url = 'https://www.inaturalist.org/observations?iconic_taxa=Arachnida&nelat=1.3046128097445413&nelng=103.85494125618739&place_id=any&subview=map&swlat=1.2961637496835838&swlng=103.8490226572699&view=species'


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

async function getSpecies(browser, url) {
    let browserTab = await browser.newPage();
    try {
        await browserTab.goto(url, {
            waitUntil: 'networkidle0'
        });

        try {
            await browserTab.waitForSelector('.spinner[ng-show="pagination.searching"]', {
                hidden: true
            })
        } catch(e) {
            console.log(url + '=>' + 'Spinner wait failed')
        }
        
        await delay(3000)
        const locations = await browserTab.evaluate(() => {
            const observation = Array.from(document.querySelectorAll('span.location'))
            return observation.map(eachObs => eachObs.getAttribute('title'))
        })
        
        let sciName;
        let comName;
        let noOfObs;

        try {
            sciName = await browserTab.$eval('a.secondary-name>span.comname', el => el.textContent)
        } catch (e) {
            sciName = "Can't find name"
        }
        
        try {
            comName = (await browserTab.$eval('a.display-name.comname', el => el.textContent)).replace('Species', '').trim()
        } catch (e) {
            comName = "Can't find name"
        }

        try {
            noOfObs = await browserTab.$eval('div.active > div.stat > div.stat-value', el => el.textContent)
        } catch (e) {
            noOfObs = "Can't find number of observation"
        }


        let oneSpecies = {
            sciName, comName, noOfObs, locations, url
        }

        return oneSpecies
    } catch (e) {
        // return mock object
        return {
            sciName: 'An error occured',
            comName: 'Check Logs',
            locations: ['An error occured'],
            url: url
        }
    } finally {
        browserTab.close()
    }
}


async function scraperV2(filename, url) {
    let browser = await browserObject.getBrowser();
    let page = await browser.newPage()
    await page.goto(url, {
        waitUntil: 'networkidle0'
    })

    // Step 1: Get all links of the filtered results
    // press down key repeatedly every 100milliseconds for 10 seconds
    await page.keyboard.down('PageDown')
    setInterval(() => {
        page.keyboard.down('PageDown');
        page.keyboard.up('PageDown');
    }, 100)

    setTimeout(() => {
        clearInterval();
        page.keyboard.up('PageDown')
    }, 1000)

    // delay getting link
    await delay(3000)

    // get each species link
    const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('div.photometa > a.ng-binding'));
        return anchors.map(a => a.href)
    })
    let resultLinks = links.filter(each => each.includes('observations'))


    // Step 2: Loop through all links of the filtered result
    // => output an object for each link
    // => each object contains the species name, number of observations, location of observation
    // {
    //     'common_name': 'Rock Pigeon',
    //     'scientific_name': 'Columba livia',
    //     'location': ['Bras Basah', 'Rochor'],
    //     'url': 'http://testing.com'
    // }

    let result = []
    for (let i = 0; i < resultLinks.length; i++) {
        let species = await getSpecies(browser, resultLinks[i]);
        result.push(species)
    }

    // ASYNC TESTING
    // let result = []
    // const chunkSize = 5
    // for (let i = 0; i < 25; i += chunkSize) {
    //     let chunk = resultLinks.slice(i, i + chunkSize);
    //     let promises = chunk.map(link => getSpecies(browser, link));
    //     let species = await Promise.all(promises);
    //     result.push(...species)
    // }

    // merge locations to one cell
    // result.forEach(data => {
    //     data.locations = data.locations.join(', ')
    // })

    // Step 3: Write json to file
    fs.writeFile('./xt/' + filename + '.json', JSON.stringify(result), (err) => {
        if (err) {
            console.log('Error writing file', err);
            return
        }
        console.log('Data successfully scraped -> ' + Date.now() + '.json')
    })

    browser.close()
}



scraperV2('birds','https://www.inaturalist.org/observations?iconic_taxa=Aves&nelat=1.3046128097445413&nelng=103.85494125618739&place_id=any&subview=map&swlat=1.2961637496835838&swlng=103.8490226572699&view=species')

