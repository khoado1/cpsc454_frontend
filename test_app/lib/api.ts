export async function login(username: string, password: string) {
  const response = await fetch("http://localhost:9001/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  const data = await response.json();
  // data = { access_token, token_type, expires_in }
  return data.access_token;
}