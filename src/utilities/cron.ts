import cron from 'node-cron';
import db from './db/index.js';

// run once every month
const resetMonthlyViews = () =>
  cron
    .schedule('0 0 0 1 * 0', async () => {
      await db.resetMoviesMonthlyViews();
      // await db.resetSeriesMonthlyViews();
      console.log('update');
    })
    .start();

export { resetMonthlyViews };
