import { avatarInitials, avatarColor } from "@/lib/utils";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };

export function Avatar({ username, avatarUrl, size = "md" }: AvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className={`${sizes[size]} rounded-full object-cover ring-1 ring-gold/30`} />;
  }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-heading font-bold ring-1 ring-gold/20 flex-shrink-0`}
      style={{ backgroundColor: avatarColor(username), color: "#0a0a14" }}
    >
      {avatarInitials(username)}
    </div>
  );
}
