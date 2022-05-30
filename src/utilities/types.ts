export type UserType = {
  _id: string;
  username: string;
  name: string;
  email: string;
  refreshToken: string;
  password: string;
  createdAt: string;
};

export type CurrentUserType = {
  _id: string;
  username: string;
  name: string;
  email: string;
  createdAt: string;
  refreshToken: string;
};
