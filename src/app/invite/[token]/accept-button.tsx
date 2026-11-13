"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "./actions";

interface InvitationAcceptButtonProps {
  token: string;
  role: string;
}

export function InvitationAcceptButton({ token, role }: InvitationAcceptButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAccept = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await acceptInvitationAction(token);
        if (result.success) {
          router.push(result.redirectPath);
          router.refresh();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to accept invitation";
        setErrorMessage(msg);
      }
    });
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
          {errorMessage}
        </p>
      )}

      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        )}
        <span>Accept Invitation & Join as {role === "team_leader" ? "Team Leader" : "Team Member"}</span>
      </Button>
    </div>
  );
}
