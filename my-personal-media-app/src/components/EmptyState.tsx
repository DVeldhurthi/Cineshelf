import { Film } from "lucide-react";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Film size={26} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
