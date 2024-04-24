import { load } from 'cheerio';
import { writeFile } from 'node:fs/promises';

const essays: { title: string; text: string; url: string }[] = [];

async function visit(url: string) {
  console.log(`Visiting ${url}`);
  const response = await fetch(url);
  return load(await response.text());
}

async function visitPage(url: string) {
  // Visit link
  const $ = await visit(url);
  const title = $('title').text();

  const text = $('font').find('br').replaceWith('\n').end().text();
  if (!text) return;

  essays.push({ title, text, url });
}

async function visitHome() {
  const $ = await visit('https://paulgraham.com/articles.html');
  const links = $(
    'body > table > tbody > tr > td:nth-child(3) > table:nth-child(6) a'
  );

  for (const link of links) {
    const slug = link.attributes[0].value;
    if (slug.startsWith('http')) continue;

    await visitPage(`https://paulgraham.com/${slug}`);
  }
}

(async () => {
  await visitHome();

  const data = JSON.stringify(essays, null, 4);
  await writeFile('data.json', data);

  console.log(`✅ ${essays.length} essays found`);
})();
