export const jpeg = 'image/jpeg';
export const jpg = 'image/jpg';
export const png = 'image/png';
export const mp4 = 'video/mp4';

export const MulterErrorCode: {
  LIMIT_PART_COUNT: 'LIMIT_PART_COUNT';
  LIMIT_FILE_SIZE: 'LIMIT_FILE_SIZE';
  LIMIT_FILE_COUNT: 'LIMIT_FILE_COUNT';
  LIMIT_FIELD_KEY: 'LIMIT_FIELD_KEY';
  LIMIT_FIELD_VALUE: 'LIMIT_FIELD_VALUE';
  LIMIT_FIELD_COUNT: 'LIMIT_FIELD_COUNT';
  LIMIT_UNEXPECTED_FILE: 'LIMIT_UNEXPECTED_FILE';
} = {
  LIMIT_PART_COUNT: 'LIMIT_PART_COUNT',
  LIMIT_FILE_SIZE: 'LIMIT_FILE_SIZE',
  LIMIT_FILE_COUNT: 'LIMIT_FILE_COUNT',
  LIMIT_FIELD_KEY: 'LIMIT_FIELD_KEY',
  LIMIT_FIELD_VALUE: 'LIMIT_FIELD_VALUE',
  LIMIT_FIELD_COUNT: 'LIMIT_FIELD_COUNT',
  LIMIT_UNEXPECTED_FILE: 'LIMIT_UNEXPECTED_FILE',
};

type UsersRolesType = 'admin' | 'user';
type UserStatusType = 'active' | 'disabled';

export type CategorySchemaType = {
  _id: string;
  name: string;
  url: string;
};

export type AvatarSchemaType = {
  _id: string;
  category: string;
  name: string;
  url: string;
};

export type ProfileType = {
  id: string;
  profileName: string;
  avatarURL: string;
}[];

export type UserType = {
  _id: string;
  email: string;
  refreshToken: string;
  password: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  profiles: ProfileType;
  role: UsersRolesType;
  userStatus: UserStatusType;
};

export type CurrentUserType = {
  id: string;
  email: string;
  createdAt: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
  profiles: ProfileType;
  role: UsersRolesType;
  userStatus: UserStatusType;
};
