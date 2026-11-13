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
  | "completed";

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
          title: string;
          slug: string;
          vendor_id: string | null;
          description: string;
          category: string;
          target_audience: string | null;
          commission_rate: number;
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
          title: string;
          slug: string;
          vendor_id?: string | null;
          description: string;
          category: string;
          target_audience?: string | null;
          commission_rate?: number;
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
          title?: string;
          slug?: string;
          vendor_id?: string | null;
          description?: string;
          category?: string;
          target_audience?: string | null;
          commission_rate?: number;
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
    };
  };
}
