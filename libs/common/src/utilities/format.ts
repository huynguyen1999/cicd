export const removeUndefinedFields = (obj: any) => {
  if (obj && typeof obj === 'object') {
    // Recursively remove null and undefined fields
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = removeUndefinedFields(obj[key]);
        if (typeof obj[key] === 'undefined') {
          delete obj[key];
        }
      }
    }
  }
  return obj;
};
