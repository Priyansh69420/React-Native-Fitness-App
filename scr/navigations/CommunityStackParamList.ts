import { Post, UserData } from "../screens/home/Community";

export type CommunityStackParamList = {
    Community: undefined;
    Post: { item: Post, name: string| undefined, profilePic: string | undefined };
    UserInfo: { user: UserData };
};
