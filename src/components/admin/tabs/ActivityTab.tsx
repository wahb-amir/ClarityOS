"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass, labelClass } from "@/types/admin";

export function ActivityTab({
  projectId,
  onNotify,
}: {
  projectId: string;
  onNotify: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [aForm, setAForm] = useState({ type: "FEATURE_PROGRESS", rawText: "" });

  const logActivity = async () => {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aForm),
    });
    setAForm((f) => ({ ...f, rawText: "" }));
    onNotify("Activity logged!");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary mb-4">
        Log Developer Activity
      </h3>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Activity Type</label>
          <select
            className={inputClass}
            value={aForm.type}
            onChange={(e) => setAForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="FEATURE_PROGRESS">Feature Progress</option>
            <option value="BUG_FIX">Bug Fix</option>
            <option value="DEPLOYMENT">Deployment</option>
            <option value="BLOCKER_CREATED">Blocker Created</option>
            <option value="BLOCKER_RESOLVED">Blocker Resolved</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Developer Note (raw)</label>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="e.g. fixed login bug..."
            value={aForm.rawText}
            onChange={(e) =>
              setAForm((f) => ({ ...f, rawText: e.target.value }))
            }
          />
          <p className="text-text-muted text-xs mt-1.5">
            This will be automatically translated into client-friendly language.
          </p>
        </div>
        <Button
          onClick={logActivity}
          isLoading={loading}
          disabled={!aForm.rawText}
        >
          Log Activity
        </Button>
      </div>
    </div>
  );
}
