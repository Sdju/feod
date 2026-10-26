"use client";

import Image from "next/image";
import Link from "next/link";
import { useUserStore } from "../store/user";
import "./UserWidget.scss";
export function UserWidget() {
  const { user } = useUserStore();
  return (
    <Link className="user-widget" href="/profile" aria-label={`Открыть профиль: ${user.name}`}>
      <span className="user-widget__avatar">
        <Image src={user.avatar} alt={user.name} width={32} height={32} />
      </span>
      <span className="user-widget__name">{user.name}</span>
    </Link>
  );
}
