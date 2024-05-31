const BASE_URL = 'https://www.macys.com/xapi/discover/v1/page';
export default async function invokePageApi(path, categoryId, params) {
  // encoding this fails, for...reasons !!!!?!?!?!
  // hence handles differently
  const pathParam = `pathname=${path}&id=${categoryId}`;
  const allParams = {
    ...params,
    _application: 'SITE',
    _navigationType: 'BROWSE',
    _shoppingMode: 'SITE',
    _regionCode: 'US',
  };
  const additionalParams = `&${Object.entries(allParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;

  const fetchUrl = `${BASE_URL}?${pathParam}${additionalParams}`;
  return fetch(fetchUrl);
}
