"use client";

import Image from "next/image";
import { useState } from "react";
import MainButton from "@/common/ui/MainButton";
import { useUserStore, type User } from "../store/user";
import "./UserProfile.scss";
const fields = [
  { key: "name", label: "Имя", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Телефон", type: "tel", required: false },
  { key: "address", label: "Адрес", type: "textarea", required: false },
] as const;
export function UserProfile() {
  const { user, updateProfile } = useUserStore();
  const [isEditing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<User>(user);
  return (
    <div className="user-profile">
      <div className="user-profile__header">
        <Image src={user.avatar} alt={user.name} width={100} height={100} className="user-profile__avatar" />
        <h1 className="user-profile__title">{isEditing ? "Редактирование профиля" : "Профиль"}</h1>
      </div>
      <div className="user-profile__content">
        {isEditing ? (
          <form
            className="user-profile__form"
            onSubmit={(event) => {
              event.preventDefault();
              updateProfile(editedProfile);
              setEditing(false);
            }}
          >
            {fields.map((field) => (
              <div key={field.key} className="form-group">
                <label htmlFor={`profile-${field.key}`} className="form-group__label">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`profile-${field.key}`}
                    className="form-group__textarea"
                    value={editedProfile[field.key]}
                    onChange={(event) =>
                      setEditedProfile({ ...editedProfile, [field.key]: event.target.value })
                    }
                  />
                ) : (
                  <input
                    id={`profile-${field.key}`}
                    type={field.type}
                    required={field.required}
                    className="form-group__input"
                    value={editedProfile[field.key]}
                    onChange={(event) =>
                      setEditedProfile({ ...editedProfile, [field.key]: event.target.value })
                    }
                  />
                )}
              </div>
            ))}
            <div className="user-profile__actions">
              <MainButton type="submit">Сохранить</MainButton>
              <MainButton variant="secondary" onClick={() => setEditing(false)}>
                Отмена
              </MainButton>
            </div>
          </form>
        ) : (
          <div className="user-profile__info">
            {fields.map((field) => (
              <div key={field.key} className="info-group">
                <span className="info-group__label">{field.label}</span>
                <span className="info-group__value">{user[field.key]}</span>
              </div>
            ))}
            <div className="user-profile__actions">
              <MainButton
                onClick={() => {
                  setEditedProfile({ ...user });
                  setEditing(true);
                }}
              >
                Редактировать
              </MainButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
