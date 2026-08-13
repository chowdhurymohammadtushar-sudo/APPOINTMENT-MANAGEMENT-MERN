import {
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBan,
  FaRegCheckCircle,
} from "react-icons/fa";

export default function StatusBadge({ status }) {
  const s = status?.toLowerCase();

  let className = "status-pill status-pending";
  let icon = <FaHourglassHalf />;

  if (s === "completed") {
    className = "status-pill status-completed";
    icon = <FaCheckCircle />;
  } else if (s === "rejected") {
    className = "status-pill status-rejected";
    icon = <FaTimesCircle />;
  } else if (s === "no-show") {
    className = "status-pill status-no-show";
    icon = <FaBan />;
  } else if (s === "cancelled") {
    className = "status-pill status-cancelled";
    icon = <FaTimesCircle />;
  } else if (s === "confirmed") {
    className = "status-pill status-confirmed";
    icon = <FaRegCheckCircle />;
  }

  return (
    <span className={className}>
      <span className="status-icon">{icon}</span>
      <span className="status-text">{status}</span>
    </span>
  );
}