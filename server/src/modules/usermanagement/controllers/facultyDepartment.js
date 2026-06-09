const Faculty = require("../../../models/faculty");
const User = require("../../../models/usermanagement/user");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const emailValues = (email) =>
  (Array.isArray(email) ? email : [email])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

const exactRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

async function getFacultyDepartmentByEmail(email) {
  const emails = emailValues(email);
  if (!emails.length) return null;

  const faculty = await Faculty.findOne({
    email: { $in: emails.map(exactRegex) },
  })
    .select("dept")
    .lean();

  return faculty?.dept?.trim() || null;
}

async function findDepartmentCoordinator(department, excludeUserId = null) {
  const faculty = await Faculty.find({
    dept: exactRegex(department),
    email: { $nin: [null, ""] },
  })
    .select("email")
    .lean();

  const emails = faculty.map((entry) => entry.email?.trim()).filter(Boolean);
  if (!emails.length) return null;

  return User.findOne({
    ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    role: "iams-dept-admin",
    email: { $in: emails.map(exactRegex) },
  })
    .select("_id email")
    .lean();
}

module.exports = {
  getFacultyDepartmentByEmail,
  findDepartmentCoordinator,
};
