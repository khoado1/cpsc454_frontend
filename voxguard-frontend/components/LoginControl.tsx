import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";

type LoginControlProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
};

export function LoginControl({
  onSubmit,
  isSubmitting = false,
  isDisabled = false,
}: LoginControlProps) {
  return (
    <>
      <SectionHeader
        title="Login"
        description="Enter your credentials to continue"
        level="h1"
        align="center"
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <FormField label="Username" htmlFor="username">
          <Input
            type="text"
            id="username"
            name="username"
            required
            placeholder="Enter your username"
          />
        </FormField>

        <FormField label="Password" htmlFor="password">
          <Input
            type="password"
            id="password"
            name="password"
            required
            placeholder="Enter your password"
          />
        </FormField>

        <Button
          type="submit"
          disabled={isDisabled}
          fullWidth
          isLoading={isSubmitting}
          loadingText="Logging in..."
          className="mt-4"
        >
          Login
        </Button>
      </form>
    </>
  );
}
