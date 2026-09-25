interface BugSubmissionResult {
  status: "OK" | "unconfirmed";
  xp_awarded?: number;
}

export async function readBugSubmissionResponse(response: Response): Promise<BugSubmissionResult> {
  const body = await response.text();
  const httpStatus = `HTTP ${response.status}`;
  const unconfirmed = "Your draft has been kept. Check the reports list before submitting again to avoid a duplicate.";

  if (!body.trim()) {
    if (response.ok) return { status: "unconfirmed" };
    throw new Error(`The bug-report server returned an empty response (${httpStatus}). Submission could not be confirmed. ${unconfirmed}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    // Do not expose raw PHP errors or proxy HTML in the UI.
    if (response.ok) return { status: "unconfirmed" };
    throw new Error(`The bug-report server returned invalid JSON (${httpStatus}). Submission could not be confirmed. ${unconfirmed}`);
  }

  if (typeof data !== "object" || data === null || !("status" in data) || typeof data.status !== "string") {
    if (response.ok) return { status: "unconfirmed" };
    throw new Error(`The bug-report server returned an unexpected response (${httpStatus}). Submission could not be confirmed. ${unconfirmed}`);
  }

  if (data.status === "Unauthorized" || response.status === 401) {
    throw new Error("Your session was not accepted. Your draft has been kept. Sign in again in another tab before retrying.");
  }
  if (!response.ok || data.status !== "OK") {
    const reason = data.status === "OK" ? "Server error" : data.status;
    throw new Error(`Bug submission failed (${httpStatus}): ${reason}. ${unconfirmed}`);
  }

  return {
    status: "OK",
    xp_awarded: "xp_awarded" in data && typeof data.xp_awarded === "number"
      ? data.xp_awarded
      : undefined,
  };
}