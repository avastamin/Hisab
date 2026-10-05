import { decodeToast, encodeToast, type ToastMessage } from "../toast";

const toast: ToastMessage = { id: "abc", type: "success", message: 'Saved "Fish" ৳ 900.00; 50% off, ok?' };

describe("toast cookie encoding", () => {
  it("round-trips, including quotes, unicode and cookie-unsafe characters", () => {
    expect(decodeToast(encodeToast(toast))).toEqual(toast);
  });

  it("survives being percent-encoded a second time by the cookie layer", () => {
    expect(decodeToast(encodeURIComponent(encodeToast(toast)))).toEqual(toast);
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["not JSON", "hello"],
    ["unknown type", encodeURIComponent(JSON.stringify({ id: "1", type: "party", message: "x" }))],
    ["no message", encodeURIComponent(JSON.stringify({ id: "1", type: "info" }))],
    ["broken escape", "%E0%A4%A"],
  ])("ignores a %s value", (_label, value) => {
    expect(decodeToast(value)).toBeNull();
  });
});
