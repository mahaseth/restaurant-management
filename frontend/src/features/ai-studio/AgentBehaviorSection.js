"use client";

import React from "react";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";

const TONES = [
  { value: "professional", label: "Professional", hint: "Polished, business-appropriate" },
  { value: "friendly", label: "Friendly", hint: "Warm and approachable" },
  { value: "warm", label: "Warm", hint: "Inviting, cozy hospitality" },
  { value: "playful", label: "Playful", hint: "Light and upbeat when it fits" },
  { value: "formal", label: "Formal", hint: "Courteous and refined" },
  { value: "luxury", label: "Luxury", hint: "Premium, attentive service" },
];

const LENGTHS = [
  { value: "concise", label: "Concise", hint: "Short, direct answers" },
  { value: "default", label: "Balanced", hint: "Concise unless asked for more" },
  { value: "verbose", label: "Detailed", hint: "Richer explanations when helpful" },
];

export default function AgentBehaviorSection({
  provisioned,
  responseStyle,
  onResponseStyleChange,
  agentTone,
  onAgentToneChange,
  brandStory,
  onBrandStoryChange,
  customInstructions,
  onCustomInstructionsChange,
  omitAgentName,
  onOmitAgentNameChange,
  onSave,
  saving,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900/40 shadow-sm">
      <div className="relative px-6 py-6 sm:px-8 sm:py-7 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_55%)] pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-1">Agent intelligence</p>
          <h2 className="text-xl font-bold tracking-tight">Personality & instructions</h2>
          <p className="text-sm text-white/90 mt-2 max-w-2xl leading-relaxed">
            Shape how the assistant speaks and what it knows about your brand. These settings feed the AI behind the guest
            chat — they are not shown as-is on the screen.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Nature & tone</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                disabled={!provisioned}
                onClick={() => onAgentToneChange(t.value)}
                className={`text-left rounded-xl border px-4 py-3 transition-all ${
                  agentTone === t.value
                    ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/30"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-900/60"
                } ${!provisioned ? "opacity-50 pointer-events-none" : ""}`}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t.label}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Response length</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            {LENGTHS.map((l) => (
              <button
                key={l.value}
                type="button"
                disabled={!provisioned}
                onClick={() => onResponseStyleChange(l.value)}
                className={`flex-1 text-left rounded-xl border px-4 py-3 transition-all ${
                  responseStyle === l.value
                    ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/30"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-900/60"
                } ${!provisioned ? "opacity-50 pointer-events-none" : ""}`}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{l.label}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{l.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-gray-50 dark:bg-gray-800/40">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Omit assistant name in replies</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              When on, the model avoids referring to itself by name (name can still show in the chat header).
            </p>
          </div>
          <InputSwitch checked={!!omitAgentName} onChange={(e) => onOmitAgentNameChange(e.value)} disabled={!provisioned} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand story & positioning</label>
          <InputTextarea
            value={brandStory}
            onChange={(e) => onBrandStoryChange(e.target.value)}
            rows={4}
            disabled={!provisioned}
            className="w-full"
            placeholder="What makes your restaurant special? Cuisine style, atmosphere, values — helps the AI stay on-brand."
            maxLength={2000}
          />
          <p className="text-xs text-gray-500">{brandStory.length}/2000</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom instructions</label>
          <InputTextarea
            value={customInstructions}
            onChange={(e) => onCustomInstructionsChange(e.target.value)}
            rows={5}
            disabled={!provisioned}
            className="w-full font-mono text-sm"
            placeholder={'e.g.\n- Always mention allergy disclaimers for nuts\n- Prefer suggesting chef specials on weekends'}
            maxLength={4000}
          />
          <p className="text-xs text-gray-500">{customInstructions.length}/4000</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button
            type="button"
            label={saving ? "Saving…" : "Save personality & instructions"}
            icon="pi pi-check"
            onClick={onSave}
            disabled={saving || !provisioned}
          />
          <p className="text-xs text-gray-500 max-w-md">
            Saved together with your server profile. Guest chat uses these rules on every message.
          </p>
        </div>
      </div>
    </div>
  );
}
