"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Search,
  Filter,
  Eye,
  X,
  Calendar,
  ShieldAlert,
  Server,
  User,
  Clock,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogsViewProps {
  initialLogs: AuditLogItem[];
}

export function AuditLogsView({ initialLogs }: AuditLogsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Extract unique modules
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    initialLogs.forEach((l) => set.add(l.entityType));
    return Array.from(set).sort();
  }, [initialLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm));

      const matchesModule = moduleFilter === "all" || log.entityType === moduleFilter;

      return matchesSearch && matchesModule;
    });
  }, [initialLogs, searchTerm, moduleFilter]);

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lmb_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Controls & Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search action, module, ID, admin email, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modules ({initialLogs.length})</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportToJson}
              className="text-xs gap-1.5 border-slate-200"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Audit Trail</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>Cryptographically Sealed Audit Trail</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Every sensitive governance, financial, and authentication event is permanently preserved in PostgreSQL
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {filteredLogs.length} Events
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Target Entity</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Network IP</TableHead>
                    <TableHead className="text-right">Inspection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs border-slate-300 bg-slate-50 text-slate-800"
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        {log.entityType}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 max-w-[120px] truncate">
                        {log.entityId || "Global"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {log.userEmail || "System Engine"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {log.ipAddress || "Internal"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Payload</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Activity className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-sm font-medium">No matching audit events located.</p>
              <p className="text-xs text-slate-400">
                All future administrative changes and sign-in operations will be captured automatically.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs font-bold">
                    {selectedLog.action}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">ID: {selectedLog.id}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Event Deep Payload Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Actor:</span>
                  <div className="font-semibold text-slate-800">{selectedLog.userEmail || "System Internal"}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Timestamp:</span>
                  <div className="font-mono text-slate-800">{formatDateTime(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Module / Entity:</span>
                  <div className="font-semibold text-slate-800">{selectedLog.entityType} ({selectedLog.entityId || "N/A"})</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">IP Address / Client:</span>
                  <div className="font-mono text-slate-800">{selectedLog.ipAddress || "127.0.0.1"}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">JSON Change Record & Metadata</label>
                <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              {selectedLog.userAgent && (
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  User Agent: {selectedLog.userAgent}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

