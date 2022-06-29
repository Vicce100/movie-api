import { Document, Model, Types } from 'mongoose';
import { StringDecoder } from 'string_decoder';
import {
  AvatarSchemaType,
  CurrentUserType,
  ProfileType,
  UserType,
  url,
} from '../types.js';
import userSchema from '../../schemas/UserSchema.js';
import categorySchema from '../../schemas/categorySchema.js';
import avatarSchema from '../../schemas/avatarSchema.js';
import videoSchema from '../../schemas/movieSchema.js';

/* ----------------------- local ----------------------- */

const setFieldWithId = <T>(
  dataPoint: Model<T>,
  userId: string,
  valueToUpdate: unknown
) => dataPoint.updateOne({ _id: userId }, { $set: { valueToUpdate } });

/* ----------------------- user ----------------------- */

const findUserByEmail = (value: string | number) =>
  userSchema.findOne({ email: value });

const findUserById = (id: string) => userSchema.findById(id);

const findUserByRefreshToken = (refreshToken: string) =>
  userSchema.findOne({ refreshToken });

const removeUser = (userId: string) => userSchema.remove({ _id: userId });

const updatePassword = (userId: string, valueToUpdate: string | null) =>
  setFieldWithId(userSchema, userId, valueToUpdate);

const updateRefreshToken = (userId: string, refreshToken: string | null) =>
  userSchema.updateOne(
    { _id: userId },
    { $set: { refreshToken: refreshToken } }
  );

const removeRefreshToken = (userId: string) =>
  userSchema
    .findOne<UserType>({ _id: userId })
    .then((user: UserType | null) =>
      userSchema.updateOne(
        { _id: userId },
        { $unset: { refreshToken: user?.refreshToken || '' } }
      )
    );

const removeUsersVideoRef = (userId: string, videoId: string) =>
  userSchema.updateOne(
    { _id: userId },
    { $pullAll: { videosUploaded: videoId } }
  );

const addProfileToUser = (userId: StringDecoder, data: ProfileType) =>
  userSchema.updateOne({ _id: userId }, { $push: { profiles: data } });

const EmailTaken = async (email: string) =>
  (await findUserByEmail(email)) ? true : false;

/* ----------------------- category ----------------------- */

const getSingleCategoryBaId = (categoryId: string) =>
  categorySchema.findOne({ _id: categoryId });

const getSingleCategoryBaName = (categoryName: string) =>
  categorySchema.findOne({ name: categoryName });

const getAllCategories = () => categorySchema.find();

/* ----------------------- avatar ----------------------- */

const getSingleAvatarById = (avatarId: string) =>
  avatarSchema.findOne({ _id: avatarId });

const getAllAvatars = () => avatarSchema.find();

/* ----------------------- video ----------------------- */

const addUsersVideos = async (userId: string, videoId: Types.ObjectId) =>
  userSchema.updateOne({ _id: userId }, { $push: { videosUploaded: videoId } });

const findVideoById = (videoId: string) =>
  videoSchema.findOne({ _id: videoId });

const findVideoByName = (videoTitle: string) =>
  videoSchema.findOne({ title: videoTitle });

/* ----------------------- returned values ----------------------- */

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
  removeUsersVideoRef,
  EmailTaken,
  getSingleCategoryBaId,
  getSingleCategoryBaName,
  getAllCategories,
  getSingleAvatarById,
  findVideoById,
  findVideoByName,
  getAllAvatars,
  returnAvatar,
  addUsersVideos,
};
