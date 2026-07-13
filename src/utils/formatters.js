import dayjs from "dayjs";

/**
 * Format a number as Bangladeshi Taka (৳)
 * Grouping is based on the Indian subcontinent layout (e.g. 1,00,000)
 */
export const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return "৳" + num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

/**
 * Format a date string using Day.js
 */
export const formatDate = (dateStr, formatPattern = "DD MMM YYYY, hh:mm A") => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format(formatPattern);
};

/**
 * Format date in short form (e.g. YYYY-MM-DD)
 */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  return dayjs(dateStr).format("YYYY-MM-DD");
};

/**
 * Get relative time (e.g. Today, Yesterday or date)
 */
export const getRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  const today = dayjs().startOf("day");
  const yesterday = dayjs().subtract(1, "day").startOf("day");
  
  if (d.isAfter(today)) {
    return "আজ, " + d.format("hh:mm A");
  } else if (d.isAfter(yesterday)) {
    return "গতকাল, " + d.format("hh:mm A");
  } else {
    return d.format("DD MMM, hh:mm A");
  }
};
