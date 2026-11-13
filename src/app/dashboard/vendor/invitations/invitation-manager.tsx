"use client";

import React, { useState, useTransition } from "react";
import {
  Mail,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
  Calendar,
  Clock,
  Shield,
  Users,
  Ban,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { sendInvitationAction, cancelInvitationAction } from "./actions";

export interface InvitationItem {
  id: string;
  email: string;
  role: "team_leader" | "team_member";
  teamId: string | null;
  teamName: string | null;
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface AvailableTeam {
  id: string;
  name: string;
  teamCode: string;
}

interface InvitationManagerProps {
  initialInvitations: InvitationItem[];
  availableTeams: AvailableTeam[];
}

export function InvitationManager({
  initialInvitations,
  availableTeams,
}: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<InvitationItem[]>(initialInvitations);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    role: "team_member" as "team_leader" | "team_member",
    teamId: availableTeams[0]?.id || "",
  });

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setNewInviteLink(null);

    startTransition(async () => {
      try {
        const res = await sendInvitationAction({
          email: formData.email,
          role: formData.role,
          teamId: formData.teamId || undefined,
        });

        const selectedTeam = availableTeams.find((t) => t.id === formData.teamId);
        const fullLink = `${window.location.origin}${res.inviteUrl}`;
        setNewInviteLink(fullLink);

        const newInv: InvitationItem = {
          id: res.invitationId,
          email: formData.email.toLowerCase().trim(),
          role: formData.role,
          teamId: formData.teamId || null,
          teamName: selectedTeam?.name || null,
          token: res.token,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          acceptedAt: null,
          createdAt: new Date().toISOString(),
        };

        setInvitations((prev) => [newInv, ...prev]);
        setFeedback({
          type: "success",
          text: `Invitation created for ${formData.email}! Share the secure link below.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to create invitation",
        });
      }
    });
  };

  const handleCancelInvite = (invitationId: string) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await cancelInvitationAction(invitationId);
        setInvitations((prev) =>
          prev.map((i) => (i.id === invitationId ? { ...i, status: "cancelled" } : i))
        );
        setFeedback({ type: "success", text: "Invitation cancelled." });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to cancel invitation",
        });
      }
    });
  };

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStatusBadge = (status: InvitationItem["status"]) => {
    switch (status) {
      case "accepted":
        return <Badge variant="success" className="text-[10px]">Accepted</Badge>;
      case "pending":
        return <Badge variant="warning" className="text-[10px]">Pending</Badge>;
      case "expired":
        return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="text-[10px]">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
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

      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Dispatched Invitations</h2>
          <p className="text-xs text-slate-500">
            Secure, tokenized invites for Team Leaders and squad promotional partners.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              email: "",
              role: "team_member",
              teamId: availableTeams[0]?.id || "",
            });
            setNewInviteLink(null);
            setIsCreateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Dispatch New Invitation</span>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Invitation Log ({invitations.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Links are cryptographically signed and expire automatically after 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invitations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invited Email</TableHead>
                    <TableHead>Designated Role</TableHead>
                    <TableHead>Target Squad</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Dispatched</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        {inv.email}
                      </TableCell>
                      <TableCell>
                        {inv.role === "team_leader" ? (
                          <Badge variant="brand" className="text-[10px] gap-1">
                            <Shield className="h-3 w-3" />
                            <span>Team Leader</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Users className="h-3 w-3" />
                            <span>Team Member</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {inv.teamName || <span className="text-slate-400 italic">General</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(inv.expiresAt)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(inv.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(inv.token)}
                                className="h-7 text-xs px-2 gap-1 text-slate-700"
                                title="Copy invitation link"
                              >
                                {copiedToken === inv.token ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelInvite(inv.id)}
                                disabled={isPending}
                                className="h-7 text-xs px-1.5 text-slate-400 hover:text-red-600"
                                title="Cancel Invitation"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {inv.status === "accepted" && (
                            <span className="text-xs text-emerald-600 font-medium">
                              Joined {inv.acceptedAt ? formatDate(inv.acceptedAt) : ""}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No invitations dispatched yet. Click &quot;Dispatch New Invitation&quot; to invite partners.
            </div>
          )}
        </CardContent>
      </Card>

      {/* DISPATCH INVITATION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Dispatch Secure Invitation
                </CardTitle>
                <CardDescription className="text-xs">
                  Invitee will receive an onboarding link linked directly to your organization
                </CardDescription>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-role" className="text-xs font-semibold">
                      Role Privilege *
                    </Label>
                    <select
                      id="inv-role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as "team_leader" | "team_member",
                        })
                      }
                      className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="team_member">Team Member (Partner)</option>
                      <option value="team_leader">Team Leader (Supervisor)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inv-team" className="text-xs font-semibold">
                      Target Squad (Optional)
                    </Label>
                    <select
                      id="inv-team"
                      value={formData.teamId}
                      onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                      className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No squad (General invite)</option>
                      {availableTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.teamCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {newInviteLink && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-blue-900 block">
                      Invitation Link Created:
                    </span>
                    <Input
                      readOnly
                      value={newInviteLink}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="h-8 text-xs font-mono bg-white"
                    />
                    <p className="text-[11px] text-blue-700">
                      Copy this URL to share with the user. Valid for 7 days.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isPending}
                    className="h-8 text-xs"
                  >
                    {newInviteLink ? "Done" : "Cancel"}
                  </Button>
                  {!newInviteLink && (
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Generate & Dispatch</span>
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

