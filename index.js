const curl = require('curl');
const jsdom = require('jsdom');
const fetch = require('axios');

const { JSDOM } = jsdom;

const urlBuilder = (letter) => `https://www.indeed.com/browsejobs/letter?title=${letter}`;

async function fetchSalaryLinks(n, url, errorCounter, successCounter) {
  return new Promise((resolve, reject) => {
    curl.get(url, null, async (err, resp, body) => {
      console.log(' ');
      console.log('- SCRAPING URL N', n, ':', url);
      if (err) console.log('err -> ', err);
      if (resp.statusCode == 200) {
        process.stdout.write('.');
        const dom = new JSDOM(body);
        const $ = require('jquery')(dom.window);
        var links = $('a'),
          hrefs = [];

        for (var i = 0; i < links.length; i++) {
          hrefs.push(links[i].href);
        }
        const salaryLinks = hrefs.filter((x) => x.startsWith('/career/'));
        if (salaryLinks.length > 0) {
          console.log(' ');
          console.log('- Will fetch ', salaryLinks.length, 'salary pages.');
          console.log(' ');

          const errorUrls = [];
          for (let i = 0; i < salaryLinks.length; i++) {
            try {
              const res = await fetch(`https://indeed.com${salaryLinks[i]}`);
              if (res.status === 200) {
                successCounter++;
                console.log(n, '-', i, ' - ', salaryLinks[i], ' - status 200 ✓ ');
              } else {
                console.log(n, '-', i, ' - ', salaryLinks[i], ' - status ', res.status, ' ✘ ');
              }
            } catch {
              errorCounter++;
              errorUrls.push(i);
              reject('- ✘ Found a page with ERROR: ' + salaryLinks[i]);
            }
          }
          resolve('- ✓ Fetched all salary links from url ' + n + ': ' + url);
        } else {
          console.log('no salary links found in this page.');
        }
      } else {
        console.log('Error while fetching url. status=', resp.statusCode);
      }
    });
  });
}

function startScraping(url) {
  const errorCounter = 0;
  const successCounter = 0;
  curl.get(url, null, async (err, resp, body) => {
    if (resp.statusCode == 200) {
      process.stdout.write('.');
      const dom = new JSDOM(body);
      const $ = require('jquery')(dom.window);
      var links = $('a'),
        hrefs = [];

      for (var k = 0; k < links.length; k++) {
        hrefs.push(links[k].href);
      }

      const letterPagesUrls = hrefs.filter((x) => {
        const splittedUrl = x.split('/browsejobs/Title/');
        if (splittedUrl.length > 1) {
          return splittedUrl[1].length == 1;
        } else return false;
      });

      for (var j = 0; j < letterPagesUrls.length; j++) {
        // we need make this synconous, because otherwise we will get banned by indeed.
        try {
          const status = await fetchSalaryLinks(
            j,
            `https://indeed.com${letterPagesUrls[j]}`,
            errorCounter,
            successCounter
          );
          console.log(status);
        } catch (error) {
          console.log(error);
        }
      }

      console.log('- SCRAPPED ', successCounter, '200 SALARY LINKS');
      console.log('- FOUND ', errorCounter, ' 404 SALARY LINKS');
    } else {
      console.log('- ERROR WHILE SCRAPPING THIS PAGE');
    }
  });
}

startScraping('https://www.indeed.com/browsejobs/letter?title=A');
