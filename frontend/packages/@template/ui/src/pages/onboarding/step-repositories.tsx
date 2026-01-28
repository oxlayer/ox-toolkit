"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@oxlayer/shared-ui";
import { Field, FieldControl, FieldError, FieldLabel } from "@oxlayer/shared-ui";
import { Input } from "@oxlayer/shared-ui";
import { Spinner } from "@oxlayer/shared-ui";
import { TechStepHeader } from "../../components/tech/tech-step-header";
import { useAppForm } from "@oxlayer/shared-ui";
import { formatFieldErrors } from "@oxlayer/shared-ui/lib";
import { cn } from "@oxlayer/shared-ui/lib";
import { type Repository } from "./schemas";

interface RepositoriesStepProps {
  onSubmit: (repositories: Repository[]) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  className?: string;
  defaultValues?: Repository[];
  renderPathInput?: (props: {
    id: string;
    index: number;
    value: string;
    onChange: (value: string) => void;
    onNameChange: (name: string) => void;
    disabled?: boolean;
  }) => ReactNode;
}

function createEmptyRepository(): Repository {
  return { id: crypto.randomUUID(), path: "", name: "" };
}

export function RepositoriesStep({
  onSubmit,
  onSkip,
  isLoading,
  className,
  defaultValues,
  renderPathInput,
}: RepositoriesStepProps) {
  const form = useAppForm({
    defaultValues: {
      repositories: defaultValues?.length ? defaultValues : [createEmptyRepository()],
    },
    onSubmit: async ({ value }) => {
      const validRepos = value.repositories.filter(r => r.path && r.name);
      await onSubmit(validRepos);
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
          title="Repositories Config"
          description="Add the repositories you want to include in your workspace."
        />

        <form.Field name="repositories" mode="array">
          {reposField => (
            <div className="space-y-4 mb-8">
              {reposField.state.value.map((repo, index) => (
                <div key={repo.id} className="p-3 rounded-md border border-border/40 bg-muted/10">
                  <div className="flex-1 space-y-6 p-1">
                    <form.AppField name={`repositories[${index}].path`}>
                      {field => (
                        <Field>
                          <FieldLabel htmlFor={`repo-path-${repo.id}`}>Path</FieldLabel>
                          {renderPathInput ? (
                            renderPathInput({
                              id: repo.id,
                              index,
                              value: field.state.value,
                              onChange: value => field.handleChange(value),
                              onNameChange: name => {
                                const currentName = form.getFieldValue(
                                  `repositories[${index}].name`
                                );
                                if (!currentName) {
                                  form.setFieldValue(`repositories[${index}].name`, name);
                                }
                              },
                              disabled: isLoading ?? false,
                            })
                          ) : (
                            <FieldControl
                              render={
                                <Input
                                  id={`repo-path-${repo.id}`}
                                  name={field.name}
                                  type="text"
                                  placeholder="/path/to/repository"
                                  value={field.state.value}
                                  onChange={e => field.handleChange(e.target.value)}
                                  onBlur={field.handleBlur}
                                  disabled={isLoading}
                                />
                              }
                            />
                          )}
                          {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                            <FieldError role="alert">
                              {formatFieldErrors(field.state.meta.errors)}
                            </FieldError>
                          )}
                        </Field>
                      )}
                    </form.AppField>

                    <form.AppField name={`repositories[${index}].name`}>
                      {field => (
                        <Field>
                          <FieldLabel htmlFor={`repo-name-${repo.id}`}>Name</FieldLabel>
                          <FieldControl
                            render={
                              <div className="flex gap-4 w-full">
                                <Input
                                  id={`repo-name-${repo.id}`}
                                  name={field.name}
                                  type="text"
                                  className="flex-1"
                                  placeholder="my-project"
                                  value={field.state.value}
                                  onChange={e => field.handleChange(e.target.value)}
                                  onBlur={field.handleBlur}
                                  disabled={isLoading}
                                />
                                {reposField.state.value.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => reposField.removeValue(index)}
                                    disabled={isLoading}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                )}
                              </div>
                            }
                          />
                          {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                            <FieldError role="alert">
                              {formatFieldErrors(field.state.meta.errors)}
                            </FieldError>
                          )}
                        </Field>
                      )}
                    </form.AppField>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                onClick={() => reposField.pushValue(createEmptyRepository())}
                disabled={isLoading}
                className="w-full"
              >
                <Plus className="size-4 mr-2" />
                Add Repository
              </Button>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={isLoading || isSubmitting}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isLoading || isSubmitting}
                className="flex-1"
              >
                {isLoading || isSubmitting ? <Spinner className="size-4" /> : "Continue"}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

export type { RepositoriesStepProps };
