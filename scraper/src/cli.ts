import { handler } from './handler.js';

const yearArg = process.argv[2];
const year = yearArg ? Number(yearArg) : undefined;

handler({ year })
  .then((result) => {
    console.info(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
