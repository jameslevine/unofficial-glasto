import { request } from 'undici';

const UA = 'unofficial-glasto-scraper/0.1 (+https://github.com/)';

export const fetchYearHtml = async (year: number): Promise<string> => {
  const url = `https://www.glastonburyfestivals.co.uk/line-up/line-up-${year}/?view=stages`;
  const res = await request(url, {
    method: 'GET',
    headers: { 'user-agent': UA, accept: 'text/html' },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Fetch failed for ${year}: ${res.statusCode}`);
  }
  return res.body.text();
};
