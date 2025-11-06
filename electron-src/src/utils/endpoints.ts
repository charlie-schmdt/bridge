const BACKEND = "localhost:3000";

const HTTP_BACKEND = "http://" + BACKEND;

export const WebSocketURL = `ws://${BACKEND}/ws`;
export const Endpoints = {
  USERS: HTTP_BACKEND + "/api/users",
  SETTINGS: HTTP_BACKEND + "/api/settings",
  WORKSPACE: HTTP_BACKEND + "/api/workspace",
  WORKSPACE_JOIN: HTTP_BACKEND + "/api/workspace/join",
  WORKSPACES: HTTP_BACKEND + "/api/workspaces",
  WORKSPACES_USER: HTTP_BACKEND + "/api/workspaces/user",
  WORKSPACES_PUBLIC: HTTP_BACKEND + "/api/workspaces/public",
  AUTH_DELETE: HTTP_BACKEND + "/api/auth/delete-account",
  AUTH_OAUTH: HTTP_BACKEND + "/api/auth/oauth",
  AUTH_LOGIN: HTTP_BACKEND + "/api/auth/login",
  AUTH_REGISTER: HTTP_BACKEND + "/api/auth/register",
  AUTH_ACCOUNT: HTTP_BACKEND + "/api/auth/account"
};
