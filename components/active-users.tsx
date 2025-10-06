"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ActiveUsers() {
  const { activeUsers, currentProject } = useAppStore();

  if (!currentProject || activeUsers.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          👥 Active Users
          <Badge variant="secondary" className="text-xs">
            {activeUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {activeUsers.map((user, index) => (
            <ActiveUserBadge key={user.userId} user={user} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveUserBadge({
  user,
}: {
  user: {
    userId: string;
    clientId: string;
    joinedAt: number;
  };
}) {
  // Generate a consistent color based on user ID
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-yellow-100 text-yellow-800 border-yellow-200",
    "bg-red-100 text-red-800 border-red-200",
  ];

  const colorIndex =
    user.userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  const colorClass = colors[colorIndex];

  // Generate initials from user ID (fallback since we don't have names)
  const initials = user.userId.slice(-2).toUpperCase();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${colorClass}`}
    >
      <div
        className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
        title="Online"
      />
      <span className="font-mono">{initials}</span>
    </div>
  );
}
