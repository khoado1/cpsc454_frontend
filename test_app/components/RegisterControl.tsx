type RegisterControlProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
};

export function RegisterControl({ onSubmit }: RegisterControlProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">Register</h2>
        <p className="text-zinc-600 dark:text-zinc-400">Create an account and initialize encryption keys</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-2">
          <label htmlFor="register-username" className="text-sm font-medium text-black dark:text-zinc-50">
            Username
          </label>
          <input
            type="text"
            id="register-username"
            name="username"
            required
            className="px-4 py-2 rounded-lg border border-black/[.1] dark:border-white/[.1] bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Choose a username"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-password" className="text-sm font-medium text-black dark:text-zinc-50">
            Password
          </label>
          <input
            type="password"
            id="register-password"
            name="password"
            required
            className="px-4 py-2 rounded-lg border border-black/[.1] dark:border-white/[.1] bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Create a password"
          />
        </div>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-full border border-black/[.1] px-5 text-black dark:text-white font-medium transition-colors hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] mt-2"
        >
          Register and Setup Keys
        </button>
      </form>
    </>
  );
}
