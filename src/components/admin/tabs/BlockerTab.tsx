"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass, labelClass } from "@/types/admin";

export function BlockerTab({
  projectId,
  onNotify,
}: {
  projectId: string;
  onNotify: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [bForm, setBForm] = useState({
    title: "",
    explanation: "",
    type: "client_action_required",
    owner: "dev",
  });

  const addBlocker = async () => {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/blockers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bForm),
    });
    setBForm((f) => ({ ...f, title: "", explanation: "" }));
    onNotify("Blocker logged!");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary mb-4">Log Blocker</h3>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Blocker Title *</label>
          <input
            className={inputClass}
            placeholder="e.g. Waiting for API keys"
            value={bForm.title}
            onChange={(e) => setBForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>Explanation (client-facing) *</label>
          <textarea
            className={inputClass}
            rows={2}
            placeholder="e.g. Cannot proceed until credentials are provided"
            value={bForm.explanation}
            onChange={(e) =>
              setBForm((f) => ({ ...f, explanation: e.target.value }))
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type</label>
            <select
              className={inputClass}
              value={bForm.type}
              onChange={(e) =>
                setBForm((f) => ({ ...f, type: e.target.value }))
              }
            >
              <option value="client_action_required">
                Client Action Required
              </option>
              <option value="technical_issue">Technical Issue</option>
              <option value="external_dependency">External Dependency</option>
              <option value="payment_blocker">💳 Payment Blocker</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Owner</label>
            <select
              className={inputClass}
              value={bForm.owner}
              onChange={(e) =>
                setBForm((f) => ({ ...f, owner: e.target.value }))
              }
            >
              <option value="dev">Developer</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>
        <Button
          onClick={addBlocker}
          isLoading={loading}
          disabled={!bForm.title || !bForm.explanation}
        >
          Log Blocker
        </Button>
      </div>
    </div>
  );
}
