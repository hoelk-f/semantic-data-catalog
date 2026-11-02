import { restoreSession, setSession } from "./solidSession";

jest.mock("@inrupt/solid-client-authn-browser", () => ({ Session: jest.fn() }));

test("restores the previous session and handles the callback using Inrupt options", async () => {
  window.history.replaceState({}, "", "/catalog/?code=example&state=test");
  const handleIncomingRedirect = jest.fn().mockResolvedValue(undefined);
  setSession({ handleIncomingRedirect });

  await restoreSession();

  expect(handleIncomingRedirect).toHaveBeenCalledWith({
    url: window.location.href,
    restorePreviousSession: true,
  });
});
