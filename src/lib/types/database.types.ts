export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRoleCode =
  | "super_admin"
  | "admin"
  | "vendor"
  | "team_leader"
  | "team_member"
  | "independent_partner";

export type AccountStatus =
  | "active"
  | "pending_approval"
  | "pending_verification"
  | "suspended"
  | "rejected"
  | "inactive";

export type RegistrationType = "independent" | "team_member";

export type TeamStatus = "active" | "inactive" | "archived";

export type TeamRole = "leader" | "member";

export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type AssignmentType =
  | "all_partners"
  | "partner"
  | "vendor"
  | "team"
  | "team_member";

export type LeadStatus =
  | "pending"
  | "under_verification"
  | "approved"
  | "rejected"
  | "correction_requested"
  | "duplicate";

export type NotificationType =
  | "campaign_assignment"
  | "campaign_published"
  | "lead_submitted"
  | "lead_approved"
  | "lead_rejected"
  | "correction_requested"
  | "duplicate_detected"
  | "commission_credited"
  | "commission_reversed";

export type TransactionType = "credit" | "debit" | "reversal" | "adjustment";
export type CommissionStatus = "pending" | "approved" | "paid" | "reversed";
export type BeneficiaryRole = "partner" | "vendor";

export interface DynamicFieldDef {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "file" | "textarea" | "date" | "boolean";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export type CommissionType = "percentage" | "fixed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          business_name: string | null;
          phone: string | null;
          mobile: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          avatar_url: string | null;
          profile_photo_url: string | null;
          dob: string | null;
          gender: string | null;
          referral_code: string | null;
          registration_type: RegistrationType;
          associated_vendor_id: string | null;
          vendor_id_code: string | null;
          partner_id_code: string | null;
          rejection_reason: string | null;
          suspension_reason: string | null;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          mobile?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          avatar_url?: string | null;
          profile_photo_url?: string | null;
          dob?: string | null;
          gender?: string | null;
          referral_code?: string | null;
          registration_type?: RegistrationType;
          associated_vendor_id?: string | null;
          vendor_id_code?: string | null;
          partner_id_code?: string | null;
          rejection_reason?: string | null;
          suspension_reason?: string | null;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          mobile?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          avatar_url?: string | null;
          profile_photo_url?: string | null;
          dob?: string | null;
          gender?: string | null;
          referral_code?: string | null;
          registration_type?: RegistrationType;
          associated_vendor_id?: string | null;
          vendor_id_code?: string | null;
          partner_id_code?: string | null;
          rejection_reason?: string | null;
          suspension_reason?: string | null;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          team_code: string;
          vendor_id: string;
          name: string;
          description: string | null;
          leader_id: string | null;
          status: TeamStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_code: string;
          vendor_id: string;
          name: string;
          description?: string | null;
          leader_id?: string | null;
          status?: TeamStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_code?: string;
          vendor_id?: string;
          name?: string;
          description?: string | null;
          leader_id?: string | null;
          status?: TeamStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role_in_team: TeamRole;
          status: string;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role_in_team?: TeamRole;
          status?: string;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role_in_team?: TeamRole;
          status?: string;
          joined_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          vendor_id: string;
          team_id: string | null;
          email: string;
          role: "team_leader" | "team_member";
          token: string;
          status: InvitationStatus;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          team_id?: string | null;
          email: string;
          role: "team_leader" | "team_member";
          token: string;
          status?: InvitationStatus;
          expires_at: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          team_id?: string | null;
          email?: string;
          role?: "team_leader" | "team_member";
          token?: string;
          status?: InvitationStatus;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          code: UserRoleCode;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: UserRoleCode;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: UserRoleCode;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          name: string;
          module: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          module: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          module?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
      };
      user_permissions: {
        Row: {
          id: string;
          user_id: string;
          permission_id: string;
          is_granted: boolean;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          permission_id: string;
          is_granted?: boolean;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          permission_id?: string;
          is_granted?: boolean;
          assigned_by?: string | null;
          created_at?: string;
        };
      };
      system_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          campaign_code: string | null;
          title: string;
          brand_name: string | null;
          slug: string;
          vendor_id: string | null;
          description: string;
          instructions: string | null;
          eligibility: string | null;
          required_documents: Json;
          dynamic_fields: Json;
          category: string;
          target_audience: string | null;
          commission_rate: number;
          commission_amount: number;
          max_payout: number | null;
          commission_type: CommissionType;
          budget: number;
          status: CampaignStatus;
          banner_image_url: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_code?: string | null;
          title: string;
          brand_name?: string | null;
          slug: string;
          vendor_id?: string | null;
          description: string;
          instructions?: string | null;
          eligibility?: string | null;
          required_documents?: Json;
          dynamic_fields?: Json;
          category?: string;
          target_audience?: string | null;
          commission_rate?: number;
          commission_amount?: number;
          max_payout?: number | null;
          commission_type?: CommissionType;
          budget?: number;
          status?: CampaignStatus;
          banner_image_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_code?: string | null;
          title?: string;
          brand_name?: string | null;
          slug?: string;
          vendor_id?: string | null;
          description?: string;
          instructions?: string | null;
          eligibility?: string | null;
          required_documents?: Json;
          dynamic_fields?: Json;
          category?: string;
          target_audience?: string | null;
          commission_rate?: number;
          commission_amount?: number;
          max_payout?: number | null;
          commission_type?: CommissionType;
          budget?: number;
          status?: CampaignStatus;
          banner_image_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaign_assignments: {
        Row: {
          id: string;
          campaign_id: string;
          assigned_type: AssignmentType;
          partner_id: string | null;
          vendor_id: string | null;
          team_id: string | null;
          team_member_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          assigned_type: AssignmentType;
          partner_id?: string | null;
          vendor_id?: string | null;
          team_id?: string | null;
          team_member_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          assigned_type?: AssignmentType;
          partner_id?: string | null;
          vendor_id?: string | null;
          team_id?: string | null;
          team_member_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          lead_code: string;
          campaign_id: string;
          submitted_by: string;
          vendor_id: string | null;
          team_id: string | null;
          customer_name: string;
          customer_mobile: string;
          customer_email: string;
          customer_location: string | null;
          address: string | null;
          additional_fields: Json;
          status: LeadStatus;
          rejection_reason: string | null;
          correction_notes: string | null;
          commission_amount: number;
          is_duplicate: boolean;
          duplicate_of_lead_id: string | null;
          consent_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_code: string;
          campaign_id: string;
          submitted_by: string;
          vendor_id?: string | null;
          team_id?: string | null;
          customer_name: string;
          customer_mobile: string;
          customer_email: string;
          customer_location?: string | null;
          address?: string | null;
          additional_fields?: Json;
          status?: LeadStatus;
          rejection_reason?: string | null;
          correction_notes?: string | null;
          commission_amount?: number;
          is_duplicate?: boolean;
          duplicate_of_lead_id?: string | null;
          consent_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_code?: string;
          campaign_id?: string;
          submitted_by?: string;
          vendor_id?: string | null;
          team_id?: string | null;
          customer_name?: string;
          customer_mobile?: string;
          customer_email?: string;
          customer_location?: string | null;
          address?: string | null;
          additional_fields?: Json;
          status?: LeadStatus;
          rejection_reason?: string | null;
          correction_notes?: string | null;
          commission_amount?: number;
          is_duplicate?: boolean;
          duplicate_of_lead_id?: string | null;
          consent_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_documents: {
        Row: {
          id: string;
          lead_id: string;
          document_name: string;
          document_type: string | null;
          file_url: string;
          file_size: number | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          document_name: string;
          document_type?: string | null;
          file_url: string;
          file_size?: number | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          document_name?: string;
          document_type?: string | null;
          file_url?: string;
          file_size?: number | null;
          uploaded_at?: string;
        };
      };
      lead_status_history: {
        Row: {
          id: string;
          lead_id: string;
          actor_id: string;
          action: string;
          previous_status: string | null;
          new_status: string;
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          actor_id: string;
          action: string;
          previous_status?: string | null;
          new_status: string;
          comments?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          actor_id?: string;
          action?: string;
          previous_status?: string | null;
          new_status?: string;
          comments?: string | null;
          created_at?: string;
        };
      };
      lead_duplicate_checks: {
        Row: {
          id: string;
          lead_id: string;
          campaign_id: string;
          normalized_mobile: string;
          normalized_email: string;
          match_type: string;
          matched_existing_lead_id: string | null;
          is_duplicate: boolean;
          checked_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          campaign_id: string;
          normalized_mobile: string;
          normalized_email: string;
          match_type: string;
          matched_existing_lead_id?: string | null;
          is_duplicate?: boolean;
          checked_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          campaign_id?: string;
          normalized_mobile?: string;
          normalized_email?: string;
          match_type?: string;
          matched_existing_lead_id?: string | null;
          is_duplicate?: boolean;
          checked_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      commission_rules: {
        Row: {
          id: string;
          campaign_id: string;
          max_commission_amount: number;
          partner_default_commission: number;
          vendor_max_commission: number;
          independent_partner_commission: number;
          currency: string;
          is_active: boolean;
          version: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          max_commission_amount: number;
          partner_default_commission: number;
          vendor_max_commission?: number;
          independent_partner_commission: number;
          currency?: string;
          is_active?: boolean;
          version?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          max_commission_amount?: number;
          partner_default_commission?: number;
          vendor_max_commission?: number;
          independent_partner_commission?: number;
          currency?: string;
          is_active?: boolean;
          version?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_commission_splits: {
        Row: {
          id: string;
          vendor_id: string;
          campaign_id: string;
          vendor_share: number;
          partner_share: number;
          total_split: number;
          version: number;
          is_active: boolean;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          campaign_id: string;
          vendor_share: number;
          partner_share: number;
          version?: number;
          is_active?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          campaign_id?: string;
          vendor_share?: number;
          partner_share?: number;
          version?: number;
          is_active?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_transactions: {
        Row: {
          id: string;
          transaction_code: string;
          lead_id: string;
          campaign_id: string;
          vendor_id: string | null;
          partner_id: string;
          team_id: string | null;
          user_id: string;
          beneficiary_role: BeneficiaryRole;
          commission_amount: number;
          transaction_type: TransactionType;
          commission_status: CommissionStatus;
          reference_code: string;
          original_transaction_id: string | null;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_code: string;
          lead_id: string;
          campaign_id: string;
          vendor_id?: string | null;
          partner_id: string;
          team_id?: string | null;
          user_id: string;
          beneficiary_role: BeneficiaryRole;
          commission_amount: number;
          transaction_type: TransactionType;
          commission_status: CommissionStatus;
          reference_code: string;
          original_transaction_id?: string | null;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_code?: string;
          lead_id?: string;
          campaign_id?: string;
          vendor_id?: string | null;
          partner_id?: string;
          team_id?: string | null;
          user_id?: string;
          beneficiary_role?: BeneficiaryRole;
          commission_amount?: number;
          transaction_type?: TransactionType;
          commission_status?: CommissionStatus;
          reference_code?: string;
          original_transaction_id?: string | null;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      commission_reversals: {
        Row: {
          id: string;
          transaction_id: string;
          reversal_transaction_id: string;
          reason: string;
          initiated_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          reversal_transaction_id: string;
          reason: string;
          initiated_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          reversal_transaction_id?: string;
          reason?: string;
          initiated_by?: string;
          created_at?: string;
        };
      };
      commission_audit_logs: {
        Row: {
          id: string;
          lead_id: string | null;
          transaction_id: string | null;
          actor_id: string | null;
          action: string;
          amount: number | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          transaction_id?: string | null;
          actor_id?: string | null;
          action: string;
          amount?: number | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          transaction_id?: string | null;
          actor_id?: string | null;
          action?: string;
          amount?: number | null;
          details?: Json;
          created_at?: string;
        };
      };
    };
  };
}

// Module Convenience Exports
export type CommissionRule = Database["public"]["Tables"]["commission_rules"]["Row"];
export type VendorCommissionSplit = Database["public"]["Tables"]["vendor_commission_splits"]["Row"];
export type CommissionTransaction = Database["public"]["Tables"]["commission_transactions"]["Row"];
export type CommissionReversal = Database["public"]["Tables"]["commission_reversals"]["Row"];
export type CommissionAuditLog = Database["public"]["Tables"]["commission_audit_logs"]["Row"];

