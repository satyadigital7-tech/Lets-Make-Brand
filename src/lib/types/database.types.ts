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
  | "registration_received"
  | "account_approved"
  | "account_rejected"
  | "new_campaign"
  | "campaign_assignment"
  | "campaign_published"
  | "lead_submitted"
  | "lead_approved"
  | "lead_rejected"
  | "correction_requested"
  | "duplicate_detected"
  | "commission_credited"
  | "commission_reversed"
  | "withdrawal_submitted"
  | "withdrawal_approved"
  | "withdrawal_paid"
  | "kyc_updated"
  | "support_reply"
  | string;

export type KycStatus =
  | "not_submitted"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "resubmission_required";

export type KycDocumentType =
  | "pan_card"
  | "address_proof"
  | "bank_proof"
  | "business_reg"
  | "other";

export type DocumentTemplateType =
  | "id_card_partner"
  | "id_card_vendor"
  | "offer_letter_partner"
  | "offer_letter_vendor";

export type GeneratedDocumentType = "id_card" | "offer_letter";

export type SupportTicketCategory =
  | "account_issues"
  | "registration"
  | "kyc"
  | "campaign"
  | "lead_submission"
  | "commission"
  | "wallet"
  | "withdrawal"
  | "payment"
  | "technical_support"
  | "other";

export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_user"
  | "resolved"
  | "closed";

export type ReportType =
  | "users"
  | "campaigns"
  | "leads"
  | "financial"
  | "kyc"
  | "support"
  | "audit";

export type ReportExportFormat = "csv" | "pdf";

export type TransactionType = "credit" | "debit" | "reversal" | "adjustment";
export type CommissionStatus = "pending" | "approved" | "paid" | "reversed";
export type BeneficiaryRole = "partner" | "vendor";

export type WalletStatus = "active" | "frozen" | "suspended";
export type PayoutMethodType = "upi" | "bank_transfer";
export type WithdrawalMethod = "upi" | "bank_transfer" | "neft" | "imps";
export type WithdrawalStatus = "pending" | "approved" | "processing" | "paid" | "rejected" | "cancelled";
export type PaymentStatus = "completed" | "failed" | "refunded";
export type WalletLedgerTransactionType =
  | "commission_credit"
  | "withdrawal_reservation"
  | "withdrawal_release"
  | "withdrawal_payment"
  | "commission_reversal"
  | "manual_adjustment";
