import type { PlacementInput } from "./learner-types";
import { useProgress } from "./progress";

function unauthorized(error: unknown) {
  if (!(error instanceof Error)) return false;
  const status = (error as { status?: number }).status;
  return error.message === "Unauthorized" || status === 401;
}

export async function refreshLearner(userId: string) {
  useProgress.setState({ cloudStatus: "loading", cloudUserId: userId });
  try {
    const { loadLearner } = await import("./learner.functions");
    const row = await loadLearner();
    useProgress.getState().applyServer(row, userId);
  } catch (error) {
    useProgress.setState({ cloudStatus: unauthorized(error) ? "signedout" : "error" });
  }
}

export async function submitPlacement(input: PlacementInput) {
  const { completePlacement } = await import("./learner.functions");
  const row = await completePlacement({ data: input });
  const userId = useProgress.getState().cloudUserId;
  useProgress.getState().applyServer(row, userId);
}
