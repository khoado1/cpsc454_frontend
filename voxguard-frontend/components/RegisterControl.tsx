import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";

type RegisterControlProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
};

export function RegisterControl({
  onSubmit,
  isSubmitting = false,
  isDisabled = false,
}: RegisterControlProps) {
  return (
    <>
      <SectionHeader
        title="Register"
        description="Create an account and initialize encryption keys"
        level="h2"
        align="center"
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <FormField label="Register username" htmlFor="register-username">
          <Input
            type="text"
            id="register-username"
            name="username"
            required
            placeholder="Choose a username"
          />
        </FormField>

        <FormField label="Register password" htmlFor="register-password">
          <Input
            type="password"
            id="register-password"
            name="password"
            required
            placeholder="Create a password"
          />
        </FormField>

        <Button
          type="submit"
          variant="secondary"
          disabled={isDisabled}
          fullWidth
          isLoading={isSubmitting}
          loadingText="Registering..."
          className="mt-2"
        >
          Register and Setup Keys
        </Button>
      </form>
    </>
  );
}
