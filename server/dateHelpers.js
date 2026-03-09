/* This function adds a number of days to a date. */
export function addDays(dateValue, daysToAdd) {
  const newDate = new Date(dateValue);
  newDate.setDate(newDate.getDate() + daysToAdd);
  return newDate;
}

/* This function changes a date to YYYY-MM-DD format. */
export function formatDateOnly(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}