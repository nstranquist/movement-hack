export interface Bounty {
  id: number;
  creator: string;
  title: string;
  description: string;
  bounty_amount: number; // in octas
  status: number;
  hunter: string;
  submission_note: string;
  created_at: number;
}

export interface AgentConfig {
  agentAddress: string;
  maxClaimAmount: number; // in octas
  totalEscrowed: number;  // in octas
}

export const STATUS = {
  OPEN: 0,
  CLAIMED: 1,
  SUBMITTED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export const STATUS_LABEL: Record<number, string> = {
  0: "Open",
  1: "Claimed",
  2: "Submitted",
  3: "Completed",
  4: "Cancelled",
};

export const STATUS_COLOR: Record<number, string> = {
  0: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  1: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  3: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  4: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};
