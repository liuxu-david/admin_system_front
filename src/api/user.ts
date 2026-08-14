import request from "./request";
import type { UserInfoBundle } from "@/types/rbac";

/** 登录后第一个调：拿 user + roles + permissions + menus */
export const getUserInfo = () => request.get<UserInfoBundle>("/users/info");
