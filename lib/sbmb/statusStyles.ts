export type StatusValue = "완료" | "진행 중" | "대기 중" | "예정";

export function getStatusStyle(status: string) {
  const map: Record<
    StatusValue,
    { dot: string; bg: string; text: string }
  > = {
    완료: { dot: "#8FD8C7", bg: "#E1F5EE", text: "#085041" },
    "진행 중": { dot: "#FAC775", bg: "#FFF8E1", text: "#633806" },
    "대기 중": { dot: "#E5E7EB", bg: "#F5F5F5", text: "#9CA3AF" },
    예정: { dot: "#E5E7EB", bg: "#F5F5F5", text: "#9CA3AF" },
  };

  if (status in map) {
    return map[status as StatusValue];
  }

  if (status.includes("진행")) {
    return map["진행 중"];
  }
  if (status.includes("예정")) {
    return map["예정"];
  }
  if (status.includes("완료")) {
    return map["완료"];
  }
  if (status.includes("대기")) {
    return map["대기 중"];
  }

  return map["대기 중"];
}
