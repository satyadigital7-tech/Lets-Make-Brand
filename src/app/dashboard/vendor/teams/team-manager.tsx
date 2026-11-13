"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  UserX,
  X,
  Mail,
  Loader2,
  Calendar,
  Building,
  Edit,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import {
  createTeamAction,
  updateTeamAction,
  removeMemberFromTeamAction,
} from "./actions";
import { sendInvitationAction } from "../invitations/actions";

export interface TeamMemberItem {
  userId: string;
  fullName: string;
  email: string;
  roleInTeam: "leader" | "member";
  status: "active" | "inactive" | "removed";
  joinedAt: string;
}

export interface VendorTeam {
  id: string;
  teamCode: string;
  name: string;
  description: string | null;
  leaderId: string | null;
  leaderName: string | null;
  status: "active" | "inactive" | "archived";
  createdAt: string;
  members: TeamMemberItem[];
}

export interface AvailableLeader {
  id: string;
  fullName: string;
  email: string;
}

interface TeamManagerProps {
  initialTeams: VendorTeam[];
  availableLeaders: AvailableLeader[];
}

export function TeamManager({ initialTeams, availableLeaders }: TeamManagerProps) {
  const [teams, setTeams] = useState<VendorTeam[]>(initialTeams);
  const [selectedTeam, setSelectedTeam] = useState<VendorTeam | null>(
    initialTeams[0] || null
  );

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create / Edit modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leaderId: "",
  });

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "team_member" as "team_leader" | "team_member",
  });
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  // Handle Team Creation
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await createTeamAction({
          name: formData.name,
          description: formData.description || undefined,
          leaderId: formData.leaderId || undefined,
        });

        const selectedLeader = availableLeaders.find((l) => l.id === formData.leaderId);

        const newTeamObj: VendorTeam = {
          id: res.teamId,
          teamCode: res.teamCode,
          name: formData.name,
          description: formData.description || null,
          leaderId: formData.leaderId || null,
          leaderName: selectedLeader?.fullName || null,
          status: "active",
          createdAt: new Date().toISOString(),
          members: selectedLeader
            ? [
                {
                  userId: selectedLeader.id,
                  fullName: selectedLeader.fullName,
                  email: selectedLeader.email,
                  roleInTeam: "leader",
                  status: "active",
                  joinedAt: new Date().toISOString(),
                },
              ]
            : [],
        };

        setTeams((prev) => [newTeamObj, ...prev]);
        setSelectedTeam(newTeamObj);
        setIsCreateOpen(false);
        setFormData({ name: "", description: "", leaderId: "" });
        setFeedback({
          type: "success",
          text: `Team created successfully! Code: ${res.teamCode}`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to create team",
        });
      }
    });
  };

  // Handle Team Edit
  const handleEditTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await updateTeamAction(selectedTeam.id, {
          name: formData.name,
          description: formData.description || undefined,
          leaderId: formData.leaderId || undefined,
        });

        const selectedLeader = availableLeaders.find((l) => l.id === formData.leaderId);

        setTeams((prev) =>
          prev.map((t) =>
            t.id === selectedTeam.id
              ? {
                  ...t,
                  name: formData.name,
                  description: formData.description || null,
                  leaderId: formData.leaderId || null,
                  leaderName: selectedLeader?.fullName || t.leaderName,
                }
              : t
          )
        );

        setSelectedTeam((prev) =>
          prev
            ? {
                ...prev,
                name: formData.name,
                description: formData.description || null,
                leaderId: formData.leaderId || null,
                leaderName: selectedLeader?.fullName || prev.leaderName,
              }
            : null
        );

        setIsEditOpen(false);
        setFeedback({ type: "success", text: "Team updated successfully." });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to update team",
        });
      }
    });
  };

  // Handle Member Removal
  const handleRemoveMember = (userId: string) => {
    if (!selectedTeam) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await removeMemberFromTeamAction(selectedTeam.id, userId);
        setTeams((prev) =>
          prev.map((t) =>
            t.id === selectedTeam.id
              ? {
                  ...t,
                  leaderId: t.leaderId === userId ? null : t.leaderId,
                  leaderName: t.leaderId === userId ? null : t.leaderName,
                  members: t.members.filter((m) => m.userId !== userId),
                }
              : t
          )
        );

        setSelectedTeam((prev) =>
          prev
            ? {
                ...prev,
                leaderId: prev.leaderId === userId ? null : prev.leaderId,
                leaderName: prev.leaderId === userId ? null : prev.leaderName,
                members: prev.members.filter((m) => m.userId !== userId),
              }
            : null
        );

        setFeedback({ type: "success", text: "Member removed from team." });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to remove member",
        });
      }
    });
  };

  // Handle Member Invitation
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setFeedback(null);
    setGeneratedInviteLink(null);

    startTransition(async () => {
      try {
        const res = await sendInvitationAction({
          email: inviteData.email,
          role: inviteData.role,
          teamId: selectedTeam.id,
        });

        const fullLink = `${window.location.origin}${res.inviteUrl}`;
        setGeneratedInviteLink(fullLink);
        setFeedback({
          type: "success",
          text: `Invitation generated for ${inviteData.email}! Share the secure invitation link below.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to send invitation",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header with Create Team Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Your Brand Squads & Teams</h2>
          <p className="text-xs text-slate-500">
            Structure your promotional workforce into dedicated squads with appointed Team Leaders.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: "", description: "", leaderId: "" });
            setIsCreateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Team</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List (Left Column) */}
        <div className="space-y-3">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Squad Roster ({teams.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {teams.length > 0 ? (
                teams.map((t) => {
                  const isSelected = selectedTeam?.id === t.id;
                  const activeCount = t.members.filter((m) => m.status === "active").length;

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeam(t)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 shadow-sm"
                          : "border-transparent hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {t.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] py-0 px-1.5 text-blue-700 bg-white"
                        >
                          {t.teamCode}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Leader: {t.leaderName || "Unassigned"}</span>
                        <span className="font-semibold text-slate-700">
                          {activeCount} {activeCount === 1 ? "member" : "members"}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No teams created yet. Click &quot;Create New Team&quot; to begin.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Team Details & Members (Right Column) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTeam ? (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        {selectedTeam.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono text-xs text-blue-700">
                        {selectedTeam.teamCode}
                      </Badge>
                      <Badge variant="success" className="text-[10px]">
                        {selectedTeam.status}
                      </Badge>
                    </div>
                    {selectedTeam.description && (
                      <CardDescription className="text-xs mt-1">
                        {selectedTeam.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          name: selectedTeam.name,
                          description: selectedTeam.description || "",
                          leaderId: selectedTeam.leaderId || "",
                        });
                        setIsEditOpen(true);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Squad</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        setInviteData({ email: "", role: "team_member" });
                        setGeneratedInviteLink(null);
                        setIsInviteOpen(true);
                      }}
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Invite Member</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      Team Leader:{" "}
                      <strong className="text-slate-900">
                        {selectedTeam.leaderName || "None Assigned"}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Created: {formatDate(selectedTeam.createdAt)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Squad Members ({selectedTeam.members.filter((m) => m.status === "active").length})
                  </h4>
                </div>

                {selectedTeam.members.filter((m) => m.status === "active").length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Squad Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTeam.members
                        .filter((m) => m.status === "active")
                        .map((member) => (
                          <TableRow key={member.userId}>
                            <TableCell className="font-bold text-xs text-slate-900">
                              {member.fullName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 font-mono">
                              {member.email}
                            </TableCell>
                            <TableCell>
                              {member.roleInTeam === "leader" ? (
                                <Badge variant="brand" className="text-[10px] gap-1">
                                  <Shield className="h-3 w-3" />
                                  <span>Team Leader</span>
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  Team Member
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-400 font-mono">
                              {formatDate(member.joinedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMember(member.userId)}
                                disabled={isPending}
                                className="h-7 text-xs px-2 text-slate-400 hover:text-red-600 gap-1"
                                title="Remove member from this team"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                    No members assigned to this squad yet. Click &quot;Invite Member&quot; to send an invitation.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-500">
              Select or create a squad to view member rosters.
            </div>
          )}
        </div>
      </div>

      {/* CREATE TEAM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Establish New Sales Squad
                </CardTitle>
                <CardDescription className="text-xs">
                  Creates an isolated promotional team with unique system code (LMB-TEAM-xxxxxx)
                </CardDescription>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateTeam}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="team-name" className="text-xs font-semibold">
                    Squad / Team Name *
                  </Label>
                  <Input
                    id="team-name"
                    required
                    placeholder="e.g. North Zone Affiliates, Alpha Growth Squad"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="team-desc" className="text-xs font-semibold">
                    Description & Objectives (Optional)
                  </Label>
                  <textarea
                    id="team-desc"
                    rows={2}
                    placeholder="Brief description of this squad's target campaigns or region..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="team-leader" className="text-xs font-semibold">
                    Appoint Team Leader (Optional)
                  </Label>
                  <select
                    id="team-leader"
                    value={formData.leaderId}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No leader assigned (Can be invited or assigned later)</option>
                    {availableLeaders.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.fullName} ({lead.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isPending}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Create Team</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {isEditOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Edit Squad Details
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedTeam.teamCode}
                </CardDescription>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleEditTeam}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold">
                    Squad Name *
                  </Label>
                  <Input
                    id="edit-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-desc" className="text-xs font-semibold">
                    Description
                  </Label>
                  <textarea
                    id="edit-desc"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-leader" className="text-xs font-semibold">
                    Team Leader
                  </Label>
                  <select
                    id="edit-leader"
                    value={formData.leaderId}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No leader assigned</option>
                    {availableLeaders.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.fullName} ({lead.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                    disabled={isPending}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {isInviteOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Invite Member to {selectedTeam.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Sends a secure, tokenized invitation link to the recipient
                </CardDescription>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleSendInvite}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-email" className="text-xs font-semibold">
                    Recipient Email Address *
                  </Label>
                  <Input
                    id="inv-email"
                    type="email"
                    required
                    placeholder="partner@example.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inv-role" className="text-xs font-semibold">
                    Invited Role *
                  </Label>
                  <select
                    id="inv-role"
                    value={inviteData.role}
                    onChange={(e) =>
                      setInviteData({
                        ...inviteData,
                        role: e.target.value as "team_leader" | "team_member",
                      })
                    }
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="team_member">Team Member (Promotional Partner)</option>
                    <option value="team_leader">Team Leader (Squad Supervisor)</option>
                  </select>
                </div>

                {/* Generated Invite Link Preview */}
                {generatedInviteLink && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-blue-900 block">
                      Secure Invitation Link Generated:
                    </span>
                    <Input
                      readOnly
                      value={generatedInviteLink}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="h-8 text-xs font-mono bg-white"
                    />
                    <p className="text-[11px] text-blue-700">
                      Copy this link and share with the invitee. The link expires automatically in 7 days.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteOpen(false)}
                    disabled={isPending}
                    className="h-8 text-xs"
                  >
                    {generatedInviteLink ? "Close" : "Cancel"}
                  </Button>
                  {!generatedInviteLink && (
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Generate Invite</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
