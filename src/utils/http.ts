export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function badRequest(message: string): Response {
  return Response.json(
    { error: message },
    { status: 400 }
  );
}