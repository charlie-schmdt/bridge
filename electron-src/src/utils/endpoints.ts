const BACKEND = "localhost:8080";
const HTTP_BACKEND = "http://" + BACKEND;

export const WebSocketURL = `ws://${BACKEND}/ws`;
export const Endpoints = {
  WORKSPACES_PUBLIC: HTTP_BACKEND + "/api/workspaces/public",
  USERS: HTTP_BACKEND + "/api/users",
  SETTINGS: HTTP_BACKEND + "/api/settings",
  WORKSPACES: HTTP_BACKEND + "/api/workspaces",
  AUTH_DELETE: HTTP_BACKEND + "/api/auth/delete-account",
  AUTH_OAUTH: HTTP_BACKEND + "/api/auth/oauth",
  AUTH_LOGIN: HTTP_BACKEND + "/api/auth/login",
  AUTH_REGISTER: HTTP_BACKEND + "/api/auth/register",
  AUTH_ACCOUNT: HTTP_BACKEND + "/api/auth/account"
};
