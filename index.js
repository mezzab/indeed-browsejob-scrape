const curl = require('curl');
const jsdom = require('jsdom');
const fetch = require('axios');

const { JSDOM } = jsdom;

const urlBuilder = (letter) => `https://www.indeed.com/browsejobs/letter?title=${letter}`;

async function fetchSalaryLinks(n, url) {
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
        const salaryLinksLength = salaryLinks.length;
        if (salaryLinksLength > 0) {
          console.log(' ');
          console.log('- Will fetch ', salaryLinksLength, 'salary pages.');
          console.log(' ');

          for (let i = 0; i < salaryLinksLength; i++) {
            try {
              const res = await fetch(`https://indeed.com${salaryLinks[i]}`);
              if (res.status === 200) {
                console.log(n, '-', i, ' - ', salaryLinks[i], ' - status 200 ✓ ');
              } else {
                console.log(n, '-', i, ' - ', salaryLinks[i], ' - status ', res.status, ' ✘ ');
              }
            } catch {
              reject('- ✘ Found a page with ERROR: ' + salaryLinks[i]);
            }
          }
          resolve({
            successCount: salaryLinksLength,
            message: '- ✓ Fetched all salary links from url ' + n + ': ' + url,
          });
        } else {
          console.log('no salary links found in this page.');
        }
      } else {
        console.log('Error while fetching url. status=', resp.statusCode);
      }
    });
  });
}

function scrapeJobsByTitle() {
  const url = 'https://www.indeed.com/browsejobs/letter?title=A';
  let errorCounter = 0;
  let successCounter = 0;
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
          const response = await fetchSalaryLinks(j, `https://indeed.com${letterPagesUrls[j]}`);
          successCounter = successCounter + response.successCount;
          console.log(response.message);
        } catch (error) {
          console.log(error);
          errorCounter++;
        }
      }

      console.log('- fetched ', successCounter, 'salary links successfully.');
      console.log('- fetched ', errorCounter, ' salary links with error.');
    } else {
      console.log('- ERROR WHILE SCRAPPING THIS PAGE');
    }
  });
}

function scrapeJobsByCategory() {
  const url = 'https://www.qa.indeed.net/browsejobs/';
  let errorCounter = 0;
  let successCounter = 0;
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

      const categoryPagesUrls = hrefs.filter((x) => x.startsWith('/browsejobs/jobs?cat='));

      for (var j = 0; j < categoryPagesUrls.length; j++) {
        // we need make this synconous, because otherwise we will get banned by indeed.
        try {
          const response = await fetchSalaryLinks(j, `https://indeed.com${categoryPagesUrls[j]}`);
          successCounter = successCounter + response.successCount;
          console.log(response.message);
        } catch (error) {
          console.log(error);
          errorCounter++;
        }
      }

      console.log('- fetched ', successCounter, 'salary links successfully.');
      console.log('- fetched ', errorCounter, ' salary links with error.');
    } else {
      console.log('- ERROR WHILE SCRAPPING THIS PAGE');
    }
  });
}

// scrapeJobsByTitle();
scrapeJobsByCategory();
