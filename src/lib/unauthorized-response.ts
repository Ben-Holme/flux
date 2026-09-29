/** PHP endpoints may report an expired session in a successful HTTP response. */
export async function isUnauthorizedResponse(response: Response): Promise<boolean> {
  if (response.status === 401) return true;
  try {
    const data: unknown = await response.clone().json();
    return typeof data === "object" && data !== null
      && "status" in data && data.status === "Unauthorized";
  } catch {
    // Empty replies, proxy failures, and malformed JSON are not auth failures.
    return false;
  }
}