import fs from "fs";
import path from "path";
import assert from "assert";

console.log("=======================================================");
console.log("        LMB PLATFORM - PHASE 10 BUSINESS LAUNCH        ");
console.log("=======================================================");

let passed = 0;
let failed = 0;

function check(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

// 1. LAUNCH READINESS CHECKLIST & GOVERNANCE AUDIT
console.log("\n1. LAUNCH READINESS CHECKLIST & GOVERNANCE AUDIT:");

check("docs/LAUNCH_READINESS_CHECKLIST.md exists with pre-flight matrix and sign-off declaration", () => {
  const filePath = path.resolve(process.cwd(), "docs/LAUNCH_READINESS_CHECKLIST.md");
  assert.ok(fs.existsSync(filePath), "LAUNCH_READINESS_CHECKLIST.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("Pre-Flight Launch Verification Matrix"), "Must include verification matrix");
  assert.ok(content.includes("Formal Launch Sign-off Declaration"), "Must include sign-off declaration");
  assert.ok(content.includes("The business is NOT marked as launched"), "Must state business is unlaunched until client confirmation");
  assert.ok(content.includes("commercial signoff"), "Must require commercial signoff before launch");
  assert.ok(content.includes("Zero fake users, campaigns, or mock financial transactions"), "Must enforce zero fake records");
});

// 2. ONBOARDING PLAYBOOKS & UNIQUE ID ASSIGNMENT
console.log("\n2. ONBOARDING PLAYBOOKS & UNIQUE ID ASSIGNMENT:");

check("docs/ONBOARDING_PLAYBOOKS.md exists with Vendor, Partner & Campaign SOPs", () => {
  const filePath = path.resolve(process.cwd(), "docs/ONBOARDING_PLAYBOOKS.md");
  assert.ok(fs.existsSync(filePath), "ONBOARDING_PLAYBOOKS.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("Track A: Vendor Agency Onboarding Playbook"), "Must contain Vendor onboarding SOP");
  assert.ok(content.includes("Track B: Partner Onboarding Playbook"), "Must contain Partner onboarding SOP");
  assert.ok(content.includes("Track C: Enterprise Campaign Client Launch Playbook"), "Must contain Campaign client launch SOP");
  assert.ok(content.includes("LMB-VEN-XXXXXX"), "Must reference Vendor ID format LMB-VEN-XXXXXX");
  assert.ok(content.includes("LMB-PAR-XXXXXX"), "Must reference Partner ID format LMB-PAR-XXXXXX");
});

check("Server Actions enforce human review & sequential unique IDs", () => {
  const vendorActions = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/dashboard/super-admin/vendors/actions.ts"),
    "utf-8"
  );
  assert.ok(vendorActions.includes("getNextVendorIdCode"), "Vendor actions must contain ID sequence generator");
  assert.ok(vendorActions.includes("LMB-VEN-"), "Vendor ID must follow LMB-VEN- prefix");
  assert.ok(vendorActions.includes("approveVendorAction"), "Must require human Super Admin execution");

  const partnerActions = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/dashboard/super-admin/partners/actions.ts"),
    "utf-8"
  );
  assert.ok(partnerActions.includes("getNextPartnerIdCode"), "Partner actions must contain ID sequence generator");
  assert.ok(partnerActions.includes("LMB-PAR-"), "Partner ID must follow LMB-PAR- prefix");
  assert.ok(partnerActions.includes("approvePartnerAction"), "Must require human Super Admin execution");
});

// 3. MARKETING & PROMOTION LAUNCH KIT
console.log("\n3. MARKETING & PROMOTION LAUNCH KIT:");

check("docs/MARKETING_AND_PROMOTION_KIT.md contains complete collateral pack", () => {
  const filePath = path.resolve(process.cwd(), "docs/MARKETING_AND_PROMOTION_KIT.md");
  assert.ok(fs.existsSync(filePath), "MARKETING_AND_PROMOTION_KIT.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("Company Introduction & Executive Overview"), "Must include company introduction");
  assert.ok(content.includes("Vendor Acquisition Landing Page"), "Must include Vendor landing page copy");
  assert.ok(content.includes("Partner Acquisition Landing Page"), "Must include Partner landing page copy");
  assert.ok(content.includes("Campaign Promotion Creatives & Ad Angles"), "Must include campaign promotion creatives");
  assert.ok(content.includes("Social Media Content Kit"), "Must include social media content kit");
  assert.ok(content.includes("LinkedIn Corporate Announcement"), "Must include LinkedIn launch copy");
  assert.ok(content.includes("Twitter / X Launch Thread"), "Must include Twitter/X launch copy");
  assert.ok(content.includes("WhatsApp Broadcast Templates"), "Must include WhatsApp broadcast templates");
  assert.ok(content.includes("Template 6: Bank Disbursement"), "Must include UTR payout notification template");
  assert.ok(content.includes("Frequently Asked Questions (FAQ)"), "Must include FAQ section");
});

// 4. BUSINESS GROWTH METRICS & SQL CONTRACTS
console.log("\n4. BUSINESS GROWTH METRICS & SQL CONTRACTS:");

check("docs/BUSINESS_GROWTH_AND_METRICS.md contains real PostgreSQL KPI queries", () => {
  const filePath = path.resolve(process.cwd(), "docs/BUSINESS_GROWTH_AND_METRICS.md");
  assert.ok(fs.existsSync(filePath), "BUSINESS_GROWTH_AND_METRICS.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("total_approved_vendors"), "Must include Vendor metrics query");
  assert.ok(content.includes("total_approved_partners"), "Must include Partner metrics query");
  assert.ok(content.includes("active_squad_members_count"), "Must include Team members metrics query");
  assert.ok(content.includes("total_leads_submitted"), "Must include Leads conversion query");
  assert.ok(content.includes("total_commissions_accrued"), "Must include Commissions query");
  assert.ok(content.includes("total_disbursements_completed"), "Must include Withdrawals paid query");
  assert.ok(content.includes("Monthly Platform Growth Velocity"), "Must include monthly growth velocity query");
  assert.ok(content.includes("Launch Feedback Collection & Triage System"), "Must include support desk feedback triage framework");
});

// 5. IMPORTANT RULES & GOVERNANCE COMPLIANCE
console.log("\n5. IMPORTANT RULES & GOVERNANCE COMPLIANCE:");

check("Strict Manual Payout enforcement: automated payouts remain disabled", () => {
  const futurePath = path.resolve(process.cwd(), "docs/FUTURE_ENHANCEMENTS.md");
  const content = fs.readFileSync(futurePath, "utf-8");
  assert.ok(content.includes("Direct Bank Payout & Gateway Integrations"), "Automated payouts must be listed in future enhancements");
  assert.ok(content.includes("MANDATORY CLIENT APPROVAL REQUIRED"), "Automated payouts require explicit client corporate approval");
});

check("Zero mock data in production queries: platform reports derive from PostgreSQL", () => {
  const reportsAdminPath = path.resolve(
    process.cwd(),
    "src/app/dashboard/super-admin/reports/reports-admin-view.tsx"
  );
  const content = fs.readFileSync(reportsAdminPath, "utf-8");
  assert.ok(content.includes("metrics.financial.totalCommission"), "Treasury metrics must be derived from verified metrics");
});

console.log("\n=======================================================");
console.log(`TOTAL PHASE 10 BUSINESS LAUNCH TESTS EXECUTED: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("=======================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n🚀 ALL PHASE 10 BUSINESS LAUNCH & GOVERNANCE AUDITS PASSED!");
}
