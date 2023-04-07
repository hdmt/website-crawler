const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const startUrl = 'https://example.com/';
const visitedUrls = new Set();
const urlTitleList = [];

function writeCsvFile(data, filename) {
  const csvContent = data
    .map(({ url, title }) => {
      const escapedTitle = title.replace(/"/g, '""');
      return `"${url}","${escapedTitle}"`;
    })
    .join('\n');

  fs.writeFileSync(filename, csvContent, 'utf8');
}

async function crawl(url) {
  if (!visitedUrls.has(url)) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      visitedUrls.add(url);

      const titleTag = $('title').text();
      urlTitleList.push({ url, title: titleTag });

      // このページ内のリンクを取得
      const links = [];
      $('a[href]').each((_, element) => {
        links.push($(element).attr('href'));
      });

      // さらにリンク先をクロール
      for (const link of links) {
        const absoluteUrl = new URL(link, startUrl).href;
        const parsedUrl = new URL(absoluteUrl);

        if (parsedUrl.hostname === new URL(startUrl).hostname) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await crawl(absoluteUrl);
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error.message);
    }
  }
}

(async () => {
  await crawl(startUrl);
  writeCsvFile(urlTitleList, 'url-title-list.csv');
  console.log(urlTitleList);
})();
