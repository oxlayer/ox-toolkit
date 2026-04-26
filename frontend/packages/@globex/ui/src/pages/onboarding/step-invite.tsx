"use client";

import { Mail, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "../../components/base/button";
import { Field, FieldControl, FieldError, FieldLabel } from "../../components/base/field";
import { Input } from "../../components/base/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "../../components/base/select";
import { Spinner } from "../../components/base/spinner";
import { ButtonTech } from "../../components/tech/button-tech";
import { TechStepHeader } from "../../components/tech/tech-step-header";
import { useAppForm } from "../../hooks/use-app-form";
import { formatFieldErrors } from "../../lib/form-utils";
import { cn } from "../../lib/utils";
import { type Invitation } from "./schemas";

const addEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"]),
});

interface InviteStepProps {
  onSubmit: (invitations: Invitation[]) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  className?: string;
  defaultInvitations?: Invitation[];
}

export function InviteStep({
  onSubmit,
  onSkip,
  isLoading,
  className,
  defaultInvitations,
}: InviteStepProps) {
  const form = useAppForm({
    defaultValues: {
      email: "",
      role: "member" as "member" | "admin",
      invitations: defaultInvitations ?? ([] as Invitation[]),
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value.invitations);
    },
  });

  const isBusy = isLoading ?? false;

  const handleAddInvitation = () => {
    const email = form.getFieldValue("email").trim().toLowerCase();
    const role = form.getFieldValue("role");
    const invitations = form.getFieldValue("invitations");
    const result = addEmailSchema.safeParse({ email, role });
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? "Please enter a valid email address";
      form.setFieldMeta("email", meta => ({
        ...meta,
        isTouched: true,
        isBlurred: true,
        isValid: false,
        errors: [errorMessage],
      }));
      return;
    }

    if (invitations.some((inv: Invitation) => inv.email === email)) {
      form.setFieldMeta("email", meta => ({
        ...meta,
        isTouched: true,
        isBlurred: true,
        isValid: false,
        errors: ["Email already added"],
      }));
      return;
    }

    const newInvitation: Invitation = {
      id: crypto.randomUUID(),
      email,
      role,
    };

    form.setFieldValue("invitations", [...invitations, newInvitation]);
    form.setFieldValue("email", "");
    form.setFieldMeta("email", meta => ({
      ...meta,
      isValid: true,
      errors: [],
    }));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <TechStepHeader
        title="Invite Members"
        description="Invite your team members to collaborate."
      />
      <div className="space-y-4">
        <div className="flex gap-2">
          <form.AppField
            name="email"
            validators={{
              onBlur: ({ value }) => {
                if (!value) return undefined;
                const result = z.string().email().safeParse(value);
                return result.success ? undefined : "Please enter a valid email address";
              },
            }}
          >
            {field => (
              <Field className="flex-1">
                <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                <FieldControl
                  render={
                    <Input
                      size="sm"
                      id="invite-email"
                      name={field.name}
                      type="email"
                      placeholder="colleague@company.com"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddInvitation();
                        }
                      }}
                      disabled={isBusy}
                    />
                  }
                />
                {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                  <FieldError role="alert">{formatFieldErrors(field.state.meta.errors)}</FieldError>
                )}
              </Field>
            )}
          </form.AppField>

          <form.AppField name="role">
            {field => {
              const roleValue = field.state.value ?? "member";
              const roleLabels: Record<"member" | "admin", string> = {
                member: "Member",
                admin: "Admin",
              };

              return (
                <Field>
                  <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                  <Select
                    value={roleValue}
                    onValueChange={v => {
                      if (v === "member" || v === "admin") {
                        field.handleChange(v);
                      }
                    }}
                    disabled={isBusy}
                  >
                    <SelectTrigger id="invite-role" size="sm">
                      <SelectValue placeholder="Role">{roleLabels[roleValue]}</SelectValue>
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectPopup>
                  </Select>
                </Field>
              );
            }}
          </form.AppField>

          <div className="flex items-end">
            <form.Subscribe selector={state => state.values.email}>
              {email => (
                <ButtonTech
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleAddInvitation}
                  disabled={isBusy || !email?.trim()}
                  className="h-9"
                >
                  <Plus className="size-4" />
                </ButtonTech>
              )}
            </form.Subscribe>
          </div>
        </div>

        <form.Field name="invitations" mode="array">
          {invitationsField => (
            <>
              {invitationsField.state.value.length > 0 && (
                <div className="space-y-2 my-10">
                  <p className="text-xs text-muted-foreground font-mono uppercase">
                    Pending ({invitationsField.state.value.length})
                  </p>
                  <div className="space-y-1">
                    {invitationsField.state.value.map((inv, index) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/20 border border-border/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{inv.email}</span>
                          <span className="text-xs text-muted-foreground font-mono uppercase">
                            {inv.role}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => invitationsField.removeValue(index)}
                          disabled={isBusy}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </form.Field>

        <form.Subscribe
          selector={state => ({
            isSubmitting: state.isSubmitting,
            invitations: state.values.invitations,
          })}
        >
          {({ isSubmitting, invitations }) => {
            const submitLabel =
              invitations.length > 0 ? `Send (${invitations.length})` : "Continue";
            return (
              <div className="flex gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSkip}
                  disabled={isBusy || isSubmitting}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => form.handleSubmit()}
                  disabled={isBusy || isSubmitting}
                  className="flex-1"
                >
                  {isBusy || isSubmitting ? <Spinner className="size-4" /> : submitLabel}
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </div>
    </div>
  );
}

export type { InviteStepProps };
