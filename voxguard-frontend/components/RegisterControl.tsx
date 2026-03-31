import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";

type RegisterControlProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSubmitting?: boolean;
};

export function RegisterControl({ onSubmit, isSubmitting = false }: RegisterControlProps) {
  return (
    <>
      <SectionHeader
        title="Register"
        description="Create an account and initialize encryption keys"
        level="h2"
        align="center"
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <FormField label="Username" htmlFor="register-username">
          <Input
            type="text"
            id="register-username"
            name="username"
            required
            placeholder="Choose a username"
          />
        </FormField>

        <FormField label="Password" htmlFor="register-password">
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
