const BACKEND = process.env.PUBLIC_API_URL;

export const WebSocketURL = process.env.PUBLIC_WS_URL;
export const Endpoints = {
  USERS: BACKEND + "/api/users",
  SETTINGS: BACKEND + "/api/settings",
  WORKSPACE: BACKEND + "/api/workspace",
  WORKSPACE_JOIN: BACKEND + "/api/workspace/join",
  WORKSPACES: BACKEND + "/api/workspaces",
  WORKSPACES_USER: BACKEND + "/api/workspaces/user",
  WORKSPACES_PUBLIC: BACKEND + "/api/workspaces/public",
  ROOMS: BACKEND + "/api/rooms",
  AUTH_DELETE: BACKEND + "/api/auth/delete-account",
  AUTH_OAUTH: BACKEND + "/api/auth/oauth",
  AUTH_LOGIN: BACKEND + "/api/auth/login",
  AUTH_REGISTER: BACKEND + "/api/auth/register",
  AUTH_ACCOUNT: BACKEND + "/api/auth/account"
};