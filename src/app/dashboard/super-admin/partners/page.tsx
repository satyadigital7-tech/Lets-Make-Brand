import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { PartnerManager, PartnerItem } from "./partner-manager";

export default async function SuperAdminPartnersPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // Fetch all users with partner roles
  const { data } = await adminClient
    .from("user_roles")
    .select(`
      user_id,
      profiles:user_id (
        id,
        email,
        full_name,
        phone,
        mobile,
        status,
        partner_id_code,
        registration_type,
        associated_vendor_id,
        referral_code,
        dob,
        gender,
        address,
        city,
        state,
        pincode,
        rejection_reason,
        suspension_reason,
        created_at
      ),
      roles!inner (
        code,
        name
      )
    `)
    .in("roles.code", ["independent_partner", "team_leader", "team_member"]);

  const rawList = (data as any[]) || [];

  // Fetch vendor business names for associated vendors
  const vendorIds = rawList
    .map((item) => {
      const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      return prof?.associated_vendor_id;
    })
    .filter(Boolean);

  let vendorNameMap: Record<string, string> = {};
  if (vendorIds.length > 0) {
    const { data: vendorsData } = await adminClient
      .from("profiles")
      .select("id, business_name, full_name")
      .in("id", vendorIds);

    if (vendorsData) {
      for (const v of vendorsData as any[]) {
        vendorNameMap[v.id] = v.business_name || v.full_name || "Vendor";
      }
    }
  }

  const partners: PartnerItem[] = rawList.map((item: any) => {
    const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    const roleObj = Array.isArray(item.roles) ? item.roles[0] : item.roles;

    return {
      id: prof?.id || item.user_id,
      email: prof?.email || "partner@network.com",
      fullName: prof?.full_name || "Promotional Partner",
      phone: prof?.mobile || prof?.phone || "N/A",
      roleCode: roleObj?.code || "independent_partner",
      roleName: roleObj?.name || "Independent Partner",
      status: prof?.status || "pending_approval",
      partnerIdCode: prof?.partner_id_code || null,
      registrationType: prof?.registration_type || "independent",
      associatedVendorName: prof?.associated_vendor_id ? vendorNameMap[prof.associated_vendor_id] || "Assigned Vendor" : null,
      referralCode: prof?.referral_code || null,
      dob: prof?.dob ? String(prof.dob) : null,
      gender: prof?.gender || null,
      address: prof?.address || null,
      city: prof?.city || null,
      state: prof?.state || null,
      pincode: prof?.pincode || null,
      rejectionReason: prof?.rejection_reason || null,
      suspensionReason: prof?.suspension_reason || null,
      createdAt: prof?.created_at || new Date().toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Management & Network Directory"
        description="Verify independent affiliates and vendor-invited team members, issue official Partner IDs, and regulate campaign privileges."
        badge="Super Admin Only"
      />

      <PartnerManager initialPartners={partners} />
    </div>
  );
}
