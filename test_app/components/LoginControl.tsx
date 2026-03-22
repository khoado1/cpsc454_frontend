type LoginControlProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
};

export function LoginControl({ onSubmit }: LoginControlProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">Login</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Enter your credentials to continue</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-sm font-medium text-black dark:text-zinc-50">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="px-4 py-2 rounded-lg border border-black/[.1] dark:border-white/[.1] bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-black dark:text-zinc-50">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="px-4 py-2 rounded-lg border border-black/[.1] dark:border-white/[.1] bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] mt-4"
        >
          Login
        </button>
      </form>
    </>
  );
}
