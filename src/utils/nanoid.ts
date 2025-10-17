const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

export const nanoid = (size = 10) => {
  let id = '';
  const cryptoObj = globalThis.crypto || (globalThis as any).msCrypto;
  if (cryptoObj?.getRandomValues) {
    const values = new Uint8Array(size);
    cryptoObj.getRandomValues(values);
    values.forEach((value) => {
      id += alphabet[value % alphabet.length];
    });
  } else {
    for (let i = 0; i < size; i += 1) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return id;
};
