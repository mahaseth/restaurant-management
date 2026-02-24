import userService from "../services/user.service.js";
import {
  ROLE_OWNER,
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_CASHIER,
  ROLE_WAITER,
  ROLE_KITCHEN,
  ROLE_CUSTOMER,
} from "../constants/roles.js";

// Role hierarchy used for permission checks.
// Higher number => higher authority.
const ROLE_RANK = {
  [ROLE_OWNER]: 100,
  [ROLE_ADMIN]: 90,
  [ROLE_MANAGER]: 80,
  [ROLE_CASHIER]: 30,
  [ROLE_WAITER]: 20,
  [ROLE_KITCHEN]: 20,
};

const highestRoleRank = (roles) => {
  const list = Array.isArray(roles) ? roles : (roles ? [roles] : []);
  if (list.length === 0) return 0;
  return Math.max(...list.map((r) => ROLE_RANK[r] || 0));
};

const canManageTargetUser = (actorRoles, targetRoles) => {
  // Block if actor is lower than target. Equal level is allowed.
  return highestRoleRank(actorRoles) >= highestRoleRank(targetRoles);
};

const normalizeSingleRole = (roles) => {
  const list = Array.isArray(roles) ? roles : (roles ? [roles] : []);
  if (list.length !== 1) return null;
  return list[0];
};

// Enforces your business rules for who can assign which role.
// Owner: can create/promote ADMIN + MANAGER + other staff.
// Admin: can create/promote MANAGER + other staff, but not ADMIN.
// Manager: can create/promote other staff, but not MANAGER/ADMIN/OWNER.
const canAssignRole = (actorRoles, targetRole) => {
  const actorRank = highestRoleRank(actorRoles);

  // Never allow creating these roles from the staff panel.
  if ([ROLE_OWNER, ROLE_CUSTOMER].includes(targetRole)) return false;

  // OWNER can assign anything except OWNER/CUSTOMER.
  if (actorRank >= ROLE_RANK[ROLE_OWNER]) {
    return [ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN].includes(targetRole);
  }

  // ADMIN can assign MANAGER and below (no ADMIN).
  if (actorRank >= ROLE_RANK[ROLE_ADMIN]) {
    return [ROLE_MANAGER, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN].includes(targetRole);
  }

  // MANAGER can assign non-manager staff roles.
  if (actorRank >= ROLE_RANK[ROLE_MANAGER]) {
    return [ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN].includes(targetRole);
  }

  // Other staff cannot assign any role.
  return false;
};

const createUser = async (req, res) => {
  try {
    const requestedRole = normalizeSingleRole(req.body?.roles);
    if (!requestedRole) {
      return res.status(400).send("Exactly one role is required (roles: [\"ROLE\"]).");
    }

    // Business rules: who can create which role
    if (!canAssignRole(req.user?.roles, requestedRole)) {
      return res.status(403).send("You are not allowed to create a user with this role.");
    }

    const userData = {
      ...req.body,
      restaurantId: req.restaurant._id,
    };
    const data = await userService.createUser(userData);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const data = await userService.getUsers(req.restaurant._id);

    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const getMe = async (req, res) => {
  try {
    const data = await userService.getMe(req.restaurant._id, req.user._id);
    if (!data) return res.status(404).send("User not found.");
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const updateMyActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).send("isActive must be a boolean.");
    }
    const data = await userService.updateMyActiveStatus(req.restaurant._id, req.user._id, isActive);
    if (!data) return res.status(404).send("User not found.");
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const updateUser = async (req, res) => {
  try {
    // Do not allow lower roles to update higher roles.
    // This prevents "soft delete" via isActive=false or role changes.
    const target = await userService.getUserById(req.params.id, req.restaurant._id);
    if (!target) return res.status(404).send("User not found in your restaurant.");

    const isSelf = String(target._id) === String(req.user?._id);
    if (isSelf) {
      // Personal profile changes should go through dedicated endpoints:
      // - /api/users/profile-image
      // - /api/users/change-password
      // This keeps staff-management actions separate from personal account settings.
      return res.status(403).send("You cannot edit your own account from the staff list. Use Settings instead.");
    }
    if (!isSelf && !canManageTargetUser(req.user?.roles, target.roles)) {
      return res.status(403).send("You cannot update a user with a higher role.");
    }

    // If roles are being changed, enforce the same role assignment rules as create.
    if (req.body?.roles !== undefined) {
      const requestedRole = normalizeSingleRole(req.body.roles);
      if (!requestedRole) {
        return res.status(400).send("Exactly one role is required (roles: [\"ROLE\"]).");
      }
      if (!canAssignRole(req.user?.roles, requestedRole)) {
        return res.status(403).send("You are not allowed to assign this role.");
      }
    }

    const data = await userService.updateUser(req.params.id, req.restaurant._id, req.body);
    if (!data) return res.status(404).send("User not found in your restaurant.");
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const target = await userService.getUserById(req.params.id, req.restaurant._id);
    if (!target) return res.status(404).send("User not found in your restaurant.");

    // Prevent accidental lockout.
    if (String(target._id) === String(req.user?._id)) {
      return res.status(400).send("You cannot delete your own account.");
    }

    // Block deleting higher-role staff (e.g., Manager cannot delete Admin/Owner).
    if (!canManageTargetUser(req.user?.roles, target.roles)) {
      return res.status(403).send("You cannot delete a user with a higher role.");
    }

    const data = await userService.deleteUser(req.params.id, req.restaurant._id);
    if (!data) return res.status(404).send("User not found in your restaurant.");
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).send("Both old and new passwords are required.");
    }
    await userService.changePassword(req.user._id, oldPassword, newPassword);
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("Image file is required.");
    }
    const data = await userService.updateProfileImage(req.restaurant._id, req.user._id, req.file);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

const removeProfileImage = async (req, res) => {
  try {
    const data = await userService.removeProfileImage(req.restaurant._id, req.user._id);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).send(error?.message);
  }
};

export default {
  createUser,
  getMe,
  updateMyActiveStatus,
  getUsers,
  updateProfileImage,
  removeProfileImage,
  updateUser,
  deleteUser,
  changePassword,
};
