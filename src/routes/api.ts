import { createNotificationRequest } from "../controllers/createNotification";

type RouteHandler = (req: Request) => Response | Promise<Response>;

type RouteTable = Record<string, Partial<Record<string, RouteHandler>>>;

const routes: RouteTable = {
  "/api/createNotification": {
    POST: createNotificationRequest,
  },
};

export async function apiRouter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const route = routes[pathname];

  if (!route) {
    return Response.json(
      { error: `No API route found for ${pathname}` },
      { status: 404 }
    );
  }

  const handler = route[req.method];

  if (!handler) {
    return Response.json(
      { error: `Method ${req.method} not allowed for ${pathname}` },
      { status: 405 }
    );
  }

  return handler(req);
}