import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import placeholder from "@/common/assets/img/placeholder.png";
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  address: string;
}
interface UserStore {
  user: User;
  updateProfile: (data: Partial<User>) => void;
}
const UserContext = createContext<UserStore | null>(null);
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({
    id: 1,
    name: "Иван Иванов",
    email: "ivan@example.com",
    avatar: placeholder,
    phone: "+7 (999) 123-45-67",
    address: "г. Москва, ул. Примерная, д. 1",
  });
  const store = useMemo<UserStore>(
    () => ({ user, updateProfile: (data) => setUser((current) => ({ ...current, ...data })) }),
    [user],
  );
  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
}
export function useUserStore() {
  const store = useContext(UserContext);
  if (!store) throw new Error("useUserStore must be used within UserProvider");
  return store;
}
