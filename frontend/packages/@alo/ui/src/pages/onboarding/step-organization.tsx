"use client";

import { Button } from "../../components/base/button";
import { Field, FieldControl, FieldError, FieldLabel } from "../../components/base/field";
import { Input } from "../../components/base/input";
import { Spinner } from "../../components/base/spinner";
import { TechStepHeader } from "../../components/tech/tech-step-header";
import { useAppForm } from "@oxlayer/shared-ui/hooks/use-app-form";
import { formatFieldErrors } from "@oxlayer/shared-ui/lib";
import { cn } from "@oxlayer/shared-ui/lib";
import { organizationSchema, type OrganizationFormData } from "./schemas";

interface OrganizationStepProps {
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  defaultValues?: Partial<OrganizationFormData>;
}

export function OrganizationStep({
  onSubmit,
  isLoading,
  className,
  defaultValues,
}: OrganizationStepProps) {
  const form = useAppForm({
    defaultValues: {
      name: defaultValues?.name ?? "",
    },
    validators: {
      onChange: organizationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      <form
        onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <TechStepHeader
          title="Organization Details"
          description="Set up your organization profile."
        />
        <form.AppField name="name">
          {field => (
            <Field>
              <FieldLabel htmlFor="org-name">Name</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="org-name"
                    name={field.name}
                    type="text"
                    placeholder="Acme Inc"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isLoading}
                    required
                  />
                }
              />
              {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                <FieldError role="alert">{formatFieldErrors(field.state.meta.errors)}</FieldError>
              )}
            </Field>
          )}
        </form.AppField>

        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <Button
              variant="outline"
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full mt-6"
            >
              {isLoading || isSubmitting ? <Spinner className="size-4" /> : "Continue"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

export type { OrganizationStepProps };
