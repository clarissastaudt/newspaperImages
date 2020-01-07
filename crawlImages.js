/*
###############################################################################
IMPORTS
###############################################################################
*/

const puppeteer = require("puppeteer")
const fs = require("fs")
const request = require("request")


/*
###############################################################################
HELPER FUNCIONS
###############################################################################
*/

/*
* Creates target folders for the images for each newspaper and adds current date to  the folder name.
* @param {Array} names
* @return {Array} targetFolders
*/
function createTargetFolders(names) {
    let targetFolders = []
    names.forEach(function(folderName){
        folderName =  "img/" + folderName + "_" + new Date().getDate() + "_" + (new Date().getMonth() + 1) + "_" + new Date().getFullYear()
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName)
        }
        targetFolders.push(folderName)
    })
    return targetFolders
}

/*
* Scrolls to the bottom of a given page.
* @param {puppeteer page} page
* @return { }
*/
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0
            var distance = 100
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight
                window.scrollBy(0, distance)
                totalHeight += distance

                if(totalHeight >= scrollHeight){
                    clearInterval(timer)
                    resolve()
                }
            }, 100)
        })
    })
}

/*
* Tries to save all images to target folder for a given list of urls.
* Note that the code only works for png and jpg files.
* @param {Array} urls
* @param {String} targetFolder
* @return { }
*/
function saveImgs(urls, targetFolder) {
    let j = 1
    urls.forEach(function(url){
        let name =  targetFolder + "/image" + j + ".png"

        console.log(url)
        console.log(name)
        try {
            download(url, name)
        }
        catch (e) {
           console.log("FAILED")
        }
        console.log("\n")

        j += 1
    })
}

/*
* writes an image to file
* @param {String} url
* @param {String} filename
* @return { }
*/
function download(url, filename) {
  request.head(url, function(err, res, body) {
    request(url)
    .pipe(fs.createWriteStream(filename))
 })
}


/*
###############################################################################
"MAIN"
###############################################################################
*/

async function scrape() {
    console.log("Starting scraping process...\n\n")

    // Pages from which the images should be scraped
    let scrape_pages = ["https://www.spiegel.de/", "https://www.welt.de/", "https://www.faz.net/aktuell/", "https://www.sueddeutsche.de/", "https://taz.de/", "https://www.bild.de/", "https://www.handelsblatt.com/", "https://www.stuttgarter-zeitung.de/"]

    let targetFolders = createTargetFolders(["spiegel", "welt", "faz", "sz", "taz", "bild"])
    const browser = await puppeteer.launch({ headless: false })

    var i
    for (i = 0; i < scrape_pages.length; i++) {
        console.log("\n#################################\n")
        console.log(scrape_pages[i])
        console.log("\n#################################\n")

        // Open page and scroll to bottom to load everything
        let page = await browser.newPage()
        await page.goto(scrape_pages[i])
        await page.waitFor(1000)
        await page.setViewport({
            width: 1200,
            height: 800
        })
        await autoScroll(page)
        await page.waitFor(1000)

        // Scrape list of img urls from page
        const urls = await page.evaluate(function (){
            let urls = []
            let images = document.querySelectorAll("img")
            images.forEach(function(img){
                urls.push(img["src"])
            })
            return(urls)
        })

        // Save gathered images to file
        saveImgs(urls, targetFolders[i])
        await page.waitFor(2000)

    }

    await browser.close()
 }

scrape()
