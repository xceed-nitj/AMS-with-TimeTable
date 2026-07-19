// Integration tests for the forgot-password / reset-password OTP flow.
// Covers the bugs fixed in forgotpasswordroute.js / resetpasswordroute.js:
//  - a fresh OTP is issued on every request (no stale-record reuse)
//  - OTP lookup is case/whitespace-insensitive on the email
//  - reset fails loudly when no user account matches
//  - the OTP is single-use

jest.mock("../../src/modules/mailsender", () =>
  jest.fn(async () => ({ accepted: true })),
);

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const { connect, clearDatabase, disconnect } = require("../helpers/db");
const mailSender = require("../../src/modules/mailsender");
const User = require("../../src/models/usermanagement/user");
const OTP = require("../../src/models/usermanagement/otp");

let app;

beforeAll(async () => {
  await connect();
  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/auth", require("../../src/modules/usermanagement/routes/routes"));
});
afterEach(async () => {
  await clearDatabase();
  mailSender.mockClear();
});
afterAll(disconnect);

const EMAIL = "Test.User@nitj.ac.in"; // deliberately mixed-case

async function createUser() {
  return User.create({
    name: EMAIL,
    email: [EMAIL],
    password: await bcrypt.hash("oldpass!1", 10),
    role: ["FACULTY"],
  });
}

async function storedOtp() {
  const doc = await OTP.findOne({ email: EMAIL.toLowerCase() });
  return doc && doc.otp;
}

describe("POST /auth/forgot-password", () => {
  it("reports failure for an unknown email", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "nobody@nitj.ac.in" });
    expect(res.body.success).toBe(false);
    expect(await OTP.countDocuments()).toBe(0);
  });

  it("stores the OTP keyed by lowercased email and emails it", async () => {
    await createUser();
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: EMAIL });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const otp = await storedOtp();
    expect(otp).toMatch(/^\d{6}$/);
    expect(mailSender).toHaveBeenCalledTimes(1);
    const [to, subject, html] = mailSender.mock.calls[0];
    expect(to).toBe(EMAIL);
    expect(subject).toMatch(/Forgot Password/i);
    expect(html).toContain(otp);
  });

  it("issues a fresh OTP on every request instead of reusing a stale one", async () => {
    await createUser();
    await request(app).post("/auth/forgot-password").send({ email: EMAIL });
    const first = await storedOtp();

    // Simulate a near-expiry record: backdate it, then request again.
    await OTP.updateMany({}, { $set: { createdAt: new Date(Date.now() - 9.5 * 60 * 1000) } });
    await request(app).post("/auth/forgot-password").send({ email: EMAIL });

    const docs = await OTP.find({ email: EMAIL.toLowerCase() });
    expect(docs).toHaveLength(1); // old record replaced, not duplicated
    const ageMs = Date.now() - new Date(docs[0].createdAt).getTime();
    expect(ageMs).toBeLessThan(60 * 1000); // brand-new record, full 10-minute life
    // The email sent last always contains the currently valid OTP.
    const lastHtml = mailSender.mock.calls.at(-1)[2];
    expect(lastHtml).toContain(docs[0].otp);
    expect(first).toMatch(/^\d{6}$/);
  });
});

describe("POST /auth/reset-password", () => {
  it("rejects a wrong OTP", async () => {
    await createUser();
    await request(app).post("/auth/forgot-password").send({ email: EMAIL });
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ email: EMAIL, otp: "000000", password: "newpass!1" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid OTP");
  });

  it("accepts the OTP even when the email is re-typed in a different case with spaces", async () => {
    await createUser();
    await request(app).post("/auth/forgot-password").send({ email: EMAIL });
    const otp = await storedOtp();

    const res = await request(app)
      .post("/auth/reset-password")
      .send({ email: `  ${EMAIL.toUpperCase()}  `, otp: ` ${otp} `, password: "newpass!1" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Password really changed…
    const user = await User.findOne({ email: EMAIL });
    expect(await bcrypt.compare("newpass!1", user.password)).toBe(true);
    // …and the OTP is single-use.
    expect(await OTP.countDocuments()).toBe(0);
  });

  it("fails loudly when the OTP is valid but no user account matches", async () => {
    await OTP.create({ email: "ghost@nitj.ac.in", otp: "123456" });
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ email: "ghost@nitj.ac.in", otp: "123456", password: "newpass!1" });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("rejects reuse of an already-consumed OTP", async () => {
    await createUser();
    await request(app).post("/auth/forgot-password").send({ email: EMAIL });
    const otp = await storedOtp();
    await request(app)
      .post("/auth/reset-password")
      .send({ email: EMAIL, otp, password: "newpass!1" });
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ email: EMAIL, otp, password: "anotherpass!1" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid OTP");
  });
});
