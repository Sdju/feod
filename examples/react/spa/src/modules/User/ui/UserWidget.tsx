import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user";
import "./UserWidget.scss";
export function UserWidget() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  return (
    <button className="user-widget" onClick={() => navigate("/profile")}>
      <span className="user-widget__avatar">
        <img src={user.avatar} alt={user.name} />
      </span>
      <span className="user-widget__name">{user.name}</span>
    </button>
  );
}
