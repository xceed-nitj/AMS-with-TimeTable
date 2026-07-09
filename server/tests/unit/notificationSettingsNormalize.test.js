const NotificationSettingsController = require("../../src/modules/attendanceModule/controllers/notificationSettingsController");
const { normalizeAlertTypes } = NotificationSettingsController;

describe("normalizeAlertTypes", () => {
  it("strips unknown keys", () => {
    const result = normalizeAlertTypes({ serverDown: true, notARealKey: true });
    expect(result).not.toHaveProperty("notARealKey");
  });

  it("defaults missing known keys to false", () => {
    const result = normalizeAlertTypes({ serverDown: true });
    expect(result.classBunk).toBe(false);
  });

  it("coerces non-boolean values to booleans", () => {
    const result = normalizeAlertTypes({ serverDown: "yes", classBunk: 0, erpDown: 1 });
    expect(result.serverDown).toBe(true);
    expect(result.classBunk).toBe(false);
    expect(result.erpDown).toBe(true);
  });

  it("handles an empty/undefined input", () => {
    const result = normalizeAlertTypes();
    expect(typeof result).toBe("object");
    expect(Object.values(result).every((v) => v === false)).toBe(true);
  });
});
