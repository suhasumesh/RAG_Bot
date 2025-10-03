// utils/user
// export function setUserId() {
//   if (!localStorage.getItem("userId")) {
//     const userId = crypto.randomUUID();
//     localStorage.setItem("userId", userId);
//     return userId;
//   }
//   return localStorage.getItem("userId")!;
// }

export function getUserId(): string {
  if (typeof window === "undefined") return null; // server-side check
  return localStorage.getItem("userId");
  // const userId = localStorage.getItem("userId");
  // if (!userId) throw new Error("User ID not set. Call setUserId() first.");
  // if (!userId) "";
  // return userId;
}