export type WalletLedgerDirection = "credit" | "debit";

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
          profile_code?: string | null;
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
          category: string;
          entity_type: string | null;
          entity_id: string | null;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          category?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          category?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
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
      wallets: {
        Row: {
          id: string;
          wallet_code: string;
          user_id: string;
          user_role: string;
          total_earnings: number;
          pending_earnings: number;
          available_balance: number;
          reserved_balance: number;
          total_withdrawn: number;
          currency: string;
          status: WalletStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_code: string;
          user_id: string;
          user_role: string;
          total_earnings?: number;
          pending_earnings?: number;
          available_balance?: number;
          reserved_balance?: number;
          total_withdrawn?: number;
          currency?: string;
          status?: WalletStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_code?: string;
          user_id?: string;
          user_role?: string;
          total_earnings?: number;
          pending_earnings?: number;
          available_balance?: number;
          reserved_balance?: number;
          total_withdrawn?: number;
          currency?: string;
          status?: WalletStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      payout_methods: {
        Row: {
          id: string;
          user_id: string;
          type: PayoutMethodType;
          is_default: boolean;
          upi_id: string | null;
          account_holder_name: string;
          account_number: string | null;
          ifsc_code: string | null;
          bank_name: string | null;
          branch_name: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: PayoutMethodType;
          is_default?: boolean;
          upi_id?: string | null;
          account_holder_name: string;
          account_number?: string | null;
          ifsc_code?: string | null;
          bank_name?: string | null;
          branch_name?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: PayoutMethodType;
          is_default?: boolean;
          upi_id?: string | null;
          account_holder_name?: string;
          account_number?: string | null;
          ifsc_code?: string | null;
          bank_name?: string | null;
          branch_name?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          withdrawal_code: string;
          wallet_id: string;
          user_id: string;
          amount: number;
          payment_method: WithdrawalMethod;
          payout_details: Json;
          status: WithdrawalStatus;
          rejection_reason: string | null;
          admin_remarks: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          withdrawal_code: string;
          wallet_id: string;
          user_id: string;
          amount: number;
          payment_method: WithdrawalMethod;
          payout_details: Json;
          status?: WithdrawalStatus;
          rejection_reason?: string | null;
          admin_remarks?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          withdrawal_code?: string;
          wallet_id?: string;
          user_id?: string;
          amount?: number;
          payment_method?: WithdrawalMethod;
          payout_details?: Json;
          status?: WithdrawalStatus;
          rejection_reason?: string | null;
          admin_remarks?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          payment_code: string;
          withdrawal_id: string;
          user_id: string;
          amount: number;
          payment_method: string;
          payment_reference: string;
          payment_date: string;
          status: PaymentStatus;
          proof_url: string | null;
          admin_remarks: string | null;
          processed_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_code: string;
          withdrawal_id: string;
          user_id: string;
          amount: number;
          payment_method: string;
          payment_reference: string;
          payment_date?: string;
          status?: PaymentStatus;
          proof_url?: string | null;
          admin_remarks?: string | null;
          processed_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_code?: string;
          withdrawal_id?: string;
          user_id?: string;
          amount?: number;
          payment_method?: string;
          payment_reference?: string;
          payment_date?: string;
          status?: PaymentStatus;
          proof_url?: string | null;
          admin_remarks?: string | null;
          processed_by?: string;
          created_at?: string;
        };
      };
      wallet_ledger: {
        Row: {
          id: string;
          ledger_code: string;
          wallet_id: string;
          user_id: string;
          transaction_type: WalletLedgerTransactionType;
          amount: number;
          direction: WalletLedgerDirection;
          balance_before: number;
          balance_after: number;
          reference_id: string;
          description: string | null;
          processed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ledger_code: string;
          wallet_id: string;
          user_id: string;
          transaction_type: WalletLedgerTransactionType;
          amount: number;
          direction: WalletLedgerDirection;
          balance_before: number;
          balance_after: number;
          reference_id: string;
          description?: string | null;
          processed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ledger_code?: string;
          wallet_id?: string;
          user_id?: string;
          transaction_type?: WalletLedgerTransactionType;
          amount?: number;
          direction?: WalletLedgerDirection;
          balance_before?: number;
          balance_after?: number;
          reference_id?: string;
          description?: string | null;
          processed_by?: string | null;
          created_at?: string;
        };
      };
      financial_audit_logs: {
        Row: {
          id: string;
          wallet_id: string | null;
          withdrawal_id: string | null;
          payment_id: string | null;
          actor_id: string | null;
          action: string;
          amount: number | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id?: string | null;
          withdrawal_id?: string | null;
          payment_id?: string | null;
          actor_id?: string | null;
          action: string;
          amount?: number | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_id?: string | null;
          withdrawal_id?: string | null;
          payment_id?: string | null;
          actor_id?: string | null;
          action?: string;
          amount?: number | null;
          details?: Json;
          created_at?: string;
        };
      };
      kyc_records: {
        Row: {
          id: string;
          kyc_code: string;
          user_id: string;
          user_role: string;
          full_name: string;
          date_of_birth: string;
          address: string;
          pan_number_masked: string;
          bank_account_holder: string;
          bank_account_number_masked: string;
          ifsc_code: string;
          bank_name: string | null;
          upi_id: string | null;
          status: KycStatus;
          rejection_reason: string | null;
          admin_remarks: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kyc_code?: string;
          user_id: string;
          user_role: string;
          full_name: string;
          date_of_birth: string;
          address: string;
          pan_number_masked: string;
          bank_account_holder: string;
          bank_account_number_masked: string;
          ifsc_code: string;
          bank_name?: string | null;
          upi_id?: string | null;
          status?: KycStatus;
          rejection_reason?: string | null;
          admin_remarks?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kyc_code?: string;
          user_id?: string;
          user_role?: string;
          full_name?: string;
          date_of_birth?: string;
          address?: string;
          pan_number_masked?: string;
          bank_account_holder?: string;
          bank_account_number_masked?: string;
          ifsc_code?: string;
          bank_name?: string | null;
          upi_id?: string | null;
          status?: KycStatus;
          rejection_reason?: string | null;
          admin_remarks?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
      };
      kyc_documents: {
        Row: {
          id: string;
          kyc_id: string;
          user_id: string;
          document_type: KycDocumentType;
          document_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          kyc_id: string;
          user_id: string;
          document_type: KycDocumentType;
          document_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          kyc_id?: string;
          user_id?: string;
          document_type?: KycDocumentType;
          document_name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
      };
      document_templates: {
        Row: {
          id: string;
          template_type: DocumentTemplateType;
          title: string;
          company_name: string;
          company_address: string;
          company_website: string;
          company_logo_url: string | null;
          signatory_name: string;
          signatory_title: string;
          signatory_signature_url: string | null;
          terms_content: string | null;
          commission_policy_ref: string | null;
          responsibilities: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_type: DocumentTemplateType;
          title: string;
          company_name?: string;
          company_address?: string;
          company_website?: string;
          company_logo_url?: string | null;
          signatory_name?: string;
          signatory_title?: string;
          signatory_signature_url?: string | null;
          terms_content?: string | null;
          commission_policy_ref?: string | null;
          responsibilities?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_type?: DocumentTemplateType;
          title?: string;
          company_name?: string;
          company_address?: string;
          company_website?: string;
          company_logo_url?: string | null;
          signatory_name?: string;
          signatory_title?: string;
          signatory_signature_url?: string | null;
          terms_content?: string | null;
          commission_policy_ref?: string | null;
          responsibilities?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      generated_documents: {
        Row: {
          id: string;
          doc_code: string;
          user_id: string;
          document_type: GeneratedDocumentType;
          title: string;
          verification_reference: string;
          file_path: string | null;
          file_size: number | null;
          metadata: Json;
          issue_date: string;
          is_valid: boolean;
          generated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doc_code?: string;
          user_id: string;
          document_type: GeneratedDocumentType;
          title: string;
          verification_reference: string;
          file_path?: string | null;
          file_size?: number | null;
          metadata?: Json;
          issue_date?: string;
          is_valid?: boolean;
          generated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doc_code?: string;
          user_id?: string;
          document_type?: GeneratedDocumentType;
          title?: string;
          verification_reference?: string;
          file_path?: string | null;
          file_size?: number | null;
          metadata?: Json;
          issue_date?: string;
          is_valid?: boolean;
          generated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_account_updates: boolean;
          email_campaign_updates: boolean;
          email_lead_updates: boolean;
          email_financial_updates: boolean;
          email_support_updates: boolean;
          inapp_all: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_account_updates?: boolean;
          email_campaign_updates?: boolean;
          email_lead_updates?: boolean;
          email_financial_updates?: boolean;
          email_support_updates?: boolean;
          inapp_all?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_account_updates?: boolean;
          email_campaign_updates?: boolean;
          email_lead_updates?: boolean;
          email_financial_updates?: boolean;
          email_support_updates?: boolean;
          inapp_all?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          ticket_code: string;
          user_id: string;
          user_role: string;
          subject: string;
          category: SupportTicketCategory;
          description: string;
          priority: SupportTicketPriority;
          status: SupportTicketStatus;
          assigned_to: string | null;
          resolved_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_code?: string;
          user_id: string;
          user_role: string;
          subject: string;
          category: SupportTicketCategory;
          description: string;
          priority?: SupportTicketPriority;
          status?: SupportTicketStatus;
          assigned_to?: string | null;
          resolved_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_code?: string;
          user_id?: string;
          user_role?: string;
          subject?: string;
          category?: SupportTicketCategory;
          description?: string;
          priority?: SupportTicketPriority;
          status?: SupportTicketStatus;
          assigned_to?: string | null;
          resolved_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string;
          sender_role: string;
          message: string;
          is_staff_reply: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_id: string;
          sender_role: string;
          message: string;
          is_staff_reply?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          sender_id?: string;
          sender_role?: string;
          message?: string;
          is_staff_reply?: boolean;
          created_at?: string;
        };
      };
      support_attachments: {
        Row: {
          id: string;
          ticket_id: string;
          message_id: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          message_id?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          message_id?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
      };
      report_exports: {
        Row: {
          id: string;
          export_code: string;
          user_id: string;
          report_type: ReportType;
          export_format: ReportExportFormat;
          filters: Json;
          file_path: string | null;
          row_count: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          export_code?: string;
          user_id: string;
          report_type: ReportType;
          export_format: ReportExportFormat;
          filters?: Json;
          file_path?: string | null;
          row_count?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          export_code?: string;
          user_id?: string;
          report_type?: ReportType;
          export_format?: ReportExportFormat;
          filters?: Json;
          file_path?: string | null;
          row_count?: number;
          status?: string;
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

export type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
export type PayoutMethod = Database["public"]["Tables"]["payout_methods"]["Row"];
export type Withdrawal = Database["public"]["Tables"]["withdrawals"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type WalletLedgerItem = Database["public"]["Tables"]["wallet_ledger"]["Row"];
export type FinancialAuditLog = Database["public"]["Tables"]["financial_audit_logs"]["Row"];

export type KycRecord = Database["public"]["Tables"]["kyc_records"]["Row"];
export type KycDocument = Database["public"]["Tables"]["kyc_documents"]["Row"];
export type DocumentTemplate = Database["public"]["Tables"]["document_templates"]["Row"];
export type GeneratedDocument = Database["public"]["Tables"]["generated_documents"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationPreference = Database["public"]["Tables"]["notification_preferences"]["Row"];
export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type SupportMessage = Database["public"]["Tables"]["support_messages"]["Row"];
export type SupportAttachment = Database["public"]["Tables"]["support_attachments"]["Row"];
export type ReportExport = Database["public"]["Tables"]["report_exports"]["Row"];


