const whitelist = [
  'https://www.testsite.com',
  'http://127.0.0.1:5500',
  'http://localhost:3500',
];
const blacklist: string[] = [];

const corsOptions = {
  // whitelist
  // origin: (origin: any, callback: any) => {
  //   if (whitelist.indexOf(origin) !== -1 || !origin) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('Not allowed by CORS'));
  //   }
  // },

  // blacklist
  origin: (origin: any, callback: any) => {
    if (blacklist.indexOf(origin) !== -1)
      callback(new Error('Not allowed by CORS'));
    else callback(null, true);
  },
  optionsSuccessStatus: 200,
  credentials: true,
};

export default corsOptions;
