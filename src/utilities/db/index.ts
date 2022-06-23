import { Document, Model, Types } from 'mongoose';
import { StringDecoder } from 'string_decoder';
import {
  AvatarSchemaType,
  CurrentUserType,
  ProfileType,
  UserType,
  url,
} from '../types.js';
import UserModel from '../../schemas/UserSchema.js';
import category from '../../schemas/categorySchema.js';
import avatar from '../../schemas/avatarSchema.js';

// ----------------------- local ----------------------- //

const setFieldWithId = <T>(
  dataPoint: Model<T>,
  userId: string,
  valueToUpdate: unknown
) => dataPoint.updateOne({ _id: userId }, { $set: { valueToUpdate } });

// ----------------------- local ----------------------- //

const findUserByEmail = (value: string | number) =>
  UserModel.findOne({ email: value });

const findUserById = (id: string) => UserModel.findById(id);

const findUserByRefreshToken = (refreshToken: string) =>
  UserModel.findOne({ refreshToken });

const removeUser = (userId: string) => UserModel.remove({ _id: userId });

const updatePassword = (userId: string, valueToUpdate: string | null) =>
  setFieldWithId(UserModel, userId, valueToUpdate);

const updateRefreshToken = (userId: string, refreshToken: string | null) =>
  UserModel.updateOne(
    { _id: userId },
    { $set: { refreshToken: refreshToken } }
  );

const removeRefreshToken = (userId: string) =>
  UserModel.findOne<UserType>({ _id: userId }).then((user: UserType | null) =>
    UserModel.updateOne(
      { _id: userId },
      { $unset: { refreshToken: user?.refreshToken || '' } }
    )
  );

const addProfileToUser = (userId: StringDecoder, data: ProfileType) =>
  UserModel.updateOne({ _id: userId }, { $push: { profiles: data } });

const getSingleCategoryBaId = (categoryId: string) =>
  category.findOne({ _id: categoryId });

const getAllCategories = () => category.find();

const getSingleAvatarById = (avatarId: string) =>
  avatar.findOne({ _id: avatarId });

const getAllAvatars = () => avatar.find();

const addUsersVideos = async (
  userId: string,
  videoSchemaId: Types.ObjectId
) => {
  const a = UserModel.updateOne(
    { _id: userId },
    { $push: { videosUploaded: videoSchemaId } }
  );
};

const returnAvatar = (
  data:
    | (Document<unknown, any, AvatarSchemaType> &
        AvatarSchemaType & {
          _id: string;
        })
    | null
) => {
  return {
    id: data?._id,
    name: data?.name,
    url: `${url}/${data?.url}`,
    urlPath: data?.url,
    categories: data?.categories,
  };
};

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
    profiles:
      user?.profiles?.map(({ _id, profileName, avatarURL }) => ({
        _id,
        profileName,
        avatarURL: `${url}/${avatarURL}`,
      })) || undefined,
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
  getSingleCategoryBaId,
  getAllCategories,
  getSingleAvatarById,
  getAllAvatars,
  returnAvatar,
  addUsersVideos,
};
