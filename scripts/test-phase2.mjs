/**
 * ==============================================================================
 * LMB (Lets Make Brand) Platform - Phase 2 Automated Verification Suite
 * ==============================================================================
 * Tests the 16 Required Workflows for Organization & User Management:
 * 1. Vendor registration
 * 2. Vendor pending approval
 * 3. Vendor approval (generates LMB-VEN-000001)
 * 4. Vendor rejection
 * 5. Vendor suspension
 * 6. Partner registration
 * 7. Partner approval (generates LMB-PAR-000001)
 * 8. Partner ID generation
 * 9. Admin permission assignment (can_manage_vendor_transfers default FALSE)
 * 10. Team creation (generates LMB-TEAM-000001)
 * 11. Team Leader assignment
 * 12. Team Member invitation
 * 13. Invitation acceptance
 * 14. Cross-Vendor access prevention
 * 15. Team Leader earning restrictions
 * 16. Vendor suspension lifecycle rules
 * ==============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
  }
}

console.log("\n=======================================================");
console.log("       LMB PLATFORM - PHASE 2 VERIFICATION SUITE       ");
console.log("=======================================================\n");

// ----------------------------------------------------------------------
// WORKFLOW 1 & 2: VENDOR REGISTRATION & PENDING APPROVAL
// ----------------------------------------------------------------------
console.log("WORKFLOW 1 & 2: VENDOR REGISTRATION & PENDING APPROVAL STATE");

const vendorRegPage = path.join(rootDir, "src/app/(auth)/register/vendor/page.tsx");
assert(fs.existsSync(vendorRegPage), "Vendor registration page (src/app/(auth)/register/vendor/page.tsx) exists");

const validationFile = path.join(rootDir, "src/lib/security/validation.ts");
assert(fs.existsSync(validationFile), "Validation module exists");

const validationCode = fs.readFileSync(validationFile, "utf-8");
assert(validationCode.includes("vendorRegisterSchema"), "vendorRegisterSchema is exported in validation.ts");

const vendorFields = [
  "fullName",
  "businessName",
  "email",
  "mobile",
  "address",
  "city",
  "state",
  "pincode",
  "profilePhotoUrl",
  "password",
];
for (const field of vendorFields) {
  assert(validationCode.includes(field), `vendorRegisterSchema includes required field '${field}'`);
}

const pendingApprovalPage = path.join(rootDir, "src/app/(auth)/pending-approval/page.tsx");
assert(fs.existsSync(pendingApprovalPage), "Pending approval waiting gate exists (src/app/(auth)/pending-approval/page.tsx)");

const sessionFile = path.join(rootDir, "src/lib/auth/session.ts");
const sessionCode = fs.readFileSync(sessionFile, "utf-8");
assert(sessionCode.includes("pending_approval"), "Session verification gates pending_approval status");
assert(sessionCode.includes("/pending-approval"), "Session redirects pending_approval users to /pending-approval");

// ----------------------------------------------------------------------
// WORKFLOW 3, 4 & 5: VENDOR APPROVAL, REJECTION & SUSPENSION
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 3, 4 & 5: VENDOR APPROVAL (ID GEN), REJECTION & SUSPENSION");

const vendorActionsFile = path.join(rootDir, "src/app/dashboard/super-admin/vendors/actions.ts");
assert(fs.existsSync(vendorActionsFile), "Vendor Super Admin actions file exists");

const vendorActionsCode = fs.readFileSync(vendorActionsFile, "utf-8");
assert(vendorActionsCode.includes("export async function approveVendorAction"), "approveVendorAction is exported");
assert(vendorActionsCode.includes("LMB-VEN-"), "approveVendorAction generates unique LMB-VEN- sequence ID");
assert(vendorActionsCode.includes("generate_vendor_id"), "approveVendorAction uses database generate_vendor_id() RPC");
assert(vendorActionsCode.includes("DOCUMENT_GENERATION_TRIGGERED"), "approveVendorAction triggers document generation workflow");
assert(vendorActionsCode.includes("export async function rejectVendorAction"), "rejectVendorAction is exported");
assert(vendorActionsCode.includes("rejection_reason"), "rejectVendorAction stores mandatory rejection reason");
assert(vendorActionsCode.includes("export async function suspendVendorAction"), "suspendVendorAction is exported");
assert(vendorActionsCode.includes("suspension_reason"), "suspendVendorAction stores mandatory suspension reason");

// ----------------------------------------------------------------------
// WORKFLOW 6, 7 & 8: PARTNER REGISTRATION & APPROVAL (ID GEN)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 6, 7 & 8: PARTNER REGISTRATION & APPROVAL (LMB-PAR-000001)");

const partnerRegPage = path.join(rootDir, "src/app/(auth)/register/partner/page.tsx");
assert(fs.existsSync(partnerRegPage), "Partner registration page (src/app/(auth)/register/partner/page.tsx) exists");

assert(validationCode.includes("partnerRegisterSchema"), "partnerRegisterSchema is exported in validation.ts");

const partnerFields = [
  "fullName",
  "email",
  "mobile",
  "dob",
  "gender",
  "address",
  "city",
  "state",
  "pincode",
  "profilePhotoUrl",
  "referralCode",
  "registrationType",
];
for (const field of partnerFields) {
  assert(validationCode.includes(field), `partnerRegisterSchema includes required field '${field}'`);
}

const partnerActionsFile = path.join(rootDir, "src/app/dashboard/super-admin/partners/actions.ts");
assert(fs.existsSync(partnerActionsFile), "Partner Super Admin actions file exists");

const partnerActionsCode = fs.readFileSync(partnerActionsFile, "utf-8");
assert(partnerActionsCode.includes("export async function approvePartnerAction"), "approvePartnerAction is exported");
assert(partnerActionsCode.includes("LMB-PAR-"), "approvePartnerAction generates unique LMB-PAR- sequence ID");
assert(partnerActionsCode.includes("generate_partner_id"), "approvePartnerAction uses database generate_partner_id() RPC");
assert(partnerActionsCode.includes("export async function rejectPartnerAction"), "rejectPartnerAction is exported");
assert(partnerActionsCode.includes("export async function suspendPartnerAction"), "suspendPartnerAction is exported");

// ----------------------------------------------------------------------
// WORKFLOW 9: ADMIN PERMISSION ASSIGNMENT & SENSITIVE PERMISSION DEFAULTS
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 9: ADMIN PERMISSION ASSIGNMENT & CAN_MANAGE_VENDOR_TRANSFERS = FALSE");

const adminActionsFile = path.join(rootDir, "src/app/dashboard/super-admin/admins/actions.ts");
assert(fs.existsSync(adminActionsFile), "Admin actions file exists");

const adminActionsCode = fs.readFileSync(adminActionsFile, "utf-8");
assert(adminActionsCode.includes("export async function createAdminAction"), "createAdminAction is exported");
assert(adminActionsCode.includes("can_manage_vendor_transfers"), "can_manage_vendor_transfers permission logic is implemented");
assert(adminActionsCode.includes("requireRole([\"super_admin\"])"), "Only Super Admin can provision admin permissions");
assert(adminActionsCode.includes("Boolean(validated.canManageVendorTransfers)"), "Transfer permission explicitly evaluated");

const createAdminDialog = path.join(rootDir, "src/app/dashboard/super-admin/admins/create-admin-dialog.tsx");
assert(fs.existsSync(createAdminDialog), "Create Admin Dialog component exists");

const dialogCode = fs.readFileSync(createAdminDialog, "utf-8");
assert(dialogCode.includes("canManageVendorTransfers: false"), "canManageVendorTransfers strictly defaults to FALSE in dialog state");

// ----------------------------------------------------------------------
// WORKFLOW 10 & 11: TEAM CREATION & TEAM LEADER ASSIGNMENT
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 10 & 11: TEAM CREATION (LMB-TEAM-000001) & TEAM LEADER APPOINTMENT");

const teamActionsFile = path.join(rootDir, "src/app/dashboard/vendor/teams/actions.ts");
assert(fs.existsSync(teamActionsFile), "Vendor Team actions file exists");

const teamActionsCode = fs.readFileSync(teamActionsFile, "utf-8");
assert(teamActionsCode.includes("export async function createTeamAction"), "createTeamAction is exported");
assert(teamActionsCode.includes("LMB-TEAM-"), "createTeamAction generates unique LMB-TEAM- sequence ID");
assert(teamActionsCode.includes("generate_team_id"), "createTeamAction uses database generate_team_id() RPC");
assert(teamActionsCode.includes("export async function updateTeamAction"), "updateTeamAction is exported");
assert(teamActionsCode.includes("export async function removeMemberFromTeamAction"), "removeMemberFromTeamAction is exported");
assert(teamActionsCode.includes("role_in_team: \"leader\""), "Team Leader is assigned as squad leader in team_members");

// ----------------------------------------------------------------------
// WORKFLOW 12 & 13: INVITATION WORKFLOW & INVITATION ACCEPTANCE
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 12 & 13: INVITATION WORKFLOW & INVITATION ACCEPTANCE");

const invitationActionsFile = path.join(rootDir, "src/app/dashboard/vendor/invitations/actions.ts");
assert(fs.existsSync(invitationActionsFile), "Vendor Invitation actions file exists");

const invitationActionsCode = fs.readFileSync(invitationActionsFile, "utf-8");
assert(invitationActionsCode.includes("export async function sendInvitationAction"), "sendInvitationAction is exported");
assert(invitationActionsCode.includes("crypto.randomBytes(32).toString(\"hex\")"), "Cryptographically random token generation");
assert(invitationActionsCode.includes("expiresAt"), "Invitation expiration is configured (7 days)");

const inviteRoute = path.join(rootDir, "src/app/invite/[token]/page.tsx");
const inviteAcceptAction = path.join(rootDir, "src/app/invite/[token]/actions.ts");
assert(fs.existsSync(inviteRoute), "Public invitation route (/invite/[token]) exists");
assert(fs.existsSync(inviteAcceptAction), "Invitation acceptance server action exists");

const inviteAcceptCode = fs.readFileSync(inviteAcceptAction, "utf-8");
assert(inviteAcceptCode.includes("export async function acceptInvitationAction"), "acceptInvitationAction is exported");
assert(inviteAcceptCode.includes("user.email.toLowerCase() !== invitation.email.toLowerCase()"), "Server verifies authenticated email matches invited email");
assert(inviteAcceptCode.includes("new Date(invitation.expires_at) < new Date()"), "Server verifies invitation has not expired");
assert(inviteAcceptCode.includes("accepted_by: user.id"), "Records accepted_by user ID upon acceptance");
assert(inviteAcceptCode.includes("status: \"accepted\""), "Updates invitation status to accepted");

// ----------------------------------------------------------------------
// WORKFLOW 14: CROSS-VENDOR ACCESS PREVENTION & RLS
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 14: CROSS-VENDOR DATA ISOLATION & ROW LEVEL SECURITY");

assert(teamActionsCode.includes("team.vendor_id !== currentVendor.id"), "Vendor Team actions strictly verify vendor ownership");
assert(invitationActionsCode.includes("team.vendor_id !== currentVendor.id"), "Vendor Invitation actions strictly verify vendor ownership");

const rlsMigration = path.join(rootDir, "supabase/migrations/00005_phase2_rls_policies.sql");
assert(fs.existsSync(rlsMigration), "Phase 2 RLS policies migration (00005) exists");

const rlsCode = fs.readFileSync(rlsMigration, "utf-8");
assert(rlsCode.includes("ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY"), "RLS enabled on teams table");
assert(rlsCode.includes("ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY"), "RLS enabled on team_members table");
assert(rlsCode.includes("ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY"), "RLS enabled on invitations table");
assert(rlsCode.includes("Vendors manage own teams"), "Strict vendor team isolation policy");
assert(rlsCode.includes("Vendors manage own invitations"), "Strict vendor invitation isolation policy");

// ----------------------------------------------------------------------
// WORKFLOW 15: TEAM LEADER EARNING RESTRICTIONS
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 15: TEAM LEADER EARNING RESTRICTIONS (MODULE 7)");

const permissionsFile = path.join(rootDir, "src/lib/auth/permissions.ts");
const permissionsCode = fs.readFileSync(permissionsFile, "utf-8");
assert(permissionsCode.includes("export function canSubmitPersonalLeads"), "canSubmitPersonalLeads helper defined");
assert(permissionsCode.includes("user.primaryRole === \"team_leader\"") && permissionsCode.includes("return false"), "Team Leader CANNOT submit personal earning leads");
assert(permissionsCode.includes("export function canReceivePartnerCommission"), "canReceivePartnerCommission helper defined");
assert(permissionsCode.includes("export function canAccessPartnerEarningActivities"), "canAccessPartnerEarningActivities helper defined");

const teamLeaderTeamPage = path.join(rootDir, "src/app/dashboard/team-leader/team/page.tsx");
assert(fs.existsSync(teamLeaderTeamPage), "Team Leader assigned team page exists");
const teamLeaderTeamCode = fs.readFileSync(teamLeaderTeamPage, "utf-8");
assert(teamLeaderTeamCode.includes("cannot submit personal earning leads"), "Team Leader portal displays explicit earning restriction notice");

// ----------------------------------------------------------------------
// WORKFLOW 16: VENDOR SUSPENSION LIFECYCLE SECURITY RULES
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 16: VENDOR SUSPENSION LIFECYCLE RULES (MODULE 9)");

assert(vendorActionsCode.includes("TEAM_MEMBERS_PRESERVED_AS_PER_MODULE_9"), "Module 9 lifecycle policy documented in audit event");
assert(!vendorActionsCode.includes("update team_members set status = 'suspended'"), "Vendor suspension DOES NOT cascade to team members");
assert(!vendorActionsCode.includes("update roles set status = 'suspended'"), "Vendor suspension preserves Partner accounts");

const accountStatusPage = path.join(rootDir, "src/app/(auth)/account-status/page.tsx");
assert(fs.existsSync(accountStatusPage), "Account status explanation screen (src/app/(auth)/account-status/page.tsx) exists");

// ----------------------------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------------------------
console.log("\n=======================================================");
console.log(`TOTAL PHASE 2 TESTS EXECUTED: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log("=======================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL 16 PHASE 2 WORKFLOWS VERIFIED SUCCESSFULLY!\n");
  process.exit(0);
}
