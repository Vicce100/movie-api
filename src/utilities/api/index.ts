import { Model } from 'mongoose';
import { StringDecoder } from 'string_decoder';
import { CurrentUserType, ProfileType, UserType } from '../types';
import UserModel from '../../schemas/UserSchema.js';

// ----------------------- local ----------------------- //

const setFieldWithId = async <T>(
  dataPoint: Model<T>,
  userId: string,
  valueToUpdate: unknown
) => dataPoint.updateOne({ _id: userId }, { $set: { valueToUpdate } });

// ----------------------- local ----------------------- //

const findUserByEmail = async <T>(value: string | number): Promise<T | null> =>
  UserModel.findOne({ email: value });

const findUserById = async <T>(id: string): Promise<T | null> =>
  UserModel.findById(id);

const findUserByRefreshToken = async (
  refreshToken: string
): Promise<UserType | null> => await UserModel.findOne({ refreshToken });

const removeUser = async <T>(userId: string): Promise<T | null> =>
  UserModel.remove({ _id: userId });

const updatePassword = (userId: string, valueToUpdate: string | null) =>
  setFieldWithId(UserModel, userId, valueToUpdate);

const updateRefreshToken = (userId: string, refreshToken: string | null) =>
  UserModel.updateOne(
    { _id: userId },
    { $set: { refreshToken: refreshToken } }
  );

const removeRefreshToken = async (userId: string) =>
  UserModel.findOne<UserType>({ _id: userId }).then((user) =>
    UserModel.updateOne(
      { _id: userId },
      { $unset: { refreshToken: user?.refreshToken || '' } }
    )
  );

const addProfileToUser = (userId: StringDecoder, data: ProfileType) =>
  UserModel.updateOne({ _id: userId }, { $push: { profiles: data } });

const returnErrorData = (message: string, status: string | number) => ({
  message,
  status: String(status),
});

const returnCurrentUser = (
  user: UserType
): { currentUser: CurrentUserType } => ({
  currentUser: {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    refreshToken: user.refreshToken,
    firstName: user.firstName,
    lastName: user.lastName,
    profiles: user.profiles,
    role: user.role,
    userStatus: user.userStatus,
  },
});

export default {
  findUserByEmail,
  findUserById,
  findUserByRefreshToken,
  removeUser,
  returnErrorData,
  returnCurrentUser,
  addProfileToUser,
  updatePassword,
  updateRefreshToken,
  removeRefreshToken,
};
