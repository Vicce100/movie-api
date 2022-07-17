import cron from 'node-cron';
import db from './db/index.js';

const resetMonthlyViews = () => {
  // run once every month
  cron
    .schedule('0 0 0 * 0', async () => {
      await db.resetMoviesMonthlyViews();
      // await db.resetSeriesMonthlyViews();
      console.log('update');
    })
    .start();
};

export { resetMonthlyViews };
