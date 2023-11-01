export const encodeGetParams = (params: any) => {
  const query = Object.entries(params)
    .map((kv: any) => kv.map(encodeURIComponent).join('='))
    .join('&');
  return `?${query}`;
};
